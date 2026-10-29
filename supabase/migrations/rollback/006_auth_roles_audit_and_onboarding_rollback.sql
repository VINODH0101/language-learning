-- ==============================================================================
-- Polyglot C1 Daily — Rollback Migration 006
-- Reverts Auth Roles, Admin Audit Logs, and Onboarding Preference Additions
-- ==============================================================================

-- 1. Drop RLS policies created for admin access
DROP POLICY IF EXISTS "Admins can view all daily lessons" ON public.daily_lessons;
DROP POLICY IF EXISTS "Admins can view all language tracks" ON public.language_tracks;
DROP POLICY IF EXISTS "Admins can update user status" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert audit entries" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role, admins view all" ON public.user_roles;

-- 2. Drop admin audit logs table
DROP TABLE IF EXISTS public.admin_audit_logs;

-- 3. Drop helper function
DROP FUNCTION IF EXISTS public.is_admin();

-- 4. Drop user roles table
DROP TABLE IF EXISTS public.user_roles;

-- 5. Drop added columns from user_profiles
ALTER TABLE public.user_profiles
    DROP COLUMN IF EXISTS email_daily_lesson_opt_in,
    DROP COLUMN IF EXISTS theme,
    DROP COLUMN IF EXISTS daily_goal_minutes,
    DROP COLUMN IF EXISTS onboarding_completed,
    DROP COLUMN IF EXISTS explanation_language,
    DROP COLUMN IF EXISTS interface_language;
