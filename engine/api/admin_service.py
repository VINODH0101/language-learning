"""
Admin content studio service (Phase 8).

Bridges generation, review, publication, provider monitoring, and discovery
source management. The frontend Admin studio consumes these read models; the
HTTP transport is added later. Drafts are never auto-published: they enter a
review queue and are published only on explicit approval.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from ..ai.content_types import ContentType
from ..ai.discovery_adapters import DiscoverySourceAdapter
from ..ai.generation import ContentDraft
from ..ai.router import DefaultProviderRouter
from ..ai.scheduling import ContentSchedule, GenerationScheduler, InMemoryJobStore
from .content_service import ContentRepository, InMemoryContentRepository
from .models import ContentRecord


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReviewItem(BaseModel):
    id: str
    draft: ContentDraft
    status: ReviewStatus = ReviewStatus.PENDING
    created_at: str = Field(default_factory=_now)
    reviewed_at: Optional[str] = None


class ProviderSnapshot(BaseModel):
    provider_id: str
    model_id: str
    enabled: bool
    priority: int
    health: str
    used_tokens_today: int = 0
    daily_budget_tokens: int = 0
    last_error: Optional[str] = None


class SourceSnapshot(BaseModel):
    source_id: str
    healthy: bool


class AdminOverview(BaseModel):
    pending_review: int = 0
    published: int = 0
    drafts: int = 0
    failed_jobs: int = 0
    providers: List[ProviderSnapshot] = Field(default_factory=list)
    discovery_sources: List[SourceSnapshot] = Field(default_factory=list)


def content_record_from_draft(draft: ContentDraft) -> ContentRecord:
    body = {k: v for k, v in draft.content.items() if k != "meta"}
    return ContentRecord(
        id=str(uuid.uuid4()),
        content_type=draft.content_type,
        target_language=draft.target_language,
        explanation_language=draft.explanation_language,
        cefr_level=draft.cefr_level,
        title=draft.title,
        summary=draft.summary,
        status="published",
        current_version_id=str(uuid.uuid4()),
        estimated_read_minutes=draft.content.get("meta", {}).get("estimated_read_minutes", 1),
        published_at=_now(),
        body=body,
    )


class AdminContentService:
    """Generation config, review queue, publication, and monitoring."""

    def __init__(
        self,
        repository: Optional[ContentRepository] = None,
        router: Optional[DefaultProviderRouter] = None,
        schedules: Optional[List[ContentSchedule]] = None,
        discovery_sources: Optional[List[DiscoverySourceAdapter]] = None,
    ) -> None:
        self.repository = repository or InMemoryContentRepository()
        self.router = router
        self.schedules: List[ContentSchedule] = schedules or []
        self.discovery_sources = discovery_sources or []
        self._reviews: Dict[str, ReviewItem] = {}
        self._draft_count = 0

    # --- Review queue ------------------------------------------------------

    def submit_draft(self, draft: ContentDraft) -> ReviewItem:
        """Route a generated draft into the review queue (no auto-publish)."""
        self._draft_count += 1
        review_id = draft.idempotency_key
        if hasattr(self.repository, "save_draft_for_review"):
            review_id = self.repository.save_draft_for_review(draft)
        item = ReviewItem(id=review_id, draft=draft)
        self._reviews[item.id] = item
        return item

    def pending_reviews(self) -> List[ReviewItem]:
        if hasattr(self.repository, "pending_reviews"):
            rows = self.repository.pending_reviews()
            items: List[ReviewItem] = []
            for row in rows:
                payload = row.get("draft_payload")
                if isinstance(payload, dict):
                    try:
                        draft = ContentDraft(**payload)
                        items.append(
                            ReviewItem(
                                id=str(row["id"]),
                                draft=draft,
                                status=ReviewStatus(row.get("status", "pending")),
                                created_at=str(row.get("created_at") or _now()),
                            )
                        )
                    except Exception:
                        continue
            return items
        return [r for r in self._reviews.values() if r.status == ReviewStatus.PENDING]

    def approve(self, review_id: str) -> Optional[ContentRecord]:
        item = self._reviews.get(review_id)
        if item is None:
            if hasattr(self.repository, "approve_review"):
                return self.repository.approve_review(review_id)
            return None
        if item.status != ReviewStatus.PENDING:
            return None
        if hasattr(self.repository, "approve_review"):
            record = self.repository.approve_review(review_id)
            if record is not None:
                item.status = ReviewStatus.APPROVED
                item.reviewed_at = _now()
                return record
        record = content_record_from_draft(item.draft)
        self.repository.publish(record)
        item.status = ReviewStatus.APPROVED
        item.reviewed_at = _now()
        return record

    def reject(self, review_id: str) -> bool:
        item = self._reviews.get(review_id)
        if item is None:
            if hasattr(self.repository, "reject_review"):
                return self.repository.reject_review(review_id)
            return False
        if hasattr(self.repository, "reject_review"):
            self.repository.reject_review(review_id)
        item.status = ReviewStatus.REJECTED
        item.reviewed_at = _now()
        return True

    # --- Schedules ---------------------------------------------------------

    def set_schedules(self, schedules: List[ContentSchedule]) -> None:
        self.schedules = schedules

    def run_generation(
        self, scheduler: GenerationScheduler, today=None
    ) -> dict:
        """Run the scheduler, routing drafts into the review queue."""
        scheduler.on_review = self.submit_draft
        report = scheduler.run(self.schedules, today=today)
        return report.model_dump()

    # --- Monitoring ---------------------------------------------------------

    def overview(self) -> AdminOverview:
        providers: List[ProviderSnapshot] = []
        if self.router is not None:
            providers = [
                ProviderSnapshot(**snap) for snap in self.router.snapshot()
            ]
        sources = [
            SourceSnapshot(source_id=s.source_id, healthy=s.health_check())
            for s in self.discovery_sources
        ]
        published_count = len(self.repository.published_items())
        return AdminOverview(
            pending_review=len(self.pending_reviews()),
            published=published_count,
            drafts=self._draft_count,
            providers=providers,
            discovery_sources=sources,
        )
