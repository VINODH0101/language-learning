"""Unit tests for GeminiLessonGenerator, model discovery, and its deterministic fallback."""

from __future__ import annotations

import io
import json
import os
import urllib.error
from unittest.mock import MagicMock, patch

import pytest
from engine.generators.gemini_generator import GeminiLessonGenerator, DEFAULT_GEMINI_MODEL
from engine.models.enums import CEFRLevel, Language


def _make_http_response(status_code: int, data: dict):
    """Helper to mock urllib.request.urlopen context manager."""
    payload = json.dumps(data).encode("utf-8")
    mock_resp = MagicMock()
    mock_resp.status = status_code
    mock_resp.read.return_value = payload
    mock_resp.__enter__.return_value = mock_resp
    mock_resp.__exit__.return_value = None
    return mock_resp


# ------------------------------------------------------------------------------
# 1. Initialization and Configuration Tests
# ------------------------------------------------------------------------------

def test_gemini_generator_initialization_without_key():
    gen = GeminiLessonGenerator(api_key=None)
    assert not gen.is_configured
    assert gen.api_key is None
    assert gen.model == DEFAULT_GEMINI_MODEL


def test_gemini_generator_model_configuration():
    gen = GeminiLessonGenerator(api_key="test-key", model="gemini-2.0-flash")
    assert gen.is_configured
    assert gen.model == "gemini-2.0-flash"


def test_gemini_generator_model_normalization():
    # Canonicalizes "models/gemini-1.5-pro" by stripping "models/" prefix
    gen = GeminiLessonGenerator(api_key="test-key", model="models/gemini-1.5-pro")
    assert gen.model == "gemini-1.5-pro"


# ------------------------------------------------------------------------------
# 2. Deterministic Fallback Tests (PT, ES, EN)
# ------------------------------------------------------------------------------

def test_gemini_generator_fallback_dialogue_pt():
    gen = GeminiLessonGenerator(api_key=None)
    dialogue = gen.generate_dialogue(Language.PORTUGUESE, CEFRLevel.C1, "trabalho")
    assert dialogue["title"].startswith("Conversação Prática")
    assert dialogue["provider"] == "deterministic-template"
    assert len(dialogue["lines"]) >= 2
    assert "Ana" in dialogue["lines"][0]["speaker"]


def test_gemini_generator_fallback_dialogue_es():
    gen = GeminiLessonGenerator(api_key=None)
    dialogue = gen.generate_dialogue(Language.SPANISH, CEFRLevel.B2, "viaje")
    assert dialogue["title"].startswith("Conversación Práctica")
    assert dialogue["provider"] == "deterministic-template"
    assert len(dialogue["lines"]) >= 2
    assert "Elena" in dialogue["lines"][0]["speaker"]


def test_gemini_generator_fallback_dialogue_en():
    gen = GeminiLessonGenerator(api_key=None)
    dialogue = gen.generate_dialogue(Language.ENGLISH, CEFRLevel.C1, "business")
    assert dialogue["title"].startswith("Practical Conversation")
    assert dialogue["provider"] == "deterministic-template"
    assert len(dialogue["lines"]) >= 2
    assert "Sarah" in dialogue["lines"][0]["speaker"]
    assert "text_pt" in dialogue["lines"][0]
    assert "text_es" in dialogue["lines"][0]


# ------------------------------------------------------------------------------
# 3. Successful Generation (Mocked)
# ------------------------------------------------------------------------------

def test_gemini_generator_successful_generation_mocked():
    gen = GeminiLessonGenerator(api_key="fake-key-123", model="gemini-1.5-flash")
    mock_dialogue_json = {
        "title": "Negócios Sustentáveis",
        "scenario": "Discussão sobre transição energética.",
        "lines": [
            {
                "speaker": "Sofia",
                "text_target": "Precisamos descarbonizar a cadeia de suprimentos.",
                "text_en": "We need to decarbonize the supply chain.",
                "audio_tip": "Ênfase em descarbonizar",
            },
            {
                "speaker": "Mateus",
                "text_target": "Concordo plenamente com essa diretriz.",
                "text_en": "I fully agree with that directive.",
                "audio_tip": "Tom formal e resoluto",
            },
        ],
    }
    api_response = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": json.dumps(mock_dialogue_json)}],
                }
            }
        ]
    }

    with patch("urllib.request.urlopen", return_value=_make_http_response(200, api_response)):
        result = gen.generate_dialogue(Language.PORTUGUESE, CEFRLevel.C1, "sustentabilidade")
        assert result["title"] == "Negócios Sustentáveis"
        assert result["provider"] == "gemini"
        assert result["model"] == "gemini-1.5-flash"
        assert len(result["lines"]) == 2
        assert result["lines"][0]["speaker"] == "Sofia"


# ------------------------------------------------------------------------------
# 4. Error Handling and Graceful Fallback
# ------------------------------------------------------------------------------

def test_gemini_generator_invalid_json_fallback():
    gen = GeminiLessonGenerator(api_key="fake-key-123")
    api_response = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "THIS IS NOT JSON CONTENT"}],
                }
            }
        ]
    }
    with patch("urllib.request.urlopen", return_value=_make_http_response(200, api_response)):
        result = gen.generate_dialogue(Language.PORTUGUESE, CEFRLevel.C1, "energia")
        assert result["provider"] == "deterministic-template"
        assert result["title"].startswith("Conversação Prática")


def test_gemini_generator_empty_candidate_fallback():
    gen = GeminiLessonGenerator(api_key="fake-key-123")
    api_response = {"candidates": []}
    with patch("urllib.request.urlopen", return_value=_make_http_response(200, api_response)):
        result = gen.generate_dialogue(Language.SPANISH, CEFRLevel.B2, "arte")
        assert result["provider"] == "deterministic-template"


def test_gemini_generator_http_403_auth_error_fallback():
    gen = GeminiLessonGenerator(api_key="invalid-key")
    err = urllib.error.HTTPError(
        url="https://generativelanguage.googleapis.com",
        code=403,
        msg="Forbidden",
        hdrs={},
        fp=io.BytesIO(b'{"error": {"message": "API key not valid"}}'),
    )
    with patch("urllib.request.urlopen", side_effect=err):
        result = gen.generate_dialogue(Language.PORTUGUESE, CEFRLevel.C1, "economia")
        assert result["provider"] == "deterministic-template"


def test_gemini_generator_http_404_model_not_found_fallback():
    gen = GeminiLessonGenerator(api_key="key", model="non-existent-model")
    err = urllib.error.HTTPError(
        url="https://generativelanguage.googleapis.com",
        code=404,
        msg="Not Found",
        hdrs={},
        fp=io.BytesIO(b'{"error": {"message": "models/non-existent-model is not found"}}'),
    )
    with patch("urllib.request.urlopen", side_effect=err):
        result = gen.generate_dialogue(Language.SPANISH, CEFRLevel.C1, "politica")
        assert result["provider"] == "deterministic-template"


def test_gemini_generator_http_429_quota_error_fallback():
    gen = GeminiLessonGenerator(api_key="key")
    err = urllib.error.HTTPError(
        url="https://generativelanguage.googleapis.com",
        code=429,
        msg="Too Many Requests",
        hdrs={},
        fp=io.BytesIO(b'{"error": {"message": "Resource exhausted"}}'),
    )
    with patch("urllib.request.urlopen", side_effect=err):
        result = gen.generate_dialogue(Language.PORTUGUESE, CEFRLevel.C1, "saude")
        assert result["provider"] == "deterministic-template"


def test_gemini_generator_network_timeout_fallback():
    gen = GeminiLessonGenerator(api_key="key", max_retries=0)
    with patch("urllib.request.urlopen", side_effect=TimeoutError("Request timed out")):
        result = gen.generate_dialogue(Language.ENGLISH, CEFRLevel.C1, "trade")
        assert result["provider"] == "deterministic-template"


# ------------------------------------------------------------------------------
# 5. Live Generation Verification Method (verify_generation)
# ------------------------------------------------------------------------------

def test_gemini_verify_generation_success_mocked():
    gen = GeminiLessonGenerator(api_key="key", model="gemini-1.5-flash")
    api_response = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Olá! Tudo bem?"}],
                }
            }
        ]
    }
    with patch("urllib.request.urlopen", return_value=_make_http_response(200, api_response)):
        res = gen.verify_generation()
        assert res["success"] is True
        assert res["text"] == "Olá! Tudo bem?"
        assert res["model"] == "gemini-1.5-flash"


def test_gemini_verify_generation_http_errors_categorization():
    gen = GeminiLessonGenerator(api_key="key", model="gemini-1.5-flash")

    # 403 Forbidden -> AUTH_ERROR
    err403 = urllib.error.HTTPError("url", 403, "Forbidden", {}, io.BytesIO(b""))
    with patch("urllib.request.urlopen", side_effect=err403):
        res = gen.verify_generation()
        assert res["success"] is False
        assert res["category"] == "AUTH_ERROR"

    # 404 Not Found -> MODEL_NOT_FOUND
    err404 = urllib.error.HTTPError("url", 404, "Not Found", {}, io.BytesIO(b""))
    with patch("urllib.request.urlopen", side_effect=err404):
        res = gen.verify_generation()
        assert res["success"] is False
        assert res["category"] == "MODEL_NOT_FOUND"

    # 429 Too Many Requests -> QUOTA_EXHAUSTED
    err429 = urllib.error.HTTPError("url", 429, "Too Many Requests", {}, io.BytesIO(b""))
    with patch("urllib.request.urlopen", side_effect=err429):
        res = gen.verify_generation()
        assert res["success"] is False
        assert res["category"] == "QUOTA_EXHAUSTED"


# ------------------------------------------------------------------------------
# 6. Model Discovery Filtering and Compatibility
# ------------------------------------------------------------------------------

def test_model_discovery_filtering_generate_content():
    sample_models = [
        {
            "name": "models/gemini-1.5-flash",
            "supportedGenerationMethods": ["generateContent", "countTokens"],
        },
        {
            "name": "models/gemini-1.5-pro",
            "supportedGenerationMethods": ["generateContent"],
        },
        {
            "name": "models/text-embedding-004",
            "supportedGenerationMethods": ["embedContent"],
        },
    ]

    content_models = [
        m for m in sample_models
        if "generateContent" in m.get("supportedGenerationMethods", [])
    ]
    content_names = [m["name"].replace("models/", "") for m in content_models]

    assert "gemini-1.5-flash" in content_names
    assert "gemini-1.5-pro" in content_names
    assert "text-embedding-004" not in content_names


def test_dialogue_structure_contract_compatibility():
    gen = GeminiLessonGenerator(api_key=None)
    for lang in [Language.PORTUGUESE, Language.SPANISH, Language.ENGLISH]:
        dialogue = gen.generate_dialogue(lang, CEFRLevel.C1, "tecnologia")
        assert "title" in dialogue
        assert "scenario" in dialogue
        assert "lines" in dialogue
        assert "provider" in dialogue
        assert isinstance(dialogue["lines"], list)
        assert len(dialogue["lines"]) >= 2
        for line in dialogue["lines"]:
            assert "speaker" in line
            assert "text_target" in line


# ------------------------------------------------------------------------------
# 7. Optional Live Generation Test (Skipped unless explicitly requested)
# ------------------------------------------------------------------------------

@pytest.mark.skipif(
    not os.getenv("GEMINI_API_KEY") or os.getenv("RUN_LIVE_GEMINI_TEST") != "true",
    reason="Requires valid GEMINI_API_KEY and RUN_LIVE_GEMINI_TEST=true environment variable",
)
def test_live_gemini_generation_optional():
    gen = GeminiLessonGenerator()
    res = gen.verify_generation(prompt="Ping live Gemini in 2 words")
    assert res["success"] is True
    assert len(res["text"]) > 0
