"""Deterministic template-based lesson generator conforming to ENGINEERING_SPEC.md."""

from datetime import date
from typing import List, Dict, Optional, Set
import hashlib
import uuid

from engine.models.enums import (
    Language,
    RegionalVariety,
    ExplanationLanguage,
    CEFRLevel,
    StudyMode,
    ExerciseType,
    validate_regional_variety,
    DEFAULT_REGIONAL_VARIETY,
)
from engine.models.content import (
    VocabularyItem,
    GrammarRule,
    CuratedMaterial,
    ExerciseTemplate,
    FalseFriendItem,
    Attribution,
)
from engine.models.progress import UserTrackState, SRSItemState, LessonAssignment
from engine.sources.reading_provider import (
    BaseReadingProvider,
    CompositeReadingProvider,
    CuratedReadingProvider,
    WikipediaReadingProvider,
)
from engine.sources.wikipedia import WikipediaAdapter
from engine.models.lesson import (
    DailyLessonPayload,
    LearningObjective,
    ReadingSection,
    ConversationSection,
    SpeakingSection,
    WritingSection,
    ListeningSection,
    ExerciseItem,
    AnswerKeyItem,
    ReviewSection,
    FurtherResource,
)
from engine.curriculum.manager import CurriculumManager, EmptyCurriculumError
from engine.curriculum.syllabus import CurriculumNode
from engine.srs.scheduler import SRSScheduler
from engine.exercises.generator import ExerciseGenerator
from engine.generators.false_friends import FalseFriendsManager
from engine.generators.validator import LessonValidator
from engine.storage.repository import StorageRepository


class InsufficientContentError(Exception):
    """Raised when available educational resources cannot satisfy minimum section requirements."""
    pass


class DeterministicLessonGenerator:
    """Generates complete, verified 12-section daily language lessons without an AI model."""

    def __init__(
        self,
        curriculum_mgr: CurriculumManager,
        storage: StorageRepository,
        vocabulary_pool: List[VocabularyItem],
        grammar_pool: List[GrammarRule],
        materials_pool: List[CuratedMaterial],
        exercise_pool: List[ExerciseTemplate],
        further_resources_pool: List[FurtherResource],
        false_friends_mgr: Optional[FalseFriendsManager] = None,
        reading_provider: Optional[BaseReadingProvider] = None,
    ):
        self.curriculum_mgr = curriculum_mgr
        self.storage = storage
        self.vocabulary_pool = vocabulary_pool
        self.grammar_pool = grammar_pool
        self.materials_pool = materials_pool
        self.exercise_pool = exercise_pool
        self.further_resources_pool = further_resources_pool
        self.false_friends_mgr = false_friends_mgr or FalseFriendsManager()
        self.reading_provider = reading_provider or CompositeReadingProvider([
            WikipediaReadingProvider(WikipediaAdapter()),
            CuratedReadingProvider(materials_pool),
        ])

    def generate_daily_lesson(
        self,
        user_id: str,
        language: Language,
        lesson_date: date,
        regional_variety: Optional[RegionalVariety] = None,
        study_mode: StudyMode = StudyMode.FULL,
        force_node_id: Optional[str] = None,
        explanation_language: Optional[ExplanationLanguage] = None,
    ) -> DailyLessonPayload:
        """Assembles, validates, and stores a comprehensive 12-section daily lesson."""

        # 0. Idempotency check: If lesson already generated today and not forced, return cached
        existing_lesson = self.storage.get_daily_lesson(user_id, language, lesson_date)
        if existing_lesson and not force_node_id:
            return existing_lesson

        # 1. Fetch or initialize user track state with valid regional variety
        exp_lang = explanation_language or ExplanationLanguage.EN
        valid_variety = validate_regional_variety(language, regional_variety)

        track_state = self.storage.get_user_track_state(user_id, language)
        if not track_state:
            track_state = UserTrackState(
                user_id=user_id,
                language=language,
                regional_variety=valid_variety,
                current_cefr_level=CEFRLevel.A1,
                target_cefr_level=CEFRLevel.C1,
            )
        else:
            # Enforce that existing track's regional variety is valid for current language
            track_state.regional_variety = validate_regional_variety(
                language, regional_variety or track_state.regional_variety
            )

        # 2. Select curriculum node avoiding recent repetition
        node = self.curriculum_mgr.select_next_node(track_state, force_node_id=force_node_id)

        # 3. Section 1: Objectives
        objectives = [
            LearningObjective(
                category=node.skill_category.value,
                can_do_statement=node.can_do_statement,
                target_competency=f"CEFR {node.cefr_level.value}: {node.title}",
            )
        ]

        # 4. Section 2: Vocabulary (Minimum 12 items required)
        vocab_items = self._select_vocabulary(language, node.cefr_level, count=12)

        # 5. Section 3: Grammar Rule
        grammar_rule = self._select_grammar_rule(language, node.cefr_level, node.id)

        # 6. Section 4 & 5 & 8: Reading, Conversation, and Listening materials
        reading_section = self._build_reading_section(language, node.cefr_level, track_state)
        conversation_section = self._build_conversation_section(language, track_state.regional_variety)
        listening_section = self._build_listening_section(language, node.cefr_level)

        # 7. Section 6: Speaking Practice
        speaking_section = self._build_speaking_section(language, node, grammar_rule)

        # 8. Section 7: Writing Assignment
        writing_section = self._build_writing_section(language, node, grammar_rule)

        # 9. Section 9 & 10: Exercises and Answer Keys (avoiding recent exercises)
        exercise_items, answer_keys = self._build_exercises(language, node.id, vocab_items, track_state)

        # 10. Section 11: Spaced Repetition Review
        srs_states = self.storage.get_srs_states(user_id, language)
        due_srs_items = SRSScheduler.get_due_items(srs_states, target_date=lesson_date, language=language, max_items=6)
        due_vocab_ids = {s.vocabulary_item_id for s in due_srs_items}
        due_vocab = [v for v in self.vocabulary_pool if v.id in due_vocab_ids]

        review_section = ReviewSection(
            due_vocabulary_reviews=due_vocab,
            consolidated_grammar_rules=[grammar_rule] if node.is_consolidation_review else [],
            review_strategy_note=(
                "Pratique a recuperação ativa antes de virar os cartões. "
                "Avalie honestamente sua retenção na escala de 0 a 5 do SuperMemo SM-2."
            ),
        )

        # 11. Section 12: Further Resources
        further_resources = [r for r in self.further_resources_pool if language.value in r.url.lower() or "polyglot" in r.url.lower()][:3]
        if not further_resources:
            further_resources = self.further_resources_pool[:3]

        # 12. False friend & interference alerts
        lesson_lemmas = [v.lemma for v in vocab_items]
        false_friend_alerts = self.false_friends_mgr.find_alerts_for_vocabulary(lesson_lemmas, language)
        if not false_friend_alerts:
            false_friend_alerts = self.false_friends_mgr.get_curated_pair_alerts(node.cefr_level, limit=2)

        # 13. Aggregate legal attributions
        attributions_dict: Dict[str, Attribution] = {}
        for v in vocab_items:
            attributions_dict[v.attribution.source_name] = v.attribution
        attributions_dict[grammar_rule.attribution.source_name] = grammar_rule.attribution
        attributions_dict[reading_section.attribution.source_name] = reading_section.attribution
        attributions_dict[conversation_section.attribution.source_name] = conversation_section.attribution
        attributions_dict[listening_section.attribution.source_name] = listening_section.attribution

        estimated_minutes = 20 if study_mode == StudyMode.COMPACT else 50
        lesson_id = f"lesson-{user_id}-{language.value}-{lesson_date.isoformat()}"

        # Deterministic SHA-256 fingerprint of assembled core content
        fp_raw = f"{node.id}:{grammar_rule.id}:{','.join(sorted(v.id for v in vocab_items))}:{study_mode.value}:{track_state.regional_variety.value}"
        fingerprint = hashlib.sha256(fp_raw.encode("utf-8")).hexdigest()

        lesson_payload = DailyLessonPayload(
            lesson_id=lesson_id,
            user_id=user_id,
            lesson_date=lesson_date,
            language=language,
            regional_variety=track_state.regional_variety,
            explanation_language=exp_lang,
            cefr_level=node.cefr_level,
            curriculum_node_id=node.id,
            curriculum_topic_title=node.title,
            study_mode=study_mode,
            estimated_study_minutes=estimated_minutes,
            section_1_objectives=objectives,
            section_2_vocabulary=vocab_items,
            section_3_grammar=grammar_rule,
            section_4_reading=reading_section,
            section_5_conversation=conversation_section,
            section_6_speaking=speaking_section,
            section_7_writing=writing_section,
            section_8_listening=listening_section,
            section_9_exercises=exercise_items,
            section_10_answer_keys=answer_keys,
            section_11_review=review_section,
            section_12_further_resources=further_resources,
            false_friend_alerts=false_friend_alerts,
            attributions=list(attributions_dict.values()),
            content_fingerprint=fingerprint,
            is_review_lesson=node.is_consolidation_review,
        )

        # Validate complete lesson against quality rules
        LessonValidator.validate(lesson_payload)

        # Record presented vocabulary in SRS tracker
        for v in vocab_items:
            existing = next((s for s in srs_states if s.vocabulary_item_id == v.id), None)
            if not existing:
                new_state = SRSScheduler.create_initial_state(
                    vocabulary_item_id=v.id,
                    language=language,
                    presentation_date=lesson_date,
                    track_state=track_state,
                )
                self.storage.save_srs_state(user_id, new_state)

        # Update curriculum history on track state
        self.curriculum_mgr.record_node_completion(track_state, node)
        track_state.last_lesson_date = lesson_date
        self.storage.save_user_track_state(track_state)
        self.storage.save_daily_lesson(lesson_payload)

        # Record minimal assignment in storage repository
        assignment = LessonAssignment(
            id=f"assign-{user_id}-{language.value}-{lesson_date.isoformat()}",
            user_id=user_id,
            language=language,
            assignment_date=lesson_date,
            article_id=reading_section.article_id or f"read-{node.id}",
            article_title=reading_section.title,
            article_url=reading_section.article_url or reading_section.attribution.source_url,
            cefr_level=node.cefr_level,
            topic_category=reading_section.topic_category or "General",
            status="assigned",
        )
        self.storage.save_lesson_assignment(assignment)

        return lesson_payload

    def _select_vocabulary(self, language: Language, level: CEFRLevel, count: int = 12) -> List[VocabularyItem]:
        candidates = [v for v in self.vocabulary_pool if v.language == language]
        if not candidates:
            raise InsufficientContentError(f"No vocabulary items available for language '{language.value}'.")

        # Prioritize matching level, then allow lower/adjacent levels
        matching = [v for v in candidates if v.cefr_level == level]
        other = [v for v in candidates if v.cefr_level != level]
        combined = matching + other

        if len(combined) < count:
            raise InsufficientContentError(
                f"Insufficient vocabulary pool for {language.value} (found {len(combined)}, required {count})."
            )

        return combined[:count]

    def _select_grammar_rule(self, language: Language, level: CEFRLevel, node_id: str) -> GrammarRule:
        candidates = [g for g in self.grammar_pool if g.language == language]
        if not candidates:
            raise InsufficientContentError(f"No grammar rules available for language '{language.value}'.")

        # Try exact node match, then level match, then any available rule
        for g in candidates:
            if g.id == node_id or getattr(g, "curriculum_node_id", None) == node_id:
                return g
        level_candidates = [g for g in candidates if g.cefr_level == level]
        if level_candidates:
            return level_candidates[0]
        return candidates[0]

    def _build_reading_section(
        self,
        language: Language,
        level: CEFRLevel,
        track_state: Optional[UserTrackState] = None,
    ) -> ReadingSection:
        excluded = set(track_state.recent_article_history if track_state else [])
        section = self.reading_provider.get_reading_section(
            language=language,
            cefr_level=level,
            exclude_article_ids=excluded,
        )
        if not section:
            candidates = [
                m for m in self.materials_pool
                if m.language == language and m.material_type.value == "reading_passage"
            ]
            if not candidates:
                raise InsufficientContentError(f"No reading passages available for language '{language.value}'.")

            passage = candidates[0]
            questions_data = [
                {
                    "question": q.question,
                    "options": q.options,
                    "correct_option_index": q.correct_option_index,
                    "explanation": q.explanation,
                }
                for q in passage.comprehension_questions
            ]

            section = ReadingSection(
                title=passage.title,
                passage_target=passage.content_target,
                passage_en=passage.content_en,
                glossary=passage.glossary,
                comprehension_questions=questions_data,
                attribution=passage.attribution,
            )

        if track_state and section.article_id:
            if section.article_id in track_state.recent_article_history:
                track_state.recent_article_history.remove(section.article_id)
            track_state.recent_article_history.insert(0, section.article_id)
            track_state.recent_article_history = track_state.recent_article_history[:14]

        return section

    def _build_conversation_section(self, language: Language, variety: RegionalVariety) -> ConversationSection:
        candidates = [
            m for m in self.materials_pool
            if m.language == language and m.material_type.value == "conversation_script"
        ]
        if not candidates:
            raise InsufficientContentError(f"No conversation scripts available for language '{language.value}'.")

        script = candidates[0]
        # Dialogue format: line pairs
        lines = []
        for line_raw in script.content_target.strip().split("\n"):
            if ":" in line_raw:
                speaker, text = line_raw.split(":", 1)
                lines.append({"speaker": speaker.strip(), "line": text.strip(), "translation": ""})

        if len(lines) < 2:
            lines = [
                {"speaker": "Locutor A", "line": script.content_target, "translation": ""},
                {"speaker": "Locutor B", "line": "Entendido perfeitamente.", "translation": ""},
            ]

        notes = [
            f"Registro e Pragmatismo: Adequado para a variedade {variety.value}.",
            "Observe o uso de marcadores discursivos e conectores de atenuação.",
        ]

        return ConversationSection(
            title=script.title,
            context="Interação dialógica contextualizada em ambiente profissional / acadêmico.",
            dialogue=lines,
            pragmatic_notes=notes,
            attribution=script.attribution,
        )

    def _build_listening_section(self, language: Language, level: CEFRLevel) -> ListeningSection:
        candidates = [
            m for m in self.materials_pool
            if m.language == language and m.material_type.value == "listening_transcript"
        ]
        if candidates:
            mat = candidates[0]
            transcript = mat.content_target
            audio_url = mat.audio_url
            attribution = mat.attribution
        else:
            # Fallback to reading passage transcript with open audio
            reading = self.materials_pool[0]
            transcript = reading.content_target
            audio_url = reading.audio_url
            attribution = reading.attribution

        tasks = [
            "1. Escute uma vez atentamente sem ler a transcrição.",
            "2. Identifique os três argumentos centrais e os conectores lógicos empregados.",
            "3. Repita as frases em voz alta prestando atenção à entonação e ritmo nativo.",
        ]

        return ListeningSection(
            title="Prática de Compreensão Auditiva C1",
            audio_source_url=audio_url,
            audio_player_notes=(
                "Áudio nativo de código aberto disponível. Caso offline, utilize a "
                "síntese de voz nativa do navegador (Web Speech API pt-BR / pt-PT / es-ES)."
            ),
            transcript_target=transcript,
            comprehension_tasks=tasks,
            attribution=attribution,
        )

    def _build_speaking_section(
        self,
        language: Language,
        node: CurriculumNode,
        grammar: GrammarRule,
    ) -> SpeakingSection:
        if language == Language.PORTUGUESE:
            prompt = (
                f"Apresentação oral C1: Discorra durante 3 minutos sobre o tema '{node.title}'. "
                f"Utilize obrigatoriamente a estrutura gramatical estudada ({grammar.structural_formula})."
            )
            questions = [
                "Quais são os principais prós e contras relacionados a este tema?",
                "Como as nuances culturais afetam a percepção do problema no Brasil e em Portugal?",
                "Que solução você proporia se estivesse em uma mesa de negociações?",
            ]
            phrases = [
                "Em primeiro lugar, convém ressaltar que...",
                "Por mais que se argumente o contrário...",
                "Do meu ponto de vista, infere-se que...",
                "Caso tivéssemos a oportunidade de intervir...",
            ]
            pronunciation = "Foque na redução das vogais átonas e nasais em português europeu ou abertura em brasileiro."
        else:
            prompt = (
                f"Producción oral C1: Exponga durante 3 minutos sus argumentos sobre '{node.title}'. "
                f"Incorpore de forma natural la estructura ({grammar.structural_formula})."
            )
            questions = [
                "¿Cuáles son los principales dilemas éticos o prácticos en torno a este asunto?",
                "¿Qué contrastes observa entre las políticas peninsulares y latinoamericanas?",
                "¿Cómo defendería su postura frente a un interlocutor escéptico?",
            ]
            phrases = [
                "En primer lugar, cabe destacar que...",
                "Por mucho que se insista en lo contrario...",
                "Desde una perspectiva crítica, resulta evidente que...",
                "A condición de que se establezcan garantías...",
            ]
            pronunciation = "Atención a la distinción entre 'b' y 'v' (bilabial fricativa [β]) y cadencia rítmica."

        return SpeakingSection(
            prompt=prompt,
            guiding_questions=questions,
            suggested_phrases=phrases,
            model_pronunciation_guide=pronunciation,
            target_duration_minutes=10,
        )

    def _build_writing_section(
        self,
        language: Language,
        node: CurriculumNode,
        grammar: GrammarRule,
    ) -> WritingSection:
        if language == Language.PORTUGUESE:
            prompt = (
                f"Redação dissertativo-argumentativa C1: Escreva um ensaio crítico de 150 a 200 palavras "
                f"analisando a temática '{node.title}'."
            )
            guidelines = [
                "Introdução contextualizando o tema e estabelecendo a tese central.",
                "Parágrafo de desenvolvimento com contra-argumentação e refutação.",
                "Conclusão propositiva sem clichês.",
                f"Uso deliberado de: {grammar.structural_formula}.",
            ]
            connectors = ["Não obstante", "Por conseguinte", "Com efeito", "Em contrapartida", "Conquanto"]
        else:
            prompt = (
                f"Composición argumentativa C1: Redacte un artículo de opinión o ensayo de 150 a 200 palabras "
                f"analizando el tema '{node.title}'."
            )
            guidelines = [
                "Introducción con tesis nítida y posicionamiento crítico.",
                "Cuerpo argumentativo estructurado con evidencias y subordinación concesiva.",
                "Conclusión reflexiva y sintética.",
                f"Integración obligatoria de: {grammar.structural_formula}.",
            ]
            connectors = ["No obstante", "Por consiguiente", "En efecto", "Por el contrario", "Si bien"]

        return WritingSection(
            prompt=prompt,
            genre_register="Artigo de Opinião / Ensaio Acadêmico (Registro Culto Formal)",
            structural_guidelines=guidelines,
            evaluation_criteria=[
                "Coesão e coerência interparagráfica.",
                "Precisão lexical C1 (ausência de repetições e vocábulos vagos).",
                "Domínio sintático de estruturas subordinadas complexas.",
            ],
            suggested_connectors=connectors,
            target_word_count=160,
        )

    def _build_exercises(
        self,
        language: Language,
        node_id: str,
        vocab_items: List[VocabularyItem],
        track_state: UserTrackState,
    ) -> tuple[List[ExerciseItem], List[AnswerKeyItem]]:
        """Selects and generates at least 4 deterministic exercises, avoiding recent repetitions."""
        recent_exercise_ids = set(track_state.recent_exercise_history[:10])

        candidates = [
            e for e in self.exercise_pool
            if e.language == language and e.id not in recent_exercise_ids
        ]

        exercise_items: List[ExerciseItem] = []
        answer_keys: List[AnswerKeyItem] = []

        # 1. Use matching exercise templates first
        for tmpl in candidates:
            if len(exercise_items) >= 4:
                break
            ex_item, ans_key = ExerciseGenerator.from_template(tmpl)
            exercise_items.append(ex_item)
            answer_keys.append(ans_key)

        # 2. If fewer than 4 templates available, generate deterministic cloze exercises from vocabulary
        if len(exercise_items) < 4:
            for vocab in vocab_items:
                if len(exercise_items) >= 4:
                    break
                # Distractors from other vocabulary items
                distractors = [v.lemma for v in vocab_items if v.lemma != vocab.lemma][:3]
                ex_item, ans_key = ExerciseGenerator.generate_cloze_from_vocabulary(vocab, distractors)
                exercise_items.append(ex_item)
                answer_keys.append(ans_key)

        # Update recent exercise history on track state
        for ex in exercise_items:
            if ex.id in track_state.recent_exercise_history:
                track_state.recent_exercise_history.remove(ex.id)
            track_state.recent_exercise_history.insert(0, ex.id)
        track_state.recent_exercise_history = track_state.recent_exercise_history[:20]

        return exercise_items, answer_keys
