-- ==============================================================================
-- Lexilume — Migration 017: AI Platform Scheduling, Jobs, Usage & Discovery
--
-- Purpose:
--   1. Extend `content_review_items` (from migration 014) to support the eight
--      centralized AI content types, CEFR C2, and links to `content_items` /
--      `content_versions` drafts.
--   2. Add generation scheduling, run/job/attempt tracking, prompt templates,
--      validation reports, and AI provider usage accounting.
--   3. Add Discovery source registry, fetch runs, normalized items, and
--      enrichment provenance.
--
-- Invariants:
--   - Forward-only, additive, idempotent DDL.
--   - UUID surrogate primary keys via gen_random_uuid().
--   - Strict RLS: learner-facing read restricted to published Discovery items;
--     all generation, scheduling, usage, and validation tables are admin-only.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Extend content_review_items for unified AI drafts
-- ------------------------------------------------------------------------------
ALTER TABLE public.content_review_items
    ADD COLUMN IF NOT EXISTS content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS content_version_id UUID REFERENCES public.content_versions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS explanation_language VARCHAR(10) NOT NULL DEFAULT 'en'
        CHECK (explanation_language IN ('en', 'pt', 'es')),
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS draft_payload JSONB;

DO $$
DECLARE
    c_name TEXT;
BEGIN
    FOR c_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.content_review_items'::regclass
          AND contype = 'c'
          AND (
              pg_get_constraintdef(oid) ILIKE '%content_type%'
              OR pg_get_constraintdef(oid) ILIKE '%cefr_level%'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.content_review_items DROP CONSTRAINT IF EXISTS %I', c_name);
    END LOOP;
END $$;

ALTER TABLE public.content_review_items
    ADD CONSTRAINT ck_content_review_items_content_type
    CHECK (content_type IN (
        'vocabulary', 'reading', 'exercise', 'dialogue',
        'story', 'conversation', 'poetry', 'grammar',
        'academic_essay', 'cultural_article', 'practice'
    ));

ALTER TABLE public.content_review_items
    ADD CONSTRAINT ck_content_review_items_cefr_level
    CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_review_items_idempotency
    ON public.content_review_items (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_review_items_content_item
    ON public.content_review_items (content_item_id);

-- ------------------------------------------------------------------------------
-- 2. Generation & Scheduling Tables
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_generation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_key VARCHAR(120) NOT NULL UNIQUE,
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'story', 'conversation', 'poetry', 'grammar',
        'vocabulary', 'academic_essay', 'cultural_article', 'practice'
    )),
    target_language VARCHAR(10) NOT NULL CHECK (target_language IN ('en', 'pt', 'es')),
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (explanation_language IN ('en', 'pt', 'es')),
    cefr_level VARCHAR(5) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    topic VARCHAR(255) NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    frequency_days INTEGER NOT NULL DEFAULT 1 CHECK (frequency_days >= 1),
    daily_limit INTEGER NOT NULL DEFAULT 3 CHECK (daily_limit >= 1),
    cron_expression VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_generation_schedule_combo UNIQUE (content_type, target_language, explanation_language, cefr_level, topic)
);

CREATE TABLE IF NOT EXISTS public.content_generation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(30) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    jobs_planned INTEGER NOT NULL DEFAULT 0 CHECK (jobs_planned >= 0),
    jobs_created INTEGER NOT NULL DEFAULT 0 CHECK (jobs_created >= 0),
    jobs_completed INTEGER NOT NULL DEFAULT 0 CHECK (jobs_completed >= 0),
    jobs_failed INTEGER NOT NULL DEFAULT 0 CHECK (jobs_failed >= 0),
    jobs_duplicate INTEGER NOT NULL DEFAULT 0 CHECK (jobs_duplicate >= 0),
    fallbacks_used INTEGER NOT NULL DEFAULT 0 CHECK (fallbacks_used >= 0),
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.content_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.content_generation_runs(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES public.content_generation_schedules(id) ON DELETE SET NULL,
    schedule_key VARCHAR(120) NOT NULL DEFAULT '',
    content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'story', 'conversation', 'poetry', 'grammar',
        'vocabulary', 'academic_essay', 'cultural_article', 'practice'
    )),
    target_language VARCHAR(10) NOT NULL CHECK (target_language IN ('en', 'pt', 'es')),
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (explanation_language IN ('en', 'pt', 'es')),
    cefr_level VARCHAR(5) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    topic VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    draft_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_content_generation_jobs_status
    ON public.content_generation_jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_generation_jobs_combo
    ON public.content_generation_jobs (content_type, target_language, cefr_level, status);

CREATE TABLE IF NOT EXISTS public.content_generation_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.content_generation_jobs(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
    provider_id VARCHAR(50),
    model_id VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
    failure_category VARCHAR(50),
    error_message TEXT,
    latency_ms INTEGER NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_generation_job_attempt UNIQUE (job_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS public.content_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'story', 'conversation', 'poetry', 'grammar',
        'vocabulary', 'academic_essay', 'cultural_article', 'practice'
    )),
    version VARCHAR(30) NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_prompt_template_version UNIQUE (content_type, version)
);

CREATE TABLE IF NOT EXISTS public.content_validation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_version_id UUID REFERENCES public.content_versions(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.content_generation_jobs(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_provider_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id VARCHAR(50) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL DEFAULT 'default',
    request_id VARCHAR(120),
    prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'success',
    failure_category VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_created
    ON public.ai_provider_usage (provider_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Discovery Tables
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.discovery_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(80) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    license_name VARCHAR(120) NOT NULL,
    license_url TEXT,
    attribution_text TEXT NOT NULL,
    rate_limit_rpm INTEGER NOT NULL DEFAULT 30 CHECK (rate_limit_rpm >= 0),
    cache_ttl_seconds INTEGER NOT NULL DEFAULT 86400 CHECK (cache_ttl_seconds >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_discovery_sources_enabled
    ON public.discovery_sources (enabled);

CREATE TABLE IF NOT EXISTS public.discovery_fetch_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(80) NOT NULL,
    query TEXT NOT NULL DEFAULT '',
    target_language VARCHAR(10) NOT NULL CHECK (target_language IN ('en', 'pt', 'es')),
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    items_fetched INTEGER NOT NULL DEFAULT 0 CHECK (items_fetched >= 0),
    items_rejected INTEGER NOT NULL DEFAULT 0 CHECK (items_rejected >= 0),
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.discovery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(80) NOT NULL,
    source_item_id VARCHAR(255) NOT NULL,
    category VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_language VARCHAR(10) NOT NULL CHECK (target_language IN ('en', 'pt', 'es')),
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (explanation_language IN ('en', 'pt', 'es')),
    cefr_level VARCHAR(5) CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    summary TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    facts JSONB NOT NULL DEFAULT '{}'::jsonb,
    explanation TEXT NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'rejected', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_discovery_source_item UNIQUE (source_id, source_item_id)
);

CREATE INDEX IF NOT EXISTS idx_discovery_items_catalog
    ON public.discovery_items (target_language, category, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.discovery_enrichments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_item_id UUID NOT NULL REFERENCES public.discovery_items(id) ON DELETE CASCADE,
    kind VARCHAR(60) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. Row-Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.content_generation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_validation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_fetch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_enrichments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access on content_generation_schedules" ON public.content_generation_schedules;
CREATE POLICY "Admin access on content_generation_schedules"
    ON public.content_generation_schedules FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on content_generation_runs" ON public.content_generation_runs;
CREATE POLICY "Admin access on content_generation_runs"
    ON public.content_generation_runs FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on content_generation_jobs" ON public.content_generation_jobs;
CREATE POLICY "Admin access on content_generation_jobs"
    ON public.content_generation_jobs FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on content_generation_attempts" ON public.content_generation_attempts;
CREATE POLICY "Admin access on content_generation_attempts"
    ON public.content_generation_attempts FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on content_prompt_templates" ON public.content_prompt_templates;
CREATE POLICY "Admin access on content_prompt_templates"
    ON public.content_prompt_templates FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on content_validation_reports" ON public.content_validation_reports;
CREATE POLICY "Admin access on content_validation_reports"
    ON public.content_validation_reports FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on ai_provider_usage" ON public.ai_provider_usage;
CREATE POLICY "Admin access on ai_provider_usage"
    ON public.ai_provider_usage FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on discovery_sources" ON public.discovery_sources;
CREATE POLICY "Admin access on discovery_sources"
    ON public.discovery_sources FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on discovery_fetch_runs" ON public.discovery_fetch_runs;
CREATE POLICY "Admin access on discovery_fetch_runs"
    ON public.discovery_fetch_runs FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Public read published discovery_items" ON public.discovery_items;
CREATE POLICY "Public read published discovery_items"
    ON public.discovery_items FOR SELECT
    USING (status = 'published' OR public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin write access on discovery_items" ON public.discovery_items;
CREATE POLICY "Admin write access on discovery_items"
    ON public.discovery_items FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin access on discovery_enrichments" ON public.discovery_enrichments;
CREATE POLICY "Admin access on discovery_enrichments"
    ON public.discovery_enrichments FOR ALL TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- ------------------------------------------------------------------------------
-- 5. Updated-At Triggers
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_generation_schedules_updated_at ON public.content_generation_schedules;
CREATE TRIGGER trg_generation_schedules_updated_at
    BEFORE UPDATE ON public.content_generation_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_generation_jobs_updated_at ON public.content_generation_jobs;
CREATE TRIGGER trg_generation_jobs_updated_at
    BEFORE UPDATE ON public.content_generation_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_discovery_sources_updated_at ON public.discovery_sources;
CREATE TRIGGER trg_discovery_sources_updated_at
    BEFORE UPDATE ON public.discovery_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_discovery_items_updated_at ON public.discovery_items;
CREATE TRIGGER trg_discovery_items_updated_at
    BEFORE UPDATE ON public.discovery_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
