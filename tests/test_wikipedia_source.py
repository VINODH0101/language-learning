"""
Unit tests for Wikipedia authentic reading source adapter.
Verifies Portuguese and Spanish REST retrieval, offline fixtures,
provenance metadata under CC BY-SA 4.0, CEFR categorization,
deduplication via exclude lists, and integration in SourceManager.
"""

import pytest
from engine.sources.wikipedia import WikipediaAdapter, WIKIPEDIA_LICENSE
from engine.sources.registry import SourceManager


def test_wikipedia_adapter_offline_fixture_pt():
    adapter = WikipediaAdapter(offline_mode=True)
    article = adapter.fetch_article_summary("Energia solar", "pt")

    assert article is not None
    assert article.pageid == "61245"
    assert article.title == "Energia solar"
    assert article.language == "pt"
    assert article.cefr_level in ["B1", "B2", "C1"]
    assert "renovável" in article.extract
    assert article.thumbnail_url is not None
    assert "upload.wikimedia.org" in article.thumbnail_url
    assert "pt.wikipedia.org" in article.content_url
    assert article.provenance.license.license_name == "CC-BY-SA-4.0"
    assert len(article.comprehension_questions) > 0


def test_wikipedia_adapter_offline_fixture_es():
    adapter = WikipediaAdapter(offline_mode=True)
    article = adapter.fetch_article_summary("Energía eólica", "es")

    assert article is not None
    assert article.pageid == "31920"
    assert article.title == "Energía eólica"
    assert article.language == "es"
    assert "cinética" in article.extract
    assert article.provenance.license.license_name == "CC-BY-SA-4.0"
    assert len(article.comprehension_questions) > 0
    assert article.comprehension_questions[0]["correct_option_index"] == 0


def test_wikipedia_adapter_exclude_recent_articles():
    adapter = WikipediaAdapter(offline_mode=True)
    # Exclude the first fixture ("61245" / "Energia solar")
    article = adapter.fetch_daily_article(
        language="pt",
        cefr_level="B2",
        exclude_article_ids=["61245", "Energia solar", "wiki-pt-61245"],
    )

    assert article is not None
    assert article.pageid != "61245"
    assert article.title != "Energia solar"


def test_wikipedia_adapter_missing_article_handling():
    adapter = WikipediaAdapter(offline_mode=True)
    article = adapter.fetch_article_summary("NonexistentTitleXYZ999", "pt")
    assert article is None


def test_source_manager_coexistence():
    """Verify that Wikipedia coexists harmoniously with Wiktionary, Tatoeba, and Wikimedia Commons."""
    manager = SourceManager(offline_mode=True)

    # 1. Wiktionary + Tatoeba + Wikimedia Commons word package
    word_pkg = manager.fetch_word_package("prerrogativa", "pt")
    assert word_pkg is not None
    assert word_pkg.lemma == "prerrogativa"
    assert word_pkg.provenance.license.license_name == "CC-BY-SA-3.0"

    # 2. Wikipedia reading article
    reading_art = manager.fetch_reading_article("pt", cefr_level="C1")
    assert reading_art is not None
    assert reading_art.provenance.license.license_name == "CC-BY-SA-4.0"
    assert "Wikipedia" in reading_art.provenance.source_name
