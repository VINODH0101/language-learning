"""
Versioned prompt templates for the eight content types.

Prompts instruct the model to emit ONLY the type-specific body fields. The
engine injects authoritative language/CEFR metadata itself so a model can
never change the target or explanation language.
"""

from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel


class PromptTemplate(BaseModel):
    content_type: str
    version: str
    system: str
    user: str


BODY_FIELDS: Dict[str, List[str]] = {
    "story": ["narrative", "comprehension_questions"],
    "conversation": ["scenario", "dialogue"],
    "poetry": ["lines", "interpretation", "copyright"],
    "grammar": ["grammar_topic", "explanation", "examples"],
    "vocabulary": ["lemma", "part_of_speech", "definition"],
    "academic_essay": ["topic", "thesis", "introduction", "arguments", "conclusion"],
    "cultural_article": ["article_body", "source_references"],
    "practice": ["skill", "exercise_type", "instructions", "questions", "correct_answers"],
}

_SYSTEM = (
    "You are a multilingual educational content writer for Lexilume. "
    "You write original, copyright-safe learning material. "
    "Respond with a single JSON object containing only the requested fields. "
    "Do not include prose outside the JSON."
)

_USER = (
    "Content type: {content_type}\n"
    "Target language (learning language): {target_language}\n"
    "Explanation language: {explanation_language}\n"
    "CEFR level: {cefr_level}\n"
    "Topic: {topic}\n"
    "Required JSON fields: {fields}\n"
    "Write pedagogically appropriate content for that CEFR level. "
    "For poetry, only original verse or verified public-domain work. "
    "For cultural/academic content, include source references for any factual claims."
)

PROMPT_TEMPLATES: Dict[str, PromptTemplate] = {
    content_type: PromptTemplate(
        content_type=content_type,
        version="1.0.0",
        system=_SYSTEM,
        user=_USER,
    )
    for content_type in BODY_FIELDS
}


def build_prompt(
    content_type: str,
    target_language: str,
    explanation_language: str,
    cefr_level: str,
    topic: str = "",
) -> str:
    template = PROMPT_TEMPLATES[content_type]
    fields = ", ".join(BODY_FIELDS[content_type])
    user = template.user.format(
        content_type=content_type,
        target_language=target_language,
        explanation_language=explanation_language,
        cefr_level=cefr_level,
        topic=topic or "general",
        fields=fields,
    )
    return f"{template.system}\n\n{user}"


def body_schema(content_type: str) -> Dict[str, object]:
    """JSON Schema for the type-specific body (meta injected by engine)."""
    from .schemas import CONTENT_SCHEMAS

    full = CONTENT_SCHEMAS.get(content_type) or {}
    props = {k: v for k, v in (full.get("properties") or {}).items() if k != "meta"}
    return {
        "type": "object",
        "properties": props,
        "required": BODY_FIELDS[content_type],
    }
