"""
Polyglot C1 Daily — Verification of Auth Roles, Admin Audit Migration, and Admin Bootstrap Script.
"""

import os
import subprocess
import sys
from pathlib import Path


def test_migration_006_sql_integrity():
    migration_file = Path("supabase/migrations/006_auth_roles_audit_and_onboarding.sql")
    assert migration_file.exists(), "Migration 006 file must exist"

    sql = migration_file.read_text(encoding="utf-8")
    assert "CREATE TABLE IF NOT EXISTS public.user_roles" in sql
    assert "public.is_admin()" in sql
    assert "CREATE TABLE IF NOT EXISTS public.admin_audit_logs" in sql
    assert "ENABLE ROW LEVEL SECURITY" in sql
    assert "interface_language" in sql
    assert "onboarding_completed" in sql
    assert "email_daily_lesson_opt_in" in sql


def test_migration_006_rollback_sql_integrity():
    rollback_file = Path("supabase/migrations/rollback/006_auth_roles_audit_and_onboarding_rollback.sql")
    assert rollback_file.exists(), "Rollback migration 006 must exist"

    sql = rollback_file.read_text(encoding="utf-8")
    assert "DROP TABLE IF EXISTS public.admin_audit_logs" in sql
    assert "DROP TABLE IF EXISTS public.user_roles" in sql
    assert "DROP FUNCTION IF EXISTS public.is_admin()" in sql


def test_bootstrap_admin_script_requires_credentials():
    script_path = Path("scripts/bootstrap_admin.py")
    assert script_path.exists(), "bootstrap_admin.py must exist"

    # Running without SUPABASE_URL / SERVICE_ROLE_KEY must exit with code 1
    env = os.environ.copy()
    env.pop("SUPABASE_URL", None)
    env.pop("SUPABASE_SERVICE_ROLE_KEY", None)

    cmd = [sys.executable, str(script_path), "--email", "admin@polyglot.dev"]
    proc = subprocess.run(cmd, capture_output=True, text=True, env=env)
    assert proc.returncode == 1
    assert "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" in proc.stderr or "SUPABASE_URL" in proc.stdout
