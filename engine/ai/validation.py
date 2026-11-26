"""
Content validation: structural schema + content-quality checks.

Runs after provider/fallback output and before draft storage. A failed
validation keeps content in draft/rejected state — it is never published.
"""

from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field

from .content_types import CEFR_LEVELS, EXPLANATION_LANGUAGES, LEARNING_LANGUAGES
from .providers.http import validate_json_against_schema
from .schemas import COMMON_SCHEMA, CONTENT_SCHEMAS


class ValidationReport(BaseModel):
    passed: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


def _check_required(data: Dict[str, Any], required: List[str]) -> List[str]:
    return [f"missing required field: {field}" for field in required if field not in data]


class ContentValidator:
    """Structural + quality validation for generated content."""

    def validate(self, content_type: str, content: Dict[str, Any]) -> ValidationReport:
        errors: List[str] = []
        warnings: List[str] = []

        schema = CONTENT_SCHEMAS.get(content_type)
        if schema is None:
            return ValidationReport(passed=False, errors=[f"unknown content type: {content_type}"])

        meta = content.get("meta")
        if not isinstance(meta, dict):
            return ValidationReport(passed=False, errors=["missing meta object"])

        # Meta required fields + language/CEFR bounds.
        meta_required = COMMON_SCHEMA["$defs"]["meta"]["required"]
        errors.extend(_check_required(meta, meta_required))

        target = meta.get("target_language")
        if target not in LEARNING_LANGUAGES:
            errors.append("invalid target_language")
        explanation = meta.get("explanation_language")
        if explanation not in EXPLANATION_LANGUAGES:
            errors.append("invalid explanation_language")
        cefr = meta.get("cefr_level")
        if cefr not in CEFR_LEVELS:
            errors.append("invalid cefr_level")

        # Structural JSON-schema validation (nested properties, items, enums, bounds).
        schema_errors = validate_json_against_schema(
            content, schema, common_defs=COMMON_SCHEMA.get("$defs")
        )
        for err in schema_errors:
            if err not in errors:
                errors.append(err)

        # Quality checks.
        title = meta.get("title")
        if title and len(str(title).strip()) < 2:
            errors.append("title too short")

        if content_type == "poetry":
            copyright_note = str(content.get("copyright", "")).lower()
            if "copyright" not in copyright_note and "public domain" not in copyright_note and "original" not in copyright_note:
                warnings.append("poetry copyright/provenance not explicit")

        if content_type == "cultural_article":
            refs = content.get("source_references") or []
            if not refs:
                warnings.append("cultural article has no source references")

        return ValidationReport(
            passed=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )
