"""Input filter: deteksi prompt injection, PII, toxic content sebelum masuk LLM."""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class InputFilterResult:
    allowed: bool
    reason: str = ""
    flagged_patterns: list = None

    def __post_init__(self):
        if self.flagged_patterns is None:
            self.flagged_patterns = []


# Pola prompt injection yang umum (case-insensitive)
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)",
    r"disregard\s+(all\s+)?(previous|prior)\s+(instructions|prompts)",
    r"forget\s+(all\s+)?(previous|prior)\s+(instructions|rules)",
    r"you\s+are\s+(now|no\s+longer)\s+(dan|jailbreak|developer|admin)",
    r"act\s+as\s+(dan|jailbreak|a\s+different\s+ai|root|admin)",
    r"system\s*:\s*",  # role-play sebagai system
    r"<\|im_start\|>",  # ChatML injection
    r"\[system\]",
    r"new\s+instructions?\s*:",
    r"override\s+(system|safety|content)\s+(policy|filter|rules)",
    r"reveal\s+(your|the)\s+(system\s+)?prompt",
    r"show\s+me\s+your\s+(system\s+)?prompt",
    r"what\s+are\s+your\s+(instructions|rules|system\s+prompt)",
]

# Pola PII yang sensitif (jangan masuk ke log/query)
PII_PATTERNS = [
    (r"\b\d{16,19}\b", "credit_card"),  # kartu kredit
    (r"\b\d{3}-\d{2}-\d{4}\b", "ssn"),  # SSN format
    (r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "email"),
    (r"\b\+?\d{1,3}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b", "phone"),
]

# Pola secret leak (API key, token)
SECRET_PATTERNS = [
    (r"sk-[a-zA-Z0-9]{20,}", "openai_key"),
    (r"ghp_[a-zA-Z0-9]{36}", "github_pat"),
    (r"AIza[a-zA-Z0-9_-]{35}", "google_api_key"),
    (r"-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----", "private_key"),
    (r"ya29\.[a-zA-Z0-9_-]+", "google_oauth"),
]

# Kata toxic/offensive (subset, bisa diperluas)
TOXIC_WORDS = [
    "bodoh", "goblok", "idiot", "stupid", "damn", "shit", "fuck",
]


class InputFilter:
    """Filter input sebelum masuk ke RAG/LLM."""

    def __init__(self, block_pii: bool = True, block_secrets: bool = True,
                 block_injection: bool = True, block_toxic: bool = True):
        self.block_pii = block_pii
        self.block_secrets = block_secrets
        self.block_injection = block_injection
        self.block_toxic = block_toxic

    def check(self, user_input: str) -> InputFilterResult:
        """Cek input. Return InputFilterResult dengan allowed=True jika lolos."""
        flagged = []

        # 1. Prompt injection
        if self.block_injection:
            for pattern in PROMPT_INJECTION_PATTERNS:
                if re.search(pattern, user_input, re.IGNORECASE):
                    flagged.append(f"prompt_injection:{pattern[:30]}")
            return InputFilterResult(
                allowed=False,
                reason="Pertanyaan mengandung pola prompt injection yang dicurigai.",
                flagged_patterns=flagged,
            )

        # 2. Secret leak
        if self.block_secrets:
            for pattern, label in SECRET_PATTERNS:
                if re.search(pattern, user_input, re.IGNORECASE):
                    flagged.append(f"secret:{label}")
            if flagged:
                return InputFilterResult(
                    allowed=False,
                    reason="Input mengandung secret/credential yang tidak boleh diproses.",
                    flagged_patterns=flagged,
                )

        # 3. PII (warning, tidak block tapi flag)
        if self.block_pii:
            for pattern, label in PII_PATTERNS:
                if re.search(pattern, user_input, re.IGNORECASE):
                    flagged.append(f"pii:{label}")

        # 4. Toxic content
        if self.block_toxic:
            lower_input = user_input.lower()
            for word in TOXIC_WORDS:
                if word in lower_input:
                    flagged.append(f"toxic:{word}")
            if flagged:
                return InputFilterResult(
                    allowed=False,
                    reason="Pertanyaan mengandung kata yang tidak pantas.",
                    flagged_patterns=flagged,
                )

        # PII tidak block, tapi flag untuk audit
        if flagged:
            return InputFilterResult(
                allowed=True,
                reason="PII terdeteksi (diizinkan tapi di-flag untuk audit).",
                flagged_patterns=flagged,
            )

        return InputFilterResult(allowed=True)


def redact_pii(text: str) -> str:
    """Redact PII dari text (untuk logging/audit)."""
    for pattern, _ in PII_PATTERNS:
        text = re.sub(pattern, "[REDACTED]", text, flags=re.IGNORECASE)
    for pattern, _ in SECRET_PATTERNS:
        text = re.sub(pattern, "[REDACTED]", text, flags=re.IGNORECASE)
    return text
