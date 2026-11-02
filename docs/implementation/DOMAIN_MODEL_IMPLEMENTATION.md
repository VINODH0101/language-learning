# Lexilume — Domain Model & Boundary Implementation

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **TypeScript Definitions:** `frontend/src/types/contentCentred.ts`  
> **Python Pydantic Models:** `engine/models/content_centred.py`  
> **Phase:** Phase 7 — Core Implementation  
> **Milestone:** Milestone 7.2 — Core Domain Models & Application Boundaries  

---

## 1. Domain Entities & Alignment

Phase 7 establishes canonical representations across the full stack:
- **TypeScript interfaces** for frontend rendering, Dexie caching, and API consumption.
- **Python Pydantic v2 models** for content pipeline processing, text segmentation, validation, and test suites.
- **PostgreSQL DDL** (`migration 015`) enforcing data integrity, foreign key cascades, and check constraints.

---

## 2. Canonical Domain Models

### 2.1 Content Hierarchy
1. **`ContentSource`:** Rights provenance, licensing (`CC-BY-SA-4.0`, `Public Domain`), and mandatory attribution.
2. **`ContentItem`:** Universal catalog entry with title, unique slug, genre, CEFR level, reading duration, rights verification status, and independent target and explanation languages.
3. **`ContentVersion`:** Frozen, immutable snapshot of pedagogical analysis:
   - `ContentParagraph` & `ContentSentence`: Structural segmentation of text.
   - `ContentToken`: Word-level tokens with lemma, part of speech, CEFR level, and glossary reference.
   - `LexicalAnnotation`: Target lemma, contextual meaning in this specific sentence, general definition, explanation translation, IPA, and audio reference.
   - `GrammarPoint`: Syntactic rule identification tied to target sentence tokens.

### 2.2 Learning Activities
1. **`LearningActivity`:** Version-bound pedagogical exercise:
   - Types: `reading_comprehension`, `vocabulary_cloze`, `grammar_transformation`, `listening_dictation`, `sentence_scramble`, `spoken_shadowing`, `free_writing`, `true_false`, `short_answer`.
2. **`ActivityQuestion`:** Question stem, distractor options with error rationales, correct answer key, and link to reference sentence.

### 2.3 Learner State & Spaced Repetition
1. **`LearnerContentProgress`:** Granular completion percentage, completed activity IDs, time spent, and comprehension score, indexed by `(user_id, content_item_id)`.
2. **`UserSavedWord`:** Personal vocabulary bookmark with full SM-2 parameters (`ease_factor`, `interval_days`, `repetitions`, `lapses`, `next_review`, `last_reviewed_at`) and multilingual compound uniqueness `(user_id, target_language, lemma, pos, explanation_language)`.
3. **`UserWordReviewEvent`:** Event history of flashcard evaluations.
4. **`UserMistake`:** Mistake Notebook incident tracking error category, stimulus, incorrect answer, correction, and pedagogical remediation.

### 2.4 Content Pipeline
1. **`ContentProcessingJob`:** Asynchronous pipeline tracker recording status, stage progress, timings, and intermediate stage outputs for idempotent stage-level retries.

---

## 3. Storage Layer Allocation & Responsibilities

| Subsystem | Storage Mechanism | Data Stored | Access Pattern |
| :--- | :--- | :--- | :--- |
| **Shared Content** | Supabase PostgreSQL + Dexie `cachedContentItems` | Published items, versions, activities, licenses | Cache-aside; single-read JSON document fetching |
| **Learner Telemetry** | Dexie `learnerContentProgress` + Supabase PostgreSQL | Progress %, completed activities, scores | Read local first; mutate local; background sync with `client_mutation_id` |
| **Personal Lexicon** | Dexie `userSavedWords` + Supabase PostgreSQL | Saved vocabulary, SM-2 intervals, definitions | Indexed by `[user_id, target_language, next_review]` |
| **Mistake Notebook** | Dexie `userMistakes` + Supabase PostgreSQL | Error items, remediation status | Filtered by `[user_id, error_category, status]` |
| **Pipeline Jobs** | Supabase PostgreSQL | Processing job state, stage outputs, logs | Polled by admin UI; updated by processing workers |
| **Settings & Flags** | LocalStorage (`polyglot_settings_{uid}`) | Theme, font size, active course selection | Instant synchronous client read |
