"""
Lexilume — Content Pipeline Unit & Integration Tests (Phase 7).
"""

import pytest
from engine.content_pipeline import ContentPipeline, PipelineExecutionInput
from engine.models.enums import CEFRLevel, ExplanationLanguage, Language
from engine.models.content_centred import ContentGenre, ContentStatus, RightsStatus


def test_pipeline_execution_english_article():
    pipeline = ContentPipeline()
    sample_text = """
The barista poured the velvety flat white into a warm ceramic cup with gentle precision.
Outside, morning rain tapped rhythmic patterns against the tall Victorian window panes.

Commuters shook their umbrellas near the doorway, greeting the owner with warm familiar smiles.
The rich aroma of freshly roasted Ethiopian beans filled the room, offering comfort from the chilly Dublin breeze.
"""
    inp = PipelineExecutionInput(
        title="A Morning Coffee in Dublin",
        raw_text=sample_text,
        target_language=Language.ENGLISH,
        explanation_language=ExplanationLanguage.PT,
        genre=ContentGenre.CULTURE_AND_TRAVEL,
        declared_cefr=CEFRLevel.B1,
        source_attribution="Authentic narrative",
        rights_status=RightsStatus.PUBLIC_DOMAIN,
    )

    result = pipeline.execute(inp)

    # 1. Item checks
    assert result.item.title == "A Morning Coffee in Dublin"
    assert result.item.slug == "a-morning-coffee-in-dublin"
    assert result.item.target_language == Language.ENGLISH
    assert result.item.explanation_language == ExplanationLanguage.PT
    assert result.item.status == ContentStatus.REVIEW_REQUIRED

    # 2. Version checks
    assert result.version.version_number == 1
    assert result.version.cefr_level == CEFRLevel.B1
    assert result.version.word_count > 40
    assert result.version.sentence_count == 4
    assert not result.version.is_published

    # 3. Payload checks
    payload = result.version.structured_payload
    assert len(payload.paragraphs) == 2
    assert len(payload.paragraphs[0].sentences) == 2
    assert len(payload.annotations) > 0
    assert len(payload.grammar_points) > 0

    # 4. Activities checks
    assert len(result.activities) == 1
    activity = result.activities[0]
    questions = activity.configuration["questions"]
    assert len(questions) >= 2
    for q in questions:
        assert q["stem"]
        assert q["correct_answer"]
        assert q["explanation"]


def test_pipeline_rejects_under_15_words():
    pipeline = ContentPipeline()
    inp = PipelineExecutionInput(
        title="Short Note",
        raw_text="This is too short.",
        target_language=Language.ENGLISH,
    )
    with pytest.raises(ValueError, match="at least 15 words"):
        pipeline.execute(inp)


def test_pipeline_validates_copyright_rights():
    pipeline = ContentPipeline()
    sample_text = """
The barista poured the velvety flat white into a warm ceramic cup with gentle precision.
Outside, morning rain tapped rhythmic patterns against the tall Victorian window panes.
Commuters shook their umbrellas near the doorway, greeting the owner with warm familiar smiles.
"""
    # Restricted rights without fair use confirmation must raise ValueError
    inp_restricted = PipelineExecutionInput(
        title="Restricted Copyright Article",
        raw_text=sample_text,
        target_language=Language.ENGLISH,
        rights_status=RightsStatus.RESTRICTED,
        educational_fair_use_confirmed=False,
    )
    with pytest.raises(ValueError, match="Copyright rights validation failed"):
        pipeline.execute(inp_restricted)

    # Restricted rights WITH fair use confirmation must succeed
    inp_confirmed = PipelineExecutionInput(
        title="Restricted Copyright Article",
        raw_text=sample_text,
        target_language=Language.ENGLISH,
        rights_status=RightsStatus.RESTRICTED,
        educational_fair_use_confirmed=True,
    )
    result = pipeline.execute(inp_confirmed)
    assert result.item.title == "Restricted Copyright Article"
