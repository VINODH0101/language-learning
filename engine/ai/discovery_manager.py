"""
Discovery aggregation manager and enrichment pipeline.

Reuses the ``DiscoverySourceAdapter`` contract and the ``engine.sources``
provenance/license models. Keeps source facts separate from generated
explanations and enforces attribution/license metadata.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from .discovery import DiscoveryResource, DiscoverySourceAdapter

# Deterministic function-word hints for language detection (weak heuristic only).
_FUNCTION_WORDS: Dict[str, List[str]] = {
    "pt": ["de", "a", "o", "que", "não", "uma", "para", "com", "por"],
    "es": ["de", "la", "el", "que", "no", "una", "para", "con", "por"],
    "en": ["the", "and", "of", "to", "in", "that", "is", "for", "on"],
}


class DiscoveryResult(BaseModel):
    items: List[DiscoveryResource] = Field(default_factory=list)
    errors: Dict[str, str] = Field(default_factory=dict)
    rejected: List[str] = Field(default_factory=list)


def detect_language(text: str) -> Optional[str]:
    """Return the most likely of pt/es/en, or None when inconclusive."""
    tokens = re.findall(r"[a-zà-ÿ']+", (text or "").lower())
    if not tokens:
        return None
    scores = {lang: 0 for lang in _FUNCTION_WORDS}
    for token in tokens:
        for lang, words in _FUNCTION_WORDS.items():
            if token in words:
                scores[lang] += 1
    best = max(scores, key=scores.get)  # type: ignore[arg-type]
    return best if scores[best] > 0 else None


def validate_attribution(resource: DiscoveryResource) -> bool:
    provenance = resource.provenance
    return bool(
        provenance
        and provenance.license
        and provenance.license.license_name
        and provenance.license.attribution_text
        and resource.source_url
    )


def enrich_resource(resource: DiscoveryResource) -> DiscoveryResource:
    """Add a learner-facing explanation that is explicitly distinct from facts."""
    if not resource.explanation:
        resource.explanation = (
            "Learner note: this item is presented for language practice. "
            "Facts come from the attributed source; this note is not a quotation."
        )
    if not resource.target_language:
        resource.target_language = detect_language(
            resource.title + " " + str(resource.facts)
        ) or "pt"
    return resource


class DiscoveryManager:
    """Aggregates discovery sources with per-source isolation.

    A failing source never blocks the others; missing attribution or license
    metadata causes an item to be rejected rather than published.
    """

    def __init__(self) -> None:
        self._sources: List[DiscoverySourceAdapter] = []

    def register(self, adapter: DiscoverySourceAdapter) -> None:
        self._sources.append(adapter)

    def sources(self) -> List[str]:
        return [s.source_id for s in self._sources]

    def discover(self, query: str, language: str, limit: int = 10) -> DiscoveryResult:
        result = DiscoveryResult()
        seen: set[tuple[str, str]] = set()

        for adapter in self._sources:
            try:
                if language not in adapter.supported_languages:
                    continue
                resources = adapter.search(query, language, limit)
                for resource in resources:
                    key = (resource.provenance.source_id, resource.id)
                    if key in seen:
                        continue
                    if not validate_attribution(resource):
                        result.rejected.append(f"{adapter.source_id}:{resource.id}")
                        continue
                    seen.add(key)
                    result.items.append(enrich_resource(resource))
            except Exception as exc:  # noqa: BLE001 - per-source isolation
                result.errors[adapter.source_id] = str(exc)

        return result

    def fetch(self, source_id: str, resource_id: str) -> Optional[DiscoveryResource]:
        for adapter in self._sources:
            if adapter.source_id == source_id:
                try:
                    return adapter.fetch(resource_id)
                except Exception:
                    return None
        return None
