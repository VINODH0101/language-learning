"""Storage repository interface and concrete in-memory implementation."""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import date
from engine.models.enums import Language
from engine.models.progress import UserTrackState, SRSItemState, ExerciseAttempt, LessonAssignment
from engine.models.lesson import DailyLessonPayload


class StorageError(Exception):
    """Base exception for storage persistence operations."""
    pass


class StorageConnectionError(StorageError):
    """Network connection or timeout error communicating with storage backend."""
    pass


class StorageAuthenticationError(StorageError):
    """Authentication or authorization failure against storage backend."""
    pass


class StorageSchemaError(StorageError):
    """Table, column, or schema object missing in storage backend."""
    pass


class StorageRepository(ABC):
    """Abstract storage interface decoupling the engine from PostgreSQL / Supabase."""

    @abstractmethod
    def get_user_track_state(self, user_id: str, language: Language) -> Optional[UserTrackState]:
        pass

    @abstractmethod
    def save_user_track_state(self, track_state: UserTrackState) -> None:
        pass

    @abstractmethod
    def get_srs_states(self, user_id: str, language: Optional[Language] = None) -> List[SRSItemState]:
        pass

    @abstractmethod
    def save_srs_state(self, user_id: str, state: SRSItemState) -> None:
        pass

    @abstractmethod
    def save_daily_lesson(self, lesson: DailyLessonPayload) -> None:
        pass

    @abstractmethod
    def get_daily_lesson(self, user_id: str, language: Language, lesson_date: date) -> Optional[DailyLessonPayload]:
        pass

    @abstractmethod
    def save_exercise_attempt(self, user_id: str, attempt: ExerciseAttempt) -> None:
        pass

    @abstractmethod
    def get_exercise_attempts(self, user_id: str, exercise_id: Optional[str] = None) -> List[ExerciseAttempt]:
        pass

    @abstractmethod
    def get_lesson_assignment(self, user_id: str, language: Language, assignment_date: date) -> Optional[LessonAssignment]:
        pass

    @abstractmethod
    def save_lesson_assignment(self, assignment: LessonAssignment) -> None:
        pass

    @abstractmethod
    def get_recent_article_ids(self, user_id: str, language: Language, limit: int = 14) -> List[str]:
        pass


class InMemoryStorageRepository(StorageRepository):
    """In-memory reference implementation for unit testing and local offline runs."""

    def __init__(self):
        # Key: (user_id, language.value)
        self.tracks: Dict[tuple[str, str], UserTrackState] = {}
        # Key: (user_id, vocab_id)
        self.srs_states: Dict[tuple[str, str], SRSItemState] = {}
        # Key: (user_id, language.value, date_str)
        self.lessons: Dict[tuple[str, str, str], DailyLessonPayload] = {}
        # Key: user_id -> List[ExerciseAttempt]
        self.exercise_attempts: Dict[str, List[ExerciseAttempt]] = {}
        # Key: (user_id, language.value, date_str) -> LessonAssignment
        self.assignments: Dict[tuple[str, str, str], LessonAssignment] = {}

    def get_user_track_state(self, user_id: str, language: Language) -> Optional[UserTrackState]:
        return self.tracks.get((user_id, language.value))

    def save_user_track_state(self, track_state: UserTrackState) -> None:
        self.tracks[(track_state.user_id, track_state.language.value)] = track_state

    def get_srs_states(self, user_id: str, language: Optional[Language] = None) -> List[SRSItemState]:
        states = [s for (u, _), s in self.srs_states.items() if u == user_id]
        if language:
            states = [s for s in states if s.language == language]
        return states

    def save_srs_state(self, user_id: str, state: SRSItemState) -> None:
        self.srs_states[(user_id, state.vocabulary_item_id)] = state

    def save_daily_lesson(self, lesson: DailyLessonPayload) -> None:
        key = (lesson.user_id, lesson.language.value, lesson.lesson_date.isoformat())
        self.lessons[key] = lesson

    def get_daily_lesson(self, user_id: str, language: Language, lesson_date: date) -> Optional[DailyLessonPayload]:
        key = (user_id, language.value, lesson_date.isoformat())
        return self.lessons.get(key)

    def save_exercise_attempt(self, user_id: str, attempt: ExerciseAttempt) -> None:
        if user_id not in self.exercise_attempts:
            self.exercise_attempts[user_id] = []
        self.exercise_attempts[user_id].append(attempt)

    def get_exercise_attempts(self, user_id: str, exercise_id: Optional[str] = None) -> List[ExerciseAttempt]:
        attempts = self.exercise_attempts.get(user_id, [])
        if exercise_id:
            attempts = [a for a in attempts if a.exercise_id == exercise_id]
        return attempts

    def get_lesson_assignment(self, user_id: str, language: Language, assignment_date: date) -> Optional[LessonAssignment]:
        key = (user_id, language.value, assignment_date.isoformat())
        return self.assignments.get(key)

    def save_lesson_assignment(self, assignment: LessonAssignment) -> None:
        key = (assignment.user_id, assignment.language.value, assignment.assignment_date.isoformat())
        self.assignments[key] = assignment

    def get_recent_article_ids(self, user_id: str, language: Language, limit: int = 14) -> List[str]:
        matching = [
            a for (u, lang, _), a in self.assignments.items()
            if u == user_id and lang == language.value
        ]
        matching.sort(key=lambda a: a.assignment_date, reverse=True)
        return [a.article_id for a in matching[:limit]]
