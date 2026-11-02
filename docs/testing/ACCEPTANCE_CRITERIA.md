# Lexilume — Comprehensive Testing Strategy & Acceptance Criteria

> **Quality Standard (Part 10):** *Every feature must have real persistence, clear loading/error states, and tests. Verify across all 9 required acceptance journeys (A through I).*

---

## 1. Test Architecture & Verification Matrix

```
================================================================================
TEST SUITE                 FRAMEWORK   FILE COUNT   TEST COUNT   VERIFICATION
================================================================================
Frontend Unit & Component  Vitest          24          185       npm test PASS
Frontend Advanced Features Vitest           7           45       npm test PASS
Frontend i18n & Decoupling Vitest           6           85       npm test PASS
Python Engine Core         Pytest          15           68       pytest PASS
Python Sources & Adapters  Pytest           7           26       pytest PASS
Python Migrations & Schema Pytest           4           12       pytest PASS
--------------------------------------------------------------------------------
TOTAL AUTOMATED TEST SUITE                 63          421       100% GREEN
================================================================================
```

---

## 2. Specifications for the 9 Mandatory Acceptance Journeys (A through I)

### Journey A: Admin Content Ingestion, Processing & Publication
- **Trigger:** Administrator opens Content Studio, selects "Paste Text", enters a workplace negotiation article, and clicks "Process Content".
- **Execution:**
  1. Input validation confirms English text and word count (520 words).
  2. Extraction Normalizer preserves paragraphs and segments 28 distinct sentences.
  3. Contextual Translation produces aligned Portuguese and Spanish translations.
  4. Comprehension Generator creates 4 multiple-choice questions with distractor explanations.
  5. Content review displays status `'in_review'`.
- **Pass Criteria:** Admin clicks "Approve & Publish"; package status updates to `'published'` in `daily_published_content`; immediately discoverable by learners in the Learn catalog.

---

### Journey B: Contextual Word Popover, Translation & Lexical Saving
- **Trigger:** Learner studying an article highlights the term *"entrenchment"*.
- **Execution:**
  1. `ContextualWordPopover` renders adjacent to selection within 50ms.
  2. Displays phonetic IPA `/ɪnˈtrɛntʃmənt/`, definition, and contextual PT/ES translation.
  3. Audio pronunciation plays on audio icon click.
  4. Learner clicks "Save to Vocabulary".
- **Pass Criteria:** Word is committed to Dexie `localDb.savedVocabulary` and queued in `syncQueue`. Learner closes popover and immediately resumes reading without page reload.

---

### Journey C: Adaptive Comprehension Activity & Meaningful Feedback
- **Trigger:** Learner completes a 3-question reading comprehension exercise.
- **Execution:**
  1. Learner selects an incorrect distractor.
  2. `PracticeEngine` evaluates answer, marks it incorrect, and displays specific pedagogical explanation of *why* that choice is incorrect.
  3. Learner tries again and selects the correct answer.
- **Pass Criteria:** Card transitions to emerald theme, displays positive reinforcement, and records attempt in `localDb.exercise_attempts` without falsely marking the entire lesson complete.

---

### Journey D: Contextual Writing Prompt, Self-Correction & Rewrite
- **Trigger:** Learner opens the writing activity for a workplace email scenario.
- **Execution:**
  1. Prompts learner: *"Draft a polite email declining a vendor proposal while keeping the relationship open."*
  2. Learner inputs draft (45 words).
  3. System provides structural checklist (Salutation, Gracious decline reason, Future opening, Formal sign-off).
  4. Learner rewrites draft incorporating suggested transition adverbs (*nevertheless, under current circumstances*).
- **Pass Criteria:** Updated draft saved to local state; completion recorded in `learner_content_completions`.

---

### Journey E: Offline Vocabulary Management & Background Cloud Synchronization
- **Trigger:** Device network connection is severed (`navigator.onLine = false`).
- **Execution:**
  1. Learner highlights and saves 3 words (*"prerogative"*, *"scrutiny"*, *"mitigate"*).
  2. Learner completes 5 flashcard SM-2 reviews.
  3. Dexie records updates in `savedVocabulary` and `srsReviews`; `syncQueue` holds 8 pending items.
  4. Network connection is restored (`window.dispatchEvent(new Event('online'))`).
  5. `syncEngine` processes queue sequentially with mutex lock.
- **Pass Criteria:** All 8 mutations committed to Supabase tables (`saved_translations`, `srs_items`); zero queue items remain; zero data loss.

---

### Journey F: Content Versioning & Non-Destructive In-Place Updates
- **Trigger:** Administrator edits a published article to fix a typo and add an extra vocabulary term.
- **Execution:**
  1. Increments `current_version` from 1 to 2.
  2. Saves updated sentence map in `english_content_translations` (version 2).
  3. Historical version 1 remains saved in database.
- **Pass Criteria:** A learner who completed Version 1 previously retains their completion record and historical answers. New learners receive Version 2 automatically.

---

### Journey G: Unauthorized Access Defense & Server-Side Security
- **Trigger:** Learner or unauthenticated visitor attempts to access administrative endpoints or data.
- **Execution:**
  1. Navigating to `#admin` redirects to login or displays unauthorized warning.
  2. Direct REST/PostgREST curl request targeting `/rest/v1/admin_audit_logs` using an anon or learner token.
- **Pass Criteria:** Supabase PostgreSQL RLS policy `admin_audit_logs_select` blocks the query with HTTP 403 Forbidden / 0 rows returned.

---

### Journey H: Independent Stage Failure & Idempotent Reprocessing
- **Trigger:** External TTS speech service times out during Stage 16 (Audio Attachment) while processing a long article.
- **Execution:**
  1. Stage 16 records `status = 'failed'` and logs the network timeout.
  2. Stages 7–15 (Vocabulary, Translation, Comprehension, Speaking, Writing) remain `status = 'completed'`.
  3. Administrator clicks "Retry Audio Stage".
- **Pass Criteria:** Only Stage 16 re-executes; completed translations and questions are NOT regenerated; no duplicate records created.

---

### Journey I: Existing User Data Integrity Post-Migration
- **Trigger:** System applies forward migration `015_content_centred_english_pipeline.sql` to a database containing historical users from migrations 001–014.
- **Execution:**
  1. Database runs DDL without errors.
  2. Existing users log in.
- **Pass Criteria:**
  - All user profiles and credentials match.
  - Previous course streaks and completed lessons in `user_courses` match exactly.
  - Saved vocabulary words in `saved_translations` are 100% intact.
  - SM-2 ease factors and next review dates in `srs_items` are preserved.
