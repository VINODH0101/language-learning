"""Core educational content models with strict validation and attribution."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from engine.models.enums import (
    Language,
    RegionalVariety,
    CEFRLevel,
    ExerciseType,
    MaterialType,
    LicenseType,
)


class Attribution(BaseModel):
    """Legal license and attribution metadata for educational resources."""
    source_name: str = Field(..., description="Name of the open-source corpus or resource")
    source_url: str = Field(..., description="Canonical URL to original dataset or source")
    license_type: LicenseType = Field(..., description="Explicit open license identifier")
    attribution_text: str = Field(..., description="Required attribution text / credit notice")
    terms_url: Optional[str] = Field(None, description="URL to licensing and reuse terms")


class VocabularyItem(BaseModel):
    """Vocabulary entry with phonetic, grammatical, contextual and regional data."""
    id: str = Field(..., description="Unique identifier for vocabulary item")
    language: Language
    lemma: str = Field(..., description="Dictionary headword/base form")
    part_of_speech: str = Field(..., description="e.g. noun, verb, adjective, adverb, idiom, collocation")
    cefr_level: CEFRLevel
    definition_en: str = Field(..., description="Clear definition in English")
    definition_target: str = Field(..., description="Monolingual definition in target language")
    phonetic_ipa: Optional[str] = Field(None, description="International Phonetic Alphabet transcription")
    regional_tags: List[RegionalVariety] = Field(default_factory=lambda: [RegionalVariety.ALL])
    example_sentence_target: str = Field(..., description="Natural usage example in target language")
    example_sentence_en: str = Field(..., description="English translation of usage example")
    collocations: List[str] = Field(default_factory=list, description="Common co-occurrences or fixed phrases")
    audio_url: Optional[str] = Field(None, description="Direct URL to Tatoeba or open native recording")
    false_friend_warning: Optional[str] = Field(None, description="Specific warning if prone to PT/ES confusion")
    attribution: Attribution


class GrammarExample(BaseModel):
    target: str = Field(..., description="Sentence illustrating grammatical rule")
    en: str = Field(..., description="English translation")
    note: Optional[str] = Field(None, description="Syntactic breakdown or stylistic note")


class CommonError(BaseModel):
    incorrect: str = Field(..., description="Typical learner mistake or interference")
    correct: str = Field(..., description="Grammatically accurate target phrasing")
    reason: str = Field(..., description="Explanation of why this error occurs and how to avoid it")


class GrammarRule(BaseModel):
    """In-depth grammatical rule with structural formula and regional variations."""
    id: str = Field(..., description="Unique identifier")
    rule_code: str = Field(..., description="Machine-readable code, e.g. PT_INF_PESSOAL_01")
    language: Language
    cefr_level: CEFRLevel
    title: str = Field(..., description="Descriptive title of grammar topic")
    category: str = Field(..., description="Grammar family: subjunctive, clitics, connectors, etc.")
    explanation_markdown: str = Field(..., description="Comprehensive explanation in markdown")
    structural_formula: str = Field(..., description="Abstract syntax formula, e.g., 'Se + Futuro do Subjuntivo'")
    examples: List[GrammarExample] = Field(..., min_length=1)
    common_errors: List[CommonError] = Field(default_factory=list)
    regional_notes: Dict[str, str] = Field(default_factory=dict, description="Differences across varieties")
    attribution: Attribution


class ComprehensionQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=2)
    correct_option_index: int = Field(..., ge=0)
    explanation: str


class CuratedMaterial(BaseModel):
    """Reading passages, conversational dialogues, and listening scripts."""
    id: str = Field(..., description="Unique material identifier")
    language: Language
    material_type: MaterialType
    title: str = Field(..., description="Passage or dialogue title")
    cefr_level: CEFRLevel
    regional_variety: RegionalVariety = Field(default=RegionalVariety.ALL)
    content_target: str = Field(..., description="Primary body text in target language")
    content_en: Optional[str] = Field(None, description="English translation/reference")
    glossary: Dict[str, str] = Field(default_factory=dict, description="Challenging words mapped to definitions")
    comprehension_questions: List[ComprehensionQuestion] = Field(default_factory=list)
    speaking_prompt: Optional[str] = Field(None, description="Guiding prompt for spoken production")
    writing_prompt: Optional[str] = Field(None, description="Guiding prompt for argumentative/essay writing")
    audio_url: Optional[str] = Field(None, description="Audio source URL")
    attribution: Attribution


class DistractorItem(BaseModel):
    text: str
    why_incorrect: str = Field(..., description="Pedagogical explanation of why this option is wrong")


class ExerciseTemplate(BaseModel):
    """Deterministic template for exercises with validated answer sets and distractors."""
    id: str = Field(..., description="Unique exercise identifier")
    curriculum_node_id: str
    language: Language
    exercise_type: ExerciseType
    prompt: str = Field(..., description="Instructions presented to the learner")
    context_passage: Optional[str] = Field(None, description="Sentence or paragraph frame")
    target_slot_index: Optional[int] = Field(None, description="Word/token position for cloze masks")
    acceptable_solutions: List[str] = Field(..., min_length=1, description="Normalized acceptable exact answers")
    distractors: List[DistractorItem] = Field(default_factory=list, description="Distractors with error feedback")
    explanation: str = Field(..., description="Full grammatical explanation for correct answer")
    hint: Optional[str] = Field(None, description="Optional scaffolded clue")
    difficulty: int = Field(default=3, ge=1, le=5)
    attribution: Attribution


class FalseFriendItem(BaseModel):
    """Portuguese-Spanish false cognate and interlinguistic interference entry."""
    id: str
    portuguese_term: str
    spanish_term: str
    pt_meaning_en: str
    es_meaning_en: str
    pt_example: str
    es_example: str
    interference_warning: str
    cefr_level: CEFRLevel
    attribution: Attribution
