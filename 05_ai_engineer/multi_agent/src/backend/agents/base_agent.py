"""Base agent: shared retrieval & generation logic untuk semua sub-agent."""
from __future__ import annotations

import os
import re
from typing import Optional

import google.auth
from google.cloud import discoveryengine_v1 as discoveryengine
from openai import OpenAI


# --- Regex patterns (shared dari main.py lama) ---
FMEA_ID_RE = re.compile(r"FMEA-[A-Z]+-\d+", re.IGNORECASE)
ASSET_ID_RE = re.compile(r"AST-[A-Z]+-\d+", re.IGNORECASE)

GREETING_RE = re.compile(
    r"\b(?:bantu|bantuan|bisa apa|siapa kamu|siapa anda|halo|hai|hi|hello|help|"
    r"fungsi (?:kamu|anda|bot)|panduan penggunaan|selamat (?:pagi|siang|sore|malam))\b",
    re.IGNORECASE,
)
GREETING_MARKER = "SPECIAL_GREETING_CONTEXT"

FOLLOWUP_CUES = re.compile(
    r"\b(langkah|step|urutan|prosedur|penanganan|perbaikan|tindakan|dampak|efek|"
    r"pencegahan|rpn|department|departemen|nya|tersebut|itu|tadi|selanjutnya|lalu|kemudian)\b",
    re.IGNORECASE,
)

# --- Retrieval parameters ---
SEARCH_PAGE_SIZE = 10
DETAIL_PAGE_SIZE = 50
MAX_FMEA_IN_CONTEXT = 3
MAX_FMEA_FOR_ASSET = 6
CONTEXT_SKIP_FIELDS = {"Graph_Context_Snippet"}


class BaseAgent:
    """
    Base class untuk semua sub-agent.
    Setiap sub-agent mewarisi retrieval & generation logic,
    tapi punya system prompt & data store sendiri.
    """

    def __init__(
        self,
        name: str,
        domain: str,
        description: str,
        data_store_ids: list,
        system_prompt: str,
        deepseek_client: OpenAI,
        project_id: str,
        location: str = "global",
        temperature: float = 0.0,
        max_context_chunks: int = 3,
    ):
        self.name = name
        self.domain = domain
        self.description = description
        self.data_store_ids = data_store_ids  # sudah difilter oleh RBAC
        self.system_prompt = system_prompt
        self.deepseek_client = deepseek_client
        self.project_id = project_id
        self.location = location
        self.temperature = temperature
        self.max_context_chunks = max_context_chunks

        # Init Discovery Engine client dengan quota project
        creds, _ = google.auth.default()
        if hasattr(creds, "with_quota_project") and project_id:
            creds = creds.with_quota_project(project_id)
        self.search_client = discoveryengine.SearchServiceClient(credentials=creds)

    # --- GREETING DETECTION ---
    def is_greeting(self, user_query: str) -> bool:
        if FMEA_ID_RE.search(user_query) or ASSET_ID_RE.search(user_query):
            return False
        return len(user_query.split()) <= 6 and bool(GREETING_RE.search(user_query))

    # --- QUERY REWRITING ---
    def extract_search_keywords(self, user_query: str) -> str:
        """Bersihkan kata bising tanpa merusak nomor seri mesin."""
        ids = FMEA_ID_RE.findall(user_query) + ASSET_ID_RE.findall(user_query)
        noise_pattern = r'\b(jika|kalau|apakah|suhu|suhunya|berapa|sesuai|standard|standar|normal|atau|tidak|bisa|tolong|cek|ada|terjadi|error)\b'
        value_pattern = r'\b\d+(\.\d+)?\s*(°C|C|bar|psi|rpm|volt|v|ampere|a|mm|cm)\b'
        cleaned = re.sub(noise_pattern, '', user_query, flags=re.IGNORECASE)
        cleaned = re.sub(value_pattern, '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'[?\.,!]', ' ', cleaned)
        cleaned = " ".join(cleaned.split())
        for i in ids:
            if i.lower() not in cleaned.lower():
                cleaned = f"{cleaned} {i}".strip()
        return cleaned if len(cleaned) >= 3 else user_query

    # --- SEARCH RESULT PARSING ---
    def _struct_to_row(self, struct_data) -> dict:
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

    def pick_target_fmea_ids(self, rows: list, user_query: str) -> list:
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
            keep = ranked[:self.max_context_chunks]
        extra = [f for f in sorted(req_f) if f not in keep]
        return keep + extra

    def format_context(self, rows: list, free_texts: list, target_ids: list) -> str:
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

    # --- DATA STORE SEARCH ---
    def _resolve_serving_config(self, target_id: str) -> str:
        if target_id.startswith("projects/") or "search-app" in target_id or "engine" in target_id:
            if not target_id.startswith("projects/"):
                return f"projects/{self.project_id}/locations/{self.location}/collections/default_collection/engines/{target_id}/servingConfigs/default_config"
            return f"{target_id}/servingConfigs/default_config"
        return self.search_client.serving_config_path(
            project=self.project_id,
            location=self.location,
            data_store=target_id,
            serving_config="default_config",
        )

    def _search(self, serving_config: str, query: str, page_size: int):
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
            return self.search_client.search(request)
        except Exception:
            request = discoveryengine.SearchRequest(
                serving_config=serving_config,
                query=query,
                page_size=page_size,
            )
            return self.search_client.search(request)

    def _collect_result(self, result, rows: list, free_texts: list, only_fmea: str = None):
        struct_data = dict(result.document.struct_data) if result.document.struct_data else {}
        derived_data = dict(result.document.derived_struct_data) if result.document.derived_struct_data else {}

        if struct_data:
            row = self._struct_to_row(struct_data)
            if only_fmea and row["fmea_id"] != only_fmea:
                return
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

    def query_data_store(self, user_query: str) -> str:
        """Search ke semua data store yang diizinkan untuk agent ini."""
        if self.is_greeting(user_query):
            return GREETING_MARKER

        search_keywords = self.extract_search_keywords(user_query)
        all_rows, all_free_texts, all_targets = [], [], []

        for target_id in self.data_store_ids:
            try:
                serving_config = self._resolve_serving_config(target_id)
                store_rows, store_free = [], []
                for result in self._search(serving_config, search_keywords, SEARCH_PAGE_SIZE).results:
                    self._collect_result(result, store_rows, store_free)

                targets = self.pick_target_fmea_ids(store_rows, user_query)
                for fid in targets:
                    for result in self._search(serving_config, fid, DETAIL_PAGE_SIZE).results:
                        self._collect_result(result, store_rows, store_free, only_fmea=fid)

                req_f = {m.upper() for m in FMEA_ID_RE.findall(user_query)}
                found_req = {r["fmea_id"] for r in store_rows if r["fmea_id"] in req_f}
                if found_req:
                    targets = [t for t in targets if t in found_req]

                target_set = set(targets)
                chosen = [r for r in store_rows if r["fmea_id"] in target_set]
                if not chosen:
                    chosen = store_rows[:self.max_context_chunks * 4]

                all_rows.extend(chosen)
                all_free_texts.extend(store_free)
                all_targets.extend(t for t in targets if t not in all_targets)
            except Exception as e:
                print(f"❌ Error Data Store ({target_id}) [{self.name}]: {e}")

        combined = self.format_context(all_rows, all_free_texts, all_targets)
        return combined if combined else "Tidak ada data relevan yang ditemukan."

    # --- FOLLOW-UP CONTEXT ---
    def find_last_reference(self, chat_history: list):
        for msg in reversed(chat_history):
            content = msg.get("content", "")
            fmea_match = FMEA_ID_RE.search(content)
            if fmea_match:
                return fmea_match.group(0).upper()
            asset_match = ASSET_ID_RE.search(content)
            if asset_match:
                return asset_match.group(0).upper()
        return None

    def build_search_query_with_context(self, user_query: str, chat_history: list) -> str:
        if FMEA_ID_RE.search(user_query) or ASSET_ID_RE.search(user_query):
            return user_query
        n_words = len(user_query.split())
        is_followup = n_words <= 5 or (n_words <= 12 and FOLLOWUP_CUES.search(user_query))
        if not is_followup:
            return user_query
        ref = self.find_last_reference(chat_history)
        if ref:
            return f"{ref} {user_query}"
        return user_query

    # --- GENERATION ---
    def generate(self, session_id: str, user_query: str, chat_history: list,
                 session_store) -> str:
        """
        Generate response untuk user_query.
        session_store: objek dengan get_session_history() & save_session_history().
        """
        original_query = user_query

        if self.is_greeting(user_query):
            search_query = user_query
        else:
            search_query = self.build_search_query_with_context(user_query, chat_history)

        retrieved_context = self.query_data_store(search_query)

        messages = [{"role": "system", "content": self.system_prompt}]
        for msg in chat_history:
            messages.append(msg)

        user_turn_content = f"""Konteks Data dari Database {self.domain}:
{retrieved_context}

Pertanyaan Pengguna:
{search_query}"""
        messages.append({"role": "user", "content": user_turn_content})

        response = self.deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            temperature=self.temperature,
            stream=False,
        )
        assistant_reply = response.choices[0].message.content

        session_store.save_session_history(session_id, search_query, assistant_reply)
        return assistant_reply
