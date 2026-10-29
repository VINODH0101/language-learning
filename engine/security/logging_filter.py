"""
Polyglot C1 Daily — Security Logging Filter.

Scrubs API keys, bearer tokens, passwords, and sensitive credentials
from all log records before output to stdout or files.
"""

from __future__ import annotations

import logging
import re
from typing import Any

# Patterns to match sensitive tokens
SENSITIVE_PATTERNS = [
    (re.compile(r'(?i)(api[_-]?key|secret|password|token|bearer|authorization)\s*[:=]\s*["\']?([^"\'\s]+)["\']?'), r'\1: [REDACTED]'),
    (re.compile(r'ey[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}'), '[REDACTED_JWT]'),
    (re.compile(r're_[a-zA-Z0-9]{24,}'), '[REDACTED_RESEND_KEY]'),
    (re.compile(r'sbp_[a-zA-Z0-9]{32,}'), '[REDACTED_SUPABASE_KEY]'),
]


class SensitiveDataScrubber(logging.Filter):
    """Logging filter replacing passwords and secret tokens with [REDACTED]."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.scrub_text(record.msg)
        if record.args:
            scrubbed_args = []
            for arg in record.args:
                if isinstance(arg, str):
                    scrubbed_args.append(self.scrub_text(arg))
                else:
                    scrubbed_args.append(arg)
            record.args = tuple(scrubbed_args)
        return True

    @staticmethod
    def scrub_text(text: str) -> str:
        for pattern, replacement in SENSITIVE_PATTERNS:
            text = pattern.sub(replacement, text)
        return text


def configure_secure_logging(level: int = logging.INFO) -> None:
    """Configures root logger with the sensitive data scrubber filter."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    scrubber = SensitiveDataScrubber()
    for handler in root_logger.handlers:
        handler.addFilter(scrubber)

    # If no handler, add a default stdout stream handler with scrubber
    if not root_logger.handlers:
        handler = logging.StreamHandler()
        handler.addFilter(scrubber)
        formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(name)s: %(message)s")
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)
