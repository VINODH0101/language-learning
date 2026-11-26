"""
Discovery platform contracts.

Reuses the existing ``engine.sources`` provenance/license models
(``LicenseMetadata``, ``SourceProvenance``). A Discovery resource keeps
external facts separate from AI-generated explanations: an explanation must
never be presented as a quotation or fact from the original source.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from engine.sources.base import LicenseMetadata, SourceProvenance


class DiscoveryCategory(str, Enum):
    ARTICLE = "article"
    CULTURE = "culture"
    PLACE = "place"
    BOOK = "book"
    AUTHOR = "author"
    LANGUAGE_FACT = "language_fact"
    EXPRESSION = "expression"
    SENTENCE = "sentence"
    VOCABULARY = "vocabulary"
    HISTORY = "history"
    RESOURCE = "resource"
    COLLECTION = "collection"
    MEDIA = "media"


class DiscoveryResource(BaseModel):
    """Normalized discovery item.

    ``facts`` originate from the source and carry provenance. ``explanation``
    is a learner-facing, generated or curated note that is explicitly distinct
    from the source facts.
    """

    id: str
    category: DiscoveryCategory
    title: str
    target_language: str
    explanation_language: str
    cefr_level: Optional[str] = None
    summary: str = ""
    topic: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source_url: str
    provenance: SourceProvenance
    facts: dict = Field(default_factory=dict)
    explanation: str = ""
    external_media: List[str] = Field(default_factory=list)
    published: bool = False


class DiscoverySourceAdapter(ABC):
    """Interface for external discovery sources.

    Adapters expose supported resource types, languages, search/fetch, and
    licensing/rate-limit policies. The existing ``BaseSourceAdapter`` provides
    rate limiting, retries, caching, and offline fallbacks and should be
    composed rather than duplicated.
    """

    @property
    @abstractmethod
    def source_id(self) -> str:
        """Unique source identifier."""

    @property
    @abstractmethod
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        """Categories this source can produce."""

    @property
    @abstractmethod
    def supported_languages(self) -> List[str]:
        """Languages this source supports."""

    @property
    @abstractmethod
    def license(self) -> LicenseMetadata:
        """License/attribution policy for this source."""

    @abstractmethod
    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        """Search for resources."""

    @abstractmethod
    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        """Fetch a single resource by id."""

    @abstractmethod
    def health_check(self) -> bool:
        """Return True when the source is reachable/usable."""
