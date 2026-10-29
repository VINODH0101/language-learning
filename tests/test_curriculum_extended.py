"""
Extended tests for curriculum progression, objective-based state tracking,
lesson regeneration, fingerprinting, and duplicate prevention.
"""

from datetime import date
import pytest

from engine.core import PolyglotEngine
from engine.models.enums import Language, RegionalVariety, CEFRLevel, StudyMode
from engine.models.progress import UserTrackState


def test_lesson_fingerprint_and_reproducibility():
    engine = PolyglotEngine()
    user_id = "test-learner-fp"
    lesson_date = date(2026, 10, 29)

    lesson1 = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.PORTUGUESE,
        lesson_date=lesson_date,
        study_mode=StudyMode.FULL,
    )

    assert lesson1.content_fingerprint is not None
    assert len(lesson1.content_fingerprint) == 64  # SHA-256 hex string

    # Re-running generator for the same user, language, and date returns the cached lesson
    lesson2 = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.PORTUGUESE,
        lesson_date=lesson_date,
        study_mode=StudyMode.FULL,
    )

    assert lesson2.lesson_id == lesson1.lesson_id
    assert lesson2.content_fingerprint == lesson1.content_fingerprint


def test_deleting_lesson_does_not_reset_progress():
    engine = PolyglotEngine()
    user_id = "test-learner-progress-retention"
    d1 = date(2026, 10, 28)

    # 1. Generate lesson on Day 1
    lesson1 = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.PORTUGUESE,
        lesson_date=d1,
    )
    first_node_id = lesson1.curriculum_node_id

    track_before = engine.storage.get_user_track_state(user_id, Language.PORTUGUESE)
    assert track_before is not None
    assert first_node_id in track_before.completed_curriculum_node_ids
    assert track_before.total_lessons_completed == 1

    # 2. Simulate deleting the regenerable daily lesson (e.g. storage cleanup)
    # The storage repository deletes the lesson payload, but preserves user track progress
    del engine.storage.lessons[(user_id, Language.PORTUGUESE.value, d1.isoformat())]
    assert engine.storage.get_daily_lesson(user_id, Language.PORTUGUESE, d1) is None

    # 3. Verify user track state still retains completed node and streak
    track_after = engine.storage.get_user_track_state(user_id, Language.PORTUGUESE)
    assert track_after is not None
    assert first_node_id in track_after.completed_curriculum_node_ids
    assert track_after.total_lessons_completed == 1

    # 4. On Day 2, learner progresses to the NEXT objective, NOT the deleted one
    d2 = date(2026, 10, 29)
    lesson2 = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.PORTUGUESE,
        lesson_date=d2,
    )

    assert lesson2.curriculum_node_id != first_node_id
    track_day2 = engine.storage.get_user_track_state(user_id, Language.PORTUGUESE)
    assert track_day2.total_lessons_completed == 2
    assert lesson2.curriculum_node_id in track_day2.completed_curriculum_node_ids


def test_objective_based_progression_independent_of_lesson_count():
    engine = PolyglotEngine()
    user_id = "test-objective-driven"

    # User manually placed into B1 via diagnostic or setting
    track = UserTrackState(
        user_id=user_id,
        language=Language.SPANISH,
        regional_variety=RegionalVariety.ES_ES,
        current_cefr_level=CEFRLevel.B1,
        target_cefr_level=CEFRLevel.C1,
        total_lessons_completed=0,  # Zero stored lessons
        completed_curriculum_node_ids=["es-a1-01", "es-a2-01"],
    )
    engine.storage.save_user_track_state(track)

    lesson = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.SPANISH,
        lesson_date=date(2026, 10, 29),
    )

    # Next node must be B1, regardless of total_lessons_completed == 0
    assert lesson.cefr_level == CEFRLevel.B1
    assert lesson.curriculum_node_id == "es-b1-01"


def test_consolidation_review_lesson_marked_properly():
    engine = PolyglotEngine()
    user_id = "test-c1-review"

    # Complete all prior Portuguese nodes up to C1-03
    track = UserTrackState(
        user_id=user_id,
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_BR,
        current_cefr_level=CEFRLevel.C1,
        target_cefr_level=CEFRLevel.C1,
        total_lessons_completed=7,
        completed_curriculum_node_ids=[
            "pt-a1-01", "pt-a2-01", "pt-b1-01", "pt-b2-01",
            "pt-c1-01", "pt-c1-02", "pt-c1-03"
        ],
    )
    engine.storage.save_user_track_state(track)

    lesson = engine.generate_daily_lesson(
        user_id=user_id,
        language=Language.PORTUGUESE,
        lesson_date=date(2026, 10, 29),
    )

    # Should select pt-c1-04 which is marked as consolidation review
    assert lesson.curriculum_node_id == "pt-c1-04"
    assert lesson.is_review_lesson is True
