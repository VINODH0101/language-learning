-- ==============================================================================
-- Lexilume — Canonical Database Reset Script (reset_and_rebuild.sql)
-- 
-- WARNING: DESTRUCTIVE OPERATION.
-- Drops all public application tables, triggers, and functions to allow a clean,
-- consistent re-execution of 001_canonical_baseline.sql.
-- 
-- DO NOT RUN AUTOMATICALLY WITHOUT OPERATOR CONFIRMATION AND BACKUP CREATION.
-- ==============================================================================

-- 1. Drop trigger on auth.users if attached
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    END IF;
END $$;

-- 2. Drop triggers and functions on public tables
DROP TRIGGER IF EXISTS trg_sync_user_course_to_learning_track ON public.user_courses;
DROP TRIGGER IF EXISTS trg_sync_daily_lessons_payload ON public.daily_lessons;
DROP TRIGGER IF EXISTS trg_enforce_saved_translation_quota ON public.saved_translations;
DROP TRIGGER IF EXISTS trg_enforce_cultural_bookmark_quota ON public.cultural_bookmarks;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_course_to_learning_track() CASCADE;
DROP FUNCTION IF EXISTS public.sync_daily_lessons_payload() CASCADE;
DROP FUNCTION IF EXISTS public.check_saved_translation_quota() CASCADE;
DROP FUNCTION IF EXISTS public.check_cultural_bookmark_quota() CASCADE;

-- 3. Drop active user & progress tables in reverse dependency order
DROP TABLE IF EXISTS public.retention_cleanup_logs CASCADE;
DROP TABLE IF EXISTS public.email_deliveries CASCADE;
DROP TABLE IF EXISTS public.lesson_assignments CASCADE;
DROP TABLE IF EXISTS public.daily_lessons CASCADE;
DROP TABLE IF EXISTS public.daily_published_content CASCADE;
DROP TABLE IF EXISTS public.exercise_attempts CASCADE;
DROP TABLE IF EXISTS public.cultural_bookmarks CASCADE;
DROP TABLE IF EXISTS public.saved_translations CASCADE;
DROP TABLE IF EXISTS public.srs_items CASCADE;
DROP TABLE IF EXISTS public.user_learning_tracks CASCADE;
DROP TABLE IF EXISTS public.user_courses CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 4. Drop legacy obsolete tables from historical migrations if present
DROP TABLE IF EXISTS public.user_vocabulary_history CASCADE;
DROP TABLE IF EXISTS public.lesson_exercises CASCADE;
DROP TABLE IF EXISTS public.language_tracks CASCADE;

-- 5. Drop educational reference tables
DROP TABLE IF EXISTS public.curated_materials CASCADE;
DROP TABLE IF EXISTS public.exercise_templates CASCADE;
DROP TABLE IF EXISTS public.grammar_rules CASCADE;
DROP TABLE IF EXISTS public.vocabulary_items CASCADE;
DROP TABLE IF EXISTS public.curriculum_nodes CASCADE;
DROP TABLE IF EXISTS public.licenses_and_sources CASCADE;
