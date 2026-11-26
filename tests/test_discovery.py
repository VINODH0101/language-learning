"""
Tests for the Discovery engine (Phase 6).
"""

from __future__ import annotations

from typing import Any, Dict, List

import pytest

from engine.ai import (
    DiscoveryCategory,
    DiscoveryManager,
    DiscoveryResource,
    DiscoverySourceAdapter,
    FrequencyListAdapter,
    OpenLibraryDiscoveryAdapter,
    RssDiscoveryAdapter,
    TatoebaDiscoveryAdapter,
    WikidataDiscoveryAdapter,
    WikipediaDiscoveryAdapter,
    WiktionaryDiscoveryAdapter,
    detect_language,
)
from engine.sources.base import LicenseMetadata, SourceProvenance


def _license() -> LicenseMetadata:
    return LicenseMetadata(license_name="CC BY-SA", license_url="https://example.org", attribution_text="Source")


def _provenance(source_id: str, url: str = "https://example.org/x") -> SourceProvenance:
    return SourceProvenance(
        source_name=source_id, source_id=source_id, source_url=url, license=_license()
    )


class FailingAdapter(DiscoverySourceAdapter):
    source_id = "broken"

    @property
    def supported_resource_types(self):
        return [DiscoveryCategory.ARTICLE]

    @property
    def supported_languages(self):
        return ["pt", "es", "en"]

    @property
    def license(self):
        return _license()

    def search(self, query, language, limit=10):
        raise RuntimeError("boom")

    def fetch(self, resource_id):
        return None

    def health_check(self):
        return False


class MissingAttributionAdapter(DiscoverySourceAdapter):
    source_id = "noattrib"

    @property
    def supported_resource_types(self):
        return [DiscoveryCategory.ARTICLE]

    @property
    def supported_languages(self):
        return ["pt", "es", "en"]

    @property
    def license(self):
        return _license()

    def search(self, query, language, limit=10):
        return [
            DiscoveryResource(
                id="x",
                category=DiscoveryCategory.ARTICLE,
                title="No attribution",
                target_language=language,
                explanation_language="en",
                source_url="",
                provenance=SourceProvenance(
                    source_name="noattrib",
                    source_id="noattrib",
                    source_url="",
                    license=LicenseMetadata(license_name="", license_url="", attribution_text=""),
                ),
            )
        ]

    def fetch(self, resource_id):
        return None

    def health_check(self):
        return True


def test_frequency_list_returns_attributed_vocabulary():
    adapter = FrequencyListAdapter()
    resources = adapter.search("", "pt", limit=2)
    assert len(resources) == 2
    assert resources[0].category == DiscoveryCategory.VOCABULARY
    assert resources[0].provenance.license.attribution_text != ""


def test_manager_isolates_failing_source():
    manager = DiscoveryManager()
    manager.register(FrequencyListAdapter())
    manager.register(FailingAdapter())
    result = manager.discover("", "pt")
    assert len(result.items) >= 1
    assert "broken" in result.errors


def test_manager_rejects_missing_attribution():
    manager = DiscoveryManager()
    manager.register(MissingAttributionAdapter())
    result = manager.discover("", "pt")
    assert result.items == []
    assert "noattrib:x" in result.rejected


def test_manager_deduplicates_by_source_and_id():
    class DupAdapter(DiscoverySourceAdapter):
        source_id = "dup"

        @property
        def supported_resource_types(self):
            return [DiscoveryCategory.ARTICLE]

        @property
        def supported_languages(self):
            return ["pt"]

        @property
        def license(self):
            return _license()

        def search(self, query, language, limit=10):
            return [
                DiscoveryResource(
                    id="same",
                    category=DiscoveryCategory.ARTICLE,
                    title="T",
                    target_language="pt",
                    explanation_language="en",
                    source_url="https://example.org/x",
                    provenance=_provenance("dup"),
                ),
                DiscoveryResource(
                    id="same",
                    category=DiscoveryCategory.ARTICLE,
                    title="T",
                    target_language="pt",
                    explanation_language="en",
                    source_url="https://example.org/x",
                    provenance=_provenance("dup"),
                ),
            ]

        def fetch(self, resource_id):
            return None

        def health_check(self):
            return True

    manager = DiscoveryManager()
    manager.register(DupAdapter())
    result = manager.discover("", "pt")
    assert len(result.items) == 1


def test_detect_language_heuristic():
    assert detect_language("the house is on the hill") == "en"
    assert detect_language("a casa está no monte e na água") == "pt"
    assert detect_language("12345 !!!") is None


def test_open_library_search_with_fake_http():
    def fake_http(**kw):
        return {"docs": [{"key": "/works/OL1W", "title": "Book", "author_name": ["A"], "first_publish_year": 2000}]}

    adapter = OpenLibraryDiscoveryAdapter(http_fn=fake_http)
    resources = adapter.search("book", "en")
    assert len(resources) == 1
    assert resources[0].title == "Book"
    assert resources[0].source_url == "https://openlibrary.org/works/OL1W"


def test_wikidata_search_with_fake_http():
    def fake_http(**kw):
        return {"search": [{"id": "Q90", "label": "Paris", "description": "capital"}]}

    adapter = WikidataDiscoveryAdapter(http_fn=fake_http)
    resources = adapter.search("paris", "en")
    assert len(resources) == 1
    assert resources[0].id == "Q90"


def test_rss_parse_with_fake_feed():
    xml = (
        '<?xml version="1.0"?><rss version="2.0"><channel>'
        "<item><title>Hello</title><link>https://example.org/1</link>"
        "<description>desc</description><pubDate>2026-01-01</pubDate></item>"
        "</channel></rss>"
    )
    adapter = RssDiscoveryAdapter(feeds=["https://example.org/feed"], fetch_text=lambda url: xml)
    resources = adapter.search("", "en")
    assert len(resources) == 1
    assert resources[0].title == "Hello"


@pytest.mark.parametrize(
    "adapter",
    [TatoebaDiscoveryAdapter(), WiktionaryDiscoveryAdapter(), WikipediaDiscoveryAdapter()],
)
def test_offline_source_adapters_do_not_raise(adapter):
    resources = adapter.search("casa", "pt", limit=2)
    assert isinstance(resources, list)
    assert adapter.health_check() is True
