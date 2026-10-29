"""
Polyglot C1 Daily — Email Provider Adapter Interface and Delivery Models.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class EmailDeliveryRequest(BaseModel):
    """Payload representing an email to be dispatched."""
    recipient_email: str
    recipient_name: str = "Polyglot Learner"
    subject: str
    html_content: str
    text_content: str
    idempotency_key: str
    delivery_date: str
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None


class EmailDeliveryResult(BaseModel):
    """Normalized response from an email provider dispatch attempt."""
    success: bool
    provider: str
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    is_retryable: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EmailProviderAdapter(ABC):
    """Abstract interface for transactional email delivery providers."""

    @abstractmethod
    def send_email(self, request: EmailDeliveryRequest) -> EmailDeliveryResult:
        """Deliver email idempotently or return structured error details."""
        pass
