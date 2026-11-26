"""
Shared content/discovery access service (Phase 7).

A single server-side service consumed by every learner module. It enforces
published-visibility rules, validates filters, and paginates results. The
HTTP transport (FastAPI / Supabase Edge Functions) is a later layer; these
services are transport-agnostic.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from ..ai.content_types import CEFR_LEVELS, ContentType
from ..ai.discovery import DiscoveryCategory, DiscoveryResource

LEARNING_LANGUAGES = ["en", "pt", "es"]
EXPLANATION_LANGUAGES = ["en", "pt", "es"]
MAX_PAGE_SIZE = 50


class ContentRecord(BaseModel):
    id: str
    content_type: str
    target_language: str
    explanation_language: str
    cefr_level: str
    title: str
    summary: str = ""
    topic: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    status: str = "published"
    current_version_id: Optional[str] = None
    estimated_read_minutes: int = 1
    published_at: str = ""
    body: Dict[str, Any] = Field(default_factory=dict)
    activities: List[Dict[str, Any]] = Field(default_factory=list)


class ContentListItem(BaseModel):
    id: str
    content_type: str
    target_language: str
    explanation_language: str
    cefr_level: str
    title: str
    summary: str
    topic: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    current_version_id: Optional[str] = None
    estimated_read_minutes: int = 1
    published_at: str = ""


class ContentFilters(BaseModel):
    content_type: Optional[str] = None
    target_language: Optional[str] = None
    explanation_language: Optional[str] = None
    cefr_level: Optional[str] = None
    topic: Optional[str] = None
    page: int = 1
    page_size: int = 20
    sort: str = "recent"


class ContentPage(BaseModel):
    data: List[ContentListItem]
    page: int
    page_size: int
    total: int
    next_cursor: Optional[int] = None


class DiscoveryFilters(BaseModel):
    target_language: Optional[str] = None
    explanation_language: Optional[str] = None
    cefr_level: Optional[str] = None
    category: Optional[str] = None
    topic: Optional[str] = None
    page: int = 1
    page_size: int = 20


class DiscoveryPage(BaseModel):
    data: List[DiscoveryResource]
    page: int
    page_size: int
    total: int
    next_cursor: Optional[int] = None


def validate_filters(filters: ContentFilters) -> None:
    if filters.content_type is not None and filters.content_type not in [c.value for c in ContentType]:
        raise ValueError(f"invalid content_type: {filters.content_type}")
    if filters.target_language is not None and filters.target_language not in LEARNING_LANGUAGES:
        raise ValueError(f"invalid targetLanguage: {filters.target_language}")
    if filters.explanation_language is not None and filters.explanation_language not in EXPLANATION_LANGUAGES:
        raise ValueError(f"invalid explanationLanguage: {filters.explanation_language}")
    if filters.cefr_level is not None and filters.cefr_level not in CEFR_LEVELS:
        raise ValueError(f"invalid cefrLevel: {filters.cefr_level}")
    if filters.page < 1:
        raise ValueError("page must be >= 1")
    if filters.page_size < 1 or filters.page_size > MAX_PAGE_SIZE:
        raise ValueError(f"pageSize must be between 1 and {MAX_PAGE_SIZE}")


def paginate(items: List[Any], page: int, page_size: int) -> tuple[List[Any], Optional[int]]:
    start = (page - 1) * page_size
    end = start + page_size
    page_items = items[start:end]
    next_cursor = page + 1 if end < len(items) else None
    return page_items, next_cursor


def _sort(items: List[ContentRecord], sort: str) -> List[ContentRecord]:
    if sort == "title":
        return sorted(items, key=lambda it: it.title.lower())
    return sorted(items, key=lambda it: it.published_at, reverse=True)


def _to_list_item(record: ContentRecord) -> ContentListItem:
    return ContentListItem(**record.model_dump(include=set(ContentListItem.model_fields)))
