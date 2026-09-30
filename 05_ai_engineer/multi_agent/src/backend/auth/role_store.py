"""Firestore-backed store untuk user role mapping & rate limit counter."""
from __future__ import annotations

import os
from datetime import datetime, timezone

from google.cloud import firestore


class RoleStore:
    """CRUD untuk user_roles & rate limit counter di Firestore."""

    def __init__(self, db: firestore.Client):
        self.db = db
        self.roles_collection = "user_roles"
        self.rate_collection = "rate_limits"

    # --- ROLE MAPPING ---
    def get_role(self, discord_user_id: str) -> str | None:
        """Ambil role bisnis user dari Firestore. Return None jika belum terdaftar."""
        try:
            doc = self.db.collection(self.roles_collection).document(discord_user_id).get()
            if doc.exists:
                return doc.to_dict().get("role")
        except Exception as e:
            print(f"⚠️ Error get_role Firestore: {e}")
        return None

    def set_role(self, discord_user_id: str, role: str, assigned_by: str):
        """Set/assign role ke user (hanya admin yang boleh, cek di caller)."""
        try:
            self.db.collection(self.roles_collection).document(discord_user_id).set({
                "role": role,
                "assigned_by": assigned_by,
                "assigned_at": firestore.SERVER_TIMESTAMP,
            }, merge=True)
            return True
        except Exception as e:
            print(f"⚠️ Error set_role Firestore: {e}")
            return False

    def list_users(self) -> list:
        """List semua user + role (untuk admin command)."""
        try:
            docs = self.db.collection(self.roles_collection).stream()
            return [{"user_id": d.id, **d.to_dict()} for d in docs]
        except Exception as e:
            print(f"⚠️ Error list_users Firestore: {e}")
            return []

    # --- RATE LIMITING ---
    def check_rate_limit(self, discord_user_id: str, max_per_day: int) -> bool:
        """
        Cek apakah user masih dalam limit harian.
        Return True jika masih boleh, False jika sudah exceed.
        """
        if max_per_day <= 0:
            return False  # guest / role tanpa quota

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        doc_id = f"{discord_user_id}_{today}"
        try:
            doc = self.db.collection(self.rate_collection).document(doc_id).get()
            if doc.exists:
                count = doc.to_dict().get("count", 0)
                return count < max_per_day
            return True  # belum ada record = boleh
        except Exception as e:
            print(f"⚠️ Error check_rate_limit Firestore: {e}")
            return True  # fail-open untuk availability

    def increment_rate_limit(self, discord_user_id: str):
        """Increment counter harian user."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        doc_id = f"{discord_user_id}_{today}"
        try:
            ref = self.db.collection(self.rate_collection).document(doc_id)
            ref.set({
                "user_id": discord_user_id,
                "date": today,
                "count": firestore.Increment(1),
                "updated_at": firestore.SERVER_TIMESTAMP,
            }, merge=True)
        except Exception as e:
            print(f"⚠️ Error increment_rate_limit Firestore: {e}")
