-- ==============================================================================
-- Polyglot C1 Daily — Migration 007: Multiple Learning Courses,
-- Independent Language Settings, and Progress Isolation
-- ==============================================================================

-- 1. Create user_courses table to support multiple learning tracks per user
-- Allows learners to learn English, Portuguese, and Spanish concurrently
-- with independent explanation language, regional variety, and CEFR level.
CREATE TABLE IF NOT EXISTS public.user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_language VARCHAR(10) NOT NULL,
    regional_variant VARCHAR(20) NOT NULL,
    cefr_level VARCHAR(5) NOT NULL DEFAULT 'B1',
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en',
    daily_goal_minutes SMALLINT NOT NULL DEFAULT 10,
    streak_days INTEGER NOT NULL DEFAULT 0,
    total_lessons_completed INTEGER NOT NULL DEFAULT 0,
    completed_curriculum_node_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_course UNIQUE (user_id, target_language, regional_variant, cefr_level)
);

CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_active ON public.user_courses(user_id, is_active);

-- 2. Extend curriculum_nodes, vocabulary_items, and grammar_rules if needed for English
-- Ensure target_slot_index and acceptable language codes include 'en'
ALTER TABLE public.curriculum_nodes
    DROP CONSTRAINT IF EXISTS chk_curriculum_lang;

-- 3. Enable Row-Level Security (RLS) on user_courses
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: strict user isolation
DROP POLICY IF EXISTS "Users can view own courses" ON public.user_courses;
CREATE POLICY "Users can view own courses"
    ON public.user_courses
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Users can insert own courses" ON public.user_courses;
CREATE POLICY "Users can insert own courses"
    ON public.user_courses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own courses" ON public.user_courses;
CREATE POLICY "Users can update own courses"
    ON public.user_courses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own courses" ON public.user_courses;
CREATE POLICY "Users can delete own courses"
    ON public.user_courses
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Helper function to atomically set active course
CREATE OR REPLACE FUNCTION public.set_active_course(p_course_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Deactivate all courses of this user
    UPDATE public.user_courses
    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = auth.uid();

    -- Activate the requested course
    UPDATE public.user_courses
    SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_course_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
