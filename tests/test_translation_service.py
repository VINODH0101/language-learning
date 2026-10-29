"""
Unit and integration tests for the Polyglot C1 Daily Translation Architecture.
Verifies provider cascade, verified vs approximate flagging, quota limits,
input length validation, and in-memory LRU caching.
"""

import pytest
from engine.translation import (
    DictionaryTranslationProvider,
    EphemeralQuotaGuard,
    QuotaExceededError,
    TextLengthExceededError,
    TranslationManager,
    TranslationRequest,
)


def test_dictionary_provider_portuguese_to_english():
    provider = DictionaryTranslationProvider()
    req = TranslationRequest(
        source_text="prerrogativa",
        source_lang="pt",
        target_lang="en",
        user_id="test_user",
        is_registered=True,
    )
    res = provider.translate(req)
    assert res is not None
    assert res.translated_text == "prerogative"
    assert res.is_verified is True
    assert res.is_approximate is False
    assert res.provider_name == "dictionary"


def test_dictionary_provider_spanish_to_english():
    provider = DictionaryTranslationProvider()
    req = TranslationRequest(
        source_text="no obstante",
        source_lang="es",
        target_lang="en",
        user_id="test_user",
        is_registered=True,
    )
    res = provider.translate(req)
    assert res is not None
    assert res.translated_text == "nevertheless"
    assert res.is_verified is True


def test_dictionary_provider_false_friends_protection():
    provider = DictionaryTranslationProvider()
    req = TranslationRequest(
        source_text="actually",
        source_lang="en",
        target_lang="pt",
        user_id="test_user",
        is_registered=True,
    )
    res = provider.translate(req)
    assert res is not None
    assert res.translated_text == "na verdade"
    assert "False friend alert" in (res.notes or "")


def test_quota_guard_guest_limit():
    guard = EphemeralQuotaGuard(guest_limit=3, registered_limit=10)
    req = TranslationRequest(
        source_text="comprehend",
        source_lang="en",
        target_lang="pt",
        user_id="guest",
        is_registered=False,
    )

    # 3 allowed requests
    guard.check_and_consume(req)
    guard.check_and_consume(req)
    s = guard.check_and_consume(req)
    assert s.remaining_today == 0

    # 4th request must raise QuotaExceededError
    with pytest.raises(QuotaExceededError) as exc_info:
        guard.check_and_consume(req)
    assert "Limite diário de traduções atingido" in str(exc_info.value)
    assert exc_info.value.retry_after_seconds > 0


def test_quota_guard_max_length_enforcement():
    guard = EphemeralQuotaGuard(max_length=50)
    long_text = "A" * 55
    req = TranslationRequest(
        source_text=long_text,
        source_lang="pt",
        target_lang="en",
        user_id="user1",
        is_registered=True,
    )
    with pytest.raises(TextLengthExceededError) as exc_info:
        guard.check_and_consume(req)
    assert "limite máximo permitido de 50 caracteres" in str(exc_info.value)


def test_translation_manager_caching():
    guard = EphemeralQuotaGuard(guest_limit=10, registered_limit=20)
    manager = TranslationManager(
        providers=[DictionaryTranslationProvider()],
        quota_guard=guard,
        cache_maxsize=10,
    )

    req = TranslationRequest(
        source_text="sensible",
        source_lang="en",
        target_lang="pt",
        user_id="user_cache",
        is_registered=True,
    )

    res1 = manager.translate(req)
    assert res1.from_cache is False
    assert res1.translated_text == "sensato"

    # Second identical request should be served from memory cache
    res2 = manager.translate(req)
    assert res2.from_cache is True
    assert res2.translated_text == "sensato"


def test_translation_manager_fallback():
    class EmptyProvider(DictionaryTranslationProvider):
        def translate(self, req):
            return None

    guard = EphemeralQuotaGuard(guest_limit=10, registered_limit=20)
    manager = TranslationManager(
        providers=[EmptyProvider()],
        quota_guard=guard,
    )

    req = TranslationRequest(
        source_text="UnknownWordXYZ",
        source_lang="en",
        target_lang="pt",
        user_id="user_fb",
        is_registered=True,
    )

    res = manager.translate(req)
    assert res.provider_name == "fallback"
    assert res.is_verified is False
    assert res.is_approximate is True
    assert "Tradução indisponível" in res.translated_text
