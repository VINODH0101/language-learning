"""
Tests for the AI provider layer (Phase 3).

All network access is injected via a fake ``http_fn``; no real provider is
contacted. Adapters must classify failures, parse usage, and fall back through
the router without fabricating content.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pytest

from engine.ai import (
    AIProvider,
    CapabilityRecord,
    DeepSeekProvider,
    DefaultProviderRouter,
    FailureCategory,
    GenerationResult,
    GenerationRequest,
    GeminiProvider,
    GroqProvider,
    ProviderConfig,
    ProviderUsage,
    get_capability,
)
from engine.ai.content_types import (
    ContentType,
    GenerationContext,
    GenerationTask,
    LanguageContext,
    TaskType,
)
from engine.ai.providers.http import (
    ProviderHttpError,
    parse_json_text,
    validate_json_against_schema,
)
from engine.models.enums import ExplanationLanguage, Language

CONTENT_TYPES = [
    "story", "conversation", "poetry", "grammar", "vocabulary",
    "academic_essay", "cultural_article", "practice",
]


def make_task(content_type: str = "vocabulary") -> GenerationTask:
    return GenerationTask(
        idempotency_key="test-1",
        task_type=TaskType.GENERATE_CONTENT,
        context=GenerationContext(
            content_type=ContentType(content_type),
            language=LanguageContext(
                target_language=Language.ENGLISH,
                explanation_language=ExplanationLanguage.EN,
            ),
            cefr_level="B1",
        ),
        schema_name=content_type,
    )


class FakeProvider(AIProvider):
    def __init__(
        self,
        provider_id: str,
        capability: CapabilityRecord,
        result: Optional[GenerationResult] = None,
    ):
        self._id = provider_id
        self._capability = capability
        self._result = result

    @property
    def provider_id(self) -> str:
        return self._id

    def capability(self, model_id: str) -> CapabilityRecord:
        return self._capability

    def generate(self, request) -> GenerationResult:
        return self._result or GenerationResult(
            provider_id=self._id, model_id="m", content={"title": "ok"}
        )

    def generate_structured(self, request, schema) -> GenerationResult:
        return self.generate(request)

    def health_check(self) -> bool:
        return True

    def get_usage(self, result) -> Optional[ProviderUsage]:
        return result.usage


def capability(priority: int = 10, enabled: bool = True, budget: int = 0) -> CapabilityRecord:
    return CapabilityRecord(
        provider_id="x",
        model_id="m",
        enabled=enabled,
        content_types=CONTENT_TYPES,
        task_types=["generate_content", "enrich", "translate", "validate"],
        priority=priority,
        daily_budget_tokens=budget,
    )


# --- Capability registry -----------------------------------------------------

def test_registry_has_three_providers():
    assert "gemini" in get_capability("gemini", "gemini-1.5-flash").provider_id
    assert get_capability("gemini", "gemini-1.5-flash").supports_json_schema is True
    assert get_capability("groq", "llama-3.3-70b-versatile").supports_json_schema is False
    assert get_capability("deepseek", "deepseek-chat").enabled is True
    # Unknown model -> disabled default.
    assert get_capability("gemini", "nope").enabled is False


# --- Router selection --------------------------------------------------------

def test_router_selects_highest_priority():
    router = DefaultProviderRouter()
    router.register(
        FakeProvider("deepseek", capability(priority=30)),
        ProviderConfig(provider_id="deepseek"),
        "deepseek-chat",
    )
    router.register(
        FakeProvider("gemini", capability(priority=10)),
        ProviderConfig(provider_id="gemini"),
        "gemini-1.5-flash",
    )
    provider = router.select(make_task("story"))
    assert provider is not None
    assert provider.provider_id == "gemini"


def test_router_skips_disabled_provider():
    router = DefaultProviderRouter()
    router.register(
        FakeProvider("gemini", capability(priority=10, enabled=False)),
        ProviderConfig(provider_id="gemini"),
        "gemini-1.5-flash",
    )
    assert router.select(make_task()) is None


def test_router_skips_budget_exhausted():
    router = DefaultProviderRouter()
    router.register(
        FakeProvider("gemini", capability(priority=10, budget=100)),
        ProviderConfig(provider_id="gemini"),
        "gemini-1.5-flash",
    )
    router.record_success(
        "gemini",
        GenerationResult(
            provider_id="gemini",
            model_id="m",
            content=None,
            usage=ProviderUsage(
                provider_id="gemini",
                model_id="m",
                prompt_version="v",
                prompt_tokens=60,
                completion_tokens=60,
            ),
        ),
    )
    assert router.is_budget_exhausted("gemini") is True
    assert router.select(make_task()) is None


# --- Adapters (mocked HTTP) --------------------------------------------------

def _gemini_response() -> Dict[str, Any]:
    return {
        "candidates": [{"content": {"parts": [{"text": "bonjour"}]}}],
        "usageMetadata": {"promptTokenCount": 5, "candidatesTokenCount": 2},
    }


def _openai_response(text: str) -> Dict[str, Any]:
    return {
        "choices": [{"message": {"content": text}}],
        "usage": {"prompt_tokens": 5, "completion_tokens": 2},
    }


def test_gemini_generate_parses_content_and_usage():
    provider = GeminiProvider(
        api_key="k", model="gemini-1.5-flash", http_fn=lambda **kw: _gemini_response()
    )
    result = provider.generate(GenerationRequest(task=make_task(), prompt="hi"))
    assert result.failure is None
    assert result.content == "bonjour"
    assert result.usage is not None
    assert result.usage.prompt_tokens == 5
    assert result.usage.completion_tokens == 2


def test_groq_generate_parses_content():
    provider = GroqProvider(
        api_key="k", model="llama-3.3-70b-versatile", http_fn=lambda **kw: _openai_response("hola")
    )
    result = provider.generate(GenerationRequest(task=make_task(), prompt="hi"))
    assert result.content == "hola"
    assert result.usage.completion_tokens == 2


def test_deepseek_generate_parses_content():
    provider = DeepSeekProvider(
        api_key="k", model="deepseek-chat", http_fn=lambda **kw: _openai_response("olá")
    )
    result = provider.generate(GenerationRequest(task=make_task(), prompt="hi"))
    assert result.content == "olá"


def test_adapter_classifies_rate_limit():
    def _raise(**kw):
        raise ProviderHttpError(FailureCategory.RATE_LIMIT, "429")

    provider = GroqProvider(api_key="k", http_fn=_raise)
    result = provider.generate(GenerationRequest(task=make_task(), prompt="hi"))
    assert result.failure == FailureCategory.RATE_LIMIT
    assert result.content is None


def test_not_configured_returns_failure():
    provider = GeminiProvider(api_key="")
    result = provider.generate(GenerationRequest(task=make_task(), prompt="hi"))
    assert result.failure == FailureCategory.NOT_CONFIGURED


# --- Structured output + local validation ------------------------------------

def test_structured_output_validates_locally():
    provider = GroqProvider(
        api_key="k", http_fn=lambda **kw: _openai_response('{"title": "Hello"}')
    )
    schema = {"type": "object", "required": ["title"]}
    result = provider.generate_structured(
        GenerationRequest(task=make_task(), prompt="hi"), schema
    )
    assert result.failure is None
    assert result.structured is True
    assert result.content == {"title": "Hello"}


def test_structured_output_rejects_schema_violation():
    provider = GroqProvider(
        api_key="k", http_fn=lambda **kw: _openai_response('{"wrong": true}')
    )
    schema = {"type": "object", "required": ["title"]}
    result = provider.generate_structured(
        GenerationRequest(task=make_task(), prompt="hi"), schema
    )
    assert result.failure == FailureCategory.SCHEMA_VIOLATION


def test_parse_json_text_tolerates_fences():
    assert parse_json_text('```json\n{"a":1}\n```') == {"a": 1}
    assert parse_json_text('{"a":1}') == {"a": 1}
    assert parse_json_text("not json") is None


def test_validate_json_against_schema():
    schema = {"type": "object", "required": ["title"]}
    assert validate_json_against_schema({"title": "x"}, schema) == []
    assert "missing required field: title" in validate_json_against_schema({}, schema)
    assert validate_json_against_schema([1], schema) == ["output must be a JSON object"]


# --- Router fallback ---------------------------------------------------------

def test_router_falls_back_and_never_fabricates():
    router = DefaultProviderRouter()
    failing = FakeProvider(
        "gemini",
        capability(priority=10),
        result=GenerationResult(
            provider_id="gemini", model_id="m", content=None,
            failure=FailureCategory.RATE_LIMIT,
        ),
    )
    succeeding = FakeProvider(
        "groq",
        capability(priority=20),
        result=GenerationResult(provider_id="groq", model_id="m", content={"title": "ok"}),
    )
    router.register(failing, ProviderConfig(provider_id="gemini"), "gemini-1.5-flash")
    router.register(succeeding, ProviderConfig(provider_id="groq"), "llama-3.3-70b-versatile")

    result, attempted = router.generate_with_fallback(make_task(), "hi", schema=None)
    assert result is not None
    assert result.provider_id == "groq"
    assert attempted == ["gemini", "groq"]


def test_router_all_fail_returns_failure():
    router = DefaultProviderRouter()
    router.register(
        FakeProvider(
            "gemini",
            capability(priority=10),
            result=GenerationResult(
                provider_id="gemini", model_id="m", content=None,
                failure=FailureCategory.PROVIDER_UNAVAILABLE,
            ),
        ),
        ProviderConfig(provider_id="gemini"),
        "gemini-1.5-flash",
    )
    result, attempted = router.generate_with_fallback(make_task(), "hi", schema=None)
    assert result is not None
    assert result.failure == FailureCategory.PROVIDER_UNAVAILABLE
    assert attempted == ["gemini"]


def test_router_recovers_after_transient_cooldown():
    now = [100.0]
    router = DefaultProviderRouter(cooldown_seconds=30.0, clock=lambda: now[0])
    router.register(
        FakeProvider("gemini", capability(priority=10)),
        ProviderConfig(provider_id="gemini"),
        "gemini-1.5-flash",
    )
    router.record_failure("gemini", FailureCategory.RATE_LIMIT)
    assert router.select(make_task("story")) is None

    now[0] = 131.0
    recovered = router.select(make_task("story"))
    assert recovered is not None
    assert recovered.provider_id == "gemini"

    # Authentication failures remain blocked without automatic recovery.
    router.record_failure("gemini", FailureCategory.AUTHENTICATION)
    now[0] = 500.0
    assert router.select(make_task("story")) is None


def test_validate_json_against_schema_nested_properties():
    schema = {
        "type": "object",
        "required": ["dialogue"],
        "properties": {
            "dialogue": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["speaker", "line"],
                },
            }
        },
    }
    assert validate_json_against_schema({"dialogue": [{"speaker": "A"}]}, schema) != []
    assert validate_json_against_schema({"dialogue": [{"speaker": "A", "line": "Hi"}]}, schema) == []
