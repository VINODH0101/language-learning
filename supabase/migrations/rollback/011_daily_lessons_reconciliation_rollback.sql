-- ==============================================================================
-- Rollback Migration 011: Daily Lessons Schema Reconciliation & Deduplication
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_sync_daily_lessons_payload ON public.daily_lessons;
DROP FUNCTION IF EXISTS public.sync_daily_lessons_payload();

DROP INDEX IF EXISTS idx_daily_lessons_lang_date;
DROP INDEX IF EXISTS idx_daily_lessons_fingerprint;

DROP POLICY IF EXISTS "Service role full access on daily_lessons" ON public.daily_lessons;
DROP POLICY IF EXISTS "Users can view own daily_lessons" ON public.daily_lessons;
DROP POLICY IF EXISTS "Users can insert own daily_lessons" ON public.daily_lessons;
DROP POLICY IF EXISTS "Users can update own daily_lessons" ON public.daily_lessons;

ALTER TABLE public.daily_lessons
    DROP COLUMN IF EXISTS payload,
    DROP COLUMN IF EXISTS content_fingerprint,
    DROP COLUMN IF EXISTS cefr_level,
    DROP COLUMN IF EXISTS language;
