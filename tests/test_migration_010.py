"""
Lexilume — Verification of Migration 010 (Database Persistence & Sync Repair).
"""

from pathlib import Path


def test_migration_010_sql_integrity():
    migration_file = Path("supabase/migrations/010_database_persistence_and_sync_repair.sql")
    assert migration_file.exists(), "Migration 010 file must exist"

    sql = migration_file.read_text(encoding="utf-8")
    assert "Users can insert own profile" in sql
    assert "handle_new_user()" in sql
    assert "cultural_bookmarks_user_id_fkey" in sql
    assert "saved_translations_user_id_fkey" in sql
    assert "trg_sync_user_course_to_learning_track" in sql
    assert "ENABLE ROW LEVEL SECURITY" in sql


def test_migration_010_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/010_database_persistence_and_sync_repair_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 010 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    assert "DROP TRIGGER IF EXISTS trg_sync_user_course_to_learning_track" in sql
    assert "DROP POLICY IF EXISTS" in sql
