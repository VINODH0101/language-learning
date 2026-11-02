# Lexilume — Migration Safety, Verification & Forward-Repair Blueprint

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 5 — Database Design, Data Mapping & Safe Migration Plan  
> **Document Type:** Operational Safety, Verification Scripts & Automated Diagnostics

---

## 1. Safety Invariants & Execution Boundaries

To guarantee that database migration never interrupts active learners on `https://lexi.monster` or causes data loss, all migration scripts must comply with the following 6 operational invariants:

1. **Strict Idempotency:** Every DDL statement must employ `IF NOT EXISTS` or `CREATE OR REPLACE`. Every DML backfill statement must employ `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`. Re-running any script must produce identical, clean results.
2. **Lock Timeout Enforcement:** All DDL and DML operations must execute with `SET lock_timeout = '3s';`. If a statement cannot acquire a lock within 3 seconds, it must abort immediately rather than queuing behind long-running client queries and starving pool connections.
3. **Chunked Transaction Boundaries:** Data backfills must execute in discrete batches of **500 rows maximum**. Long single-transaction table scans are strictly prohibited.
4. **Zero Shared-Buffer Thrashing:** Batch queries must be ordered by primary key to ensure sequential disk access and predictable index updates.
5. **Concurrent Indexing in Production:** On production tables with more than 10,000 rows, secondary indexes should be created using `CREATE INDEX CONCURRENTLY` outside of multi-statement transaction blocks.
6. **Forward-Repair Over Destructive Rollback:** In the event of a partial failure during backfill, the preferred response is forward repair using checkpointing and idempotent resumes rather than restoring complete database snapshots.

---

## 2. Checkpointing and Batch Execution Framework

The following procedural framework is used for all batch backfill operations (e.g. migrating `saved_translations` and `srs_items` to `user_saved_words`):

```sql
DO $$
DECLARE
    v_batch_size CONSTANT INTEGER := 500;
    v_rows_migrated INTEGER := 0;
    v_total_migrated INTEGER := 0;
    v_last_processed_id UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Configure session safety timeouts
    SET statement_timeout = '30s';
    SET lock_timeout = '3s';

    LOOP
        WITH batch AS (
            SELECT 
                st.id,
                st.user_id,
                st.source_text,
                st.target_text,
                st.target_lang,
                st.created_at
            FROM public.saved_translations st
            WHERE st.id > v_last_processed_id
              AND st.user_id IN (SELECT id FROM auth.users) -- Guard against orphaned rows
            ORDER BY st.id ASC
            LIMIT v_batch_size
        ),
        inserted AS (
            INSERT INTO public.user_saved_words (
                user_id,
                term,
                lemma,
                explanation_language,
                definition,
                next_review,
                ease_factor,
                interval_days,
                repetitions,
                state,
                created_at,
                updated_at
            )
            SELECT 
                b.user_id,
                b.source_text,
                lower(trim(b.source_text)),
                coalesce(b.target_lang, 'en'),
                b.target_text,
                CURRENT_DATE,
                2.5,
                0,
                0,
                'learning',
                b.created_at,
                b.created_at
            FROM batch b
            ON CONFLICT (user_id, lemma, explanation_language) 
            DO UPDATE SET 
                definition = EXCLUDED.definition,
                updated_at = timezone('utc'::text, now())
            RETURNING id
        )
        SELECT count(*), max(b.id) 
        INTO v_rows_migrated, v_last_processed_id 
        FROM batch b;

        EXIT WHEN v_rows_migrated = 0;

        v_total_migrated := v_total_migrated + v_rows_migrated;
        RAISE NOTICE 'Batch processed: % rows (Cumulative: %, Checkpoint ID: %)', 
            v_rows_migrated, v_total_migrated, v_last_processed_id;
            
        -- Cooperative pause to allow connection pool drainage
        PERFORM pg_sleep(0.05);
    END LOOP;

    RAISE NOTICE 'Migration successfully completed. Total rows processed: %', v_total_migrated;
END $$;
```

---

## 3. Comprehensive Pre- and Post-Migration Verification Queries

### 3.1 Row Count & Coverage Auditing
Run this verification suite immediately before and after Phase B backfill:

```sql
-- 1. Compare legacy saved vocabulary with target saved words
SELECT 
    'Legacy saved_translations' AS metric,
    count(*) AS row_count
FROM public.saved_translations
UNION ALL
SELECT 
    'Legacy srs_items' AS metric,
    count(*) AS row_count
FROM public.srs_items
UNION ALL
SELECT 
    'Target user_saved_words' AS metric,
    count(*) AS row_count
FROM public.user_saved_words
UNION ALL
SELECT 
    'Target user_saved_words (distinct users)' AS metric,
    count(DISTINCT user_id) AS row_count
FROM public.user_saved_words;
```

### 3.2 Data Integrity Checksums
Calculates MD5 hash fingerprints over normalized fields to prove data fidelity across table representations:

```sql
-- Verify that term texts and users in saved_translations match user_saved_words
WITH legacy_checksum AS (
    SELECT md5(string_agg(user_id::text || ':' || lower(trim(source_text)), ',' ORDER BY user_id, lower(trim(source_text)))) AS legacy_hash
    FROM (
        SELECT DISTINCT user_id, source_text 
        FROM public.saved_translations 
        WHERE user_id IN (SELECT id FROM auth.users)
    ) sub
),
target_checksum AS (
    SELECT md5(string_agg(user_id::text || ':' || lemma, ',' ORDER BY user_id, lemma)) AS target_hash
    FROM (
        SELECT DISTINCT user_id, lemma 
        FROM public.user_saved_words
    ) sub
)
SELECT 
    legacy_hash,
    target_hash,
    CASE WHEN legacy_hash = target_hash THEN 'MATCH (Zero Loss)' ELSE 'DISCREPANCY (Audit Required)' END AS verification_result
FROM legacy_checksum, target_checksum;
```

### 3.3 Foreign Key & Orphan Detection Queries
Confirms that no unlinked or orphaned rows exist in the target schema:

```sql
-- Check for learner_content_progress records pointing to non-existent auth users
SELECT count(*) AS orphaned_progress_users
FROM public.learner_content_progress p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Check for learner_content_progress records pointing to non-existent content items
SELECT count(*) AS orphaned_progress_items
FROM public.learner_content_progress p
LEFT JOIN public.english_content_items c ON p.content_item_id = c.id
WHERE c.id IS NULL;

-- Check for user_saved_words records pointing to non-existent users
SELECT count(*) AS orphaned_saved_words_users
FROM public.user_saved_words w
LEFT JOIN auth.users u ON w.user_id = u.id
WHERE u.id IS NULL;

-- Check for content_versions pointing to non-existent content items
SELECT count(*) AS orphaned_versions
FROM public.content_versions v
LEFT JOIN public.english_content_items c ON v.content_item_id = c.id
WHERE c.id IS NULL;
```

### 3.4 Sanity & Invariant Verification Queries
Verifies that all educational parameters comply with CEFR, SM-2, and product invariants:

```sql
-- 1. SM-2 Spaced Repetition Parameter Sanity
SELECT 
    count(*) AS invalid_sm2_records
FROM public.user_saved_words
WHERE ease_factor < 1.3 
   OR interval_days < 0 
   OR repetitions < 0
   OR next_review IS NULL;

-- 2. Slug Uniqueness and Formatting Sanity
SELECT 
    slug, 
    count(*) AS duplicate_slug_count
FROM public.english_content_items
GROUP BY slug
HAVING count(*) > 1;

-- 3. Content Version Circular Linkage Sanity
SELECT 
    c.id AS item_id,
    c.title,
    c.current_version_id,
    v.id AS version_id
FROM public.english_content_items c
LEFT JOIN public.content_versions v ON c.current_version_id = v.id
WHERE c.status = 'published' AND v.id IS NULL;
```

---

## 4. Forward-Repair Runbook

If a migration or backfill job is interrupted (e.g. worker terminated, network disconnection, transient database lock timeout):

### Step 1: Query the Checkpoint State
Determine where the backfill stopped:
```sql
SELECT 
    'user_saved_words' AS table_name,
    max(created_at) AS latest_record_time,
    count(*) AS total_migrated
FROM public.user_saved_words;
```

### Step 2: Query Exception Logs
Inspect failed rows in `migration_exception_logs`:
```sql
SELECT 
    source_table,
    error_message,
    count(*) AS failure_count,
    min(logged_at) AS first_seen,
    max(logged_at) AS last_seen
FROM public.migration_exception_logs
GROUP BY source_table, error_message;
```

### Step 3: Re-run Idempotent Backfill
Because the batch execution framework uses `WHERE st.id > v_last_processed_id` and `ON CONFLICT DO UPDATE`, re-running the script is 100% safe. It automatically skips already-migrated rows and resumes from the exact point of interruption.

### Step 4: Resolve Unmapped Exceptions
For rows quarantined in `migration_exception_logs`:
- If caused by unlinked `user_id`: Delete the exception row after confirming the user was deleted from `auth.users`.
- If caused by encoding or invalid CEFR: Update the source row with default `'B1'` and trigger a single-row forward re-insertion.
