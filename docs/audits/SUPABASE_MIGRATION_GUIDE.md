# Lexilume — Supabase Database Migration & Reset Operator Guide

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Website:** `https://lexi.monster`  
> **Environment:** Production & Staging Supabase Projects  
> **Status:** Operator Runbook Ready (Pending Operator Authorization)  
> **Date:** October 31, 2026  

---

> [!CAUTION]
> **STOP CONDITION IN EFFECT:**  
> Do not execute destructive operations automatically. This document outlines the exact, step-by-step procedures to reset and rebuild the database. **Execute these steps only after creating a verified backup and obtaining explicit human confirmation.**

---

## 1. Project & Environment Identification

- **Production URL:** `https://lexi.monster`
- **Supabase Target Instance:** Configured via `SUPABASE_URL` / `VITE_SUPABASE_URL` in production environment secrets.
- **Affected Schemas:** Schema `public` (tables, functions, triggers, policies, and sequences).
- **Unaffected Schemas:** Schema `auth` (users, sessions, identities, and refresh tokens remain intact if using the standard reset script).

---

## 2. Expected Data-Loss Impact

Resetting the `public` schema in the Supabase PostgreSQL database will drop:
- `public.user_profiles`
- `public.user_roles`
- `public.admin_audit_logs`
- `public.user_courses`
- `public.user_learning_tracks`
- `public.srs_items`
- `public.saved_translations`
- `public.cultural_bookmarks`
- `public.exercise_attempts`
- `public.daily_lessons`
- `public.lesson_assignments`
- `public.email_deliveries`
- `public.retention_cleanup_logs`

### Impact Summary
1. **Registered Users:** Accounts in `auth.users` are **preserved**. When a user logs back in after the reset, the `handle_new_user()` trigger or client profile restoration recreates their profile entry automatically.
2. **Offline Data:** Any data stored locally in Dexie / IndexedDB on learner browsers (e.g. `savedVocabulary`, `srsReviews`, `cachedLessons`, `culturalBookmarks`) will remain intact in their browser and automatically replay to Supabase via `syncEngine` upon reconnecting!
3. **Remote Learning Progress:** Progress stored exclusively on the remote database without local browser cache will be removed unless backed up prior to teardown.

---

## 3. Mandatory Pre-Reset Backup Procedure

Before executing any destructive database actions, run the backup CLI command using service-role credentials:

```bash
# 1. Set environment variables
export SUPABASE_URL="https://<your-project-id>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# 2. Run the essential progress backup tool
python scripts/backup_restore.py backup --output-dir backups/
```

### What this backs up:
- All `user_learning_tracks`
- All `srs_items` (SM-2 intervals, ease factors, repetition history)
- All `exercise_attempts` (scores, submissions, feedback)
- Output format: Versioned, timestamped JSON file (e.g. `backups/polyglot_backup_20261031_000000.json`).

Verify that the backup file exists and contains non-empty records before proceeding.

---

## 4. Exact Reset & Migration Commands

### Step 4.1: Teardown Existing Tables
1. Open your Supabase Project Dashboard:  
   `https://supabase.com/dashboard/project/<your-project-id>`
2. In the left navigation, click on **SQL Editor**.
3. Open or paste the contents of:  
   [`supabase/canonical/reset_and_rebuild.sql`](supabase/canonical/reset_and_rebuild.sql)
4. Review the statements and click **Run**.
5. Verify output: `Success. No rows returned`. All conflicting tables and legacy triggers are now safely removed.

### Step 4.2: Apply the Canonical Baseline Schema
1. In the Supabase **SQL Editor**, create a new query.
2. Open or paste the full contents of:  
   [`supabase/canonical/001_canonical_baseline.sql`](supabase/canonical/001_canonical_baseline.sql)
3. Click **Run**.
4. Verify output: `Success. No rows returned`.

---

## 5. Post-Reset Data Restoration

To restore learner progress from your pre-reset backup file:

```bash
# 1. Preview restoration in dry-run mode (zero mutations)
python scripts/backup_restore.py restore --file backups/polyglot_backup_<timestamp>.json --dry-run

# 2. Execute restoration into the clean canonical database
python scripts/backup_restore.py restore --file backups/polyglot_backup_<timestamp>.json
```

---

## 6. Post-Migration Verification Steps

### 6.1 Database Schema Query
Run the following SQL check in the Supabase SQL Editor:

```sql
SELECT table_name, count(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles', 'user_roles', 'admin_audit_logs', 'user_courses', 
    'user_learning_tracks', 'srs_items', 'saved_translations', 
    'cultural_bookmarks', 'exercise_attempts', 'daily_lessons', 
    'lesson_assignments', 'email_deliveries', 'retention_cleanup_logs'
  )
GROUP BY table_name
ORDER BY table_name;
```

**Expected Result:** 13 rows returned, corresponding to all canonical application tables.

### 6.2 Automated Connection & Health Verification
Execute the central connection verification script:

```bash
python scripts/verify_connections.py
```

Expected output:
- `[CONNECTED] Supabase Database PostgREST responded with HTTP 200 OK!`

### 6.3 Run Integration & Unit Test Suites
```bash
# Frontend Tests
npm --prefix frontend test -- --run

# Python Learning Engine Tests
python -m pytest tests/ -v

# Frontend Production Build
npm --prefix frontend run build
```

---

## 7. Rollback & Recovery Strategy

If unforeseen complications arise during the baseline execution:
1. Re-run `supabase/canonical/reset_and_rebuild.sql`.
2. Apply the previous historical migration chain in order:
   `001_initial_schema.sql` through `011_daily_lessons_reconciliation.sql`.
3. Restore learner data using `python scripts/backup_restore.py restore --file <backup_file>`.
