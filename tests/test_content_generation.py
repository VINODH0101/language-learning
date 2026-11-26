"""
Tests for the content generation engine (Phase 4).

No network or database access. Providers are faked or omitted entirely; the
deterministic fallback guarantees a valid draft for every content type.
"""

from __future__ import annotations

from typing import Any, Dict

import pytest

from engine.ai import (
    AIProvider,
    CapabilityRecord,
    DefaultProviderRouter,
    FailureCategory,
    GenerationResult,
    ProviderConfig,
)
from engine.ai.content_types import (
    ContentType,
    GenerationContext,
    GenerationTask,
    LanguageContext,
    TaskType,
)
from engine.ai.dedupe import DuplicateDetector
from engine.ai.generation import ContentGenerationEngine
from engine.models.enums import ExplanationLanguage, Language

CONTENT_TYPES = list(ContentType)


def make_task(content_type: str, target: Language = Language.PORTUGUESE) -> GenerationTask:
    return GenerationTask(
        idempotency_key=f"test-{content_type}",
        task_type=TaskType.GENERATE_CONTENT,
        context=GenerationContext(
            content_type=ContentType(content_type),
            language=LanguageContext(
                target_language=target,
                explanation_language=ExplanationLanguage.EN,
            ),
            cefr_level="B1",
            topic="coffee",
        ),
        schema_name=content_type,
    )


class FakeProvider(AIProvider):
    def __init__(self, body: Dict[str, Any] | None, failure: FailureCategory | None = None):
        self._body = body
        self._failure = failure

    @property
    def provider_id(self) -> str:
        return "fake"

    def capability(self, model_id: str) -> CapabilityRecord:
        return CapabilityRecord(
            provider_id="fake",
            model_id="fake-model",
            enabled=True,
            content_types=[c.value for c in ContentType],
            task_types=["generate_content", "enrich", "translate", "validate"],
            priority=1,
        )

    def generate(self, request) -> GenerationResult:
        if self._failure:
            return GenerationResult(
                provider_id="fake", model_id="fake-model", content=None, failure=self._failure
            )
        return GenerationResult(
            provider_id="fake", model_id="fake-model", content=self._body
        )

    def generate_structured(self, request, schema) -> GenerationResult:
        return self.generate(request)

    def health_check(self) -> bool:
        return True

    def get_usage(self, result):
        return None


# --- Deterministic fallback covers all eight types ---------------------------

@pytest.mark.parametrize("content_type", CONTENT_TYPES)
def test_every_type_generates_valid_draft_without_provider(content_type):
    engine = ContentGenerationEngine()
    outcome = engine.generate(make_task(content_type))
    assert outcome.success is True
    assert outcome.used_fallback is True
    assert outcome.draft is not None
    assert outcome.draft.content_type == content_type
    assert outcome.draft.validation.passed is True


def test_language_metadata_is_injected_not_trusted_from_model():
    engine = ContentGenerationEngine()
    task = make_task("story", target=Language.SPANISH)
    outcome = engine.generate(task)
    assert outcome.draft is not None
    meta = outcome.draft.content["meta"]
    assert meta["target_language"] == "es"
    assert meta["explanation_language"] == "en"
    assert meta["cefr_level"] == "B1"


# --- Provider path -----------------------------------------------------------

def _valid_story_body() -> Dict[str, Any]:
    return {
        "narrative": "A short story about coffee.",
        "comprehension_questions": [{"question": "What is it about?", "answer": "Coffee"}],
    }


def test_provider_body_used_when_valid():
    router = DefaultProviderRouter()
    router.register(
        FakeProvider(_valid_story_body()),
        ProviderConfig(provider_id="fake"),
        "fake-model",
    )
    engine = ContentGenerationEngine(router=router)
    outcome = engine.generate(make_task("story"))
    assert outcome.success is True
    assert outcome.used_fallback is False
    assert outcome.draft.provider == "fake"


def test_provider_failure_uses_deterministic_fallback():
    router = DefaultProviderRouter()
    router.register(
        FakeProvider(None, failure=FailureCategory.PROVIDER_UNAVAILABLE),
        ProviderConfig(provider_id="fake"),
        "fake-model",
    )
    engine = ContentGenerationEngine(router=router)
    outcome = engine.generate(make_task("story"))
    assert outcome.success is True
    assert outcome.used_fallback is True
    assert outcome.draft.provider == "deterministic"


def test_invalid_provider_body_falls_back_deterministically():
    router = DefaultProviderRouter()
    router.register(
        FakeProvider({"wrong_field": True}),
        ProviderConfig(provider_id="fake"),
        "fake-model",
    )
    engine = ContentGenerationEngine(router=router)
    outcome = engine.generate(make_task("story"))
    assert outcome.success is True
    assert outcome.used_fallback is True


# --- Deduplication -----------------------------------------------------------

def test_duplicate_detection_blocks_second_draft():
    engine = ContentGenerationEngine(dedupe=DuplicateDetector())
    task = make_task("poetry")
    first = engine.generate(task)
    second = engine.generate(task)
    assert first.success is True
    assert second.success is False
    assert second.duplicate is True


def test_deterministic_fallback_respects_target_and_explanation_languages():
    engine = ContentGenerationEngine()
    pt_task = make_task("story", target=Language.PORTUGUESE)
    es_task = make_task("story", target=Language.SPANISH)
    pt_draft = engine.generate(pt_task).draft
    es_draft = engine.generate(es_task).draft
    assert pt_draft is not None and es_draft is not None
    assert pt_draft.content["narrative"] != es_draft.content["narrative"]
    assert "manhã" in pt_draft.content["narrative"].lower()
    assert "mañana" in es_draft.content["narrative"].lower()


def test_validator_rejects_nested_schema_violations():
    from engine.ai.validation import ContentValidator

    validator = ContentValidator()
    bad_conversation = {
        "meta": {
            "content_type": "conversation",
            "target_language": "pt",
            "explanation_language": "en",
            "cefr_level": "B1",
            "title": "Café",
            "summary": "Ordering coffee",
        },
        "scenario": "Ordering coffee",
        "dialogue": [{"speaker": "A"}],  # missing 'line'
    }
    report = validator.validate("conversation", bad_conversation)
    assert report.passed is False
    assert any("line" in err for err in report.errors)
