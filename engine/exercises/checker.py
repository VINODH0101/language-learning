"""Deterministic exercise verification with distractor analysis and error feedback."""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from engine.models.content import ExerciseTemplate, DistractorItem
from engine.exercises.normalizer import StringNormalizer


class CheckResult(BaseModel):
    is_correct: bool
    score: float  # 0.0 to 1.0
    matched_solution: Optional[str] = None
    feedback: str
    explanation: str
    matched_distractor_feedback: Optional[str] = None
    is_accent_error_only: bool = False


class ExerciseChecker:
    """Evaluates learner submissions deterministically and provides pedagogical feedback."""

    @classmethod
    def evaluate(
        cls,
        template: ExerciseTemplate,
        submitted_answer: str,
        attempt_number: int = 1,
    ) -> CheckResult:
        """Evaluates submitted answer against acceptable solutions and distractor items."""
        cleaned_submission = StringNormalizer.clean(submitted_answer)

        # 1. Check exact / normalized match
        if StringNormalizer.matches(cleaned_submission, template.acceptable_solutions, strict_accents=True):
            # Calculate score scaled by attempt count
            score = 1.0 if attempt_number == 1 else max(0.2, 1.0 - (attempt_number - 1) * 0.3)
            return CheckResult(
                is_correct=True,
                score=score,
                matched_solution=submitted_answer.strip(),
                feedback=f"Correto! {template.explanation}",
                explanation=template.explanation,
            )

        # 2. Check if correct except for diacritic / accent marks
        if StringNormalizer.matches(cleaned_submission, template.acceptable_solutions, strict_accents=False):
            expected = template.acceptable_solutions[0]
            return CheckResult(
                is_correct=False,
                score=0.4,
                feedback=(
                    f"Quase correto! Verifique os acentos ortográficos. "
                    f"Você digitou '{submitted_answer}', mas a forma correta é '{expected}'."
                ),
                explanation=template.explanation,
                is_accent_error_only=True,
            )

        # 3. Check if submitted answer matches a known pedagogical distractor
        for distractor in template.distractors:
            if StringNormalizer.clean(distractor.text) == cleaned_submission:
                return CheckResult(
                    is_correct=False,
                    score=0.0,
                    feedback=f"Incorreto: {distractor.why_incorrect}",
                    explanation=template.explanation,
                    matched_distractor_feedback=distractor.why_incorrect,
                )

        # 4. Fallback for generic incorrect answers
        primary_solution = template.acceptable_solutions[0]
        return CheckResult(
            is_correct=False,
            score=0.0,
            feedback=(
                f"Incorreto. Resposta esperada: '{primary_solution}'. "
                f"{template.explanation}"
            ),
            explanation=template.explanation,
        )
