"""
Polyglot C1 Daily — Transactional Email Delivery Package.
"""

from .adapter import EmailDeliveryRequest, EmailDeliveryResult, EmailProviderAdapter
from .composer import DailyDigestComposer
from .mock_adapter import MockEmailAdapter
from .resend_adapter import ResendAdapter
from .smtp_adapter import SmtpAdapter

__all__ = [
    "EmailDeliveryRequest",
    "EmailDeliveryResult",
    "EmailProviderAdapter",
    "DailyDigestComposer",
    "ResendAdapter",
    "SmtpAdapter",
    "MockEmailAdapter",
]
