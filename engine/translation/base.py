"""
Polyglot C1 Daily — Abstract Translation Provider Interface.

Establishes a swappable interface so translation backends can be switched
via runtime configuration without modifying client or application code.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from .models import TranslationRequest, TranslationResponse


class BaseTranslationProvider(ABC):
    """Abstract base class for swappable translation backends."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Unique identifier for this translation provider."""
        pass

    @abstractmethod
    def translate(self, request: TranslationRequest) -> Optional[TranslationResponse]:
        """
        Execute translation for the requested text and language pair.
        Returns TranslationResponse on success, or None if unavailable/unsupported.
        """
        pass
