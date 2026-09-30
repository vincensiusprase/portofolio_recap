"""Output filter: redact PII, deteksi secret leak, validasi format output."""
from __future__ import annotations

import re
from dataclasses import dataclass

from guardrails.input_filter import PII_PATTERNS, SECRET_PATTERNS


@dataclass
class OutputFilterResult:
    allowed: bool
    cleaned_output: str
    reason: str = ""
    flagged_patterns: list = None

    def __post_init__(self):
        if self.flagged_patterns is None:
            self.flagged_patterns = []


class OutputFilter:
    """Filter output sebelum dikirim ke user."""

    def __init__(self, redact_pii: bool = True, block_secrets: bool = True):
        self.redact_pii = redact_pii
        self.block_secrets = block_secrets

    def check(self, output: str) -> OutputFilterResult:
        """Cek & bersihkan output. Return OutputFilterResult."""
        flagged = []
        cleaned = output

        # 1. Secret leak di output = BLOCK (jangan pernah kirim secret ke user)
        if self.block_secrets:
            for pattern, label in SECRET_PATTERNS:
                if re.search(pattern, output, re.IGNORECASE):
                    flagged.append(f"secret:{label}")
                    cleaned = re.sub(pattern, "[REDACTED]", cleaned, flags=re.IGNORECASE)
            if flagged:
                return OutputFilterResult(
                    allowed=False,
                    cleaned_output="[Output diblokir: mengandung secret/credential]",
                    reason="Output mengandung secret yang harus diblokir.",
                    flagged_patterns=flagged,
                )

        # 2. PII redaction (tidak block, tapi redact)
        if self.redact_pii:
            for pattern, label in PII_PATTERNS:
                if re.search(pattern, output, re.IGNORECASE):
                    flagged.append(f"pii:{label}")
                    cleaned = re.sub(pattern, "[REDACTED]", cleaned, flags=re.IGNORECASE)

        # 3. Cek apakah output mengandung penanda internal yang tidak boleh bocor
        internal_markers = ["SPECIAL_GREETING_CONTEXT", "GREETING_MARKER"]
        for marker in internal_markers:
            if marker in cleaned:
                flagged.append(f"internal_marker:{marker}")
                cleaned = cleaned.replace(marker, "")

        return OutputFilterResult(
            allowed=True,
            cleaned_output=cleaned,
            flagged_patterns=flagged,
        )
