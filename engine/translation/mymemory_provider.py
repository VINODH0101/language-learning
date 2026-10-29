"""
Polyglot C1 Daily — MyMemory Translation API Adapter.

Integrates the free-tier MyMemory open translation memory service
(https://mymemory.translated.net) for sentence and discourse translations.
Explicitly flags results as machine-translated / approximate (`is_verified=False`).
"""

from __future__ import annotations

import json
import logging
import urllib.parse
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .base import BaseTranslationProvider
from .models import TranslationRequest, TranslationResponse

logger = logging.getLogger(__name__)


class MyMemoryTranslationProvider(BaseTranslationProvider):
    """External free-tier translation memory provider."""

    def __init__(self, timeout_seconds: float = 5.0):
        self.timeout = timeout_seconds

    @property
    def provider_name(self) -> str:
        return "mymemory"

    def translate(self, request: TranslationRequest) -> Optional[TranslationResponse]:
        text = request.source_text.strip()
        if not text:
            return None

        src = request.source_lang.lower()
        tgt = request.target_lang.lower()

        # Build request parameters
        encoded_text = urllib.parse.quote(text)
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair={src}|{tgt}"

        req = Request(
            url,
            headers={
                "User-Agent": "PolyglotC1DailyBot/1.0 (Educational Language Learning Research; contact@polyglot.dev)",
                "Accept": "application/json",
            },
        )

        try:
            with urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    response_data = data.get("responseData", {})
                    translated = response_data.get("translatedText")

                    if translated and translated.strip() and not translated.startswith("MYMEMORY WARNING"):
                        match_score = float(response_data.get("match", 0.7))
                        confidence = min(1.0, max(0.5, match_score if match_score <= 1.0 else match_score / 100.0))

                        return TranslationResponse(
                            translated_text=translated.strip(),
                            source_lang=src,
                            target_lang=tgt,
                            provider_name=self.provider_name,
                            is_verified=False,
                            is_approximate=True,
                            confidence=round(confidence, 2),
                            notes="Tradução automática fornecida por memória de tradução pública (MyMemory).",
                            from_cache=False,
                        )
                    else:
                        logger.debug(f"MyMemory returned warning or empty translation: {data.get('responseDetails')}")
        except HTTPError as e:
            logger.warning(f"MyMemory HTTP {e.code} during translation: {e}")
        except (URLError, TimeoutError) as e:
            logger.warning(f"MyMemory network error or timeout: {e}")
        except Exception as e:
            logger.warning(f"Unexpected error in MyMemory provider: {e}")

        return None
