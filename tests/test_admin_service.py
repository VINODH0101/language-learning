"""
Tests for the Admin Content Studio service (Phase 8).
"""

from __future__ import annotations

from engine.ai import (
    ContentGenerationEngine,
    ContentSchedule,
    DefaultProviderRouter,
    GenerationScheduler,
    InMemoryJobStore,
    ProviderConfig,
    FrequencyListAdapter,
)
from engine.ai.generation import ContentDraft, ValidationReport
from engine.api import (
    AdminContentService,
    ContentAccessService,
    ReviewStatus,
    content_record_from_draft,
)


def _draft(content_type="story", idempotency_key="k1") -> ContentDraft:
    return ContentDraft(
        idempotency_key=idempotency_key,
        content_type=content_type,
        target_language="pt",
        explanation_language="en",
        cefr_level="B1",
        title="Uma história",
        summary="Resumo",
        content={"meta": {"target_language": "pt"}, "narrative": "Era uma vez"},
        validation=ValidationReport(passed=True),
        provider="deterministic",
        status="draft",
    )


def test_draft_enters_review_not_published():
    service = AdminContentService()
    review = service.submit_draft(_draft())
    assert review.status == ReviewStatus.PENDING
    assert service.overview().published == 0
    assert service.overview().pending_review == 1


def test_approve_publishes_and_is_visible_via_content_api():
    service = AdminContentService()
    review = service.submit_draft(_draft("story", "k1"))
    record = service.approve(review.id)
    assert record is not None

    content = ContentAccessService(service.repository)
    assert content.get_content(record.id) is not None
    assert service.overview().published == 1


def test_reject_keeps_unpublished():
    service = AdminContentService()
    review = service.submit_draft(_draft())
    assert service.reject(review.id) is True
    assert service.overview().published == 0
    assert service.overview().pending_review == 0


def test_run_generation_routes_drafts_to_review():
    service = AdminContentService(
        schedules=[ContentSchedule(id="s1", content_type="story", target_language="pt",
                                    explanation_language="en", cefr_level="B1", daily_limit=1)],
    )
    scheduler = GenerationScheduler(ContentGenerationEngine(), InMemoryJobStore())
    report = service.run_generation(scheduler)
    assert report["jobs_completed"] == 1
    assert service.overview().pending_review == 1


def test_overview_reports_providers_and_sources():
    router = DefaultProviderRouter()
    router.register(
        _FakeProvider(), ProviderConfig(provider_id="gemini"), "gemini-1.5-flash"
    )
    service = AdminContentService(router=router, discovery_sources=[FrequencyListAdapter()])
    overview = service.overview()
    assert len(overview.providers) == 1
    assert overview.providers[0].provider_id == "gemini"
    assert overview.discovery_sources[0].healthy is True


def test_content_record_from_draft_drops_meta_from_body():
    draft = _draft()
    record = content_record_from_draft(draft)
    assert record.status == "published"
    assert "meta" not in record.body
    assert record.body.get("narrative") == "Era uma vez"


class _FakeProvider:
    # Lightweight stand-in used only for router registration; capability comes
    # from the built-in registry.
    provider_id = "gemini"

    def capability(self, model_id):
        from engine.ai.registry import get_capability

        return get_capability("gemini", model_id)
