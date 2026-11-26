"""
Concrete Discovery source adapters.

- ``FrequencyListAdapter`` and the Wiktionary/Tatoeba/Wikipedia wrappers are
  offline-safe (existing ``engine.sources`` fixtures).
- ``OpenLibraryDiscoveryAdapter``, ``WikidataDiscoveryAdapter``, and
  ``RssDiscoveryAdapter`` use injectable HTTP/text fetch functions so they can
  be tested without network access.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any, Callable, Dict, List, Optional

from .discovery import DiscoveryCategory, DiscoveryResource, DiscoverySourceAdapter
from .providers.http import post_json
from engine.sources.base import LicenseMetadata, SourceProvenance
from engine.sources.tatoeba import TatoebaAdapter
from engine.sources.wiktionary import WiktionaryAdapter
from engine.sources.wikipedia import WikipediaAdapter


def _provenance(
    source_id: str, source_name: str, source_url: str, license: LicenseMetadata
) -> SourceProvenance:
    return SourceProvenance(
        source_name=source_name,
        source_id=source_id,
        source_url=source_url,
        license=license,
    )


class FrequencyListAdapter(DiscoverySourceAdapter):
    """Local, deterministic common-vocabulary list with explicit attribution."""

    source_id = "frequency-list"

    _LISTS: Dict[str, List[tuple[str, int]]] = {
        "pt": [("casa", 1), ("água", 2), ("pão", 3)],
        "es": [("casa", 1), ("agua", 2), ("pan", 3)],
        "en": [("house", 1), ("water", 2), ("bread", 3)],
    }

    @property
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        return [DiscoveryCategory.VOCABULARY]

    @property
    def supported_languages(self) -> List[str]:
        return ["pt", "es", "en"]

    @property
    def license(self) -> LicenseMetadata:
        return LicenseMetadata(
            license_name="CC BY-SA 4.0",
            license_url="https://creativecommons.org/licenses/by-sa/4.0/",
            attribution_text="Wiktionary Frequency Lists (educational subset)",
        )

    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        items = self._LISTS.get(language, [])
        result: List[DiscoveryResource] = []
        source_url = f"https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/{language}"
        for lemma, rank in items[:limit]:
            result.append(
                DiscoveryResource(
                    id=f"{language}:{lemma}",
                    category=DiscoveryCategory.VOCABULARY,
                    title=lemma,
                    target_language=language,
                    explanation_language="en",
                    source_url=source_url,
                    provenance=_provenance(
                        self.source_id,
                        "Wiktionary Frequency Lists",
                        source_url,
                        self.license,
                    ),
                    facts={"lemma": lemma, "rank": rank},
                )
            )
        return result

    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        for lang in self.supported_languages:
            for resource in self.search("", lang):
                if resource.id == resource_id:
                    return resource
        return None

    def health_check(self) -> bool:
        return True


class TatoebaDiscoveryAdapter(DiscoverySourceAdapter):
    source_id = "tatoeba"

    def __init__(self) -> None:
        self._adapter = TatoebaAdapter(offline_mode=True)

    @property
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        return [DiscoveryCategory.SENTENCE]

    @property
    def supported_languages(self) -> List[str]:
        return ["pt", "es", "en"]

    @property
    def license(self) -> LicenseMetadata:
        return LicenseMetadata(
            license_name="CC BY 2.0 FR",
            license_url="https://creativecommons.org/licenses/by/2.0/fr/",
            attribution_text="Tatoeba",
        )

    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        examples = self._adapter.fetch_example_sentences(query, language, limit)
        resources: List[DiscoveryResource] = []
        for example in examples:
            resources.append(
                DiscoveryResource(
                    id=example.id,
                    category=DiscoveryCategory.SENTENCE,
                    title=example.sentence_target[:60],
                    target_language=language,
                    explanation_language="en",
                    source_url=example.provenance.source_url,
                    provenance=example.provenance,
                    facts={
                        "sentence": example.sentence_target,
                        "translation": example.sentence_translation,
                    },
                )
            )
        return resources

    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        for lang in self.supported_languages:
            for example in self._adapter._load_fixtures("", lang):
                if example.id == resource_id:
                    return DiscoveryResource(
                        id=example.id,
                        category=DiscoveryCategory.SENTENCE,
                        title=example.sentence_target[:60],
                        target_language=lang,
                        explanation_language="en",
                        source_url=example.provenance.source_url,
                        provenance=example.provenance,
                        facts={
                            "sentence": example.sentence_target,
                            "translation": example.sentence_translation,
                        },
                    )
        return None

    def health_check(self) -> bool:
        return True


class WiktionaryDiscoveryAdapter(DiscoverySourceAdapter):
    source_id = "wiktionary"

    def __init__(self) -> None:
        self._adapter = WiktionaryAdapter(offline_mode=True)

    @property
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        return [DiscoveryCategory.VOCABULARY]

    @property
    def supported_languages(self) -> List[str]:
        return ["pt", "es"]

    @property
    def license(self) -> LicenseMetadata:
        return LicenseMetadata(
            license_name="CC BY-SA",
            license_url="https://creativecommons.org/licenses/by-sa/3.0/",
            attribution_text="Wiktionary",
        )

    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        entry = self._adapter.fetch_dictionary_entry(query, language)
        if entry is None:
            return []
        return [
            DiscoveryResource(
                id=entry.source_id,
                category=DiscoveryCategory.VOCABULARY,
                title=entry.lemma,
                target_language=language,
                explanation_language="en",
                source_url=entry.provenance.source_url,
                provenance=entry.provenance,
                facts={
                    "lemma": entry.lemma,
                    "part_of_speech": entry.part_of_speech,
                    "definitions": entry.definitions_target,
                    "ipa": entry.phonetic_ipa,
                },
            )
        ]

    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        return None

    def health_check(self) -> bool:
        return True


class WikipediaDiscoveryAdapter(DiscoverySourceAdapter):
    source_id = "wikipedia"

    def __init__(self) -> None:
        self._adapter = WikipediaAdapter(offline_mode=True)

    @property
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        return [DiscoveryCategory.CULTURE, DiscoveryCategory.ARTICLE]

    @property
    def supported_languages(self) -> List[str]:
        return ["pt", "es"]

    @property
    def license(self) -> LicenseMetadata:
        return LicenseMetadata(
            license_name="CC BY-SA",
            license_url="https://creativecommons.org/licenses/by-sa/3.0/",
            attribution_text="Wikipedia",
        )

    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        article = self._adapter.fetch_article_summary(query, language)
        if article is None:
            return []
        return [
            DiscoveryResource(
                id=article.pageid,
                category=DiscoveryCategory.ARTICLE,
                title=article.title,
                target_language=language,
                explanation_language="en",
                cefr_level=article.cefr_level,
                summary=article.description or "",
                source_url=article.content_url,
                provenance=article.provenance,
                facts={"extract": article.extract, "category": article.topic_category},
            )
        ]

    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        return None

    def health_check(self) -> bool:
        return True


class OpenLibraryDiscoveryAdapter(DiscoverySourceAdapter):
    source_id = "openlibrary"

    def __init__(self, http_fn: Callable[..., Dict[str, Any]] = post_json) -> None:
        self.http_fn = http_fn

    @property
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        return [DiscoveryCategory.BOOK, DiscoveryCategory.AUTHOR]

    @property
    def supported_languages(self) -> List[str]:
        return ["en", "pt", "es"]

    @property
    def license(self) -> LicenseMetadata:
        return LicenseMetadata(
            license_name="Open Library data",
            license_url="https://openlibrary.org/developers/api",
            attribution_text="Open Library",
        )

    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        url = (
            "https://openlibrary.org/search.json?"
            f"q={query}&limit={limit}&fields=key,title,author_name,first_publish_year"
        )
        data = self.http_fn(url=url, headers={}, payload=None, timeout=10.0)
        docs = data.get("docs") or []
        resources: List[DiscoveryResource] = []
        for doc in docs:
            key = doc.get("key", "")
            resources.append(
                DiscoveryResource(
                    id=key,
                    category=DiscoveryCategory.BOOK,
                    title=doc.get("title", ""),
                    target_language=language,
                    explanation_language="en",
                    source_url=f"https://openlibrary.org{key}",
                    provenance=_provenance(
                        self.source_id, "Open Library", "https://openlibrary.org", self.license
                    ),
                    facts={"author": doc.get("author_name"), "year": doc.get("first_publish_year")},
                )
            )
        return resources

    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        url = f"https://openlibrary.org{resource_id}.json"
        data = self.http_fn(url=url, headers={}, payload=None, timeout=10.0)
        return DiscoveryResource(
            id=resource_id,
            category=DiscoveryCategory.BOOK,
            title=data.get("title", resource_id),
            target_language="en",
            explanation_language="en",
            source_url=f"https://openlibrary.org{resource_id}",
            provenance=_provenance(
                self.source_id, "Open Library", "https://openlibrary.org", self.license
            ),
            facts={"data": data},
        )

    def health_check(self) -> bool:
        return True


class WikidataDiscoveryAdapter(DiscoverySourceAdapter):
    source_id = "wikidata"

    def __init__(self, http_fn: Callable[..., Dict[str, Any]] = post_json) -> None:
        self.http_fn = http_fn

    @property
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        return [DiscoveryCategory.PLACE]

    @property
    def supported_languages(self) -> List[str]:
        return ["en", "pt", "es"]

    @property
    def license(self) -> LicenseMetadata:
        return LicenseMetadata(
            license_name="CC0",
            license_url="https://creativecommons.org/publicdomain/zero/1.0/",
            attribution_text="Wikidata",
        )

    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        url = (
            "https://www.wikidata.org/w/api.php?action=wbsearchentities"
            f"&search={query}&language={language}&limit={limit}&format=json"
        )
        data = self.http_fn(url=url, headers={}, payload=None, timeout=10.0)
        hits = data.get("search") or []
        resources: List[DiscoveryResource] = []
        for hit in hits:
            entity_id = hit.get("id", "")
            resources.append(
                DiscoveryResource(
                    id=entity_id,
                    category=DiscoveryCategory.PLACE,
                    title=hit.get("label", ""),
                    target_language=language,
                    explanation_language="en",
                    source_url=f"https://www.wikidata.org/wiki/{entity_id}",
                    provenance=_provenance(
                        self.source_id, "Wikidata", "https://www.wikidata.org", self.license
                    ),
                    facts={"description": hit.get("description", "")},
                )
            )
        return resources

    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        return None

    def health_check(self) -> bool:
        return True


class RssDiscoveryAdapter(DiscoverySourceAdapter):
    source_id = "rss"

    def __init__(
        self,
        feeds: Optional[List[str]] = None,
        fetch_text: Optional[Callable[[str], str]] = None,
    ) -> None:
        self.feeds = feeds or []
        self.fetch_text = fetch_text or (lambda url: "")

    @property
    def supported_resource_types(self) -> List[DiscoveryCategory]:
        return [DiscoveryCategory.ARTICLE]

    @property
    def supported_languages(self) -> List[str]:
        return ["en", "pt", "es"]

    @property
    def license(self) -> LicenseMetadata:
        return LicenseMetadata(
            license_name="Publisher terms",
            license_url="",
            attribution_text="Original publisher",
        )

    def _parse(self, xml_text: str) -> List[DiscoveryResource]:
        root = ET.fromstring(xml_text)
        resources: List[DiscoveryResource] = []
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            if not title or not link:
                continue
            resources.append(
                DiscoveryResource(
                    id=link,
                    category=DiscoveryCategory.ARTICLE,
                    title=title,
                    target_language="en",
                    explanation_language="en",
                    summary=(item.findtext("description") or "").strip()[:200],
                    source_url=link,
                    provenance=_provenance(
                        self.source_id, "RSS publisher", link, self.license
                    ),
                    facts={"published": (item.findtext("pubDate") or "").strip()},
                )
            )
        return resources

    def search(self, query: str, language: str, limit: int = 10) -> List[DiscoveryResource]:
        resources: List[DiscoveryResource] = []
        for feed_url in self.feeds:
            try:
                resources.extend(self._parse(self.fetch_text(feed_url)))
            except Exception:
                continue
        return resources[:limit]

    def fetch(self, resource_id: str) -> Optional[DiscoveryResource]:
        return None

    def health_check(self) -> bool:
        return bool(self.feeds)
