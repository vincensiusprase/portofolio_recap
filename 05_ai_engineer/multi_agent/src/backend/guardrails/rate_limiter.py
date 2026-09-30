"""Rate limiter: batasi request per user per hari via Firestore counter."""
from __future__ import annotations

from auth.role_store import RoleStore


class RateLimiter:
    """Wrapper di atas RoleStore untuk rate limiting harian."""

    def __init__(self, role_store: RoleStore):
        self.role_store = role_store

    def check(self, discord_user_id: str, max_per_day: int) -> bool:
        """Return True jika user masih dalam limit."""
        return self.role_store.check_rate_limit(discord_user_id, max_per_day)

    def consume(self, discord_user_id: str):
        """Increment counter setelah request berhasil diproses."""
        self.role_store.increment_rate_limit(discord_user_id)
