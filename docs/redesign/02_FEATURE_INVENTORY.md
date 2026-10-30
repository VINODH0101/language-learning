# Lexilume — Comprehensive Feature Inventory & Component Audit

> **Document:** `docs/redesign/02_FEATURE_INVENTORY.md`  
> **Status:** Completed Feature Audit  
> **Target Application:** Lexilume (`https://lexi.monster`)  
> **Repository:** `VINODH0101/language-learning`  
> **Execution Date:** October 2026  

---

## 1. Overview & Classification Schema

This inventory audits every user-facing page, UI component, background service, and CLI script in the Lexilume repository. Each entry is tagged with its current status and verification finding:
- **`[Confirmed from source code]`**: Found directly in application files.
- **`[Confirmed by an executable test]`**: Verified via Vitest or Pytest executions.
- **`[Requires production verification]`**: Depends on live cloud state or production credentials.
- **`[Recommendation]`**: Actionable architectural recommendation.

---

## 2. Frontend Page Inventory (11 Pages)

| Page File | Route / Tab Identifier | Core Responsibility | Current Operational Status | Redundancy / Defect Identified | Finding Tag |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DashboardPage.tsx` | `'dashboard'` | Central home view: greeting, active course summary, daily streak, quick practice shortcuts, culture previews. | **Active & Tested** | Dynamic content properly respects selected interface language. | `[Confirmed by an executable test: dashboard.test.tsx]` |
| `PortuguesePage.tsx` | `'portuguese'` | Portuguese learning track: CEFR units (A1-C1), lesson modals, placement test trigger. | **Active & Duplicated** | 98% identical code to `SpanishPage` and `EnglishPage`. Hardcoded to `pt`. | `[Confirmed from source code: PortuguesePage.tsx]` |
| `SpanishPage.tsx` | `'spanish'` | Spanish learning track: CEFR units (A1-C1), lesson modals, placement test trigger. | **Active & Duplicated** | 98% copy-paste of `PortuguesePage.tsx`. Hardcoded to `es`. | `[Confirmed from source code: SpanishPage.tsx]` |
| `EnglishPage.tsx` | `'english'` | English learning track: CEFR units (A1-C1), lesson modals, placement test trigger. | **Active & Duplicated** | 98% copy-paste of `PortuguesePage.tsx`. Hardcoded to `en`. | `[Confirmed from source code: EnglishPage.tsx]` |
| `VocabularyPage.tsx` | `'vocabulary'` | Vocabulary explorer: search, CEFR filters, audio playback, phrasebook favorites, study pack PDF download. | **Active & Tested** | High memory usage during PDF export. | `[Confirmed by an executable test: vocabulary.test.ts]` |
| `PracticePage.tsx` | `'practice'` | Interactive drill center: SM-2 flashcard deck, grammar studio (LanguageTool), false friends trainer, mistake notebook. | **Active & Tested** | All 4 drill modes functional offline. | `[Confirmed by an executable test: srs.test.ts, courseTranslationsAndPractice.test.tsx]` |
| `ProgressPage.tsx` | `'progress'` | User analytics: CEFR level progress, retention metrics, activity calendar, mastered word counts. | **Active** | Uses local Dexie and mock analytics; needs backend sync. | `[Confirmed from source code: ProgressPage.tsx]` |
| `CultureExplorePage.tsx` | `'culture'` | Cultural immersion: Wikipedia cultural articles, anime/manga search (Jikan), bookmarked culture items. | **Active & Tested** | Jikan API fails frequently due to external rate limiting/network unreachable. | `[Confirmed by an executable test: cultureExplore.test.ts]` |
| `TranslatePage.tsx` | `'translate'` | Multilingual translation tool: MyMemory API, local trilingual dictionary fallback, false friend alerts. | **Active & Tested** | Quota guard enforces guest limits (100 req/day). | `[Confirmed by an executable test: translate.test.ts]` |
| `SettingsPage.tsx` | `'settings'` | User configuration: UI language, active course manager, regional varieties, daily goals, data reset. | **Active & Tested** | LocalStorage persistence partitioned by user ID. | `[Confirmed by an executable test: languageDecoupling.test.ts]` |
| `AdminPage.tsx` | `'admin'` | Administrative dashboard: user management, course analytics, system logs, role assignment. | **Active & Protected** | Guarded by `role === 'admin'` check; requires Supabase admin credentials. | `[Confirmed from source code: AdminPage.tsx]` |

---

## 3. UI Component Inventory (36 Components)

### 3.1 Common & Layout (`components/common/`)

| Component | Responsibility | Status | Finding Tag |
| :--- | :--- | :--- | :--- |
| `Navigation.tsx` | Main top navigation bar, language switcher, mobile hamburger menu. | **Hardcoded language tabs** (PT, ES, EN buttons). Cannot scale to 13 languages without refactor. | `[Confirmed from source code: Navigation.tsx]` |
| `Logo.tsx` | Lexilume branding SVG and typography ("Illuminate Your Words"). | **Operational** | `[Confirmed from source code: Logo.tsx]` |
| `PageHeader.tsx` | Unified page title, breadcrumbs, and action slot container. | **Operational** | `[Confirmed from source code: PageHeader.tsx]` |
| `AudioButton.tsx` | Web Speech API speech synthesis trigger with rate, pitch, and voice code support. | **Operational** (Tested in speech service). | `[Confirmed from source code: AudioButton.tsx]` |
| `Button.tsx` | Design system button with primary, secondary, outline, and danger variants. | **Operational** | `[Confirmed from source code: Button.tsx]` |
| `Card.tsx` | Design system card wrapper with elevation and border tokens. | **Operational** | `[Confirmed from source code: Card.tsx]` |
| `Badge.tsx` | Status and CEFR level pill badge. | **Operational** | `[Confirmed from source code: Badge.tsx]` |
| `Breadcrumbs.tsx` | Navigation trail component. | **Operational** | `[Confirmed from source code: Breadcrumbs.tsx]` |
| `ProgressBar.tsx` | Animated linear progress indicator. | **Operational** | `[Confirmed from source code: ProgressBar.tsx]` |
| `EmptyState.tsx` | Zero-state placeholder illustration with call-to-action button. | **Operational** | `[Confirmed from source code: EmptyState.tsx]` |
| `Alert.tsx` | Warning, info, error, and success banners. | **Operational** | `[Confirmed from source code: Alert.tsx]` |

### 3.2 Lesson & Pedagogy (`components/lesson/`)

| Component | Responsibility | Status | Finding Tag |
| :--- | :--- | :--- | :--- |
| `VocabularySection.tsx` | Renders lesson vocabulary words with audio, CEFR badges, and definitions. | **Operational** | `[Confirmed from source code]` |
| `GrammarSection.tsx` | Displays grammatical rules, conjugations, and examples in the chosen explanation language. | **Operational** | `[Confirmed from source code]` |
| `ReadingSection.tsx` | Reading comprehension passages with clickable word definitions. | **Operational** | `[Confirmed from source code]` |
| `ListeningSection.tsx` | Dictation and listening comprehension exercises using Web Speech API. | **Operational** | `[Confirmed from source code]` |
| `SpeakingSection.tsx` | Pronunciation drill component comparing speech input with target phrase. | **Operational** | `[Confirmed from source code]` |
| `WritingSection.tsx` | Free-form writing prompts with integrated LanguageTool grammar feedback. | **Operational** | `[Confirmed from source code]` |
| `ExerciseSection.tsx` | Multiple-choice, fill-in-the-blank, and matching interactive exercises. | **Operational** | `[Confirmed from source code]` |
| `ConversationSection.tsx` | Multi-turn contextual dialogues generated deterministically or via Gemini. | **Operational** | `[Confirmed from source code]` |
| `ScenariosSection.tsx` | Real-world roleplay simulations (airport, cafe, hotel). | **Operational** | `[Confirmed from source code]` |
| `FalseFriendCard.tsx` | Warning card highlighting linguistic false cognates with corrective explanations. | **Operational** | `[Confirmed by an executable test]` |

### 3.3 Practice, Vocabulary & Diagnostic (`components/practice/`, `vocabulary/`, `diagnostic/`)

| Component | Responsibility | Status | Finding Tag |
| :--- | :--- | :--- | :--- |
| `FlashcardDeck.tsx` | SM-2 spaced repetition card review system with flip animations and rating buttons (0-5). | **Operational & Tested** | `[Confirmed by an executable test: srs.test.ts]` |
| `LanguageToolStudio.tsx` | Real-time grammar checking and stylistic feedback interface. | **Operational** | `[Confirmed from source code]` |
| `FalseFriendsTrainer.tsx` | Specialized quiz interface targeting inter-language false cognates. | **Operational** | `[Confirmed from source code]` |
| `MistakeNotebook.tsx` | Repository of historically failed exercise items for focused remediation. | **Operational** | `[Confirmed from source code]` |
| `VocabularyCard.tsx` | Interactive word card with bookmarking, pronunciation, and example sentences. | **Operational** | `[Confirmed from source code]` |
| `SentenceCard.tsx` | Example sentence card with syntax highlighting. | **Operational** | `[Confirmed from source code]` |
| `PracticeFlashcards.tsx` | Vocabulary-specific flashcard drill mode. | **Operational** | `[Confirmed from source code]` |
| `PracticeQuiz.tsx` | 10-question dynamic quiz generated from user phrasebook. | **Operational** | `[Confirmed from source code]` |
| `LiveDictionaryLookup.tsx` | Live external dictionary search (Free Dictionary API / Dicionário Aberto). | **Operational** | `[Confirmed from source code]` |
| `DownloadPdfDialog.tsx` | Configuration modal for exporting vocabulary study packs via `jspdf`. | **Operational & Tested** | `[Confirmed by an executable test: vocabulary.test.ts]` |
| `PlacementTestModal.tsx` | Adaptive CEFR diagnostic placement test modal (places into A1-C1). | **Operational & Tested** | `[Confirmed by an executable test: diagnostic.test.ts]` |
| `GuidedOnboardingModal.tsx` | First-time user setup: select interface, target language, and initial proficiency. | **Operational** | `[Confirmed from source code]` |
| `ArticleReaderModal.tsx` | Modal reader for long-form Wikipedia cultural articles. | **Operational** | `[Confirmed from source code]` |
| `AuthModal.tsx` | Supabase authentication dialog (Sign in, Sign up, Password recovery). | **Operational** | `[Confirmed from source code]` |
| `UserDetailModal.tsx` | Admin inspect modal for viewing user metadata and learning tracks. | **Operational** | `[Confirmed from source code]` |

---

## 4. Background Services & Client Utilities

| Service File | Responsibility | Tested Status | Key Findings |
| :--- | :--- | :--- | :--- |
| `courseService.ts` | Multi-course management (active course, enrollment, switching, regional variety). | **100% Pass** (`course.test.ts`) | Mutates `user_courses` directly via Supabase. Bypasses `syncEngine`. |
| `lessonGenerator.ts` | Client-side deterministic lesson generation using vocabulary seeds. | **100% Pass** (`lessonGenerator.test.ts`) | Zero-cost deterministic generation without external LLM. |
| `srs.ts` | SM-2 spaced repetition calculation engine. | **100% Pass** (`srs.test.ts`) | Implements interval jumps (1 -> 6 -> interval * ef) and same-day idempotency. |
| `speech.ts` | Web Speech API speech synthesis wrapper. | **Operational** | Fallback to silent mode if browser lacks synthesis voice. |
| `pdfService.ts` | Generates formatted multi-page study packs with jsPDF. | **100% Pass** (`vocabulary.test.ts`) | Bundles `html2canvas` and `jspdf`, creating a 400 kB+ vendor chunk. |
| `localDb.ts` | Dexie IndexedDB client managing local tables. | **100% Pass** (`localDb.test.ts`) | Schema version 1 includes `studyItems`, `bookmarks`, `words`, `syncQueue`, `logs`. |
| `syncEngine.ts` | Offline mutation queue and background replay service. | **100% Pass** (`syncEngine.test.ts`) | **Orphaned in production UI**: never invoked outside its test file. |
| `storage.ts` | Tenant-isolated `localStorage` service scoping keys by `user_id`. | **100% Pass** (`storage.test.ts`) | Successfully prevents cross-user credential or preference leaks. |
| `supabase.ts` | Supabase JS client initializer with dummy fallback if credentials absent. | **Operational** | Allows application to boot completely offline without cloud credentials. |
| `i18n.ts` | UI string translations for English, Portuguese, and Spanish. | **100% Pass** (`i18n.test.ts`) | Missing translations for the 10 proposed additional languages. |

---

## 5. Python Engine & Automation Scripts

| Script / Module | Responsibility | Test Status | Key Findings |
| :--- | :--- | :--- | :--- |
| `engine/facade.py` | Unified Python engine facade (`PolyglotEngine`) for batch and CLI tasks. | **100% Pass** (`test_engine_facade.py`) | Orchestrates curriculum, diagnostic, SRS, and generation. |
| `engine/generators/template_engine.py` | Deterministic template-based lesson generator. | **100% Pass** (`test_generator.py`) | Generates complete lessons with vocabulary, grammar, and exercises. |
| `engine/generators/gemini_generator.py` | Optional AI generator for multi-turn dialogues with dynamic model discovery. | **100% Pass** (`test_gemini_generator.py`) | Gracefully falls back to deterministic dialogue when API key is missing or invalid. |
| `engine/srs/sm2.py` | Backend SM-2 algorithm matching frontend logic. | **100% Pass** (`test_srs.py`) | Identical mathematics and idempotency guarantees as `srs.ts`. |
| `scripts/run_daily_batch.py` | Daily automated workflow script executed by GitHub Actions. | **Operational** | Generates daily polyglot lessons, updates user SRS queues, sends email digests. |
| `scripts/verify_connections.py` | Production preflight script checking external APIs, Supabase, Gemini, and SMTP. | **Operational** | Fixed in previous turn: dynamically discovers models and categorizes errors. |
| `scripts/bootstrap_admin.py` | CLI utility to promote users to `admin` role in Supabase. | **100% Pass** (`test_auth_and_admin_migrations.py`) | Validates environment credentials before running mutations. |
| `scripts/data_retention_policy.py` | Retention cleanup utility pruning old transient logs while preserving progress. | **100% Pass** (`test_storage_and_retention.py`) | Includes dry-run safety mode. |

---

## 6. Duplication and Redundancy Summary

1. **Language Track Pages:**
   - Files: `PortuguesePage.tsx`, `SpanishPage.tsx`, `EnglishPage.tsx`.
   - Lines of Code: ~996 lines across 3 files (~332 lines each).
   - Duplication Rate: **>95%**.
   - Recommendation: Consolidate into a single dynamic `CoursePage.tsx` parameterized by language route (`/courses/:languageId`).
   - *Finding:* [Confirmed from source code; Recommendation].

2. **Synchronous Unconnected Storage:**
   - `localDb` tables (`bookmarks`, `words`) are populated by UI pages but never synced to Supabase because `syncEngine.queueAction` is unreferenced.
   - Recommendation: Add a single persistent middleware hook `usePersistentMutation()` that writes locally to Dexie and simultaneously records an action in `syncQueue`.
   - *Finding:* [Confirmed from source code; Recommendation].
