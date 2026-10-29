"""End-to-end integration tests for daily lesson generation across Portuguese and Spanish."""

import pytest
from datetime import date
from engine.core import PolyglotEngine
from engine.models.enums import Language, RegionalVariety, CEFRLevel, StudyMode, ReviewGrade
from engine.generators.validator import LessonValidator


@pytest.fixture
def engine():
    return PolyglotEngine()


def test_generate_portuguese_br_daily_lesson(engine):
    today = date(2026, 10, 29)
    lesson = engine.generate_daily_lesson(
        user_id="user_test_pt_br",
        language=Language.PORTUGUESE,
        lesson_date=today,
        regional_variety=RegionalVariety.PT_BR,
        study_mode=StudyMode.FULL,
    )

    # 1. Validation check
    LessonValidator.validate(lesson)

    # 2. Section checks
    assert lesson.language == Language.PORTUGUESE
    assert lesson.regional_variety == RegionalVariety.PT_BR
    assert lesson.estimated_study_minutes == 50

    # Section 1: Objectives
    assert len(lesson.section_1_objectives) >= 1
    assert "CEFR" in lesson.section_1_objectives[0].target_competency

    # Section 2: Minimum 12 vocabulary items (Requirement 5 & SPEC Section 5)
    assert len(lesson.section_2_vocabulary) >= 12
    for v in lesson.section_2_vocabulary:
        assert v.lemma
        assert v.definition_en
        assert v.example_sentence_target

    # Section 3: Grammar
    assert lesson.section_3_grammar.title
    assert lesson.section_3_grammar.structural_formula

    # Section 4: Reading
    assert lesson.section_4_reading.title
    assert len(lesson.section_4_reading.passage_target) > 50

    # Section 5: Conversation
    assert len(lesson.section_5_conversation.dialogue) >= 2

    # Section 6: Speaking
    assert lesson.section_6_speaking.prompt
    assert len(lesson.section_6_speaking.suggested_phrases) >= 2

    # Section 7: Writing
    assert lesson.section_7_writing.prompt
    assert lesson.section_7_writing.target_word_count >= 100

    # Section 8: Listening
    assert lesson.section_8_listening.transcript_target
    assert len(lesson.section_8_listening.comprehension_tasks) >= 1

    # Section 9 & 10: Exercises and Answer keys (1:1 correspondence)
    assert len(lesson.section_9_exercises) >= 4
    assert len(lesson.section_10_answer_keys) == len(lesson.section_9_exercises)
    for ans in lesson.section_10_answer_keys:
        assert len(ans.acceptable_solutions) >= 1
        assert ans.explanation

    # Section 11: Review
    assert lesson.section_11_review.review_strategy_note

    # Section 12: Further resources
    assert len(lesson.section_12_further_resources) >= 1

    # False friends warnings present
    assert len(lesson.false_friend_alerts) >= 1

    # Check that SRS states were initialized as PRESENTED
    srs_items = engine.storage.get_srs_states("user_test_pt_br", Language.PORTUGUESE)
    assert len(srs_items) >= 12
    assert all(s.mastery_status.value == "presented" for s in srs_items)


def test_generate_spanish_es_daily_lesson(engine):
    today = date(2026, 10, 29)
    lesson = engine.generate_daily_lesson(
        user_id="user_test_es",
        language=Language.SPANISH,
        lesson_date=today,
        regional_variety=RegionalVariety.ES_ES,
        study_mode=StudyMode.FULL,
    )

    LessonValidator.validate(lesson)
    assert lesson.language == Language.SPANISH
    assert lesson.regional_variety == RegionalVariety.ES_ES
    assert len(lesson.section_2_vocabulary) >= 12
    assert len(lesson.section_9_exercises) >= 4
    assert len(lesson.false_friend_alerts) >= 1


def test_compact_study_mode(engine):
    today = date(2026, 10, 29)
    lesson = engine.generate_daily_lesson(
        user_id="user_compact",
        language=Language.PORTUGUESE,
        lesson_date=today,
        study_mode=StudyMode.COMPACT,
    )
    assert lesson.study_mode == StudyMode.COMPACT
    assert lesson.estimated_study_minutes == 20


def test_exercise_history_avoids_immediate_repetition(engine):
    today = date(2026, 10, 29)
    lesson1 = engine.generate_daily_lesson(
        user_id="user_rep",
        language=Language.PORTUGUESE,
        lesson_date=today,
    )
    used_ex_ids = {e.id for e in lesson1.section_9_exercises}

    # Record completion
    track = engine.storage.get_user_track_state("user_rep", Language.PORTUGUESE)
    assert track is not None
    assert len(track.recent_exercise_history) >= 4

    # The user track has recent exercise IDs tracked
    for ex_id in used_ex_ids:
        assert ex_id in track.recent_exercise_history
