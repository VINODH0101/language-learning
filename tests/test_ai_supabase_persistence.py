"""
Tests for Supabase AI persistence (Step 2): SupabaseJobStore, SupabaseContentRepository,
end-to-end draft -> review -> publish flow, and run_content_generation offline safety.
"""

from __future__ import annotations

import json
import uuid
from datetime import date
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse

import pytest

from engine.ai import (
    ContentGenerationEngine,
    ContentSchedule,
    GenerationScheduler,
    ProviderUsage,
    SupabaseJobStore,
    SupabasePersistenceError,
    SupabaseRestClient,
)
from engine.api import (
    AdminContentService,
    ContentAccessService,
    ContentFilters,
    SupabaseContentRepository,
)


class FakePostgrestServer:
    """Minimal in-memory PostgREST simulator supporting select/insert/upsert/patch."""

    def __init__(self) -> None:
        self.tables: Dict[str, List[Dict[str, Any]]] = {
            "content_generation_schedules": [],
            "content_generation_runs": [],
            "content_generation_jobs": [],
            "content_generation_attempts": [],
            "content_validation_reports": [],
            "ai_provider_usage": [],
            "content_items": [],
            "content_versions": [],
            "content_review_items": [],
        }

    def __call__(
        self,
        url: str,
        method: str,
        headers: Dict[str, str],
        payload: Optional[Any],
        timeout: float,
    ) -> List[Dict[str, Any]]:
        parsed = urlparse(url)
        table = parsed.path.rsplit("/", 1)[-1]
        qs = parse_qs(parsed.query)
        rows = self.tables.setdefault(table, [])

        if method == "GET":
            matched = self._filter_rows(rows, qs)
            limit = int(qs["limit"][0]) if "limit" in qs else None
            return [dict(r) for r in (matched[:limit] if limit else matched)]

        if method == "POST":
            record = dict(payload or {})
            record.setdefault("id", str(uuid.uuid4()))
            on_conflict = qs.get("on_conflict", [None])[0]
            if on_conflict:
                keys = [k.strip() for k in on_conflict.split(",")]
                for existing in rows:
                    if all(existing.get(k) == record.get(k) for k in keys):
                        existing.update(record)
                        return [dict(existing)]
            rows.append(record)
            return [dict(record)]

        if method == "PATCH":
            matched = self._filter_rows(rows, qs)
            for existing in matched:
                existing.update(dict(payload or {}))
            return [dict(r) for r in matched]

        raise AssertionError(f"Unsupported method: {method}")

    def _filter_rows(
        self, rows: List[Dict[str, Any]], qs: Dict[str, List[str]]
    ) -> List[Dict[str, Any]]:
        result = list(rows)
        for key, values in qs.items():
            if key in ("select", "limit", "order", "on_conflict"):
                continue
            val = values[0]
            if val.startswith("eq."):
                target = val[3:]
                result = [
                    r for r in result
                    if str(r.get(key)).lower() == target.lower()
                    if isinstance(r.get(key), bool)
                    or str(r.get(key)) == target
                ]
                # Exact string/bool match without cross-matching non-bools
                if target in ("true", "false"):
                    expected_bool = target == "true"
                    result = [r for r in rows if r.get(key) is expected_bool]
                else:
                    result = [r for r in result if str(r.get(key)) == target]
        return result


def test_supabase_job_store_persists_jobs_attempts_reports_and_usage():
    server = FakePostgrestServer()
    client = SupabaseRestClient("https://example.supabase.co", "service-key", rest_fn=server)
    store = SupabaseJobStore(client)

    server.tables["content_generation_schedules"].append(
        {
            "id": str(uuid.uuid4()),
            "schedule_key": "story-pt-b1",
            "content_type": "story",
            "target_language": "pt",
            "explanation_language": "en",
            "cefr_level": "B1",
            "topic": "feira",
            "enabled": True,
            "frequency_days": 1,
            "daily_limit": 1,
        }
    )

    schedules = store.load_schedules()
    assert len(schedules) == 1

    engine = ContentGenerationEngine()
    scheduler = GenerationScheduler(engine, store, max_attempts=1, sleep_fn=lambda _: None)
    report = scheduler.run(schedules, today=date(2026, 1, 1))
    store.record_run(report)
    store.record_provider_usage(
        ProviderUsage(
            provider_id="gemini",
            model_id="gemini-1.5-flash",
            prompt_version="1.0.0",
            prompt_tokens=10,
            completion_tokens=20,
        )
    )

    assert report.jobs_completed == 1
    assert len(server.tables["content_generation_jobs"]) == 1
    job_row = server.tables["content_generation_jobs"][0]
    uuid.UUID(job_row["id"])  # valid UUID
    assert job_row["status"] == "completed"
    assert len(server.tables["content_generation_attempts"]) == 1
    assert len(server.tables["content_validation_reports"]) == 1
    assert len(server.tables["content_generation_runs"]) == 1
    assert len(server.tables["ai_provider_usage"]) == 1

    # Re-run on same date is idempotent via Supabase coverage + idempotency key
    report2 = scheduler.run(schedules, today=date(2026, 1, 1))
    assert report2.jobs_planned == 0


def test_supabase_content_repository_review_to_publish_flow():
    server = FakePostgrestServer()
    client = SupabaseRestClient("https://example.supabase.co", "service-key", rest_fn=server)
    job_store = SupabaseJobStore(client)
    repo = SupabaseContentRepository(client)
    admin = AdminContentService(repository=repo)
    learner_api = ContentAccessService(repo)

    engine = ContentGenerationEngine()
    scheduler = GenerationScheduler(
        engine, job_store, max_attempts=1, sleep_fn=lambda _: None
    )
    schedules = [
        ContentSchedule(
            id="story-es-a2",
            content_type="story",
            target_language="es",
            explanation_language="en",
            cefr_level="A2",
            topic="panadería",
        )
    ]
    admin.set_schedules(schedules)
    admin.run_generation(scheduler, today=date(2026, 1, 1))

    # Draft is persisted in review queue, NOT visible to learners
    assert len(server.tables["content_review_items"]) == 1
    review_id = server.tables["content_review_items"][0]["id"]
    assert learner_api.list_content(ContentFilters()).total == 0

    # Approve -> visible to learners via ContentAccessService
    published = admin.approve(review_id)
    assert published is not None
    assert published.target_language == "es"
    page = learner_api.list_content(ContentFilters(content_type="story", target_language="es"))
    assert page.total == 1
    assert page.data[0].id == published.id


def test_supabase_content_repository_reject_keeps_unpublished():
    server = FakePostgrestServer()
    client = SupabaseRestClient("https://example.supabase.co", "service-key", rest_fn=server)
    repo = SupabaseContentRepository(client)
    admin = AdminContentService(repository=repo)
    learner_api = ContentAccessService(repo)

    from engine.ai.content_types import (
        ContentType,
        GenerationContext,
        GenerationTask,
        LanguageContext,
    )
    from engine.models.enums import ExplanationLanguage, Language

    outcome = ContentGenerationEngine().generate(
        GenerationTask(
            idempotency_key="rej-1",
            context=GenerationContext(
                content_type=ContentType.POETRY,
                language=LanguageContext(
                    target_language=Language.PORTUGUESE,
                    explanation_language=ExplanationLanguage.EN,
                ),
                cefr_level="B1",
            ),
            schema_name="poetry",
        )
    )
    assert outcome.draft is not None
    review = admin.submit_draft(outcome.draft)
    assert admin.reject(review.id) is True
    assert server.tables["content_review_items"][0]["status"] == "rejected"
    assert learner_api.list_content(ContentFilters()).total == 0


def test_supabase_client_raises_on_error():
    def _failing_rest(**kwargs):
        raise SupabasePersistenceError("Supabase HTTP 500")

    client = SupabaseRestClient("https://example.supabase.co", "k", rest_fn=_failing_rest)
    with pytest.raises(SupabasePersistenceError):
        client.insert("ai_provider_usage", {"provider_id": "gemini"})


def test_run_content_generation_script_offline_json(monkeypatch, capsys):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    from scripts.run_content_generation import main

    exit_code = main()
    assert exit_code == 0
    captured = capsys.readouterr()
    payload = json.loads(captured.out)
    assert payload["persistence"] == "in_memory"
    assert payload["jobs_failed"] == 0
    assert payload["drafts_queued_for_review"] == payload["jobs_completed"]
