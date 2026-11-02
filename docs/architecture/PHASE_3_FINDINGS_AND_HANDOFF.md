# Lexilume — Phase 3 Findings & Phase 4 Handoff Report

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase Completed:** Phase 3 — Current-State Architecture Modeling  
> **Prepared For:** Phase 4 — Target Architecture & System Redesign  
> **Test Verification Baseline:**  
> - **Vitest Frontend Tests:** 37 test files passed (310 tests)  
> - **Vite Production Build:** 2,775 modules transformed, exit code 0  
> - **Pytest Backend Tests:** 106 passed, 1 skipped (live Gemini test safely disabled)

---

## 1. Executive Summary of Phase 3

Phase 3 — Current-State Architecture Modeling — has consolidated the inventory findings of Phase 1 and the dependency analysis of Phase 2 into an authoritative, evidence-based architectural description of Lexilume as it operates today.

### Core Architectural Conclusions:
1. **The System is Truly Local-First & Resilient:** Lexilume's three-tier storage model (Scoped LocalStorage + Dexie v4 IndexedDB + Supabase PostgreSQL) functions reliably offline. Core learning activities, SM-2 flashcard reviews, placement tests, vocabulary browsing, and PDF study pack generation operate with zero network access.
2. **The Execution Model is Serverless & Edge-Hosted:** The web frontend is a static Vite SPA hosted at `https://lexi.monster`. **There is no long-running Python backend server in production.** The Python engine serves strictly as a CLI batch runner and scheduled GitHub Actions automation script (`daily_polyglot.yml` at 04:00 UTC).
3. **The Current Pipeline is 6 Stages (Not 21):** The working content pipeline consists of 6 sequential stages (Intake, Tokenization, Sentence Pairing, Exercise Synthesis, Moderation, and Delivery). The 21-stage multi-agent pipeline described in historical documentation is an unbuilt specification.
4. **The Zero-Paid AI Invariant is Strictly Preserved:** Google Gemini integration is 100% optional. No server AI keys are bundled into the client build (`no VITE_GEMINI_API_KEY`). If a user does not provide their own personal key, deterministic offline rule engines generate all learning content without network calls or fees.
5. **Zero Breaking Changes:** In accordance with Phase 3 non-negotiable rules, no runtime code, tests, dependencies, or database schemas were modified.

---

## 2. Verified Current-State Facts

- **Frontend Routing:** Custom zero-dependency hash/history router (`frontend/src/app/router/useAppRouter.ts`) supporting 10 active routes.
- **Language Coverage:** 13 authorized base languages supported via four-way linguistic decoupling (`interface_language`, `learning_language`, `explanation_language`, `regional_variety`). Hindi (`hi`) is strictly excluded.
- **Storage Scoping:** All LocalStorage keys are partitioned by UID via `StorageService.getKey()` to eliminate cross-account contamination on shared hardware.
- **Database Schema:** 26 production tables across Supabase migrations `001` through `012`, secured by PostgreSQL Row-Level Security (RLS) enforcing `auth.uid() = user_id`.
- **Sync Reliability:** Dexie `syncQueue` enqueues offline mutations and flushes to Supabase upon reconnection using idempotent compound key upserts and exponential backoff with jitter.
- **Speech Audio:** Browser Web Speech API provides real-time pronunciation synthesis across all 13 languages without external audio server fees.
- **PDF Generation:** `jsPDF` builds binary study packs completely in-memory on the client device.

---

## 3. Partially Implemented & Specification-Only Capabilities

### Partially Implemented Capabilities
1. **Multi-Format Ingestion:** Plain text paste (`<textarea>`) and image OCR (`tesseract.js`) are functional. Document parsers for PDF, DOCX, and EPUB are missing.
2. **Listening Comprehension:** Interactive transcripts and Web Speech TTS work. Synchronized native human audio recordings and phoneme alignment are missing.
3. **Content Classification:** Basic CEFR level and language tags exist. Detailed domain, register, and genre taxonomies are missing.
4. **Content Versioning:** The `content_version` column exists in database schema `012`, but application services do not yet version-control published texts.

### Specification-Only Capabilities
1. **Documented 21-Stage Autonomous Pipeline:** Multi-agent autonomous LLM refactoring, deep syntax tree parsing, and automated multi-level CEFR rewriting exist only in documentation.
2. **17-Format Intake:** Claims of importing video, podcast audio, and EPUB files exist in ADRs without parser implementation.
3. **Unified Content Item Table:** Proposed table `english_content_items` does not exist in the production database.

---

## 4. Documentation Contradictions Resolved

| Documentation Claim | Implementation Reality | Evidence Source |
| :--- | :--- | :--- |
| *Claim: Google Gemini is a mandatory cloud service.* | **Resolved:** Gemini is strictly optional; offline deterministic rule engines generate all explanations if key is absent. | `geminiProvider.ts:24-34`<br>`tests/test_gemini_generator.py:302` |
| *Claim: English, Portuguese, and Spanish require separate pages.* | **Resolved:** Separate page components are 8-line legacy wrappers around `<CourseView />`; modern `LearnPage.tsx` handles all languages dynamically. | `EnglishPage.tsx:1-12`<br>`CourseView.tsx:1-85` |
| *Claim: Application requires cloud connectivity to retain progress.* | **Resolved:** Dexie v4 IndexedDB persists all lesson progress, SRS reviews, and vocabulary offline. | `localDb.ts:40-120`<br>`syncEngine.ts:50-160` |
| *Claim: Python engine runs as a backend REST API.* | **Resolved:** No Python web daemon exists; Python runs exclusively as CLI scripts and GitHub Actions workflows. | `.github/workflows/daily_polyglot.yml`<br>`scripts/run_daily_batch.py` |

---

## 5. Critical Architectural Risks & Technical Debt

1. **LocalStorage Quota Exhaustion:** Storing unbounded `exercise_attempts` arrays in LocalStorage risks exceeding the browser origin quota (~5 MB) for active learners.  
   *Action for Phase 4:* Transition attempt telemetry exclusively to Dexie IndexedDB.
2. **Database Table Duplication:** Overlapping tables exist from evolutionary migrations:
   - Course tracking: `language_tracks` (`001`) vs `user_courses` (`007`) vs `user_learning_tracks` (`010`).
   - Content publishing: `daily_lessons` (`001`) vs `daily_published_content` (`012`).  
   *Action for Phase 5:* Safely consolidate reads/writes to `user_courses` and `daily_published_content` while retaining legacy tables.
3. **Monolithic Bundle Size:** Production Vite bundle exceeds 2.6 MB uncompressed because all routes and heavy dependencies (`minisearch`, `jspdf`, `lucide-react`) are bundled into a single chunk.  
   *Action for Phase 4:* Introduce `React.lazy()` route splitting.
4. **Procedural Inversion:** The lesson generator generates random synthetic sentences from seed arrays rather than deriving vocabulary and exercises from real-world reading texts.  
   *Action for Phase 4:* Design the content-centred architecture where authentic texts serve as the primary source of truth.

---

## 6. Phase 4 Recommendations & Directives

Phase 4 will establish the **Target Architecture** for Lexilume's content-centred transformation:
1. **Unified Content Model:** Design the canonical `english_content_items` schema supporting authentic text intake (stories, news, workplace emails, technical guides).
2. **Multi-Activity Single Source Pipeline:** Ensure that an ingested English text generates reading comprehension, vocabulary flashcards, grammar analysis, speaking prompts, and writing tasks from the same underlying text.
3. **Preserve System Invariants:**
   - Maintain the Zero-Paid AI mandate with deterministic synthesis fallbacks.
   - Maintain local-first offline resilience via Dexie v4 and SyncEngine.
   - Maintain four-way linguistic decoupling (allowing Portuguese or Spanish explanations for English learners).
4. **Non-Destructive Safe Migration:** Ensure the existing production application at `https://lexi.monster` remains functional throughout all transition phases.

---

## 7. Phase 3 Sign-Off & Acceptance Confirmation

- [x] All 6 Phase 3 architecture deliverables produced in `docs/architecture/`.
- [x] All 10 mandatory system architecture diagrams created in `CURRENT_STATE_DIAGRAMS.md`.
- [x] Verified current facts separated from partially implemented and specification-only designs.
- [x] Complete data lifecycle traced from startup to local persistence and cloud sync.
- [x] Gap analysis completed with classification across all 8 standard categories.
- [x] Reusable assets cataloged into 6 action categories.
- [x] Automated test suites verified: 310 Vitest tests passed, 106 Pytest tests passed, Vite build passed.
- [x] Zero runtime code, dependencies, migrations, or database tables modified.
- [x] System is ready for Phase 4 Target Architecture design.
