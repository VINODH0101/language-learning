# 02 — Existing Database Inventory

> **Phase 0 deliverable.** Derived from `supabase/migrations/*.sql` only.
> **Live Supabase was NOT connected.** All schema below reflects declared DDL, not a live introspection. Live values marked ⚠️ are assumptions.

---

## 1. Migration → table map

| Migration | Tables created |
| :--- | :--- |
| 001_initial_schema | `licenses_and_sources`, `user_profiles`, `language_tracks`, `curriculum_nodes`, `vocabulary_items`, `grammar_rules`, `exercise_templates`, `curated_materials`, `daily_lessons`, `lesson_exercises`, `user_vocabulary_history`, `email_deliveries` |
| 003_email_and_retention | `email_deliveries` (recreated/extended), `retention_cleanup_logs` |
| 004_minimal_wikipedia_assignments | `lesson_assignments` |
| 005_language_directions_and_saved_translations | `saved_translations` |
| 006_auth_roles_audit_and_onboarding | `user_roles`, `admin_audit_logs` |
| 007_multiple_courses_and_progress_isolation | `user_courses` |
| 008_cultural_bookmarks_and_sync | `cultural_bookmarks` |
| 009_schema_reconciliation_and_sync | `user_learning_tracks`, `srs_items`, `exercise_attempts` |
| 010_database_persistence_and_sync_repair | (no new tables — repair/reconcile) |
| 011_daily_lessons_reconciliation | (no new tables — reconcile) |
| 012_daily_content_studio | `daily_published_content` |
| 013_progress_and_activity_tracking | `learning_activity_events` |
| 014_admin_operations_and_audit | `content_review_items`, `admin_background_jobs` |
| 015_content_centred_architecture | `content_sources`, `content_items`, `content_versions`, `learning_activities`, `learner_content_progress`, `user_saved_words`, `user_word_review_events`, `user_mistakes`, `content_processing_jobs`, `migration_exception_logs` |

> 010 and 011 are reconciliation migrations; they may `ALTER` existing tables. Their precise effects were not fully re-read in this pass. ⚠️

---

## 2. Content-centred core (migration 015) — full declaration

### 2.1 `content_sources`
- `id UUID PK DEFAULT gen_random_uuid()`
- `source_name VARCHAR(150) NOT NULL`
- `source_type` CHECK in (`public_domain`,`open_license`,`editorial`,`user_submitted`,`partner`)
- `author VARCHAR(150)`, `original_url TEXT`
- `license_type VARCHAR(50) DEFAULT 'CC-BY-SA-4.0'`, `license_text TEXT`
- `attribution_notice TEXT NOT NULL`
- `created_at` / `updated_at TIMESTAMPTZ DEFAULT now()`
- Index: `idx_content_sources_license`

### 2.2 `content_items`
- `id UUID PK DEFAULT gen_random_uuid()`
- `title VARCHAR(255) NOT NULL`, `slug VARCHAR(255) NOT NULL` (`UNIQUE uq_content_items_slug`)
- `target_language VARCHAR(10) CHECK IN ('en','pt','es')`
- `explanation_language VARCHAR(10) CHECK IN ('en','pt','es')`
- `source_language VARCHAR(10)`, `summary TEXT`
- `genre VARCHAR(50)` CHECK in 13 genres (`conversation`,`dialogue`,`short_story`,`literature`,`news_article`,`workplace_email`,`business_report`,`academic_essay`,`culture_and_travel`,`grammar_in_action`,`instructions_and_guides`,`interview_and_discussion`,`reviews_and_opinions`)
- `primary_cefr VARCHAR(5) CHECK IN ('A1','A2','B1','B2','C1','C2')` ⚠️ (see note below)
- `estimated_read_minutes INT CHECK (>0)`
- `status` CHECK in (`draft`,`processing`,`review_required`,`approved`,`published`,`archived`)
- `current_version_id UUID` → FK `content_versions(id) ON DELETE SET NULL`
- `source_id UUID` → FK `content_sources(id) ON DELETE SET NULL`
- `rights_status` CHECK in (`original`,`public_domain`,`licensed`,`permitted`,`restricted`,`unknown`)
- `rights_notes TEXT`, `source_url TEXT`, `author VARCHAR(150)`
- `created_by UUID` → FK `auth.users(id)`
- Indexes: `idx_content_items_catalog (target_language,status,primary_cefr,genre)`, `idx_content_items_created_at`, `idx_content_items_source_id`

### 2.3 `content_versions`
- `id UUID PK DEFAULT gen_random_uuid()`
- `content_item_id UUID NOT NULL` → FK `content_items(id) ON DELETE CASCADE`
- `version_number INT NOT NULL CHECK (>0)`; `UNIQUE (content_item_id, version_number)`
- `cefr_level VARCHAR(5)` CHECK A1–C2 ⚠️
- `structured_payload JSONB`, `audio_metadata JSONB`
- `word_count`, `sentence_count`, `lexical_density REAL (0..1)`
- `is_published BOOLEAN`, `change_summary VARCHAR(255)`, `created_by UUID`
- `published_at`, `created_at TIMESTAMPTZ`
- Indexes: `idx_content_versions_item`, `idx_content_versions_published`, GIN `structured_payload`

### 2.4 `learning_activities`
- `id UUID PK DEFAULT gen_random_uuid()`
- `content_version_id UUID NOT NULL` → FK `content_versions(id) ON DELETE CASCADE`
- `activity_type` CHECK in 9 types
- `activity_title VARCHAR(150)`, `activity_order INT CHECK (>0)`, `UNIQUE (content_version_id, activity_order)`
- `estimated_minutes`, `configuration JSONB`, `created_at`
- Index: `idx_learning_activities_version`, `idx_learning_activities_type`

### 2.5 `learner_content_progress`
- `id UUID PK DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL` → FK `auth.users(id) ON DELETE CASCADE`
- `content_item_id UUID NOT NULL` → FK `content_items(id) ON DELETE CASCADE`
- `content_version_id UUID NOT NULL` → FK `content_versions(id) ON DELETE CASCADE`
- `status` CHECK in (`not_started`,`in_progress`,`completed`,`revisiting`)
- `percent_complete INT (0..100)`, `completed_activity_ids JSONB`
- `time_spent_seconds INT`, `comprehension_score REAL (0..1)`
- `client_mutation_id VARCHAR(64)`, timestamps
- `UNIQUE (user_id, content_item_id)`
- Indexes: `idx_learner_progress_user`, `idx_learner_progress_item`, `idx_learner_progress_mutation`

### 2.6 `user_saved_words`
- `id UUID PK DEFAULT gen_random_uuid()`
- `user_id`, `target_language`, `explanation_language`, `term VARCHAR(120)`, `lemma VARCHAR(120)`, `pos VARCHAR(30)`, `cefr_level`, `definition TEXT`
- `context_sentence`, `context_translation`, `source_content_id`/`source_version_id` FKs, `audio_url`, `ipa`
- `client_mutation_id`
- SM-2: `ease_factor`, `interval_days`, `repetitions`, `lapses`, `last_reviewed_at`, `next_review DATE`, `state` (`learning`,`reviewing`,`mastered`,`ignored`)
- `legacy_srs_item_id VARCHAR(100)`
- `UNIQUE (user_id, target_language, lemma, pos, explanation_language)`
- Indexes: review queue, user_term, source, mutation

### 2.7 `user_word_review_events`
- `id UUID PK`, `user_id`, `saved_word_id` FK, `rating INT (0..5)`, prev/new interval & ease, `client_mutation_id`, `reviewed_at`
- Index: `idx_word_reviews_user_word`

### 2.8 `user_mistakes`
- `id UUID PK`, `user_id`, `content_item_id`/`content_version_id`/`activity_id` FKs
- `activity_type`, `error_category` CHECK (9), `stimulus`/`user_response`/`correct_response`/`pedagogical_explanation` TEXT
- `status` CHECK (`unresolved`,`review_pending`,`mastered`,`dismissed`), `occurrences_count`, `client_mutation_id`, timestamps
- Indexes: queue, content, mutation

### 2.9 `content_processing_jobs`
- `id UUID PK DEFAULT gen_random_uuid()`
- `content_item_id UUID NOT NULL` → FK `content_items(id) ON DELETE CASCADE`
- `version_number INT`, `status` CHECK (`queued`,`running`,`completed`,`failed`,`cancelled`)
- `current_stage`, `stages_completed JSONB`, `stage_outputs JSONB`, `stage_timings JSONB`
- `error_message`, `retry_count INT`, `triggered_by UUID`, timestamps
- Indexes: `idx_content_jobs_worker`, `idx_content_jobs_item`

### 2.10 `migration_exception_logs`
- Present in 015; columns not re-read in this pass. ⚠️

---

## 3. Learner/operations tables (migrations 001–014)

Documented by name only in this pass; full column details live in the respective migration files.

- `licenses_and_sources`, `language_tracks`, `curriculum_nodes`, `vocabulary_items`, `grammar_rules`, `exercise_templates`, `curated_materials`, `daily_lessons`, `lesson_exercises`, `user_vocabulary_history`, `email_deliveries`, `retention_cleanup_logs`, `lesson_assignments`, `saved_translations`, `user_roles`, `admin_audit_logs`, `user_courses`, `cultural_bookmarks`, `user_learning_tracks`, `srs_items`, `exercise_attempts`, `daily_published_content`, `learning_activity_events`, `content_review_items`, `admin_background_jobs`.

Key facts verified for these:
- `daily_published_content` (012) is the daily poetry/dialogue catalogue used by `dailyContentService` — overlapping `content_items` genre `conversation`/`dialogue`.
- `content_review_items` + `admin_background_jobs` (014) are the admin review/background primitives.
- `srs_items` / `exercise_attempts` (009) are the legacy SRS/attempt mirrors.

---

## 4. RLS & auth

- RLS policies are declared in `002_rls_policies.sql` and reinforced in 006/007/010/015. They were enumerated, not exhaustively re-read in this pass. ⚠️
- `user_roles` gates `admin` (role-based authorization). Frontend `AdminPage` checks `authService.getState().role === 'admin'`.
- Tenant isolation is applied at the application layer (scoped `localStorage`/Dexie keys by `user_id`) and enforced server-side via RLS `user_id = auth.uid()` patterns (declared).

---

## 5. Assumptions / unverified (⚠️)

1. No live Supabase connection → column types/defaults/RLS confirmed from DDL only.
2. Reconciliation migrations 010/011 may `ALTER` earlier tables; effects not re-diffed.
3. `migration_exception_logs` columns not re-read.
4. Legacy (001–014) table column lists not individually re-read (only enumerated).
5. Seed records (`ci_*`, `cv_*`) may exist locally (Dexie/localStorage) and/or remotely; inventory does not assert where they currently live.

---

## 6. Identified integrity concerns (for Phase 2)

- String IDs (`ci_*`, `cv_*`, `job_*`) vs UUID columns (§2.2/2.3/2.9).
- Upsert conflict targets and returned-`error` handling (see audit §8.2).
- `content_items` vs `daily_published_content` duplication.
- `content_processing_jobs.content_item_id NOT NULL` blocks pre-content generation jobs.
