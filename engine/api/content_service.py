"""
Content access service + in-memory repository.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional

from .models import (
    MAX_PAGE_SIZE,
    ContentFilters,
    ContentListItem,
    ContentPage,
    ContentRecord,
    _sort,
    _to_list_item,
    paginate,
    validate_filters,
)


class ContentRepository(ABC):
    @abstractmethod
    def published_items(self) -> List[ContentRecord]: ...

    @abstractmethod
    def get_item(self, item_id: str) -> Optional[ContentRecord]: ...


class InMemoryContentRepository(ContentRepository):
    def __init__(self, items: Optional[List[ContentRecord]] = None) -> None:
        self._items = {item.id: item for item in (items or [])}

    def publish(self, item: ContentRecord) -> None:
        item.status = "published"
        self._items[item.id] = item

    def published_items(self) -> List[ContentRecord]:
        return [item for item in self._items.values() if item.status == "published"]

    def get_item(self, item_id: str) -> Optional[ContentRecord]:
        item = self._items.get(item_id)
        if item is None or item.status != "published":
            return None
        return item


class ContentAccessService:
    """Published-content access consumed by Home/Learn/Reader/Vocab/Grammar/Practice."""

    def __init__(self, repository: ContentRepository) -> None:
        self.repository = repository

    def list_content(self, filters: ContentFilters) -> ContentPage:
        validate_filters(filters)
        items = _sort(self.repository.published_items(), filters.sort)
        items = self._apply_filters(items, filters)
        page_items, next_cursor = paginate(items, filters.page, filters.page_size)
        return ContentPage(
            data=[_to_list_item(it) for it in page_items],
            page=filters.page,
            page_size=filters.page_size,
            total=len(items),
            next_cursor=next_cursor,
        )

    def get_content(self, item_id: str, version: Optional[str] = None) -> Optional[ContentRecord]:
        item = self.repository.get_item(item_id)
        if item is None:
            return None
        if version is not None and item.current_version_id != version:
            return None
        return item

    def get_activities(self, item_id: str) -> List[dict]:
        item = self.repository.get_item(item_id)
        return item.activities if item else []

    def search(self, query: str, filters: ContentFilters) -> ContentPage:
        validate_filters(filters)
        q = query.strip().lower()
        items = self._apply_filters(self.repository.published_items(), filters)
        if q:
            items = [
                it
                for it in items
                if q in it.title.lower()
                or q in it.summary.lower()
                or any(q in tag.lower() for tag in it.tags)
            ]
        items = _sort(items, filters.sort)
        page_items, next_cursor = paginate(items, filters.page, filters.page_size)
        return ContentPage(
            data=[_to_list_item(it) for it in page_items],
            page=filters.page,
            page_size=filters.page_size,
            total=len(items),
            next_cursor=next_cursor,
        )

    def vocabulary(self, target_language: str, explanation_language: str = "en") -> List[ContentListItem]:
        filters = ContentFilters(
            content_type="vocabulary",
            target_language=target_language,
            explanation_language=explanation_language,
            page_size=MAX_PAGE_SIZE,
        )
        return self.list_content(filters).data

    def grammar(self, target_language: str, explanation_language: str = "en") -> List[ContentListItem]:
        filters = ContentFilters(
            content_type="grammar",
            target_language=target_language,
            explanation_language=explanation_language,
            page_size=MAX_PAGE_SIZE,
        )
        return self.list_content(filters).data

    def daily(self) -> ContentPage:
        filters = ContentFilters(sort="recent", page_size=3)
        return self.list_content(filters)

    def recommendations(
        self, target_language: str, cefr_level: str, limit: int = 5
    ) -> List[ContentListItem]:
        filters = ContentFilters(
            target_language=target_language,
            cefr_level=cefr_level,
            sort="recent",
            page_size=limit,
        )
        return self.list_content(filters).data

    def _apply_filters(
        self, items: List[ContentRecord], filters: ContentFilters
    ) -> List[ContentRecord]:
        result = items
        if filters.content_type:
            result = [it for it in result if it.content_type == filters.content_type]
        if filters.target_language:
            result = [it for it in result if it.target_language == filters.target_language]
        if filters.explanation_language:
            result = [it for it in result if it.explanation_language == filters.explanation_language]
        if filters.cefr_level:
            result = [it for it in result if it.cefr_level == filters.cefr_level]
        if filters.topic:
            result = [it for it in result if it.topic == filters.topic]
        return result
