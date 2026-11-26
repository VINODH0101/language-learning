-- ==============================================================================
-- Lexilume — Migration 015 Rollback: Revert Content-Centred Architecture
-- ==============================================================================

-- 1. Drop Compatibility Views
DROP VIEW IF EXISTS public.v_legacy_daily_content CASCADE;
DROP VIEW IF EXISTS public.v_legacy_srs_items CASCADE;
DROP VIEW IF EXISTS public.english_content_items CASCADE;

-- 2. Drop Target Tables in Reverse Dependency Order
DROP TABLE IF EXISTS public.migration_exception_logs CASCADE;
DROP TABLE IF EXISTS public.content_processing_jobs CASCADE;
DROP TABLE IF EXISTS public.user_mistakes CASCADE;
DROP TABLE IF EXISTS public.user_word_review_events CASCADE;
DROP TABLE IF EXISTS public.user_saved_words CASCADE;
DROP TABLE IF EXISTS public.learner_content_progress CASCADE;
DROP TABLE IF EXISTS public.learning_activities CASCADE;
DROP TABLE IF EXISTS public.content_versions CASCADE;
DROP TABLE IF EXISTS public.content_items CASCADE;
DROP TABLE IF EXISTS public.content_sources CASCADE;

-- 3. Drop Custom Functions and Triggers
DROP FUNCTION IF EXISTS public.prevent_published_version_mutation CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
