# Lexilume Phase 8 — Migration Reliability Report

> **Repository:** `VINODH0101/language-learning`  
> **Branch:** `phase-8-reliability-quality`  
> **Milestone:** Milestone 8.1 — Database Integrity and Migration Reliability  
> **Migration Inspected:** `015_content_centred_architecture.sql` & `rollback/015_rollback.sql`

---

## 1. Executive Summary

During the Phase 8 baseline audit, defect `RISK-801` was identified: migration 015 used bare `CREATE POLICY` statements without idempotent drop guards. Because PostgreSQL does not support `IF NOT EXISTS` on `CREATE POLICY`, applying migration 015 a second time resulted in immediate abort errors (`policy already exists`). 

Milestone 8.1 resolved this defect across all 16 RLS policies, hardened the trigger function declarations, verified the clean rollback script, and added automated validation tests.

---

## 2. Idempotency Remediation (`RISK-801`)

Every RLS policy in `supabase/migrations/015_content_centred_architecture.sql` now follows the idempotent drop-and-create pattern:

```sql
-- Pattern implemented across all 16 policies:
DROP POLICY IF EXISTS "Public read access on content_sources" ON public.content_sources;
CREATE POLICY "Public read access on content_sources"
    ON public.content_sources FOR SELECT
    USING (true);
```

### Affected Policies Hardened:
1. `content_sources`: Public read, Admin write (2 policies).
2. `content_items`: Public read published, Admin write (2 policies).
3. `content_versions`: Public read published, Admin write (2 policies).
4. `learning_activities`: Public read published, Admin write (2 policies).
5. `learner_content_progress`: Learner select, insert, update, delete (4 policies).
6. `user_saved_words`: User select, insert, update, delete (4 policies).
7. `user_word_review_events`: User select, insert (2 policies).
8. `user_mistakes`: User select, insert, update, delete (4 policies).
9. `content_processing_jobs`: Admin access (1 policy).
10. `migration_exception_logs`: Admin access (1 policy).

---

## 3. Trigger and Function Idempotency

Both procedural functions and triggers employ defensive procedural blocks:
1. `update_updated_at_column()`: Guarded by `IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column')`.
2. `prevent_published_version_mutation()`: Guarded by `IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_published_version_mutation')`.
3. All triggers: Preceded by explicit `DROP TRIGGER IF EXISTS trg_... ON ...;`.

---

## 4. Rollback Verification

`supabase/migrations/rollback/015_rollback.sql` drops objects in reverse dependency order:
1. Compatibility Views (`CASCADE`): `v_legacy_daily_content`, `v_legacy_srs_items`, `english_content_items`.
2. Tables in reverse dependency order (`CASCADE`): `migration_exception_logs` down to `content_sources`.
3. Custom Functions and Triggers (`CASCADE`): `prevent_published_version_mutation`, `update_updated_at_column`.

---

## 5. Automated Python Test Evidence

Executed via `python -m pytest tests/test_migration_015.py -v`:
- `test_migration_015_sql_integrity`: **PASSED (0.24s)**
- `test_migration_015_rollback_sql_integrity`: **PASSED (0.24s)**
