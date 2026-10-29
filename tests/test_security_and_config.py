"""
Tests for security logging filter, credential scrubbing, and input sanitization.
"""

import logging
from engine.security.logging_filter import SensitiveDataScrubber
from engine.security.sanitizer import validate_email_address, sanitize_input_string


def test_sensitive_data_scrubbing():
    scrubber = SensitiveDataScrubber()

    raw_msg = "Attempting connect with api_key: 're_1234567890abcdef12345678' and secret: 'my_super_password'"
    scrubbed = scrubber.scrub_text(raw_msg)
    assert "re_1234567890abcdef12345678" not in scrubbed
    assert "my_super_password" not in scrubbed
    assert "[REDACTED]" in scrubbed or "[REDACTED_RESEND_KEY]" in scrubbed

    jwt_msg = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature123"
    scrubbed_jwt = scrubber.scrub_text(jwt_msg)
    assert "doNotLeakThisSignature123" not in scrubbed_jwt
    assert "[REDACTED_JWT]" in scrubbed_jwt


def test_email_validation():
    assert validate_email_address("learner@polyglot.dev") is True
    assert validate_email_address("user.name+tag@example.com") is True
    assert validate_email_address("not-an-email") is False
    assert validate_email_address("@missinguser.com") is False
    assert validate_email_address("user@") is False
    assert validate_email_address("") is False


def test_input_sanitization():
    raw_html = "<script>alert('xss');</script>Olá mundo"
    sanitized = sanitize_input_string(raw_html)
    assert "<script>" not in sanitized
    assert "&lt;script&gt;" in sanitized
    assert "Olá mundo" in sanitized
