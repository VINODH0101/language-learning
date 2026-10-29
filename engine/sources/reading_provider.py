"""
Polyglot C1 Daily — Modular Reading Content Provider Architecture.

Provides pluggable, configurable reading content providers supporting
Wikipedia (pt.wikipedia.org / es.wikipedia.org), curated educational materials,
automatic fallback cascades, and CEFR-level presentation adaptations.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Set

from engine.models.content import Attribution, CuratedMaterial
from engine.models.enums import CEFRLevel, Language
from engine.models.lesson import ReadingSection
from engine.sources.wikipedia import WikipediaAdapter, WikipediaArticle

logger = logging.getLogger(__name__)


class BaseReadingProvider(ABC):
    """Abstract base class for reading content providers."""

    @abstractmethod
    def get_reading_section(
        self,
        language: Language,
        cefr_level: CEFRLevel,
        exclude_article_ids: Optional[Set[str]] = None,
        topic_category: Optional[str] = None,
    ) -> Optional[ReadingSection]:
        """Produce a validated ReadingSection or None if unavailable."""
        pass


class CuratedReadingProvider(BaseReadingProvider):
    """
    Reading provider backed by in-tree curated pedagogical materials.
    Preserves original curated reading passages and dialogue analyses.
    """

    def __init__(self, materials_pool: List[CuratedMaterial]):
        self.materials_pool = materials_pool

    def get_reading_section(
        self,
        language: Language,
        cefr_level: CEFRLevel,
        exclude_article_ids: Optional[Set[str]] = None,
        topic_category: Optional[str] = None,
    ) -> Optional[ReadingSection]:
        candidates = [
            m for m in self.materials_pool
            if m.language == language and m.material_type.value == "reading_passage"
        ]
        if not candidates:
            return None

        # Filter excluded if possible
        excluded = exclude_article_ids or set()
        available = [m for m in candidates if m.id not in excluded]
        passage = available[0] if available else candidates[0]

        questions_data = [
            {
                "question": q.question,
                "options": q.options,
                "correct_option_index": q.correct_option_index,
                "explanation": q.explanation,
            }
            for q in passage.comprehension_questions
        ]

        return ReadingSection(
            title=passage.title,
            passage_target=passage.content_target,
            passage_en=passage.content_en,
            glossary=passage.glossary or {},
            comprehension_questions=questions_data,
            attribution=passage.attribution,
            article_url=passage.attribution.source_url,
            thumbnail_url=None,
            topic_category="Curated Lesson",
            provider="curated",
            article_id=passage.id,
        )


class WikipediaReadingProvider(BaseReadingProvider):
    """
    Reading provider backed by Wikipedia authentic articles via Wikimedia REST API.
    Adapts text length and scaffolding according to CEFR level (A1-C1).
    """

    def __init__(self, adapter: Optional[WikipediaAdapter] = None):
        self.adapter = adapter or WikipediaAdapter()

    def _adapt_passage_for_cefr(self, extract: str, level: CEFRLevel) -> str:
        """
        Adjust reading passage presentation to match CEFR level:
        - A1-B1: Concise introductory excerpt (first 2-3 sentences)
        - B2-C1: Full authentic extract with complex syntax
        """
        if level in [CEFRLevel.A1, CEFRLevel.A2]:
            sentences = [s.strip() for s in extract.split(".") if len(s.strip()) > 10]
            return ". ".join(sentences[:2]) + "." if len(sentences) >= 2 else extract
        elif level == CEFRLevel.B1:
            sentences = [s.strip() for s in extract.split(".") if len(s.strip()) > 10]
            return ". ".join(sentences[:3]) + "." if len(sentences) >= 3 else extract
        return extract

    def get_reading_section(
        self,
        language: Language,
        cefr_level: CEFRLevel,
        exclude_article_ids: Optional[Set[str]] = None,
        topic_category: Optional[str] = None,
    ) -> Optional[ReadingSection]:
        lang_str = language.value
        level_str = cefr_level.value
        exclude_list = list(exclude_article_ids or set())

        article: Optional[WikipediaArticle] = self.adapter.fetch_daily_article(
            language=lang_str,
            cefr_level=level_str,
            topic_category=topic_category,
            exclude_article_ids=exclude_list,
        )

        if not article:
            return None

        # Build vocabulary glossary from key_vocabulary
        glossary: Dict[str, str] = {}
        for item in article.key_vocabulary:
            term = item.get("term", "")
            def_target = item.get(f"definition_{lang_str}", item.get("definition_pt", item.get("definition_es", "")))
            def_en = item.get("definition_en", "")
            if term:
                glossary[term] = f"{def_target} ({def_en})" if def_en else def_target

        adapted_text = self._adapt_passage_for_cefr(article.extract, cefr_level)

        attribution = Attribution(
            source_name=article.provenance.source_name,
            source_url=article.provenance.source_url,
            license_type=article.provenance.license.license_name,
            attribution_text=article.provenance.license.attribution_text,
            terms_url=article.provenance.license.license_url,
        )

        return ReadingSection(
            title=article.title,
            passage_target=adapted_text,
            passage_en=f"[{article.description}]" if article.description else None,
            glossary=glossary,
            comprehension_questions=article.comprehension_questions,
            attribution=attribution,
            article_url=article.content_url,
            thumbnail_url=article.thumbnail_url,
            topic_category=article.topic_category,
            provider="wikipedia",
            article_id=f"wiki-{lang_str}-{article.pageid}",
        )


class CompositeReadingProvider(BaseReadingProvider):
    """
    Orchestrates multiple reading providers in configurable priority order.
    Attempts preferred provider first; on failure, cascades to secondary providers.
    """

    def __init__(
        self,
        providers: List[BaseReadingProvider],
        provider_preference: Optional[List[str]] = None,
    ):
        self.providers = providers
        self.provider_preference = provider_preference or ["wikipedia", "curated"]

    def get_reading_section(
        self,
        language: Language,
        cefr_level: CEFRLevel,
        exclude_article_ids: Optional[Set[str]] = None,
        topic_category: Optional[str] = None,
    ) -> Optional[ReadingSection]:
        for provider in self.providers:
            try:
                section = provider.get_reading_section(
                    language=language,
                    cefr_level=cefr_level,
                    exclude_article_ids=exclude_article_ids,
                    topic_category=topic_category,
                )
                if section and section.passage_target:
                    logger.debug(f"Reading section successfully supplied by {provider.__class__.__name__}")
                    return section
            except Exception as e:
                logger.warning(f"Error in {provider.__class__.__name__}: {e}; cascading to next provider.")
                continue

        logger.error("All reading providers in cascade failed.")
        return None
