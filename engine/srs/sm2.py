"""SuperMemo SM-2 algorithm implementation with explicit mastery status progression."""

from datetime import date, datetime, timedelta
from typing import Tuple, Dict, Any
from engine.models.enums import ReviewGrade, MasteryStatus
from engine.models.progress import SRSItemState


class SM2Calculator:
    """SuperMemo SM-2 Spaced Repetition calculation logic.
    
    Distinguishes:
    - PRESENTED: Item introduced to learner, repetition_count = 0.
    - LEARNING: Item practiced 1-2 times with short intervals.
    - REVIEWING: Item in active spaced intervals (3-4 successful repetitions).
    - MASTERED: Item demonstrated stable long-term retention (>= 5 successful repetitions
      and interval >= 21 days).
    """

    MIN_EASE_FACTOR: float = 1.30
    DEFAULT_EASE_FACTOR: float = 2.50
    MASTERED_REPETITION_THRESHOLD: int = 5
    MASTERED_INTERVAL_DAYS_THRESHOLD: int = 21

    @classmethod
    def calculate_next_state(
        cls,
        current_state: SRSItemState,
        grade: ReviewGrade,
        review_date: date,
    ) -> SRSItemState:
        """Calculates next interval, ease factor, repetition count, and mastery status."""
        q = int(grade)
        rep = current_state.repetition_count
        ef = current_state.ease_factor
        interval = current_state.interval_days
        lapses = current_state.lapse_count

        is_same_day = False
        if current_state.last_reviewed_at is not None:
            last_date = (
                current_state.last_reviewed_at.date()
                if isinstance(current_state.last_reviewed_at, datetime)
                else current_state.last_reviewed_at
            )
            is_same_day = (last_date == review_date)

        if is_same_day and q >= 3 and rep > 0:
            # Idempotency guard: Preserve repetition count and scheduled interval on same calendar day
            new_rep = rep
            new_interval = interval
            new_lapses = lapses
            new_status = current_state.mastery_status
        elif q < 3:
            # Failed recall (lapse)
            new_rep = 0
            new_interval = 1
            new_lapses = lapses + 1 if (rep > 0 or not is_same_day) else lapses
            new_status = MasteryStatus.LEARNING
        else:
            # Successful recall on a new calendar day
            if rep == 0:
                new_interval = 1
            elif rep == 1:
                new_interval = 6
            else:
                new_interval = max(1, round(interval * ef))
            new_rep = rep + 1
            new_lapses = lapses

            # Determine progressive mastery status
            if new_rep >= cls.MASTERED_REPETITION_THRESHOLD and new_interval >= cls.MASTERED_INTERVAL_DAYS_THRESHOLD:
                new_status = MasteryStatus.MASTERED
            elif new_rep >= 3:
                new_status = MasteryStatus.REVIEWING
            else:
                new_status = MasteryStatus.LEARNING

        # Calculate new ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ef = max(cls.MIN_EASE_FACTOR, round(new_ef, 2))

        next_date = review_date + timedelta(days=new_interval)

        history_entry: Dict[str, Any] = {
            "review_date": review_date.isoformat(),
            "grade": q,
            "interval_days": new_interval,
            "ease_factor": new_ef,
            "repetition": new_rep,
        }

        updated_history = list(current_state.history)
        if (
            is_same_day
            and updated_history
            and updated_history[-1].get("review_date") == review_date.isoformat()
        ):
            updated_history[-1] = history_entry
        else:
            updated_history.append(history_entry)

        return SRSItemState(
            vocabulary_item_id=current_state.vocabulary_item_id,
            language=current_state.language,
            repetition_count=new_rep,
            ease_factor=new_ef,
            interval_days=new_interval,
            next_review_date=next_date,
            last_reviewed_at=review_date,
            lapse_count=new_lapses,
            mastery_status=new_status,
            history=updated_history,
        )
