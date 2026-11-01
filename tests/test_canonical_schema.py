"""
Lexilume — Comprehensive Canonical Database Schema & Reset Verification Tests.
"""

from pathlib import Path
import re
from datetime import date
from unittest.mock import MagicMock
from engine.core import PolyglotEngine
from engine.models.enums import Language, RegionalVariety, ExplanationLanguage
from engine.models.progress import UserTrackState, SRSItemState, ExerciseAttempt
from engine.storage.supabase_repository import SupabaseStorageRepository


def test_canonical_baseline_sql_integrity():
    baseline_file = Path("supabase/canonical/001_canonical_baseline.sql")
    assert baseline_file.exists(), "Canonical baseline schema must exist"

    sql = baseline_file.read_text(encoding="utf-8")

    # 1. Essential Tables Present
    expected_tables = [
        "public.user_profiles",
        "public.user_roles",
        "public.admin_audit_logs",
        "public.user_courses",
        "public.user_learning_tracks",
        "public.srs_items",
        "public.saved_translations",
        "public.cultural_bookmarks",
        "public.exercise_attempts",
        "public.daily_lessons",
        "public.lesson_assignments",
        "public.email_deliveries",
        "public.retention_cleanup_logs",
        "public.licenses_and_sources",
        "public.curriculum_nodes",
        "public.vocabulary_items",
        "public.grammar_rules",
        "public.exercise_templates",
        "public.curated_materials",
    ]
    for table in expected_tables:
        assert f"CREATE TABLE IF NOT EXISTS {table}" in sql, f"Missing table {table}"

    # 2. Consistent Foreign Keys to auth.users(id)
    user_owned_tables = [
        "user_profiles",
        "user_roles",
        "user_courses",
        "user_learning_tracks",
        "srs_items",
        "saved_translations",
        "cultural_bookmarks",
        "exercise_attempts",
        "daily_lessons",
        "lesson_assignments",
        "email_deliveries",
    ]
    for tbl in user_owned_tables:
        pattern = rf"{tbl}.*?REFERENCES auth\.users\(id\)"
        assert re.search(pattern, sql, re.DOTALL), f"Table {tbl} must reference auth.users(id)"

    # 3. Triggers & Security Definer Functions
    assert "FUNCTION public.handle_new_user()" in sql
    assert "FUNCTION public.is_admin()" in sql
    assert "FUNCTION public.sync_user_course_to_learning_track()" in sql
    assert "FUNCTION public.sync_daily_lessons_payload()" in sql
    assert "FUNCTION public.check_saved_translation_quota()" in sql
    assert "FUNCTION public.check_cultural_bookmark_quota()" in sql

    # 4. Row-Level Security Enablement on All Tables
    for tbl in user_owned_tables:
        assert f"ALTER TABLE public.{tbl} ENABLE ROW LEVEL SECURITY;" in sql

    # 5. Service Role Super-Access Policies
    for tbl in user_owned_tables:
        assert f"Service role full access on {tbl}" in sql

    # 6. Public Reference Read Grants
    assert "GRANT SELECT ON TABLE" in sql
    assert "TO anon;" in sql


def test_reset_and_rebuild_sql_integrity():
    reset_file = Path("supabase/canonical/reset_and_rebuild.sql")
    assert reset_file.exists(), "Reset script must exist"

    sql = reset_file.read_text(encoding="utf-8")

    # Ensures reverse order drop and cascade
    assert "DROP TABLE IF EXISTS public.user_profiles CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.user_courses CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.user_learning_tracks CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.srs_items CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.daily_lessons CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.saved_translations CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.cultural_bookmarks CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.exercise_attempts CASCADE;" in sql

    # Legacy table cleanup
    assert "DROP TABLE IF EXISTS public.user_vocabulary_history CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.lesson_exercises CASCADE;" in sql
    assert "DROP TABLE IF EXISTS public.language_tracks CASCADE;" in sql


def test_python_models_match_canonical_schema():
    repo = SupabaseStorageRepository(supabase_url="https://mock.supabase.co", service_role_key="test_key")
    repo._rest_request = MagicMock(return_value=[])

    # 1. Track State matches user_learning_tracks
    track = UserTrackState(
        user_id="usr-123",
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_BR,
        streak_days=3,
        total_lessons_completed=2,
    )
    repo.save_user_track_state(track)
    assert repo._rest_request.called
    call_args = repo._rest_request.call_args
    assert call_args[0][0] == "user_learning_tracks"
    data = call_args[1]["data"]
    assert data["user_id"] == "usr-123"
    assert data["language"] == "pt"

    # 2. SRS State matches srs_items
    repo._rest_request.reset_mock()
    srs = SRSItemState(
        vocabulary_item_id="voc-01",
        language=Language.PORTUGUESE,
        repetition_count=1,
        ease_factor=2.5,
        interval_days=1,
        next_review_date=date(2026, 11, 1),
    )
    repo.save_srs_state("usr-123", srs)
    assert repo._rest_request.called
    call_args = repo._rest_request.call_args
    assert call_args[0][0] == "srs_items"
    data = call_args[1]["data"]
    assert data["user_id"] == "usr-123"
    assert data["vocabulary_item_id"] == "voc-01"

    # 3. Exercise Attempt matches exercise_attempts
    repo._rest_request.reset_mock()
    attempt = ExerciseAttempt(
        id="att-01",
        exercise_id="ex-01",
        submitted_answer="correto",
        is_correct=True,
        feedback="Bom trabalho",
        attempt_count=1,
    )
    repo.save_exercise_attempt("usr-123", attempt)
    assert repo._rest_request.called
    call_args = repo._rest_request.call_args
    assert call_args[0][0] == "exercise_attempts"
    data = call_args[1]["data"]
    assert data["id"] == "att-01"
    assert data["user_id"] == "usr-123"
