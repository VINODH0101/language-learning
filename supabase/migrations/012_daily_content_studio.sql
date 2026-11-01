-- ==============================================================================
-- Lexilume — Migration 012: Daily Content Studio (Poetry & Daily Dialogue)
-- Provides persistent storage, active replacement semantics, and administrative
-- publishing for daily literary poetry and communicative dialogue content.
--
-- Core Invariants:
-- 1. Zero-paid AI mandate: Open literary and authentic situational models.
-- 2. Hindi exclusion: learning_language <> 'hi'.
-- 3. Replacement semantics: Newly published items become active, previous archived.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.daily_published_content (
    id VARCHAR(64) PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('poetry', 'conversation')),
    title VARCHAR(255) NOT NULL,
    author_or_speaker VARCHAR(255),
    scenario TEXT,
    learning_language VARCHAR(10) NOT NULL CHECK (learning_language <> 'hi'),
    cefr_level VARCHAR(5) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
    excerpt TEXT,
    full_content TEXT,
    dialogue JSONB,
    cultural_context TEXT,
    country_name VARCHAR(100),
    country_code VARCHAR(10),
    translation TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    archived_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance and Active Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_daily_content_active 
    ON public.daily_published_content(content_type, learning_language, is_active);

CREATE INDEX IF NOT EXISTS idx_daily_content_published 
    ON public.daily_published_content(published_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.daily_published_content ENABLE ROW LEVEL SECURITY;

-- 1. All users (authenticated and anonymous) can view active published content
DROP POLICY IF EXISTS "Anyone can view active daily content" ON public.daily_published_content;
CREATE POLICY "Anyone can view active daily content"
    ON public.daily_published_content
    FOR SELECT
    USING (is_active = TRUE OR auth.role() = 'service_role');

-- 2. Service role has full management capabilities
DROP POLICY IF EXISTS "Service role full access on daily_published_content" ON public.daily_published_content;
CREATE POLICY "Service role full access on daily_published_content"
    ON public.daily_published_content
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- 3. Authenticated administrators can draft, publish, and archive content
DROP POLICY IF EXISTS "Admins can manage daily published content" ON public.daily_published_content;
CREATE POLICY "Admins can manage daily published content"
    ON public.daily_published_content
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
