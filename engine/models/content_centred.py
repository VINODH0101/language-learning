"""
Lexilume — Python Content-Centred Domain Models (Phase 7).

Defines canonical Pydantic models matching Migration 015 and frontend TypeScript models.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from engine.models.enums import CEFRLevel, ExplanationLanguage, Language


class ContentGenre(str, Enum):
    CONVERSATION = "conversation"
    DIALOGUE = "dialogue"
    SHORT_STORY = "short_story"
    LITERATURE = "literature"
    NEWS_ARTICLE = "news_article"
    WORKPLACE_EMAIL = "workplace_email"
    BUSINESS_REPORT = "business_report"
    ACADEMIC_ESSAY = "academic_essay"
    CULTURE_AND_TRAVEL = "culture_and_travel"
    GRAMMAR_IN_ACTION = "grammar_in_action"
    INSTRUCTIONS_AND_GUIDES = "instructions_and_guides"
    INTERVIEW_AND_DISCUSSION = "interview_and_discussion"
    REVIEWS_AND_OPINIONS = "reviews_and_opinions"


class ContentStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    REVIEW_REQUIRED = "review_required"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class RightsStatus(str, Enum):
    ORIGINAL = "original"
    PUBLIC_DOMAIN = "public_domain"
    LICENSED = "licensed"
    PERMITTED = "permitted"
    RESTRICTED = "restricted"
    UNKNOWN = "unknown"


class SourceType(str, Enum):
    PUBLIC_DOMAIN = "public_domain"
    OPEN_LICENSE = "open_license"
    EDITORIAL = "editorial"
    USER_SUBMITTED = "user_submitted"
    PARTNER = "partner"


class ActivityType(str, Enum):
    READING_COMPREHENSION = "reading_comprehension"
    VOCABULARY_CLOZE = "vocabulary_cloze"
    GRAMMAR_TRANSFORMATION = "grammar_transformation"
    LISTENING_DICTATION = "listening_dictation"
    SENTENCE_SCRAMBLE = "sentence_scramble"
    SPOKEN_SHADOWING = "spoken_shadowing"
    FREE_WRITING = "free_writing"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"


class ProcessingJobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ProcessingStageName(str, Enum):
    STAGE_0_INTAKE = "stage_0_intake"
    STAGE_1_DETECT_LANG = "stage_1_detect_lang"
    STAGE_2_CLASSIFY = "stage_2_classify"
    STAGE_3_SEGMENT = "stage_3_segment"
    STAGE_4_TRANSLATE = "stage_4_translate"
    STAGE_5_EXTRACT_LEXICON = "stage_5_extract_lexicon"
    STAGE_6_EXTRACT_GRAMMAR = "stage_6_extract_grammar"
    STAGE_7_GENERATE_ACTIVITIES = "stage_7_generate_activities"
    STAGE_8_VALIDATE = "stage_8_validate"


class ErrorCategory(str, Enum):
    VOCABULARY_CHOICE = "vocabulary_choice"
    VERB_TENSE = "verb_tense"
    PREPOSITION = "preposition"
    SPELLING = "spelling"
    WORD_ORDER = "word_order"
    ARTICLE_USAGE = "article_usage"
    COMPREHENSION_INFERENCE = "comprehension_inference"
    PRONUNCIATION = "pronunciation"
    GENERAL = "general"


# ==============================================================================
# Domain Entities
# ==============================================================================

class ContentSourceModel(BaseModel):
    id: Optional[UUID] = None
    source_name: str
    source_type: SourceType
    author: Optional[str] = None
    original_url: Optional[str] = None
    license_type: str = "CC-BY-SA-4.0"
    license_text: Optional[str] = None
    attribution_notice: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ContentTokenModel(BaseModel):
    text: str
    lemma: str
    pos: str
    cefr: Optional[CEFRLevel] = None
    gloss_id: Optional[str] = None
    audio_offset_ms: Optional[Dict[str, int]] = None


class ContentSentenceModel(BaseModel):
    id: str
    order: int
    text: str
    tokens: List[ContentTokenModel] = Field(default_factory=list)
    translations: Optional[Dict[str, str]] = None
    grammar_rule_ids: Optional[List[str]] = None


class ContentParagraphModel(BaseModel):
    id: str
    order: int
    sentences: List[ContentSentenceModel] = Field(default_factory=list)


class LexicalAnnotationModel(BaseModel):
    id: str
    lemma: str
    term: str
    pos: str
    cefr: Optional[CEFRLevel] = None
    ipa: Optional[str] = None
    contextual_meaning: str
    general_definition: Optional[str] = None
    context_translation: Dict[str, str] = Field(default_factory=dict)
    example_sentence: Optional[str] = None
    audio_url: Optional[str] = None


class GrammarPointModel(BaseModel):
    id: str
    title: str
    target_tokens: List[str] = Field(default_factory=list)
    explanation_summary: str
    explanations: Optional[Dict[str, str]] = None
    pattern: Optional[str] = None


class StructuredPayloadModel(BaseModel):
    title: str
    summary: Optional[str] = None
    paragraphs: List[ContentParagraphModel] = Field(default_factory=list)
    annotations: Dict[str, LexicalAnnotationModel] = Field(default_factory=dict)
    grammar_points: List[GrammarPointModel] = Field(default_factory=list)


class ContentItemModel(BaseModel):
    id: Optional[UUID] = None
    title: str
    slug: str
    target_language: Language = Language.PORTUGUESE
    explanation_language: ExplanationLanguage = ExplanationLanguage.EN
    source_language: Optional[str] = "en"
    summary: Optional[str] = None
    genre: ContentGenre = ContentGenre.NEWS_ARTICLE
    primary_cefr: CEFRLevel = CEFRLevel.B1
    estimated_read_minutes: int = Field(default=3, ge=1)
    status: ContentStatus = ContentStatus.DRAFT
    current_version_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    rights_status: RightsStatus = RightsStatus.PUBLIC_DOMAIN
    rights_notes: Optional[str] = None
    source_url: Optional[str] = None
    author: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ContentVersionModel(BaseModel):
    id: Optional[UUID] = None
    content_item_id: UUID
    version_number: int = Field(default=1, ge=1)
    cefr_level: CEFRLevel = CEFRLevel.B1
    structured_payload: StructuredPayloadModel
    audio_metadata: Dict[str, Any] = Field(default_factory=dict)
    word_count: int = Field(default=0, ge=0)
    sentence_count: int = Field(default=0, ge=0)
    lexical_density: Optional[float] = None
    is_published: bool = False
    change_summary: Optional[str] = None
    created_by: Optional[UUID] = None
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class ActivityQuestionOptionModel(BaseModel):
    id: str
    text: str


class ActivityQuestionModel(BaseModel):
    id: str
    type: str
    stem: str
    options: Optional[List[ActivityQuestionOptionModel]] = None
    correct_answer: str
    explanation: str
    reference_sentence_id: Optional[str] = None
    target_token: Optional[str] = None


class LearningActivityModel(BaseModel):
    id: Optional[UUID] = None
    content_version_id: UUID
    activity_type: ActivityType
    activity_title: str
    activity_order: int = Field(default=1, ge=1)
    estimated_minutes: int = Field(default=5, ge=1)
    configuration: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None


class UserSavedWordModel(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    target_language: Language
    explanation_language: ExplanationLanguage
    term: str
    lemma: str
    pos: str = "other"
    cefr_level: Optional[CEFRLevel] = None
    definition: str
    context_sentence: Optional[str] = None
    context_translation: Optional[str] = None
    source_content_id: Optional[UUID] = None
    source_version_id: Optional[UUID] = None
    audio_url: Optional[str] = None
    ipa: Optional[str] = None
    client_mutation_id: Optional[str] = None

    # SM-2 Spaced Repetition Fields
    ease_factor: float = Field(default=2.5, ge=1.3)
    interval_days: int = Field(default=0, ge=0)
    repetitions: int = Field(default=0, ge=0)
    lapses: int = Field(default=0, ge=0)
    last_reviewed_at: Optional[datetime] = None
    next_review: date = Field(default_factory=date.today)
    legacy_srs_item_id: Optional[str] = None

    state: str = "learning"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserMistakeModel(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    content_item_id: Optional[UUID] = None
    content_version_id: Optional[UUID] = None
    activity_id: Optional[UUID] = None
    activity_type: str
    error_category: ErrorCategory
    stimulus: str
    user_response: str
    correct_response: str
    pedagogical_explanation: str
    status: str = "unresolved"
    occurrences_count: int = Field(default=1, ge=1)
    client_mutation_id: Optional[str] = None
    first_occurred_at: Optional[datetime] = None
    last_occurred_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ContentProcessingJobModel(BaseModel):
    id: Optional[UUID] = None
    content_item_id: UUID
    version_number: int = Field(default=1, ge=1)
    status: ProcessingJobStatus = ProcessingJobStatus.QUEUED
    current_stage: ProcessingStageName = ProcessingStageName.STAGE_0_INTAKE
    stages_completed: List[ProcessingStageName] = Field(default_factory=list)
    stage_outputs: Dict[str, Any] = Field(default_factory=dict)
    stage_timings: Dict[str, float] = Field(default_factory=dict)
    error_message: Optional[str] = None
    retry_count: int = Field(default=0, ge=0)
    triggered_by: Optional[UUID] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
