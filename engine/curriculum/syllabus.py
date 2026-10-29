"""Curriculum node schema and structured CEFR syllabus definitions for Portuguese and Spanish."""

from typing import List, Optional
from pydantic import BaseModel, Field
from engine.models.enums import Language, RegionalVariety, CEFRLevel, SkillCategory


class CurriculumNode(BaseModel):
    """A discrete pedagogical node in the CEFR progression graph."""
    id: str
    language: Language
    cefr_level: CEFRLevel
    sequence_order: int = Field(..., ge=1)
    title: str
    slug: str
    skill_category: SkillCategory
    can_do_statement: str
    regional_relevance: RegionalVariety = Field(default=RegionalVariety.ALL)
    prerequisite_node_id: Optional[str] = None
    is_consolidation_review: bool = False
    description: str


# Helper factory for curriculum nodes
def create_node(
    node_id: str,
    language: Language,
    cefr_level: CEFRLevel,
    sequence: int,
    title: str,
    slug: str,
    skill: SkillCategory,
    can_do: str,
    description: str,
    regional: RegionalVariety = RegionalVariety.ALL,
    prereq: Optional[str] = None,
    is_review: bool = False,
) -> CurriculumNode:
    return CurriculumNode(
        id=node_id,
        language=language,
        cefr_level=cefr_level,
        sequence_order=sequence,
        title=title,
        slug=slug,
        skill_category=skill,
        can_do_statement=can_do,
        description=description,
        regional_relevance=regional,
        prerequisite_node_id=prereq,
        is_consolidation_review=is_review,
    )
