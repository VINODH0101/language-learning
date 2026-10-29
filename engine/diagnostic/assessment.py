"""Diagnostic placement assessment engine calibrating starting CEFR level."""

from typing import List, Dict, Optional
from datetime import date
from engine.models.enums import Language, CEFRLevel
from engine.models.diagnostic import DiagnosticQuestion, DiagnosticSubmission, DiagnosticResult
from engine.curriculum.manager import CurriculumManager


class DiagnosticAssessmentEngine:
    """Evaluates learner placement tests and assigns appropriate initial CEFR curriculum node."""

    MASTERY_THRESHOLD_PERCENT: float = 70.0

    def __init__(self, questions: List[DiagnosticQuestion], curriculum_mgr: CurriculumManager):
        self._questions_by_id: Dict[str, DiagnosticQuestion] = {q.id: q for q in questions}
        self._curriculum_mgr = curriculum_mgr

    def evaluate(self, submission: DiagnosticSubmission) -> DiagnosticResult:
        lang_questions = [
            q for q in self._questions_by_id.values()
            if q.language == submission.language
        ]

        if not lang_questions:
            # Fallback if no questions configured
            first_node = self._curriculum_mgr.get_nodes_for_track(submission.language, CEFRLevel.A1)[0]
            return DiagnosticResult(
                user_id=submission.user_id,
                language=submission.language,
                recommended_cefr_level=CEFRLevel.A1,
                recommended_curriculum_node_id=first_node.id,
                score_by_level={"A1": 0.0},
                overall_score_percent=0.0,
                total_questions=0,
                correct_count=0,
                diagnostic_date=date.today(),
                feedback_summary="No assessment questions available. Starting from A1 foundational curriculum.",
                strengths=[],
                recommended_focus_areas=["A1 foundational grammar and core vocabulary"],
            )

        level_totals: Dict[CEFRLevel, int] = {lvl: 0 for lvl in CEFRLevel.order()}
        level_correct: Dict[CEFRLevel, int] = {lvl: 0 for lvl in CEFRLevel.order()}
        strengths: List[str] = []
        focus_areas: List[str] = []

        total_correct = 0
        total_answered = 0

        for q in lang_questions:
            chosen = submission.answers.get(q.id)
            if chosen is not None:
                total_answered += 1
                level_totals[q.cefr_level] += 1
                if chosen == q.correct_option_index:
                    total_correct += 1
                    level_correct[q.cefr_level] += 1
                    strengths.append(f"Mastery demonstrated in: {q.grammatical_focus}")
                else:
                    focus_areas.append(f"Review required in: {q.grammatical_focus}")

        # Compute percentage scores per level
        score_by_level_str: Dict[str, float] = {}
        recommended_level = CEFRLevel.A1

        for lvl in [CEFRLevel.A1, CEFRLevel.A2, CEFRLevel.B1, CEFRLevel.B2]:
            tot = level_totals[lvl]
            if tot > 0:
                pct = (level_correct[lvl] / tot) * 100.0
                score_by_level_str[lvl.value] = round(pct, 1)
                # If learner achieved >= 70% at this level, they place into the NEXT level
                if pct >= self.MASTERY_THRESHOLD_PERCENT:
                    curr_idx = CEFRLevel.order().index(lvl)
                    recommended_level = CEFRLevel.order()[curr_idx + 1]
            else:
                score_by_level_str[lvl.value] = 0.0

        overall_pct = round((total_correct / total_answered) * 100.0, 1) if total_answered > 0 else 0.0

        # Find starting curriculum node for recommended level
        matching_nodes = self._curriculum_mgr.get_nodes_for_track(submission.language, recommended_level)
        if matching_nodes:
            recommended_node_id = matching_nodes[0].id
        else:
            # Fallback to first available node in language
            recommended_node_id = self._curriculum_mgr.get_nodes_for_track(submission.language)[0].id

        feedback_summary = (
            f"Avaliação diagnóstica concluída com {overall_pct}% de acerto global. "
            f"Nível CEFR inicial calibrado para: {recommended_level.value}."
        )

        return DiagnosticResult(
            user_id=submission.user_id,
            language=submission.language,
            recommended_cefr_level=recommended_level,
            recommended_curriculum_node_id=recommended_node_id,
            score_by_level=score_by_level_str,
            overall_score_percent=overall_pct,
            total_questions=total_answered,
            correct_count=total_correct,
            diagnostic_date=date.today(),
            feedback_summary=feedback_summary,
            strengths=list(dict.fromkeys(strengths))[:5],
            recommended_focus_areas=list(dict.fromkeys(focus_areas))[:5],
        )
