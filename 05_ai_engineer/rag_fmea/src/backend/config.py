"""
Konfigurasi runtime bersama untuk RAG FMEA Maintenance Bot.

Modul ini sengaja tidak meng-import `discord`, Google Cloud, atau `openai`
sehingga bisa dipakai oleh main.py (bot), stress_test.py (load test),
monitoring.py, dan feedback.py tanpa efek samping.

Semua nilai default dipilih supaya sistem tetap jalan walaupun `.env`
belum diperbarui (backward compatible).
"""
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # pragma: no cover - dotenv opsional saat unit test
    pass


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def _env_int(name: str, default: int) -> int:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


# --- Monitoring ---------------------------------------------------------------
# Level log: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL = (os.getenv("LOG_LEVEL", "INFO") or "INFO").strip().upper()

# Format log: "json" (cocok untuk Cloud Logging / ingestion) atau "text" (ramah manusia)
LOG_FORMAT = (os.getenv("LOG_FORMAT", "text") or "text").strip().lower()

# Ukuran ring buffer metrik in-process (jumlah request terakhir yang disimpan)
METRICS_WINDOW = _env_int("METRICS_WINDOW", 500)

# Nama service untuk tagging log (muncul di structured log & dashboard)
SERVICE_NAME = (os.getenv("SERVICE_NAME", "rag-fmea-bot") or "rag-fmea-bot").strip()

# Kualitas log format: "json" -> Cloud Logging friendly
LOG_TO_FILE = (os.getenv("LOG_TO_FILE", "") or "").strip()

# --- Feature flags ------------------------------------------------------------
# Blokir /health, /metrics, /feedback-stats di Discord.
# Default False supaya tidak ada perilaku baru yang mengejutkan di production.
ENABLE_ADMIN_COMMANDS = _env_bool("ENABLE_ADMIN_COMMANDS", False)

# Filter pesan bot Discord yang memicu proses RAG (biaya API).
# Default False = tetap responsif seperti perilaku lama.
ENABLE_FEEDBACK_FILTER = _env_bool("ENABLE_FEEDBACK_FILTER", False)

# Kirim tombol feedback (👍/👎) pada setiap balasan bot.
ENABLE_FEEDBACK_BUTTONS = _env_bool("ENABLE_FEEDBACK_BUTTONS", True)

# Filter pesan bot yang dianggap "feedback-ish" (mis. "makasih", "salah ini")
# supaya tidak memicu panggilan LLM.
FEEDBACK_LIKE_RE = None  # diisi lazily di feedback.py

# Throttle health check Firestore (detik) supaya tidak spam koneksi.
HEALTHCHECK_TTL_SECONDS = _env_int("HEALTHCHECK_TTL_SECONDS", 30)
