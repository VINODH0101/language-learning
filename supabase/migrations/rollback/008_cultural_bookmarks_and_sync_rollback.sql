-- ==============================================================================
-- Polyglot C1 Daily — Rollback Migration 008: Cultural Bookmarks
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_enforce_cultural_bookmark_quota ON public.cultural_bookmarks;
DROP FUNCTION IF EXISTS public.check_cultural_bookmark_quota();

DROP POLICY IF EXISTS "Users can delete own cultural bookmarks" ON public.cultural_bookmarks;
DROP POLICY IF EXISTS "Users can insert own cultural bookmarks" ON public.cultural_bookmarks;
DROP POLICY IF EXISTS "Users can view own cultural bookmarks" ON public.cultural_bookmarks;

DROP TABLE IF EXISTS public.cultural_bookmarks CASCADE;
