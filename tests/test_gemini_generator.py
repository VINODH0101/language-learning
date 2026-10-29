"""Unit tests for GeminiLessonGenerator and its deterministic fallback."""

import pytest
from engine.models.enums import Language, CEFRLevel
from engine.generators.gemini_generator import GeminiLessonGenerator


def test_gemini_generator_initialization_without_key():
    gen = GeminiLessonGenerator(api_key=None)
    assert not gen.is_configured
    assert gen.api_key is None


def test_gemini_generator_fallback_dialogue_pt():
    gen = GeminiLessonGenerator(api_key=None)
    dialogue = gen.generate_dialogue(Language.PORTUGUESE, CEFRLevel.C1, "trabalho")
    assert dialogue["title"].startswith("Conversação Prática")
    assert len(dialogue["lines"]) >= 2
    assert "Ana" in dialogue["lines"][0]["speaker"]


def test_gemini_generator_fallback_dialogue_es():
    gen = GeminiLessonGenerator(api_key=None)
    dialogue = gen.generate_dialogue(Language.SPANISH, CEFRLevel.B2, "viaje")
    assert dialogue["title"].startswith("Conversación Práctica")
    assert len(dialogue["lines"]) >= 2
    assert "Elena" in dialogue["lines"][0]["speaker"]


def test_gemini_generator_fallback_dialogue_en():
    gen = GeminiLessonGenerator(api_key=None)
    dialogue = gen.generate_dialogue(Language.ENGLISH, CEFRLevel.C1, "business")
    assert dialogue["title"].startswith("Practical Conversation")
    assert len(dialogue["lines"]) >= 2
    assert "Sarah" in dialogue["lines"][0]["speaker"]
    assert "text_pt" in dialogue["lines"][0]
    assert "text_es" in dialogue["lines"][0]
