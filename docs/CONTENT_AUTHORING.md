# Polyglot C1 Daily — Content Authoring & Curriculum Guide

## 1. Introduction & Ethical Resource Principles

Polyglot C1 Daily is built on a foundation of **deterministic, openly licensed, high-quality educational data**. Because the system operates without reliance on continuous generative AI in production, all curriculum topics, lexical items, grammatical formulas, and exercises must be authoritatively curated, verified, and correctly attributed.

### Mandatory Resource Rules
1. **Explicit Licensing**: Every imported sentence, definition, or audio clip must have an explicit open license (e.g., CC-BY 2.0 FR, CC-BY-SA 3.0, CC-BY 4.0, or Public Domain).
2. **Attribution Integrity**: Never omit or strip attribution metadata. Every item in `vocabulary_items`, `grammar_rules`, `curated_materials`, and `exercise_templates` includes an `attribution` object pointing to the canonical source and author terms.
3. **No Indiscriminate Scraping**: Content must come from established open repositories (Tatoeba, Wiktionary, Wikimedia Commons, Project Gutenberg, or original expert-created material).
4. **No Fabricated Citations**: Never invent or hallucinate citations or claim an original sentence originates from an external corpus.

---

## 2. Directory Structure of Educational Datasets

All seed datasets live in `engine/data/`:

| File | Purpose | Schema Model |
| :--- | :--- | :--- |
| `licenses.json` | Registry of reusable open licenses and credit notices | `Attribution` |
| `pt_curriculum.json` | Portuguese syllabus nodes (A1 $\rightarrow$ C1) | `CurriculumNode` |
| `es_curriculum.json` | Spanish syllabus nodes (A1 $\rightarrow$ C1) | `CurriculumNode` |
| `pt_vocabulary.json` | Portuguese C1 & core vocabulary with IPA & examples | `VocabularyItem` |
| `es_vocabulary.json` | Spanish C1 & core vocabulary with IPA & examples | `VocabularyItem` |
| `pt_grammar.json` | Portuguese grammar rules with formulas & errors | `GrammarRule` |
| `es_grammar.json` | Spanish grammar rules with formulas & errors | `GrammarRule` |
| `pt_es_false_friends.json` | Interlinguistic false cognates & interference warnings | `FalseFriendItem` |
| `reading_and_dialogues.json` | Authentic reading passages & dialogic transcripts | `CuratedMaterial` |
| `exercise_templates.json` | Deterministic exercises with distractors | `ExerciseTemplate` |
| `diagnostic_questions.json` | Calibrated placement test items | `DiagnosticQuestion` |
| `further_resources.json` | External open cultural and academic links | `FurtherResource` |

---

## 3. How to Add New Content

### 3.1. Adding a New Curriculum Node
To introduce a new grammar or discourse competency:
Edit `engine/data/pt_curriculum.json` or `engine/data/es_curriculum.json`:

```json
{
  "id": "pt-c1-05",
  "language": "pt",
  "cefr_level": "C1",
  "sequence_order": 5,
  "title": "Conectores Concessivos e Argumentativos Formais",
  "slug": "conectores-concessivos-c1",
  "skill_category": "discourse",
  "can_do_statement": "Pode articular períodos complexos com conectores de concessão e contraste refinados.",
  "description": "Estudo de conquanto, não obstante, malgrado e posto que.",
  "regional_relevance": "all",
  "prerequisite_node_id": "pt-c1-04",
  "is_consolidation_review": false
}
```

- `id`: Unique identifier formatted as `{lang}-{level}-{seq}`.
- `regional_relevance`: Use `"all"`, `"pt-BR"`, `"pt-PT"`, `"es-ES"`, or `"es-419"`.
- `prerequisite_node_id`: ID of the node that must be completed before this node can be unlocked.

---

### 3.2. Adding a New Vocabulary Item
Edit `engine/data/pt_vocabulary.json` or `engine/data/es_vocabulary.json`:

```json
{
  "id": "pt-voc-15",
  "language": "pt",
  "lemma": "malgrado",
  "part_of_speech": "preposition",
  "cefr_level": "C1",
  "definition_en": "in spite of, despite, notwithstanding (formal preposition)",
  "definition_target": "Apesar de; a despeito de; denota ressalva ou oposição formal.",
  "phonetic_ipa": "/mawˈɡɾa.du/",
  "regional_tags": ["all"],
  "example_sentence_target": "Malgrado os esforços do mediador, o impasse permaneceu inalterado.",
  "example_sentence_en": "Despite the mediator's efforts, the deadlock remained unaltered.",
  "collocations": ["malgrado os pesares", "malgrado o esforço"],
  "audio_url": "https://tatoeba.org/audio/pt/malgrado.mp3",
  "false_friend_warning": null,
  "attribution": {
    "source_name": "Tatoeba Project",
    "source_url": "https://tatoeba.org",
    "license_type": "CC-BY-2.0-FR",
    "attribution_text": "Sample sentence adapted from Tatoeba Project under CC-BY 2.0 FR.",
    "terms_url": "https://tatoeba.org/en/terms_of_use"
  }
}
```

*Requirements*:
- Must include both English (`definition_en`) and target language (`definition_target`) definitions.
- Example sentences must be natural and accompanied by their English translation.
- `attribution` must cite the specific source dataset.

---

### 3.3. Adding a New Exercise Template
Edit `engine/data/exercise_templates.json`:

```json
{
  "id": "ex-pt-05",
  "curriculum_node_id": "pt-c1-05",
  "language": "pt",
  "exercise_type": "multiple_choice",
  "prompt": "Selecione a conjunção adequada que expressa concessão formal:",
  "context_passage": "_____ houvesse resistência generalizada, a medida entrou em vigor.",
  "target_slot_index": null,
  "acceptable_solutions": ["Conquanto", "Não obstante"],
  "distractors": [
    {
      "text": "Porquanto",
      "why_incorrect": "'Porquanto' é causal ou explicativo (significa 'já que' ou 'porque'), não concessivo!"
    },
    {
      "text": "Portanto",
      "why_incorrect": "'Portanto' é conclusivo, incompatível com o verbo no subjuntivo 'houvesse'."
    }
  ],
  "explanation": "'Conquanto' é uma conjunção subordinativa concessiva de registro formal C1 que rege obrigatoriamente o modo subjuntivo.",
  "hint": "Cuidado com o falso amigo fonético com 'porquanto'!",
  "difficulty": 4,
  "attribution": {
    "source_name": "Polyglot C1 Daily Open Curriculum",
    "source_url": "https://github.com/polyglot-c1-daily",
    "license_type": "Original-Curated",
    "attribution_text": "Original exercise item for Polyglot C1 Daily.",
    "terms_url": "https://creativecommons.org/licenses/by/4.0/"
  }
}
```

*Pedagogical Quality Check*:
- Every distractor in `distractors` **must** include a `why_incorrect` explanation so the learner understands why their mistake happened.

---

### 3.4. Adding a False Friend / Interference Item
Edit `engine/data/pt_es_false_friends.json`:

```json
{
  "id": "ff-09",
  "portuguese_term": "apelido",
  "spanish_term": "apellido",
  "pt_meaning_en": "nickname / pet name (e.g. Zé for José)",
  "es_meaning_en": "family surname / last name (e.g. García)",
  "pt_example": "Na infância, todos o chamavam pelo apelido de Guga.",
  "es_example": "Mi primer apellido es Martínez y el segundo es Gómez.",
  "interference_warning": "Em espanhol, o 'apellido' é o sobrenome oficial de família. Em português, 'apelido' (no Brasil) é o nome carinhoso ou alcunha (alcance). Em Portugal 'apelido' pode ser sobrenome, mas no Brasil é estritamente nickname!",
  "cefr_level": "A2",
  "attribution": {
    "source_name": "Polyglot C1 Daily Open Curriculum",
    "source_url": "https://github.com/polyglot-c1-daily",
    "license_type": "Original-Curated",
    "attribution_text": "Comparative linguistic analysis for Polyglot C1 Daily.",
    "terms_url": "https://creativecommons.org/licenses/by/4.0/"
  }
}
```

---

## 4. Validating Changes

Whenever you modify or add seed data files:
Run the automated test suite from the repository root:

```bash
python -m pytest tests/ -v
```

Pydantic will automatically validate that:
1. Every JSON entry conforms to its schema type.
2. URLs and licenses are well-formed.
3. Lessons can be generated and verified without errors.
4. No required fields are missing or empty.
