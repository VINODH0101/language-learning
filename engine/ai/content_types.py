"""
Content taxonomy and language model for centralized generation.

Language model (four-way decoupling) is reused from ``engine.models.enums``.
Learning and explanation languages are restricted to ``pt``, ``en``, ``es``.

The existing ``CEFRLevel`` enum (A1..C1) does not yet include C2. The
centralized engine targets A1..C2; ``CEFR_LEVELS`` documents the full range
and Phase 2 will extend ``engine.models.enums.CEFRLevel`` accordingly.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from engine.models.enums import ExplanationLanguage, Language, RegionalVariety

# Full supported range for the centralized engine (A1..C2).
CEFR_LEVELS: List[str] = ["A1", "A2", "B1", "B2", "C1", "C2"]

# Product learning languages (Portuguese, English, Spanish).
LEARNING_LANGUAGES: List[str] = ["pt", "es", "en"]
EXPLANATION_LANGUAGES: List[str] = ["en", "pt", "es"]


class ContentType(str, Enum):
    """The eight content types supported by the centralized engine."""

    STORY = "story"
    CONVERSATION = "conversation"
    POETRY = "poetry"
    GRAMMAR = "grammar"
    VOCABULARY = "vocabulary"
    ACADEMIC_ESSAY = "academic_essay"
    CULTURAL_ARTICLE = "cultural_article"
    PRACTICE = "practice"


class TaskType(str, Enum):
    """Generation task categories used by the provider router."""

    GENERATE_CONTENT = "generate_content"
    ENRICH = "enrich"
    TRANSLATE = "translate"
    VALIDATE = "validate"


class LanguageContext(BaseModel):
    """The three independent language dimensions for a generation request.

    Never assume interface == target == explanation.
    """

    interface_language: str = Field(default="en")
    target_language: Language
    explanation_language: ExplanationLanguage
    regional_variety: Optional[RegionalVariety] = None


class GenerationContext(BaseModel):
    """What to generate and for whom."""

    content_type: ContentType
    language: LanguageContext
    cefr_level: str = Field(default="B1")
    topic: Optional[str] = None
    constraints: dict = Field(default_factory=dict)


class GenerationTask(BaseModel):
    """A unit of work dispatched to the provider router."""

    idempotency_key: str
    task_type: TaskType = TaskType.GENERATE_CONTENT
    context: GenerationContext
    schema_name: str
    max_attempts: int = 3
