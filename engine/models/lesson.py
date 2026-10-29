"""Daily lesson schemas mapping strictly to the 12 required sections in ENGINEERING_SPEC.md."""

from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel, Field, model_validator
from engine.models.enums import (
    Language,
    RegionalVariety,
    ExplanationLanguage,
    CEFRLevel,
    StudyMode,
    is_valid_regional_variety_for_language,
)
from engine.models.content import (
    VocabularyItem,
    GrammarRule,
    CuratedMaterial,
    ExerciseTemplate,
    FalseFriendItem,
    Attribution,
)


class LearningObjective(BaseModel):
    category: str
    can_do_statement: str
    target_competency: str


class ReadingSection(BaseModel):
    title: str
    passage_target: str
    passage_en: Optional[str] = None
    glossary: Dict[str, str] = Field(default_factory=dict)
    comprehension_questions: List[Dict[str, Any]] = Field(default_factory=list)
    attribution: Attribution
    article_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    topic_category: Optional[str] = None
    provider: Optional[str] = "curated"
    article_id: Optional[str] = None


class ConversationSection(BaseModel):
    title: str
    context: str
    dialogue: List[Dict[str, str]] = Field(..., description="List of {speaker: str, line: str, translation: str}")
    pragmatic_notes: List[str] = Field(default_factory=list)
    attribution: Attribution


class SpeakingSection(BaseModel):
    prompt: str
    guiding_questions: List[str]
    suggested_phrases: List[str]
    model_pronunciation_guide: Optional[str] = None
    target_duration_minutes: int = 10


class WritingSection(BaseModel):
    prompt: str
    genre_register: str = Field(..., description="e.g. Formal essay, editorial, academic argument, op-ed")
    structural_guidelines: List[str]
    evaluation_criteria: List[str]
    suggested_connectors: List[str]
    target_word_count: int = 150


class ListeningSection(BaseModel):
    title: str
    audio_source_url: Optional[str] = None
    audio_player_notes: str
    transcript_target: str
    comprehension_tasks: List[str]
    attribution: Attribution


class ExerciseItem(BaseModel):
    id: str
    exercise_type: str
    prompt: str
    context_passage: Optional[str] = None
    options: Optional[List[str]] = None
    hint: Optional[str] = None
    distractor_explanations: Optional[Dict[str, str]] = None


class AnswerKeyItem(BaseModel):
    exercise_id: str
    acceptable_solutions: List[str]
    explanation: str
    distractor_feedback: Optional[Dict[str, str]] = None


class ReviewSection(BaseModel):
    due_vocabulary_reviews: List[VocabularyItem] = Field(default_factory=list)
    consolidated_grammar_rules: List[GrammarRule] = Field(default_factory=list)
    review_strategy_note: str


class FurtherResource(BaseModel):
    title: str
    resource_type: str  # podcast, article, video, literature
    url: str
    description: str


class DailyLessonPayload(BaseModel):
    """Complete 12-section daily lesson payload conforming to ENGINEERING_SPEC.md."""
    lesson_id: str
    user_id: str = Field(default="default_learner")
    lesson_date: date
    language: Language
    regional_variety: RegionalVariety
    explanation_language: ExplanationLanguage = Field(default=ExplanationLanguage.EN)
    cefr_level: CEFRLevel
    curriculum_node_id: str
    curriculum_topic_title: str
    study_mode: StudyMode = Field(default=StudyMode.FULL)
    estimated_study_minutes: int = Field(default=50)

    # 1. Learning objectives
    section_1_objectives: List[LearningObjective] = Field(..., min_length=1)

    # 2. At least 12 vocabulary items with definitions and examples
    section_2_vocabulary: List[VocabularyItem] = Field(..., min_length=12)

    # 3. Grammar explanations
    section_3_grammar: GrammarRule

    # 4. Reading comprehension
    section_4_reading: ReadingSection

    # 5. A natural conversation
    section_5_conversation: ConversationSection

    # 6. Speaking practice
    section_6_speaking: SpeakingSection

    # 7. A writing assignment
    section_7_writing: WritingSection

    # 8. Listening practice
    section_8_listening: ListeningSection

    # 9. Exercises
    section_9_exercises: List[ExerciseItem] = Field(..., min_length=4)

    # 10. Answer keys and explanations
    section_10_answer_keys: List[AnswerKeyItem] = Field(..., min_length=4)

    # 11. Review of previously studied material
    section_11_review: ReviewSection

    # 12. Further-learning resources
    section_12_further_resources: List[FurtherResource] = Field(..., min_length=1)

    # Special Portuguese-Spanish interference alerts (Requirement 15)
    false_friend_alerts: List[FalseFriendItem] = Field(default_factory=list)

    # Full aggregated licensing & attribution
    attributions: List[Attribution] = Field(..., min_length=1)

    # Idempotency and versioning
    content_fingerprint: Optional[str] = None
    curriculum_version: str = Field(default="1.0.0")
    is_review_lesson: bool = Field(default=False)

    @model_validator(mode="after")
    def validate_regional_variety_compatibility(self) -> "DailyLessonPayload":
        if not is_valid_regional_variety_for_language(self.language, self.regional_variety):
            raise ValueError(
                f"Regional variety '{self.regional_variety.value}' is not valid for target learning language '{self.language.value}'."
            )
        return self
