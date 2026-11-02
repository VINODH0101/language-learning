# Lexilume Phase 7 — Contextual Vocabulary & Spaced Repetition Implementation Report

> **Repository:** `VINODH0101/language-learning`  
> **Implementation Branch:** `phase-7-core-implementation`  
> **Milestones Addressed:** Milestone 7.6 (Contextual Vocabulary Lookup & Saving) & Pedagogical Mistake Remediation  
> **Status:** Implemented & Verified

---

## 1. Executive Summary

In traditional curriculum applications, vocabulary is presented in decontextualized flashcard lists. Phase 7 implements in-situ lexical acquisition directly from authentic texts. Learners click any word token while reading to inspect its contextual sense (how it functions in that specific sentence) alongside its general lexical definition. Learners can then persist words directly into their personal lexicon (`user_saved_words`) with full SuperMemo-2 (SM-2) spaced repetition parameters.

---

## 2. In-Situ Lexical Architecture

### 2.1 Contextual Meaning vs. General Definition
Every token annotated in the content pipeline carries dual semantic payloads:
1. **Contextual Meaning:** The exact nuanced sense of the word in that specific narrative context (e.g., *velvety* describing the rich, silky texture of micro-foamed milk in a flat white).
2. **General Definition:** The standard dictionary definition of the lemma for broader understanding.
3. **Context Translation:** Pedagogical translation into the learner's chosen explanation language (`pt`, `es`, or `en`).
4. **Phonetic IPA & Example Sentence:** Pronunciation guidance and original sentence reference.

```
+-----------------------------------------------------------------------+
|  velvety                    ADJECTIVE • B1               [Listen Audio] |
|  /ˈvɛl.vɪ.ti/                                                         |
|                                                                       |
|  Contextual Meaning:                                                  |
|  Having a soft, smooth, creamy texture pleasant to the palate.        |
|                                                                       |
|  General Definition:                                                  |
|  Resembling velvet in texture; soft and smooth.                       |
|                                                                       |
|  Translation (pt):                                                    |
|  aveludado, cremoso                                                   |
|                                                                       |
|  Context Sentence:                                                    |
|  "The barista poured the velvety flat white into a warm ceramic cup."|
|                                                                       |
|  [ Cancel ]                                  [ Save to My Words (SM-2)]|
+-----------------------------------------------------------------------+
```

### 2.2 Personal Lexicon Persistence (`user_saved_words`)
When saved, words enter the learner's personal vocabulary queue with initial SM-2 state:
- `ease_factor`: 2.5 (standard starting ease)
- `interval_days`: 0 (due for immediate consolidation)
- `repetitions`: 0
- `lapses`: 0
- `state`: `'learning'`
- `next_review`: Current date (`YYYY-MM-DD`)

### 2.3 SM-2 Review Progression & History
Reviews are performed via `MyWordsPage` using an interactive flashcard player with ratings 0 to 5:
- Rating < 3: Failure/Lapse. Interval resets to 1 day; lapse counter increments; ease factor adjusts according to SM-2 formula.
- Rating >= 3: Success. Interval progresses (Rep 1 -> 1 day, Rep 2 -> 6 days, Rep 3+ -> `interval * ease_factor`).
- Repetition threshold: When `repetitions >= 3`, word graduates from `'learning'` to `'reviewing'`.
- Every review writes an immutable record to `user_word_review_events` capturing:
  - `saved_word_id`, `rating`, `previous_interval_days`, `new_interval_days`, `previous_ease_factor`, `new_ease_factor`, `client_mutation_id`, `reviewed_at`.

---

## 3. Risk Resolutions Implemented

### Risk 1 Resolution: Multilingual Lemma Collision Protection
In legacy systems, saving homonyms or words across different languages caused unique constraint violations. In Phase 7:
- Table `user_saved_words` enforces:
  ```sql
  CONSTRAINT uq_user_saved_words UNIQUE (user_id, target_language, lemma, pos, explanation_language)
  ```
- This guarantees:
  - A word in Spanish and Portuguese with the same spelling never collides.
  - A word that functions as both a noun and a verb (e.g. *record*) can be saved in both parts of speech independently.
  - A learner learning with English explanations vs Portuguese explanations has isolated semantic definitions.

### Risk 2 Resolution: Retention of All 8 SM-2 Scheduling Fields
All 8 parameters required for mathematically rigorous spaced repetition are retained:
1. `ease_factor REAL NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3)`
2. `interval_days INTEGER NOT NULL DEFAULT 0 CHECK (interval_days >= 0)`
3. `repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0)`
4. `lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0)`
5. `last_reviewed_at TIMESTAMPTZ`
6. `next_review DATE NOT NULL DEFAULT CURRENT_DATE`
7. `legacy_srs_item_id VARCHAR(100)`
8. `state VARCHAR(20) NOT NULL DEFAULT 'learning'`

---

## 4. Pedagogical Mistake Notebook (`user_mistakes`)

Comprehension errors made during reading activities are automatically recorded into the learner's Mistake Notebook (`MyMistakesPage`):
- **Categorization:** Errors are classified into 9 pedagogical categories:
  - `vocabulary_choice`, `verb_tense`, `preposition`, `spelling`, `word_order`, `article_usage`, `comprehension_inference`, `pronunciation`, `general`.
- **Notebook Telemetry:** Tracks `stimulus`, `user_response`, `correct_response`, `pedagogical_explanation`, `occurrences_count`, and `status` (`'unresolved' | 'review_pending' | 'mastered' | 'dismissed'`).
- **Targeted Re-testing:** Learners can launch a targeted re-test mode directly from `MyMistakesPage`. Correct re-evaluations mark the mistake as `'mastered'`.
