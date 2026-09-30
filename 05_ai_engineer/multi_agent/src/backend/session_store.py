"""Session store: Firestore-backed conversation history per session."""
from __future__ import annotations

from google.cloud import firestore


MAX_HISTORY_MESSAGES = 6


class SessionStore:
    """CRUD untuk conversation history di Firestore."""

    def __init__(self, db: firestore.Client, collection: str = "bot_maintenance_sessions"):
        self.db = db
        self.collection = collection

    def get_session_history(self, session_id: str, limit: int = MAX_HISTORY_MESSAGES) -> list:
        """Ambil riwayat percakapan dari Firestore."""
        try:
            doc_ref = self.db.collection(self.collection).document(session_id)
            doc = doc_ref.get()
            if doc.exists:
                messages = doc.to_dict().get("messages", [])
                return messages[-limit:]
        except Exception as e:
            print(f"⚠️ Error membaca Firestore history: {e}")
        return []

    def save_session_history(self, session_id: str, user_query: str, assistant_reply: str):
        """Simpan turn percakapan baru ke Firestore."""
        try:
            doc_ref = self.db.collection(self.collection).document(session_id)
            history = self.get_session_history(session_id, limit=10)
            history.append({"role": "user", "content": user_query})
            history.append({"role": "assistant", "content": assistant_reply})
            doc_ref.set({
                "messages": history[-MAX_HISTORY_MESSAGES:],
                "updated_at": firestore.SERVER_TIMESTAMP,
            }, merge=True)
        except Exception as e:
            print(f"⚠️ Error menyimpan ke Firestore: {e}")

    def clear_session_history(self, session_id: str):
        """Hapus memori percakapan pada Firestore."""
        try:
            self.db.collection(self.collection).document(session_id).delete()
        except Exception as e:
            print(f"⚠️ Error menghapus Firestore session: {e}")
