-- ==============================================================================
-- Polyglot C1 Daily — Migration 004: Minimal Wikipedia Lesson Assignments
-- 
-- Stores lightweight daily article assignments referencing external Wikimedia
-- page identifiers and URLs without bloating Supabase PostgreSQL storage with
-- full article texts.
-- ==============================================================================

-- 1. Create lesson_assignments table
CREATE TABLE IF NOT EXISTS public.lesson_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    assignment_date DATE NOT NULL,
    article_id VARCHAR(50) NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    article_url TEXT NOT NULL,
    revision_id VARCHAR(50),
    cefr_level VARCHAR(5) NOT NULL DEFAULT 'B2',
    topic_category VARCHAR(50) NOT NULL DEFAULT 'General',
    status VARCHAR(30) NOT NULL DEFAULT 'assigned',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_lang_assignment_date UNIQUE (user_id, language, assignment_date)
);

-- 2. Indexes for fast user queries and article recency checks
CREATE INDEX IF NOT EXISTS idx_assignments_user_date ON public.lesson_assignments(user_id, assignment_date DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_article ON public.lesson_assignments(article_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.lesson_assignments(user_id, status);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view own assignments" ON public.lesson_assignments;
CREATE POLICY "Users can view own assignments"
    ON public.lesson_assignments
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assignments" ON public.lesson_assignments;
CREATE POLICY "Users can insert own assignments"
    ON public.lesson_assignments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assignments" ON public.lesson_assignments;
CREATE POLICY "Users can update own assignments"
    ON public.lesson_assignments
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to assignments" ON public.lesson_assignments;
CREATE POLICY "Service role has full access to assignments"
    ON public.lesson_assignments
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
