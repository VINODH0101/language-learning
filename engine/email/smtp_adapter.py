"""
Polyglot C1 Daily — Standard Transactional SMTP Email Provider Adapter.

Uses standard Python smtplib with TLS/SSL for zero-cost SMTP relays
(such as Gmail App Password, Brevo SMTP, or local MTA).
"""

from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from .adapter import EmailDeliveryRequest, EmailDeliveryResult, EmailProviderAdapter

logger = logging.getLogger(__name__)


class SmtpAdapter(EmailProviderAdapter):
    """
    Adapter for delivering emails via standard SMTP with STARTTLS.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True,
        timeout_seconds: float = 12.0,
    ):
        self.host = host or os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.port = port or int(os.environ.get("SMTP_PORT", 587))
        self.username = username or os.environ.get("SMTP_USERNAME", "")
        self.password = password or os.environ.get("SMTP_PASSWORD", "")
        self.use_tls = use_tls
        self.timeout = timeout_seconds

    def send_email(self, request: EmailDeliveryRequest) -> EmailDeliveryResult:
        if not self.username or not self.password:
            return EmailDeliveryResult(
                success=False,
                provider="smtp",
                error_message="SMTP_USERNAME or SMTP_PASSWORD is not configured.",
                is_retryable=False,
            )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = request.subject
        msg["From"] = request.sender_email or self.username
        msg["To"] = request.recipient_email
        msg["Message-ID"] = f"<{request.idempotency_key}@{self.host}>"

        part1 = MIMEText(request.text_content, "plain", "utf-8")
        part2 = MIMEText(request.html_content, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        try:
            with smtplib.SMTP(self.host, self.port, timeout=self.timeout) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
                return EmailDeliveryResult(
                    success=True,
                    provider="smtp",
                    provider_message_id=msg["Message-ID"],
                )
        except smtplib.SMTPAuthenticationError as e:
            return EmailDeliveryResult(
                success=False,
                provider="smtp",
                error_message=f"SMTP Authentication Error: {e}",
                is_retryable=False,
            )
        except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError) as e:
            return EmailDeliveryResult(
                success=False,
                provider="smtp",
                error_message=f"SMTP Connection Error: {e}",
                is_retryable=True,
            )
        except Exception as e:
            return EmailDeliveryResult(
                success=False,
                provider="smtp",
                error_message=f"SMTP Dispatch Error: {e}",
                is_retryable=False,
            )
