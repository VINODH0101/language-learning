"""
Lexilume — Verification of Migration 015 (Content-Centred Architecture).
"""

from pathlib import Path


def test_migration_015_sql_integrity():
    migration_file = Path("supabase/migrations/015_content_centred_architecture.sql")
    assert migration_file.exists(), "Migration 015 file must exist"

    sql = migration_file.read_text(encoding="utf-8")

    # 1. Essential Target Tables
    expected_tables = [
        "public.content_sources",
        "public.content_items",
        "public.content_versions",
        "public.learning_activities",
        "public.learner_content_progress",
        "public.user_saved_words",
        "public.user_word_review_events",
        "public.user_mistakes",
        "public.content_processing_jobs",
        "public.migration_exception_logs",
    ]
    for table in expected_tables:
        assert f"CREATE TABLE IF NOT EXISTS {table}" in sql, f"Missing table {table}"

    # 2. Risk 1 Mitigation: Cross-Language Lemma Collision Protection
    assert "CONSTRAINT uq_user_saved_words UNIQUE (user_id, target_language, lemma, pos, explanation_language)" in sql

    # 3. Risk 2 Mitigation: Full SM-2 Scheduling Fields
    sm2_fields = [
        "ease_factor",
        "interval_days",
        "repetitions",
        "lapses",
        "last_reviewed_at",
        "next_review",
        "legacy_srs_item_id",
    ]
    for field in sm2_fields:
        assert field in sql, f"Missing SM-2 field {field}"

    # 4. Risk 5 Mitigation: client_mutation_id on user progress, saved words, and mistakes
    assert "client_mutation_id" in sql
    assert "idx_learner_progress_mutation" in sql
    assert "idx_user_saved_words_mutation" in sql
    assert "idx_user_mistakes_mutation" in sql

    # 5. Risk 6 Mitigation: Compatibility Views declare WITH (security_invoker = true)
    assert "CREATE OR REPLACE VIEW public.english_content_items \nWITH (security_invoker = true)" in sql or \
           "WITH (security_invoker = true)" in sql
    assert "v_legacy_srs_items" in sql
    assert "v_legacy_daily_content" in sql

    # 6. RLS Enabled on All Tables
    for table in expected_tables:
        assert f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;" in sql

    # 7. User Isolation Policies
    assert "Learner reads own progress" in sql
    assert "User reads own saved words" in sql
    assert "User reads own mistakes" in sql


def test_migration_015_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/015_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 015 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    assert "DROP VIEW IF EXISTS public.v_legacy_daily_content" in sql
    assert "DROP VIEW IF EXISTS public.v_legacy_srs_items" in sql
    assert "DROP VIEW IF EXISTS public.english_content_items" in sql
    assert "DROP TABLE IF EXISTS public.content_items" in sql
    assert "DROP TABLE IF EXISTS public.user_saved_words" in sql
    assert "DROP TABLE IF EXISTS public.user_mistakes" in sql
