# Lexilume — Migration Execution Guide: Migration 015

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production URL:** `https://lexi.monster`  
> **Migration Script:** `supabase/migrations/015_content_centred_architecture.sql`  
> **Rollback Script:** `supabase/migrations/rollback/015_rollback.sql`  
> **Document Type:** Step-by-Step Operator Runbook & Verification Manual  

---

## 1. Safety Protocols & Pre-Flight Checks

> [!CAUTION]
> **Production Remote Execution Rule:**  
> Never execute destructive DDL or drop production tables without explicit operator authorization. Verify the baseline row count before execution.

### Pre-Flight Verification Checklist:
1. Confirm Supabase project URL and service role key are configured for the target environment.
2. Confirm repository migrations `001` through `014` are present and unmutated.
3. Verify that application tables are empty or contain only verified test rows:
   ```sql
   SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
   FROM (
     SELECT table_name, 
            query_to_xml(format('SELECT COUNT(*) as cnt FROM public.%I', table_name), false, true, '') as xml_count
     FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
   ) t ORDER BY table_name;
   ```
4. Verify database user privileges: The executing role must have `SUPERUSER` or `postgres` admin role to create tables, triggers, and RLS policies.

---

## 2. Local Verification (Completed & Automated)

The migration script has been tested and verified via automated test suite:
```bash
python -m pytest tests/test_migration_015.py -v
```
All assertions pass:
- All 10 tables defined with `CREATE TABLE IF NOT EXISTS`.
- All constraints, unique keys, and foreign keys verified.
- Risk 1 (multilingual lemma collision) unique constraint verified.
- Risk 2 (SM-2 scheduling columns) verified.
- Risk 5 (`client_mutation_id`) verified on learner tables.
- Risk 6 (`WITH (security_invoker = true)`) verified on compatibility views.
- RLS enabled on all 10 tables.

---

## 3. Production Staging & Remote Deployment Instructions

### Method A: Supabase CLI (Recommended)
```bash
# Push migration to remote Supabase project
supabase db push
```

### Method B: Supabase Dashboard SQL Editor
1. Log in to the Supabase Console for `https://lexi.monster`.
2. Navigate to **SQL Editor** -> **New Query**.
3. Paste the complete contents of `supabase/migrations/015_content_centred_architecture.sql`.
4. Click **Run**.
5. Check output panel for `Success. No rows returned`.

---

## 4. Post-Execution Validation Queries

Run the following queries to verify deployment integrity:

### 4.1 Verify Table Creation
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'content_sources', 'content_items', 'content_versions', 
    'learning_activities', 'learner_content_progress', 
    'user_saved_words', 'user_word_review_events', 'user_mistakes', 
    'content_processing_jobs', 'migration_exception_logs'
  );
-- Expected count: 10 rows
```

### 4.2 Verify Compatibility Views
```sql
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('english_content_items', 'v_legacy_srs_items', 'v_legacy_daily_content');
-- Expected count: 3 rows
```

### 4.3 Verify Row-Level Security Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'content_sources', 'content_items', 'content_versions', 
    'learning_activities', 'learner_content_progress', 
    'user_saved_words', 'user_word_review_events', 'user_mistakes', 
    'content_processing_jobs', 'migration_exception_logs'
  );
-- Expected: rowsecurity = true for all 10 rows
```

---

## 5. Rollback Procedure

If unexpected errors occur during staging or remote migration:
1. Open SQL Editor in Supabase.
2. Execute the complete contents of `supabase/migrations/rollback/015_rollback.sql`.
3. Verify that the 3 compatibility views and 10 target tables are dropped cleanly.
4. Existing legacy tables (`user_profiles`, `user_courses`, `srs_items`, etc.) remain completely untouched.
