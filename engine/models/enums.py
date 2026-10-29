"""Enumerations for Polyglot C1 Daily learning engine."""

from enum import Enum, IntEnum
from typing import Dict, List, Union


class Language(str, Enum):
    PORTUGUESE = "pt"
    SPANISH = "es"
    ENGLISH = "en"


class InterfaceLanguage(str, Enum):
    EN = "en"
    PT = "pt"
    ES = "es"


class ExplanationLanguage(str, Enum):
    EN = "en"
    PT = "pt"
    ES = "es"


class RegionalVariety(str, Enum):
    # Portuguese varieties
    PT_BR = "pt-BR"  # Brazilian Portuguese
    PT_PT = "pt-PT"  # European Portuguese
    # Spanish varieties
    ES_ES = "es-ES"  # Peninsular Spanish
    ES_419 = "es-419"  # Latin American Spanish (General)
    ES_MX = "es-MX"  # Mexican Spanish
    ES_AR = "es-AR"  # Rioplatense Spanish
    # English varieties
    EN_US = "en-US"  # American English
    EN_GB = "en-GB"  # British English
    ALL = "all"


REGIONAL_VARIETIES_BY_LANGUAGE: Dict[Language, List[RegionalVariety]] = {
    Language.PORTUGUESE: [RegionalVariety.PT_BR, RegionalVariety.PT_PT, RegionalVariety.ALL],
    Language.SPANISH: [
        RegionalVariety.ES_ES,
        RegionalVariety.ES_419,
        RegionalVariety.ES_MX,
        RegionalVariety.ES_AR,
        RegionalVariety.ALL,
    ],
    Language.ENGLISH: [RegionalVariety.EN_US, RegionalVariety.EN_GB, RegionalVariety.ALL],
}

DEFAULT_REGIONAL_VARIETY: Dict[Language, RegionalVariety] = {
    Language.PORTUGUESE: RegionalVariety.PT_BR,
    Language.SPANISH: RegionalVariety.ES_ES,
    Language.ENGLISH: RegionalVariety.EN_US,
}


def is_valid_regional_variety_for_language(language: Language, variety: RegionalVariety) -> bool:
    """Verifies whether a regional variety is valid for a given target learning language."""
    allowed = REGIONAL_VARIETIES_BY_LANGUAGE.get(language, [])
    return variety in allowed


def validate_regional_variety(
    language: Language, variety: Union[RegionalVariety, str, None]
) -> RegionalVariety:
    """Enforces that a regional variety belongs strictly to the given learning language.
    Falls back to default variety for the language if mismatched or invalid.
    """
    if isinstance(variety, str):
        try:
            variety = RegionalVariety(variety)
        except ValueError:
            return DEFAULT_REGIONAL_VARIETY.get(language, RegionalVariety.ALL)
    if variety and is_valid_regional_variety_for_language(language, variety):
        return variety
    return DEFAULT_REGIONAL_VARIETY.get(language, RegionalVariety.ALL)


class CEFRLevel(str, Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"

    @classmethod
    def order(cls) -> list["CEFRLevel"]:
        return [cls.A1, cls.A2, cls.B1, cls.B2, cls.C1]

    def __lt__(self, other: "CEFRLevel") -> bool:
        order = self.order()
        return order.index(self) < order.index(other)

    def __le__(self, other: "CEFRLevel") -> bool:
        order = self.order()
        return order.index(self) <= order.index(other)

    def __gt__(self, other: "CEFRLevel") -> bool:
        order = self.order()
        return order.index(self) > order.index(other)

    def __ge__(self, other: "CEFRLevel") -> bool:
        order = self.order()
        return order.index(self) >= order.index(other)


class StudyMode(str, Enum):
    FULL = "full"        # ~45-60 min complete daily study
    COMPACT = "compact"  # ~15-20 min accelerated daily review


class SkillCategory(str, Enum):
    GRAMMAR = "grammar"
    VOCABULARY = "vocabulary"
    DISCOURSE = "discourse"
    READING = "reading"
    CONVERSATION = "conversation"
    WRITING = "writing"
    LISTENING = "listening"
    PRAGMATICS = "pragmatics"
    PHONOLOGY = "phonology"


class ExerciseType(str, Enum):
    CLOZE = "cloze"                      # Fill-in-the-blank
    MULTIPLE_CHOICE = "multiple_choice"  # Multiple choice with distractors
    REORDER = "reorder"                  # Unscramble words to build a valid sentence
    ERROR_CORRECTION = "error_correction" # Find and correct grammatical / lexical mistake
    TRANSLATION = "translation"          # Contextual translation with validated target set


class MaterialType(str, Enum):
    READING_PASSAGE = "reading_passage"
    CONVERSATION_SCRIPT = "conversation_script"
    LISTENING_TRANSCRIPT = "listening_transcript"


class MasteryStatus(str, Enum):
    UNSEEN = "unseen"         # Not yet exposed to the learner
    PRESENTED = "presented"   # Introduced in a lesson, but not yet tested or retained
    LEARNING = "learning"     # Currently in initial SRS learning steps
    REVIEWING = "reviewing"   # In graduated SRS review intervals
    MASTERED = "mastered"     # Successfully recalled across multiple long intervals


class ReviewGrade(IntEnum):
    BLACKOUT = 0     # Complete blackout
    INCORRECT = 1    # Wrong response; correct answer remembered upon seeing
    HARD_WRONG = 2   # Wrong response; correct answer seemed easy once revealed
    HARD_CORRECT = 3 # Correct response recalled with serious difficulty
    GOOD = 4         # Correct response recalled after hesitation
    EASY = 5         # Perfect recall without hesitation


class LicenseType(str, Enum):
    CC_BY_2_0_FR = "CC-BY-2.0-FR"
    CC_BY_SA_3_0 = "CC-BY-SA-3.0"
    CC_BY_4_0 = "CC-BY-4.0"
    CC_BY_SA_4_0 = "CC-BY-SA-4.0"
    PUBLIC_DOMAIN = "Public-Domain"
    ORIGINAL_CURATED = "Original-Curated"
