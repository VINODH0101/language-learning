"""
Base class for HTTP-based AI provider adapters.
"""

from __future__ import annotations

import os
from abc import abstractmethod
from typing import Any, Callable, Dict, Optional

from ..provider import (
    AIProvider,
    CapabilityRecord,
    FailureCategory,
    GenerationRequest,
    GenerationResult,
    ProviderUsage,
)
from .http import ProviderHttpError, post_json


HttpFn = Callable[..., Dict[str, Any]]


class BaseHttpProvider(AIProvider):
    """Common plumbing for adapters that talk to an HTTP JSON API.

    ``http_fn`` is injectable for tests (defaults to :func:`post_json`).
    ``api_key`` is read from the environment when not passed explicitly and
    never stored in the database, logs, or returned to callers.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        http_fn: HttpFn = post_json,
        timeout: float = 30.0,
    ):
        self.api_key = api_key or self._read_api_key()
        self.model = model or self.default_model
        self.http_fn = http_fn
        self.timeout = timeout

    @property
    @abstractmethod
    def default_model(self) -> str:
        """Default model identifier when none is configured."""

    def _read_api_key(self) -> str:
        return os.getenv(self.api_key_env, "") or ""

    @property
    @abstractmethod
    def api_key_env(self) -> str:
        """Environment variable that holds this provider's API key."""

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    @abstractmethod
    def _build_request(self, request: GenerationRequest) -> tuple[str, Dict[str, str], Dict[str, Any]]:
        """Return (url, headers, payload) for the provider's API."""

    @abstractmethod
    def _parse_response(self, response: Dict[str, Any], request: GenerationRequest) -> GenerationResult:
        """Convert an API response into a normalized GenerationResult."""

    def generate(self, request: GenerationRequest) -> GenerationResult:
        if not self.is_configured:
            return GenerationResult(
                provider_id=self.provider_id,
                model_id=self.model,
                content=None,
                failure=FailureCategory.NOT_CONFIGURED,
            )
        try:
            url, headers, payload = self._build_request(request)
            response = self.http_fn(url=url, headers=headers, payload=payload, timeout=self.timeout)
            return self._parse_response(response, request)
        except ProviderHttpError as exc:
            return GenerationResult(
                provider_id=self.provider_id,
                model_id=self.model,
                content=None,
                failure=exc.category,
            )

    def generate_structured(
        self, request: GenerationRequest, schema: Dict[str, Any]
    ) -> GenerationResult:
        result = self.generate(request)
        if result.failure is not None:
            return result

        from .http import parse_json_text, validate_json_against_schema

        if isinstance(result.content, dict):
            data = result.content
        else:
            data = parse_json_text(result.content)
            if data is None:
                result.failure = FailureCategory.SCHEMA_VIOLATION
                result.content = None
                return result

        errors = validate_json_against_schema(data, schema)
        if errors:
            result.failure = FailureCategory.SCHEMA_VIOLATION
            result.content = None
            return result

        result.content = data
        result.structured = True
        return result

    def health_check(self) -> bool:
        if not self.is_configured:
            return False
        try:
            result = self.generate(
                GenerationRequest(
                    task=self._health_task(),
                    prompt="Respond with the single word 'ok'.",
                    max_tokens=8,
                )
            )
            return result.failure is None
        except Exception:
            return False

    def _health_task(self):
        from ..content_types import GenerationContext, GenerationTask, LanguageContext
        from ..content_types import ContentType, TaskType
        from engine.models.enums import ExplanationLanguage, Language

        return GenerationTask(
            idempotency_key="health-check",
            task_type=TaskType.GENERATE_CONTENT,
            context=GenerationContext(
                content_type=ContentType.VOCABULARY,
                language=LanguageContext(
                    target_language=Language.ENGLISH,
                    explanation_language=ExplanationLanguage.EN,
                ),
            ),
            schema_name="vocabulary",
        )

    def get_usage(self, result: GenerationResult) -> Optional[ProviderUsage]:
        return result.usage

    # Subclasses override these to expose a real capability record.
    @abstractmethod
    def capability(self, model_id: str) -> CapabilityRecord:
        ...
