"""Seed data loader parsing and validating educational datasets with attribution preservation."""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from engine.models.enums import Language, RegionalVariety, CEFRLevel, SkillCategory, ExerciseType, MaterialType, LicenseType
from engine.models.content import (
    Attribution,
    VocabularyItem,
    GrammarRule,
    CuratedMaterial,
    ExerciseTemplate,
    FalseFriendItem,
)
from engine.models.lesson import FurtherResource
from engine.models.diagnostic import DiagnosticQuestion
from engine.curriculum.syllabus import CurriculumNode


class SeedDataLoader:
    """Loads and validates JSON educational datasets into typed domain entities."""

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            self.data_dir = Path(__file__).resolve().parent.parent / "data"
        else:
            self.data_dir = Path(data_dir)

    def load_licenses(self) -> Dict[str, Attribution]:
        path = self.data_dir / "licenses.json"
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {key: Attribution(**val) for key, val in data.items()}

    def load_curriculum_nodes(self, language: Optional[Language] = None) -> List[CurriculumNode]:
        nodes: List[CurriculumNode] = []
        files = []
        if language is None or language == Language.PORTUGUESE:
            files.append(self.data_dir / "pt_curriculum.json")
        if language is None or language == Language.SPANISH:
            files.append(self.data_dir / "es_curriculum.json")

        for fpath in files:
            if fpath.exists():
                with open(fpath, "r", encoding="utf-8") as f:
                    raw_list = json.load(f)
                for item in raw_list:
                    nodes.append(CurriculumNode(**item))
        return nodes

    def load_vocabulary(self, language: Optional[Language] = None) -> List[VocabularyItem]:
        vocab_items: List[VocabularyItem] = []
        files = []
        if language is None or language == Language.PORTUGUESE:
            files.append(self.data_dir / "pt_vocabulary.json")
        if language is None or language == Language.SPANISH:
            files.append(self.data_dir / "es_vocabulary.json")

        for fpath in files:
            if fpath.exists():
                with open(fpath, "r", encoding="utf-8") as f:
                    raw_list = json.load(f)
                for item in raw_list:
                    vocab_items.append(VocabularyItem(**item))
        return vocab_items

    def load_grammar_rules(self, language: Optional[Language] = None) -> List[GrammarRule]:
        rules: List[GrammarRule] = []
        files = []
        if language is None or language == Language.PORTUGUESE:
            files.append(self.data_dir / "pt_grammar.json")
        if language is None or language == Language.SPANISH:
            files.append(self.data_dir / "es_grammar.json")

        for fpath in files:
            if fpath.exists():
                with open(fpath, "r", encoding="utf-8") as f:
                    raw_list = json.load(f)
                for item in raw_list:
                    rules.append(GrammarRule(**item))
        return rules

    def load_materials(self) -> List[CuratedMaterial]:
        path = self.data_dir / "reading_and_dialogues.json"
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            raw_list = json.load(f)
        return [CuratedMaterial(**item) for item in raw_list]

    def load_exercise_templates(self) -> List[ExerciseTemplate]:
        path = self.data_dir / "exercise_templates.json"
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            raw_list = json.load(f)
        return [ExerciseTemplate(**item) for item in raw_list]

    def load_false_friends(self) -> List[FalseFriendItem]:
        path = self.data_dir / "pt_es_false_friends.json"
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            raw_list = json.load(f)
        return [FalseFriendItem(**item) for item in raw_list]

    def load_diagnostic_questions(self) -> List[DiagnosticQuestion]:
        path = self.data_dir / "diagnostic_questions.json"
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            raw_list = json.load(f)
        return [DiagnosticQuestion(**item) for item in raw_list]

    def load_further_resources(self) -> List[FurtherResource]:
        path = self.data_dir / "further_resources.json"
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            raw_list = json.load(f)
        return [FurtherResource(**item) for item in raw_list]
