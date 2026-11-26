# Lexilume — Phase 5 Database Design Risk Register

> **Target Standard:** Phase 6 Technical Oversight & Application Reliability  
> **Repository:** `VINODH0101/language-learning`  
> **Production Application:** `https://lexi.monster`  
> **Status:** Architectural Issue Register — **PROPOSED FOR FUTURE RESOLUTION, NO SQL EXECUTED**

---

## 1. Executive Summary

Phase 5 delivered comprehensive proposals for a content-centred database architecture (`docs/architecture/TARGET_DATABASE_SCHEMA.md`, `PROPOSED_SQL_MIGRATIONS.md`). However, an exhaustive code and schema review during Phase 6 has surfaced **six critical technical risks** in the proposed Phase 5 designs.

In strict adherence to Rule 4, Rule 5, and Rule 6, **zero SQL migrations have been executed in Phase 6**. This document establishes a formal risk register cataloging each issue, repository evidence, potential data-loss or corruption impacts, required corrections, and implementation blocking status prior to any future Phase 7 execution.

---

## 2. Granular Risk Issue Register

### Risk 1: Cross-Language Lemma Collision in Proposed Vocabulary Unique Key

- **Problem:**
  In `docs/architecture/TARGET_DATABASE_SCHEMA.md` (Table 3: `user_saved_words`), the proposed unique constraint is:
  ```sql
  CONSTRAINT uq_user_saved_words UNIQUE (user_id, lemma, explanation_language)
  ```
  This constraint **omits `target_language`**. In a multilingual platform supporting English, Portuguese, and Spanish, identical lemmas exist across different learning languages (e.g., *'radio'* exists in English, Spanish, and Portuguese; *'bank'* exists in English and German; *'no'* exists in English and Spanish). Under the proposed Phase 5 schema, a learner studying both English and Spanish with explanation language English would suffer a unique key collision or overwrite when saving the word in their second course.
- **Repository Evidence:**
  - `frontend/src/types/index.ts:32-45`: `VocabularyItem` explicitly scopes vocabulary by `language: Language`.
  - `engine/models/content.py:42`: `AttributedVocabularyItem` defines `language: LearningLanguage`.
  - `frontend/src/services/localDb.ts:70`: Dexie `savedVocabulary` indexes by `[user_id, source_text, target_lang]`.
  - `frontend/src/lib/languages/languageMatrix.ts`: Invariant 3 mandates strict decoupling of `learning_language` and `explanation_language`.
- **Potential Impact:**
  Learner saves a Spanish vocabulary term, which violently collides with or overwrites their existing English vocabulary term, destroying SM-2 intervals and definitions.
- **Required Correction:**
  The unique key in `user_saved_words` must be expanded to:
  ```sql
  CONSTRAINT uq_user_saved_words UNIQUE (user_id, target_language, lemma, part_of_speech, explanation_language)
  ```
  Furthermore, words with identical lemmas but distinct parts of speech (e.g., *'run'* noun vs *'run'* verb) or distinct regional nuances must be uniquely identifiable.
- **Implementation Blocked:** **YES.** Schema migration `015` must be revised before any SQL execution.
- **Recommended Future Phase:** Phase 7 (Content Pipeline & Migration Specification).

---

### Risk 2: Loss of SM-2 Granular Scheduling Parameters During Consolidation

- **Problem:**
  Phase 5 proposed merging `saved_translations` (migration `005`) and `srs_items` (migration `010`) into `user_saved_words`. However, the proposed mapping in `LEGACY_TO_TARGET_DATA_MAPPING.md` simplifies the review metrics, potentially omitting historical review logs and card-level associations.
- **Repository Evidence:**
  - `supabase/migrations/010_curriculum_and_progress_tracking.sql:35-58`: Canonical `srs_items` table contains:
    `ease_factor NUMERIC(4,2) DEFAULT 2.50`,
    `interval_days INTEGER DEFAULT 1`,
    `repetitions INTEGER DEFAULT 0`,
    `lapses INTEGER DEFAULT 0`,
    `last_reviewed_at TIMESTAMPTZ`,
    `next_review_at TIMESTAMPTZ`,
    `vocabulary_item_id VARCHAR(100)`,
    `context_sentence TEXT`.
  - `frontend/src/services/srs.ts:25-35`: SM-2 algorithm depends on exact precision for `ease_factor` (minimum `1.30`) and `repetition_count`.
- **Potential Impact:**
  Truncating `lapses` or collapsing `vocabulary_item_id` associations into simple lemma strings would reset learner flashcard intervals, forcing advanced learners to unnecessarily repeat mastered words from day 1.
- **Required Correction:**
  The target `user_saved_words` table must explicitly retain all 8 scheduling columns:
  `ease_factor`, `interval_days`, `repetitions`, `lapses`, `last_reviewed_at`, `next_review_at`, `legacy_srs_item_id`, and `context_sentence`. Backfill queries must map directly from `srs_items` without calculating synthetic initial states.
- **Implementation Blocked:** **YES.** Requires field-by-field verification in target DDL.
- **Recommended Future Phase:** Phase 7.

---

### Risk 3: Fragile Progress Mapping via Natural Language Labels

- **Problem:**
  Phase 5 proposals suggest mapping historical `exercise_attempts` (migration `010`) and `lesson_assignments` to new `content_versions` using lesson titles or activity type strings. Natural language titles (`"Past Perfect Continuous"`, `"Café & Morning Routine"`) vary across locale translations, regional variants, and course generations.
- **Repository Evidence:**
  - `frontend/src/data/seedData.ts`: Lesson titles are localized dynamically by interface language (`title_pt`, `title_es`, `title_en`).
  - `frontend/src/services/courseService.ts:180`: Progress tracking stores `curriculum_node_id` (e.g. `en-c1-cond-01`), NOT human-readable titles.
  - `supabase/migrations/010_curriculum_and_progress_tracking.sql:72`: `exercise_attempts` references `exercise_id`, `node_id`, and `user_id`.
- **Potential Impact:**
  Historical attempts mapped by title will either mismatch or fail foreign-key constraints, resulting in orphaned progress records or false zero-progress indicators on student profiles.
- **Required Correction:**
  Historical completions must be mapped strictly by **stable surrogate keys**: `curriculum_node_id` and `exercise_id`. If a legacy record cannot be mapped to a verified target `content_version_id` via a deterministic surrogate key, it must be designated as `unmapped_legacy_progress` in a dedicated audit table rather than guessed.
- **Implementation Blocked:** **YES.** Content mapping taxonomy must be locked.
- **Recommended Future Phase:** Phase 7.

---

### Risk 4: False Transaction Boundaries & Rollback Risks in Proposed Backfill SQL

- **Problem:**
  `docs/architecture/PROPOSED_SQL_MIGRATIONS.md` illustrates batch backfilling using a PL/pgSQL `DO $$ ... $$` loop with a batch limit of 500 rows. In PostgreSQL, a `DO` block executes within a **single transaction**. If an error occurs on row 499 of batch 10, the entire block aborts and rolls back all preceding batches, defeating the purpose of chunked execution. Furthermore, long-running transactions hold table-level locks that can block production API requests on `https://lexi.monster`.
- **Repository Evidence:**
  - `supabase/migrations/010_curriculum_and_progress_tracking.sql`: Tables have concurrent reads from active users.
  - PostgreSQL architecture: Subtransactions and loops in `DO $$` do not issue true independent `COMMIT` statements unless executed as a `PROCEDURE` in PostgreSQL 11+ with explicit `COMMIT` calls outside an active transaction block.
- **Potential Impact:**
  Production lock timeouts, connection pool exhaustion, or migration failures that leave the database in an unknown state with partial lock contention.
- **Required Correction:**
  1. Transform backfill logic into an explicit stored `PROCEDURE backfill_legacy_data_chunked(p_batch_size INT)`.
  2. Implement a persistent checkpoint tracking table (`migration_backfill_checkpoints` recording `last_processed_legacy_id`, `batch_number`, `status`).
  3. Execute independent transaction commits via external CLI batch runner (`scripts/run_migration_backfill.py`) that commits after each 500-row batch and verifies row-level MD5 checksums.
- **Implementation Blocked:** **YES.** Cannot be run as a raw Supabase SQL editor script.
- **Recommended Future Phase:** Phase 7 / Migration Execution Phase.

---

### Risk 5: Interrupted Guest-to-Account Migration & Race Conditions

- **Problem:**
  In Phase 5, the transition of guest data to authenticated cloud storage relies on client-side migration scripts. If a user registers, starts the migration, and closes the browser tab or loses network connectivity mid-stream, guest records may be partially uploaded, creating duplicate records or lost sync mutations upon the next login.
- **Repository Evidence:**
  - `frontend/src/services/storage.ts:72-93`: `migrateGuestData` copies keys without deleting the guest key.
  - `frontend/src/services/localDb.ts:82`: Dexie `syncQueue` indexes by `[id, user_id, action, status, created_at]`.
  - `frontend/src/services/syncEngine.ts:110-140`: Pushes mutations with status updates (`pending` -> `synced` -> delete).
- **Potential Impact:**
  A learner completes 5 lessons offline as a guest. Upon sign-up on a spotty cellular connection, 2 lessons sync, but the tab is closed. When they reopen, if the sync queue is re-indexed without an idempotent transaction, either duplicates are pushed or the remaining 3 lessons are dropped.
- **Required Correction:**
  1. Implement client-side atomic migration transactions in Dexie (`localDb.transaction('rw', [localDb.syncQueue, localDb.savedVocabulary], ...)`).
  2. Enforce idempotent upsert keys on all Supabase endpoints using `(user_id, client_mutation_id)`.
  3. Provide an explicit retry handler on the next session start that detects half-migrated guest states before allowing fresh guest sessions.
- **Implementation Blocked:** **NO.** Frontend sync engine is already largely idempotent, but cloud RLS and table constraints must formally require `client_mutation_id`.
- **Recommended Future Phase:** Phase 7.

---

### Risk 6: RLS Bypass & Semantic Discrepancies in Proposed Compatibility Views

- **Problem:**
  Phase 5 proposed backward-compatibility views (e.g., `CREATE VIEW legacy_daily_lessons AS SELECT ... FROM english_content_items`) to allow older clients to continue reading data without breaking. However:
  1. PostgreSQL views by default execute with the permissions of the view owner unless `security_invoker = true` (PostgreSQL 15+) is explicitly set. Without `security_invoker`, Row-Level Security (RLS) on underlying tables may be bypassed!
  2. Complex joined views are read-only by default and cannot handle `INSERT` or `UPDATE` statements without `INSTEAD OF` triggers.
- **Repository Evidence:**
  - `supabase/migrations/001_initial_schema.sql` through `014_admin_operations_and_audit.sql`: All tables use strict `ENABLE ROW LEVEL SECURITY`.
  - `frontend/src/services/courseService.ts` and `engine/storage/supabase_repository.py`: Both perform direct queries against `daily_lessons`.
- **Potential Impact:**
  If a compatibility view is queried without `security_invoker = true`, a guest learner could query lessons belonging to other tenants. Conversely, if an older client attempts to write through the view, the database will throw an unhandled `cannot insert into view` SQL exception.
- **Required Correction:**
  1. All compatibility views must be declared with `WITH (security_invoker = true)`.
  2. Create explicit `INSTEAD OF INSERT OR UPDATE OR DELETE` triggers for any compatibility view that has legacy write consumers.
  3. Formally deprecate write paths on legacy tables in favor of direct service calls before introducing views.
- **Implementation Blocked:** **YES.** Compatibility views cannot be deployed until Phase 7 cutover specification.
- **Recommended Future Phase:** Phase 7.

---

## 3. Summary of Blocking Decisions

| Risk ID | Title | Status | Action in Phase 6 |
| :--- | :--- | :--- | :--- |
| **RISK-01** | Cross-Language Lemma Collision | **BLOCKING** | Documented in Register. Zero DDL executed. Fix scheduled for Phase 7 schema revision. |
| **RISK-02** | SM-2 Parameter Loss in Consolidation | **BLOCKING** | Documented in Register. Target schema mapping updated in specification. |
| **RISK-03** | Progress Mapping by Title Labels | **BLOCKING** | Disallowed title mapping; mandated surrogate key (`curriculum_node_id`) mapping. |
| **RISK-04** | False Transaction Boundaries in Backfill | **BLOCKING** | Mandated stored procedure with persistent checkpoint table; disallowed monolithic `DO $$` script. |
| **RISK-05** | Interrupted Guest Migration Race | **WARNING** | Current client-side migration preserved non-destructively; cloud constraints queued for Phase 7. |
| **RISK-06** | View RLS Bypass & Write Semantics | **BLOCKING** | Mandated `security_invoker = true` and `INSTEAD OF` triggers for all compatibility views. |
