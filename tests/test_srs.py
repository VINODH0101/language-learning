"""Unit tests for SuperMemo SM-2 spaced repetition and mastery tracking."""

from datetime import date, timedelta
from engine.models.enums import Language, RegionalVariety, ReviewGrade, MasteryStatus
from engine.models.progress import SRSItemState, UserTrackState
from engine.srs.sm2 import SM2Calculator
from engine.srs.scheduler import SRSScheduler


def test_sm2_successful_progression():
    today = date(2026, 10, 29)
    initial = SRSItemState(
        vocabulary_item_id="v1",
        language=Language.PORTUGUESE,
        repetition_count=0,
        ease_factor=2.50,
        interval_days=0,
        next_review_date=today,
        mastery_status=MasteryStatus.PRESENTED,
    )

    # 1st review: Good (4) -> interval 1 day
    s1 = SM2Calculator.calculate_next_state(initial, ReviewGrade.GOOD, today)
    assert s1.repetition_count == 1
    assert s1.interval_days == 1
    assert s1.next_review_date == today + timedelta(days=1)
    assert s1.mastery_status == MasteryStatus.LEARNING

    # 2nd review: Good (4) -> interval 6 days
    s2 = SM2Calculator.calculate_next_state(s1, ReviewGrade.GOOD, s1.next_review_date)
    assert s2.repetition_count == 2
    assert s2.interval_days == 6
    assert s2.mastery_status == MasteryStatus.LEARNING

    # 3rd review: Easy (5) -> interval = round(6 * 2.50) = 15 days, EF increases
    s3 = SM2Calculator.calculate_next_state(s2, ReviewGrade.EASY, s2.next_review_date)
    assert s3.repetition_count == 3
    assert s3.interval_days == 15
    assert s3.ease_factor > 2.50
    assert s3.mastery_status == MasteryStatus.REVIEWING


def test_sm2_mastery_distinction_from_presented():
    today = date(2026, 10, 29)
    track = UserTrackState(
        user_id="u1",
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_BR,
    )

    # Initial state is PRESENTED (Requirement 13)
    state = SRSScheduler.create_initial_state("v1", Language.PORTUGUESE, today, track)
    assert state.mastery_status == MasteryStatus.PRESENTED
    assert "v1" in track.presented_vocabulary_ids
    assert "v1" not in track.mastered_vocabulary_ids

    # Simulate 5 consecutive successful reviews reaching threshold
    current_date = today
    for _ in range(5):
        state = SRSScheduler.process_review(state, ReviewGrade.EASY, current_date, track)
        current_date = state.next_review_date

    # Item should now be MASTERED
    assert state.repetition_count == 5
    assert state.interval_days >= 21
    assert state.mastery_status == MasteryStatus.MASTERED
    assert "v1" in track.mastered_vocabulary_ids


def test_sm2_lapse_reset():
    today = date(2026, 10, 29)
    state = SRSItemState(
        vocabulary_item_id="v1",
        language=Language.SPANISH,
        repetition_count=4,
        ease_factor=2.60,
        interval_days=25,
        next_review_date=today,
        mastery_status=MasteryStatus.REVIEWING,
    )

    # Learner forgets: Grade 1 (INCORRECT)
    lapsed = SM2Calculator.calculate_next_state(state, ReviewGrade.INCORRECT, today)
    assert lapsed.repetition_count == 0
    assert lapsed.interval_days == 1
    assert lapsed.lapse_count == 1
    assert lapsed.mastery_status == MasteryStatus.LEARNING
    assert lapsed.ease_factor < 2.60


def test_sm2_minimum_ease_factor():
    today = date(2026, 10, 29)
    state = SRSItemState(
        vocabulary_item_id="v1",
        language=Language.PORTUGUESE,
        repetition_count=1,
        ease_factor=1.35,
        interval_days=1,
        next_review_date=today,
    )

    # Multiple blackouts must not push ease factor below 1.30
    for _ in range(3):
        state = SM2Calculator.calculate_next_state(state, ReviewGrade.BLACKOUT, today)
    assert state.ease_factor == 1.30
