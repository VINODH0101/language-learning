"""
Content generation engine (Phase 4).

Orchestrates: prompt assembly -> provider generation (with deterministic
fallback) -> enrichment -> validation -> deduplication -> draft storage.
Output is a *draft*; it is never auto-published.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .content_types import ContentType, GenerationTask
from .dedupe import DuplicateDetector
from .enrichment import enrich, _extract_text
from .fallback import DeterministicContentFallback
from .prompts import body_schema, build_prompt
from .provider import FailureCategory, ProviderRouter, ProviderUsage
from .validation import ContentValidator, ValidationReport


class ContentDraft(BaseModel):
    """A validated, enriched, non-published draft ready for storage/review."""

    idempotency_key: str
    content_type: str
    target_language: str
    explanation_language: str
    cefr_level: str
    title: str
    summary: str
    content: Dict[str, Any]
    validation: ValidationReport
    provider: str
    model: Optional[str] = None
    status: str = "draft"


class GenerationOutcome(BaseModel):
    success: bool
    draft: Optional[ContentDraft] = None
    failure: Optional[FailureCategory] = None
    validation: Optional[ValidationReport] = None
    attempted_providers: List[str] = Field(default_factory=list)
    used_fallback: bool = False
    duplicate: bool = False
    usage: Optional[ProviderUsage] = None


def _derive_title(content_type: str, body: Dict[str, Any], topic: str) -> str:
    if content_type == "vocabulary" and body.get("lemma"):
        return str(body["lemma"])
    if content_type == "grammar" and body.get("grammar_topic"):
        return str(body["grammar_topic"])
    if content_type == "conversation" and body.get("scenario"):
        return str(body["scenario"])
    if content_type == "practice" and body.get("skill"):
        return f"{body['skill']} practice"
    return topic or f"{content_type.replace('_', ' ').title()}"


class ContentGenerationEngine:
    """Centralized generation for all eight content types."""

    def __init__(
        self,
        router: Optional[ProviderRouter] = None,
        dedupe: Optional[DuplicateDetector] = None,
        validator: Optional[ContentValidator] = None,
        fallback: Optional[DeterministicContentFallback] = None,
    ) -> None:
        self.router = router
        self.dedupe = dedupe
        self.validator = validator or ContentValidator()
        self.fallback = fallback or DeterministicContentFallback()

    def generate(self, task: GenerationTask) -> GenerationOutcome:
        ctx = task.context
        content_type = ctx.content_type.value
        topic = ctx.topic or ""

        body: Optional[Dict[str, Any]] = None
        provider = "deterministic"
        model: Optional[str] = None
        attempted: List[str] = []
        used_fallback = False
        usage: Optional[ProviderUsage] = None

        if self.router is not None:
            prompt = build_prompt(
                content_type,
                ctx.language.target_language.value,
                ctx.language.explanation_language.value,
                ctx.cefr_level,
                topic,
            )
            result, attempted = self.router.generate_with_fallback(
                task, prompt, body_schema(content_type)
            )
            if result is not None:
                usage = result.usage
            if result is not None and result.failure is None and isinstance(result.content, dict):
                body = result.content
                provider = result.provider_id
                model = result.model_id

        if body is None:
            body = self._build_fallback(content_type, topic, ctx)
            used_fallback = True

        content, report = self._build_content(task, body)

        # Provider output failed validation: retry deterministically so the
        # learner platform remains usable and no invalid content is published.
        if not report.passed and not used_fallback:
            body = self._build_fallback(content_type, topic, ctx)
            used_fallback = True
            provider = "deterministic"
            model = None
            content, report = self._build_content(task, body)

        if not report.passed:
            return GenerationOutcome(
                success=False,
                failure=FailureCategory.SCHEMA_VIOLATION,
                validation=report,
                attempted_providers=attempted,
                used_fallback=used_fallback,
            )

        if self.dedupe is not None and self.dedupe.is_duplicate(content_type, content):
            return GenerationOutcome(
                success=False,
                duplicate=True,
                attempted_providers=attempted,
                used_fallback=used_fallback,
            )

        if self.dedupe is not None:
            self.dedupe.register(content_type, content)

        meta = content["meta"]
        draft = ContentDraft(
            idempotency_key=task.idempotency_key,
            content_type=content_type,
            target_language=meta["target_language"],
            explanation_language=meta["explanation_language"],
            cefr_level=meta["cefr_level"],
            title=meta["title"],
            summary=meta["summary"],
            content=content,
            validation=report,
            provider=provider,
            model=model,
            status="draft",
        )

        return GenerationOutcome(
            success=True,
            draft=draft,
            attempted_providers=attempted,
            used_fallback=used_fallback,
            usage=usage,
        )

    def _build_fallback(self, content_type: str, topic: str, ctx: Any) -> Dict[str, Any]:
        try:
            return self.fallback.build(
                content_type,
                topic,
                target_language=ctx.language.target_language.value,
                explanation_language=ctx.language.explanation_language.value,
                cefr_level=ctx.cefr_level,
            )
        except TypeError:
            return self.fallback.build(content_type, topic)

    def _build_content(
        self, task: GenerationTask, body: Dict[str, Any]
    ) -> tuple[Dict[str, Any], ValidationReport]:
        ctx = task.context
        content_type = ctx.content_type.value
        target = ctx.language.target_language.value
        explanation = ctx.language.explanation_language.value
        cefr = ctx.cefr_level

        meta: Dict[str, Any] = {
            "content_type": content_type,
            "target_language": target,
            "explanation_language": explanation,
            "cefr_level": cefr,
            "title": _derive_title(content_type, body, ctx.topic or ""),
            "summary": _extract_text(body, content_type)[:140],
        }
        content = {"meta": meta, **body}
        content = enrich(content_type, content)
        report = self.validator.validate(content_type, content)
        return content, report
