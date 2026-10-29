"""
Polyglot C1 Daily — Translation Services Package.
"""

from .base import BaseTranslationProvider
from .dictionary_provider import DictionaryTranslationProvider
from .libretranslate_provider import LibreTranslateProvider
from .models import (
    QuotaStatus,
    SavedTranslationItem,
    TranslationRequest,
    TranslationResponse,
)
from .mymemory_provider import MyMemoryTranslationProvider
from .quota_guard import (
    EphemeralQuotaGuard,
    QuotaExceededError,
    TextLengthExceededError,
)
from .service import TranslationManager

__all__ = [
    "BaseTranslationProvider",
    "DictionaryTranslationProvider",
    "MyMemoryTranslationProvider",
    "LibreTranslateProvider",
    "TranslationManager",
    "TranslationRequest",
    "TranslationResponse",
    "QuotaStatus",
    "SavedTranslationItem",
    "EphemeralQuotaGuard",
    "QuotaExceededError",
    "TextLengthExceededError",
]
