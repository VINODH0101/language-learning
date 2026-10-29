"""
Polyglot C1 Daily — Wikimedia Commons Educational Media Adapter.

Retrieves verified native pronunciation audio files and metadata
from Wikimedia Commons under open licenses (Public Domain, CC-BY-SA).
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

WIKIMEDIA_COMMONS_LICENSE = LicenseMetadata(
    license_name="CC-BY-SA-4.0",
    license_url="https://creativecommons.org/licenses/by-sa/4.0/",
    attribution_text="Audio pronunciation from Wikimedia Commons, contributed under Creative Commons licenses.",
    derivative_permitted=True,
    commercial_permitted=True,
    requires_share_alike=True,
)


class WikimediaCommonsAdapter(BaseSourceAdapter):
    """
    Adapter for querying pronunciation audio clips from Wikimedia Commons.
    """

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def _load_fixtures(self, lemma: str, language: str) -> Optional[str]:
        """Check fixture for known Wikimedia audio file."""
        fixture_file = self.fixture_dir / "wikimedia_fixtures.json"
        if fixture_file.exists():
            try:
                with open(fixture_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    key = f"{language}:{normalize_text(lemma).lower()}"
                    return data.get(key)
            except Exception as e:
                logger.warning(f"Error loading Wikimedia fixture {fixture_file}: {e}")
        return None

    def fetch_audio_url(self, lemma: str, language: str, regional_variety: str = "all") -> Optional[str]:
        """
        Search Wikimedia Commons for standard pronunciation files:
        e.g., File:Pt-br-{lemma}.ogg or File:Es-{lemma}.ogg
        """
        clean_lemma = normalize_text(lemma).lower()

        # Check offline fixture first
        fixture_url = self._load_fixtures(clean_lemma, language)
        if fixture_url:
            return fixture_url

        if self.offline_mode:
            return None

        # Build search patterns
        candidate_files = []
        if language == "pt":
            if regional_variety in ["pt-BR", "all"]:
                candidate_files.append(f"Pt-br-{clean_lemma}.ogg")
            if regional_variety in ["pt-PT", "all"]:
                candidate_files.append(f"Pt-pt-{clean_lemma}.ogg")
            candidate_files.append(f"Pt-{clean_lemma}.ogg")
        else:
            if regional_variety in ["es-ES", "all"]:
                candidate_files.append(f"Es-{clean_lemma}.ogg")
            candidate_files.append(f"Es-es-{clean_lemma}.ogg")

        for filename in candidate_files:
            cache_key = f"wikimedia_{filename}"
            api_url = (
                f"https://commons.wikimedia.org/w/api.php?action=query&titles=File:{urllib.parse.quote(filename)}"
                f"&prop=imageinfo&iiprop=url|extmetadata&format=json"
            )
            resp = self._fetch_url_json(api_url, cache_key=cache_key)
            if resp and "query" in resp and "pages" in resp["query"]:
                pages = resp["query"]["pages"]
                for page_id, page_data in pages.items():
                    if page_id != "-1" and "imageinfo" in page_data:
                        imageinfo = page_data["imageinfo"]
                        if imageinfo and len(imageinfo) > 0:
                            return imageinfo[0].get("url")

        return None

    def fetch_dictionary_entry(self, lemma: str, language: str) -> Optional[NormalizedDictionaryEntry]:
        """Wikimedia Commons is an audio/media repository, not a dictionary."""
        return None

    def fetch_example_sentences(self, query: str, language: str, limit: int = 5) -> List[NormalizedExample]:
        """Wikimedia Commons is an audio/media repository, not a text corpus."""
        return []
