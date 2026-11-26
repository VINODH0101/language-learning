# Lexilume — Schema Verification Report: Migration 015

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Migration Verified:** `supabase/migrations/015_content_centred_architecture.sql`  
> **Rollback Verified:** `supabase/migrations/rollback/015_rollback.sql`  
> **Test Suite:** `tests/test_migration_015.py`  
> **Verification Status:** 100% PASSED (Automated Verification)  

---

## 1. Automated Test Execution

The migration was evaluated against the Pytest test suite:
```
tests/test_migration_015.py::test_migration_015_sql_integrity PASSED [ 50%]
tests/test_migration_015.py::test_migration_015_rollback_sql_integrity PASSED [100%]
============================== 2 passed in 0.38s ==============================
```

---

## 2. Verification Matrix: Structural Objects

| Target Object | Object Type | Constraints & Key Features | Verification Result |
| :--- | :--- | :--- | :--- |
| `public.content_sources` | BASE TABLE | `id UUID PK`, `source_type CHECK`, `license_type` | **PASSED** |
| `public.content_items` | BASE TABLE | `slug UNIQUE`, `target_language CHECK`, `genre CHECK`, `primary_cefr CHECK` | **PASSED** |
| `public.content_versions` | BASE TABLE | `(content_item_id, version_number) UNIQUE`, `structured_payload JSONB`, GIN index | **PASSED** |
| `public.learning_activities` | BASE TABLE | `(content_version_id, activity_order) UNIQUE`, `activity_type CHECK` | **PASSED** |
| `public.learner_content_progress` | BASE TABLE | `(user_id, content_item_id) UNIQUE`, `client_mutation_id` | **PASSED** |
| `public.user_saved_words` | BASE TABLE | `(user_id, target_language, lemma, pos, explanation_language) UNIQUE` | **PASSED** |
| `public.user_word_review_events` | BASE TABLE | `rating CHECK (0-5)`, `saved_word_id FK`, `user_id FK` | **PASSED** |
| `public.user_mistakes` | BASE TABLE | `error_category CHECK`, `occurrences_count >= 1`, `client_mutation_id` | **PASSED** |
| `public.content_processing_jobs` | BASE TABLE | `status CHECK`, `stage_outputs JSONB`, `retry_count >= 0` | **PASSED** |
| `public.migration_exception_logs` | BASE TABLE | `source_table`, `source_record_id`, `reason` | **PASSED** |
| `public.english_content_items` | VIEW | `WITH (security_invoker = true)`, filters `target_language = 'en'` | **PASSED** |
| `public.v_legacy_srs_items` | VIEW | `WITH (security_invoker = true)`, maps `user_saved_words` | **PASSED** |
| `public.v_legacy_daily_content` | VIEW | `WITH (security_invoker = true)`, maps published content versions | **PASSED** |

---

## 3. Verification Matrix: Phase 5 Risk Register Mitigations

| Risk ID | Requirement | Implementation in Migration 015 | Status |
| :--- | :--- | :--- | :--- |
| **RISK-01** | Multilingual lemma collision prevention | `CONSTRAINT uq_user_saved_words UNIQUE (user_id, target_language, lemma, pos, explanation_language)` | **RESOLVED & VERIFIED** |
| **RISK-02** | SM-2 scheduling parameters complete retention | Columns `ease_factor`, `interval_days`, `repetitions`, `lapses`, `last_reviewed_at`, `next_review`, `legacy_srs_item_id` in `user_saved_words` | **RESOLVED & VERIFIED** |
| **RISK-03** | Stable surrogate keys for progress & mistakes | Relational UUID foreign keys (`content_item_id`, `content_version_id`, `activity_id`) | **RESOLVED & VERIFIED** |
| **RISK-04** | Idempotent transaction execution | Migration DDL uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and safe trigger blocks | **RESOLVED & VERIFIED** |
| **RISK-05** | Guest sync and retry idempotency | `client_mutation_id` column and partial index on all learner mutation tables | **RESOLVED & VERIFIED** |
| **RISK-06** | View Row-Level Security bypass prevention | All 3 views declare `WITH (security_invoker = true)` | **RESOLVED & VERIFIED** |

---

## 4. Verification Matrix: Row-Level Security (RLS)

All 10 target tables have RLS enabled:
- Anonymous users have strictly read-only access to published content items, published content versions, and their associated activities.
- Authenticated learners have read/write access strictly scoped to their own data (`auth.uid() = user_id`).
- Administrative actions (`content_sources` write, unpublished `content_items`, `content_processing_jobs`, `migration_exception_logs`) require `public.is_admin()` or `service_role`.
