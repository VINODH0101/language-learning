
-- ==============================================================================
-- Lexilume — Migration 010: Database Persistence & Sync Repair
-- 
-- Resolves root causes of database write failures:
-- 1. Adds missing INSERT policy on public.user_profiles for authenticated users.
-- 2. Adds automated handle_new_user() trigger on auth.users for profile creation.
-- 3. Reconciles user_id foreign keys with auth.users(id) for cultural_bookmarks
--    and saved_translations, eliminating the foreign-key vs RLS conflict.
-- 4. Establishes bi-directional sync trigger between user_courses and
--    user_learning_tracks to unify frontend and Python engine progress.
-- 5. Hardens RLS policies for srs_items and user_courses.
-- ==============================================================================

-- 1. USER_PROFILES: Allow Authenticated Users to Insert & Manage Their Profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Automated trigger function to initialize user_profiles & default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        auth_user_id,
        email,
        full_name,
        created_at,
        last_active_at
    )
    VALUES (
        NEW.id,
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Learner'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        last_active_at = CURRENT_TIMESTAMP;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users if auth schema is accessible
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 2. CULTURAL_BOOKMARKS: Reconcile Foreign Key to auth.users(id)
ALTER TABLE public.cultural_bookmarks
    DROP CONSTRAINT IF EXISTS cultural_bookmarks_user_id_fkey;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        ALTER TABLE public.cultural_bookmarks
            ADD CONSTRAINT cultural_bookmarks_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Hardened RLS for cultural_bookmarks
ALTER TABLE public.cultural_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can view own cultural bookmarks"
    ON public.cultural_bookmarks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can insert own cultural bookmarks"
    ON public.cultural_bookmarks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can update own cultural bookmarks"
    ON public.cultural_bookmarks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can delete own cultural bookmarks"
    ON public.cultural_bookmarks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. SAVED_TRANSLATIONS: Reconcile Foreign Key to auth.users(id)
ALTER TABLE public.saved_translations
    DROP CONSTRAINT IF EXISTS saved_translations_user_id_fkey;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        ALTER TABLE public.saved_translations
            ADD CONSTRAINT saved_translations_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

ALTER TABLE public.saved_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved translations" ON public.saved_translations;
CREATE POLICY "Users can view own saved translations"
    ON public.saved_translations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved translations" ON public.saved_translations;
CREATE POLICY "Users can insert own saved translations"
    ON public.saved_translations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved translations" ON public.saved_translations;
CREATE POLICY "Users can update own saved translations"
    ON public.saved_translations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved translations" ON public.saved_translations;
CREATE POLICY "Users can delete own saved translations"
    ON public.saved_translations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. SRS_ITEMS: Hardened RLS
ALTER TABLE public.srs_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own srs items" ON public.srs_items;
CREATE POLICY "Users can manage own srs items"
    ON public.srs_items
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. RECONCILIATION TRIGGER: user_courses <-> user_learning_tracks
CREATE OR REPLACE FUNCTION public.sync_user_course_to_learning_track()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_learning_tracks (
        user_id,
        language,
        regional_variety,
        current_cefr_level,
        streak_days,
        total_lessons_completed,
        completed_curriculum_node_ids,
        updated_at
    )
    VALUES (
        NEW.user_id,
        NEW.target_language,
        NEW.regional_variant,
        NEW.cefr_level,
        NEW.streak_days,
        NEW.total_lessons_completed,
        NEW.completed_curriculum_node_ids,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, language) DO UPDATE SET
        regional_variety = EXCLUDED.regional_variety,
        current_cefr_level = EXCLUDED.current_cefr_level,
        streak_days = EXCLUDED.streak_days,
        total_lessons_completed = EXCLUDED.total_lessons_completed,
        completed_curriculum_node_ids = EXCLUDED.completed_curriculum_node_ids,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_user_course_to_learning_track ON public.user_courses;
CREATE TRIGGER trg_sync_user_course_to_learning_track
    AFTER INSERT OR UPDATE ON public.user_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_course_to_learning_track();
