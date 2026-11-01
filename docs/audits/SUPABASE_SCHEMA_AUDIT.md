# Lexilume — Supabase Database Architecture & Schema Audit

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Website:** `https://lexi.monster`  
> **Status:** Completed Pre-Rebuild Audit  
> **Date:** October 31, 2026  

---

## 1. Executive Summary

This audit provides an exhaustive inspection of Lexilume's current database architecture across all 11 existing migrations, the React/TypeScript frontend (`frontend/src/`), the Python learning engine (`engine/`), background maintenance scripts (`scripts/`), and automation workflows (`.github/workflows/`).

The audit confirms that while individual features function correctly, the database schema has evolved incrementally over 11 migrations, resulting in structural inconsistencies, obsolete tables, competing foreign-key targets, and redundant progress stores. A clean, canonical schema rebuild will eliminate technical debt, harmonize naming conventions, optimize RLS evaluation, and guarantee seamless offline-to-cloud synchronization.

---

## 2. Inventory of Existing Migration Files

| Migration File | Primary Responsibility | Key Issues / Inconsistencies Identified |
| :--- | :--- | :--- |
| `001_initial_schema.sql` | Initial schema: user profiles, curriculum, vocabulary, daily lessons, exercises, SRS history | Created surrogate PK `user_profiles.id` separate from `auth_user_id`; created legacy tables `user_vocabulary_history` and `lesson_exercises`. |
| `002_rls_policies.sql` | Initial RLS policies for educational reference & user tables | Used slow subqueries `USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))`. |
| `003_email_and_retention.sql` | Email delivery ledger & retention cleanup audit logs | Referenced nonexistent table `public.users(id)` instead of `auth.users(id)`. |
| `004_minimal_wikipedia_assignments.sql` | Minimal Wikipedia reading assignments (`lesson_assignments`) | Referenced `public.user_profiles(id)` but evaluated RLS with `auth.uid() = user_id`. |
| `005_language_directions_and_saved_translations.sql` | Saved vocabulary translations and user language directions | Added `saved_translations` with FK to `user_profiles(id)` while RLS checked `auth.uid() = user_id`. |
| `006_auth_roles_audit_and_onboarding.sql` | User roles (`user_roles`), admin audit logs, onboarding preferences | Switched FK to `auth.users(id)` for roles and audit logs, creating hybrid FK targets across tables. |
| `007_multiple_courses_and_progress_isolation.sql` | Multi-course management (`user_courses`) | Created `user_courses` with direct FK to `auth.users(id)`, duplicating concept of `language_tracks`. |
| `008_cultural_bookmarks_and_sync.sql` | Cultural bookmarks table & quota enforcement | Re-introduced FK to `user_profiles(id)`, conflicting with `auth.uid() = user_id` RLS policy. |
| `009_schema_reconciliation_and_sync.sql` | Schema reconciliation for Python engine (`user_learning_tracks`, `srs_items`, `exercise_attempts`) | Created `user_learning_tracks`, `srs_items`, and `exercise_attempts` with unconstrained `UUID NOT NULL`. |
| `010_database_persistence_and_sync_repair.sql` | Persistence repair, `handle_new_user()` trigger, course sync trigger | Repaired FKs on `cultural_bookmarks` and `saved_translations` to `auth.users(id)`; bridged `user_courses` and `user_learning_tracks`. |
| `011_daily_lessons_reconciliation.sql` | Reconciled `daily_lessons` columns with Python PostgREST requests | Added `language`, `cefr_level`, `content_fingerprint`, `payload`, and dual payload sync trigger. |

---

## 3. Discrepancies and Inconsistencies Analyzed

### 3.1 Foreign-Key Root Discrepancies
- **The Issue:** Three different foreign-key targets were used across migrations:
  1. `public.user_profiles(id)` (Migrations 001, 004, 005, 008)
  2. `auth.users(id)` (Migrations 006, 007, 010)
  3. `public.users(id)` (Migration 003 — invalid table name)
  4. Unconstrained `UUID NOT NULL` (Migration 009)
- **The Impact:** When `user_id` references `user_profiles(id)`, an RLS policy of `USING (auth.uid() = user_id)` fails unless `user_profiles.id` equals `auth_user_id`. Furthermore, cascade deletions in Supabase Auth do not propagate cleanly across all child tables.
- **Canonical Solution:** Point all user-owned tables directly to `auth.users(id) ON DELETE CASCADE`. Ensure `public.user_profiles` uses `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` with `auth_user_id` matching `id`.

### 3.2 Dual Progress Representation (`user_courses` vs `user_learning_tracks`)
- **The Issue:**
  - Frontend `courseService.ts` and `syncEngine.ts` interact with `public.user_courses` (`target_language`, `regional_variant`, `cefr_level`, `explanation_language`).
  - Python engine `supabase_repository.py` interacts with `public.user_learning_tracks` (`language`, `regional_variety`, `current_cefr_level`, `target_cefr_level`).
- **The Impact:** Without automated synchronization, progress made on the web does not reflect in Python batch engines (e.g., daily email digest generation), and vice versa.
- **Canonical Solution:** Maintain both tables in the canonical schema for full cross-stack compatibility, backed by the database trigger `sync_user_course_to_learning_track()` that synchronizes insertions and updates from `user_courses` into `user_learning_tracks` in real time.

### 3.3 Obsolete Tables
- **`public.user_vocabulary_history`:** Created in Migration 001, but completely superseded by `public.srs_items` (Migration 009). It is not queried or written to anywhere in frontend or backend code.
- **`public.lesson_exercises`:** Created in Migration 001, but completely superseded by `public.exercise_attempts` (Migration 009). The single reference in `scripts/retention_cleanup.py` has now been updated to `exercise_attempts`.
- **`public.language_tracks`:** Created in Migration 001, but completely superseded by `user_courses` (Migration 007) and `user_learning_tracks` (Migration 009).
- **Canonical Solution:** Retire these 3 legacy tables from the canonical baseline.

### 3.4 Payload Duality in `daily_lessons`
- **The Issue:** Migration 001 named the lesson JSON column `content_payload`, while the Python engine and API queries wrote to `payload`.
- **Canonical Solution:** Define both `payload JSONB` and `content_payload JSONB` in the baseline, synchronized automatically via `trg_sync_daily_lessons_payload`.

---

## 4. Full Table & Column Usage Mapping

### 4.1 Frontend TypeScript (`frontend/src/`)
| Table Name | Operations | Columns Referenced | Used In Files |
| :--- | :--- | :--- | :--- |
| `user_profiles` | SELECT, INSERT, UPDATE | `id`, `auth_user_id`, `email`, `full_name`, `native_language`, `primary_target_language`, `interface_language`, `explanation_language`, `study_mode`, `daily_goal_minutes`, `theme`, `account_status`, `is_active`, `last_active_at` | `auth.ts`, `syncEngine.ts` |
| `user_roles` | SELECT, INSERT, UPDATE | `user_id`, `role`, `assigned_by` | `auth.ts` |
| `admin_audit_logs` | INSERT | `admin_id`, `action`, `target_user_id`, `details` | `auth.ts` |
| `user_courses` | SELECT, UPSERT, DELETE | `id`, `user_id`, `target_language`, `regional_variant`, `cefr_level`, `explanation_language`, `daily_goal_minutes`, `streak_days`, `total_lessons_completed`, `completed_curriculum_node_ids`, `is_active`, `updated_at` | `courseService.ts`, `syncEngine.ts` |
| `saved_translations` | SELECT, UPSERT, DELETE | `id`, `user_id`, `source_text`, `translated_text`, `source_lang`, `target_lang`, `provider_used`, `is_verified`, `created_at` | `auth.ts`, `syncEngine.ts` |
| `cultural_bookmarks` | SELECT, UPSERT, DELETE | `id`, `user_id`, `article_id`, `article_title`, `content_language`, `origin_country`, `topic`, `cefr_level`, `created_at` | `syncEngine.ts`, `cultureService.ts` |
| `exercise_attempts` | UPSERT | `id`, `user_id`, `exercise_id`, `submitted_answer`, `is_correct`, `feedback`, `attempt_count`, `created_at` | `syncEngine.ts` |
| `srs_items` | SELECT, UPSERT | `id`, `user_id`, `vocabulary_item_id`, `language`, `repetition_count`, `ease_factor`, `interval_days`, `next_review_date`, `last_reviewed_at`, `lapse_count`, `mastery_status`, `updated_at` | `syncEngine.ts`, `srs.ts` |

### 4.2 Python Learning Engine & CLI Tools (`engine/`, `scripts/`)
| Table Name | Operations | Columns Referenced | Used In Files |
| :--- | :--- | :--- | :--- |
| `user_learning_tracks` | SELECT, POST (Upsert) | `user_id`, `language`, `regional_variety`, `current_cefr_level`, `target_cefr_level`, `current_curriculum_node_id`, `streak_days`, `total_lessons_completed`, `completed_curriculum_node_ids`, `presented_vocabulary_ids`, `mastered_vocabulary_ids`, `recent_node_history`, `recent_exercise_history`, `updated_at` | `supabase_repository.py`, `backup_restore.py`, `retention_cleanup.py` |
| `srs_items` | GET, POST (Upsert) | `user_id`, `vocabulary_item_id`, `language`, `repetition_count`, `ease_factor`, `interval_days`, `next_review_date`, `last_reviewed_at`, `lapse_count`, `mastery_status` | `supabase_repository.py`, `backup_restore.py`, `retention_cleanup.py` |
| `daily_lessons` | GET, POST (Upsert) | `id`, `user_id`, `language`, `lesson_date`, `cefr_level`, `curriculum_node_id`, `study_mode`, `estimated_minutes`, `content_fingerprint`, `payload`, `content_payload` | `supabase_repository.py`, `retention_cleanup.py` |
| `exercise_attempts` | GET, POST (Upsert) | `id`, `user_id`, `exercise_id`, `submitted_answer`, `is_correct`, `feedback`, `attempt_count`, `created_at` | `supabase_repository.py`, `backup_restore.py`, `retention_cleanup.py` |
| `email_deliveries` | GET, POST | `user_id`, `delivery_date`, `delivery_purpose`, `idempotency_key`, `recipient_email`, `subject`, `status`, `provider`, `provider_message_id`, `last_error`, `sent_at`, `updated_at` | `supabase_repository.py`, `run_daily_batch.py` |
| `lesson_assignments` | GET, POST | `id`, `user_id`, `language`, `assignment_date`, `article_id`, `article_title`, `article_url`, `revision_id`, `cefr_level`, `topic_category`, `status` | `supabase_repository.py` |
| `user_profiles` | GET | `id`, `auth_user_id`, `email`, `full_name`, `timezone`, `preferred_delivery_hour_utc`, `email_daily_lesson_opt_in`, `account_status`, `is_active`, `last_active_at` | `supabase_repository.py`, `bootstrap_admin.py`, `retention_cleanup.py`, `verify_connections.py` |
| `user_roles` | POST (Upsert) | `user_id`, `role` | `bootstrap_admin.py` |

---

## 5. Dexie / IndexedDB Offline Stores
The client-side Dexie database (`PolyglotLocalDatabase` in `frontend/src/services/localDb.ts`) maps cleanly to the cloud tables:
1. `cachedLessons` <-> `public.daily_lessons`
2. `savedVocabulary` <-> `public.saved_translations`
3. `srsReviews` <-> `public.srs_items`
4. `culturalBookmarks` <-> `public.cultural_bookmarks`
5. `syncQueue` <-> Transient mutation queue dispatched to Supabase via `syncEngine.ts`
6. `activeLessonProgress`, `mistakeNotebook`, `apiCache` <-> Local client-side stores only

---

## 6. Storage Buckets Audit
An exhaustive search of the repository confirmed:
- No Supabase Storage buckets are declared in migrations.
- No Supabase Storage SDK calls (`supabase.storage.*`) exist in TypeScript or Python.
- Media assets (audio pronunciations and images) are dynamically synthesized via browser Web Speech API or fetched directly from open public sources (Wikimedia Commons, Openverse).
- Therefore, **no Supabase storage buckets require provisioning or reset.**
