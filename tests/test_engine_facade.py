"""End-to-end tests for PolyglotEngine facade methods."""

from datetime import date
from engine.core import PolyglotEngine
from engine.models.enums import Language, RegionalVariety, ReviewGrade
from engine.generators.validator import LessonValidator, LessonValidationError


def test_polyglot_engine_diagnostic_submission():
    engine = PolyglotEngine()
    # Perfect Spanish diagnostic submission
    result = engine.submit_diagnostic(
        user_id="diag_user",
        language=Language.SPANISH,
        answers={
            "diag-es-a1-01": 0,
            "diag-es-a2-01": 0,
            "diag-es-b1-01": 0,
            "diag-es-b2-01": 0,
        },
        regional_variety=RegionalVariety.ES_ES,
    )

    assert result.overall_score_percent == 100.0
    assert result.recommended_cefr_level.value == "C1"
    track = engine.storage.get_user_track_state("diag_user", Language.SPANISH)
    assert track is not None
    assert track.current_cefr_level.value == "C1"


def test_polyglot_engine_exercise_evaluation_and_storage():
    engine = PolyglotEngine()
    template = engine.exercise_pool[0]  # First template

    # Evaluate correct answer
    correct_sol = template.acceptable_solutions[0]
    result = engine.evaluate_exercise("user_ex", template, correct_sol, attempt_number=1)
    assert result.is_correct is True
    assert result.score == 1.0

    # Verify attempt was stored in repository
    attempts = engine.storage.get_exercise_attempts("user_ex", template.id)
    assert len(attempts) == 1
    assert attempts[0].is_correct is True
    assert attempts[0].submitted_answer == correct_sol


def test_polyglot_engine_srs_rating():
    engine = PolyglotEngine()
    vocab = engine.vocabulary_pool[0]

    # Record good rating
    updated = engine.record_srs_rating("user_srs", vocab.id, ReviewGrade.GOOD, review_date=date(2026, 10, 29))
    assert updated.repetition_count == 1
    assert updated.interval_days == 1

    stored = engine.storage.get_srs_states("user_srs", vocab.language)
    assert len(stored) >= 1
    assert any(s.vocabulary_item_id == vocab.id for s in stored)


def test_lesson_validator_under_12_vocabulary_raises_error():
    engine = PolyglotEngine()
    lesson = engine.generate_daily_lesson(
        user_id="user_v_test",
        language=Language.PORTUGUESE,
        lesson_date=date(2026, 10, 29),
    )

    # Artificially truncate vocabulary to 11 items
    lesson.section_2_vocabulary = lesson.section_2_vocabulary[:11]
    import pytest
    with pytest.raises(LessonValidationError) as exc:
        LessonValidator.validate(lesson)
    assert "minimum required is 12" in str(exc.value)
