-- ==============================================================================
-- Polyglot C1 Daily — Rollback Migration 004: Minimal Wikipedia Lesson Assignments
-- ==============================================================================

DROP POLICY IF EXISTS "Service role has full access to assignments" ON public.lesson_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON public.lesson_assignments;
DROP POLICY IF EXISTS "Users can insert own assignments" ON public.lesson_assignments;
DROP POLICY IF EXISTS "Users can view own assignments" ON public.lesson_assignments;

DROP TABLE IF EXISTS public.lesson_assignments CASCADE;
