-- ==============================================================================
-- Lexilume — Migration 014: Administrative Operations, Content Review & Background Jobs
--
-- Core Invariants:
-- 1. Administrative operations secured with public.is_admin() or JWT role checks.
-- 2. Strict Hindi exclusion on pedagogical review items and background jobs.
-- 3. Persistent audit logging for all moderation and administrative actions.
-- ==============================================================================

-- 1. Content Review Moderation Queue Table
CREATE TABLE IF NOT EXISTS public.content_review_items (
    id VARCHAR(64) PRIMARY KEY,
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN ('vocabulary', 'reading', 'exercise', 'dialogue')),
    title_or_term VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL CHECK (language <> 'hi'),
    cefr_level VARCHAR(5) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
    source VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason_flagged TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_content_review_status_lang 
    ON public.content_review_items(status, language);

CREATE INDEX IF NOT EXISTS idx_content_review_created 
    ON public.content_review_items(created_at DESC);

-- 2. Administrative Background Jobs & Telemetry Table
CREATE TABLE IF NOT EXISTS public.admin_background_jobs (
    id VARCHAR(64) PRIMARY KEY,
    job_type VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL CHECK (language <> 'hi'),
    cefr_level VARCHAR(5) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
    status VARCHAR(20) NOT NULL DEFAULT 'failed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_reason TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_run_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_jobs_status_created 
    ON public.admin_background_jobs(status, created_at DESC);

-- 3. Enable Row-Level Security
ALTER TABLE public.content_review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_background_jobs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for content_review_items
DROP POLICY IF EXISTS "Service role full access on content_review_items" ON public.content_review_items;
CREATE POLICY "Service role full access on content_review_items"
    ON public.content_review_items
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can manage content review items" ON public.content_review_items;
CREATE POLICY "Admins can manage content review items"
    ON public.content_review_items
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

-- 5. RLS Policies for admin_background_jobs
DROP POLICY IF EXISTS "Service role full access on admin_background_jobs" ON public.admin_background_jobs;
CREATE POLICY "Service role full access on admin_background_jobs"
    ON public.admin_background_jobs
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can manage background jobs" ON public.admin_background_jobs;
CREATE POLICY "Admins can manage background jobs"
    ON public.admin_background_jobs
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
