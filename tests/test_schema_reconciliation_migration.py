"""
Lexilume — Verification of Migration 009 (Schema Reconciliation & Table Consistency).
"""

from pathlib import Path


def test_migration_009_sql_integrity():
    migration_file = Path("supabase/migrations/009_schema_reconciliation_and_sync.sql")
    assert migration_file.exists(), "Migration 009 file must exist"

    sql = migration_file.read_text(encoding="utf-8")
    assert "CREATE TABLE IF NOT EXISTS public.user_learning_tracks" in sql
    assert "CREATE TABLE IF NOT EXISTS public.srs_items" in sql
    assert "CREATE TABLE IF NOT EXISTS public.exercise_attempts" in sql
    assert "ALTER TABLE public.email_deliveries" in sql
    assert "ENABLE ROW LEVEL SECURITY" in sql
    assert "Users can assign default role on registration" in sql
    assert "uq_user_learning_tracks" in sql
    assert "uq_srs_user_vocab" in sql


def test_migration_009_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/009_schema_reconciliation_and_sync_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 009 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    assert "DROP TABLE IF EXISTS public.user_learning_tracks" in sql
    assert "DROP TABLE IF EXISTS public.srs_items" in sql
    assert "DROP TABLE IF EXISTS public.exercise_attempts" in sql
    assert "DROP POLICY IF EXISTS" in sql
