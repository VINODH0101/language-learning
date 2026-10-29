"""
Polyglot C1 Daily — Input Sanitization and Validation.
"""

from __future__ import annotations

import html
import re
import unicodedata
from typing import Optional


EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)


def validate_email_address(email: str) -> bool:
    """Validate RFC-compliant email address structure."""
    if not email or len(email) > 254:
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def sanitize_input_string(value: str, max_length: int = 500) -> str:
    """
    Sanitizes user input by stripping control chars, normalizing Unicode NFC,
    escaping HTML entities, and limiting length.
    """
    if not value:
        return ""
    # Normalize unicode to NFC
    normalized = unicodedata.normalize("NFC", str(value).strip())
    # Remove non-printable control characters
    filtered = "".join(ch for ch in normalized if unicodedata.category(ch)[0] != "C" or ch in ("\n", "\r", "\t"))
    # Escape HTML entities
    escaped = html.escape(filtered[:max_length])
    return escaped.strip()
