"""Unit tests for curriculum management, prerequisites, and progression."""

import pytest
from engine.models.enums import Language, RegionalVariety, CEFRLevel, SkillCategory
from engine.models.progress import UserTrackState
from engine.curriculum.syllabus import create_node
from engine.curriculum.manager import CurriculumManager, EmptyCurriculumError


@pytest.fixture
def sample_nodes():
    n1 = create_node("pt-a1-01", Language.PORTUGUESE, CEFRLevel.A1, 1, "A1 Intro", "a1-intro", SkillCategory.GRAMMAR, "Can introduce", "Desc")
    n2 = create_node("pt-a1-02", Language.PORTUGUESE, CEFRLevel.A1, 2, "A1 Verbs", "a1-verbs", SkillCategory.GRAMMAR, "Can conjugate", "Desc", prereq="pt-a1-01")
    n3 = create_node("pt-a2-01", Language.PORTUGUESE, CEFRLevel.A2, 1, "A2 Past", "a2-past", SkillCategory.GRAMMAR, "Can speak in past", "Desc", prereq="pt-a1-02")
    n4 = create_node("pt-c1-br", Language.PORTUGUESE, CEFRLevel.C1, 1, "C1 BR", "c1-br", SkillCategory.GRAMMAR, "Can use BR idioms", "Desc", regional=RegionalVariety.PT_BR)
    n5 = create_node("pt-c1-pt", Language.PORTUGUESE, CEFRLevel.C1, 1, "C1 PT", "c1-pt", SkillCategory.GRAMMAR, "Can use PT clitics", "Desc", regional=RegionalVariety.PT_PT)
    return [n1, n2, n3, n4, n5]


def test_empty_curriculum_raises_error():
    mgr = CurriculumManager([])
    track = UserTrackState(user_id="u1", language=Language.PORTUGUESE, regional_variety=RegionalVariety.PT_BR)
    with pytest.raises(EmptyCurriculumError):
        mgr.select_next_node(track)


def test_prerequisite_enforcement(sample_nodes):
    mgr = CurriculumManager(sample_nodes)
    track = UserTrackState(user_id="u1", language=Language.PORTUGUESE, regional_variety=RegionalVariety.PT_BR)

    # First selected node must be pt-a1-01 because pt-a1-02 requires pt-a1-01
    node = mgr.select_next_node(track)
    assert node.id == "pt-a1-01"

    # Complete pt-a1-01
    mgr.record_node_completion(track, node)
    assert "pt-a1-01" in track.completed_curriculum_node_ids

    # Next node should now be pt-a1-02 since its prerequisite is satisfied
    node2 = mgr.select_next_node(track)
    assert node2.id == "pt-a1-02"


def test_level_progression(sample_nodes):
    mgr = CurriculumManager(sample_nodes)
    track = UserTrackState(user_id="u1", language=Language.PORTUGUESE, regional_variety=RegionalVariety.PT_BR, current_cefr_level=CEFRLevel.A1)

    node1 = mgr.get_node_by_id("pt-a1-01")
    mgr.record_node_completion(track, node1)
    node2 = mgr.get_node_by_id("pt-a1-02")
    mgr.record_node_completion(track, node2)

    # All A1 nodes completed, track level should advance to A2
    assert track.current_cefr_level == CEFRLevel.A2

    next_node = mgr.select_next_node(track)
    assert next_node.id == "pt-a2-01"


def test_regional_variety_filtering(sample_nodes):
    mgr = CurriculumManager(sample_nodes)
    track_br = UserTrackState(
        user_id="u_br",
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_BR,
        current_cefr_level=CEFRLevel.C1,
    )
    track_pt = UserTrackState(
        user_id="u_pt",
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_PT,
        current_cefr_level=CEFRLevel.C1,
    )

    br_node = mgr.select_next_node(track_br)
    assert br_node.id == "pt-c1-br"

    pt_node = mgr.select_next_node(track_pt)
    assert pt_node.id == "pt-c1-pt"


def test_recency_buffer_avoids_repetition(sample_nodes):
    mgr = CurriculumManager(sample_nodes)
    track = UserTrackState(
        user_id="u1",
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_BR,
        completed_curriculum_node_ids=["pt-a1-01", "pt-a1-02", "pt-a2-01", "pt-c1-br"],
        recent_node_history=["pt-c1-br"],
    )

    # In review mode, recently completed node pt-c1-br should be avoided
    next_node = mgr.select_next_node(track)
    assert next_node.id != "pt-c1-br"
