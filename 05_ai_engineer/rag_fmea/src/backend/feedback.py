"""
Feedback system untuk RAG FMEA Maintenance Bot.

Teknisi dapat memberi 👍 / 👎 pada balasan bot melalui tombol Discord
atau command teks. Feedback disimpan di Firestore (collection
`bot_maintenance_feedback`) lengkap dengan pertanyaan, jawaban, dan
timestamp, sehingga bisa dipakai untuk memperbaiki prompt / test dataset.

Fallback tanpa Firestore: feedback ditulis ke file NDJSON lokal
(`feedback_fallback.ndjson`) supaya tidak hilang saat demo offline.
"""
from __future__ import annotations

import json
import os
import re
import threading
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import config
from monitoring import get_logger, log

COLLECTION = "bot_maintenance_feedback"
FALLBACK_PATH = Path(__file__).with_name("feedback_fallback.ndjson")

VALID_RATINGS = {"up", "down"}

# Pesan yang jelas-jelas feedback, bukan pertanyaan teknis (dipakai untuk filter).
_FEEDBACK_LIKE_RE = re.compile(
    r"^\s*(?:makasih|terima\s*kasih|thanks|thank\s*you|thx|mantap|bagus|oke|ok|salah|"
    r"kurang\s*tepat|tidak\s*tepat|bukan\s*itu|ngawur|halu|halusinasi|"
    r"[👍👎])\s*[.!]?\s*$",
    re.IGNORECASE,
)

_lock = threading.RLock()
_fallback_logged = False


def is_feedback_like(text: str) -> bool:
    """True jika pesan lebih berupa komentar feedback daripada pertanyaan FMEA."""
    if not text:
        return False
    return bool(_FEEDBACK_LIKE_RE.match(text.strip()))


def _write_fallback(record: Dict[str, Any]) -> None:
    """Tulis ke NDJSON lokal bila Firestore tidak tersedia."""
    global _fallback_logged
    try:
        with FALLBACK_PATH.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
    except OSError as exc:  # pragma: no cover
        log("WARNING", "gagal menulis fallback feedback", error=str(exc))
        return
    if not _fallback_logged:
        log("WARNING", "menyimpan feedback ke file fallback lokal", path=str(FALLBACK_PATH))
        _fallback_logged = True


def store_feedback(
    db: Any,
    *,
    session_id: str,
    rating: str,
    user_id: Optional[str] = None,
    user_query: Optional[str] = None,
    bot_answer: Optional[str] = None,
    target_fmea_id: Optional[str] = None,
    note: Optional[str] = None,
    source: str = "discord",
) -> Dict[str, Any]:
    """Simpan satu feedback. Selalu sukses (fallback ke file bila Firestore gagal)."""
    rating = (rating or "").strip().lower()
    if rating in {"+1", "like", "good", "benar", "👍"}:
        rating = "up"
    elif rating in {"-1", "dislike", "bad", "salah", "👎"}:
        rating = "down"
    if rating not in VALID_RATINGS:
        raise ValueError(f"rating tidak valid: {rating!r} (harus 'up' atau 'down')")

    record: Dict[str, Any] = {
        "session_id": session_id,
        "rating": rating,
        "user_id": user_id,
        "user_query": user_query,
        "bot_answer": (bot_answer or "")[:4000],
        "target_fmea_id": target_fmea_id,
        "note": note,
        "source": source,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if db is None:
        _write_fallback(record)
        return record

    try:
        db.collection(COLLECTION).add(record)
        log("INFO", "feedback tersimpan", rating=rating, session_id=session_id, source=source)
    except Exception as exc:  # noqa: BLE001 - jangan sampai feedback menjatuhkan bot
        log("WARNING", "gagal menyimpan feedback ke Firestore", error=str(exc))
        _write_fallback(record)
    return record


def _read_fallback() -> List[Dict[str, Any]]:
    if not FALLBACK_PATH.exists():
        return []
    rows: List[Dict[str, Any]] = []
    try:
        for line in FALLBACK_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    except OSError:
        return []
    return rows


def get_feedback_stats(db: Any, limit: int = 500) -> Dict[str, Any]:
    """Agregasi feedback: total, 👍/👎, satisfaction rate, dan sesi terburuk.

    Jika `db` None / gagal, statistik dibaca dari file fallback lokal.
    """
    rows: List[Dict[str, Any]] = []
    backend = "firestore"

    if db is not None:
        try:
            query = (
                db.collection(COLLECTION)
                .order_by("created_at", direction="DESCENDING")
                .limit(limit)
            )
            rows = [doc.to_dict() for doc in query.stream()]
        except Exception as exc:  # noqa: BLE001
            log("WARNING", "gagal membaca feedback dari Firestore, pakai fallback", error=str(exc))
            rows, backend = _read_fallback(), "fallback_file"
    else:
        rows, backend = _read_fallback(), "fallback_file"

    if not rows and backend == "firestore":
        rows = _read_fallback()

    up = sum(1 for r in rows if r.get("rating") == "up")
    down = sum(1 for r in rows if r.get("rating") == "down")
    total = up + down

    by_session: Dict[str, Counter] = defaultdict(Counter)
    for row in rows:
        by_session[row.get("session_id") or "unknown"][row.get("rating")] += 1

    worst = sorted(
        (
            {
                "session_id": sid,
                "up": counts.get("up", 0),
                "down": counts.get("down", 0),
                "score": counts.get("up", 0) - counts.get("down", 0),
            }
            for sid, counts in by_session.items()
        ),
        key=lambda item: (item["score"], -item["down"]),
    )

    return {
        "backend": backend,
        "total": total,
        "up": up,
        "down": down,
        "satisfaction_pct": round((up / total * 100) if total else 0.0, 1),
        "sessions_with_feedback": len(by_session),
        "worst_sessions": worst[:5],
        "recent_negative": [r for r in rows if r.get("rating") == "down"][:5],
    }


def format_stats_text(stats: Dict[str, Any]) -> str:
    """Ringkas statistik feedback jadi teks siap dikirim ke Discord."""
    lines = [
        "**📝 Feedback — Ringkasan**",
        f"• Sumber data: `{stats['backend']}`",
        f"• Total feedback: `{stats['total']}` (👍 `{stats['up']}` / 👎 `{stats['down']}`)",
        f"• Satisfaction rate: `{stats['satisfaction_pct']}%`",
        f"• Sesi dengan feedback: `{stats['sessions_with_feedback']}`",
    ]
    worst = stats.get("worst_sessions") or []
    if worst:
        lines.append("• Sesi paling bermasalah:")
        for item in worst[:3]:
            if item["down"] > 0:
                lines.append(
                    f"  – `{item['session_id']}`: 👎 {item['down']} / 👍 {item['up']}"
                )
    return "\n".join(lines)
