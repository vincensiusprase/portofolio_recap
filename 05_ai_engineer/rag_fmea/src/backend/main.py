import asyncio
import os
import sys
import discord
import re
from dotenv import load_dotenv
import google.auth
from google.cloud import discoveryengine_v1 as discoveryengine
from google.cloud import firestore
from openai import OpenAI

# Pastikan output console Windows mendukung karakter UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
LOCATION = os.getenv("GCP_LOCATION", "global")
DATA_STORE_IDS = [ds.strip() for ds in os.getenv("DATA_STORE_ID", "").split(",") if ds.strip()]
DATA_STORE_LABELS = {
    "fmea-data_1789894369425": "Data FMEA"
}
ALLOWED_CHANNEL_NAME = os.getenv("ALLOWED_CHANNEL_NAME")
ALLOWED_CHANNEL_ID = os.getenv("ALLOWED_CHANNEL_ID")

MAX_HISTORY_MESSAGES = 6  # Ambil 6 pesan (3 turn) terakhir untuk menjaga batas token LLM

# --- Pola ID & sapaan ---------------------------------------------------------
FMEA_ID_RE = re.compile(r"FMEA-[A-Z]+-\d+", re.IGNORECASE)
ASSET_ID_RE = re.compile(r"AST-[A-Z]+-\d+", re.IGNORECASE)

# FIX: sebelumnya memakai `keyword in query` (substring), sehingga "hi" cocok dengan
# "shift", "machine", "chiller", dst. dan pertanyaan teknis salah dianggap sapaan.
GREETING_RE = re.compile(
    r"\b(?:bantu|bantuan|bisa apa|siapa kamu|siapa anda|halo|hai|hi|hello|help|"
    r"fungsi (?:kamu|anda|bot)|panduan penggunaan|selamat (?:pagi|siang|sore|malam))\b",
    re.IGNORECASE,
)
GREETING_MARKER = "SPECIAL_GREETING_CONTEXT"

# Kata petunjuk bahwa pertanyaan adalah lanjutan dari topik sebelumnya
FOLLOWUP_CUES = re.compile(
    r"\b(langkah|step|urutan|prosedur|penanganan|perbaikan|tindakan|dampak|efek|"
    r"pencegahan|rpn|department|departemen|nya|tersebut|itu|tadi|selanjutnya|lalu|kemudian)\b",
    re.IGNORECASE,
)

# --- Parameter retrieval ------------------------------------------------------
SEARCH_PAGE_SIZE = 10
DETAIL_PAGE_SIZE = 50
MAX_FMEA_IN_CONTEXT = 3    # jumlah FMEA maksimum di konteks bila tidak ada ID eksplisit
MAX_FMEA_FOR_ASSET = 6     # bila user menyebut Asset_ID (satu asset bisa punya beberapa FMEA)
# Kolom yang isinya hanya duplikat dari kolom lain (hemat token & kurangi noise)
CONTEXT_SKIP_FIELDS = {"Graph_Context_Snippet"}

# Inisialisasi Firestore DB untuk Persistent Session Memory (GCP Free Tier)
db = firestore.Client(project=PROJECT_ID)

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
    timeout=60.0,
    max_retries=2,
)

# Inisialisasi Search Client dengan Quota Project agar tidak error 403 (CONSUMER_INVALID)
creds, _ = google.auth.default()
if hasattr(creds, "with_quota_project") and PROJECT_ID:
    creds = creds.with_quota_project(PROJECT_ID)
search_client = discoveryengine.SearchServiceClient(credentials=creds)


# --- FIRESTORE SESSION MANAGEMENT ---
def get_session_history(session_id: str, limit: int = MAX_HISTORY_MESSAGES) -> list:
    """Mengambil riwayat percakapan dari Firestore secara terstruktur."""
    try:
        doc_ref = db.collection("bot_maintenance_sessions").document(session_id)
        doc = doc_ref.get()
        if doc.exists:
            messages = doc.to_dict().get("messages", [])
            return messages[-limit:]
    except Exception as e:
        print(f"⚠️ Error membaca Firestore history: {e}")
    return []

def save_session_history(session_id: str, user_query: str, assistant_reply: str):
    """Menyimpan turn percakapan baru ke Firestore."""
    try:
        doc_ref = db.collection("bot_maintenance_sessions").document(session_id)
        history = get_session_history(session_id, limit=10)

        history.append({"role": "user", "content": user_query})
        history.append({"role": "assistant", "content": assistant_reply})

        doc_ref.set({
            "messages": history[-MAX_HISTORY_MESSAGES:],
            "updated_at": firestore.SERVER_TIMESTAMP
        }, merge=True)
    except Exception as e:
        print(f"⚠️ Error menyimpan ke Firestore: {e}")

def clear_session_history(session_id: str):
    """Menghapus memori percakapan pada Firestore."""
    try:
        doc_ref = db.collection("bot_maintenance_sessions").document(session_id)
        doc_ref.delete()
    except Exception as e:
        print(f"⚠️ Error menghapus Firestore session: {e}")


# --- SAPAAN ---
def is_greeting(user_query: str) -> bool:
    """Sapaan/bantuan umum: pendek, cocok kata utuh, dan TIDAK menyebut ID mesin/FMEA."""
    if FMEA_ID_RE.search(user_query) or ASSET_ID_RE.search(user_query):
        return False
    return len(user_query.split()) <= 6 and bool(GREETING_RE.search(user_query))


# --- QUERY REWRITING (NOISE REDUCTION) ---
def extract_search_keywords(user_query: str) -> str:
    """
    Membersihkan kata-kata bising dari input teknisi tanpa merusak nomor seri mesin.
    """
    ids = FMEA_ID_RE.findall(user_query) + ASSET_ID_RE.findall(user_query)

    # Hapus hanya kata bising/kondisi, tetapi JAGA nomor seri mesin
    noise_pattern = r'\b(jika|kalau|apakah|suhu|suhunya|berapa|sesuai|standard|standar|normal|atau|tidak|bisa|tolong|cek|ada|terjadi|error)\b'

    # Hapus besaran satuan suhu/tekanan spesifik (misal: 150C, 150°C, 2 bar)
    value_pattern = r'\b\d+(\.\d+)?\s*(°C|C|bar|psi|rpm|volt|v|ampere|a|mm|cm)\b'

    cleaned = re.sub(noise_pattern, '', user_query, flags=re.IGNORECASE)
    cleaned = re.sub(value_pattern, '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'[?\.,!]', ' ', cleaned)
    cleaned = " ".join(cleaned.split())

    # Pastikan ID tidak ikut terhapus oleh pembersihan di atas
    for i in ids:
        if i.lower() not in cleaned.lower():
            cleaned = f"{cleaned} {i}".strip()

    return cleaned if len(cleaned) >= 3 else user_query


# --- HASIL PENCARIAN: parsing & seleksi (fungsi murni, mudah dites) ---
def _struct_to_row(struct_data) -> dict:
    data = dict(struct_data)
    items = [
        f"{k}: {v}" for k, v in data.items()
        if k not in CONTEXT_SKIP_FIELDS and v is not None and str(v).strip()
        and not str(v).startswith("#N/A")
    ]
    fmea = FMEA_ID_RE.search(str(data.get("FMEA_ID", "")))
    asset = ASSET_ID_RE.search(str(data.get("Asset_ID", "")))
    try:
        step = int(float(data.get("Step")))
    except (TypeError, ValueError):
        step = None
    return {
        "fmea_id": fmea.group(0).upper() if fmea else None,
        "asset_id": asset.group(0).upper() if asset else None,
        "step": step,
        "text": " | ".join(items),
    }


def pick_target_fmea_ids(rows: list, user_query: str) -> list:
    """
    Tentukan FMEA_ID mana yang layak masuk konteks.
    - ID FMEA/Asset eksplisit di pertanyaan -> hanya baris yang cocok.
    - Tanpa ID (mis. "botol seal bocor") -> 3 hasil teratas dari ranking search.
    - ID eksplisit yang tidak ada di hasil -> tetap dicoba di-fetch (extra), lalu
      LLM diberi kandidat terdekat agar bisa menjawab "tidak ditemukan / maksud Anda ...".
    """
    req_f = {m.upper() for m in FMEA_ID_RE.findall(user_query)}
    req_a = {m.upper() for m in ASSET_ID_RE.findall(user_query)}

    ranked, asset_of = [], {}
    for r in rows:
        fid = r["fmea_id"]
        if not fid:
            continue
        if fid not in ranked:
            ranked.append(fid)
        if r["asset_id"]:
            asset_of.setdefault(fid, r["asset_id"])

    keep = []
    if req_f or req_a:
        keep = [f for f in ranked if f in req_f or asset_of.get(f) in req_a][:MAX_FMEA_FOR_ASSET]
    if not keep:
        keep = ranked[:MAX_FMEA_IN_CONTEXT]

    extra = [f for f in sorted(req_f) if f not in keep]
    return keep + extra


def format_context(rows: list, free_texts: list, target_ids: list) -> str:
    order = {fid: i for i, fid in enumerate(target_ids)}
    rows = sorted(
        rows,
        key=lambda r: (order.get(r["fmea_id"], 99), r["step"] if r["step"] is not None else -1),
    )
    seen, parts = set(), []
    for text in [r["text"] for r in rows] + free_texts:
        if text and text not in seen:
            seen.add(text)
            parts.append(text)
    return "\n---\n".join(parts)


# --- PENCARIAN DATA STORE ---
def _resolve_serving_config(target_id: str) -> str:
    if target_id.startswith("projects/") or "search-app" in target_id or "engine" in target_id:
        if not target_id.startswith("projects/"):
            return f"projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{target_id}/servingConfigs/default_config"
        return f"{target_id}/servingConfigs/default_config"
    return search_client.serving_config_path(
        project=PROJECT_ID,
        location=LOCATION,
        data_store=target_id,
        serving_config="default_config",
    )


def _search(serving_config: str, query: str, page_size: int):
    """Search dengan snippet bila didukung, fallback ke request dasar."""
    try:
        content_spec = discoveryengine.SearchRequest.ContentSearchSpec(
            snippet_spec=discoveryengine.SearchRequest.ContentSearchSpec.SnippetSpec(return_snippet=True)
        )
        request = discoveryengine.SearchRequest(
            serving_config=serving_config,
            query=query,
            page_size=page_size,
            content_search_spec=content_spec,
        )
        return search_client.search(request)
    except Exception:
        request = discoveryengine.SearchRequest(
            serving_config=serving_config,
            query=query,
            page_size=page_size,
        )
        return search_client.search(request)


def _collect_result(result, rows: list, free_texts: list, only_fmea: str = None):
    struct_data = dict(result.document.struct_data) if result.document.struct_data else {}
    derived_data = dict(result.document.derived_struct_data) if result.document.derived_struct_data else {}

    if struct_data:
        row = _struct_to_row(struct_data)
        if only_fmea and row["fmea_id"] != only_fmea:
            return  # FIX: pencarian detail sebelumnya menarik baris FMEA lain (noise)
        if row["text"]:
            rows.append(row)
        return

    if only_fmea:
        return
    for seg in derived_data.get("extractive_segments", []):
        content = dict(seg).get("content")
        if content and content not in free_texts:
            free_texts.append(content)
    for snip in derived_data.get("snippets", []):
        snippet_text = dict(snip).get("snippet")
        if snippet_text and "No snippet is available" not in snippet_text and snippet_text not in free_texts:
            free_texts.append(snippet_text)


def query_data_store(user_query: str) -> str:
    # 1. Jika pertanyaan adalah sapaan/bantuan umum, lewati RAG
    if is_greeting(user_query):
        print("ℹ️ Pertanyaan sapaan/bantuan umum terdeteksi. Melewati RAG Data Store.")
        return GREETING_MARKER  # Penanda khusus untuk LLM

    search_keywords = extract_search_keywords(user_query)
    print(f"🔍 [1/3] Direct Search GCP dengan keywords: '{search_keywords}' (Raw Input: '{user_query}')")
    all_rows, all_free_texts, all_targets = [], [], []

    for target_id in DATA_STORE_IDS:
        try:
            print(f"   🔎 Searching target ID: '{target_id}'...")
            serving_config = _resolve_serving_config(target_id)

            store_rows, store_free = [], []
            for result in _search(serving_config, search_keywords, SEARCH_PAGE_SIZE).results:
                _collect_result(result, store_rows, store_free)

            # Baris CSV diindeks sebagai dokumen terpisah (mis. tiap Step = 1 dokumen), jadi
            # ambil semua baris milik FMEA terpilih -- tapi hanya baris FMEA itu saja.
            targets = pick_target_fmea_ids(store_rows, user_query)
            for fid in targets:
                for result in _search(serving_config, fid, DETAIL_PAGE_SIZE).results:
                    _collect_result(result, store_rows, store_free, only_fmea=fid)

            # Bila FMEA_ID yang diminta user benar-benar ditemukan, buang kandidat lain (noise).
            req_f = {m.upper() for m in FMEA_ID_RE.findall(user_query)}
            found_req = {r["fmea_id"] for r in store_rows if r["fmea_id"] in req_f}
            if found_req:
                targets = [t for t in targets if t in found_req]

            target_set = set(targets)
            chosen = [r for r in store_rows if r["fmea_id"] in target_set]
            if not chosen:  # data tanpa kolom FMEA_ID -> pakai apa adanya (dibatasi)
                chosen = store_rows[:MAX_FMEA_IN_CONTEXT * 4]

            all_rows.extend(chosen)
            all_free_texts.extend(store_free)
            all_targets.extend(t for t in targets if t not in all_targets)

        except Exception as e:
            print(f"❌ Error Data Store ({target_id}): {e}")

    combined_context = format_context(all_rows, all_free_texts, all_targets)
    n_chunks = combined_context.count("\n---\n") + 1 if combined_context else 0
    print(f"✅ Data Store selesai. Total {n_chunks} data baris/snippet didapatkan.")
    return combined_context if combined_context else "Tidak ada data relevan yang ditemukan."


# --- FOLLOW-UP CONTEXT ---
def find_last_reference(chat_history: list):
    """Cari FMEA_ID (prioritas) atau Asset_ID pada percakapan, dari pesan terbaru."""
    for msg in reversed(chat_history):
        content = msg.get("content", "")
        fmea_match = FMEA_ID_RE.search(content)
        if fmea_match:
            return fmea_match.group(0).upper()
        asset_match = ASSET_ID_RE.search(content)
        if asset_match:
            return asset_match.group(0).upper()
    return None


def build_search_query_with_context(user_query: str, chat_history: list) -> str:
    """
    Menggabungkan konteks percakapan sebelumnya jika pertanyaan pengguna
    berupa pertanyaan lanjutan (tanpa menyebutkan ID Mesin/FMEA).
    """
    if FMEA_ID_RE.search(user_query) or ASSET_ID_RE.search(user_query):
        return user_query

    n_words = len(user_query.split())
    # FIX: sebelumnya hanya <= 5 kata, sehingga "kalau sudah terjadi, apa langkah
    # penanganannya?" (7 kata) tidak dianggap lanjutan.
    is_followup = n_words <= 5 or (n_words <= 12 and FOLLOWUP_CUES.search(user_query))
    if not is_followup:
        return user_query

    ref = find_last_reference(chat_history)
    if ref:
        combined_query = f"{ref} {user_query}"
        print(f"🔄 Query Rewritten dengan Konteks: '{combined_query}'")
        return combined_query
    return user_query


def build_system_prompt(ds_list_str: str, original_query: str) -> str:
    return f"""Anda adalah asisten data maintenance yang cerdas dan konsultan teknis lapangan untuk industri FMCG.
Anda terhubung ke sumber data berikut: {ds_list_str}.

==================================================
ATURAN UTAMA PENANGANAN SAPAAN & BANTUAN UMUM
==================================================
1. JIKA PENGGUNA HANYA MENYAPA ATAU MENANYAKAN BANTUAN UMUM (seperti "halo", "apa yang bisa anda bantu?", "siapa kamu"):
   - Jawablah secara langsung dengan ramah, profesional, dan percaya diri.
   - JANGAN PERNAH mengatakan "Data tidak ditemukan di database" atau kalimat penolakan sejenis untuk sapaan umum.
   - Gunakan format Bullet Points (*) untuk menjelaskan capability/fitur utama Anda
     (pencarian FMEA, mode kegagalan & dampak, tindakan pencegahan, RPN, langkah perbaikan).
2. Jika Konteks Data berisi teks "{GREETING_MARKER}", itu hanya penanda internal bahwa pesan adalah sapaan.
   JANGAN PERNAH menyebut, mengutip, atau membahas penanda tersebut kepada pengguna.

==================================================
FORMATTING & TATA CARA MENJAWAB (VISUAL & LAYOUT)
==================================================
1. LAYOUT RAPI & SPASI SPACING:
   - Gunakan pemisah baris (double enter) antar poin atau kelompok informasi agar teks tidak menumpuk padat.
   - Gunakan huruf tebal (bold) pada kata kunci, nama komponen, nilai parameter, atau angka metrik penting.

2. STRUKTUR POIN (BULLET & NUMBERING):
   - Jika menjelaskan urutan langkah perbaikan, daftar komponen, atau mode kegagalan, WAJIB menggunakan format Bullet Points (*) atau Numbering (1, 2, 3).
   - Buat sub-bullet (indentasi) untuk rincian detail di bawah poin utama.

3. BAHASA JAWABAN:
   - Jawab menggunakan bahasa yang sama dengan bahasa utama pertanyaan pengguna.
   - Jika pengguna bertanya dalam Bahasa Indonesia, terjemahkan isi data sumber yang berbahasa Inggris ke Bahasa Indonesia secara akurat.
   - Pertahankan istilah teknis, nama komponen, mode mesin, FMEA_ID, Asset_ID, dan nilai numerik yang penting; sertakan teks asli (Inggris) dari data
     berdampingan dengan terjemahannya.

==================================================
LOGIKA ANALISIS DATA MAINTENANCE & FMEA
==================================================
1. PERHATIKAN HISTORI PERCAKAPAN & KONTEKS RELASIONAL:
   - Gunakan riwayat obrolan di atas untuk memahami kata ganti, FMEA_ID, atau topik lanjutan dari teknisi.
   - Jika pengguna menanyakan "berikan urutan langkahnya" atau pertanyaan lanjutan sejenis, hubungkan FMEA_ID/Asset_ID dari percakapan sebelumnya dengan data Repair Steps (Step 1 s/d selesai) secara runtut dan lengkap.

2. GUNAKAN BARIS YANG TEPAT:
   - Jawab hanya berdasarkan baris Konteks Data yang FMEA_ID / Asset_ID-nya sesuai dengan yang ditanyakan. Abaikan baris lain.
   - Sebutkan langkah perbaikan sesuai nomor urutnya (Step/Langkah 1 s/d terakhir) tanpa menghilangkan atau menukar langkah.
   - Jangan mencampur langkah, RPN, atau dampak dari FMEA_ID yang berbeda.

3. EVALUASI RENTANG PARAMETER (PENTING):
   - Jika pengguna menanyakan status parameter/suhu/tekanan (contoh: "apakah suhu 150C sesuai?"), cari standar parameternya di Konteks Data.
   - Bandingkan angka pengguna secara eksplisit dengan rentang standar di database.
   - Nyatakan secara tegas apakah nilai tersebut SESUAI, DI BAWAH STANDAR, atau DI ATAS STANDAR beserta sebutkan batas resminya.

4. BEBAS CERAMAH K3:
   - JANGAN menyertakan ceramah Prosedur Keselamatan/K3/LOTO KECUALI diminta secara eksplisit oleh pengguna.

==================================================
PENANGANAN DATA KOSONG (ANTI-HALUSINASI & GUARDRAILS)
==================================================
1. Jika pengguna menanyakan masalah teknis/komponen spesifik dan nama komponen/mesin/FMEA_ID tersebut benar-benar TIDAK ADA di Konteks Data maupun riwayat percakapan, jawab singkat dan sopan:
   "Data untuk '{original_query}' tidak ditemukan dalam database maintenance."
2. Jika Asset_ID atau FMEA_ID yang ditanyakan TIDAK PERSIS ada di Konteks Data tetapi ada ID yang sangat mirip (mis. singkatan/salah ketik),
   nyatakan lebih dulu bahwa ID yang ditanyakan tidak ditemukan, lalu tanyakan/sarankan ID terdekat dan boleh menampilkan datanya dengan jelas
   menyebut ID sebenarnya. JANGAN menjawab dengan data ID lain seolah-olah itu ID yang ditanyakan.
3. Jika Asset_ID ada tetapi failure mode yang ditanyakan tidak ada, nyatakan tidak ditemukan dan sebutkan failure mode yang tersedia untuk asset tersebut.
4. Dilarang mengarang Prosedur Perbaikan, harga, nama personel, atau angka standar parameter yang tidak tertera pada Konteks Data.
"""


def generate_maintenance_response(session_id: str, user_query: str) -> str:
    original_query = user_query

    # 1. Ambil history percakapan dari Firestore
    history = get_session_history(session_id, limit=MAX_HISTORY_MESSAGES)

    # 2. Lakukan pencarian RAG berbasis keyword yang sudah dibersihkan.
    #    Sapaan tidak boleh di-rewrite dengan ID lama (kalau tidak, sapaan dianggap pertanyaan teknis).
    if is_greeting(user_query):
        search_query = user_query
    else:
        search_query = build_search_query_with_context(user_query, history)
    retrieved_context = query_data_store(search_query)

    print("🤖 [2/3] Menyusun prompt evaluasi penalaran ke DeepSeek...")
    ds_labels = [DATA_STORE_LABELS.get(ds, ds) for ds in DATA_STORE_IDS]
    ds_list_str = ", ".join([f"'{label}'" for label in ds_labels])

    # Pesan penolakan memakai pertanyaan ASLI pengguna, bukan versi yang sudah di-rewrite
    system_prompt = build_system_prompt(ds_list_str, original_query)

    messages = [{"role": "system", "content": system_prompt}]

    # Sisipkan riwayat pesan dari Firestore
    for msg in history:
        messages.append(msg)

    # Sisipkan turn pengguna saat ini beserta retrieved_context
    user_turn_content = f"""Konteks Data dari Database Maintenance:
{retrieved_context}

Pertanyaan Pengguna:
{search_query}"""

    messages.append({"role": "user", "content": user_turn_content})

    response = deepseek_client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        temperature=0.0,  # deterministik -> hasil evaluasi antar-run bisa dibandingkan
        stream=False
    )

    assistant_reply = response.choices[0].message.content

    # 3. Simpan percakapan secara permanen ke Firestore DB
    #    (pertanyaan yang disimpan = versi ber-ID, supaya follow-up berantai tetap punya rujukan)
    save_session_history(session_id, search_query, assistant_reply)

    print("✅ Respon berhasil dibuat dan disimpan ke Firestore.")
    return assistant_reply


# Discord Bot Event
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'✅ Bot Konsultan Maintenance (RAG Enhanced + Firestore) aktif sebagai: {client.user}')
    target_channel = ALLOWED_CHANNEL_NAME or ALLOWED_CHANNEL_ID or "Semua Channel"
    print(f'🔒 Channel yang diizinkan: #{target_channel}')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    # 1. Cek apakah pesan berasal dari Direct Message (DM)
    is_dm = isinstance(message.channel, discord.DMChannel)

    # 2. Filter Channel Server: Jika BUKAN DM, periksa apakah berada di channel server yang diizinkan
    if not is_dm:
        channel_name = getattr(message.channel, "name", "")
        channel_id = str(message.channel.id)

        if ALLOWED_CHANNEL_ID and channel_id != str(ALLOWED_CHANNEL_ID):
            return

        if ALLOWED_CHANNEL_NAME and channel_name != ALLOWED_CHANNEL_NAME:
            return

    # 3. Cek apakah bot di-mention di server ATAU pesan dikirim via DM
    is_mentioned = client.user in message.mentions or any(role in message.role_mentions for role in message.guild.me.roles) if message.guild else True

    # Bot akan memproses jika itu DM ATAU jika di-mention di channel server yang diizinkan
    if is_dm or is_mentioned:
        print(f"🔔 [DEBUG EVENT] Pesan diterima dari '{message.author}' via {'DM' if is_dm else 'Channel Server'}: {message.content}")

        # Untuk Firestore Session ID:
        # Jika DM, gunakan Author ID (User ID); Jika Server Channel, gunakan Channel ID.
        session_id = str(message.author.id) if is_dm else str(message.channel.id)

        # Strip mention user <@id>, user nickname <@!id>, role <@&id>
        user_input = re.sub(r'<@[!&]?\d+>', '', message.content).strip()

        # Perintah khusus untuk membersihkan memori session
        if user_input.lower() in ["!reset", "!clear", "reset", "clear memory", "hapus memori"]:
            clear_session_history(session_id)
            await message.reply("🧹 Memori percakapan pada sesi ini telah dibersihkan dari Firestore database.")
            return

        if not user_input:
            await message.reply("Silakan ketik pertanyaan maintenance yang ingin Anda cari.")
            return

        async with message.channel.typing():
            try:
                answer = await asyncio.to_thread(generate_maintenance_response, session_id, user_input)
                await message.reply(answer)
            except Exception as e:
                print(f"❌ Error Handler: {e}")
                await message.reply(f"Terjadi kesalahan internal: {e}")

if __name__ == "__main__":
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        print("❌ Error: DISCORD_BOT_TOKEN belum diset di file .env")
    else:
        client.run(token)