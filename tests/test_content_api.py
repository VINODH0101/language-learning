"""
Tests for the shared content/discovery access service (Phase 7).
"""

from __future__ import annotations

import pytest

from engine.ai import DiscoveryCategory, DiscoveryManager, FrequencyListAdapter
from engine.api import (
    ContentAccessService,
    ContentFilters,
    ContentRecord,
    DiscoveryAccessService,
    DiscoveryFilters,
    InMemoryContentRepository,
)


def _record(
    item_id: str,
    content_type: str,
    target: str,
    cefr: str,
    title: str,
    status: str = "published",
    explanation: str = "en",
    published_at: str = "2026-01-01",
) -> ContentRecord:
    return ContentRecord(
        id=item_id,
        content_type=content_type,
        target_language=target,
        explanation_language=explanation,
        cefr_level=cefr,
        title=title,
        summary=f"Summary of {title}",
        tags=[title.lower()],
        status=status,
        current_version_id=f"v-{item_id}",
        published_at=published_at,
        body={"text": title},
    )


def _seeded_service() -> ContentAccessService:
    repo = InMemoryContentRepository(
        items=[
            _record("s1", "story", "pt", "B1", "A história da cidade", published_at="2026-01-03"),
            _record("s2", "story", "pt", "B2", "O mercado antigo", published_at="2026-01-02"),
            _record("g1", "grammar", "es", "A2", "Presente de indicativo", published_at="2026-01-04"),
            _record("v1", "vocabulary", "pt", "A1", "casa"),
            _record("draft1", "story", "pt", "B1", "Rascunho secreto", status="draft"),
        ]
    )
    return ContentAccessService(repo)


def test_list_content_filters_by_type_and_language():
    service = _seeded_service()
    page = service.list_content(
        ContentFilters(content_type="story", target_language="pt", page_size=10)
    )
    assert page.total == 2
    assert {it.id for it in page.data} == {"s1", "s2"}


def test_draft_is_never_visible():
    service = _seeded_service()
    assert service.get_content("draft1") is None
    ids = {it.id for it in service.list_content(ContentFilters(page_size=50)).data}
    assert "draft1" not in ids


def test_pagination_cursor():
    service = _seeded_service()
    page = service.list_content(ContentFilters(page_size=2, sort="recent"))
    assert len(page.data) == 2
    assert page.next_cursor == 2
    page2 = service.list_content(ContentFilters(page_size=2, page=2, sort="recent"))
    assert len(page2.data) == 2
    assert page2.next_cursor is None


def test_version_restriction():
    service = _seeded_service()
    assert service.get_content("s1", version="v-s1") is not None
    assert service.get_content("s1", version="wrong") is None


def test_search():
    service = _seeded_service()
    page = service.search("mercado", ContentFilters(page_size=10))
    assert page.total == 1
    assert page.data[0].id == "s2"


def test_vocabulary_and_grammar_endpoints():
    service = _seeded_service()
    assert [it.id for it in service.vocabulary("pt")] == ["v1"]
    assert [it.id for it in service.grammar("es")] == ["g1"]


def test_recommendations_respect_language_and_cefr():
    service = _seeded_service()
    recs = service.recommendations("pt", "B1", limit=5)
    assert {it.id for it in recs} == {"s1"}


def test_invalid_filters_raise():
    service = _seeded_service()
    with pytest.raises(ValueError):
        service.list_content(ContentFilters(content_type="nope"))
    with pytest.raises(ValueError):
        service.list_content(ContentFilters(target_language="fr"))
    with pytest.raises(ValueError):
        service.list_content(ContentFilters(page_size=999))


def test_discovery_access_service():
    manager = DiscoveryManager()
    manager.register(FrequencyListAdapter())
    service = DiscoveryAccessService(manager)

    assert "vocabulary" in service.categories()

    page = service.list_discovery("", "pt", DiscoveryFilters(page_size=10))
    assert page.total >= 1
    assert page.data[0].category == DiscoveryCategory.VOCABULARY
