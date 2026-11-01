# Lexilume — Canonical Database Rebuild Plan

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Website:** `https://lexi.monster`  
> **Target Schema:** Canonical 2.0  
> **Date:** October 31, 2026  

---

## 1. Blueprint Overview

The canonical database schema unifies the disparate elements of Lexilume into a single, cohesive, reproducible relational schema. It resolves historical foreign-key ambiguity by establishing `auth.users(id)` as the universal root of identity, secures all user data with Row-Level Security, provides real-time cross-platform progress synchronization, and preserves offline learning capabilities.

---

## 2. Canonical Data Dictionary

### 2.1 User Identity & Preferences (`user_profiles`)
- **Table Name:** `public.user_profiles`
- **Primary Key:** `id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- **Columns:**
  - `id`: `UUID PRIMARY KEY` (matches `auth.users.id`)
  - `auth_user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE`
  - `email`: `VARCHAR(255) NOT NULL UNIQUE`
  - `full_name`: `VARCHAR(100) NOT NULL`
  - `native_language`: `VARCHAR(10) NOT NULL DEFAULT 'pt'`
  - `primary_target_language`: `VARCHAR(10) NOT NULL DEFAULT 'es'`
  - `interface_language`: `VARCHAR(10) NOT NULL DEFAULT 'en'`
  - `explanation_language`: `VARCHAR(10) NOT NULL DEFAULT 'en'`
  - `pt_variety`: `VARCHAR(20) NOT NULL DEFAULT 'pt-BR'`
  - `es_variety`: `VARCHAR(20) NOT NULL DEFAULT 'es-ES'`
  - `study_mode`: `VARCHAR(20) NOT NULL DEFAULT 'full'`
  - `daily_goal_minutes`: `SMALLINT NOT NULL DEFAULT 10`
  - `theme`: `VARCHAR(20) NOT NULL DEFAULT 'dark'`
  - `onboarding_completed`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `diagnostic_completed`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `account_status`: `VARCHAR(20) NOT NULL DEFAULT 'active'`
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
  - `timezone`: `VARCHAR(64) NOT NULL DEFAULT 'UTC'`
  - `preferred_delivery_hour_utc`: `SMALLINT NOT NULL DEFAULT 4`
  - `email_daily_lesson_opt_in`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `email_notifications_enabled`: `BOOLEAN NOT NULL DEFAULT TRUE`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `last_active_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Indexes:** `idx_user_profiles_email`, `idx_user_profiles_active`
- **RLS Policy:** `auth.uid() = auth_user_id OR public.is_admin()`

### 2.2 Access Control & Roles (`user_roles`)
- **Table Name:** `public.user_roles`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE`
  - `role`: `VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))`
  - `assigned_by`: `UUID REFERENCES auth.users(id)`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Indexes:** `idx_user_roles_user`, `idx_user_roles_role`
- **RLS Policy:** Users can view their own role; only verified admins (`public.is_admin()`) can assign or modify roles.

### 2.3 Administrative Audit Logs (`admin_audit_logs`)
- **Table Name:** `public.admin_audit_logs`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `admin_id`: `UUID NOT NULL REFERENCES auth.users(id)`
  - `action`: `VARCHAR(80) NOT NULL`
  - `target_user_id`: `UUID`
  - `details`: `JSONB NOT NULL DEFAULT '{}'::JSONB`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **RLS Policy:** Accessible only by verified admins (`public.is_admin()`).

### 2.4 Multi-Course Learning (`user_courses`)
- **Table Name:** `public.user_courses`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `target_language`: `VARCHAR(10) NOT NULL`
  - `regional_variant`: `VARCHAR(20) NOT NULL`
  - `cefr_level`: `VARCHAR(5) NOT NULL DEFAULT 'B1'`
  - `explanation_language`: `VARCHAR(10) NOT NULL DEFAULT 'en'`
  - `daily_goal_minutes`: `SMALLINT NOT NULL DEFAULT 10`
  - `streak_days`: `INTEGER NOT NULL DEFAULT 0`
  - `total_lessons_completed`: `INTEGER NOT NULL DEFAULT 0`
  - `completed_curriculum_node_ids`: `TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Constraints:** `UNIQUE (user_id, target_language, regional_variant, cefr_level)`
- **RLS Policy:** `auth.uid() = user_id OR public.is_admin()`

### 2.5 Engine Learning Tracks (`user_learning_tracks`)
- **Table Name:** `public.user_learning_tracks`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `language`: `VARCHAR(10) NOT NULL`
  - `regional_variety`: `VARCHAR(20) NOT NULL DEFAULT 'all'`
  - `current_cefr_level`: `VARCHAR(5) NOT NULL DEFAULT 'A1'`
  - `target_cefr_level`: `VARCHAR(5) NOT NULL DEFAULT 'C1'`
  - `current_curriculum_node_id`: `VARCHAR(100)`
  - `streak_days`: `INTEGER NOT NULL DEFAULT 1`
  - `total_lessons_completed`: `INTEGER NOT NULL DEFAULT 0`
  - `completed_curriculum_node_ids`: `TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`
  - `presented_vocabulary_ids`: `TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`
  - `mastered_vocabulary_ids`: `TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`
  - `recent_node_history`: `TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`
  - `recent_exercise_history`: `JSONB NOT NULL DEFAULT '[]'::JSONB`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Constraints:** `UNIQUE (user_id, language)`
- **Trigger:** Synchronized automatically from `user_courses` via `trg_sync_user_course_to_learning_track`.
- **RLS Policy:** `auth.uid() = user_id OR public.is_admin()`

### 2.6 Spaced Repetition (`srs_items`)
- **Table Name:** `public.srs_items`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `vocabulary_item_id`: `VARCHAR(120) NOT NULL`
  - `language`: `VARCHAR(10) NOT NULL`
  - `repetition_count`: `INTEGER NOT NULL DEFAULT 0`
  - `ease_factor`: `NUMERIC(4, 2) NOT NULL DEFAULT 2.50`
  - `interval_days`: `INTEGER NOT NULL DEFAULT 1`
  - `next_review_date`: `DATE NOT NULL DEFAULT CURRENT_DATE`
  - `last_reviewed_at`: `TIMESTAMPTZ`
  - `lapse_count`: `INTEGER NOT NULL DEFAULT 0`
  - `mastery_status`: `VARCHAR(20) NOT NULL DEFAULT 'presented'`
  - `history`: `JSONB NOT NULL DEFAULT '[]'::JSONB`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Constraints:** `UNIQUE (user_id, vocabulary_item_id)`
- **RLS Policy:** `auth.uid() = user_id`

### 2.7 Saved Phrasebook Vocabulary (`saved_translations`)
- **Table Name:** `public.saved_translations`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `source_text`: `VARCHAR(1000) NOT NULL`
  - `translated_text`: `VARCHAR(1000) NOT NULL`
  - `source_lang`: `VARCHAR(10) NOT NULL`
  - `target_lang`: `VARCHAR(10) NOT NULL`
  - `provider_used`: `VARCHAR(40) NOT NULL DEFAULT 'dictionary'`
  - `is_verified`: `BOOLEAN NOT NULL DEFAULT TRUE`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Constraints:** `UNIQUE (user_id, source_text, target_lang)`
- **Trigger:** `trg_enforce_saved_translation_quota` (caps at 500 items per user).
- **RLS Policy:** `auth.uid() = user_id`

### 2.8 Cultural Bookmarks (`cultural_bookmarks`)
- **Table Name:** `public.cultural_bookmarks`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `article_id`: `VARCHAR(100) NOT NULL`
  - `article_title`: `VARCHAR(255) NOT NULL`
  - `content_language`: `VARCHAR(10) NOT NULL`
  - `origin_country`: `VARCHAR(100) NOT NULL`
  - `topic`: `VARCHAR(50) NOT NULL`
  - `cefr_level`: `VARCHAR(10) NOT NULL`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Constraints:** `UNIQUE (user_id, article_id)`
- **Trigger:** `trg_enforce_cultural_bookmark_quota` (caps at 200 items per user).
- **RLS Policy:** `auth.uid() = user_id`

### 2.9 Exercise Attempts (`exercise_attempts`)
- **Table Name:** `public.exercise_attempts`
- **Columns:**
  - `id`: `VARCHAR(120) PRIMARY KEY`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `exercise_id`: `VARCHAR(120) NOT NULL`
  - `curriculum_node_id`: `VARCHAR(100)`
  - `language`: `VARCHAR(10)`
  - `submitted_answer`: `TEXT`
  - `is_correct`: `BOOLEAN NOT NULL DEFAULT FALSE`
  - `score`: `INTEGER`
  - `max_score`: `INTEGER`
  - `passed`: `BOOLEAN`
  - `feedback`: `TEXT`
  - `attempt_count`: `INTEGER NOT NULL DEFAULT 1`
  - `response_payload`: `JSONB`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **RLS Policy:** `auth.uid() = user_id OR public.is_admin()`

### 2.10 Daily Lessons (`daily_lessons`)
- **Table Name:** `public.daily_lessons`
- **Columns:**
  - `id`: `VARCHAR(120) PRIMARY KEY`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `language`: `VARCHAR(10) NOT NULL DEFAULT 'pt'`
  - `lesson_date`: `DATE NOT NULL`
  - `cefr_level`: `VARCHAR(5) NOT NULL DEFAULT 'C1'`
  - `curriculum_node_id`: `VARCHAR(100)`
  - `study_mode`: `VARCHAR(20) NOT NULL DEFAULT 'full'`
  - `estimated_minutes`: `SMALLINT NOT NULL DEFAULT 15`
  - `content_fingerprint`: `VARCHAR(64)`
  - `status`: `VARCHAR(30) NOT NULL DEFAULT 'generated'`
  - `payload`: `JSONB NOT NULL`
  - `content_payload`: `JSONB NOT NULL`
  - `completed_sections`: `TEXT[] DEFAULT ARRAY[]::TEXT[]`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `completed_at`: `TIMESTAMPTZ`
- **Constraints:** `UNIQUE (user_id, language, lesson_date)`
- **Trigger:** `trg_sync_daily_lessons_payload` (guarantees `payload` and `content_payload` parity).
- **RLS Policy:** `auth.uid() = user_id OR public.is_admin()`

### 2.11 Reading Assignments (`lesson_assignments`)
- **Table Name:** `public.lesson_assignments`
- **Columns:**
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `language`: `VARCHAR(10) NOT NULL`
  - `assignment_date`: `DATE NOT NULL`
  - `article_id`: `VARCHAR(50) NOT NULL`
  - `article_title`: `VARCHAR(255) NOT NULL`
  - `article_url`: `TEXT NOT NULL`
  - `revision_id`: `VARCHAR(50)`
  - `cefr_level`: `VARCHAR(5) NOT NULL DEFAULT 'B2'`
  - `topic_category`: `VARCHAR(50) NOT NULL DEFAULT 'General'`
  - `status`: `VARCHAR(30) NOT NULL DEFAULT 'assigned'`
  - `completed_at`: `TIMESTAMPTZ`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Constraints:** `UNIQUE (user_id, language, assignment_date)`
- **RLS Policy:** `auth.uid() = user_id`

### 2.12 Email Deliveries & Retention Logs
- **`email_deliveries`:** Tracks digest delivery idempotency (`idempotency_key UNIQUE`, `UNIQUE (user_id, delivery_date, delivery_purpose)`).
- **`retention_cleanup_logs`:** Maintenance ledger recording pruned lessons, exercise attempts, and preserved learner records.

### 2.13 Educational Reference Tables
- `licenses_and_sources`, `curriculum_nodes`, `vocabulary_items`, `grammar_rules`, `exercise_templates`, `curated_materials`.
- All reference tables have RLS enabled with public `SELECT` access granted to `anon` and `authenticated`.

---

## 3. Four-Way Linguistic Decoupling Guarantee

The canonical schema encodes the core architectural invariant:
1. `interface_language`: Stored in `user_profiles.interface_language`.
2. `native_language`: Stored in `user_profiles.native_language`.
3. `primary_target_language` & `target_language`: Stored in `user_courses.target_language` and `user_learning_tracks.language`.
4. `explanation_language`: Stored in `user_courses.explanation_language` and `user_profiles.explanation_language`.
5. `regional_variant`: Stored in `user_courses.regional_variant` and `user_learning_tracks.regional_variety`.

These fields are strictly decoupled at the column and constraint levels, ensuring changing interface navigation never modifies or resets language track progress.
