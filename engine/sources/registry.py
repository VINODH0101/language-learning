"""
Polyglot C1 Daily — Educational Source Registry & Import Manager.

Coordinates Wiktionary, Tatoeba, and Wikimedia Commons adapters with
stable identifier assignment, duplicate detection, and provenance logging.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from .base import NormalizedDictionaryEntry, NormalizedExample, normalize_text
from .tatoeba import TatoebaAdapter
from .wikimedia import WikimediaCommonsAdapter
from .wikipedia import WikipediaAdapter, WikipediaArticle
from .wiktionary import WiktionaryAdapter

logger = logging.getLogger(__name__)


class SourceManager:
    """
    Unified manager orchestrating educational source adapters.
    Ensures safe incremental imports, provenance retention, and offline resilience.
    """

    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        fixture_dir: Optional[Path] = None,
        offline_mode: bool = False,
    ):
        self.wiktionary = WiktionaryAdapter(
            cache_dir=cache_dir, fixture_dir=fixture_dir, offline_mode=offline_mode
        )
        self.tatoeba = TatoebaAdapter(
            cache_dir=cache_dir, fixture_dir=fixture_dir, offline_mode=offline_mode
        )
        self.wikimedia = WikimediaCommonsAdapter(
            cache_dir=cache_dir, fixture_dir=fixture_dir, offline_mode=offline_mode
        )
        self.wikipedia = WikipediaAdapter(
            cache_dir=cache_dir, fixture_dir=fixture_dir, offline_mode=offline_mode
        )
        self.offline_mode = offline_mode
        self._imported_registry: Dict[str, NormalizedDictionaryEntry] = {}

    def fetch_word_package(
        self, lemma: str, language: str, regional_variety: str = "all"
    ) -> Optional[NormalizedDictionaryEntry]:
        """
        Assemble a comprehensive educational record for a lemma:
        - Dictionary definitions & part of speech from Wiktionary
        - Authentic example sentence & translation from Tatoeba
        - Native audio URL from Tatoeba or Wikimedia Commons
        """
        norm_lemma = normalize_text(lemma)
        reg_key = f"{language}:{norm_lemma.lower()}"

        if reg_key in self._imported_registry:
            return self._imported_registry[reg_key]

        # 1. Fetch dictionary definition
        entry = self.wiktionary.fetch_dictionary_entry(
            norm_lemma, language, regional_variety=regional_variety
        )

        # 2. Fetch authentic sentences from Tatoeba
        tatoeba_examples = self.tatoeba.fetch_example_sentences(norm_lemma, language, limit=2)

        # 3. Check for native pronunciation audio
        audio_url = self.wikimedia.fetch_audio_url(norm_lemma, language, regional_variety=regional_variety)
        if not audio_url and tatoeba_examples:
            for ex in tatoeba_examples:
                if ex.audio_url:
                    audio_url = ex.audio_url
                    break

        if entry:
            if audio_url:
                entry.audio_url = audio_url
            if tatoeba_examples:
                # Merge examples avoiding duplicates
                existing_targets = {e.sentence_target for e in entry.examples}
                for tex in tatoeba_examples:
                    if tex.sentence_target not in existing_targets:
                        entry.examples.append(tex)
            self._imported_registry[reg_key] = entry
            return entry

        # If Wiktionary has no entry, check if Tatoeba has contextual examples
        if tatoeba_examples:
            tatoeba_entry = self.tatoeba.fetch_dictionary_entry(norm_lemma, language)
            if tatoeba_entry:
                if audio_url:
                    tatoeba_entry.audio_url = audio_url
                self._imported_registry[reg_key] = tatoeba_entry
                return tatoeba_entry

        return None

    def fetch_reading_article(
        self,
        language: str,
        cefr_level: str = "B2",
        topic_category: Optional[str] = None,
        exclude_article_ids: Optional[List[str]] = None,
    ) -> Optional[WikipediaArticle]:
        """
        Fetch authentic Wikipedia reading article with metadata,
        deduplication against recent IDs, and offline fallback.
        """
        return self.wikipedia.fetch_daily_article(
            language=language,
            cefr_level=cefr_level,
            topic_category=topic_category,
            exclude_article_ids=exclude_article_ids,
        )
