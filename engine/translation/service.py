"""
Polyglot C1 Daily — Translation Orchestration Service & LRU Caching.

Coordinates QuotaGuard, bounded in-memory LRU cache, and provider cascade
(Dictionary -> MyMemory -> LibreTranslate -> Graceful Fallback).
"""

from __future__ import annotations

import collections
import hashlib
import logging
import time
from typing import Dict, List, Optional, Tuple

from .base import BaseTranslationProvider
from .dictionary_provider import DictionaryTranslationProvider
from .libretranslate_provider import LibreTranslateProvider
from .models import QuotaStatus, TranslationRequest, TranslationResponse
from .mymemory_provider import MyMemoryTranslationProvider
from .quota_guard import EphemeralQuotaGuard, QuotaExceededError, TextLengthExceededError

logger = logging.getLogger(__name__)

CACHE_MAX_ENTRIES = 500
CACHE_TTL_SECONDS = 86400  # 24 hours


class BoundedLRUCache:
    """In-memory bounded LRU cache with TTL expiration."""

    def __init__(self, maxsize: int = CACHE_MAX_ENTRIES, ttl: int = CACHE_TTL_SECONDS):
        self.maxsize = maxsize
        self.ttl = ttl
        # Key -> (TranslationResponse, expiry_timestamp)
        self._data: collections.OrderedDict[str, Tuple[TranslationResponse, float]] = collections.OrderedDict()

    def get(self, key: str) -> Optional[TranslationResponse]:
        if key not in self._data:
            return None
        res, expiry = self._data[key]
        if time.time() > expiry:
            del self._data[key]
            return None
        # Move to end for LRU
        self._data.move_to_end(key)
        cached_copy = res.model_copy()
        cached_copy.from_cache = True
        return cached_copy

    def put(self, key: str, res: TranslationResponse) -> None:
        if key in self._data:
            del self._data[key]
        elif len(self._data) >= self.maxsize:
            # Evict oldest
            self._data.popitem(last=False)
        self._data[key] = (res.model_copy(), time.time() + self.ttl)


class TranslationManager:
    """
    Unified manager handling translation requests, caching,
    rate limits, and multi-provider fallback.
    """

    def __init__(
        self,
        providers: Optional[List[BaseTranslationProvider]] = None,
        quota_guard: Optional[EphemeralQuotaGuard] = None,
        cache_maxsize: int = CACHE_MAX_ENTRIES,
    ):
        self.providers = providers or [
            DictionaryTranslationProvider(),
            MyMemoryTranslationProvider(),
            LibreTranslateProvider(),
        ]
        self.quota_guard = quota_guard or EphemeralQuotaGuard()
        self.cache = BoundedLRUCache(maxsize=cache_maxsize)

    def _cache_key(self, request: TranslationRequest) -> str:
        raw = f"{request.source_lang}:{request.target_lang}:{request.source_text.strip().lower()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def translate(self, request: TranslationRequest) -> TranslationResponse:
        """
        Execute translation with input validation, quota consumption,
        cache check, and multi-provider cascade.
        """
        # 1. Enforce length boundary & consume daily quota token
        self.quota_guard.check_and_consume(request)

        # 2. Check in-memory bounded LRU cache
        cache_key = self._cache_key(request)
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # 3. Provider Cascade: Dictionary -> MyMemory -> LibreTranslate
        for provider in self.providers:
            try:
                result = provider.translate(request)
                if result and result.translated_text:
                    self.cache.put(cache_key, result)
                    return result
            except Exception as e:
                logger.warning(f"Provider {provider.provider_name} failed: {e}; cascading.")
                continue

        # 4. Graceful Fallback if all external providers are unavailable
        fallback = TranslationResponse(
            translated_text=f"[{request.source_text}] (Tradução indisponível temporariamente)",
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            provider_name="fallback",
            is_verified=False,
            is_approximate=True,
            confidence=0.0,
            notes="Nenhum provedor de tradução retornou resultado. Tente novamente mais tarde ou use termos do vocabulário essencial.",
            from_cache=False,
        )
        return fallback

    def get_quota_status(self, user_id: str, is_registered: bool) -> QuotaStatus:
        """Inspect current quota without consuming requests."""
        return self.quota_guard.get_status(user_id, is_registered)
