"""
Lexilume — Verification of Migration 011 (Daily Lessons Schema Reconciliation & Deduplication).
"""

from pathlib import Path
from datetime import date
from unittest.mock import MagicMock
from engine.core import PolyglotEngine
from engine.models.enums import Language, RegionalVariety, ExplanationLanguage
from engine.storage.supabase_repository import SupabaseStorageRepository


def test_migration_011_sql_integrity():
    migration_file = Path("supabase/migrations/011_daily_lessons_reconciliation.sql")
    assert migration_file.exists(), "Migration 011 file must exist"

    sql = migration_file.read_text(encoding="utf-8")
    assert "ADD COLUMN IF NOT EXISTS language" in sql
    assert "ADD COLUMN IF NOT EXISTS cefr_level" in sql
    assert "ADD COLUMN IF NOT EXISTS content_fingerprint" in sql
    assert "ADD COLUMN IF NOT EXISTS payload JSONB" in sql
    assert "sync_daily_lessons_payload" in sql
    assert "trg_sync_daily_lessons_payload" in sql
    assert "idx_daily_lessons_lang_date" in sql
    assert "ENABLE ROW LEVEL SECURITY" in sql
    assert "Service role full access on daily_lessons" in sql


def test_migration_011_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/011_daily_lessons_reconciliation_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 011 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    assert "DROP TRIGGER IF EXISTS trg_sync_daily_lessons_payload" in sql
    assert "DROP FUNCTION IF EXISTS public.sync_daily_lessons_payload()" in sql
    assert "DROP INDEX IF EXISTS idx_daily_lessons_lang_date" in sql
    assert "DROP COLUMN IF EXISTS payload" in sql


def test_supabase_repository_daily_lessons_dual_payload():
    engine = PolyglotEngine()
    lesson = engine.generate_daily_lesson(
        user_id="user-123",
        language=Language.PORTUGUESE,
        lesson_date=date(2026, 10, 31),
        regional_variety=RegionalVariety.PT_BR,
        explanation_language=ExplanationLanguage.EN,
    )

    repo = SupabaseStorageRepository(supabase_url="https://mock.supabase.co", service_role_key="anon_key")
    repo._rest_request = MagicMock(return_value=[])

    repo.save_daily_lesson(lesson)
    assert repo._rest_request.called
    call_args = repo._rest_request.call_args
    data = call_args[1]["data"]
    assert "payload" in data
    assert "content_payload" in data
    assert data["payload"]["lesson_id"] == lesson.lesson_id
    assert data["content_payload"]["lesson_id"] == lesson.lesson_id
    assert data["language"] == "pt"
    assert data["content_fingerprint"] == lesson.content_fingerprint
