"""
Scheduling, coverage planning, and job management (Phase 5).

The database remains the authoritative source of schedules and jobs in the
target architecture; this module provides an in-memory store behind a clean
interface so a Supabase-backed store can replace it later. Idempotency keys,
daily limits, and bounded retries prevent duplicate generation.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from datetime import date
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from pydantic import BaseModel, Field

from .content_types import ContentType, GenerationContext, GenerationTask, LanguageContext, TaskType
from .generation import ContentDraft, ContentGenerationEngine, GenerationOutcome
from .provider import FailureCategory, ProviderUsage
from engine.models.enums import ExplanationLanguage, Language


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ContentSchedule(BaseModel):
    id: str
    content_type: str
    target_language: str
    explanation_language: str
    cefr_level: str
    enabled: bool = True
    frequency_days: int = 1  # 1 = daily, 7 = weekly, etc.
    daily_limit: int = 3
    topic: str = ""


DEFAULT_SCHEDULES: List[Dict[str, Any]] = [
    {"id": "story-pt-b1", "content_type": "story", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 1, "daily_limit": 1},
    {"id": "conversation-pt-b1", "content_type": "conversation", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 1, "daily_limit": 1},
    {"id": "poetry-pt-b1", "content_type": "poetry", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 3, "daily_limit": 1},
    {"id": "grammar-pt-b1", "content_type": "grammar", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 3, "daily_limit": 1},
    {"id": "vocabulary-pt-b1", "content_type": "vocabulary", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 1, "daily_limit": 2},
    {"id": "academic-essay-pt-b1", "content_type": "academic_essay", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 7, "daily_limit": 1},
    {"id": "cultural-article-pt-b1", "content_type": "cultural_article", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 3, "daily_limit": 1},
    {"id": "practice-pt-b1", "content_type": "practice", "target_language": "pt", "explanation_language": "en", "cefr_level": "B1", "frequency_days": 1, "daily_limit": 1},
]


def default_schedules() -> List[ContentSchedule]:
    return [ContentSchedule(**item) for item in DEFAULT_SCHEDULES]


class JobAttempt(BaseModel):
    attempt_number: int
    provider_id: Optional[str] = None
    failure: Optional[FailureCategory] = None
    error: Optional[str] = None
    created_at: str = Field(default_factory=lambda: date.today().isoformat())


class GenerationJob(BaseModel):
    id: str
    idempotency_key: str
    schedule_id: str
    content_type: str
    target_language: str
    explanation_language: str
    cefr_level: str
    topic: str = ""
    status: JobStatus = JobStatus.PENDING
    attempts: List[JobAttempt] = Field(default_factory=list)
    draft: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: date.today().isoformat())
    updated_at: str = Field(default_factory=lambda: date.today().isoformat())


class SchedulerRunReport(BaseModel):
    jobs_planned: int = 0
    jobs_created: int = 0
    jobs_completed: int = 0
    jobs_failed: int = 0
    jobs_duplicate: int = 0
    fallbacks_used: int = 0
    skipped_idempotent: int = 0
    skipped_budget: int = 0
    skipped_disabled: int = 0
    errors: List[str] = Field(default_factory=list)


def canonical_coverage_key(
    content_type: str,
    target: str,
    cefr: str,
    explanation_language: str = "",
    topic: str = "",
) -> str:
    parts = [content_type, target, cefr]
    if explanation_language:
        parts.append(explanation_language)
    if topic:
        parts.append(topic.strip().lower())
    return ":".join(parts)


class JobStore(ABC):
    @abstractmethod
    def has_idempotency_key(self, key: str) -> bool: ...

    @abstractmethod
    def save_job(self, job: GenerationJob) -> None: ...

    @abstractmethod
    def get_job(self, job_id: str) -> Optional[GenerationJob]: ...

    @abstractmethod
    def completed_coverage(self) -> set[str]: ...


class InMemoryJobStore(JobStore):
    def __init__(self) -> None:
        self._jobs: Dict[str, GenerationJob] = {}
        self._by_idempotency: Dict[str, str] = {}

    def has_idempotency_key(self, key: str) -> bool:
        return key in self._by_idempotency

    def save_job(self, job: GenerationJob) -> None:
        self._jobs[job.id] = job
        self._by_idempotency[job.idempotency_key] = job.id

    def get_job(self, job_id: str) -> Optional[GenerationJob]:
        return self._jobs.get(job_id)

    def completed_coverage(self) -> set[str]:
        return {
            canonical_coverage_key(
                j.content_type,
                j.target_language,
                j.cefr_level,
                j.explanation_language,
                j.topic,
            )
            for j in self._jobs.values()
            if j.status == JobStatus.COMPLETED
        }


class CoveragePlanner:
    """Computes which schedule/combination is due and not yet covered."""

    def __init__(self, today: Optional[date] = None) -> None:
        self.today = today or date.today()

    def is_due(self, schedule: ContentSchedule) -> bool:
        if not schedule.enabled:
            return False
        if schedule.frequency_days <= 1:
            return True
        return self.today.toordinal() % schedule.frequency_days == 0

    def plan(
        self, schedules: List[ContentSchedule], existing_coverage: set[str]
    ) -> List[GenerationJob]:
        jobs: List[GenerationJob] = []
        per_schedule: Dict[str, int] = {}

        for schedule in schedules:
            if not self.is_due(schedule):
                continue
            if schedule.daily_limit <= 0:
                continue
            base_key = canonical_coverage_key(
                schedule.content_type, schedule.target_language, schedule.cefr_level
            )
            lang_key = canonical_coverage_key(
                schedule.content_type,
                schedule.target_language,
                schedule.cefr_level,
                schedule.explanation_language,
            )
            key = canonical_coverage_key(
                schedule.content_type,
                schedule.target_language,
                schedule.cefr_level,
                schedule.explanation_language,
                schedule.topic,
            )
            if base_key in existing_coverage or key in existing_coverage:
                continue
            if not schedule.topic and lang_key in existing_coverage:
                continue

            used = per_schedule.get(schedule.id, 0)
            if used >= schedule.daily_limit:
                continue

            idempotency_key = (
                f"{schedule.id}:{self.today.isoformat()}:{key}"
            )
            jobs.append(
                GenerationJob(
                    id=idempotency_key,
                    idempotency_key=idempotency_key,
                    schedule_id=schedule.id,
                    content_type=schedule.content_type,
                    target_language=schedule.target_language,
                    explanation_language=schedule.explanation_language,
                    cefr_level=schedule.cefr_level,
                    topic=schedule.topic,
                    status=JobStatus.PENDING,
                )
            )
            per_schedule[schedule.id] = used + 1
            existing_coverage.add(key)

        return jobs


class GenerationScheduler:
    """Runs due jobs through the content engine with idempotency + retries."""

    def __init__(
        self,
        engine: ContentGenerationEngine,
        store: JobStore,
        planner: Optional[CoveragePlanner] = None,
        max_attempts: int = 3,
        sleep_fn: Callable[[float], None] = time.sleep,
        on_review: Optional[Callable[[ContentDraft], Any]] = None,
        on_usage: Optional[Callable[[ProviderUsage], Any]] = None,
    ) -> None:
        self.engine = engine
        self.store = store
        self.planner = planner or CoveragePlanner()
        self.max_attempts = max_attempts
        self.sleep_fn = sleep_fn
        self.on_review = on_review
        self.on_usage = on_usage

    def _make_task(self, job: GenerationJob) -> GenerationTask:
        return GenerationTask(
            idempotency_key=job.idempotency_key,
            task_type=TaskType.GENERATE_CONTENT,
            context=GenerationContext(
                content_type=ContentType(job.content_type),
                language=LanguageContext(
                    target_language=Language(job.target_language),
                    explanation_language=ExplanationLanguage(job.explanation_language),
                ),
                cefr_level=job.cefr_level,
                topic=job.topic,
            ),
            schema_name=job.content_type,
        )

    def _run_job(self, job: GenerationJob) -> GenerationOutcome:
        job.status = JobStatus.RUNNING
        self.store.save_job(job)

        last: Optional[GenerationOutcome] = None
        for attempt_number in range(1, self.max_attempts + 1):
            outcome = self.engine.generate(self._make_task(job))
            if outcome.usage is not None and self.on_usage is not None:
                self.on_usage(outcome.usage)
            job.attempts.append(
                JobAttempt(
                    attempt_number=attempt_number,
                    provider_id=outcome.draft.provider if outcome.draft else None,
                    failure=outcome.failure,
                )
            )
            if outcome.duplicate:
                job.status = JobStatus.CANCELLED
                self.store.save_job(job)
                return outcome
            if outcome.success and outcome.draft is not None:
                job.status = JobStatus.COMPLETED
                job.draft = outcome.draft.model_dump()
                self.store.save_job(job)
                if self.on_review is not None:
                    self.on_review(outcome.draft)
                return outcome

            last = outcome
            if attempt_number < self.max_attempts:
                self.sleep_fn(min(2 ** attempt_number, 30))

        job.status = JobStatus.FAILED
        self.store.save_job(job)
        return last or GenerationOutcome(success=False, failure=FailureCategory.UNKNOWN)

    def run(
        self, schedules: List[ContentSchedule], today: Optional[date] = None
    ) -> SchedulerRunReport:
        self.planner.today = today or self.planner.today
        report = SchedulerRunReport()

        existing = self.store.completed_coverage()
        planned = self.planner.plan(schedules, existing)
        report.jobs_planned = len(planned)

        for job in planned:
            if self.store.has_idempotency_key(job.idempotency_key):
                report.skipped_idempotent += 1
                continue

            report.jobs_created += 1
            outcome = self._run_job(job)

            if outcome.success:
                report.jobs_completed += 1
                if outcome.used_fallback:
                    report.fallbacks_used += 1
            elif outcome.duplicate:
                report.jobs_duplicate += 1
            else:
                report.jobs_failed += 1
                if outcome.failure is not None:
                    report.errors.append(
                        f"{job.content_type}:{job.target_language}:{job.cefr_level} -> {outcome.failure.value}"
                    )

        return report
