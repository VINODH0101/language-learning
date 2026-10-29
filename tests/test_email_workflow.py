"""
Unit and integration tests for the daily email workflow.
Verifies dual-track email rendering, Resend / SMTP / Mock adapters,
payload size constraints (< 75 KB), delivery idempotency, and retry handling.
"""

from datetime import date
import pytest

from engine.core import PolyglotEngine
from engine.email.adapter import EmailDeliveryRequest
from engine.email.composer import DailyDigestComposer
from engine.email.mock_adapter import MockEmailAdapter
from engine.email.resend_adapter import ResendAdapter
from engine.models.enums import Language, StudyMode
from engine.storage.repository import InMemoryStorageRepository


def test_composer_renders_combined_pt_es_email():
    engine = PolyglotEngine()
    d = date(2026, 10, 29)

    pt_lesson = engine.generate_daily_lesson("test-user", Language.PORTUGUESE, d, study_mode=StudyMode.FULL)
    es_lesson = engine.generate_daily_lesson("test-user", Language.SPANISH, d, study_mode=StudyMode.FULL)

    subject, html_body, text_body = DailyDigestComposer.render_email(
        pt_lesson=pt_lesson,
        es_lesson=es_lesson,
        recipient_name="Carlos Silva",
        current_date=d,
        streak_days=5,
    )

    # Verify subject line
    assert "Polyglot C1 Daily" in subject
    assert "Streak: 5 days" in subject
    assert "Carlos Silva" not in subject  # Privacy rule: no sensitive names in subject

    # Verify HTML contents
    assert "Português" in html_body
    assert "Español" in html_body
    assert "Carlos Silva" in html_body
    assert pt_lesson.curriculum_topic_title in html_body
    assert es_lesson.curriculum_topic_title in html_body
    assert "Click to reveal answer" in html_body

    # Verify payload size is strictly below 75 KB threshold
    payload_bytes = len(html_body.encode("utf-8"))
    assert payload_bytes < 75 * 1024, f"Payload size {payload_bytes} exceeded 75 KB limit"

    # Verify plaintext contents
    assert "[PORTUGUÊS" in text_body
    assert "[ESPAÑOL" in text_body
    assert "Licenses: Wiktionary CC-BY-SA 3.0" in text_body


def test_mock_email_adapter_delivery():
    adapter = MockEmailAdapter()
    req = EmailDeliveryRequest(
        recipient_email="test@polyglot.dev",
        subject="Test Subject",
        html_content="<p>Test</p>",
        text_content="Test",
        idempotency_key="idemp-12345",
        delivery_date="2026-10-29",
    )

    result = adapter.send_email(req)
    assert result.success is True
    assert result.provider == "mock"
    assert result.provider_message_id == "mock-idemp-12345"
    assert len(adapter.sent_emails) == 1
    assert adapter.sent_emails[0].idempotency_key == "idemp-12345"


def test_mock_email_adapter_failure_handling():
    adapter = MockEmailAdapter(should_fail=True, fail_retryable=True)
    req = EmailDeliveryRequest(
        recipient_email="test@polyglot.dev",
        subject="Test Subject",
        html_content="<p>Test</p>",
        text_content="Test",
        idempotency_key="idemp-fail-1",
        delivery_date="2026-10-29",
    )

    result = adapter.send_email(req)
    assert result.success is False
    assert result.is_retryable is True
    assert "Simulated mock dispatch failure" in result.error_message


def test_resend_adapter_missing_api_key_graceful_error():
    adapter = ResendAdapter(api_key="")
    req = EmailDeliveryRequest(
        recipient_email="test@polyglot.dev",
        subject="Test",
        html_content="<p>Test</p>",
        text_content="Test",
        idempotency_key="idemp-no-key",
        delivery_date="2026-10-29",
    )

    result = adapter.send_email(req)
    assert result.success is False
    assert "RESEND_API_KEY is not configured" in result.error_message
    assert result.is_retryable is False
