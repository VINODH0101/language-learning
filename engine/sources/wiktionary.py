"""
Polyglot C1 Daily — Wiktionary Educational Source Adapter.

Integrates Wiktionary for authentic dictionary entries, definitions,
parts of speech, and IPA pronunciation under CC-BY-SA 3.0.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

from .base import (
    BaseSourceAdapter,
    LicenseMetadata,
    NormalizedDictionaryEntry,
    NormalizedExample,
    SourceProvenance,
    normalize_text,
)

logger = logging.getLogger(__name__)

WIKTIONARY_LICENSE = LicenseMetadata(
    license_name="CC-BY-SA-3.0",
    license_url="https://creativecommons.org/licenses/by-sa/3.0/",
    attribution_text="Content from Wiktionary (Wikimedia Foundation), licensed under CC-BY-SA 3.0.",
    derivative_permitted=True,
    commercial_permitted=True,
    requires_share_alike=True,
)


class WiktionaryAdapter(BaseSourceAdapter):
    """
    Adapter for Wiktionary dictionary data.
    Supports Portuguese ('pt') and Spanish ('es') lookups.
    """

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def _load_fixture(self, lemma: str, language: str) -> Optional[NormalizedDictionaryEntry]:
        """Load entry from local test fixture dataset if available."""
        fixture_file = self.fixture_dir / f"wiktionary_{language}_fixtures.json"
        if fixture_file.exists():
            try:
                with open(fixture_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    norm_lemma = normalize_text(lemma).lower()
                    if norm_lemma in data:
                        raw = data[norm_lemma]
                        return NormalizedDictionaryEntry(**raw)
            except Exception as e:
                logger.warning(f"Error loading Wiktionary fixture {fixture_file}: {e}")
        return None

    def fetch_dictionary_entry(
        self, lemma: str, language: str, regional_variety: str = "all"
    ) -> Optional[NormalizedDictionaryEntry]:
        """
        Fetch entry for a lemma in Portuguese or Spanish.
        Tries online REST / Action API first; falls back to offline fixture.
        """
        clean_lemma = normalize_text(lemma)
        cache_key = f"wiktionary_{language}_{clean_lemma.lower()}"

        # Check offline fixture first if offline mode is explicitly requested
        if self.offline_mode:
            return self._load_fixture(clean_lemma, language)

        # 1. Query English Wiktionary REST definition API (well-structured JSON)
        encoded_lemma = urllib.parse.quote(clean_lemma)
        rest_url = f"https://en.wiktionary.org/api/rest_v1/page/definition/{encoded_lemma}"

        resp = self._fetch_url_json(rest_url, cache_key=cache_key)
        if resp and isinstance(resp, dict):
            entry = self._parse_rest_response(resp, clean_lemma, language, regional_variety)
            if entry:
                return entry

        # 2. If REST definition was empty or missed target language, check local fixtures
        return self._load_fixture(clean_lemma, language)

    def _parse_rest_response(
        self,
        data: Dict[str, Any],
        lemma: str,
        language: str,
        regional_variety: str
    ) -> Optional[NormalizedDictionaryEntry]:
        """Parse structured Wiktionary REST definitions."""
        target_key = "Portuguese" if language == "pt" else "Spanish"

        if target_key not in data:
            # Check lowercase language keys
            target_key = language
            if target_key not in data:
                return None

        lang_sections = data[target_key]
        if not isinstance(lang_sections, list) or len(lang_sections) == 0:
            return None

        pos = "noun"
        definitions_en: List[str] = []
        definitions_target: List[str] = []
        examples: List[NormalizedExample] = []

        for section in lang_sections:
            if not isinstance(section, dict):
                continue
            section_pos = section.get("partOfSpeech", "term").lower()
            if section_pos in ["noun", "verb", "adjective", "adverb", "idiom"]:
                pos = section_pos

            for def_item in section.get("definitions", []):
                raw_def = def_item.get("definition", "")
                # Strip HTML tags
                clean_def = re.sub(r'<[^>]+>', '', raw_def)
                clean_def = normalize_text(clean_def)
                if clean_def and clean_def not in definitions_en:
                    definitions_en.append(clean_def)

                # Collect examples in definitions
                for raw_ex in def_item.get("examples", []):
                    clean_ex = re.sub(r'<[^>]+>', '', raw_ex)
                    clean_ex = normalize_text(clean_ex)
                    if clean_ex:
                        ex_obj = NormalizedExample(
                            id=f"wik-ex-{abs(hash(clean_ex)) % 1000000}",
                            sentence_target=clean_ex,
                            sentence_translation="",
                            provenance=SourceProvenance(
                                source_name="Wiktionary",
                                source_id=f"wik-{lemma}",
                                source_url=f"https://en.wiktionary.org/wiki/{urllib.parse.quote(lemma)}",
                                license=WIKTIONARY_LICENSE,
                            ),
                        )
                        examples.append(ex_obj)

        if not definitions_en:
            return None

        # Build target definition placeholder if not provided separately
        definitions_target = [f"Significado de {lemma}: {d}" for d in definitions_en[:2]]

        source_url = f"https://{language}.wiktionary.org/wiki/{urllib.parse.quote(lemma)}"
        provenance = SourceProvenance(
            source_name=f"Wiktionary ({target_key})",
            source_id=f"wik-{language}-{lemma.lower()}",
            source_url=source_url,
            license=WIKTIONARY_LICENSE,
        )

        return NormalizedDictionaryEntry(
            source_id=provenance.source_id,
            lemma=lemma,
            language=language,
            regional_variety=regional_variety,
            part_of_speech=pos,
            definitions_target=definitions_target,
            definitions_en=definitions_en[:3],
            examples=examples[:3],
            provenance=provenance,
        )

    def fetch_example_sentences(self, query: str, language: str, limit: int = 5) -> List[NormalizedExample]:
        """Wiktionary provides examples inside dictionary definitions."""
        entry = self.fetch_dictionary_entry(query, language)
        if entry:
            return entry.examples[:limit]
        return []
