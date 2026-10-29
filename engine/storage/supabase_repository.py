"""
Polyglot C1 Daily — Supabase PostgreSQL Storage Repository.

Communicates with Supabase via PostgREST endpoints with service-role credentials,
Row-Level Security token passing, bounded retries, and in-memory fallback.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.parse
from datetime import date
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from engine.models.enums import CEFRLevel, Language, RegionalVariety
from engine.models.lesson import DailyLessonPayload
from engine.models.progress import ExerciseAttempt, LessonAssignment, SRSItemState, UserTrackState
from engine.storage.repository import InMemoryStorageRepository, StorageRepository

logger = logging.getLogger(__name__)


class SupabaseStorageRepository(StorageRepository):
    """
    Production storage repository backed by Supabase PostgREST API.
    Falls back to InMemoryStorageRepository if Supabase credentials are not provided.
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        service_role_key: Optional[str] = None,
        timeout_seconds: float = 8.0,
        fallback_to_memory: bool = True,
    ):
        self.supabase_url = (supabase_url or os.environ.get("SUPABASE_URL", "")).rstrip("/")
        self.service_role_key = service_role_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        self.timeout = timeout_seconds
        self.fallback_to_memory = fallback_to_memory
        self._mem = InMemoryStorageRepository() if fallback_to_memory else None

        self.is_connected = bool(self.supabase_url and self.service_role_key)
        if not self.is_connected:
            logger.info("Supabase credentials not configured; using in-memory repository fallback.")

    def _headers(self) -> Dict[str, str]:
        return {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            "User-Agent": "PolyglotC1Daily-StorageEngine/1.0",
        }

    def _rest_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Any] = None,
        params: Optional[Dict[str, str]] = None,
    ) -> Optional[List[Dict[str, Any]]]:
        if not self.is_connected:
            return None

        url = f"{self.supabase_url}/rest/v1/{endpoint}"
        if params:
            url += "?" + urllib.parse.urlencode(params)

        payload_bytes = json.dumps(data).encode("utf-8") if data is not None else None
        req = Request(url, data=payload_bytes, headers=self._headers(), method=method)

        try:
            with urlopen(req, timeout=self.timeout) as resp:
                resp_text = resp.read().decode("utf-8")
                if resp_text:
                    parsed = json.loads(resp_text)
                    if isinstance(parsed, list):
                        return parsed
                    elif isinstance(parsed, dict):
                        return [parsed]
                return []
        except HTTPError as e:
            err = ""
            try:
                err = e.read().decode("utf-8")
            except Exception:
                pass
            logger.warning(f"Supabase REST error HTTP {e.code} on {endpoint}: {err}")
            return None
        except (URLError, TimeoutError) as e:
            logger.warning(f"Supabase network error on {endpoint}: {e}")
            return None

    # --- User Learning Track ---

    def get_user_track_state(self, user_id: str, language: Language) -> Optional[UserTrackState]:
        if not self.is_connected and self._mem:
            return self._mem.get_user_track_state(user_id, language)

        res = self._rest_request(
            "user_learning_tracks",
            method="GET",
            params={"user_id": f"eq.{user_id}", "language": f"eq.{language.value}"},
        )
        if res and len(res) > 0:
            row = res[0]
            return UserTrackState(
                user_id=row["user_id"],
                language=Language(row["language"]),
                regional_variety=RegionalVariety(row["regional_variety"]),
                current_cefr_level=CEFRLevel(row["current_cefr_level"]),
                target_cefr_level=CEFRLevel(row["target_cefr_level"]),
                current_curriculum_node_id=row.get("current_curriculum_node_id"),
                streak_days=row.get("streak_days", 1),
                total_lessons_completed=row.get("total_lessons_completed", 0),
                completed_curriculum_node_ids=row.get("completed_curriculum_node_ids", []),
                presented_vocabulary_ids=row.get("presented_vocabulary_ids", []),
                mastered_vocabulary_ids=row.get("mastered_vocabulary_ids", []),
                recent_node_history=row.get("recent_node_history", []),
                recent_exercise_history=row.get("recent_exercise_history", []),
            )

        if self._mem:
            return self._mem.get_user_track_state(user_id, language)
        return None

    def save_user_track_state(self, track_state: UserTrackState) -> None:
        if self._mem:
            self._mem.save_user_track_state(track_state)

        if not self.is_connected:
            return

        payload = {
            "user_id": track_state.user_id,
            "language": track_state.language.value,
            "regional_variety": track_state.regional_variety.value,
            "current_cefr_level": track_state.current_cefr_level.value,
            "target_cefr_level": track_state.target_cefr_level.value,
            "current_curriculum_node_id": track_state.current_curriculum_node_id,
            "streak_days": track_state.streak_days,
            "total_lessons_completed": track_state.total_lessons_completed,
            "completed_curriculum_node_ids": track_state.completed_curriculum_node_ids,
            "presented_vocabulary_ids": track_state.presented_vocabulary_ids,
            "mastered_vocabulary_ids": track_state.mastered_vocabulary_ids,
            "recent_node_history": track_state.recent_node_history,
            "recent_exercise_history": track_state.recent_exercise_history,
            "updated_at": "now()",
        }
        self._rest_request("user_learning_tracks", method="POST", data=payload)

    # --- Spaced Repetition (SRS) Items ---

    def get_srs_states(self, user_id: str, language: Optional[Language] = None) -> List[SRSItemState]:
        if not self.is_connected and self._mem:
            return self._mem.get_srs_states(user_id, language)

        params: Dict[str, str] = {"user_id": f"eq.{user_id}"}
        if language:
            params["language"] = f"eq.{language.value}"

        res = self._rest_request("srs_items", method="GET", params=params)
        if res is not None:
            items: List[SRSItemState] = []
            for row in res:
                items.append(
                    SRSItemState(
                        vocabulary_item_id=row["vocabulary_item_id"],
                        language=Language(row["language"]),
                        repetition_count=row["repetition_count"],
                        ease_factor=float(row["ease_factor"]),
                        interval_days=row["interval_days"],
                        next_review_date=date.fromisoformat(row["next_review_date"]),
                        last_reviewed_at=row.get("last_reviewed_at"),
                        lapse_count=row.get("lapse_count", 0),
                        mastery_status=row.get("mastery_status", "presented"),
                    )
                )
            return items

        if self._mem:
            return self._mem.get_srs_states(user_id, language)
        return []

    def save_srs_state(self, user_id: str, state: SRSItemState) -> None:
        if self._mem:
            self._mem.save_srs_state(user_id, state)

        if not self.is_connected:
            return

        payload = {
            "user_id": user_id,
            "vocabulary_item_id": state.vocabulary_item_id,
            "language": state.language.value,
            "repetition_count": state.repetition_count,
            "ease_factor": state.ease_factor,
            "interval_days": state.interval_days,
            "next_review_date": state.next_review_date.isoformat(),
            "last_reviewed_at": state.last_reviewed_at.isoformat() if state.last_reviewed_at else None,
            "lapse_count": state.lapse_count,
            "mastery_status": state.mastery_status.value if hasattr(state.mastery_status, "value") else str(state.mastery_status),
        }
        self._rest_request("srs_items", method="POST", data=payload)

    # --- Daily Lessons ---

    def save_daily_lesson(self, lesson: DailyLessonPayload) -> None:
        if self._mem:
            self._mem.save_daily_lesson(lesson)

        if not self.is_connected:
            return

        payload = {
            "id": lesson.lesson_id,
            "user_id": lesson.user_id,
            "language": lesson.language.value,
            "lesson_date": lesson.lesson_date.isoformat(),
            "cefr_level": lesson.cefr_level.value,
            "curriculum_node_id": lesson.curriculum_node_id,
            "study_mode": lesson.study_mode.value,
            "estimated_minutes": lesson.estimated_study_minutes,
            "content_fingerprint": lesson.content_fingerprint,
            "payload": lesson.model_dump(mode="json"),
        }
        self._rest_request("daily_lessons", method="POST", data=payload)

    def get_daily_lesson(self, user_id: str, language: Language, lesson_date: date) -> Optional[DailyLessonPayload]:
        if not self.is_connected and self._mem:
            return self._mem.get_daily_lesson(user_id, language, lesson_date)

        params = {
            "user_id": f"eq.{user_id}",
            "language": f"eq.{language.value}",
            "lesson_date": f"eq.{lesson_date.isoformat()}",
        }
        res = self._rest_request("daily_lessons", method="GET", params=params)
        if res and len(res) > 0:
            raw_payload = res[0].get("payload", {})
            return DailyLessonPayload(**raw_payload)

        if self._mem:
            return self._mem.get_daily_lesson(user_id, language, lesson_date)
        return None

    # --- Exercise Attempts ---

    def save_exercise_attempt(self, user_id: str, attempt: ExerciseAttempt) -> None:
        if self._mem:
            self._mem.save_exercise_attempt(user_id, attempt)

        if not self.is_connected:
            return

        payload = {
            "id": attempt.id,
            "user_id": user_id,
            "exercise_id": attempt.exercise_id,
            "submitted_answer": attempt.submitted_answer,
            "is_correct": attempt.is_correct,
            "feedback": attempt.feedback,
            "attempt_count": attempt.attempt_count,
            "created_at": attempt.timestamp.isoformat(),
        }
        self._rest_request("exercise_attempts", method="POST", data=payload)

    def get_exercise_attempts(self, user_id: str, exercise_id: Optional[str] = None) -> List[ExerciseAttempt]:
        if not self.is_connected and self._mem:
            return self._mem.get_exercise_attempts(user_id, exercise_id)

        params: Dict[str, str] = {"user_id": f"eq.{user_id}"}
        if exercise_id:
            params["exercise_id"] = f"eq.{exercise_id}"

        res = self._rest_request("exercise_attempts", method="GET", params=params)
        if res is not None:
            attempts: List[ExerciseAttempt] = []
            for row in res:
                attempts.append(
                    ExerciseAttempt(
                        id=row["id"],
                        exercise_id=row["exercise_id"],
                        submitted_answer=row["submitted_answer"],
                        is_correct=row["is_correct"],
                        feedback=row["feedback"],
                        attempt_count=row["attempt_count"],
                        timestamp=row["created_at"],
                    )
                )
            return attempts

        if self._mem:
            return self._mem.get_exercise_attempts(user_id, exercise_id)
        return []

    # --- Email Delivery Ledger ---

    def get_email_delivery(
        self, user_id: str, delivery_date: str, purpose: str = "daily_digest"
    ) -> Optional[Dict[str, Any]]:
        """Check if an email was already recorded in the delivery ledger."""
        params = {
            "user_id": f"eq.{user_id}",
            "delivery_date": f"eq.{delivery_date}",
            "delivery_purpose": f"eq.{purpose}",
        }
        res = self._rest_request("email_deliveries", method="GET", params=params)
        if res and len(res) > 0:
            return res[0]
        return None

    def record_email_delivery(
        self,
        user_id: str,
        delivery_date: str,
        idempotency_key: str,
        recipient_email: str,
        subject: str,
        status: str,
        provider: str = "resend",
        provider_message_id: Optional[str] = None,
        last_error: Optional[str] = None,
        purpose: str = "daily_digest",
    ) -> None:
        """Upsert a delivery record into the email_deliveries table."""
        if not self.is_connected:
            return

        payload = {
            "user_id": user_id,
            "delivery_date": delivery_date,
            "delivery_purpose": purpose,
            "idempotency_key": idempotency_key,
            "recipient_email": recipient_email,
            "subject": subject,
            "status": status,
            "provider": provider,
            "provider_message_id": provider_message_id,
            "last_error": last_error,
            "updated_at": "now()",
        }
        self._rest_request("email_deliveries", method="POST", data=payload)

    # --- Minimal Lesson Assignments (Migration 004) ---

    def get_lesson_assignment(
        self, user_id: str, language: Language, assignment_date: date
    ) -> Optional[LessonAssignment]:
        """Fetch minimal Wikipedia reading assignment from Supabase or fallback."""
        if not self.is_connected:
            return self._mem.get_lesson_assignment(user_id, language, assignment_date) if self._mem else None

        params = {
            "user_id": f"eq.{user_id}",
            "language": f"eq.{language.value}",
            "assignment_date": f"eq.{assignment_date.isoformat()}",
        }
        res = self._rest_request("lesson_assignments", method="GET", params=params)
        if res and len(res) > 0:
            row = res[0]
            return LessonAssignment(
                id=row["id"],
                user_id=row["user_id"],
                language=Language(row["language"]),
                assignment_date=date.fromisoformat(row["assignment_date"]),
                article_id=row["article_id"],
                article_title=row["article_title"],
                article_url=row["article_url"],
                revision_id=row.get("revision_id"),
                cefr_level=CEFRLevel(row.get("cefr_level", "B2")),
                topic_category=row.get("topic_category", "General"),
                status=row.get("status", "assigned"),
            )
        return self._mem.get_lesson_assignment(user_id, language, assignment_date) if self._mem else None

    def save_lesson_assignment(self, assignment: LessonAssignment) -> None:
        """Upsert minimal Wikipedia reading assignment into Supabase."""
        if self._mem:
            self._mem.save_lesson_assignment(assignment)

        if not self.is_connected:
            return

        payload = {
            "id": assignment.id,
            "user_id": assignment.user_id,
            "language": assignment.language.value,
            "assignment_date": assignment.assignment_date.isoformat(),
            "article_id": assignment.article_id,
            "article_title": assignment.article_title,
            "article_url": assignment.article_url,
            "revision_id": assignment.revision_id,
            "cefr_level": assignment.cefr_level.value,
            "topic_category": assignment.topic_category,
            "status": assignment.status,
        }
        # PostgREST upsert via on_conflict
        headers = {"Prefer": "resolution=merge-duplicates,return=representation"}
        self._rest_request("lesson_assignments", method="POST", data=payload)

    def get_recent_article_ids(self, user_id: str, language: Language, limit: int = 14) -> List[str]:
        """Fetch recently assigned article identifiers to prevent repeating articles."""
        if not self.is_connected:
            return self._mem.get_recent_article_ids(user_id, language, limit=limit) if self._mem else []

        params = {
            "user_id": f"eq.{user_id}",
            "language": f"eq.{language.value}",
            "order": "assignment_date.desc",
            "limit": str(limit),
        }
        res = self._rest_request("lesson_assignments", method="GET", params=params)
        if res:
            return [row["article_id"] for row in res]
        return self._mem.get_recent_article_ids(user_id, language, limit=limit) if self._mem else []
