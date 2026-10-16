"""
Monitoring untuk RAG FMEA Maintenance Bot.

Menyediakan tiga hal (tanpa dependensi eksternal tambahan):

1. **Structured logging** — pengganti `print()`. Bisa JSON (siap Cloud Logging)
   atau teks. Otomatis menyertakan `service`, `session_id`, `request_id`.
2. **In-process metrics** — latency, throughput, error rate, distribusi skor
   evaluasi, dan token usage. Ring buffer + counter per-request.
3. **Health check** — ping Firestore dengan cache TTL dan (opsional) cek
   konfigurasi Discovery Engine tanpa memanggil LLM.

Semua fungsi aman dipanggil dari thread lain (dipakai `asyncio.to_thread`).
"""
from __future__ import annotations

import json
import logging
import os
import statistics
import sys
import threading
import time
import uuid
from collections import defaultdict, deque
from contextlib import contextmanager
from typing import Any, Dict, Iterable, List, Optional

import config

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # pragma: no cover
        pass

# --- Logger -------------------------------------------------------------------
_LOGGER_NAME = "rag_fmea"
_configured = False
_lock = threading.RLock()


class _JsonFormatter(logging.Formatter):
    """Format log satu baris JSON agar mudah di-ingest Cloud Logging / Loki."""

    def format(self, record: logging.LogRecord) -> str:  # noqa: D102
        payload: Dict[str, Any] = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "service": config.SERVICE_NAME,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # extra fields (session_id, request_id, latency_ms, ...)
        for key, value in getattr(record, "extra_fields", {}).items():
            payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


class _TextFormatter(logging.Formatter):
    """Format teks ramah konsol: `2026-10-15 17:00:00 | INFO | [req=..] pesan`."""

    def format(self, record: logging.LogRecord) -> str:  # noqa: D102
        bits = [self.formatTime(record, "%Y-%m-%d %H:%M:%S"), f"{record.levelname:<7}"]
        request_id = getattr(record, "extra_fields", {}).get("request_id")
        if request_id:
            bits.append(f"[{request_id}]")
        line = " | ".join(bits) + " " + record.getMessage()
        extras = {
            k: v
            for k, v in getattr(record, "extra_fields", {}).items()
            if k != "request_id"
        }
        if extras:
            line += "  " + " ".join(f"{k}={v}" for k, v in extras.items())
        if record.exc_info:
            line += "\n" + self.formatException(record.exc_info)
        return line


def setup_logging(level: Optional[str] = None, fmt: Optional[str] = None) -> logging.Logger:
    """Konfigurasi root logger sekali saja (idempotent)."""
    global _configured

    level = (level or config.LOG_LEVEL).upper()
    fmt = (fmt or config.LOG_FORMAT).lower()

    with _lock:
        logger = logging.getLogger(_LOGGER_NAME)
        if _configured:
            return logger

        logger.setLevel(getattr(logging, level, logging.INFO))
        logger.propagate = False

        handler = logging.StreamHandler(stream=sys.stdout)
        handler.setFormatter(_JsonFormatter() if fmt == "json" else _TextFormatter())
        logger.addHandler(handler)

        if config.LOG_TO_FILE:
            try:
                file_handler = logging.FileHandler(config.LOG_TO_FILE, encoding="utf-8")
                file_handler.setFormatter(_JsonFormatter())
                logger.addHandler(file_handler)
            except OSError as exc:  # pragma: no cover
                logger.warning("Gagal menulis log ke file %s: %s", config.LOG_TO_FILE, exc)

        _configured = True
        return logger


def get_logger() -> logging.Logger:
    """Ambil logger terkonfigurasi (auto setup jika belum)."""
    if not _configured:
        setup_logging()
    return logging.getLogger(_LOGGER_NAME)


def log(level: str, message: str, **fields: Any) -> None:
    """Log dengan field terstruktur, mis. `log("INFO", "respons dibuat", latency_ms=812)`."""
    logger = get_logger()
    logger.log(
        getattr(logging, level.upper(), logging.INFO),
        message,
        extra={"extra_fields": fields},
    )


def new_request_id() -> str:
    """ID pendek untuk korelasi log satu request."""
    return uuid.uuid4().hex[:12]


# --- Metrics ------------------------------------------------------------------
class MetricsCollector:
    """Kumpulkan metrik runtime in-process.

    Ring buffer menyimpan detail `METRICS_WINDOW` request terakhir; counter
    kumulatif menyimpan total sejak proses hidup. Untuk jumlah request tinggi
    ring buffer cukup untuk p95/p99; untuk historis panjang, kirim log JSON
    ke Cloud Logging.
    """

    def __init__(self, window: int = 500) -> None:
        self._lock = threading.RLock()
        self._window: deque = deque(maxlen=max(50, window))
        self._total_requests = 0
        self._total_errors = 0
        self._by_source: Dict[str, int] = defaultdict(int)
        self._started_at = time.time()

    # -- pencatatan ----------------------------------------------------------
    def record_request(
        self,
        *,
        success: bool,
        latency_ms: float,
        source: str = "unknown",
        session_id: Optional[str] = None,
        request_id: Optional[str] = None,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        context_chars: Optional[int] = None,
        error: Optional[str] = None,
    ) -> None:
        with self._lock:
            self._total_requests += 1
            if not success:
                self._total_errors += 1
            self._by_source[source] += 1
            self._window.append(
                {
                    "ts": time.time(),
                    "success": success,
                    "latency_ms": round(float(latency_ms), 2),
                    "source": source,
                    "session_id": session_id,
                    "request_id": request_id,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "context_chars": context_chars,
                    "error": error,
                }
            )

    def record_eval_score(self, score: float) -> None:
        with self._lock:
            self._window.append({"ts": time.time(), "source": "eval", "eval_score": score})

    # -- pembacaan -----------------------------------------------------------
    @staticmethod
    def _percentile(sorted_values: List[float], pct: float) -> float:
        if not sorted_values:
            return 0.0
        k = (len(sorted_values) - 1) * pct
        floor = int(k)
        ceil = min(floor + 1, len(sorted_values) - 1)
        if floor == ceil:
            return sorted_values[floor]
        return sorted_values[floor] + (sorted_values[ceil] - sorted_values[floor]) * (k - floor)

    def snapshot(self, source: Optional[str] = None) -> Dict[str, Any]:
        """Ringkasan metrik. `source` untuk memfilter (bot / stress_test / eval)."""
        with self._lock:
            rows = [r for r in self._window if source is None or r.get("source") == source]
            latencies = sorted(
                r["latency_ms"] for r in rows if "latency_ms" in r and r.get("success", True)
            )
            fails = [r for r in rows if r.get("success") is False]
            eval_scores = [r["eval_score"] for r in rows if "eval_score" in r]
            prompt_tokens = sum(
                r.get("prompt_tokens") or 0 for r in rows if r.get("success", True)
            )
            completion_tokens = sum(
                r.get("completion_tokens") or 0 for r in rows if r.get("success", True)
            )
            uptime = time.time() - self._started_at

            return {
                "service": config.SERVICE_NAME,
                "uptime_seconds": round(uptime, 1),
                "window_size": len(self._window),
                "requests_in_window": len(rows),
                "total_requests": self._total_requests,
                "total_errors": self._total_errors,
                "error_rate_pct": round(
                    (len(fails) / len(rows) * 100) if rows else 0.0, 2
                ),
                "throughput_rps": round(len(rows) / uptime, 3) if uptime > 0 else 0.0,
                "latency_ms": {
                    "min": round(latencies[0], 2) if latencies else 0.0,
                    "p50": round(self._percentile(latencies, 0.50), 2),
                    "p90": round(self._percentile(latencies, 0.90), 2),
                    "p95": round(self._percentile(latencies, 0.95), 2),
                    "p99": round(self._percentile(latencies, 0.99), 2),
                    "max": round(latencies[-1], 2) if latencies else 0.0,
                    "mean": round(statistics.fmean(latencies), 2) if latencies else 0.0,
                    "stddev": round(statistics.pstdev(latencies), 2) if len(latencies) > 1 else 0.0,
                },
                "errors_in_window": len(fails),
                "eval_scores": {
                    "count": len(eval_scores),
                    "mean": round(statistics.fmean(eval_scores), 3) if eval_scores else 0.0,
                },
                "token_usage_in_window": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens,
                },
                "requests_by_source": dict(self._by_source),
            }

    def reset(self) -> None:
        with self._lock:
            self._window.clear()
            self._total_requests = 0
            self._total_errors = 0
            self._by_source.clear()
            self._started_at = time.time()


METRICS = MetricsCollector(window=config.METRICS_WINDOW)


@contextmanager
def timer():
    """Context manager pengukur waktu dalam milidetik.

    >>> with timer() as t:
    ...     do_work()
    >>> t.ms
    """
    class _T:
        ms: float = 0.0

    started = time.perf_counter()
    handle = _T()
    try:
        yield handle
    finally:
        handle.ms = (time.perf_counter() - started) * 1000.0


# --- Health check -------------------------------------------------------------
_health_cache: Dict[str, Any] = {"ts": 0.0, "payload": None}


def _ping_firestore(db: Any, timeout: float = 5.0) -> Dict[str, Any]:
    if db is None:
        return {"status": "unknown", "detail": "db belum diinisialisasi"}
    try:
        # Iterasi 1 dokumen ringan; koleksi boleh kosong.
        next(iter(db.collection("bot_maintenance_sessions").limit(1).stream(timeout=timeout)), None)
        return {"status": "ok"}
    except Exception as exc:  # noqa: BLE001 - health check harus tahan error apa pun
        return {"status": "down", "detail": str(exc)}


def health_snapshot(
    db: Any = None,
    *,
    force: bool = False,
    ttl: Optional[int] = None,
) -> Dict[str, Any]:
    """Ringkasan kesehatan sistem.

    `db` = klien Firestore (dipass dari main.py agar tidak import berat di sini).
    Hasil ping Firestore di-cache selama `HEALTHCHECK_TTL_SECONDS`.
    """
    ttl = config.HEALTHCHECK_TTL_SECONDS if ttl is None else ttl
    now = time.time()
    with _lock:
        cached = _health_cache["payload"]
        fresh = cached is not None and (now - _health_cache["ts"]) < ttl
        if fresh and not force:
            firestore_status = cached
        else:
            firestore_status = _ping_firestore(db)
            _health_cache["ts"] = now
            _health_cache["payload"] = firestore_status

    snapshot = METRICS.snapshot()
    degraded = firestore_status.get("status") == "down"
    return {
        "status": "degraded" if degraded else "ok",
        "checks": {
            "firestore": firestore_status,
            "logging": {"status": "ok", "level": config.LOG_LEVEL, "format": config.LOG_FORMAT},
        },
        "metrics": {
            "total_requests": snapshot["total_requests"],
            "total_errors": snapshot["total_errors"],
            "error_rate_pct": snapshot["error_rate_pct"],
            "latency_p95_ms": snapshot["latency_ms"]["p95"],
            "uptime_seconds": snapshot["uptime_seconds"],
        },
    }


def metrics_snapshot(source: Optional[str] = None) -> Dict[str, Any]:
    """Akses langsung ke METRICS.snapshot (kependekan)."""
    return METRICS.snapshot(source=source)


def log_metrics_summary(source: str = "unknown") -> Dict[str, Any]:
    """Log ringkasan metrik lalu kembalikan snapshot-nya."""
    snap = METRICS.snapshot(source=source)
    lat = snap["latency_ms"]
    log(
        "INFO",
        "ringkasan metrik",
        source=source,
        requests=snap["requests_in_window"],
        error_rate_pct=snap["error_rate_pct"],
        throughput_rps=snap["throughput_rps"],
        p50_ms=lat["p50"],
        p95_ms=lat["p95"],
        p99_ms=lat["p99"],
    )
    return snap


def format_metrics_text(snap: Dict[str, Any]) -> str:
    """Ringkas snapshot metrik jadi teks siap dikirim ke Discord."""
    lat = snap["latency_ms"]
    tokens = snap["token_usage_in_window"]
    return (
        f"**📊 Metrics — {snap['service']}**\n"
        f"• Uptime: `{snap['uptime_seconds']}s`\n"
        f"• Requests (window): `{snap['requests_in_window']}` | total: `{snap['total_requests']}`\n"
        f"• Error rate: `{snap['error_rate_pct']}%` ({snap['errors_in_window']} error)\n"
        f"• Throughput: `{snap['throughput_rps']} req/s`\n"
        f"• Latency (ms): p50 `{lat['p50']}` | p90 `{lat['p90']}` | p95 `{lat['p95']}` | "
        f"p99 `{lat['p99']}` | max `{lat['max']}`\n"
        f"• Tokens (window): prompt `{tokens['prompt_tokens']}` | completion "
        f"`{tokens['completion_tokens']}` | total `{tokens['total_tokens']}`\n"
        f"• Sumber: `{snap['requests_by_source']}`"
    )


def format_health_text(snap: Dict[str, Any]) -> str:
    """Ringkas health snapshot jadi teks siap dikirim ke Discord."""
    fs = snap["checks"]["firestore"]
    lines = [f"**🩺 Health — {snap['status'].upper()}**"]
    emoji = "✅" if fs.get("status") == "ok" else "❌"
    detail = f" — {fs['detail']}" if fs.get("detail") else ""
    lines.append(f"• Firestore: {emoji} `{fs.get('status')}`{detail}")
    lines.append(f"• Logging: `{snap['checks']['logging']['level']}` / `{snap['checks']['logging']['format']}`")
    m = snap["metrics"]
    lines.append(
        f"• Requests: `{m['total_requests']}` | errors: `{m['total_errors']}` "
        f"({m['error_rate_pct']}%) | p95: `{m['latency_p95_ms']}ms`"
    )
    return "\n".join(lines)
