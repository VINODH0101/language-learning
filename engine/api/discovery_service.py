"""
Discovery access service (wraps the DiscoveryManager with pagination/filters).
"""

from __future__ import annotations

from typing import List, Optional

from ..ai.discovery import DiscoveryCategory, DiscoveryResource
from ..ai.discovery_manager import DiscoveryManager
from .models import DiscoveryFilters, DiscoveryPage, MAX_PAGE_SIZE, paginate


class DiscoveryAccessService:
    def __init__(self, manager: DiscoveryManager) -> None:
        self.manager = manager

    def _validate(self, filters: DiscoveryFilters) -> None:
        if filters.page < 1:
            raise ValueError("page must be >= 1")
        if filters.page_size < 1 or filters.page_size > MAX_PAGE_SIZE:
            raise ValueError(f"pageSize must be between 1 and {MAX_PAGE_SIZE}")
        if filters.category is not None and filters.category not in [c.value for c in DiscoveryCategory]:
            raise ValueError(f"invalid category: {filters.category}")

    def list_discovery(self, query: str, language: str, filters: DiscoveryFilters) -> DiscoveryPage:
        self._validate(filters)
        items = self.manager.discover(query, language, limit=MAX_PAGE_SIZE).items
        items = self._apply_filters(items, filters)
        page_items, next_cursor = paginate(items, filters.page, filters.page_size)
        return DiscoveryPage(
            data=page_items,
            page=filters.page,
            page_size=filters.page_size,
            total=len(items),
            next_cursor=next_cursor,
        )

    def get_discovery(self, source_id: str, resource_id: str) -> Optional[DiscoveryResource]:
        return self.manager.fetch(source_id, resource_id)

    def categories(self) -> List[str]:
        return [c.value for c in DiscoveryCategory]

    def search(self, query: str, language: str, filters: DiscoveryFilters) -> DiscoveryPage:
        return self.list_discovery(query, language, filters)

    def _apply_filters(
        self, items: List[DiscoveryResource], filters: DiscoveryFilters
    ) -> List[DiscoveryResource]:
        result = items
        if filters.category:
            result = [it for it in result if it.category.value == filters.category]
        if filters.target_language:
            result = [it for it in result if it.target_language == filters.target_language]
        if filters.cefr_level:
            result = [it for it in result if it.cefr_level == filters.cefr_level]
        if filters.topic and any(it.topic == filters.topic for it in result):
            result = [it for it in result if it.topic == filters.topic]
        return result
