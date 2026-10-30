-- Rollback for Migration 009: Schema Reconciliation, SRS & Learning Track Persistence

DROP POLICY IF EXISTS "Users can assign default role on registration" ON public.user_roles;

DROP POLICY IF EXISTS "Users can manage own exercise attempts" ON public.exercise_attempts;
DROP POLICY IF EXISTS "Service role full access on exercise_attempts" ON public.exercise_attempts;
DROP TABLE IF EXISTS public.exercise_attempts;

DROP POLICY IF EXISTS "Users can manage own srs items" ON public.srs_items;
DROP POLICY IF EXISTS "Service role full access on srs_items" ON public.srs_items;
DROP TABLE IF EXISTS public.srs_items;

DROP POLICY IF EXISTS "Users can manage own learning tracks" ON public.user_learning_tracks;
DROP POLICY IF EXISTS "Service role full access on user_learning_tracks" ON public.user_learning_tracks;
DROP TABLE IF EXISTS public.user_learning_tracks;
