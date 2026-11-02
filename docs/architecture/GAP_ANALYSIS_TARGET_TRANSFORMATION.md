# Lexilume — Gap Analysis: Current System vs Target Transformation

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 3 — Current-State Architecture Modeling  
> **Target Vision:**  
> **Admin supplies authentic English content (conversations, stories, news, workplace emails, technical docs). Lexilume analyzes, translates, explains, validates, and prepares multi-modal learning activities. Learners use that same content to improve English reading, listening, speaking, writing, vocabulary, and grammar.**

---

## 1. Executive Summary

This document establishes the systematic architectural delta between Lexilume's **current state** (a polyglot multi-course platform driven by procedural lesson templates and seed JSON datasets) and its **target transformation** (a content-centred English learning platform where real-world authentic texts serve as the single source of truth for all learning activities).

In strict adherence to Phase 3 rules:
- No code or database migrations are executed in this phase.
- All gaps are classified using verified source code references.
- Reusable assets are cataloged to prevent redundant reinvention during Phase 4.

---

## 2. Capability Gap Classification Matrix (Section 18.2)

Every architectural capability required for the content-centred transformation is classified according to the 8 standard categories:

| Target Capability / Requirement | Gap Classification | Existing Source Reference | Reality in Current Codebase | Delta / Transformation Required |
| :--- | :--- | :--- | :--- | :--- |
| **Unified Content Item Model** | **Requires redesign** | `supabase/canonical_schema_current.sql`<br>`frontend/src/types/index.ts` | Educational content is fragmented across `curriculum_nodes`, `daily_lessons`, and `daily_published_content`. | Design unified `english_content_items` entity in Phase 4 that links source texts to generated activities. |
| **Multi-Format Ingestion (Text)** | **Already supported** | `AdminDailyContentStudio.tsx:55` | Textarea form inputs and plain `.txt` file readers function. | Retain directly; add word count and reading time estimators. |
| **Multi-Format Ingestion (OCR)** | **Supported with limitations** | `frontend/src/services/ocrService.ts:106` | Client-side Tesseract.js recognizes text from uploaded images. | Optimize WASM worker loading; add preprocessing for image contrast. |
| **Multi-Format Ingestion (PDF/DOCX/EPUB)** | **Missing** | N/A | No client-side or backend parsers exist for binary documents. | Integrate client-side document parsers (`pdfjs-dist` or Python parsers) in Phase 5. |
| **Content Taxonomy & Metadata** | **Partially implemented** | `AdminDailyContentStudio.tsx:65` | Stores CEFR level (`A1`-`C1`), title, author, and country name. | Add metadata fields: `genre`, `domain` (workplace, technical, literary), `topic`, and `target_audience`. |
| **Contextual Word Explanations** | **Already supported** | `ContextualWordPopover.tsx:40` | Highlighted words display definition, IPA, audio, and bookmarking. | Make popover omnipresent across all reading and exercise screens. |
| **Dual Portuguese/Spanish Explanations**| **Already supported** | `languageMatrix.ts:24`<br>`courseService.ts:45` | Four-way linguistic decoupling allows PT or ES explanations for English. | Retain strictly; ensure all ingested English content has PT/ES notes. |
| **Receptive: Graded Reading Studio** | **Supported with limitations** | `ReadingSection.tsx:35`<br>`ReadingStudio.tsx:42` | Renders reading passages but sourced from static seed data. | Rewire reading studio to pull from ingested `english_content_items`. |
| **Receptive: Synchronized Listening** | **Partially implemented** | `ListeningSection.tsx:45`<br>`speech.ts:28` | Uses native Web Speech API TTS. Lacks native human audio recordings. | Add native audio upload capability and synchronized playback controls. |
| **Productive: Speech & Pronunciation**| **Supported with limitations** | `SpeakingCoach.tsx:50` | Uses Web Speech API for recognition; grades pronunciation score. | Link speaking prompts directly to sentences from the ingested text. |
| **Productive: Writing Coach** | **Supported with limitations** | `WritingCoach.tsx:45` | Evaluates writing via LanguageTool and regex rule engine. | Connect writing prompts directly to reading comprehension questions. |
| **Lexical: Vocabulary Extraction** | **Requires redesign** | `lessonGenerator.ts:180` | Vocabulary is pulled from pre-defined seed arrays (`seedData.ts`). | Build automated lemma extractor that identifies key vocabulary from source text. |
| **Pedagogical: Grammar in Context** | **Requires redesign** | `GrammarSection.tsx:50` | Displays abstract grammar formulas not linked to reading text. | Extract grammar focus rules directly from structures present in the text. |
| **Multi-Activity Single Source Reuse**| **Missing** | N/A | Lessons are synthesized in isolation; activities cannot reference a shared article. | Design activity generator where 1 text generates reading, vocab, and quiz units. |
| **Content Versioning** | **Requires data migration** | `012_daily_content_and_activity.sql` | `content_version` column exists in activity logs but is unused. | Implement immutable content versioning (`v1`, `v2`) so text edits preserve history. |
| **Attribution & Rights Management** | **Already supported** | `licenses_and_sources` table | Stores license type, author, source URL, and license terms. | Enforce licensing metadata entry on all newly imported texts. |
| **Offline Durability & Sync** | **Already supported** | `localDb.ts:40`<br>`syncEngine.ts:60` | Dexie v4 stores and SyncEngine provide 100% offline persistence. | Ensure ingested content packages are cached locally in Dexie `cachedContent`. |
| **Storage Quota Management** | **Requires security improvement**| `storage.ts:162` | LocalStorage stores unbounded `exercise_attempts` arrays (~5MB limit). | Move exercise attempt logs exclusively into Dexie IndexedDB in Phase 4. |
| **Database Schema Duplication** | **Requires data migration** | `user_courses` vs `user_learning_tracks`<br>`daily_lessons` vs `daily_published_content`| Overlapping tables from migrations `001`, `007`, `010`, `012`. | Safe consolidation plan in Phase 5: retain legacy tables, route to target tables. |
| **Monolithic Bundle Splitting** | **Requires redesign** | `vite.config.ts`, `App.tsx` | Production bundle exceeds 2.6 MB without dynamic route splitting. | Introduce `React.lazy()` for `/admin`, `/culture`, and `/world` routes in Phase 4. |

---

## 3. Reusable Assets Catalog (Section 18.3)

To ensure maximum efficiency and preserve proven functionality, existing components, services, and tests are categorized for the future architecture:

### 3.1 Reuse Directly
These assets are architecturally sound, thoroughly tested, and will transition into the target architecture without code changes:
- `frontend/src/services/localDb.ts`: Dexie v4 IndexedDB configuration and offline stores.
- `frontend/src/services/syncEngine.ts`: Offline mutation queue, automatic reconnection, and idempotent sync.
- `frontend/src/services/srs.ts`: SM-2 spaced repetition algorithm and review queue logic.
- `frontend/src/services/speech.ts`: Web Speech API voice synthesis and speech-to-text.
- `frontend/src/services/pdfService.ts`: In-memory jsPDF study pack generator.
- `frontend/src/components/common/ContextualWordPopover.tsx`: Interactive floating definition popover.
- `frontend/src/lib/languages/languageMatrix.ts`: Four-way linguistic decoupling and regional variety enforcement.
- `frontend/src/lib/security/contentSanitizer.ts`: DOMPurify input sanitization.
- `frontend/src/services/providers/examples/tatoebaProvider.ts`: Tatoeba bilingual example provider.
- `frontend/src/services/providers/dictionary/freeDictionaryAdapter.ts`: English definition and phonetics provider.
- All database migrations `001` through `012` and `supabase/canonical_schema_current.sql`.

### 3.2 Reuse with Modification
These modules possess strong foundations but require parameter updates or extended interfaces to support content-centred data:
- `frontend/src/features/admin/AdminWorkbench.tsx`: Extend Content Studio tabs to support arbitrary English article imports and multi-activity generation.
- `frontend/src/features/course/CourseView.tsx`: Retain the 4 Guided Learning Stages, but populate stages from a shared `english_content_items` payload instead of procedurally generated lessons.
- `frontend/src/features/reading/ReadingStudio.tsx`: Update data source from seed articles to dynamic imported content items.
- `frontend/src/services/courseService.ts`: Focus canonical course management on English acquisition while retaining multilingual secondary tracks.
- `engine/generators/template_engine.py`: Modify exercise templates to accept arbitrary source sentences from ingested content rather than static seed files.

### 3.3 Consolidate Later (Phase 5)
These components perform overlapping functions and should be merged during implementation:
- `frontend/src/pages/EnglishPage.tsx`, `PortuguesePage.tsx`, `SpanishPage.tsx`: Merge completely into the dynamic `LearnPage.tsx`.
- `frontend/src/services/storage.ts` legacy methods: Deprecate `polyglot_track_pt` in favor of `polyglot_courses_{uid}`.
- Database tables: Consolidate reads/writes to `user_courses` (retiring `user_learning_tracks`) and `daily_published_content` (retiring `daily_lessons`).

### 3.4 Replace Later (Phase 5)
- Procedural `lessonGenerator.ts`: Replace on-the-fly random template generation with an authentic text analysis and activity packaging engine.

### 3.5 Retain for Backward Compatibility
- Legacy migration SQL scripts `001_initial_schema.sql` through `012_daily_content_and_activity.sql`.
- Existing historical user tables (`user_vocabulary_history`, `lesson_exercises`).

---

## 4. Current Data-Model & Architectural Limitations

1. **Inverted Content Flow:** Currently, the system starts with grammar taxonomy nodes and randomly picks words and sentences to construct a lesson.  
   *Target Need:* The system must start with **authentic text content**, extracting grammar and vocabulary organically from the reading passage.
2. **Missing Binary Document Parsers:** The administrative studio cannot parse uploaded PDF, DOCX, or EPUB files; administrators must manually copy and paste plain text.
3. **Rigid CEFR Binding:** Current lessons are rigidly locked to a single CEFR level. Authentic texts often contain a range of linguistic registers that require multi-level pedagogical scaffolding.
4. **Client-Side Storage Risk:** Storing unbounded exercise attempt logs in browser LocalStorage risks hitting the 5 MB origin quota on mobile browsers.

---

## 5. Recommended Phase 4 Design Considerations

1. **Unified Schema:** Define `english_content_items` in Supabase and Dexie with columns: `id`, `title`, `author`, `source_url`, `license_type`, `genre`, `difficulty_cefr`, `raw_text`, `processed_payload`, `status`, `version`.
2. **Text Analysis Engine:** Implement a deterministic text analysis pipeline in Python (or client TypeScript) that takes raw English text and extracts:
   - Unique lemmas with frequencies and CEFR ratings.
   - Key grammar structures with contextual explanations.
   - Reading comprehension questions.
   - Cloze deletion exercise pairs.
3. **Omnipresent Contextual Popover:** Embed `ContextualWordPopover` across all learner views so learners can click any word in any text, conversation, or exercise to hear pronunciation and save it to their SM-2 review deck.
4. **Zero-Paid AI Fidelity:** Preserve the invariant that all text parsing, definition extraction, and exercise generation operate deterministically offline using open educational datasets (Wiktionary, Tatoeba) without requiring paid LLM APIs.
