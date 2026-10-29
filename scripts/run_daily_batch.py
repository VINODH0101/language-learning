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


def run_daily_pipeline(args: argparse.Namespace) -> int:
    logger.info("=" * 60)
    logger.info("Starting Polyglot C1 Daily Scheduled Pipeline")
    logger.info(f"Target Timezone: {args.timezone} | Mode: {'DRY-RUN' if args.dry_run else 'PRODUCTION'}")

    # 1. Determine local calendar date in the learner's schedule timezone
    try:
        tz = ZoneInfo(args.timezone)
        now_local = datetime.now(tz)
    except Exception:
        if args.timezone in ("Asia/Kolkata", "Asia/Calcutta", "IST"):
            from datetime import timedelta
            tz = timezone(timedelta(hours=5, minutes=30))
            now_local = datetime.now(tz)
        else:
            logger.warning(f"Could not load timezone '{args.timezone}'. Using UTC.")
            now_local = datetime.now(timezone.utc)

    target_date = date.fromisoformat(args.date) if args.date else now_local.date()
    target_date_str = target_date.isoformat()
    logger.info(f"Learner ID: {args.user_id} | Target Date: {target_date_str}")

    # Validate recipient email format
    if not validate_email_address(args.recipient_email):
        logger.error(f"Invalid recipient email address format: {args.recipient_email}")
        return 1

    # 2. Check delivery ledger for duplicate prevention
    storage = SupabaseStorageRepository()
    idempotency_key = f"polyglot-{args.user_id}-{target_date_str}-daily_digest"

    existing_delivery = storage.get_email_delivery(args.user_id, target_date_str, purpose="daily_digest")
    if existing_delivery and existing_delivery.get("status") == "sent" and not args.force:
        logger.info(
            f"Idempotency Guard: Email already dispatched for {args.user_id} on {target_date_str} "
            f"(Provider ID: {existing_delivery.get('provider_message_id')}). Exiting safely."
        )
        return 0

    # 3. Initialize engine and generate lessons
    engine = PolyglotEngine(storage=storage)

    logger.info("Generating/retrieving Portuguese daily lesson...")
    pt_lesson = engine.generate_daily_lesson(
        user_id=args.user_id,
        language=Language.PORTUGUESE,
        lesson_date=target_date,
        study_mode=StudyMode.FULL,
    )

    logger.info("Generating/retrieving Spanish daily lesson...")
    es_lesson = engine.generate_daily_lesson(
        user_id=args.user_id,
        language=Language.SPANISH,
        lesson_date=target_date,
        study_mode=StudyMode.FULL,
    )

    # 4. Fetch learner streak
    pt_track = storage.get_user_track_state(args.user_id, Language.PORTUGUESE)
    streak = pt_track.streak_days if pt_track else 1

    # 5. Render dual-track email digest
    logger.info("Rendering responsive HTML and plaintext email templates...")
    subject, html_content, text_content = DailyDigestComposer.render_email(
        pt_lesson=pt_lesson,
        es_lesson=es_lesson,
        recipient_name=args.recipient_name,
        current_date=target_date,
        streak_days=streak,
    )

    payload_size_kb = len(html_content.encode("utf-8")) / 1024.0
    logger.info(f"Rendered HTML payload size: {payload_size_kb:.2f} KB (Target < 75 KB)")

    # 6. Send email via selected provider
    delivery_req = EmailDeliveryRequest(
        recipient_email=args.recipient_email,
        recipient_name=args.recipient_name,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        idempotency_key=idempotency_key,
        delivery_date=target_date_str,
    )

    if args.dry_run:
        logger.info(f"[DRY-RUN] Simulated delivery to {args.recipient_email} with subject: '{subject}'")
        logger.info(f"[DRY-RUN] Idempotency key: {idempotency_key}")
        logger.info("[DRY-RUN] Success. Zero side effects recorded.")
        return 0

    adapter = get_email_adapter(args.provider, dry_run=args.dry_run)
    logger.info(f"Dispatching email via adapter '{args.provider}'...")
    result = adapter.send_email(delivery_req)

    # 7. Record delivery ledger entry
    status = "sent" if result.success else "failed"
    storage.record_email_delivery(
        user_id=args.user_id,
        delivery_date=target_date_str,
        idempotency_key=idempotency_key,
        recipient_email=args.recipient_email,
        subject=subject,
        status=status,
        provider=result.provider,
        provider_message_id=result.provider_message_id,
        last_error=result.error_message,
    )

    if result.success:
        logger.info(f"Successfully delivered daily email! Provider ID: {result.provider_message_id}")
        return 0
    else:
        logger.error(f"Email delivery failed: {result.error_message} (Retryable: {result.is_retryable})")
        return 2 if result.is_retryable else 1


if __name__ == "__main__":
    cli_args = parse_args()
    exit_code = run_daily_pipeline(cli_args)
    sys.exit(exit_code)
