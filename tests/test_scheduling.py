"""
Tests for scheduling & job management (Phase 5).
"""

from __future__ import annotations

from datetime import date

from engine.ai import (
    ContentGenerationEngine,
    ContentSchedule,
    CoveragePlanner,
    GenerationScheduler,
    InMemoryJobStore,
)
from engine.ai.scheduling import canonical_coverage_key
from engine.ai.dedupe import DuplicateDetector


def _schedule(sid: str, content_type="story", freq=1, limit=2, enabled=True):
    return ContentSchedule(
        id=sid,
        content_type=content_type,
        target_language="pt",
        explanation_language="en",
        cefr_level="B1",
        frequency_days=freq,
        daily_limit=limit,
        enabled=enabled,
        topic="cidade",
    )


def test_coverage_planner_skips_existing_and_disabled():
    planner = CoveragePlanner(today=date(2026, 1, 1))
    schedules = [
        _schedule("s1", "story"),
        _schedule("s2", "grammar"),
        _schedule("s3", "poetry", enabled=False),
    ]
    existing = {canonical_coverage_key("story", "pt", "B1")}
    jobs = planner.plan(schedules, existing)
    content_types = {j.content_type for j in jobs}
    assert "story" not in content_types  # already covered
    assert "poetry" not in content_types  # disabled
    assert "grammar" in content_types


def test_planner_respects_daily_limit():
    planner = CoveragePlanner(today=date(2026, 1, 1))
    schedules = [_schedule("s1", "story", limit=1)]
    jobs = planner.plan(schedules, set())
    assert len(jobs) == 1


def test_planner_frequency_not_due():
    planner = CoveragePlanner(today=date(2026, 1, 2))  # ordinal is even-ish; use freq 3
    schedules = [_schedule("s1", "story", freq=3, limit=5)]
    # 2026-01-02 ordinal % 3 -> depends; just assert determinism: due iff ordinal%3==0
    due = date(2026, 1, 2).toordinal() % 3 == 0
    jobs = planner.plan(schedules, set())
    assert (len(jobs) == 1) == due


def test_scheduler_generates_and_is_idempotent():
    engine = ContentGenerationEngine(dedupe=DuplicateDetector())
    store = InMemoryJobStore()
    scheduler = GenerationScheduler(engine, store, max_attempts=2, sleep_fn=lambda s: None)

    schedules = [_schedule("s1", "story", limit=1)]
    report = scheduler.run(schedules, today=date(2026, 1, 1))
    assert report.jobs_completed == 1
    assert report.jobs_failed == 0

    # Re-running the same day must not generate again (coverage already met).
    report2 = scheduler.run(schedules, today=date(2026, 1, 1))
    assert report2.jobs_planned == 0
    assert report2.jobs_completed == 0


def test_scheduler_skips_budget_and_marks_fallback():
    engine = ContentGenerationEngine()  # no router -> deterministic fallback
    store = InMemoryJobStore()
    scheduler = GenerationScheduler(engine, store, max_attempts=1, sleep_fn=lambda s: None)

    schedules = [_schedule("s1", "conversation", limit=2)]
    report = scheduler.run(schedules, today=date(2026, 1, 1))
    assert report.jobs_completed == 1
    assert report.fallbacks_used == 1


def test_on_review_callback_invoked():
    reviewed = []
    engine = ContentGenerationEngine()
    store = InMemoryJobStore()
    scheduler = GenerationScheduler(
        engine, store, max_attempts=1, sleep_fn=lambda s: None,
        on_review=lambda draft: reviewed.append(draft.content_type),
    )
    scheduler.run([_schedule("s1", "grammar", limit=1)], today=date(2026, 1, 1))
    assert reviewed == ["grammar"]


def test_planner_distinguishes_explanation_language_and_topic():
    planner = CoveragePlanner(today=date(2026, 1, 1))
    s_en = ContentSchedule(
        id="s-en", content_type="story", target_language="pt",
        explanation_language="en", cefr_level="B1", topic="cafe",
    )
    s_es = ContentSchedule(
        id="s-es", content_type="story", target_language="pt",
        explanation_language="es", cefr_level="B1", topic="cafe",
    )
    s_market = ContentSchedule(
        id="s-market", content_type="story", target_language="pt",
        explanation_language="en", cefr_level="B1", topic="market",
    )
    jobs = planner.plan([s_en, s_es, s_market], set())
    assert len(jobs) == 3
