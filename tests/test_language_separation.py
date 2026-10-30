"""
Unit and integration tests for strict separation of:
- Interface Language
- Target Learning Language
- Explanation Language
- Regional Variety
"""

import pytest
from datetime import date
from pydantic import ValidationError

from engine.models.enums import (
    Language,
    RegionalVariety,
    InterfaceLanguage,
    ExplanationLanguage,
    REGIONAL_VARIETIES_BY_LANGUAGE,
    DEFAULT_REGIONAL_VARIETY,
    is_valid_regional_variety_for_language,
    validate_regional_variety,
)
from engine.models.lesson import DailyLessonPayload
from engine.core import PolyglotEngine


def test_language_enums_and_varieties_exist():
    # Learning Languages - All 13 supported languages
    assert Language.PORTUGUESE == "pt"
    assert Language.SPANISH == "es"
    assert Language.ENGLISH == "en"
    assert Language.FRENCH == "fr"
    assert Language.GERMAN == "de"
    assert Language.ITALIAN == "it"
    assert Language.JAPANESE == "ja"
    assert Language.KOREAN == "ko"
    assert Language.RUSSIAN == "ru"
    assert Language.DUTCH == "nl"
    assert Language.CHINESE == "zh"
    assert Language.TURKISH == "tr"
    assert Language.TAMIL == "ta"

    # Strict invariant: Hindi MUST NOT be included
    all_language_codes = [lang.value for lang in Language]
    assert "hi" not in all_language_codes
    assert "hin" not in all_language_codes
    assert len(all_language_codes) == 13

    # Interface Languages
    assert InterfaceLanguage.EN == "en"
    assert InterfaceLanguage.PT == "pt"
    assert InterfaceLanguage.ES == "es"

    # Explanation Languages
    assert ExplanationLanguage.EN == "en"
    assert ExplanationLanguage.PT == "pt"
    assert ExplanationLanguage.ES == "es"

    # Regional Varieties for English, Portuguese, French, Chinese, Tamil
    assert RegionalVariety.EN_US == "en-US"
    assert RegionalVariety.EN_GB == "en-GB"
    assert RegionalVariety.PT_BR == "pt-BR"
    assert RegionalVariety.PT_PT == "pt-PT"
    assert RegionalVariety.ZH_HANS == "zh-Hans"
    assert RegionalVariety.TA_IN == "ta-IN"


def test_regional_variety_scoping_rules():
    # Portuguese checks
    assert is_valid_regional_variety_for_language(Language.PORTUGUESE, RegionalVariety.PT_BR)
    assert is_valid_regional_variety_for_language(Language.PORTUGUESE, RegionalVariety.PT_PT)
    assert is_valid_regional_variety_for_language(Language.PORTUGUESE, RegionalVariety.ALL)
    assert not is_valid_regional_variety_for_language(Language.PORTUGUESE, RegionalVariety.ES_ES)
    assert not is_valid_regional_variety_for_language(Language.PORTUGUESE, RegionalVariety.EN_US)

    # Spanish checks
    assert is_valid_regional_variety_for_language(Language.SPANISH, RegionalVariety.ES_ES)
    assert is_valid_regional_variety_for_language(Language.SPANISH, RegionalVariety.ES_419)
    assert is_valid_regional_variety_for_language(Language.SPANISH, RegionalVariety.ES_MX)
    assert is_valid_regional_variety_for_language(Language.SPANISH, RegionalVariety.ES_AR)
    assert is_valid_regional_variety_for_language(Language.SPANISH, RegionalVariety.ALL)
    assert not is_valid_regional_variety_for_language(Language.SPANISH, RegionalVariety.PT_BR)
    assert not is_valid_regional_variety_for_language(Language.SPANISH, RegionalVariety.EN_GB)

    # English checks
    assert is_valid_regional_variety_for_language(Language.ENGLISH, RegionalVariety.EN_US)
    assert is_valid_regional_variety_for_language(Language.ENGLISH, RegionalVariety.EN_GB)
    assert is_valid_regional_variety_for_language(Language.ENGLISH, RegionalVariety.ALL)
    assert not is_valid_regional_variety_for_language(Language.ENGLISH, RegionalVariety.PT_BR)
    assert not is_valid_regional_variety_for_language(Language.ENGLISH, RegionalVariety.ES_ES)


def test_validate_regional_variety_fallback():
    # Invalid varieties normalize to default
    assert validate_regional_variety(Language.PORTUGUESE, RegionalVariety.ES_ES) == RegionalVariety.PT_BR
    assert validate_regional_variety(Language.SPANISH, RegionalVariety.PT_BR) == RegionalVariety.ES_ES
    assert validate_regional_variety(Language.ENGLISH, RegionalVariety.PT_PT) == RegionalVariety.EN_US

    # Valid varieties pass through untouched
    assert validate_regional_variety(Language.PORTUGUESE, RegionalVariety.PT_PT) == RegionalVariety.PT_PT
    assert validate_regional_variety(Language.SPANISH, RegionalVariety.ES_419) == RegionalVariety.ES_419
    assert validate_regional_variety(Language.SPANISH, RegionalVariety.ES_AR) == RegionalVariety.ES_AR
    assert validate_regional_variety(Language.ENGLISH, RegionalVariety.EN_GB) == RegionalVariety.EN_GB


def test_lesson_payload_rejects_mismatched_variety(engine_fixture=None):
    engine = PolyglotEngine()
    today = date(2026, 10, 29)

    # Generate a valid base lesson
    valid_lesson = engine.generate_daily_lesson(
        user_id="test_separation_learner",
        language=Language.PORTUGUESE,
        lesson_date=today,
        regional_variety=RegionalVariety.PT_BR,
        explanation_language=ExplanationLanguage.EN,
    )
    assert valid_lesson.language == Language.PORTUGUESE
    assert valid_lesson.regional_variety == RegionalVariety.PT_BR
    assert valid_lesson.explanation_language == ExplanationLanguage.EN

    # Attempting to construct a DailyLessonPayload with mismatched language & variety must raise ValidationError
    payload_dict = valid_lesson.model_dump()
    payload_dict["regional_variety"] = RegionalVariety.ES_ES.value  # Incompatible with Portuguese!

    with pytest.raises(ValidationError) as exc_info:
        DailyLessonPayload(**payload_dict)
    assert "Regional variety 'es-ES' is not valid for target learning language 'pt'" in str(exc_info.value)


def test_lesson_generation_with_custom_explanation_language():
    engine = PolyglotEngine()
    today = date(2026, 11, 15)

    # Portuguese lesson with Spanish explanations
    pt_lesson = engine.generate_daily_lesson(
        user_id="learner_pt_with_es_explanations",
        language=Language.PORTUGUESE,
        lesson_date=today,
        regional_variety=RegionalVariety.PT_PT,
        explanation_language=ExplanationLanguage.ES,
    )
    assert pt_lesson.language == Language.PORTUGUESE
    assert pt_lesson.regional_variety == RegionalVariety.PT_PT
    assert pt_lesson.explanation_language == ExplanationLanguage.ES

    # Spanish lesson with Portuguese explanations
    es_lesson = engine.generate_daily_lesson(
        user_id="learner_es_with_pt_explanations",
        language=Language.SPANISH,
        lesson_date=today,
        regional_variety=RegionalVariety.ES_419,
        explanation_language=ExplanationLanguage.PT,
    )
    assert es_lesson.language == Language.SPANISH
    assert es_lesson.regional_variety == RegionalVariety.ES_419
    assert es_lesson.explanation_language == ExplanationLanguage.PT
