"""
Polyglot C1 Daily — Ephemeral Translation Quota Guard & Rate Limiter.

Enforces server-side limits without writing transient rows to PostgreSQL:
- Max input length: 1,000 characters
- Guest user daily quota: 10 requests / 24h
- Registered user daily quota: 50 requests / 24h
- In-memory bounded token bucket with automatic TTL cleanup
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Dict, List, Tuple

from .models import QuotaStatus, TranslationRequest

DEFAULT_GUEST_DAILY_LIMIT = 10
DEFAULT_REGISTERED_DAILY_LIMIT = 50
MAX_TEXT_LENGTH = 1000
WINDOW_SECONDS = 86400  # 24 hours


class QuotaExceededError(Exception):
    """Raised when a user or guest exceeds their daily translation quota."""
    def __init__(self, message: str, retry_after_seconds: int):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


class TextLengthExceededError(Exception):
    """Raised when input text exceeds 1,000 characters."""
    pass


class EphemeralQuotaGuard:
    """
    In-memory, zero-database sliding window quota manager.
    Tracks timestamped requests per user_id and prunes expired records automatically.
    """

    def __init__(
        self,
        guest_limit: int = DEFAULT_GUEST_DAILY_LIMIT,
        registered_limit: int = DEFAULT_REGISTERED_DAILY_LIMIT,
        max_length: int = MAX_TEXT_LENGTH,
    ):
        self.guest_limit = guest_limit
        self.registered_limit = registered_limit
        self.max_length = max_length
        # Key: user_id -> List of request timestamps (epoch floats)
        self._history: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def _prune(self, now: float) -> None:
        """Periodic cleanup of entries older than 24h to keep memory footprint minimal."""
        if now - self._last_cleanup > 3600:  # Prune at most once per hour
            expired_threshold = now - WINDOW_SECONDS
            for user_id in list(self._history.keys()):
                self._history[user_id] = [t for t in self._history[user_id] if t > expired_threshold]
                if not self._history[user_id]:
                    del self._history[user_id]
            self._last_cleanup = now

    def check_and_consume(self, request: TranslationRequest) -> QuotaStatus:
        """
        Validate input length and consume one quota token if permitted.
        Raises TextLengthExceededError or QuotaExceededError on violations.
        """
        now = time.time()
        self._prune(now)

        # 1. Validate character length
        if len(request.source_text) > self.max_length:
            raise TextLengthExceededError(
                f"Texto excede o limite máximo permitido de {self.max_length} caracteres "
                f"(foram enviados {len(request.source_text)} caracteres)."
            )

        limit = self.registered_limit if request.is_registered else self.guest_limit
        user_key = request.user_id if (request.is_registered and request.user_id) else "guest"

        # Filter active timestamps within the 24h window
        window_start = now - WINDOW_SECONDS
        active_timestamps = [t for t in self._history[user_key] if t > window_start]
        self._history[user_key] = active_timestamps

        used_today = len(active_timestamps)

        # Calculate retry after in seconds
        oldest_active = active_timestamps[0] if active_timestamps else now
        resets_in = max(1, int(oldest_active + WINDOW_SECONDS - now)) if used_today > 0 else 0

        if used_today >= limit:
            raise QuotaExceededError(
                f"Limite diário de traduções atingido ({limit} requisições/dia). "
                f"Tente novamente em {resets_in // 60} minutos.",
                retry_after_seconds=resets_in,
            )

        # Consume token
        self._history[user_key].append(now)
        used_today += 1
        remaining = max(0, limit - used_today)

        return QuotaStatus(
            user_id=request.user_id,
            is_registered=request.is_registered,
            daily_limit=limit,
            used_today=used_today,
            remaining_today=remaining,
            resets_in_seconds=resets_in,
            is_allowed=True,
        )

    def get_status(self, user_id: str, is_registered: bool) -> QuotaStatus:
        """Inspect remaining quota without consuming a request token."""
        now = time.time()
        limit = self.registered_limit if is_registered else self.guest_limit
        user_key = user_id if (is_registered and user_id) else "guest"

        window_start = now - WINDOW_SECONDS
        active = [t for t in self._history.get(user_key, []) if t > window_start]
        used = len(active)
        remaining = max(0, limit - used)
        oldest = active[0] if active else now
        resets_in = max(0, int(oldest + WINDOW_SECONDS - now)) if used > 0 else 0

        return QuotaStatus(
            user_id=user_id,
            is_registered=is_registered,
            daily_limit=limit,
            used_today=used,
            remaining_today=remaining,
            resets_in_seconds=resets_in,
            is_allowed=used < limit,
        )
