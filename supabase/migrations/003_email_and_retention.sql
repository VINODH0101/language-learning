-- =====================================================================
-- Migration 003: Email Delivery Ledger & Retention Cleanup Logs
-- Polyglot C1 Daily — Production Delivery State & Idempotency
-- =====================================================================

-- 1. Email delivery ledger table
CREATE TABLE IF NOT EXISTS public.email_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    delivery_purpose VARCHAR(50) NOT NULL DEFAULT 'daily_digest', -- 'daily_digest', 'review_reminder'
    idempotency_key VARCHAR(128) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'resend', -- 'resend', 'smtp', 'mock'
    provider_message_id VARCHAR(255),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'sent', 'failed')),
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    CONSTRAINT uq_user_delivery_date_purpose UNIQUE (user_id, delivery_date, delivery_purpose),
    CONSTRAINT uq_delivery_idempotency_key UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_user_date ON public.email_deliveries(user_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON public.email_deliveries(status);

-- 2. Retention cleanup audit log table
CREATE TABLE IF NOT EXISTS public.retention_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_dry_run BOOLEAN NOT NULL DEFAULT FALSE,
    pruned_lessons_count INT NOT NULL DEFAULT 0,
    pruned_attempts_count INT NOT NULL DEFAULT 0,
    preserved_users_count INT NOT NULL DEFAULT 0,
    preserved_tracks_count INT NOT NULL DEFAULT 0,
    preserved_srs_count INT NOT NULL DEFAULT 0,
    log_summary TEXT NOT NULL
);

-- 3. Row-Level Security for email deliveries
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Learners can only read their own delivery logs
CREATE POLICY "Learners can view own email deliveries"
    ON public.email_deliveries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role has full access to delivery ledger and cleanup logs
CREATE POLICY "Service role full access to email deliveries"
    ON public.email_deliveries
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Service role full access to retention logs"
    ON public.retention_cleanup_logs
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);
