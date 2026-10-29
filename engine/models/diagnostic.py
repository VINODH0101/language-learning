"""Diagnostic placement assessment models."""

from typing import List, Dict, Optional
from datetime import date
from pydantic import BaseModel, Field
from engine.models.enums import Language, CEFRLevel, SkillCategory


class DiagnosticQuestion(BaseModel):
    """Calibrated multiple-choice question to assess learner's CEFR starting level."""
    id: str
    language: Language
    cefr_level: CEFRLevel
    skill: SkillCategory
    prompt: str
    options: List[str] = Field(..., min_length=3, max_length=5)
    correct_option_index: int = Field(..., ge=0)
    explanation: str
    grammatical_focus: str


class DiagnosticSubmission(BaseModel):
    """Learner's submitted answer set for the placement assessment."""
    user_id: str
    language: Language
    answers: Dict[str, int] = Field(..., description="Mapping of question_id -> chosen_option_index")


class DiagnosticResult(BaseModel):
    """Result of diagnostic evaluation recommending starting CEFR level and curriculum node."""
    user_id: str
    language: Language
    recommended_cefr_level: CEFRLevel
    recommended_curriculum_node_id: str
    score_by_level: Dict[str, float] = Field(..., description="Percentage correct per CEFR level")
    overall_score_percent: float
    total_questions: int
    correct_count: int
    diagnostic_date: date
    feedback_summary: str
    strengths: List[str]
    recommended_focus_areas: List[str]
