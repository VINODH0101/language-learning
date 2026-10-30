-- ==============================================================================
-- Lexilume — Migration 009: Schema Reconciliation, SRS & Learning Track Persistence
-- Harmonizes Python PostgREST schema requirements with Supabase tables and RLS policies
-- ==============================================================================

-- 1. Create user_learning_tracks table (canonical store for learner track progression)
CREATE TABLE IF NOT EXISTS public.user_learning_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    language VARCHAR(10) NOT NULL,
    regional_variety VARCHAR(20) NOT NULL DEFAULT 'all',
    current_cefr_level VARCHAR(5) NOT NULL DEFAULT 'A1',
    target_cefr_level VARCHAR(5) NOT NULL DEFAULT 'C1',
    current_curriculum_node_id VARCHAR(100),
    streak_days INTEGER NOT NULL DEFAULT 1,
    total_lessons_completed INTEGER NOT NULL DEFAULT 0,
    completed_curriculum_node_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    presented_vocabulary_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    mastered_vocabulary_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    recent_node_history TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    recent_exercise_history JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_learning_tracks UNIQUE (user_id, language)
);

CREATE INDEX IF NOT EXISTS idx_user_learning_tracks_user_lang ON public.user_learning_tracks(user_id, language);

-- 2. Create srs_items table (canonical Spaced Repetition persistence)
CREATE TABLE IF NOT EXISTS public.srs_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    vocabulary_item_id VARCHAR(120) NOT NULL,
    language VARCHAR(10) NOT NULL,
    repetition_count INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 1,
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    lapse_count INTEGER NOT NULL DEFAULT 0,
    mastery_status VARCHAR(20) NOT NULL DEFAULT 'presented',
    history JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_srs_user_vocab UNIQUE (user_id, vocabulary_item_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_items_user_due ON public.srs_items(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_srs_items_user_lang ON public.srs_items(user_id, language);

-- 3. Create exercise_attempts table
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
    id VARCHAR(120) PRIMARY KEY,
    user_id UUID NOT NULL,
    exercise_id VARCHAR(120) NOT NULL,
    submitted_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    feedback TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON public.exercise_attempts(user_id, created_at DESC);

-- 4. Reconcile email_deliveries columns
ALTER TABLE public.email_deliveries
    ADD COLUMN IF NOT EXISTS delivery_purpose VARCHAR(50) NOT NULL DEFAULT 'daily_digest',
    ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_purpose ON public.email_deliveries(delivery_purpose);

-- 5. Enable Row-Level Security
ALTER TABLE public.user_learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for user_learning_tracks
DROP POLICY IF EXISTS "Service role full access on user_learning_tracks" ON public.user_learning_tracks;
CREATE POLICY "Service role full access on user_learning_tracks"
    ON public.user_learning_tracks
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can manage own learning tracks" ON public.user_learning_tracks;
CREATE POLICY "Users can manage own learning tracks"
    ON public.user_learning_tracks
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. RLS Policies for srs_items
DROP POLICY IF EXISTS "Service role full access on srs_items" ON public.srs_items;
CREATE POLICY "Service role full access on srs_items"
    ON public.srs_items
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can manage own srs items" ON public.srs_items;
CREATE POLICY "Users can manage own srs items"
    ON public.srs_items
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policies for exercise_attempts
DROP POLICY IF EXISTS "Service role full access on exercise_attempts" ON public.exercise_attempts;
CREATE POLICY "Service role full access on exercise_attempts"
    ON public.exercise_attempts
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can manage own exercise attempts" ON public.exercise_attempts;
CREATE POLICY "Users can manage own exercise attempts"
    ON public.exercise_attempts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9. Registration default role insertion policy for user_roles
DROP POLICY IF EXISTS "Users can assign default role on registration" ON public.user_roles;
CREATE POLICY "Users can assign default role on registration"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND role = 'user');
