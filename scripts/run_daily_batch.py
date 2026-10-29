"""
Polyglot C1 Daily — Scheduled Daily Batch Workflow & Email Automation.

Orchestrates daily lesson retrieval, validation, dual-track email rendering,
and idempotent delivery ledger tracking.

Schedule conversion:
- Configured learner timezone: Asia/Kolkata (IST = UTC+05:30)
- GitHub Actions daily schedule: 04:00 UTC (09:30 IST)
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
from typing import List, Optional

# Ensure project root is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from engine.core import PolyglotEngine
from engine.email.adapter import EmailDeliveryRequest, EmailProviderAdapter
from engine.email.composer import DailyDigestComposer
from engine.email.mock_adapter import MockEmailAdapter
from engine.email.resend_adapter import ResendAdapter
from engine.email.smtp_adapter import SmtpAdapter
from engine.models.enums import Language, RegionalVariety, StudyMode
from engine.security.logging_filter import configure_secure_logging
from engine.security.sanitizer import validate_email_address
from engine.storage.supabase_repository import SupabaseStorageRepository

# Configure secure logging (scrubs tokens and secrets)
configure_secure_logging(logging.INFO)
logger = logging.getLogger("PolyglotBatch")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Polyglot C1 Daily Scheduled Runner")
    parser.add_argument(
        "--user-id",
        type=str,
        default=os.environ.get("POLYGLOT_USER_ID", "default_learner"),
        help="Target learner user ID",
    )
    parser.add_argument(
        "--recipient-email",
        type=str,
        default=os.environ.get("POLYGLOT_RECIPIENT_EMAIL", "learner@polyglot.dev"),
        help="Destination email address for daily digest",
    )
    parser.add_argument(
        "--recipient-name",
        type=str,
        default=os.environ.get("POLYGLOT_RECIPIENT_NAME", "Polyglot Learner"),
        help="Learner display name",
    )
    parser.add_argument(
        "--date",
        type=str,
        default=None,
        help="Target calendar date (YYYY-MM-DD); defaults to current date in schedule timezone",
    )
    parser.add_argument(
        "--timezone",
        type=str,
        default=os.environ.get("POLYGLOT_SCHEDULE_TIMEZONE", "Asia/Kolkata"),
        help="Learner target schedule timezone (default: Asia/Kolkata)",
    )
    parser.add_argument(
        "--provider",
        type=str,
        choices=["resend", "smtp", "mock"],
        default=os.environ.get("EMAIL_PROVIDER", "resend"),
        help="Email delivery provider",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate execution without sending real emails or writing delivery records",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Bypass idempotency lock and force regeneration/resend",
    )
    return parser.parse_args()


def get_email_adapter(provider: str, dry_run: bool = False) -> EmailProviderAdapter:
    if dry_run or provider == "mock":
        return MockEmailAdapter()
    if provider == "resend":
        return ResendAdapter()
    if provider == "smtp":
        return SmtpAdapter()
    return MockEmailAdapter()


def dispatch_for_learner(
    user_id: str,
    recipient_email: str,
    recipient_name: str,
    target_date: date,
    provider: str,
    storage: SupabaseStorageRepository,
    engine: PolyglotEngine,
    dry_run: bool = False,
    force: bool = False,
) -> int:
    target_date_str = target_date.isoformat()
    logger.info(f"Learner ID: {user_id} ({recipient_name}) | Target Date: {target_date_str}")

    # Validate recipient email format
    if not validate_email_address(recipient_email):
        logger.error(f"Invalid recipient email address format: {recipient_email}")
        return 1

    # 1. Check delivery ledger for duplicate prevention
    idempotency_key = f"polyglot-{user_id}-{target_date_str}-daily_digest"

    existing_delivery = storage.get_email_delivery(user_id, target_date_str, purpose="daily_digest")
    if existing_delivery and existing_delivery.get("status") == "sent" and not force:
        logger.info(
            f"Idempotency Guard: Email already dispatched for {user_id} on {target_date_str} "
            f"(Provider ID: {existing_delivery.get('provider_message_id')}). Skipping."
        )
        return 0

    # 2. Generate daily lessons
    logger.info(f"Generating/retrieving Portuguese daily lesson for {user_id}...")
    pt_lesson = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.PORTUGUESE,
        lesson_date=target_date,
        study_mode=StudyMode.FULL,
    )

    logger.info(f"Generating/retrieving Spanish daily lesson for {user_id}...")
    es_lesson = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.SPANISH,
        lesson_date=target_date,
        study_mode=StudyMode.FULL,
    )

    # 3. Fetch learner streak
    pt_track = storage.get_user_track_state(user_id, Language.PORTUGUESE)
    streak = pt_track.streak_days if pt_track else 1

    # 4. Render dual-track email digest
    logger.info("Rendering responsive HTML and plaintext email templates...")
    subject, html_content, text_content = DailyDigestComposer.render_email(
        pt_lesson=pt_lesson,
        es_lesson=es_lesson,
        recipient_name=recipient_name,
        current_date=target_date,
        streak_days=streak,
    )

    payload_size_kb = len(html_content.encode("utf-8")) / 1024.0
    logger.info(f"Rendered HTML payload size: {payload_size_kb:.2f} KB (Target < 75 KB)")

    # 5. Send email via selected provider
    delivery_req = EmailDeliveryRequest(
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        idempotency_key=idempotency_key,
        delivery_date=target_date_str,
    )

    if dry_run:
        logger.info(f"[DRY-RUN] Simulated delivery to {recipient_email} with subject: '{subject}'")
        logger.info(f"[DRY-RUN] Idempotency key: {idempotency_key}")
        logger.info("[DRY-RUN] Success. Zero side effects recorded.")
        return 0

    adapter = get_email_adapter(provider, dry_run=dry_run)
    logger.info(f"Dispatching email via adapter '{provider}' to {recipient_email}...")
    result = adapter.send_email(delivery_req)

    # 6. Record delivery ledger entry
    status = "sent" if result.success else "failed"
    storage.record_email_delivery(
        user_id=user_id,
        delivery_date=target_date_str,
        idempotency_key=idempotency_key,
        recipient_email=recipient_email,
        subject=subject,
        status=status,
        provider=result.provider,
        provider_message_id=result.provider_message_id,
        last_error=result.error_message,
    )

    if result.success:
        logger.info(f"Successfully delivered daily email to {recipient_email}! Provider ID: {result.provider_message_id}")
        return 0
    else:
        logger.error(f"Email delivery failed: {result.error_message} (Retryable: {result.is_retryable})")
        return 2 if result.is_retryable else 1


def run_daily_pipeline(args: argparse.Namespace) -> int:
    logger.info("=" * 60)
    logger.info("Starting Lexilume Scheduled Daily Pipeline")
    logger.info(f"Target Timezone: {args.timezone} | Mode: {'DRY-RUN' if args.dry_run else 'PRODUCTION'}")

    storage = SupabaseStorageRepository()
    engine = PolyglotEngine(storage=storage)

    # Resolve target learners:
    # If user_id is the default placeholder or not set, look up active opted-in learners from Supabase!
    learners = []
    if args.user_id in ("default_learner", "", None) and storage.is_connected:
        db_learners = storage.get_opted_in_learners()
        if db_learners:
            logger.info(f"Discovered {len(db_learners)} active learner(s) in Supabase user_profiles.")
            learners = db_learners

    if not learners:
        # Fallback to single configured learner / CLI / repository secret
        learners = [
            {
                "id": args.user_id,
                "email": args.recipient_email,
                "full_name": args.recipient_name,
                "timezone": args.timezone,
            }
        ]

    failures = 0
    for learner in learners:
        l_user_id = str(learner.get("id") or args.user_id)
        l_email = learner.get("email") or args.recipient_email
        l_name = learner.get("full_name") or args.recipient_name
        l_tz = learner.get("timezone") or args.timezone

        # Determine local calendar date in the learner's schedule timezone
        try:
            tz = ZoneInfo(l_tz)
            now_local = datetime.now(tz)
        except Exception:
            if l_tz in ("Asia/Kolkata", "Asia/Calcutta", "IST"):
                from datetime import timedelta
                tz = timezone(timedelta(hours=5, minutes=30))
                now_local = datetime.now(tz)
            else:
                now_local = datetime.now(timezone.utc)

        target_date = date.fromisoformat(args.date) if args.date else now_local.date()

        res = dispatch_for_learner(
            user_id=l_user_id,
            recipient_email=l_email,
            recipient_name=l_name,
            target_date=target_date,
            provider=args.provider,
            storage=storage,
            engine=engine,
            dry_run=args.dry_run,
            force=args.force,
        )
        if res != 0:
            failures += 1

    return 1 if failures > 0 and failures == len(learners) else 0



if __name__ == "__main__":
    cli_args = parse_args()
    exit_code = run_daily_pipeline(cli_args)
    sys.exit(exit_code)
