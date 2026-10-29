"""Unit tests for deterministic exercise validation, normalizers, and distractors."""

import pytest
from engine.models.enums import Language, ExerciseType, LicenseType
from engine.models.content import ExerciseTemplate, DistractorItem, Attribution, VocabularyItem
from engine.exercises.normalizer import StringNormalizer
from engine.exercises.checker import ExerciseChecker
from engine.exercises.generator import ExerciseGenerator


@pytest.fixture
def sample_template():
    return ExerciseTemplate(
        id="ex-1",
        curriculum_node_id="node-1",
        language=Language.PORTUGUESE,
        exercise_type=ExerciseType.MULTIPLE_CHOICE,
        prompt="Complete a frase:",
        context_passage="Para nós _____ o prazo...",
        acceptable_solutions=["cumprirmos"],
        distractors=[
            DistractorItem(
                text="cumprir",
                why_incorrect="Falta a desinência pessoal -mos exigida pelo sujeito nós.",
            ),
            DistractorItem(
                text="cumpramos",
                why_incorrect="'Cumpramos' é presente do subjuntivo, não infinitivo pessoal.",
            ),
        ],
        explanation="O infinitivo pessoal de 1ª pessoa do plural é cumprirmos.",
        attribution=Attribution(
            source_name="Polyglot C1 Daily",
            source_url="https://github.com",
            license_type=LicenseType.ORIGINAL_CURATED,
            attribution_text="Original exercise",
        ),
    )


def test_string_normalizer():
    assert StringNormalizer.clean("  ¡Hola, mundo!  ") == "hola, mundo"
    assert StringNormalizer.clean("¿Cumprirmos?") == "cumprirmos"
    assert StringNormalizer.remove_accents("não obstante") == "nao obstante"
    assert StringNormalizer.matches("Cumprirmos.", ["cumprirmos"])


def test_checker_correct_exact(sample_template):
    result = ExerciseChecker.evaluate(sample_template, "cumprirmos")
    assert result.is_correct is True
    assert result.score == 1.0
    assert "Correto!" in result.feedback
    assert "cumprirmos" in result.explanation


def test_checker_distractor_pedagogical_feedback(sample_template):
    # Requirement 8 & 9: selecting a known distractor yields specific explanation
    result = ExerciseChecker.evaluate(sample_template, "cumprir")
    assert result.is_correct is False
    assert result.score == 0.0
    assert result.matched_distractor_feedback == "Falta a desinência pessoal -mos exigida pelo sujeito nós."
    assert "Falta a desinência" in result.feedback


def test_checker_accent_warning():
    template = ExerciseTemplate(
        id="ex-acc",
        curriculum_node_id="n1",
        language=Language.SPANISH,
        exercise_type=ExerciseType.CLOZE,
        prompt="Complete:",
        acceptable_solutions=["está"],
        distractors=[],
        explanation="Forma conjugada de estar en 3ª persona.",
        attribution=Attribution(
            source_name="Tatoeba",
            source_url="https://tatoeba.org",
            license_type=LicenseType.CC_BY_2_0_FR,
            attribution_text="Tatoeba",
        ),
    )

    result = ExerciseChecker.evaluate(template, "esta")
    assert result.is_correct is False
    assert result.is_accent_error_only is True
    assert "acentos ortográficos" in result.feedback


def test_cloze_generator_from_vocabulary():
    vocab = VocabularyItem(
        id="v-test",
        language=Language.PORTUGUESE,
        lemma="conquanto",
        part_of_speech="conjunction",
        cefr_level="C1",
        definition_en="although",
        definition_target="conjunção concessiva",
        example_sentence_target="Conquanto houvesse crise, investiram.",
        example_sentence_en="Although there was a crisis, they invested.",
        attribution=Attribution(
            source_name="Tatoeba",
            source_url="https://tatoeba.org",
            license_type=LicenseType.CC_BY_2_0_FR,
            attribution_text="Tatoeba",
        ),
    )

    ex_item, ans_key = ExerciseGenerator.generate_cloze_from_vocabulary(vocab, distractors=["portanto", "porque"])
    assert "_____" in ex_item.context_passage
    assert "conquanto" in [s.lower() for s in ans_key.acceptable_solutions]
    assert ans_key.distractor_feedback is not None
