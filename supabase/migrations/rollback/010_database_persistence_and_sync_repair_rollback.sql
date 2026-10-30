-- ==============================================================================
-- Rollback Migration 010: Database Persistence & Sync Repair
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_sync_user_course_to_learning_track ON public.user_courses;
DROP FUNCTION IF EXISTS public.sync_user_course_to_learning_track();

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own cultural bookmarks" ON public.cultural_bookmarks;
DROP POLICY IF EXISTS "Users can update own cultural bookmarks" ON public.cultural_bookmarks;
DROP POLICY IF EXISTS "Users can delete own cultural bookmarks" ON public.cultural_bookmarks;

DROP POLICY IF EXISTS "Users can insert own saved translations" ON public.saved_translations;
DROP POLICY IF EXISTS "Users can update own saved translations" ON public.saved_translations;
DROP POLICY IF EXISTS "Users can delete own saved translations" ON public.saved_translations;

DROP POLICY IF EXISTS "Users can manage own srs items" ON public.srs_items;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS public.handle_new_user();
    END IF;
END $$;
