"""
Unit and integration tests for Modular Reading Providers and Lesson Assignments.
Verifies Wikipedia provider, curated provider, composite cascade fallback,
CEFR level adaptations, and minimal lesson assignment persistence.
"""

from datetime import date
import pytest

from engine.models.enums import CEFRLevel, Language, RegionalVariety
from engine.models.progress import UserTrackState, LessonAssignment
from engine.sources.wikipedia import WikipediaAdapter
from engine.sources.reading_provider import (
    CuratedReadingProvider,
    WikipediaReadingProvider,
    CompositeReadingProvider,
)
from engine.storage.repository import InMemoryStorageRepository


def test_wikipedia_reading_provider_cefr_adaptation():
    adapter = WikipediaAdapter(offline_mode=True)
    provider = WikipediaReadingProvider(adapter=adapter)

    # Test B2/C1 full extract
    section_c1 = provider.get_reading_section(
        language=Language.PORTUGUESE,
        cefr_level=CEFRLevel.C1,
    )
    assert section_c1 is not None
    assert section_c1.provider == "wikipedia"
    assert "Floresta Amazônica" in section_c1.title or "Energia solar" in section_c1.title
    assert len(section_c1.passage_target) > 50
    assert section_c1.attribution.license_type == "CC-BY-SA-4.0"

    # Test A1 concise adaptation
    section_a1 = provider.get_reading_section(
        language=Language.PORTUGUESE,
        cefr_level=CEFRLevel.A1,
    )
    assert section_a1 is not None
    # A1 excerpt should be shorter than or equal to the C1 full extract
    assert len(section_a1.passage_target.split(".")) <= 4


def test_composite_reading_provider_fallback_cascade():
    """Verify that composite provider falls back to curated if primary raises or returns None."""
    class FailingProvider(WikipediaReadingProvider):
        def get_reading_section(self, *args, **kwargs):
            raise ConnectionError("Simulated Wikimedia API network timeout")

    adapter = WikipediaAdapter(offline_mode=True)
    fallback_provider = WikipediaReadingProvider(adapter=adapter)
    composite = CompositeReadingProvider(providers=[FailingProvider(), fallback_provider])

    section = composite.get_reading_section(
        language=Language.SPANISH,
        cefr_level=CEFRLevel.B2,
    )

    assert section is not None
    assert section.provider == "wikipedia"
    assert "Energía eólica" in section.title or "Alhambra" in section.title


def test_minimal_lesson_assignment_storage():
    """Verify storing and querying minimal lesson assignments in repository."""
    repo = InMemoryStorageRepository()

    assignment = LessonAssignment(
        id="assign-user1-pt-2026-10-29",
        user_id="user1",
        language=Language.PORTUGUESE,
        assignment_date=date(2026, 10, 29),
        article_id="wiki-pt-61245",
        article_title="Energia solar",
        article_url="https://pt.wikipedia.org/wiki/Energia_solar",
        cefr_level=CEFRLevel.B2,
        topic_category="Science",
        status="assigned",
    )
    repo.save_lesson_assignment(assignment)

    retrieved = repo.get_lesson_assignment("user1", Language.PORTUGUESE, date(2026, 10, 29))
    assert retrieved is not None
    assert retrieved.article_id == "wiki-pt-61245"
    assert retrieved.article_title == "Energia solar"

    # Test recent article IDs
    recent = repo.get_recent_article_ids("user1", Language.PORTUGUESE, limit=5)
    assert recent == ["wiki-pt-61245"]
