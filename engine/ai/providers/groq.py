"""
Groq provider adapter (OpenAI-compatible chat completions).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Tuple

from ..provider import CapabilityRecord, GenerationRequest, GenerationResult, ProviderUsage
from .base import BaseHttpProvider


class GroqProvider(BaseHttpProvider):
    provider_id = "groq"
    api_key_env = "GROQ_API_KEY"
    default_model = "llama-3.3-70b-versatile"

    def _build_request(
        self, request: GenerationRequest
    ) -> Tuple[str, Dict[str, str], Dict[str, Any]]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key.strip()}"}
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": "user", "content": request.prompt}],
            "temperature": request.temperature,
        }
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens
        if request.response_schema is not None:
            payload["response_format"] = {"type": "json_object"}
        return url, headers, payload

    def _parse_response(
        self, response: Dict[str, Any], request: GenerationRequest
    ) -> GenerationResult:
        choices = response.get("choices") or []
        content = None
        if choices:
            content = choices[0].get("message", {}).get("content")

        usage_meta = response.get("usage") or {}
        usage = ProviderUsage(
            provider_id=self.provider_id,
            model_id=self.model,
            prompt_version="default",
            prompt_tokens=int(usage_meta.get("prompt_tokens", 0) or 0),
            completion_tokens=int(usage_meta.get("completion_tokens", 0) or 0),
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        return GenerationResult(
            provider_id=self.provider_id,
            model_id=self.model,
            content=content,
            raw=content,
            usage=usage,
        )

    def capability(self, model_id: str) -> CapabilityRecord:
        from ..registry import get_capability

        return get_capability(self.provider_id, model_id)
