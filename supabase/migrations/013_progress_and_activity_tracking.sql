-- ==============================================================================
-- Lexilume — Migration 013: Progress Analytics & Unified Activity Tracking
-- 
-- Invariants:
-- 1. Scopes exercise attempts by target learning language and exercise type.
-- 2. Creates unified learning activity events table for local-to-cloud synchronization.
-- 3. Strict tenant isolation with RLS: auth.uid() = user_id.
-- 4. Zero-paid AI mandate: Relies entirely on relational metrics and open data.
-- 5. Hindi exclusion: learning_language <> 'hi'.
-- ==============================================================================

-- 1. Enhance exercise_attempts with language and exercise_type scoping
ALTER TABLE public.exercise_attempts
    ADD COLUMN IF NOT EXISTS language VARCHAR(10),
    ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_lang 
    ON public.exercise_attempts(user_id, language);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_type 
    ON public.exercise_attempts(exercise_type);

-- 2. Create learning_activity_events table for unified telemetry
CREATE TABLE IF NOT EXISTS public.learning_activity_events (
    id VARCHAR(120) PRIMARY KEY,
    user_id UUID NOT NULL,
    learning_language VARCHAR(10) NOT NULL CHECK (learning_language <> 'hi'),
    activity_type VARCHAR(50) NOT NULL,
    content_id VARCHAR(120),
    content_version VARCHAR(50),
    title VARCHAR(255),
    cefr_level VARCHAR(5) CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
    completion_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (completion_status IN ('started', 'in_progress', 'completed', 'abandoned')),
    score NUMERIC(5, 2),
    max_score NUMERIC(5, 2),
    duration_minutes NUMERIC(5, 2),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_lang_created 
    ON public.learning_activity_events(user_id, learning_language, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_type 
    ON public.learning_activity_events(activity_type);

-- 3. Enable Row-Level Security
ALTER TABLE public.learning_activity_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Service role full access on learning_activity_events" ON public.learning_activity_events;
CREATE POLICY "Service role full access on learning_activity_events"
    ON public.learning_activity_events
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can read own activity events" ON public.learning_activity_events;
CREATE POLICY "Users can read own activity events"
    ON public.learning_activity_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity events" ON public.learning_activity_events;
CREATE POLICY "Users can insert own activity events"
    ON public.learning_activity_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activity events" ON public.learning_activity_events;
CREATE POLICY "Users can update own activity events"
    ON public.learning_activity_events
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Rollback script for reference:
-- DROP TABLE IF EXISTS public.learning_activity_events;
-- DROP INDEX IF EXISTS idx_exercise_attempts_user_lang;
-- DROP INDEX IF EXISTS idx_exercise_attempts_type;
-- ALTER TABLE public.exercise_attempts DROP COLUMN IF EXISTS language;
-- ALTER TABLE public.exercise_attempts DROP COLUMN IF EXISTS exercise_type;
