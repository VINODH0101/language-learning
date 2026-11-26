# 05 — Content Schemas

> Eight JSON Schema documents live in `engine/ai/schemas/` and are loaded by
> `engine/ai/schemas/__init__.py` as `CONTENT_SCHEMAS`. Common metadata is in
> `common.json#/$defs`.

## 1. Common metadata (all types)

`$defs.meta` (required): `content_type`, `target_language` (en|pt|es), `explanation_language` (en|pt|es), `cefr_level` (A1–C2), `title`, `summary`. Optional: `topic`, `tags`, `estimated_read_minutes`, `provenance`, `vocabulary`, `grammar_references`, `activities`, `validation`.

`$defs.provenance` (required): `source_name`, `license_name`, `attribution`.

## 2. Type-specific schemas

| Content type | File | Type-specific required |
| :--- | :--- | :--- |
| Story | `story.json` | `narrative`, `comprehension_questions` |
| Conversation | `conversation.json` | `scenario`, `dialogue[]` (`speaker`,`line`) |
| Poetry | `poetry.json` | `lines`, `interpretation`, `copyright` |
| Grammar | `grammar.json` | `grammar_topic`, `explanation`, `examples` |
| Vocabulary | `vocabulary.json` | `lemma`, `part_of_speech`, `definition` |
| Academic essay | `academic_essay.json` | `topic`, `thesis`, `introduction`, `arguments`, `conclusion` |
| Cultural article | `cultural_article.json` | `article_body`, `source_references` |
| Practice | `practice.json` | `skill`, `exercise_type`, `instructions`, `questions`, `correct_answers` |

## 3. Example payloads

### 3.1 Story (abridged)

```json
{
  "meta": {
    "content_type": "story",
    "target_language": "pt",
    "explanation_language": "en",
    "cefr_level": "B1",
    "title": "A Manhã na Feira",
    "summary": "A short narrative set in a Portuguese market.",
    "provenance": { "source_name": "generated", "license_name": "internal", "attribution": "Lexilume Editorial" }
  },
  "narrative": "Era sábado de manhã e a feira estava cheia...",
  "comprehension_questions": [
    { "question": "Onde se passa a história?", "answer": "Numa feira" }
  ]
}
```

### 3.2 Conversation (abridged)

```json
{
  "meta": {
    "content_type": "conversation",
    "target_language": "es",
    "explanation_language": "en",
    "cefr_level": "A2",
    "title": "En la panadería",
    "summary": "Ordering bread and pastries."
  },
  "scenario": "Ordering bread and pastries",
  "dialogue": [
    { "speaker": "Cliente", "line": "Buenos días, ¿me da una barra?", "translation": "Good morning, can I have a baguette?" }
  ]
}
```

### 3.3 Poetry (abridged, original generated — not a reproduced copyrighted work)

```json
{
  "meta": {
    "content_type": "poetry",
    "target_language": "pt",
    "explanation_language": "en",
    "cefr_level": "B2",
    "title": "Maré de Outono",
    "summary": "Original poem about autumn tides.",
    "provenance": { "source_name": "generated", "license_name": "internal", "attribution": "Lexilume Editorial (original)" }
  },
  "lines": ["As folhas caem devagar,", "o mar repete o seu cantar."],
  "interpretation": "The poem contrasts the brevity of autumn with the constancy of the sea.",
  "copyright": "Original work generated for Lexilume."
}
```

## 4. Language & CEFR rules

- `target_language` and `explanation_language` are independent and restricted to `en|pt|es`.
- `cefr_level` is one of A1, A2, B1, B2, C1, C2.
- Generated content must state its CEFR and pass level-appropriateness checks (vocabulary/grammar bounds) before approval.
- Poetry: prefer original generated verse or verified public-domain works; never reproduce in-copyright poems.
- Cultural/academic content: factual claims require `source_references`; AI explanation is separated from source facts.

## 5. Validation pipeline

1. JSON-schema validation against the type schema.
2. Language detection matches declared `target_language`.
3. CEFR bounds check.
4. Copyright/provenance check.
5. Deduplication (semantic + exact) against the catalogue.
6. Quality scoring; failures recorded in `content_validation_reports`; content stays `draft`/`review_required`.
