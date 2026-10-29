"""Unit tests for diagnostic placement assessment."""

import pytest
from engine.models.enums import Language, CEFRLevel, SkillCategory, RegionalVariety
from engine.models.diagnostic import DiagnosticQuestion, DiagnosticSubmission
from engine.curriculum.manager import CurriculumManager
from engine.curriculum.syllabus import create_node
from engine.diagnostic.assessment import DiagnosticAssessmentEngine


@pytest.fixture
def diagnostic_setup():
    nodes = [
        create_node("pt-a1-01", Language.PORTUGUESE, CEFRLevel.A1, 1, "A1 Intro", "a1", SkillCategory.GRAMMAR, "A1 Can-do", "Desc"),
        create_node("pt-a2-01", Language.PORTUGUESE, CEFRLevel.A2, 1, "A2 Past", "a2", SkillCategory.GRAMMAR, "A2 Can-do", "Desc"),
        create_node("pt-b1-01", Language.PORTUGUESE, CEFRLevel.B1, 1, "B1 Subj", "b1", SkillCategory.GRAMMAR, "B1 Can-do", "Desc"),
        create_node("pt-b2-01", Language.PORTUGUESE, CEFRLevel.B2, 1, "B2 Cond", "b2", SkillCategory.GRAMMAR, "B2 Can-do", "Desc"),
        create_node("pt-c1-01", Language.PORTUGUESE, CEFRLevel.C1, 1, "C1 Inf", "c1", SkillCategory.GRAMMAR, "C1 Can-do", "Desc"),
    ]
    curriculum_mgr = CurriculumManager(nodes)

    questions = [
        DiagnosticQuestion(
            id="q-a1",
            language=Language.PORTUGUESE,
            cefr_level=CEFRLevel.A1,
            skill=SkillCategory.GRAMMAR,
            prompt="Eu _____ Pedro.",
            options=["sou", "estou", "faço"],
            correct_option_index=0,
            explanation="Verbo ser",
            grammatical_focus="Ser vs Estar",
        ),
        DiagnosticQuestion(
            id="q-a2",
            language=Language.PORTUGUESE,
            cefr_level=CEFRLevel.A2,
            skill=SkillCategory.GRAMMAR,
            prompt="Ontem eu _____ um livro.",
            options=["li", "lia", "leio"],
            correct_option_index=0,
            explanation="Pretérito perfeito",
            grammatical_focus="Pretérito perfeito",
        ),
        DiagnosticQuestion(
            id="q-b1",
            language=Language.PORTUGUESE,
            cefr_level=CEFRLevel.B1,
            skill=SkillCategory.GRAMMAR,
            prompt="Espero que você _____ bem.",
            options=["esteja", "está", "estivesse"],
            correct_option_index=0,
            explanation="Presente do subjuntivo",
            grammatical_focus="Presente do subjuntivo",
        ),
        DiagnosticQuestion(
            id="q-b2",
            language=Language.PORTUGUESE,
            cefr_level=CEFRLevel.B2,
            skill=SkillCategory.GRAMMAR,
            prompt="Se nós _____ tempo, iríamos.",
            options=["tivéssemos", "temos", "teríamos"],
            correct_option_index=0,
            explanation="Imperfeito do subjuntivo",
            grammatical_focus="Imperfeito do subjuntivo",
        ),
    ]
    engine = DiagnosticAssessmentEngine(questions, curriculum_mgr)
    return engine


def test_diagnostic_perfect_score_places_into_c1(diagnostic_setup):
    submission = DiagnosticSubmission(
        user_id="u_expert",
        language=Language.PORTUGUESE,
        answers={"q-a1": 0, "q-a2": 0, "q-b1": 0, "q-b2": 0},
    )
    result = diagnostic_setup.evaluate(submission)
    assert result.recommended_cefr_level == CEFRLevel.C1
    assert result.recommended_curriculum_node_id == "pt-c1-01"
    assert result.overall_score_percent == 100.0


def test_diagnostic_zero_score_places_into_a1(diagnostic_setup):
    submission = DiagnosticSubmission(
        user_id="u_novice",
        language=Language.PORTUGUESE,
        answers={"q-a1": 1, "q-a2": 1, "q-b1": 1, "q-b2": 1},
    )
    result = diagnostic_setup.evaluate(submission)
    assert result.recommended_cefr_level == CEFRLevel.A1
    assert result.recommended_curriculum_node_id == "pt-a1-01"
    assert result.overall_score_percent == 0.0
