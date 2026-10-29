#!/usr/bin/env python3
"""
Polyglot C1 Daily — Initial Admin Bootstrap Script.

Safely bootstraps the first administrative user in a newly deployed Supabase environment
using service-role privileges. Does NOT hardcode credentials or passwords.

Usage:
    export SUPABASE_URL="https://your-project.supabase.co"
    export SUPABASE_SERVICE_ROLE_KEY="ey..."
    python scripts/bootstrap_admin.py --email admin@polyglot.dev
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import urllib.parse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("bootstrap_admin")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bootstrap initial admin role in Polyglot C1")
    parser.add_argument("--email", required=True, help="Email of the registered user to promote to admin")
    parser.add_argument("--dry-run", action="store_true", help="Preview the bootstrap without writing changes")
    return parser.parse_args()


def rest_request(
    supabase_url: str,
    service_role_key: str,
    endpoint: str,
    method: str = "GET",
    data: dict | list | None = None,
    params: dict | None = None,
) -> list | dict | None:
    url = f"{supabase_url.rstrip('/')}/rest/v1/{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)

    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        "User-Agent": "PolyglotC1-AdminBootstrap/1.0",
    }
    payload_bytes = json.dumps(data).encode("utf-8") if data is not None else None
    req = Request(url, data=payload_bytes, headers=headers, method=method)

    try:
        with urlopen(req, timeout=10.0) as resp:
            text = resp.read().decode("utf-8")
            return json.loads(text) if text else []
    except HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        logger.error(f"HTTP {e.code} error on {endpoint}: {err_msg}")
        return None
    except (URLError, TimeoutError) as e:
        logger.error(f"Network error on {endpoint}: {e}")
        return None


def bootstrap_admin(email: str, dry_run: bool = False) -> int:
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not supabase_url or not service_role_key:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.")
        return 1

    logger.info(f"Looking up user profile with email: {email}")
    profiles = rest_request(
        supabase_url,
        service_role_key,
        "user_profiles",
        method="GET",
        params={"email": f"eq.{email}", "select": "id,auth_user_id,email,full_name"},
    )

    if not profiles or not isinstance(profiles, list) or len(profiles) == 0:
        logger.error(f"No user found with email '{email}'. The user must register an account first.")
        return 1

    user = profiles[0]
    auth_user_id = user.get("auth_user_id") or user.get("id")
    logger.info(f"Found user: {user.get('full_name')} (auth_user_id: {auth_user_id})")

    if dry_run:
        logger.info(f"[DRY RUN] Would assign role 'admin' to user {auth_user_id} in table 'user_roles'.")
        return 0

    # 1. Upsert admin role into user_roles table
    upsert_role_payload = {
        "user_id": auth_user_id,
        "role": "admin",
    }
    role_resp = rest_request(
        supabase_url,
        service_role_key,
        "user_roles",
        method="POST",
        data=upsert_role_payload,
        params={"on_conflict": "user_id"},
    )

    if role_resp is None:
        logger.error("Failed to assign admin role in user_roles table.")
        return 1

    logger.info(f"Successfully assigned role 'admin' to {email}.")

    # 2. Record audit log
    audit_payload = {
        "admin_id": auth_user_id,
        "action": "bootstrap_initial_admin",
        "target_user_id": auth_user_id,
        "details": {"bootstrapped_email": email, "mechanism": "bootstrap_admin.py"},
    }
    rest_request(
        supabase_url,
        service_role_key,
        "admin_audit_logs",
        method="POST",
        data=audit_payload,
    )
    logger.info("Recorded bootstrap action in admin_audit_logs.")
    return 0


if __name__ == "__main__":
    args = parse_args()
    code = bootstrap_admin(args.email, args.dry_run)
    sys.exit(code)
