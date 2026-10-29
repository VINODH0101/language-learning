"""
Polyglot C1 Daily — Verification of Migration 008: Cultural Bookmarks and Sync.
Validates table schema, Row-Level Security policies, and quota trigger integrity.
"""

from pathlib import Path


def test_migration_008_sql_integrity():
    migration_file = Path("supabase/migrations/008_cultural_bookmarks_and_sync.sql")
    assert migration_file.exists(), "Migration 008 file must exist"

    sql = migration_file.read_text(encoding="utf-8")
    assert "CREATE TABLE IF NOT EXISTS public.cultural_bookmarks" in sql
    assert "article_id" in sql
    assert "content_language" in sql
    assert "origin_country" in sql
    assert "cefr_level" in sql
    assert "ENABLE ROW LEVEL SECURITY" in sql
    assert "uq_user_cultural_bookmark" in sql
    assert "check_cultural_bookmark_quota" in sql
    assert "auth.uid() = user_id" in sql


def test_migration_008_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/008_cultural_bookmarks_and_sync_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 008 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    assert "DROP TABLE IF EXISTS public.cultural_bookmarks" in sql
    assert "DROP FUNCTION IF EXISTS public.check_cultural_bookmark_quota" in sql
