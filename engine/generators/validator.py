"""Rigorous schema and pedagogical validation for generated daily lessons."""

from typing import List
from pydantic import ValidationError
from engine.models.lesson import DailyLessonPayload


class LessonValidationError(Exception):
    """Raised when a generated lesson payload fails validation criteria."""
    def __init__(self, errors: List[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


class LessonValidator:
    """Validates that a generated lesson satisfies all 12 mandatory sections and quality constraints."""

    MIN_VOCABULARY_COUNT: int = 12
    MIN_EXERCISE_COUNT: int = 4

    @classmethod
    def validate(cls, lesson: DailyLessonPayload) -> None:
        errors: List[str] = []

        # 1. Objectives check
        if not lesson.section_1_objectives:
            errors.append("Section 1 (Objectives) must contain at least 1 learning objective.")

        # 2. Vocabulary count check (Requirement 5 & SPEC Section 5)
        if len(lesson.section_2_vocabulary) < cls.MIN_VOCABULARY_COUNT:
            errors.append(
                f"Section 2 (Vocabulary) contains {len(lesson.section_2_vocabulary)} items; "
                f"minimum required is {cls.MIN_VOCABULARY_COUNT}."
            )

        for idx, vocab in enumerate(lesson.section_2_vocabulary):
            if not vocab.lemma.strip():
                errors.append(f"Vocabulary item at index {idx} has an empty lemma.")
            if not vocab.definition_en.strip() or not vocab.definition_target.strip():
                errors.append(f"Vocabulary item '{vocab.lemma}' is missing definitions.")
            if not vocab.example_sentence_target.strip():
                errors.append(f"Vocabulary item '{vocab.lemma}' is missing target example sentence.")

        # 3. Grammar rule check
        if not lesson.section_3_grammar.title.strip() or not lesson.section_3_grammar.explanation_markdown.strip():
            errors.append("Section 3 (Grammar) is missing title or explanation.")
        if not lesson.section_3_grammar.examples:
            errors.append("Section 3 (Grammar) must contain at least 1 example sentence.")

        # 4. Reading comprehension check
        if not lesson.section_4_reading.passage_target.strip():
            errors.append("Section 4 (Reading) has an empty reading passage.")

        # 5. Conversation check
        if len(lesson.section_5_conversation.dialogue) < 2:
            errors.append("Section 5 (Conversation) must contain at least 2 dialogue turns.")

        # 6. Speaking check
        if not lesson.section_6_speaking.prompt.strip():
            errors.append("Section 6 (Speaking) is missing a practice prompt.")

        # 7. Writing check
        if not lesson.section_7_writing.prompt.strip() or lesson.section_7_writing.target_word_count < 50:
            errors.append("Section 7 (Writing) is missing prompt or has invalid word count target.")

        # 8. Listening check
        if not lesson.section_8_listening.transcript_target.strip():
            errors.append("Section 8 (Listening) has an empty transcript.")

        # 9. Exercises check
        if len(lesson.section_9_exercises) < cls.MIN_EXERCISE_COUNT:
            errors.append(
                f"Section 9 (Exercises) has {len(lesson.section_9_exercises)} exercises; "
                f"minimum required is {cls.MIN_EXERCISE_COUNT}."
            )

        # 10. Answer keys check: must match 1:1 with exercises
        exercise_ids = [e.id for e in lesson.section_9_exercises]
        answer_ids = [a.exercise_id for a in lesson.section_10_answer_keys]

        if len(exercise_ids) != len(answer_ids):
            errors.append(
                f"Section 10 (Answer Keys) count ({len(answer_ids)}) does not match "
                f"exercise count ({len(exercise_ids)})."
            )

        if set(exercise_ids) != set(answer_ids):
            errors.append("Section 10 answer key IDs do not correspond exactly to Section 9 exercise IDs.")

        for key in lesson.section_10_answer_keys:
            if not key.acceptable_solutions:
                errors.append(f"Answer key for exercise '{key.exercise_id}' has no acceptable solutions.")
            if not key.explanation.strip():
                errors.append(f"Answer key for exercise '{key.exercise_id}' is missing explanation.")

        # 11. Review check
        if not lesson.section_11_review.review_strategy_note.strip():
            errors.append("Section 11 (Review) is missing review strategy notes.")

        # 12. Further resources check
        if not lesson.section_12_further_resources:
            errors.append("Section 12 (Further Resources) must contain at least 1 resource.")

        # Attributions check
        if not lesson.attributions:
            errors.append("Lesson must include legal licensing and attribution metadata.")

        if errors:
            raise LessonValidationError(errors)
