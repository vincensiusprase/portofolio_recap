"""
Evaluasi otomatis RAG Maintenance Bot (LLM-as-a-Judge + cek keyword deterministik).

Contoh:
    python eval_rag.py                          # semua test
    python eval_rag.py --tag bq_flattened       # -> eval_results_bq_flattened.csv + eval_summary_bq_flattened.json
    python eval_rag.py --categories sequential_steps,single_step --limit 5
"""
import argparse
import json
import os
import re
import time
from collections import defaultdict

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI, APITimeoutError, APIConnectionError

from main import generate_maintenance_response, clear_session_history

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
JUDGE_MODEL = "deepseek-chat"

client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
    timeout=60.0,     # batas waktu per request (detik)
    max_retries=3,    # retry otomatis jika ada glitch jaringan
)

DEFAULT_OUTPUT_DIR = r"D:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea\public"

# Confusion matrix: positif = pertanyaan yang jawabannya ADA di database,
# negatif = pertanyaan yang HARUS ditolak. Kategori lain (greeting, alias_typo)
# dilaporkan per kategori saja supaya tidak mengaburkan precision/recall.
ANSWERABLE = {"direct_master", "asset_overview", "sequential_steps", "single_step", "contextual_followup"}
REFUSAL = {"out_of_domain"}

BASE_RULES = """Aturan penilaian:
- Terjemahan Indonesia<->Inggris, parafrase, format/urutan penyajian berbeda, dan informasi tambahan yang BENAR tidak dianggap salah.
- Salah jika ada ID, angka, atau langkah yang berbeda dari Ground Truth, langkah hilang/tertukar urutannya, atau data dicampur dari FMEA_ID lain.
- Skor: 5 = benar & lengkap, 4 = benar dengan kekurangan minor, 3 = sebagian benar, 2 = sebagian besar salah, 1 = salah/mengarang."""

RUBRICS = {
    "default": BASE_RULES + "\n- Bot yang menjawab 'data tidak ditemukan' padahal Ground Truth berisi datanya = salah (skor 1).",
    "out_of_domain": (
        "Ground Truth menyatakan data TIDAK ADA di database. Jawaban benar jika bot menyatakan data tidak ditemukan "
        "dan TIDAK mengarang jawaban atas pertanyaan tersebut (tidak memberi harga, nama, prosedur, atau angka yang tidak ada di data). "
        "Boleh menyebut ID/data lain yang tersedia asalkan jelas bukan jawaban untuk yang ditanyakan. "
        "Jika bot menjawab seolah-olah datanya ada, atau membahas string internal seperti SPECIAL_GREETING_CONTEXT sebagai pengganti jawaban, is_correct=false.\n"
        "Skor: 5 = menolak dengan tepat, 1 = mengarang jawaban."
    ),
    "greeting": (
        "Ini sapaan/bantuan umum. Jawaban benar jika ramah, menjelaskan kemampuan bot (FMEA, mode kegagalan, pencegahan, langkah perbaikan), "
        "dan TIDAK menyatakan 'data tidak ditemukan' serta tidak menyebut penanda internal seperti SPECIAL_GREETING_CONTEXT."
    ),
    "alias_typo": (
        "Asset ID yang ditanyakan tidak persis ada di database. Jawaban benar jika bot menyatakan ID tersebut tidak ditemukan/tidak persis ada "
        "DAN menyarankan atau mengonfirmasi mesin terdekat yang benar seperti pada Ground Truth. Menampilkan data mesin terdekat diperbolehkan "
        "selama jelas dinyatakan bahwa itu bukan ID yang ditanyakan. Salah jika bot menjawab seolah-olah ID itu ada tanpa catatan, "
        "atau hanya menolak tanpa menyarankan mesin yang benar."
    ),
}


# --------------------------------------------------------------------------- #
def normalize(text: str) -> str:
    text = re.sub(r"[^a-z0-9\s]", " ", str(text).lower())
    return " ".join(text.split())


def keyword_coverage(bot_response: str, must_contain):
    """Sinyal deterministik (non-LLM): proporsi teks kunci dari dataset yang muncul di jawaban bot."""
    if not must_contain:
        return None
    norm = normalize(bot_response)
    hits = sum(1 for k in must_contain if normalize(k) in norm)
    return round(hits / len(must_contain), 2)


def judge(test: dict, bot_response: str):
    category = test["category"]
    rubric = RUBRICS.get(category, RUBRICS["default"])
    prompt = f"""Kamu adalah Auditor AI untuk RAG Maintenance System (data FMEA).
Nilai apakah Jawaban Bot sesuai dengan Ground Truth menurut rubrik.

[Kategori]: {category}
[Rubrik]: {rubric}

[Pertanyaan User]: {test['question']}
[Ground Truth]: {test['ground_truth']}
[Jawaban Bot]: {bot_response}

Output WAJIB JSON:
{{"is_correct": true/false, "score": <integer 1-5>, "reason": "<alasan singkat>"}}"""

    last_err = None
    for _ in range(2):
        try:
            resp = client.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0,
            )
            res = json.loads(resp.choices[0].message.content)
            score = max(1, min(5, int(res.get("score", 1))))
            # is_correct dan skor harus konsisten (>=4 = lulus)
            is_correct = bool(res.get("is_correct", False)) and score >= 4
            return is_correct, score, str(res.get("reason", "Tidak ada alasan"))
        except (json.JSONDecodeError, ValueError, TypeError, KeyError) as e:
            last_err = e
            time.sleep(1.0)
    raise ValueError(f"Judge mengembalikan output tidak valid: {last_err}")


def signal_conflict(is_correct: bool, coverage):
    """Tandai kasus yang perlu dicek manual: judge LLM dan cek keyword tidak sepakat."""
    if coverage is None:
        return ""
    if is_correct and coverage < 0.5:
        return "judge=benar tapi keyword kurang"
    if (not is_correct) and coverage == 1.0:
        return "judge=salah tapi semua keyword ada"
    return ""


def load_tests(path, categories, limit):
    if not os.path.exists(path):
        raise FileNotFoundError(f"File '{path}' tidak ditemukan. Jalankan generate_test_dataset.py dulu.")
    with open(path, "r", encoding="utf-8") as f:
        tests = json.load(f)
    if categories:
        tests = [t for t in tests if t["category"] in categories]
    if limit:
        tests = tests[:limit]
    return tests


def compute_metrics(records):
    tp = sum(1 for r in records if r["Category"] in ANSWERABLE and r["Is_Correct"])
    fn = sum(1 for r in records if r["Category"] in ANSWERABLE and not r["Is_Correct"])
    tn = sum(1 for r in records if r["Category"] in REFUSAL and r["Is_Correct"])
    fp = sum(1 for r in records if r["Category"] in REFUSAL and not r["Is_Correct"])

    n_cm = tp + fn + tn + fp
    accuracy = (tp + tn) / n_cm if n_cm else 0.0
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    specificity = tn / (tn + fp) if (tn + fp) else 0.0

    per_cat = defaultdict(lambda: {"n": 0, "correct": 0, "score_sum": 0})
    for r in records:
        c = per_cat[r["Category"]]
        c["n"] += 1
        c["correct"] += int(r["Is_Correct"])
        c["score_sum"] += r["Score_1_to_5"]

    return {
        "executed": len(records),
        "overall_pass_rate": sum(r["Is_Correct"] for r in records) / len(records) if records else 0.0,
        "avg_score": sum(r["Score_1_to_5"] for r in records) / len(records) if records else 0.0,
        "confusion": {"TP": tp, "FN": fn, "TN": tn, "FP": fp},
        "accuracy": accuracy, "precision": precision, "recall": recall,
        "specificity": specificity, "f1": f1,
        "per_category": {
            k: {"n": v["n"], "pass_rate": v["correct"] / v["n"], "avg_score": v["score_sum"] / v["n"]}
            for k, v in per_cat.items()
        },
    }


def save_outputs(records, metrics, output_dir, tag):
    try:
        os.makedirs(output_dir, exist_ok=True)
    except OSError:
        output_dir = os.path.join(os.getcwd(), "eval_output")
        os.makedirs(output_dir, exist_ok=True)
    suffix = f"_{tag}" if tag else ""
    csv_path = os.path.join(output_dir, f"eval_results{suffix}.csv")
    json_path = os.path.join(output_dir, f"eval_summary{suffix}.json")
    pd.DataFrame(records).to_csv(csv_path, index=False, encoding="utf-8-sig")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)
    return csv_path, json_path


# --------------------------------------------------------------------------- #
def run_evaluation(args):
    tests = load_tests(args.dataset, args.categories, args.limit)
    run_id = time.strftime("%Y%m%d%H%M%S")
    records, errors = [], []

    print(f"🚀 Memulai Evaluasi Otomatis RAG Maintenance Bot ({len(tests)} Test Cases, run {run_id})...\n" + "=" * 60)

    for test in tests:
        t_id = test["id"]
        category = test["category"]
        prev_context = test.get("previous_context")
        # FIX: session unik per run + dibersihkan, supaya riwayat Firestore dari run
        # sebelumnya tidak bocor ke test ini.
        session_id = f"eval_{run_id}_{t_id}"

        try:
            clear_session_history(session_id)

            # 1. Simulasikan riwayat percakapan jika ada kontekstual follow-up
            if prev_context:
                generate_maintenance_response(session_id, prev_context)
                time.sleep(0.5)

            # 2. Dapatkan respons aktual dari RAG bot
            bot_response = generate_maintenance_response(session_id, test["question"]) or ""

            # 3. Penilaian: LLM judge + cek keyword deterministik
            is_correct, score, reason = judge(test, bot_response)
            coverage = keyword_coverage(bot_response, test.get("must_contain"))

            if category in ANSWERABLE:
                tag = "TP (True Positive)" if is_correct else "FN (False Negative)"
            elif category in REFUSAL:
                tag = "TN (True Negative)" if is_correct else "FP (False Positive / Hallucination)"
            else:
                tag = "PASS" if is_correct else "FAIL"

            records.append({
                "Test_ID": t_id,
                "Category": category,
                "Sub_Type": test.get("sub_type", "-"),
                "Question": test["question"],
                "Previous_Context": prev_context or "-",
                "Ground_Truth": test["ground_truth"],
                "Bot_Response": bot_response,
                "Is_Correct": is_correct,
                "Score_1_to_5": score,
                "Keyword_Coverage": coverage,
                "Signal_Conflict": signal_conflict(is_correct, coverage),
                "Bot_Said_Not_Found": "tidak ditemukan" in bot_response.lower(),
                "Matrix_Classification": tag,
                "Judge_Reason": reason,
            })
            print(f"Test #{t_id} [{category}] - Skor: {score}/5 | Correct: {is_correct} | Catatan: {reason}")

        except (APITimeoutError, APIConnectionError) as e:
            errors.append((t_id, f"Timeout/Koneksi: {e}"))
            print(f"⚠️ Test #{t_id} mengalami Timeout/Koneksi terputus: {e}. Melanjutkan ke tes berikutnya...")
            time.sleep(2.0)
            continue
        except Exception as e:
            errors.append((t_id, str(e)))
            print(f"❌ Test #{t_id} Error: {e}")
            time.sleep(1.0)
            continue
        finally:
            clear_session_history(session_id)

        time.sleep(1.0)  # jeda antar-tes agar aman dari rate limit

    if not records:
        print("❌ Tidak ada test case yang berhasil dieksekusi.")
        return

    m = compute_metrics(records)
    cm = m["confusion"]
    print("\n" + "=" * 60)
    print("📊 HASIL EVALUASI PERFORMA CHATBOT:")
    print(f"  • Total Executed Cases : {m['executed']} / {len(tests)}" + (f"  (error: {len(errors)})" if errors else ""))
    print(f"  • Overall Pass Rate    : {m['overall_pass_rate'] * 100:.2f}%")
    print(f"  • Rata-rata Skor       : {m['avg_score']:.2f} / 5.0")
    print(f"  --- Confusion Matrix (answerable vs refusal): TP={cm['TP']} FN={cm['FN']} TN={cm['TN']} FP={cm['FP']}")
    print(f"  • Accuracy             : {m['accuracy'] * 100:.2f}%")
    print(f"  • Precision            : {m['precision'] * 100:.2f}%")
    print(f"  • Recall               : {m['recall'] * 100:.2f}%")
    print(f"  • Specificity          : {m['specificity'] * 100:.2f}%")
    print(f"  • F1-Score             : {m['f1'] * 100:.2f}%")
    print("  --- Per kategori:")
    for cat, v in sorted(m["per_category"].items()):
        print(f"     {cat:<22} n={v['n']:<3} pass={v['pass_rate'] * 100:5.1f}%  skor={v['avg_score']:.2f}")
    conflicts = [r["Test_ID"] for r in records if r["Signal_Conflict"]]
    if conflicts:
        print(f"  ⚠️ Perlu cek manual (judge vs keyword tidak sepakat): {conflicts}")
    print("=" * 60)

    csv_path, json_path = save_outputs(records, m, args.output_dir, args.tag)
    print(f"\n✅ Hasil evaluasi disimpan di: {csv_path}\n✅ Ringkasan metrik: {json_path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Evaluasi RAG Maintenance Bot")
    ap.add_argument("--dataset", default="test_dataset.json")
    ap.add_argument("--tag", default="", help="label konfigurasi data store, mis. bq_flattened / gcs_2tables / bq_2tables")
    ap.add_argument("--categories", type=lambda s: [c.strip() for c in s.split(",") if c.strip()], default=None)
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--output-dir", default=os.getenv("EVAL_OUTPUT_DIR", DEFAULT_OUTPUT_DIR))
    run_evaluation(ap.parse_args())