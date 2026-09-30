"""Audit logger: catat setiap request + RBAC decision ke Firestore."""
from __future__ import annotations

from google.cloud import firestore


class AuditLogger:
    """Log semua akses agent untuk compliance & debugging."""

    def __init__(self, db: firestore.Client):
        self.db = db
        self.collection = "audit_logs"

    def log(
        self,
        discord_user_id: str,
        user_query: str,
        agent_name: str,
        response: str,
        role: str,
        allowed: bool,
        reason: str = "",
        session_id: str = "",
        latency_ms: int = 0,
    ):
        """Catat satu event akses agent."""
        try:
            self.db.collection(self.collection).add({
                "timestamp": firestore.SERVER_TIMESTAMP,
                "user_id": discord_user_id,
                "role": role,
                "agent": agent_name,
                "query": user_query[:1000],  # batasi panjang
                "response": response[:2000],
                "allowed": allowed,
                "reason": reason,
                "session_id": session_id,
                "latency_ms": latency_ms,
            })
        except Exception as e:
            print(f"⚠️ Error audit log Firestore: {e}")

    def query_user_activity(self, discord_user_id: str, limit: int = 50) -> list:
        """Ambil aktivitas user (untuk admin command)."""
        try:
            docs = (
                self.db.collection(self.collection)
                .where("user_id", "==", discord_user_id)
                .limit(limit)
                .stream()
            )
            return [d.to_dict() for d in docs]
        except Exception as e:
            print(f"⚠️ Error query_user_activity Firestore: {e}")
            return []
