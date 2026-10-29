"""Spaced Repetition Scheduler managing review queues and mastery progression."""

from typing import List, Dict, Optional
from datetime import date
from engine.models.enums import Language, ReviewGrade, MasteryStatus
from engine.models.progress import SRSItemState, UserTrackState
from engine.srs.sm2 import SM2Calculator


class SRSScheduler:
    """Coordinates SuperMemo SM-2 reviews, daily review queues, and mastery synchronization."""

    @classmethod
    def get_due_items(
        cls,
        items: List[SRSItemState],
        target_date: date,
        language: Optional[Language] = None,
        max_items: int = 15,
    ) -> List[SRSItemState]:
        """Returns items due for review on or before target_date, ordered by priority."""
        due: List[SRSItemState] = []
        for item in items:
            if language and item.language != language:
                continue
            if item.next_review_date <= target_date:
                due.append(item)

        # Prioritize: (1) oldest overdue items, (2) lowest ease factors
        due.sort(key=lambda x: (x.next_review_date, x.ease_factor))
        return due[:max_items]

    @classmethod
    def create_initial_state(
        cls,
        vocabulary_item_id: str,
        language: Language,
        presentation_date: date,
        track_state: Optional[UserTrackState] = None,
    ) -> SRSItemState:
        """Initializes a vocabulary item that has been presented to the learner."""
        if track_state and vocabulary_item_id not in track_state.presented_vocabulary_ids:
            track_state.presented_vocabulary_ids.append(vocabulary_item_id)

        return SRSItemState(
            vocabulary_item_id=vocabulary_item_id,
            language=language,
            repetition_count=0,
            ease_factor=SM2Calculator.DEFAULT_EASE_FACTOR,
            interval_days=1,
            next_review_date=presentation_date,
            mastery_status=MasteryStatus.PRESENTED,
        )

    @classmethod
    def process_review(
        cls,
        current_state: SRSItemState,
        grade: ReviewGrade,
        review_date: date,
        track_state: Optional[UserTrackState] = None,
    ) -> SRSItemState:
        """Processes an SM-2 recall rating and synchronizes user track mastery lists."""
        updated_state = SM2Calculator.calculate_next_state(
            current_state=current_state,
            grade=grade,
            review_date=review_date,
        )

        if track_state:
            item_id = current_state.vocabulary_item_id
            if updated_state.mastery_status == MasteryStatus.MASTERED:
                if item_id not in track_state.mastered_vocabulary_ids:
                    track_state.mastered_vocabulary_ids.append(item_id)
            else:
                # If it lapsed from mastered, remove it from mastered list
                if item_id in track_state.mastered_vocabulary_ids:
                    track_state.mastered_vocabulary_ids.remove(item_id)

        return updated_state
