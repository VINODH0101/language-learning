"""
Content schema registry.

Loads the eight JSON Schema documents and exposes them by content type so the
generation engine and validation layer share a single source of truth.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

_SCHEMA_DIR = Path(__file__).resolve().parent

SCHEMA_FILES: Dict[str, str] = {
    "story": "story.json",
    "conversation": "conversation.json",
    "poetry": "poetry.json",
    "grammar": "grammar.json",
    "vocabulary": "vocabulary.json",
    "academic_essay": "academic_essay.json",
    "cultural_article": "cultural_article.json",
    "practice": "practice.json",
}

CONTENT_SCHEMAS: Dict[str, dict] = {}
COMMON_SCHEMA: dict = {}


def load_schemas() -> Dict[str, dict]:
    """Load all content schemas plus the common metadata definitions."""
    global CONTENT_SCHEMAS, COMMON_SCHEMA
    if CONTENT_SCHEMAS:
        return CONTENT_SCHEMAS

    common_path = _SCHEMA_DIR / "common.json"
    COMMON_SCHEMA = json.loads(common_path.read_text(encoding="utf-8"))

    for content_type, filename in SCHEMA_FILES.items():
        path = _SCHEMA_DIR / filename
        CONTENT_SCHEMAS[content_type] = json.loads(path.read_text(encoding="utf-8"))

    return CONTENT_SCHEMAS


def schema_names() -> List[str]:
    """Return the ordered list of content-type schema names."""
    return list(SCHEMA_FILES.keys())


# Eager-load on import so the registry is always available.
load_schemas()
