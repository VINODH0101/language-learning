# Lexilume — Current-State Database Audit & Baseline Inventory

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 5 — Database Design, Data Mapping & Safe Migration Plan  
> **Audit Date:** November 2026  
> **Baseline Evidence:** 14 verified migration files in `supabase/migrations/` and canonical schema `supabase/canonical/001_canonical_baseline.sql`

---

## 1. Executive Summary & Verification Methodology

A rigorous inspection of all database artifacts in the repository was conducted to establish the true, unassailable database baseline prior to designing target migrations.

### Critical Baseline Findings:
1. **Actual Migration Count (14 Migrations):** Historical documentation occasionally cited 12 or 13 migrations. The repository contains exactly **14 sequential migration files** (`001_initial_schema.sql` through `014_admin_operations_and_audit.sql`) plus corresponding rollback scripts.
2. **Next Available Migration Number:** The next database migration **MUST BE `015`** (`015_...`). Any migration named `013` or `014` would collide with existing applied migrations.
3. **Table Footprint (26 Tables):** Exactly 26 relational tables are defined across migrations `001` to `014`.
4. **Verification Boundary:** Baseline verification is derived from repository SQL definitions, Python repository queries, and frontend PostgREST call sites. No direct live writes were performed against production.

---

## 2. Sequential Migration File Inventory (001 to 014)

| Migration Number & Filename | Creation Scope & Purpose | Tables Created / Altered | Functions & Triggers Introduced | Rollback Script Available? |
| :--- | :--- | :--- | :--- | :--- |
| `001_initial_schema.sql` | Foundational polyglot schema (C1 curriculum, profiles, daily lessons) | `licenses_and_sources`, `user_profiles`, `language_tracks`, `curriculum_nodes`, `vocabulary_items`, `grammar_rules`, `exercise_templates`, `curated_materials`, `daily_lessons`, `lesson_exercises`, `user_vocabulary_history`, `email_deliveries` | `handle_new_user()`, `update_updated_at_column()`, `get_daily_lesson()` | No (Baseline) |
| `002_rls_policies.sql` | Foundational Row-Level Security enablement | Enables RLS across all user-owned tables | RLS policies for `user_profiles`, `user_vocabulary_history` | No |
| `003_email_and_retention.sql` | Transactional email delivery and 90-day GDPR retention logs | `email_deliveries` (recreated), `retention_cleanup_logs` | `cleanup_old_records()` retention stored procedure | `rollback/003_rollback.sql` |
| `004_minimal_wikipedia_assignments.sql` | Classroom & reading assignments | `lesson_assignments` | Assignment foreign keys | `rollback/004_rollback.sql` |
| `005_language_directions_and_saved_translations.sql` | Learner translation bookmarks & language directions | `saved_translations` | RLS policies for `saved_translations` | `rollback/005_rollback.sql` |
| `006_auth_roles_audit_and_onboarding.sql` | Administrative RBAC and audit logging | `user_roles`, `admin_audit_logs` | `has_role(user_id, role)`, `is_admin()` | `rollback/006_..._rollback.sql` |
| `007_multiple_courses_and_progress_isolation.sql` | Multi-course management and isolated progress tracking | `user_courses` | Compound uniqueness on `(user_id, target_language, regional_variant, cefr_level)` | `rollback/007_..._rollback.sql` |
| `008_cultural_bookmarks_and_sync.sql` | Cultural article bookmarking and offline synchronization | `cultural_bookmarks` | Compound uniqueness on `(user_id, article_id)` | `rollback/008_..._rollback.sql` |
| `009_schema_reconciliation_and_sync.sql` | Reconciles C1 daily polyglot schemas | `user_learning_tracks`, `srs_items`, `exercise_attempts` | RLS policies for SM-2 and exercise telemetry | `rollback/009_..._rollback.sql` |
| `010_database_persistence_and_sync_repair.sql` | Sync repair, streak calculation, and index hardening | Indexes on `user_courses`, `srs_items` | `calculate_streak(user_id)` | `rollback/010_..._rollback.sql` |
| `011_daily_lessons_reconciliation.sql` | Enhances daily lesson payloads with bilingual alignment | Alters `daily_lessons` payload columns | Compatibility view `active_daily_lessons` | `rollback/011_..._rollback.sql` |
| `012_daily_content_studio.sql` | Editorial daily poetry and situational dialogues | `daily_published_content` | Safe active replacement semantics | `rollback/012_..._rollback.sql` |
| `013_progress_and_activity_tracking.sql` | Language-scoped exercise attempts and unified activity telemetry | Alters `exercise_attempts`, creates `learning_activity_events` | Check constraint `learning_language <> 'hi'` | In migration file |
| `014_admin_operations_and_audit.sql` | Content moderation review queue and admin background jobs | `content_review_items`, `admin_background_jobs` | Administrative moderation RLS policies | `rollback/014_..._rollback.sql` |

---

## 3. Authoritative Table-by-Table Inventory (26 Tables)

| # | Table Name | Origin Migration | Primary Key | Foreign Keys / Parent Relations | Unique Constraints & Key Indexes | RLS Status & Calling Layer | Data Classification | Target Transition Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `user_profiles` | `001` | `id` (UUID) | `auth_user_id` -> `auth.users(id)` | Unique `auth_user_id` | RLS Enabled; `auth.ts`, `authService` | User-owned | **Active and required** |
| 2 | `user_roles` | `006` | `id` (UUID) | `user_id` -> `auth.users(id)` | Unique `(user_id, role)` | RLS Enabled; `auth.ts`, `has_role()` | User-owned / RBAC | **Active and required** |
| 3 | `admin_audit_logs` | `006` | `id` (UUID) | `user_id` -> `auth.users(id)` | Index on `(created_at DESC)` | RLS Enabled (Admin only); `adminService.ts` | System-owned | **Active and required** |
| 4 | `user_courses` | `007` | `id` (UUID) | `user_id` -> `auth.users(id)` | Unique `(user_id, target_language, regional_variant, cefr_level)` | RLS Enabled; `courseService.ts`, `syncEngine.ts` | User-owned | **Active and required** |
| 5 | `user_learning_tracks` | `009` | `id` (UUID) | `user_id` -> `auth.users(id)` | Unique `(user_id, language)` | RLS Enabled; `supabase_repository.py` | User-owned | **Candidate for future consolidation** (into `user_courses`) |
| 6 | `language_tracks` | `001` | `id` (UUID) | None | Unique `code` | RLS Enabled (Public read); Seeded | Static / Catalog | **Legacy but still referenced** |
| 7 | `curriculum_nodes` | `001` | `id` (UUID) | `track_id` -> `language_tracks(id)` | Unique `(track_id, node_key)` | RLS Enabled (Public read); Seeded | Static / Syllabus | **Legacy but still referenced** |
| 8 | `vocabulary_items` | `001` | `id` (UUID) | `curriculum_node_id` -> `curriculum_nodes(id)` | Index on `curriculum_node_id` | RLS Enabled (Public read); Seeded | Static / Lemmas | **Legacy but still referenced** |
| 9 | `grammar_rules` | `001` | `id` (UUID) | `curriculum_node_id` -> `curriculum_nodes(id)` | Unique `rule_key` | RLS Enabled (Public read); Seeded | Static / Grammar | **Legacy but still referenced** |
| 10 | `exercise_templates` | `001` | `id` (UUID) | `curriculum_node_id` -> `curriculum_nodes(id)` | Index on `curriculum_node_id` | RLS Enabled (Public read); Seeded | Static / Synthesis | **Legacy but still referenced** |
| 11 | `curated_materials` | `001` | `id` (UUID) | `track_id` -> `language_tracks(id)` | Unique `content_key` | RLS Enabled (Public read); Seeded | Static / Reading | **Legacy but still referenced** |
| 12 | `licenses_and_sources` | `001` | `id` (UUID) | None | Unique `source_key` | RLS Enabled (Public read); Seeded | Compliance / Open | **Active and required** |
| 13 | `daily_lessons` | `001` | `id` (UUID) | `track_id` -> `language_tracks(id)` | Unique `(track_id, lesson_date)` | RLS Enabled; `supabase_repository.py` | Shared content | **Candidate for future consolidation** (into `daily_published_content`) |
| 14 | `lesson_exercises` | `001` | `id` (UUID) | `daily_lesson_id` -> `daily_lessons(id)` | Unique `(daily_lesson_id, exercise_id)` | RLS Enabled; Python engine | Shared content | **Legacy and apparently unused** |
| 15 | `user_vocabulary_history`| `001` | `id` (UUID) | `user_id` -> `auth.users(id)` | Index on `(user_id, term)` | RLS Enabled; Historical | User-owned | **Legacy and apparently unused** (Superseded by `srs_items`) |
| 16 | `saved_translations` | `005` | `id` (UUID) | `user_id` -> `auth.users(id)` | Unique `(user_id, source_text, target_lang)` | RLS Enabled; `syncEngine.ts`, `auth.ts` | User-owned | **Active but needs adaptation** (to `user_saved_words`) |
| 17 | `lesson_assignments` | `004` | `id` (UUID) | `user_id` -> `auth.users(id)` | Unique `(user_id, lesson_id)` | RLS Enabled; Classroom feature | User-owned | **Legacy but still referenced** |
| 18 | `email_deliveries` | `003` | `id` (UUID) | `user_id` -> `auth.users(id)` | Index on `(recipient_email, status)` | RLS Enabled (Admin/Server); `email_service.py` | Operational log | **Active and required** |
| 19 | `retention_cleanup_logs`| `003` | `id` (UUID) | None | Index on `(cleaned_at DESC)` | RLS Enabled (Server only); `retention_cleanup.py`| Maintenance log | **Active and required** |
| 20 | `cultural_bookmarks` | `008` | `id` (UUID) | `user_id` -> `auth.users(id)` | Unique `(user_id, article_id)` | RLS Enabled; `syncEngine.ts` | User-owned | **Active and required** |
| 21 | `srs_items` | `009` | `id` (UUID) | `user_id` -> `auth.users(id)` | Unique `(user_id, vocabulary_item_id)` | RLS Enabled; `syncEngine.ts`, `srs.ts` | User-owned / SM-2 | **Active but needs adaptation** (to `user_saved_words`) |
| 22 | `exercise_attempts` | `009` | `id` (UUID) | `user_id` -> `auth.users(id)` | Index on `(user_id, language)` | RLS Enabled; `syncEngine.ts` | User-owned | **Active but needs adaptation** (to `user_mistakes` & activity attempts) |
| 23 | `daily_published_content`| `012` | `id` (VARCHAR) | `created_by` -> `auth.users(id)` | Index on `(published_at DESC, is_active)` | RLS Enabled; `dailyContentService.ts` | Shared content | **Active and required** |
| 24 | `learning_activity_events`| `013` | `id` (VARCHAR) | `user_id` -> `auth.users(id)` | Index on `(user_id, learning_language)` | RLS Enabled; `syncEngine.ts` | User-owned | **Active and required** |
| 25 | `content_review_items` | `014` | `id` (VARCHAR) | `reviewed_by` -> `auth.users(id)` | Index on `(status, language)` | RLS Enabled; `adminService.ts` | Moderation queue | **Active and required** |
| 26 | `admin_background_jobs`| `014` | `id` (VARCHAR) | None | Index on `(status, created_at DESC)` | RLS Enabled; `adminService.ts` | Job runner | **Active and required** |

---

## 4. Stored Functions, Procedures & Triggers

| Function Name | Definition File | Security Mode | Calling Mechanism | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| `handle_new_user()` | `001_initial_schema.sql:128` | `SECURITY DEFINER` | Trigger `on_auth_user_created` on `auth.users` | Automatically creates row in `public.user_profiles` upon GoTrue sign-up. |
| `update_updated_at_column()` | `001_initial_schema.sql:14` | `SECURITY DEFINER` | Triggers on tables with `updated_at` | Sets `updated_at = timezone('utc'::text, now())` prior to update. |
| `has_role(user_id, role)` | `006_auth_roles_audit_...sql:45` | `SECURITY DEFINER` | RLS policies & `auth.ts` RPC | Evaluates boolean whether user has role in `public.user_roles`. |
| `is_admin()` | `006_auth_roles_audit_...sql:65` | `SECURITY DEFINER` | RLS policies | Shorthand for `has_role(auth.uid(), 'admin')`. |
| `cleanup_old_records()` | `003_email_and_retention.sql:35` | `SECURITY DEFINER` | Cron / `retention_cleanup.py` | Purges exercise attempts and audit logs older than 90 days. |
| `calculate_streak(user_id)` | `010_database_persistence_...sql:190` | `SECURITY DEFINER` | RPC / daily cron | Evaluates consecutive active study calendar days from telemetry. |
| `get_daily_lesson(track_id, date)`| `001_initial_schema.sql:280` | `SECURITY INVOKER` | PostgREST RPC | Retrieves daily lesson payload for track and date. |

---

## 5. Verification Limitations

- **Repository Source Certainty:** The 14 migration files and 26 tables are verified with 100% certainty from the repository code.
- **Production Applied State:** Because direct write access to the live production database is prohibited by safety rules, this audit assumes migrations `001` through `014` represent the live production schema. Phase 5 designs migration `015` to execute non-destructively with `IF NOT EXISTS` guards.
