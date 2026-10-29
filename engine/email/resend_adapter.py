"""
Polyglot C1 Daily — Resend Transactional Email Provider Adapter.

Integrates Resend HTTP API (https://api.resend.com/emails) with
Idempotency-Key header support and polite retry handling.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .adapter import EmailDeliveryRequest, EmailDeliveryResult, EmailProviderAdapter

logger = logging.getLogger(__name__)


class ResendAdapter(EmailProviderAdapter):
    """
    Adapter for Resend transactional email API.
    Enforces idempotency, backoff, and quota awareness.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_sender: Optional[str] = None,
        timeout_seconds: float = 10.0,
        max_retries: int = 3,
    ):
        self.api_key = api_key or os.environ.get("RESEND_API_KEY", "")
        self.default_sender = (
            default_sender
            or os.environ.get("EMAIL_FROM_ADDRESS")
            or "Polyglot C1 Daily <onboarding@resend.dev>"
        )
        self.timeout = timeout_seconds
        self.max_retries = max_retries

    def send_email(self, request: EmailDeliveryRequest) -> EmailDeliveryResult:
        if not self.api_key:
            return EmailDeliveryResult(
                success=False,
                provider="resend",
                error_message="RESEND_API_KEY is not configured.",
                is_retryable=False,
            )

        sender = request.sender_email or self.default_sender
        payload = {
            "from": sender,
            "to": [request.recipient_email],
            "subject": request.subject,
            "html": request.html_content,
            "text": request.text_content,
            "headers": {
                "Idempotency-Key": request.idempotency_key,
                "X-Entity-Ref-ID": request.idempotency_key,
            },
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        api_url = "https://api.resend.com/emails"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "PolyglotC1Daily-DeliveryEngine/1.0",
        }

        for attempt in range(1, self.max_retries + 1):
            req = Request(api_url, data=data_bytes, headers=headers, method="POST")
            try:
                with urlopen(req, timeout=self.timeout) as resp:
                    resp_body = resp.read().decode("utf-8")
                    parsed = json.loads(resp_body) if resp_body else {}
                    message_id = parsed.get("id", "resend_msg_accepted")
                    return EmailDeliveryResult(
                        success=True,
                        provider="resend",
                        provider_message_id=message_id,
                    )
            except HTTPError as e:
                error_body = ""
                try:
                    error_body = e.read().decode("utf-8")
                except Exception:
                    pass

                # 429 Too Many Requests -> retryable with backoff
                if e.code == 429:
                    retry_after = float(e.headers.get("Retry-After", 2 ** attempt))
                    logger.warning(f"Resend rate limit (429). Retrying after {retry_after}s.")
                    time.sleep(retry_after)
                    continue

                # 5xx Server Errors -> retryable
                if 500 <= e.code <= 599:
                    logger.warning(f"Resend server error ({e.code}). Attempt {attempt}/{self.max_retries}.")
                    if attempt < self.max_retries:
                        time.sleep(1.0 * (2 ** (attempt - 1)))
                        continue
                    return EmailDeliveryResult(
                        success=False,
                        provider="resend",
                        error_message=f"HTTP {e.code}: {error_body}",
                        is_retryable=True,
                    )

                # 4xx Client Errors (e.g. 401 unauthorized, 422 unverified sender/recipient)
                return EmailDeliveryResult(
                    success=False,
                    provider="resend",
                    error_message=f"HTTP {e.code} Client Error: {error_body}",
                    is_retryable=False,
                )
            except (URLError, TimeoutError) as e:
                logger.warning(f"Network error contacting Resend ({e}). Attempt {attempt}/{self.max_retries}.")
                if attempt < self.max_retries:
                    time.sleep(1.0 * (2 ** (attempt - 1)))
                    continue
                return EmailDeliveryResult(
                    success=False,
                    provider="resend",
                    error_message=f"Network error: {str(e)}",
                    is_retryable=True,
                )

        return EmailDeliveryResult(
            success=False,
            provider="resend",
            error_message="Exceeded max delivery retries without response.",
            is_retryable=True,
        )
