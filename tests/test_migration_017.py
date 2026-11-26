"""
Lexilume — Verification of Migration 017 (AI Platform Persistence).
"""

from pathlib import Path


def test_migration_017_sql_integrity():
    migration_file = Path("supabase/migrations/017_ai_platform_persistence.sql")
    assert migration_file.exists(), "Migration 017 file must exist"

    sql = migration_file.read_text(encoding="utf-8")

    expected_tables = [
        "public.content_generation_schedules",
        "public.content_generation_runs",
        "public.content_generation_jobs",
        "public.content_generation_attempts",
        "public.content_prompt_templates",
        "public.content_validation_reports",
        "public.ai_provider_usage",
        "public.discovery_sources",
        "public.discovery_fetch_runs",
        "public.discovery_items",
        "public.discovery_enrichments",
    ]
    for table in expected_tables:
        assert f"CREATE TABLE IF NOT EXISTS {table}" in sql, f"Missing table {table}"
        assert f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;" in sql, f"Missing RLS on {table}"

    assert "ALTER TABLE public.content_review_items" in sql
    assert "uq_content_review_items_idempotency" in sql
    assert "ck_content_review_items_content_type" in sql
    assert "ck_content_review_items_cefr_level" in sql
    assert "Public read published discovery_items" in sql


def test_migration_017_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/017_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 017 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    for table in (
        "public.discovery_enrichments",
        "public.discovery_items",
        "public.ai_provider_usage",
        "public.content_validation_reports",
        "public.content_generation_attempts",
        "public.content_generation_jobs",
        "public.content_generation_runs",
        "public.content_generation_schedules",
    ):
        assert f"DROP TABLE IF EXISTS {table} CASCADE;" in sql
