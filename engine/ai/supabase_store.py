"""
Supabase PostgREST persistence for AI scheduling, jobs, attempts, and usage.

Implements ``JobStore`` against the tables created in migration 017 while
keeping zero external HTTP library dependencies (uses stdlib ``urllib.request``).
Every write inspects HTTP errors and raises ``SupabasePersistenceError`` rather
than silently discarding failures.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .provider import ProviderUsage
from .scheduling import (
    ContentSchedule,
    GenerationJob,
    JobStatus,
    JobStore,
    SchedulerRunReport,
    canonical_coverage_key,
)


class SupabasePersistenceError(RuntimeError):
    """Raised when a Supabase REST write or query fails."""


RestFn = Callable[..., List[Dict[str, Any]]]


def _default_rest(
    url: str,
    method: str,
    headers: Dict[str, str],
    payload: Optional[Any],
    timeout: float,
) -> List[Dict[str, Any]]:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8").strip()
            if not raw:
                return []
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                return [parsed]
            return []
    except HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8")
        except Exception:
            pass
        raise SupabasePersistenceError(f"Supabase HTTP {exc.code} on {method} {url}: {detail}") from exc
    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        raise SupabasePersistenceError(f"Supabase transport error on {method} {url}: {exc}") from exc


class SupabaseRestClient:
    """Thin PostgREST client for server-side service-role operations."""

    def __init__(
        self,
        supabase_url: str,
        service_role_key: str,
        timeout: float = 10.0,
        rest_fn: RestFn = _default_rest,
    ) -> None:
        self.supabase_url = supabase_url.rstrip("/")
        self.service_role_key = service_role_key.strip()
        self.timeout = timeout
        self._rest_fn = rest_fn

    @classmethod
    def from_env(cls) -> Optional["SupabaseRestClient"]:
        url = (os.getenv("SUPABASE_URL") or "").strip()
        key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
        if not url or not key:
            return None
        return cls(url, key)

    def _headers(self, prefer: str = "return=representation") -> Dict[str, str]:
        return {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
            "Prefer": prefer,
            "User-Agent": "Lexilume-AIEngine/2.0",
        }

    def select(self, table: str, params: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        url = f"{self.supabase_url}/rest/v1/{table}"
        if params:
            url += "?" + urlencode(params)
        return self._rest_fn(url=url, method="GET", headers=self._headers(), payload=None, timeout=self.timeout)

    def insert(self, table: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        url = f"{self.supabase_url}/rest/v1/{table}"
        return self._rest_fn(url=url, method="POST", headers=self._headers(), payload=data, timeout=self.timeout)

    def upsert(
        self, table: str, data: Dict[str, Any], on_conflict: str
    ) -> List[Dict[str, Any]]:
        url = f"{self.supabase_url}/rest/v1/{table}?{urlencode({'on_conflict': on_conflict})}"
        headers = self._headers(prefer="resolution=merge-duplicates,return=representation")
        return self._rest_fn(url=url, method="POST", headers=headers, payload=data, timeout=self.timeout)

    def update(
        self, table: str, params: Dict[str, str], data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        url = f"{self.supabase_url}/rest/v1/{table}?{urlencode(params)}"
        return self._rest_fn(url=url, method="PATCH", headers=self._headers(), payload=data, timeout=self.timeout)


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


class SupabaseJobStore(JobStore):
    """Supabase-backed implementation of ``JobStore``."""

    def __init__(self, client: SupabaseRestClient) -> None:
        self.client = client
        self._job_uuids: Dict[str, str] = {}

    def has_idempotency_key(self, key: str) -> bool:
        if key in self._job_uuids:
            return True
        rows = self.client.select(
            "content_generation_jobs",
            {"select": "id", "idempotency_key": f"eq.{key}", "limit": "1"},
        )
        if rows:
            self._job_uuids[key] = str(rows[0]["id"])
            return True
        return False

    def save_job(self, job: GenerationJob) -> None:
        job_uuid = self._job_uuids.get(job.idempotency_key)
        if not job_uuid:
            job_uuid = job.id if _is_uuid(job.id) else str(uuid.uuid4())
            self._job_uuids[job.idempotency_key] = job_uuid

        payload: Dict[str, Any] = {
            "id": job_uuid,
            "schedule_key": job.schedule_id,
            "idempotency_key": job.idempotency_key,
            "content_type": job.content_type,
            "target_language": job.target_language,
            "explanation_language": job.explanation_language,
            "cefr_level": job.cefr_level,
            "topic": job.topic,
            "status": job.status.value,
            "draft_payload": job.draft,
        }
        rows = self.client.upsert("content_generation_jobs", payload, on_conflict="idempotency_key")
        if rows and rows[0].get("id"):
            job_uuid = str(rows[0]["id"])
            self._job_uuids[job.idempotency_key] = job_uuid

        for attempt in job.attempts:
            self.client.upsert(
                "content_generation_attempts",
                {
                    "job_id": job_uuid,
                    "attempt_number": attempt.attempt_number,
                    "provider_id": attempt.provider_id,
                    "status": "failed" if attempt.failure else "completed",
                    "failure_category": attempt.failure.value if attempt.failure else None,
                    "error_message": attempt.error,
                },
                on_conflict="job_id,attempt_number",
            )

        if job.status == JobStatus.COMPLETED and isinstance(job.draft, dict):
            validation = job.draft.get("validation")
            if isinstance(validation, dict):
                self.client.insert(
                    "content_validation_reports",
                    {
                        "job_id": job_uuid,
                        "passed": bool(validation.get("passed", False)),
                        "errors": validation.get("errors", []),
                        "warnings": validation.get("warnings", []),
                    },
                )

    def get_job(self, job_id: str) -> Optional[GenerationJob]:
        filter_col = "id" if _is_uuid(job_id) else "idempotency_key"
        rows = self.client.select(
            "content_generation_jobs",
            {filter_col: f"eq.{job_id}", "limit": "1"},
        )
        if not rows:
            return None
        row = rows[0]
        return GenerationJob(
            id=str(row["id"]),
            idempotency_key=row["idempotency_key"],
            schedule_id=row.get("schedule_key", ""),
            content_type=row["content_type"],
            target_language=row["target_language"],
            explanation_language=row.get("explanation_language", "en"),
            cefr_level=row["cefr_level"],
            topic=row.get("topic", ""),
            status=JobStatus(row["status"]),
            draft=row.get("draft_payload"),
        )

    def completed_coverage(self) -> set[str]:
        rows = self.client.select(
            "content_generation_jobs",
            {
                "select": "content_type,target_language,cefr_level,explanation_language,topic",
                "status": "eq.completed",
            },
        )
        return {
            canonical_coverage_key(
                r["content_type"],
                r["target_language"],
                r["cefr_level"],
                r.get("explanation_language", "en"),
                r.get("topic", ""),
            )
            for r in rows
        }

    def load_schedules(self) -> List[ContentSchedule]:
        rows = self.client.select(
            "content_generation_schedules",
            {"enabled": "eq.true"},
        )
        return [
            ContentSchedule(
                id=r.get("schedule_key") or str(r["id"]),
                content_type=r["content_type"],
                target_language=r["target_language"],
                explanation_language=r.get("explanation_language", "en"),
                cefr_level=r["cefr_level"],
                enabled=bool(r.get("enabled", True)),
                frequency_days=int(r.get("frequency_days", 1)),
                daily_limit=int(r.get("daily_limit", 3)),
                topic=r.get("topic", ""),
            )
            for r in rows
        ]

    def record_run(self, report: SchedulerRunReport) -> None:
        self.client.insert(
            "content_generation_runs",
            {
                "status": "completed" if report.jobs_failed == 0 else "failed",
                "jobs_planned": report.jobs_planned,
                "jobs_created": report.jobs_created,
                "jobs_completed": report.jobs_completed,
                "jobs_failed": report.jobs_failed,
                "jobs_duplicate": report.jobs_duplicate,
                "fallbacks_used": report.fallbacks_used,
                "errors": report.errors,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def record_provider_usage(self, usage: ProviderUsage) -> None:
        self.client.insert(
            "ai_provider_usage",
            {
                "provider_id": usage.provider_id,
                "model_id": usage.model_id,
                "prompt_version": usage.prompt_version,
                "request_id": usage.request_id,
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "duration_ms": usage.duration_ms,
                "status": usage.status,
                "failure_category": usage.failure_category.value if usage.failure_category else None,
            },
        )
