"""Supervisor agent: router/orchestrator yang pilih sub-agent berdasarkan intent."""
from __future__ import annotations

import json
import time

from openai import OpenAI

from agents.base_agent import BaseAgent, GREETING_MARKER
from auth.rbac import RBACMiddleware
from guardrails.input_filter import InputFilter, redact_pii
from guardrails.output_filter import OutputFilter
from guardrails.rate_limiter import RateLimiter
from auth.audit import AuditLogger


class SupervisorAgent:
    """
    Router agent yang:
    1. Cek RBAC (role + permission)
    2. Cek rate limit
    3. Filter input (prompt injection, PII, secret)
    4. Klasifikasi intent ke sub-agent
    5. Delegasikan ke sub-agent
    6. Filter output (PII redaction, secret block)
    7. Audit log
    """

    def __init__(
        self,
        deepseek_client: OpenAI,
        agents_registry: dict,
        rbac: RBACMiddleware,
        rate_limiter: RateLimiter,
        input_filter: InputFilter,
        output_filter: OutputFilter,
        audit_logger: AuditLogger,
        session_store,
    ):
        self.client = deepseek_client
        self.registry = agents_registry  # dict dari agents_registry.yaml
        self.rbac = rbac
        self.rate_limiter = rate_limiter
        self.input_filter = input_filter
        self.output_filter = output_filter
        self.audit_logger = audit_logger
        self.session_store = session_store
        self._agent_instances = {}  # cache agent instances

    def register_agent(self, name: str, agent: BaseAgent):
        """Daftarkan instance sub-agent yang sudah di-init."""
        self._agent_instances[name] = agent

    def classify_intent(self, user_query: str, allowed_agents: list) -> str:
        """Pilih sub-agent berdasarkan query + permission user."""
        if not allowed_agents:
            return "none"

        agent_descriptions = "\n".join(
            f"- {name}: {self.registry[name]['description']}"
            for name in allowed_agents if name in self.registry
        )
        prompt = f"""Pilih SATU agent yang paling tepat untuk menjawab pertanyaan user.
Hanya pilih dari daftar yang diizinkan. Jika tidak ada yang cocok, jawab "none".

Agent tersedia:
{agent_descriptions}

Pertanyaan user: {user_query}

Output WAJIB JSON:
{{"agent": "<nama_agent atau none>", "reason": "<singkat>"}}"""

        resp = self.client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0,
        )
        result = json.loads(resp.choices[0].message.content)
        return result.get("agent", "none")

    def route(
        self,
        user_query: str,
        discord_user_id: str,
        guild_roles: list = None,
        session_id: str = "",
    ) -> str:
        """Main entry: route user query ke sub-agent yang tepat."""
        start_time = time.time()

        # 1. Tentukan role
        role = self.rbac.get_user_role(discord_user_id, guild_roles)
        perms = self.rbac.get_permissions(role)
        allowed_agents = perms.get("allowed_agents", [])

        # 2. Rate limit check
        max_per_day = perms.get("max_turns_per_day", 0)
        if not self.rate_limiter.check(discord_user_id, max_per_day):
            self._audit(discord_user_id, user_query, "none", "", role, False,
                        "rate_limit_exceeded", session_id, start_time)
            return "⚠️ Anda telah mencapai limit harian. Silakan coba lagi besok."

        # 3. Input filter
        input_result = self.input_filter.check(user_query)
        if not input_result.allowed:
            self._audit(discord_user_id, user_query, "none", "", role, False,
                        input_result.reason, session_id, start_time)
            return f"⚠️ {input_result.reason}"

        # 4. Klasifikasi intent
        agent_name = self.classify_intent(user_query, allowed_agents)
        if agent_name == "none" or agent_name not in allowed_agents:
            self._audit(discord_user_id, user_query, "none", "", role, False,
                        "no_matching_agent", session_id, start_time)
            return ("Maaf, saya tidak bisa membantu dengan pertanyaan tersebut, "
                        "atau Anda tidak memiliki akses ke domain ini.")

        # 5. Cek akses agent
        access = self.rbac.check_agent_access(role, agent_name)
        if not access["allowed"]:
            self._audit(discord_user_id, user_query, agent_name, "", role, False,
                        access["reason"], session_id, start_time)
            return f"🚫 Akses ditolak: {access['reason']}"

        # 6. Ambil agent instance
        agent = self._agent_instances.get(agent_name)
        if not agent:
            self._audit(discord_user_id, user_query, agent_name, "", role, False,
                        "agent_not_registered", session_id, start_time)
            return "❌ Agent belum dikonfigurasi."

        # 7. Ambil chat history
        chat_history = self.session_store.get_session_history(session_id)

        # 8. Generate response via sub-agent
        try:
            response = agent.generate(session_id, user_query, chat_history, self.session_store)
        except Exception as e:
            self._audit(discord_user_id, user_query, agent_name, f"Error: {e}",
                        role, False, "generation_error", session_id, start_time)
            return f"❌ Terjadi kesalahan internal: {e}"

        # 9. Output filter
        output_result = self.output_filter.check(response)
        final_output = output_result.cleaned_output

        # 10. Consume rate limit
        self.rate_limiter.consume(discord_user_id)

        # 11. Audit log
        self._audit(discord_user_id, user_query, agent_name, final_output,
                    role, True, "", session_id, start_time)

        return final_output

    def _audit(self, user_id, query, agent, response, role, allowed, reason,
               session_id, start_time):
        latency_ms = int((time.time() - start_time) * 1000)
        # Redact PII di audit log
        safe_query = redact_pii(query)
        safe_response = redact_pii(response)
        self.audit_logger.log(
            discord_user_id=user_id,
            user_query=safe_query,
            agent_name=agent,
            response=safe_response,
            role=role,
            allowed=allowed,
            reason=reason,
            session_id=session_id,
            latency_ms=latency_ms,
        )
