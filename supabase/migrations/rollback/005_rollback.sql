-- ==============================================================================
-- Polyglot C1 Daily — Rollback Migration 005
-- ==============================================================================

DROP POLICY IF EXISTS "Service role has full access to saved translations" ON public.saved_translations;
DROP POLICY IF EXISTS "Users can delete own saved translations" ON public.saved_translations;
DROP POLICY IF EXISTS "Users can insert own saved translations" ON public.saved_translations;
DROP POLICY IF EXISTS "Users can view own saved translations" ON public.saved_translations;

DROP TRIGGER IF EXISTS trg_enforce_saved_translation_quota ON public.saved_translations;
DROP FUNCTION IF EXISTS public.check_saved_translation_quota();

DROP TABLE IF EXISTS public.saved_translations CASCADE;

ALTER TABLE public.user_profiles
    DROP COLUMN IF EXISTS native_language,
    DROP COLUMN IF EXISTS primary_target_language,
    DROP COLUMN IF EXISTS account_status,
    DROP COLUMN IF EXISTS last_active_at;
