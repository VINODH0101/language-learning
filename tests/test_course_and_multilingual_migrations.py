"""
Polyglot C1 Daily — Verification of Migration 007: Multiple Learning Courses,
Independent Language Settings, and Course Isolation.
"""

from pathlib import Path


def test_migration_007_sql_integrity():
    migration_file = Path("supabase/migrations/007_multiple_courses_and_progress_isolation.sql")
    assert migration_file.exists(), "Migration 007 file must exist"

    sql = migration_file.read_text(encoding="utf-8")
    assert "CREATE TABLE IF NOT EXISTS public.user_courses" in sql
    assert "target_language" in sql
    assert "regional_variant" in sql
    assert "explanation_language" in sql
    assert "cefr_level" in sql
    assert "completed_curriculum_node_ids" in sql
    assert "ENABLE ROW LEVEL SECURITY" in sql
    assert "uq_user_course" in sql
    assert "public.set_active_course" in sql


def test_migration_007_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/007_multiple_courses_and_progress_isolation_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 007 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    assert "DROP TABLE IF EXISTS public.user_courses" in sql
    assert "DROP FUNCTION IF EXISTS public.set_active_course" in sql
