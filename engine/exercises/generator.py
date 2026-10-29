"""Exercise generator converting templates and educational assets into interactive items."""

import random
from typing import List, Tuple, Dict, Optional
from engine.models.content import ExerciseTemplate, VocabularyItem, GrammarRule, DistractorItem
from engine.models.lesson import ExerciseItem, AnswerKeyItem
from engine.models.enums import ExerciseType


class ExerciseGenerator:
    """Instantiates student-facing exercise items and corresponding answer keys."""

    @classmethod
    def from_template(
        cls,
        template: ExerciseTemplate,
        shuffle_options: bool = True,
    ) -> Tuple[ExerciseItem, AnswerKeyItem]:
        """Converts an ExerciseTemplate into a student ExerciseItem and AnswerKeyItem."""
        options: Optional[List[str]] = None
        distractor_map: Dict[str, str] = {
            d.text: d.why_incorrect for d in template.distractors
        }

        if template.exercise_type == ExerciseType.MULTIPLE_CHOICE or template.distractors:
            # Build options list from solution + distractors
            all_opts = [template.acceptable_solutions[0]] + [d.text for d in template.distractors]
            # Deduplicate while preserving order
            seen = set()
            unique_opts = []
            for opt in all_opts:
                if opt not in seen:
                    seen.add(opt)
                    unique_opts.append(opt)

            if shuffle_options:
                # Deterministic or controlled shuffle
                rng = random.Random(hash(template.id))
                rng.shuffle(unique_opts)
            options = unique_opts

        exercise_item = ExerciseItem(
            id=template.id,
            exercise_type=template.exercise_type.value,
            prompt=template.prompt,
            context_passage=template.context_passage,
            options=options,
            hint=template.hint,
            distractor_explanations=distractor_map if distractor_map else None,
        )

        answer_key_item = AnswerKeyItem(
            exercise_id=template.id,
            acceptable_solutions=template.acceptable_solutions,
            explanation=template.explanation,
            distractor_feedback=distractor_map if distractor_map else None,
        )

        return exercise_item, answer_key_item

    @classmethod
    def generate_cloze_from_vocabulary(
        cls,
        vocab: VocabularyItem,
        distractors: Optional[List[str]] = None,
    ) -> Tuple[ExerciseItem, AnswerKeyItem]:
        """Generates a deterministic cloze fill-in-the-blank from a vocabulary item's example sentence."""
        sentence = vocab.example_sentence_target
        lemma = vocab.lemma

        # Replace lemma in sentence if present (case-insensitive)
        idx = sentence.lower().find(lemma.lower())
        if idx != -1:
            target_word = sentence[idx : idx + len(lemma)]
            masked_sentence = sentence[:idx] + "_____" + sentence[idx + len(lemma):]
        else:
            # Fallback: prompt for term
            masked_sentence = f"{sentence} (Termo: _____)"
            target_word = lemma

        prompt = f"Complete a frase com o termo adequado ({vocab.part_of_speech}):"
        hint = f"Definição: {vocab.definition_en}"
        explanation = f"'{target_word}' significa '{vocab.definition_en}'. Exemplo: {sentence}"

        exercise_id = f"gen_cloze_{vocab.id}"

        distractor_items = []
        if distractors:
            for d in distractors:
                distractor_items.append(
                    DistractorItem(
                        text=d,
                        why_incorrect=f"'{d}' não tem o significado necessário neste contexto.",
                    )
                )

        template = ExerciseTemplate(
            id=exercise_id,
            curriculum_node_id=vocab.id,
            language=vocab.language,
            exercise_type=ExerciseType.CLOZE,
            prompt=prompt,
            context_passage=masked_sentence,
            acceptable_solutions=[target_word, lemma],
            distractors=distractor_items,
            explanation=explanation,
            hint=hint,
            attribution=vocab.attribution,
        )

        return cls.from_template(template)
