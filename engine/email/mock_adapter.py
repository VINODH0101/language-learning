"""
Polyglot C1 Daily — Mock Email Provider Adapter for Tests and Dry-Run.
"""

from __future__ import annotations

from typing import List
from .adapter import EmailDeliveryRequest, EmailDeliveryResult, EmailProviderAdapter


class MockEmailAdapter(EmailProviderAdapter):
    """
    Mock email adapter recording sent requests for testing.
    """

    def __init__(self, should_fail: bool = False, fail_retryable: bool = False):
        self.sent_emails: List[EmailDeliveryRequest] = []
        self.should_fail = should_fail
        self.fail_retryable = fail_retryable

    def send_email(self, request: EmailDeliveryRequest) -> EmailDeliveryResult:
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                provider="mock",
                error_message="Simulated mock dispatch failure.",
                is_retryable=self.fail_retryable,
            )

        self.sent_emails.append(request)
        return EmailDeliveryResult(
            success=True,
            provider="mock",
            provider_message_id=f"mock-{request.idempotency_key}",
        )
