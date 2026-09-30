"""
Discord Bot Entry Point — Multi-Agent + RBAC + Guardrails.

Bot ini sekarang menggunakan arsitektur multi-agent:
  - SupervisorAgent: router yang cek RBAC, rate limit, input/output filter, lalu delegasikan ke sub-agent.
  - Sub-agents (FMEA, HR, Finance, Production, Sales): masing-masing punya domain & data store sendiri.
  - RBAC: permission matrix berbasis Discord user ID / guild role.
  - Guardrails: input filter (prompt injection, PII, secret), output filter (PII redaction), rate limiter.
  - Audit log: semua request dicatat di Firestore.

Backward compatibility:
  - Fungsi generate_maintenance_response() & clear_session_history() tetap tersedia
    agar eval_rag.py lama tetap jalan (delegasi ke FMEA agent langsung).
"""
import asyncio
import os
import sys
import re

import discord
import yaml
from dotenv import load_dotenv
from google.cloud import firestore
from openai import OpenAI

# Pastikan output console Windows mendukung karakter UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()

# --- Config ---
PROJECT_ID = os.getenv("GCP_PROJECT_ID")
LOCATION = os.getenv("GCP_LOCATION", "global")
ALLOWED_CHANNEL_NAME = os.getenv("ALLOWED_CHANNEL_NAME")
ALLOWED_CHANNEL_ID = os.getenv("ALLOWED_CHANNEL_ID")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REGISTRY_PATH = os.path.join(BASE_DIR, "config", "agents_registry.yaml")
MATRIX_PATH = os.path.join(BASE_DIR, "config", "permission_matrix.yaml")

# --- Init clients ---
db = firestore.Client(project=PROJECT_ID)

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
    timeout=60.0,
    max_retries=2,
)

# --- Init session store, RBAC, guardrails, audit ---
from session_store import SessionStore
from auth.rbac import RBACMiddleware
from auth.role_store import RoleStore
from auth.audit import AuditLogger
from guardrails.input_filter import InputFilter
from guardrails.output_filter import OutputFilter
from guardrails.rate_limiter import RateLimiter
from agents.factory import build_all_agents
from agents.supervisor import SupervisorAgent

session_store = SessionStore(db)
role_store = RoleStore(db)
audit_logger = AuditLogger(db)
rbac = RBACMiddleware(role_store, REGISTRY_PATH, MATRIX_PATH)
input_filter = InputFilter()
output_filter = OutputFilter()
rate_limiter = RateLimiter(role_store)

# --- Build all sub-agents from registry ---
all_agents = build_all_agents(REGISTRY_PATH, deepseek_client, PROJECT_ID, LOCATION, BASE_DIR)

# --- Build supervisor ---
with open(REGISTRY_PATH, encoding="utf-8") as f:
    agents_registry = yaml.safe_load(f)["agents"]

supervisor = SupervisorAgent(
    deepseek_client=deepseek_client,
    agents_registry=agents_registry,
    rbac=rbac,
    rate_limiter=rate_limiter,
    input_filter=input_filter,
    output_filter=output_filter,
    audit_logger=audit_logger,
    session_store=session_store,
)

# Register semua sub-agent ke supervisor
for name, agent in all_agents.items():
    supervisor.register_agent(name, agent)


# --- Backward compatibility wrappers (untuk eval_rag.py lama) ---
def generate_maintenance_response(session_id: str, user_query: str) -> str:
    """
    Backward-compatible: langsung delegasi ke FMEA agent tanpa RBAC (untuk eval).
    Eval framework baru (eval_agents.py) memakai supervisor.route() dengan RBAC.
    """
    fmea_agent = all_agents.get("fmea_agent")
    if not fmea_agent:
        return "❌ FMEA agent belum dikonfigurasi."
    chat_history = session_store.get_session_history(session_id)
    return fmea_agent.generate(session_id, user_query, chat_history, session_store)


def clear_session_history(session_id: str):
    """Backward-compatible wrapper."""
    session_store.clear_session_history(session_id)


# --- Admin commands (RBAC management via Discord) ---
ADMIN_COMMANDS = {
    "!setrole": "Set role user (admin only). Format: !setrole <user_id> <role>",
    "!listusers": "List semua user + role (admin only).",
    "!myrole": "Lihat role Anda sendiri.",
    "!listagents": "List semua agent yang tersedia.",
}


def handle_admin_command(user_input: str, discord_user_id: str) -> str:
    """Handle command admin untuk manage RBAC."""
    parts = user_input.split()
    cmd = parts[0].lower() if parts else ""

    if cmd == "!myrole":
        role = rbac.get_user_role(discord_user_id)
        return f"Role Anda: **{role}**"

    if cmd == "!listagents":
        lines = ["**Agent tersedia:**"]
        for name, config in agents_registry.items():
            lines.append(f"- `{name}` ({config['domain']}): {config['description']}")
        return "\n".join(lines)

    # Command berikut butuh role admin
    user_role = rbac.get_user_role(discord_user_id)
    if user_role != "admin":
        return "🚫 Command ini hanya untuk admin."

    if cmd == "!setrole":
        if len(parts) < 3:
            return "Format: `!setrole <user_id> <role>`"
        target_user_id = parts[1]
        target_role = parts[2]
        valid_roles = list(rbac.matrix.keys())
        if target_role not in valid_roles:
            return f"Role tidak valid. Pilihan: {', '.join(valid_roles)}"
        if role_store.set_role(target_user_id, target_role, discord_user_id):
            return f"✅ Role user `{target_user_id}` di-set ke `{target_role}`."
        return "❌ Gagal set role."

    if cmd == "!listusers":
        users = role_store.list_users()
        if not users:
            return "Belum ada user terdaftar."
        lines = ["**Daftar User:**"]
        for u in users:
            lines.append(f"- `{u['user_id']}`: {u.get('role', 'unknown')}")
        return "\n".join(lines)

    return f"Command tidak dikenal. Available: {', '.join(ADMIN_COMMANDS.keys())}"


# --- Discord Bot ---
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)


@client.event
async def on_ready():
    print(f'✅ Multi-Agent Bot (RBAC + Guardrails) aktif sebagai: {client.user}')
    target_channel = ALLOWED_CHANNEL_NAME or ALLOWED_CHANNEL_ID or "Semua Channel"
    print(f'🔒 Channel yang diizinkan: #{target_channel}')
    print(f'🤖 Agent terdaftar: {", ".join(all_agents.keys())}')


@client.event
async def on_message(message):
    if message.author == client.user:
        return

    is_dm = isinstance(message.channel, discord.DMChannel)

    # Channel filter (hanya untuk server, bukan DM)
    if not is_dm:
        channel_name = getattr(message.channel, "name", "")
        channel_id = str(message.channel.id)
        if ALLOWED_CHANNEL_ID and channel_id != str(ALLOWED_CHANNEL_ID):
            return
        if ALLOWED_CHANNEL_NAME and channel_name != ALLOWED_CHANNEL_NAME:
            return

    is_mentioned = (
        client.user in message.mentions
        or (message.guild and any(role in message.role_mentions for role in message.guild.me.roles))
    ) if not is_dm else True

    if not (is_dm or is_mentioned):
        return

    discord_user_id = str(message.author.id)
    guild_roles = list(message.author.roles) if message.guild else []

    # Strip mention
    user_input = re.sub(r'<@[!&]?\d+>', '', message.content).strip()

    # Perintah reset memory
    if user_input.lower() in ["!reset", "!clear", "reset", "clear memory", "hapus memori"]:
        session_id = discord_user_id if is_dm else str(message.channel.id)
        clear_session_history(session_id)
        await message.reply("🧹 Memori percakapan pada sesi ini telah dibersihkan.")
        return

    # Admin commands
    if user_input.startswith("!"):
        await message.reply(handle_admin_command(user_input, discord_user_id))
        return

    if not user_input:
        await message.reply("Silakan ketik pertanyaan yang ingin Anda tanyakan.")
        return

    # Session ID: per-user untuk DM, per-channel untuk server
    session_id = discord_user_id if is_dm else str(message.channel.id)

    print(f"🔔 [{discord_user_id}] {user_input[:80]}...")

    async with message.channel.typing():
        try:
            answer = await asyncio.to_thread(
                supervisor.route,
                user_input,
                discord_user_id,
                guild_roles,
                session_id,
            )
            await message.reply(answer)
        except Exception as e:
            print(f"❌ Error Handler: {e}")
            await message.reply(f"Terjadi kesalahan internal: {e}")


if __name__ == "__main__":
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        print("❌ Error: DISCORD_BOT_TOKEN belum di-set di file .env")
    else:
        client.run(token)