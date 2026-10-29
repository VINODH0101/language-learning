"""
Polyglot C1 Daily — LibreTranslate Open-Source Translation Adapter.

Integrates LibreTranslate (https://libretranslate.com) instances configured via
the `LIBRETRANSLATE_URL` environment variable. If unconfigured, silently skips.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .base import BaseTranslationProvider
from .models import TranslationRequest, TranslationResponse

logger = logging.getLogger(__name__)


class LibreTranslateProvider(BaseTranslationProvider):
    """Adapter for open-source LibreTranslate servers."""

    def __init__(self, endpoint_url: Optional[str] = None, timeout_seconds: float = 4.0):
        self.endpoint_url = (endpoint_url or os.environ.get("LIBRETRANSLATE_URL", "")).rstrip("/")
        self.api_key = os.environ.get("LIBRETRANSLATE_API_KEY", "")
        self.timeout = timeout_seconds

    @property
    def provider_name(self) -> str:
        return "libretranslate"

    def translate(self, request: TranslationRequest) -> Optional[TranslationResponse]:
        if not self.endpoint_url:
            return None

        url = f"{self.endpoint_url}/translate"
        payload = {
            "q": request.source_text.strip(),
            "source": request.source_lang.lower(),
            "target": request.target_lang.lower(),
            "format": "text",
        }
        if self.api_key:
            payload["api_key"] = self.api_key

        req = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "PolyglotC1DailyBot/1.0",
            },
            method="POST",
        )

        try:
            with urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    translated = data.get("translatedText")
                    if translated and translated.strip():
                        return TranslationResponse(
                            translated_text=translated.strip(),
                            source_lang=request.source_lang,
                            target_lang=request.target_lang,
                            provider_name=self.provider_name,
                            is_verified=False,
                            is_approximate=True,
                            confidence=0.85,
                            notes="Tradução automática fornecida por LibreTranslate de código aberto.",
                            from_cache=False,
                        )
        except (HTTPError, URLError, TimeoutError) as e:
            logger.warning(f"LibreTranslate unavailable at {self.endpoint_url}: {e}")
        except Exception as e:
            logger.warning(f"Unexpected error in LibreTranslate: {e}")

        return None
