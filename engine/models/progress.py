"""Learner progress, spaced repetition state, and tracking models."""

from typing import List, Optional, Dict, Any
from datetime import date, datetime, timezone
from pydantic import BaseModel, Field
from engine.models.enums import Language, RegionalVariety, CEFRLevel, MasteryStatus


class SRSItemState(BaseModel):
    """SuperMemo SM-2 spaced repetition state for an individual vocabulary or grammar item."""
    vocabulary_item_id: str
    language: Language
    repetition_count: int = Field(default=0, ge=0)
    ease_factor: float = Field(default=2.50, ge=1.30, le=3.50)
    interval_days: int = Field(default=0, ge=0)
    next_review_date: date
    last_reviewed_at: Optional[datetime] = None
    lapse_count: int = Field(default=0, ge=0)
    mastery_status: MasteryStatus = Field(default=MasteryStatus.PRESENTED)
    history: List[Dict[str, Any]] = Field(default_factory=list)


class ExerciseAttempt(BaseModel):
    """Record of a learner's answer attempt for an exercise."""
    id: Optional[str] = None
    exercise_id: str
    submitted_answer: str
    is_correct: bool
    feedback: str
    attempt_count: int = Field(default=1, ge=1)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserTrackState(BaseModel):
    """Persistent state for a learner in a specific language track (PT or ES)."""
    user_id: str
    language: Language
    regional_variety: RegionalVariety
    current_cefr_level: CEFRLevel = Field(default=CEFRLevel.A1)
    target_cefr_level: CEFRLevel = Field(default=CEFRLevel.C1)
    current_curriculum_node_id: Optional[str] = None
    streak_days: int = Field(default=0, ge=0)
    total_lessons_completed: int = Field(default=0, ge=0)
    completed_curriculum_node_ids: List[str] = Field(default_factory=list)
    # Explicit separation of presented vs mastered items (Requirement 13)
    presented_vocabulary_ids: List[str] = Field(default_factory=list)
    mastered_vocabulary_ids: List[str] = Field(default_factory=list)
    presented_grammar_rule_ids: List[str] = Field(default_factory=list)
    mastered_grammar_rule_ids: List[str] = Field(default_factory=list)
    # Recency windows to avoid repeating lessons, exercises, and reading articles (Requirement 12)
    recent_node_history: List[str] = Field(default_factory=list, description="Recent curriculum nodes, newest first")
    recent_exercise_history: List[str] = Field(default_factory=list, description="Recent exercise IDs, newest first")
    recent_article_history: List[str] = Field(default_factory=list, description="Recent article IDs or slugs, newest first")
    last_lesson_date: Optional[date] = None


class LessonAssignment(BaseModel):
    """Minimal daily reading assignment record mapped to Supabase lesson_assignments table."""
    id: str
    user_id: str
    language: Language
    assignment_date: date
    article_id: str
    article_title: str
    article_url: str
    revision_id: Optional[str] = None
    cefr_level: CEFRLevel = CEFRLevel.B2
    topic_category: str = "General"
    status: str = "assigned"
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
