"""
Deterministic content fallback.

Produces minimal, valid, original content for every type when no AI provider
is configured or all providers fail. Respects four-way linguistic decoupling:
learner-facing target text uses ``target_language`` while pedagogical notes,
definitions, and instructions use ``explanation_language``.
"""

from __future__ import annotations

from typing import Any, Callable, Dict


_STORY_NARRATIVES: Dict[str, str] = {
    "pt": (
        "Era uma manhã tranquila no bairro. As ruas enchiam-se de passos calmos "
        "e o aroma de café fresco saía da padaria da esquina."
    ),
    "es": (
        "Era una mañana tranquila en el barrio. Las calles se llenaban de pasos "
        "serenos y el aroma a café recién hecho salía de la panadería."
    ),
    "en": (
        "It was an ordinary morning. The city woke slowly, and the streets "
        "filled with familiar sounds."
    ),
}

_STORY_QA: Dict[str, Dict[str, str]] = {
    "en": {"question": "What time of day is described?", "answer": "Morning"},
    "pt": {"question": "Que momento do dia é descrito?", "answer": "Manhã"},
    "es": {"question": "¿Qué momento del día se describe?", "answer": "La mañana"},
}

_DIALOGUES: Dict[str, list[dict[str, str]]] = {
    "pt": [
        {"speaker": "A", "line": "Bom dia! Como está hoje?"},
        {"speaker": "B", "line": "Estou bem, obrigado. E você?"},
    ],
    "es": [
        {"speaker": "A", "line": "¡Buenos días! ¿Cómo está hoy?"},
        {"speaker": "B", "line": "Estoy bien, gracias. ¿Y usted?"},
    ],
    "en": [
        {"speaker": "A", "line": "Good morning! How are you today?"},
        {"speaker": "B", "line": "I am well, thank you. And you?"},
    ],
}

_POEMS: Dict[str, list[str]] = {
    "pt": ["A luz serena começa a subir,", "e pinta a manhã antes de partir."],
    "es": ["La luz serena empieza a subir,", "y pinta la mañana antes de partir."],
    "en": ["The quiet light begins to rise,", "and paints the morning in the skies."],
}

_POEM_INTERP: Dict[str, str] = {
    "en": "Original short verse about beginnings and morning light.",
    "pt": "Verso curto original sobre começos e a luz da manhã.",
    "es": "Verso corto original sobre los comienzos y la luz de la mañana.",
}

_GRAMMAR_DATA: Dict[str, Dict[str, Any]] = {
    "pt": {
        "default_topic": "Presente do indicativo",
        "sentence": "Ela lê todas as manhãs.",
    },
    "es": {
        "default_topic": "Presente de indicativo",
        "sentence": "Ella lee todas las mañanas.",
    },
    "en": {
        "default_topic": "Present simple",
        "sentence": "She reads every morning.",
    },
}

_GRAMMAR_EXPLANATION: Dict[str, str] = {
    "en": "Describes regular habits, routines, and general truths.",
    "pt": "Descreve hábitos regulares, rotinas e verdades gerais.",
    "es": "Describe hábitos regulares, rutinas y verdades generales.",
}

_VOCAB_DATA: Dict[str, Dict[str, str]] = {
    "pt": {"lemma": "casa", "pos": "substantivo"},
    "es": {"lemma": "casa", "pos": "sustantivo"},
    "en": {"lemma": "house", "pos": "noun"},
}

_VOCAB_DEF: Dict[str, str] = {
    "en": "A place where someone lives.",
    "pt": "Um lugar onde alguém mora.",
    "es": "Un lugar donde vive alguien.",
}

_ESSAY_TEXT: Dict[str, Dict[str, str]] = {
    "en": {
        "topic": "The value of daily reading",
        "thesis": "Daily reading strengthens vocabulary and comprehension.",
        "introduction": "Reading regularly supports steady language growth.",
        "point": "Consistent exposure reinforces natural phrasing.",
        "conclusion": "A brief daily reading habit yields lasting progress.",
    },
    "pt": {
        "topic": "O valor da leitura diária",
        "thesis": "A leitura diária fortalece o vocabulário e a compreensão.",
        "introduction": "Ler com regularidade apoia o crescimento linguístico contínuo.",
        "point": "O contacto frequente reforça expressões naturais.",
        "conclusion": "Um hábito breve de leitura diária traz progresso duradouro.",
    },
    "es": {
        "topic": "El valor de la lectura diaria",
        "thesis": "La lectura diaria fortalece el vocabulario y la comprensión.",
        "introduction": "Leer con regularidad impulsa el progreso lingüístico continuo.",
        "point": "La exposición frecuente refuerza expresiones naturales.",
        "conclusion": "Un hábito breve de lectura diaria produce avances duraderos.",
    },
}

_CULTURAL_BODY: Dict[str, str] = {
    "pt": "Esta nota introdutória apresenta um tema cultural quotidiano para prática de leitura.",
    "es": "Esta nota introductoria presenta un tema cultural cotidiano para practicar la lectura.",
    "en": "This short note introduces an everyday cultural topic for reading practice.",
}

_PRACTICE_DATA: Dict[str, Dict[str, Any]] = {
    "pt": {
        "prompt": "Qual palavra significa o oposto de 'alto'?",
        "options": ["baixo", "perto", "cedo"],
        "correct": "baixo",
    },
    "es": {
        "prompt": "¿Qué palabra significa lo opuesto de 'alto'?",
        "options": ["bajo", "cerca", "temprano"],
        "correct": "bajo",
    },
    "en": {
        "prompt": "Which word is the opposite of 'up'?",
        "options": ["down", "left", "right"],
        "correct": "down",
    },
}

_PRACTICE_INSTRUCTIONS: Dict[str, str] = {
    "en": "Choose the correct option.",
    "pt": "Escolha a opção correta.",
    "es": "Elige la opción correcta.",
}


def _story(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    return {
        "narrative": _STORY_NARRATIVES.get(target, _STORY_NARRATIVES["pt"]),
        "comprehension_questions": [_STORY_QA.get(explanation, _STORY_QA["en"])],
    }


def _conversation(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    return {
        "scenario": topic or "Greeting and small talk",
        "dialogue": _DIALOGUES.get(target, _DIALOGUES["pt"]),
    }


def _poetry(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    return {
        "lines": _POEMS.get(target, _POEMS["pt"]),
        "interpretation": _POEM_INTERP.get(explanation, _POEM_INTERP["en"]),
        "copyright": "Original work generated for Lexilume.",
    }


def _grammar(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    lang_data = _GRAMMAR_DATA.get(target, _GRAMMAR_DATA["pt"])
    return {
        "grammar_topic": topic or lang_data["default_topic"],
        "explanation": _GRAMMAR_EXPLANATION.get(explanation, _GRAMMAR_EXPLANATION["en"]),
        "examples": [{"sentence": lang_data["sentence"], "note": cefr}],
    }


def _vocabulary(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    lang_data = _VOCAB_DATA.get(target, _VOCAB_DATA["pt"])
    return {
        "lemma": topic or lang_data["lemma"],
        "part_of_speech": lang_data["pos"],
        "definition": _VOCAB_DEF.get(explanation, _VOCAB_DEF["en"]),
    }


def _academic_essay(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    # Academic essays are written in the target language so learners read C1/B2 discourse.
    copy = _ESSAY_TEXT.get(target, _ESSAY_TEXT["pt"])
    return {
        "topic": topic or copy["topic"],
        "thesis": copy["thesis"],
        "introduction": copy["introduction"],
        "arguments": [{"point": copy["point"]}],
        "conclusion": copy["conclusion"],
    }


def _cultural_article(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    return {
        "article_body": _CULTURAL_BODY.get(target, _CULTURAL_BODY["pt"]),
        "source_references": [
            {"source_name": "Lexilume Editorial (original summary)", "url": ""}
        ],
    }


def _practice(topic: str, target: str, explanation: str, cefr: str) -> Dict[str, Any]:
    item = _PRACTICE_DATA.get(target, _PRACTICE_DATA["pt"])
    return {
        "skill": "vocabulary",
        "exercise_type": "multiple_choice",
        "instructions": _PRACTICE_INSTRUCTIONS.get(explanation, _PRACTICE_INSTRUCTIONS["en"]),
        "questions": [{"prompt": item["prompt"], "options": item["options"], "correct": item["correct"]}],
        "correct_answers": [item["correct"]],
    }


_BODY_BUILDERS: Dict[str, Callable[[str, str, str, str], Dict[str, Any]]] = {
    "story": _story,
    "conversation": _conversation,
    "poetry": _poetry,
    "grammar": _grammar,
    "vocabulary": _vocabulary,
    "academic_essay": _academic_essay,
    "cultural_article": _cultural_article,
    "practice": _practice,
}


class DeterministicContentFallback:
    """Builds a type-specific body deterministically (no network)."""

    def build(
        self,
        content_type: str,
        topic: str = "",
        target_language: str = "pt",
        explanation_language: str = "en",
        cefr_level: str = "B1",
    ) -> Dict[str, Any]:
        builder = _BODY_BUILDERS.get(content_type)
        if builder is None:
            raise ValueError(f"Unsupported content type: {content_type}")
        return builder(topic, target_language, explanation_language, cefr_level)
