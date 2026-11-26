-- ==============================================================================
-- Lexilume — Migration 017 Rollback: Revert AI Platform Persistence Tables
-- ==============================================================================

DROP TABLE IF EXISTS public.discovery_enrichments CASCADE;
DROP TABLE IF EXISTS public.discovery_items CASCADE;
DROP TABLE IF EXISTS public.discovery_fetch_runs CASCADE;
DROP TABLE IF EXISTS public.discovery_sources CASCADE;
DROP TABLE IF EXISTS public.ai_provider_usage CASCADE;
DROP TABLE IF EXISTS public.content_validation_reports CASCADE;
DROP TABLE IF EXISTS public.content_prompt_templates CASCADE;
DROP TABLE IF EXISTS public.content_generation_attempts CASCADE;
DROP TABLE IF EXISTS public.content_generation_jobs CASCADE;
DROP TABLE IF EXISTS public.content_generation_runs CASCADE;
DROP TABLE IF EXISTS public.content_generation_schedules CASCADE;

DROP INDEX IF EXISTS public.uq_content_review_items_idempotency;
DROP INDEX IF EXISTS public.idx_content_review_items_content_item;

ALTER TABLE public.content_review_items
    DROP CONSTRAINT IF EXISTS ck_content_review_items_content_type,
    DROP CONSTRAINT IF EXISTS ck_content_review_items_cefr_level;

ALTER TABLE public.content_review_items
    DROP COLUMN IF EXISTS draft_payload,
    DROP COLUMN IF EXISTS idempotency_key,
    DROP COLUMN IF EXISTS explanation_language,
    DROP COLUMN IF EXISTS content_version_id,
    DROP COLUMN IF EXISTS content_item_id;
