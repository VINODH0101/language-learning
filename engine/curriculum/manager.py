"""Curriculum selection and progression manager with recency avoidance and prerequisite checking."""

from typing import List, Dict, Optional
from engine.models.enums import Language, RegionalVariety, CEFRLevel
from engine.models.progress import UserTrackState
from engine.curriculum.syllabus import CurriculumNode


class EmptyCurriculumError(Exception):
    """Raised when no curriculum nodes are available for a given track."""
    pass


class CurriculumManager:
    """Manages syllabus progression, prerequisite resolution, and recency buffering."""

    def __init__(self, nodes: Optional[List[CurriculumNode]] = None):
        self._nodes_by_id: Dict[str, CurriculumNode] = {}
        self._nodes_by_lang: Dict[Language, List[CurriculumNode]] = {
            Language.PORTUGUESE: [],
            Language.SPANISH: [],
        }
        if nodes:
            for node in nodes:
                self.register_node(node)

    def register_node(self, node: CurriculumNode) -> None:
        self._nodes_by_id[node.id] = node
        self._nodes_by_lang[node.language].append(node)
        # Sort by level order then sequence order
        level_order = {lvl: idx for idx, lvl in enumerate(CEFRLevel.order())}
        self._nodes_by_lang[node.language].sort(
            key=lambda n: (level_order[n.cefr_level], n.sequence_order)
        )

    def get_node_by_id(self, node_id: str) -> Optional[CurriculumNode]:
        return self._nodes_by_id.get(node_id)

    def get_nodes_for_track(
        self,
        language: Language,
        cefr_level: Optional[CEFRLevel] = None,
        regional_variety: Optional[RegionalVariety] = None,
    ) -> List[CurriculumNode]:
        nodes = self._nodes_by_lang.get(language, [])
        if cefr_level:
            nodes = [n for n in nodes if n.cefr_level == cefr_level]
        if regional_variety and regional_variety != RegionalVariety.ALL:
            nodes = [
                n for n in nodes
                if n.regional_relevance in (RegionalVariety.ALL, regional_variety)
            ]
        return nodes

    def select_next_node(
        self,
        track_state: UserTrackState,
        force_node_id: Optional[str] = None,
        recency_window_size: int = 7,
    ) -> CurriculumNode:
        """Selects the next optimal curriculum node for a learner.
        
        Guarantees:
        - Respects prerequisite node dependencies.
        - Avoids repeating recently studied nodes (Requirement 12).
        - Matches learner's target regional variety.
        - Automatically advances CEFR levels when all nodes of current level are completed.
        - Handles review/consolidation phases.
        """
        if force_node_id:
            node = self.get_node_by_id(force_node_id)
            if node and node.language == track_state.language:
                return node

        all_lang_nodes = self.get_nodes_for_track(track_state.language)
        if not all_lang_nodes:
            raise EmptyCurriculumError(
                f"No curriculum nodes registered for language '{track_state.language.value}'."
            )

        # Filter by regional compatibility
        compatible_nodes = [
            n for n in all_lang_nodes
            if n.regional_relevance in (RegionalVariety.ALL, track_state.regional_variety)
        ]

        # 1. Look for uncompleted nodes at current CEFR level with prerequisites satisfied
        level_nodes = [n for n in compatible_nodes if n.cefr_level == track_state.current_cefr_level]
        uncompleted_level_nodes = [
            n for n in level_nodes
            if n.id not in track_state.completed_curriculum_node_ids
        ]

        # Prerequisite check: prerequisite must be None or already completed
        eligible_candidates = [
            n for n in uncompleted_level_nodes
            if (n.prerequisite_node_id is None or n.prerequisite_node_id in track_state.completed_curriculum_node_ids)
        ]

        if eligible_candidates:
            # Pick first eligible uncompleted node
            return eligible_candidates[0]

        # 2. If all nodes at current level are completed, check if higher levels exist
        current_idx = CEFRLevel.order().index(track_state.current_cefr_level)
        all_levels = CEFRLevel.order()

        for next_level in all_levels[current_idx + 1:]:
            higher_nodes = [
                n for n in compatible_nodes
                if n.cefr_level == next_level
                and n.id not in track_state.completed_curriculum_node_ids
                and (n.prerequisite_node_id is None or n.prerequisite_node_id in track_state.completed_curriculum_node_ids)
            ]
            if higher_nodes:
                return higher_nodes[0]

        # 3. All nodes through C1 are completed: review mode
        # Avoid repeating nodes inside the recency window
        recent_ids = set(track_state.recent_node_history[:recency_window_size])
        non_recent_nodes = [n for n in compatible_nodes if n.id not in recent_ids]

        if non_recent_nodes:
            # Prioritize consolidation nodes or oldest completed node
            consolidation = [n for n in non_recent_nodes if n.is_consolidation_review]
            if consolidation:
                return consolidation[0]
            return non_recent_nodes[0]

        # Fallback if entire curriculum fits inside recency window
        return compatible_nodes[0]

    def record_node_completion(
        self,
        track_state: UserTrackState,
        node: CurriculumNode,
        recency_window_size: int = 14,
    ) -> None:
        """Records that a learner finished a lesson for the specified node."""
        if node.id not in track_state.completed_curriculum_node_ids:
            track_state.completed_curriculum_node_ids.append(node.id)

        # Update recency queue (newest at index 0)
        if node.id in track_state.recent_node_history:
            track_state.recent_node_history.remove(node.id)
        track_state.recent_node_history.insert(0, node.id)
        if len(track_state.recent_node_history) > recency_window_size:
            track_state.recent_node_history = track_state.recent_node_history[:recency_window_size]

        track_state.current_curriculum_node_id = node.id
        track_state.total_lessons_completed += 1

        # Check if learner completed all nodes of their current level and can advance
        current_level_nodes = [
            n for n in self.get_nodes_for_track(track_state.language, track_state.current_cefr_level)
            if n.regional_relevance in (RegionalVariety.ALL, track_state.regional_variety)
        ]
        if current_level_nodes and all(n.id in track_state.completed_curriculum_node_ids for n in current_level_nodes):
            current_idx = CEFRLevel.order().index(track_state.current_cefr_level)
            if current_idx < len(CEFRLevel.order()) - 1:
                track_state.current_cefr_level = CEFRLevel.order()[current_idx + 1]
