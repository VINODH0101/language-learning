"""
Deterministic content enrichment.

Computes metadata that the model must not be trusted to produce, e.g.
estimated reading time, tags, and provenance. Keeps generated explanations
separate from source facts where relevant.
"""

from __future__ import annotations

import unicodedata
from typing import Any, Dict, List

from .content_types import ContentType


def _estimate_read_minutes(text_length: int) -> int:
    # ~200 words per minute, 5.5 chars/word average heuristic.
    words = max(1, text_length // 6)
    return max(1, round(words / 200))


def _extract_text(content: Dict[str, Any], content_type: str) -> str:
    parts: List[str] = []
    for key in (
        "narrative",
        "article_body",
        "explanation",
        "introduction",
        "conclusion",
        "interpretation",
    ):
        if isinstance(content.get(key), str):
            parts.append(content[key])
    if content_type in ("conversation",) and isinstance(content.get("dialogue"), list):
        for turn in content["dialogue"]:
            if isinstance(turn, dict) and turn.get("line"):
                parts.append(turn["line"])
    if content_type == "poetry" and isinstance(content.get("lines"), list):
        parts.extend(str(line) for line in content["lines"])
    return "\n".join(parts)


def enrich(content_type: str, content: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of ``content`` enriched with deterministic metadata."""
    enriched = dict(content)

    meta = dict(enriched.get("meta") or {})
    text = _extract_text(content, content_type)
    meta["estimated_read_minutes"] = _estimate_read_minutes(len(text))

    title = str(meta.get("title", "")).strip()
    if title and not meta.get("tags"):
        meta["tags"] = [unicodedata.normalize("NFC", title.lower())]

    if not meta.get("provenance"):
        meta["provenance"] = {
            "source_name": "generated",
            "license_name": "internal",
            "attribution": "Lexilume Editorial",
        }

    enriched["meta"] = meta
    return enriched
