"""
Polyglot C1 Daily — Modular Educational Source Adapters Base Architecture.

Provides abstract adapters, provenance metadata models, rate-limiting,
exponential backoff, content normalization, and offline fixture fallbacks.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
import unicodedata
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class LicenseMetadata(BaseModel):
    """Explicit legal licensing metadata for educational resources."""
    license_name: str
    license_url: str
    attribution_text: str
    derivative_permitted: bool = True
    commercial_permitted: bool = False
    requires_share_alike: bool = False


class SourceProvenance(BaseModel):
    """Provenance tracking for each imported linguistic or media record."""
    source_name: str
    source_id: str
    source_url: str
    license: LicenseMetadata
    imported_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version_or_hash: Optional[str] = None
    modifications: List[str] = Field(default_factory=list)


class NormalizedExample(BaseModel):
    """Authentic example sentence paired with target and translation."""
    id: str
    sentence_target: str
    sentence_translation: str
    audio_url: Optional[str] = None
    transcription_ipa: Optional[str] = None
    provenance: SourceProvenance


class NormalizedDictionaryEntry(BaseModel):
    """Normalized educational dictionary entry with phonetic and usage information."""
    source_id: str
    lemma: str
    language: str  # 'pt' or 'es'
    regional_variety: str  # 'all', 'pt-BR', 'pt-PT', 'es-ES', 'es-419'
    part_of_speech: str
    cefr_level_estimate: Optional[str] = None
    phonetic_ipa: Optional[str] = None
    audio_url: Optional[str] = None
    definitions_target: List[str]
    definitions_en: List[str]
    collocations: List[str] = Field(default_factory=list)
    examples: List[NormalizedExample] = Field(default_factory=list)
    provenance: SourceProvenance


def normalize_text(text: str) -> str:
    """Normalize whitespace, quotes, and Unicode NFC."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFC", text.strip())
    # Replace curly quotes and apostrophes with standard forms
    normalized = re.sub(r'[\u2018\u2019]', "'", normalized)
    normalized = re.sub(r'[\u201C\u201D]', '"', normalized)
    # Collapse multiple whitespace characters
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.strip()


class BaseSourceAdapter(ABC):
    """
    Abstract base class for external educational source adapters.
    Includes rate-limiting, bounded retries, local caching, and offline fallback.
    """

    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        fixture_dir: Optional[Path] = None,
        request_delay_seconds: float = 0.5,
        max_retries: int = 3,
        timeout_seconds: float = 8.0,
        offline_mode: bool = False,
    ):
        self.request_delay = request_delay_seconds
        self.max_retries = max_retries
        self.timeout = timeout_seconds
        self.offline_mode = offline_mode
        self.last_request_time = 0.0

        root_dir = Path(__file__).resolve().parent
        self.cache_dir = cache_dir or (root_dir / ".cache")
        self.fixture_dir = fixture_dir or (root_dir / "fixtures")

        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.fixture_dir.mkdir(parents=True, exist_ok=True)

    def _rate_limit(self) -> None:
        """Enforce polite crawling delay between external requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)
        self.last_request_time = time.time()

    def _get_cache_path(self, cache_key: str) -> Path:
        """Return file path for a given cache key."""
        safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', cache_key)[:64]
        return self.cache_dir / f"{safe_name}.json"

    def _read_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Read data from local cache if present."""
        path = self._get_cache_path(cache_key)
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error reading cache {path}: {e}")
        return None

    def _write_cache(self, cache_key: str, data: Dict[str, Any]) -> None:
        """Write fetched data to local cache."""
        path = self._get_cache_path(cache_key)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Error writing cache {path}: {e}")

    def _fetch_url_json(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        cache_key: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch JSON from URL with rate limiting, bounded exponential retries,
        caching, and offline tolerance.
        """
        if cache_key:
            cached = self._read_cache(cache_key)
            if cached is not None:
                return cached

        if self.offline_mode:
            logger.info(f"Offline mode active; skipping remote request to {url}")
            return None

        default_headers = {
            "User-Agent": "PolyglotC1DailyBot/1.0 (Educational Language Learning Research; contact@polyglot.dev)"
        }
        if headers:
            default_headers.update(headers)

        req = Request(url, headers=default_headers)

        for attempt in range(1, self.max_retries + 1):
            self._rate_limit()
            try:
                with urlopen(req, timeout=self.timeout) as resp:
                    if resp.status == 200:
                        content_type = resp.headers.get("Content-Type", "")
                        raw_data = resp.read().decode("utf-8")
                        parsed = json.loads(raw_data)
                        if cache_key:
                            self._write_cache(cache_key, parsed)
                        return parsed
                    logger.warning(f"HTTP {resp.status} fetching {url}")
            except HTTPError as e:
                if e.code == 404:
                    logger.debug(f"Resource not found (404) at {url}")
                    return None
                elif e.code == 429:
                    retry_after = float(e.headers.get("Retry-After", 2 ** attempt))
                    logger.warning(f"Rate limited (429) on {url}. Backing off for {retry_after}s.")
                    time.sleep(retry_after)
                else:
                    logger.warning(f"HTTPError {e.code} for {url} (attempt {attempt}/{self.max_retries})")
            except (URLError, TimeoutError) as e:
                logger.warning(f"Network error {e} for {url} (attempt {attempt}/{self.max_retries})")
            except json.JSONDecodeError as e:
                logger.warning(f"Malformed JSON from {url}: {e}")
                return None

            # Exponential backoff on retries
            if attempt < self.max_retries:
                time.sleep(0.5 * (2 ** (attempt - 1)))

        return None

    @abstractmethod
    def fetch_dictionary_entry(self, lemma: str, language: str) -> Optional[NormalizedDictionaryEntry]:
        """Fetch dictionary entry with definitions, IPA, and provenance."""
        pass

    @abstractmethod
    def fetch_example_sentences(self, query: str, language: str, limit: int = 5) -> List[NormalizedExample]:
        """Fetch authentic example sentences with translation and attribution."""
        pass
