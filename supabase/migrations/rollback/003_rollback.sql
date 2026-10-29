-- =====================================================================
-- Migration 003 Rollback: Email Delivery Ledger & Retention Cleanup Logs
-- =====================================================================

DROP TABLE IF EXISTS public.retention_cleanup_logs CASCADE;
DROP TABLE IF EXISTS public.email_deliveries CASCADE;
