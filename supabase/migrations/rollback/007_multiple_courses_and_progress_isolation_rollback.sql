-- ==============================================================================
-- Polyglot C1 Daily — Rollback Migration 007
-- ==============================================================================

DROP FUNCTION IF EXISTS public.set_active_course(UUID);

DROP POLICY IF EXISTS "Users can delete own courses" ON public.user_courses;
DROP POLICY IF EXISTS "Users can update own courses" ON public.user_courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON public.user_courses;
DROP POLICY IF EXISTS "Users can view own courses" ON public.user_courses;

DROP TABLE IF EXISTS public.user_courses;
