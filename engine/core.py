"""Polyglot C1 Daily learning engine unified facade."""

from datetime import date
from typing import List, Dict, Optional, Any
from pathlib import Path

from engine.models.enums import Language, RegionalVariety, ExplanationLanguage, CEFRLevel, StudyMode, ReviewGrade
from engine.models.progress import UserTrackState, SRSItemState, ExerciseAttempt
from engine.models.lesson import DailyLessonPayload
from engine.models.content import ExerciseTemplate
from engine.models.diagnostic import DiagnosticSubmission, DiagnosticResult
from engine.curriculum.manager import CurriculumManager
from engine.srs.scheduler import SRSScheduler
from engine.exercises.checker import ExerciseChecker, CheckResult
from engine.generators.template_engine import DeterministicLessonGenerator
from engine.generators.false_friends import FalseFriendsManager
from engine.diagnostic.assessment import DiagnosticAssessmentEngine
from engine.sources.reading_provider import BaseReadingProvider
from engine.storage.repository import StorageRepository, InMemoryStorageRepository
from engine.storage.seed_loader import SeedDataLoader


class PolyglotEngine:
    """High-level coordinator providing unified API for curriculum, generation, SRS, and diagnostic."""

    def __init__(
        self,
        storage: Optional[StorageRepository] = None,
        data_dir: Optional[Path] = None,
        reading_provider: Optional[BaseReadingProvider] = None,
    ):
        self.storage: StorageRepository = storage or InMemoryStorageRepository()
        self.seed_loader = SeedDataLoader(data_dir=data_dir)

        # Load seed datasets
        self.curriculum_nodes = self.seed_loader.load_curriculum_nodes()
        self.vocabulary_pool = self.seed_loader.load_vocabulary()
        self.grammar_pool = self.seed_loader.load_grammar_rules()
        self.materials_pool = self.seed_loader.load_materials()
        self.exercise_pool = self.seed_loader.load_exercise_templates()
        self.false_friends = self.seed_loader.load_false_friends()
        self.diagnostic_questions = self.seed_loader.load_diagnostic_questions()
        self.further_resources = self.seed_loader.load_further_resources()

        # Initialize domain managers
        self.curriculum_mgr = CurriculumManager(self.curriculum_nodes)
        self.false_friends_mgr = FalseFriendsManager(self.false_friends)
        self.diagnostic_engine = DiagnosticAssessmentEngine(self.diagnostic_questions, self.curriculum_mgr)

        # Initialize lesson generator
        self.generator = DeterministicLessonGenerator(
            curriculum_mgr=self.curriculum_mgr,
            storage=self.storage,
            vocabulary_pool=self.vocabulary_pool,
            grammar_pool=self.grammar_pool,
            materials_pool=self.materials_pool,
            exercise_pool=self.exercise_pool,
            further_resources_pool=self.further_resources,
            false_friends_mgr=self.false_friends_mgr,
            reading_provider=reading_provider,
        )

    def generate_daily_lesson(
        self,
        user_id: str,
        language: Language,
        lesson_date: Optional[date] = None,
        regional_variety: Optional[RegionalVariety] = None,
        study_mode: StudyMode = StudyMode.FULL,
        force_node_id: Optional[str] = None,
        explanation_language: Optional[ExplanationLanguage] = None,
    ) -> DailyLessonPayload:
        """Generates, validates, and stores a complete daily lesson."""
        target_date = lesson_date or date.today()
        return self.generator.generate_daily_lesson(
            user_id=user_id,
            language=language,
            lesson_date=target_date,
            regional_variety=regional_variety,
            study_mode=study_mode,
            force_node_id=force_node_id,
            explanation_language=explanation_language,
        )

    def evaluate_exercise(
        self,
        user_id: str,
        template: ExerciseTemplate,
        submitted_answer: str,
        attempt_number: int = 1,
    ) -> CheckResult:
        """Evaluates an exercise submission and stores the attempt telemetry."""
        result = ExerciseChecker.evaluate(template, submitted_answer, attempt_number)
        attempt = ExerciseAttempt(
            exercise_id=template.id,
            submitted_answer=submitted_answer,
            is_correct=result.is_correct,
            feedback=result.feedback,
            attempt_count=attempt_number,
        )
        self.storage.save_exercise_attempt(user_id, attempt)
        return result

    def record_srs_rating(
        self,
        user_id: str,
        vocabulary_item_id: str,
        grade: ReviewGrade,
        review_date: Optional[date] = None,
    ) -> SRSItemState:
        """Processes an SM-2 active recall rating for a vocabulary item."""
        target_date = review_date or date.today()
        user_srs = self.storage.get_srs_states(user_id)
        current_state = next((s for s in user_srs if s.vocabulary_item_id == vocabulary_item_id), None)

        if not current_state:
            # Look up vocabulary item to find its language
            vocab = next((v for v in self.vocabulary_pool if v.id == vocabulary_item_id), None)
            lang = vocab.language if vocab else Language.PORTUGUESE
            track = self.storage.get_user_track_state(user_id, lang)
            current_state = SRSScheduler.create_initial_state(
                vocabulary_item_id=vocabulary_item_id,
                language=lang,
                presentation_date=target_date,
                track_state=track,
            )

        track_state = self.storage.get_user_track_state(user_id, current_state.language)
        updated_state = SRSScheduler.process_review(
            current_state=current_state,
            grade=grade,
            review_date=target_date,
            track_state=track_state,
        )

        self.storage.save_srs_state(user_id, updated_state)
        if track_state:
            self.storage.save_user_track_state(track_state)

        return updated_state

    def submit_diagnostic(
        self,
        user_id: str,
        language: Language,
        answers: Dict[str, int],
        regional_variety: Optional[RegionalVariety] = None,
    ) -> DiagnosticResult:
        """Assesses placement test, updates user track CEFR starting level and node."""
        submission = DiagnosticSubmission(
            user_id=user_id,
            language=language,
            answers=answers,
        )
        result = self.diagnostic_engine.evaluate(submission)

        # Update or create user track state with recommended CEFR level
        variety = regional_variety or (
            RegionalVariety.PT_BR if language == Language.PORTUGUESE else RegionalVariety.ES_ES
        )
        track = self.storage.get_user_track_state(user_id, language) or UserTrackState(
            user_id=user_id,
            language=language,
            regional_variety=variety,
        )
        track.current_cefr_level = result.recommended_cefr_level
        track.current_curriculum_node_id = result.recommended_curriculum_node_id
        self.storage.save_user_track_state(track)

        return result
