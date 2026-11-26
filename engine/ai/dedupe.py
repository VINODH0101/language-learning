"""
Deduplication helpers.

Duplicate detection prevents the same content from being stored or published
twice. Uses an exact canonical key (language + CEFR + normalized title) and,
optionally, a normalized body signature.
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
from typing import Any, Dict, Iterable, Set


def canonical_key(content_type: str, target_language: str, cefr_level: str, title: str) -> str:
    norm_title = _normalize(title)
    return f"{content_type}:{target_language}:{cefr_level}:{norm_title}"


def body_signature(content: Dict[str, Any]) -> str:
    """Stable signature of the body text (language-insensitive, NFC)."""
    text = _body_text(content)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _normalize(value: str) -> str:
    value = unicodedata.normalize("NFC", value or "").lower().strip()
    value = re.sub(r"\s+", " ", value)
    return value


def _body_text(content: Dict[str, Any]) -> str:
    parts = []
    for key in (
        "narrative",
        "article_body",
        "explanation",
        "introduction",
        "interpretation",
        "lemma",
        "definition",
        "instructions",
    ):
        if isinstance(content.get(key), str):
            parts.append(content[key])
    for key in ("dialogue", "lines", "questions"):
        if isinstance(content.get(key), list):
            for item in content[key]:
                if isinstance(item, dict):
                    parts.append(
                        str(item.get("line") or item.get("text") or item.get("prompt") or "")
                    )
                else:
                    parts.append(str(item))
    return _normalize("\n".join(parts))


class DuplicateDetector:
    """Checks drafts against a set of existing canonical keys and signatures."""

    def __init__(self, existing_keys: Iterable[str] = (), existing_signatures: Iterable[str] = ()):
        self._keys: Set[str] = set(existing_keys)
        self._signatures: Set[str] = set(existing_signatures)

    def is_duplicate(self, content_type: str, content: Dict[str, Any]) -> bool:
        meta = content.get("meta") or {}
        key = canonical_key(
            content_type,
            str(meta.get("target_language", "")),
            str(meta.get("cefr_level", "")),
            str(meta.get("title", "")),
        )
        if key in self._keys:
            return True
        if _body_text(content):
            sig = f"{content_type}:{body_signature(content)}"
            if sig in self._signatures or body_signature(content) in self._signatures:
                return True
        return False

    def register(self, content_type: str, content: Dict[str, Any]) -> None:
        meta = content.get("meta") or {}
        key = canonical_key(
            content_type,
            str(meta.get("target_language", "")),
            str(meta.get("cefr_level", "")),
            str(meta.get("title", "")),
        )
        self._keys.add(key)
        if _body_text(content):
            self._signatures.add(f"{content_type}:{body_signature(content)}")
