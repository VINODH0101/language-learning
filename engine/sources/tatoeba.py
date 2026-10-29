"""
Polyglot C1 Daily — Tatoeba Educational Source Adapter.

Integrates Tatoeba Project for authentic bilingual sentence pairs
and native audio recordings under CC-BY 2.0 France.
"""

from __future__ import annotations

import json
import logging
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

TATOEBA_LICENSE = LicenseMetadata(
    license_name="CC-BY-2.0-FR",
    license_url="https://creativecommons.org/licenses/by/2.0/fr/",
    attribution_text="Sentence pairs and audio from the Tatoeba Project, licensed under Creative Commons Attribution 2.0 France (CC-BY 2.0 FR).",
    derivative_permitted=True,
    commercial_permitted=True,
    requires_share_alike=False,
)


class TatoebaAdapter(BaseSourceAdapter):
    """
    Adapter for Tatoeba open translation corpus and native audio.
    Queries sentence pairs between Portuguese/Spanish and English.
    """

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def _lang_to_tatoeba_code(self, lang: str) -> str:
        """Map ISO-639-1 ('pt', 'es') to Tatoeba 3-letter codes ('por', 'spa')."""
        return "por" if lang == "pt" else "spa"

    def _load_fixtures(self, query: str, language: str) -> List[NormalizedExample]:
        """Load matching examples from offline fixture files."""
        fixture_file = self.fixture_dir / f"tatoeba_{language}_fixtures.json"
        if fixture_file.exists():
            try:
                with open(fixture_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    norm_q = normalize_text(query).lower()
                    results: List[NormalizedExample] = []
                    for item in data.get("examples", []):
                        target = item.get("sentence_target", "")
                        if norm_q in normalize_text(target).lower() or norm_q in item.get("lemma_tags", []):
                            results.append(NormalizedExample(
                                id=item["id"],
                                sentence_target=normalize_text(item["sentence_target"]),
                                sentence_translation=normalize_text(item["sentence_translation"]),
                                audio_url=item.get("audio_url"),
                                provenance=SourceProvenance(
                                    source_name="Tatoeba Project",
                                    source_id=item["id"],
                                    source_url=f"https://tatoeba.org/sentences/show/{item['id'].replace('tat-', '')}",
                                    license=TATOEBA_LICENSE,
                                ),
                            ))
                    return results
            except Exception as e:
                logger.warning(f"Error loading Tatoeba fixture {fixture_file}: {e}")
        return []

    def fetch_example_sentences(self, query: str, language: str, limit: int = 5) -> List[NormalizedExample]:
        """
        Search Tatoeba for authentic bilingual sentences matching query.
        Returns target sentence, translation, and native audio URL if available.
        """
        clean_query = normalize_text(query)
        cache_key = f"tatoeba_{language}_{clean_query.lower()}_{limit}"

        if self.offline_mode:
            return self._load_fixtures(clean_query, language)[:limit]

        from_code = self._lang_to_tatoeba_code(language)
        encoded_query = urllib.parse.quote(clean_query)
        url = (
            f"https://tatoeba.org/en/api_v0/search?"
            f"from={from_code}&to=eng&query={encoded_query}&trans_filter=limit&limit={limit}"
        )

        resp = self._fetch_url_json(url, cache_key=cache_key)
        if resp and isinstance(resp, dict) and "results" in resp:
            examples = self._parse_tatoeba_results(resp["results"], language)
            if examples:
                return examples[:limit]

        # Fallback to local fixtures
        return self._load_fixtures(clean_query, language)[:limit]

    def _parse_tatoeba_results(self, results: List[Dict[str, Any]], language: str) -> List[NormalizedExample]:
        """Convert Tatoeba API JSON results into normalized examples."""
        parsed_examples: List[NormalizedExample] = []

        for item in results:
            if not isinstance(item, dict):
                continue
            sentence_id = str(item.get("id", ""))
            target_text = normalize_text(item.get("text", ""))
            if not target_text or not sentence_id:
                continue

            # Look for English translation
            translation_text = ""
            for trans_group in item.get("translations", []):
                for trans in trans_group:
                    if trans.get("lang") == "eng":
                        translation_text = normalize_text(trans.get("text", ""))
                        break
                if translation_text:
                    break

            # Check if native audio is attached
            audio_url = None
            audios = item.get("audios", [])
            if audios and isinstance(audios, list):
                audio_id = audios[0].get("id")
                if audio_id:
                    audio_url = f"https://audio.tatoeba.org/sentences/{self._lang_to_tatoeba_code(language)}/{sentence_id}.mp3"

            provenance = SourceProvenance(
                source_name="Tatoeba Project",
                source_id=f"tat-{sentence_id}",
                source_url=f"https://tatoeba.org/en/sentences/show/{sentence_id}",
                license=TATOEBA_LICENSE,
            )

            example = NormalizedExample(
                id=provenance.source_id,
                sentence_target=target_text,
                sentence_translation=translation_text,
                audio_url=audio_url,
                provenance=provenance,
            )
            parsed_examples.append(example)

        return parsed_examples

    def fetch_dictionary_entry(self, lemma: str, language: str) -> Optional[NormalizedDictionaryEntry]:
        """Tatoeba is a sentence corpus; returns synthesized entry containing examples."""
        examples = self.fetch_example_sentences(lemma, language, limit=3)
        if not examples:
            return None

        provenance = SourceProvenance(
            source_name="Tatoeba Corpus",
            source_id=f"tat-lem-{lemma.lower()}",
            source_url=f"https://tatoeba.org/en/sentences/search?query={urllib.parse.quote(lemma)}",
            license=TATOEBA_LICENSE,
        )

        return NormalizedDictionaryEntry(
            source_id=provenance.source_id,
            lemma=lemma,
            language=language,
            regional_variety="all",
            part_of_speech="term",
            definitions_target=[f"Uso contextual do termo '{lemma}' no corpus Tatoeba."],
            definitions_en=[f"Contextual usage of '{lemma}' in Tatoeba open corpus."],
            examples=examples,
            provenance=provenance,
        )
