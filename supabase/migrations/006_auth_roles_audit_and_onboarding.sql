-- ==============================================================================
-- Polyglot C1 Daily — Migration 006: Auth Roles, Admin Audit Logs,
-- RLS Security Policies, and User Onboarding Preferences
-- ==============================================================================

-- 1. Create user_roles table with strict role check
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_roles_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 2. Trusted SECURITY DEFINER helper function to verify admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Administrative Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(80) NOT NULL,
    target_user_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);

-- 4. Extend user_profiles with multilingual, theme & onboarding preferences
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS interface_language VARCHAR(10) NOT NULL DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS explanation_language VARCHAR(10) NOT NULL DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS daily_goal_minutes SMALLINT NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'dark',
    ADD COLUMN IF NOT EXISTS email_daily_lesson_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Enable Row-Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for user_roles
-- Users can view their own role; Admins can view all roles
DROP POLICY IF EXISTS "Users can view own role, admins view all" ON public.user_roles;
CREATE POLICY "Users can view own role, admins view all"
    ON public.user_roles
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR public.is_admin()
    );

-- Only existing admins or service_role can assign, change, or revoke roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
    ON public.user_roles
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. RLS Policies for admin_audit_logs
-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs
    FOR SELECT
    USING (public.is_admin());

-- Admins can insert audit entries documenting their sensitive actions
DROP POLICY IF EXISTS "Admins can insert audit entries" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit entries"
    ON public.admin_audit_logs
    FOR INSERT
    WITH CHECK (
        public.is_admin()
        AND auth.uid() = admin_id
    );

-- 8. Enhanced RLS Policies for user_profiles (Admin Management Access)
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all user profiles"
    ON public.user_profiles
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update user status" ON public.user_profiles;
CREATE POLICY "Admins can update user status"
    ON public.user_profiles
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. Enhanced RLS Policies for learning tracks and statistics
DROP POLICY IF EXISTS "Admins can view all language tracks" ON public.language_tracks;
CREATE POLICY "Admins can view all language tracks"
    ON public.language_tracks
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all daily lessons" ON public.daily_lessons;
CREATE POLICY "Admins can view all daily lessons"
    ON public.daily_lessons
    FOR SELECT
    USING (public.is_admin());
