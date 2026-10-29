"""
Polyglot C1 Daily — Source Adapters Package.
"""

from .base import (
    BaseSourceAdapter,
    LicenseMetadata,
    NormalizedDictionaryEntry,
    NormalizedExample,
    SourceProvenance,
    normalize_text,
)
from .registry import SourceManager
from .tatoeba import TatoebaAdapter
from .wikimedia import WikimediaCommonsAdapter
from .wikipedia import WIKIPEDIA_LICENSE, WikipediaAdapter, WikipediaArticle
from .wiktionary import WiktionaryAdapter

__all__ = [
    "BaseSourceAdapter",
    "LicenseMetadata",
    "NormalizedDictionaryEntry",
    "NormalizedExample",
    "SourceProvenance",
    "SourceManager",
    "WiktionaryAdapter",
    "TatoebaAdapter",
    "WikimediaCommonsAdapter",
    "WikipediaAdapter",
    "WikipediaArticle",
    "WIKIPEDIA_LICENSE",
    "normalize_text",
]
