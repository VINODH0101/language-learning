"""Unit tests for Polyglot C1 Daily core models and enums."""

import pytest
from pydantic import ValidationError
from engine.models.enums import Language, RegionalVariety, CEFRLevel, StudyMode, ReviewGrade, LicenseType
from engine.models.content import Attribution, VocabularyItem, GrammarRule, ExerciseTemplate, DistractorItem


def test_cefr_level_ordering():
    assert CEFRLevel.A1 < CEFRLevel.A2
    assert CEFRLevel.A2 < CEFRLevel.B1
    assert CEFRLevel.B1 < CEFRLevel.B2
    assert CEFRLevel.B2 < CEFRLevel.C1
    assert CEFRLevel.C1 >= CEFRLevel.C1
    assert CEFRLevel.C1 > CEFRLevel.A1


def test_attribution_validation():
    attr = Attribution(
        source_name="Tatoeba",
        source_url="https://tatoeba.org",
        license_type=LicenseType.CC_BY_2_0_FR,
        attribution_text="Credit Tatoeba",
    )
    assert attr.source_name == "Tatoeba"
    assert attr.license_type == LicenseType.CC_BY_2_0_FR


def test_distractor_item():
    distractor = DistractorItem(
        text="cumprir",
        why_incorrect="Falta a desinência pessoal -mos.",
    )
    assert distractor.text == "cumprir"
    assert "Falta" in distractor.why_incorrect
