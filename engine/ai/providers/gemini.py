"""
Google Gemini provider adapter.

Uses the ``generativelanguage.googleapis.com`` REST endpoint with the key in
the query string. Structured output is requested via ``responseMimeType`` and
is always re-validated locally by the router/generator layer.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

from ..provider import CapabilityRecord, GenerationRequest, GenerationResult, ProviderUsage
from .base import BaseHttpProvider


class GeminiProvider(BaseHttpProvider):
    provider_id = "gemini"
    api_key_env = "GEMINI_API_KEY"
    default_model = "gemini-1.5-flash"

    def _build_request(
        self, request: GenerationRequest
    ) -> Tuple[str, Dict[str, str], Dict[str, Any]]:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key.strip()}"
        )
        prompt = request.prompt
        if request.response_schema is not None:
            prompt = (
                prompt
                + "\n\nRespond with a single JSON object that conforms to this JSON Schema:\n"
                + json.dumps(request.response_schema, ensure_ascii=False)
            )
        generation_config: Dict[str, Any] = {"temperature": request.temperature}
        if request.max_tokens:
            generation_config["maxOutputTokens"] = request.max_tokens
        if request.response_schema is not None:
            generation_config["responseMimeType"] = "application/json"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": generation_config,
        }
        return url, {}, payload

    def _parse_response(
        self, response: Dict[str, Any], request: GenerationRequest
    ) -> GenerationResult:
        candidates = response.get("candidates") or []
        if not candidates:
            return GenerationResult(
                provider_id=self.provider_id,
                model_id=self.model,
                content=None,
                failure="invalid_response",
            )
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(part.get("text", "") for part in parts)

        usage_metadata = response.get("usageMetadata") or {}
        usage = ProviderUsage(
            provider_id=self.provider_id,
            model_id=self.model,
            prompt_version="default",
            prompt_tokens=int(usage_metadata.get("promptTokenCount", 0) or 0),
            completion_tokens=int(usage_metadata.get("candidatesTokenCount", 0) or 0),
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        return GenerationResult(
            provider_id=self.provider_id,
            model_id=self.model,
            content=text,
            raw=text,
            usage=usage,
        )

    def capability(self, model_id: str) -> CapabilityRecord:
        from ..registry import get_capability

        return get_capability(self.provider_id, model_id)
