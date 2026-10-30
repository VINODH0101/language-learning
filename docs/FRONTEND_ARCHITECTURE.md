# Lexilume — Scalable Frontend Architecture (v3.0)

> **Document:** `docs/FRONTEND_ARCHITECTURE.md`  
> **Repository:** `VINODH0101/language-learning`  
> **Status:** Production Ground Truth & Implemented Architecture  
> **Target Application:** Lexilume (`https://lexi.monster`)  
> **Execution Date:** October 2026  

---

## 1. Architectural Philosophy & Core Invariants

Lexilume's frontend architecture is structured as a **modular, feature-based, local-first Single Page Application (SPA)** built with React 19, TypeScript, Vite, and Tailwind CSS v4.

### Invariants Strictly Maintained:
1. **Zero-Paid AI Mandate**: Deterministic templates, open educational datasets (Wiktionary, Tatoeba, CC-CEDICT, Wikipedia), and Web Speech API synthesis provide 100% functionality without mandatory paid LLM or translation APIs. Optional Gemini models are strictly progressive enhancements.
2. **Local-First Persistence**: Learning activities, flashcards, vocabulary drills, and diagnostic placement operate completely offline via Dexie (IndexedDB) and user-scoped LocalStorage.
3. **Four-Way Linguistic Decoupling**: Complete independence between `interface_language`, `learning_language`, `explanation_language`, and `regional_variety`.
4. **Tenant Isolation**: All client storage partitions (IndexedDB and LocalStorage) are explicitly qualified by `user_id` or `'guest'`.
5. **No Direct External API Calls in UI**: UI components consume abstracted service interfaces; external provider adapters, token buckets, and rate limits remain encapsulated in the integration layer.

---

## 2. Directory Structure & Module Responsibilities

```
frontend/src/
├── app/                      # Application Bootstrap & Shell
│   ├── layouts/              # Top-level application layouts (AppLayout.tsx)
│   ├── providers/            # Root context providers (AppProviders.tsx)
│   └── router/               # Route definitions & browser history sync (useAppRouter.ts, routes.ts)
│
├── features/                 # Domain-Specific Learning Features
│   ├── admin/                # Admin portal & role management (UserDetailModal)
│   ├── course/               # Dynamic unified course viewer (CourseView.tsx, useCourse.ts)
│   ├── dashboard/            # Immersion dashboard (DashboardView.tsx, useDashboard.ts)
│   ├── discover/             # Cultural articles & immersion (CultureExploreView, ArticleReader)
│   ├── onboarding/           # First-time user setup wizard (GuidedOnboardingModal.tsx)
│   ├── practice/             # Practice hub (LanguageToolStudio, MistakeNotebook, FalseFriends)
│   ├── profile/              # User preferences & account settings (SettingsView)
│   ├── progress/             # Mastery analytics & retention charts (ProgressView)
│   ├── spaced-repetition/    # SM-2 review cards & intervals (FlashcardDeck.tsx)
│   ├── translation/          # Multilingual translator & phrasebook (TranslateView)
│   └── vocabulary/           # Word explorer & lazy PDF pack exporter (VocabularyView)
│
├── shared/                   # Shared Reusable Primitives
│   ├── components/           # Atomic UI elements (Button, Card, Badge, Alert, Logo, AudioButton)
│   ├── hooks/                # Cross-cutting React hooks (useDebounce, useSpeech)
│   ├── types/                # Unified TypeScript type definitions
│   └── utils/                # Sanitization, Turkish-aware string normalization, error handling
│
├── services/                 # Business Logic & Infrastructure Layer
│   ├── api/                  # Abstract API service interfaces & registry facade
│   ├── auth/                 # Supabase & guest authentication service
│   ├── database/             # Dexie IndexedDB client & store schemas (localDb.ts)
│   ├── preferences/          # User preferences partitioned from learning data (preferencesService.ts)
│   ├── storage/              # Tenant-scoped LocalStorage persistence (storage.ts)
│   └── sync/                 # Offline mutation queue & background replay engine (syncEngine.ts)
│
├── config/                   # Centralized Configuration
│   ├── environment/          # Type-safe environment variable access (env.ts)
│   ├── features/             # Feature flags and capabilities (FEATURES)
│   └── languages/            # 13-language matrix and regional variety rules
│
├── data/                     # Offline seed data, cultural catalogs, and translation fixtures
├── integrations/             # External third-party API adapters (MyMemory, FreeDict, Jikan, etc.)
└── styles/                   # Theme tokens and global Tailwind stylesheets
```

---

## 3. Key Design Implementations

### 3.1 Separation of Presentation and Business Logic

Page components are decoupled from asynchronous data loading and state mutation:
- **`useCourse(language)`**: Encapsulates lesson retrieval via `ClientLessonGenerator`, active tab selection, active progress persistence in IndexedDB, and completion logic.
- **`CourseView.tsx`**: Pure presentation component consuming `useCourse`. It dynamically adapts titles, CEFR badges, pill tabs, and exercises for any target language (`pt`, `es`, `en`, and upcoming languages).
- **`useDashboard()`**: Encapsulates user streak computation, active course switching, daily goal session duration, and course creation forms.

### 3.2 Elimination of 3-Way Language Track Duplication

Previously, `PortuguesePage.tsx`, `SpanishPage.tsx`, and `EnglishPage.tsx` were 3 separate, nearly identical 332-line files (~1,000 LOC total).

Under the refactored architecture:
```tsx
// frontend/src/pages/PortuguesePage.tsx
import React from 'react';
import { CourseView } from '../features/course/CourseView';

export const PortuguesePage: React.FC = () => {
  return <CourseView language="pt" />;
};
export default PortuguesePage;
```
`PortuguesePage`, `SpanishPage`, and `EnglishPage` act as lightweight, backwards-compatible entrypoints forwarding to the unified `CourseView`. All 19 existing test suites continue to pass without modification.

### 3.3 Reusable API Service Interfaces

All external API interactions are governed by typed interfaces in `frontend/src/services/api/interfaces.ts`:
- **`IDictionaryService`**: Lexical lookups across target languages.
- **`IProofreadingService`**: Grammar checks and style corrections.
- **`ITranslationService`**: Cross-language translation with quota guards.
- **`ICultureService`**: Open cultural articles filtered strictly by content language.

UI components interact exclusively with these high-level facades (`DictionaryService`, `ProofreadingService`), keeping provider endpoints, rate-limiting tokens, and HTTP adapters completely isolated.

### 3.4 Centralized Error Handling (`errorHandler.ts`)

`frontend/src/shared/utils/errorHandler.ts` provides structured, typed error processing:
- **`AppError`**: Standardized class capturing error `category` (`AUTH`, `NETWORK`, `DATABASE`, `SYNC`, `API`), `severity` (`info`, `warning`, `error`, `critical`), and error code.
- **`handleError(err, fallbackMessage, options)`**: Logs sanitized messages to the console and automatically displays responsive toast notifications to the learner via Sonner.

### 3.5 Centralized Environment Configuration (`env.ts`)

Direct access to `import.meta.env` across components is replaced by `frontend/src/config/environment/env.ts`:
- **`ENV.isSupabaseConfigured`**: Validates URL format and rejects placeholder keys, enabling graceful offline operation.
- **`ENV.isGeminiConfigured`**: Determines whether live AI dialogue generation should be attempted or bypassed in favor of deterministic fallback scripts.

### 3.6 Separation of User Preferences from Learning Data

- **`PreferencesService`** (`frontend/src/services/preferencesService.ts`): Manages UI interface language, theme (`light` / `dark`), session duration, and notification toggles.
- **`StorageService`** & **`localDb`**: Manage active courses, curriculum node completions, SM-2 interval records, and mistake notebooks.

### 3.7 Router & URL Hash Synchronization (`useAppRouter.ts`)

Replaces rigid `activeTab` state with `useAppRouter`:
1. Listens to `hashchange` browser events.
2. Supports deep linking (`#learn/pt`, `#practice`, `#vocabulary`).
3. Restores standard **Browser Back** and **Forward** button navigation.
4. Prevents state loss on browser refresh.
5. Remains 100% backwards-compatible with `NavTab` click handlers.

### 3.8 Prevention of Repeated Initialization & Unnecessary Re-renders

- `initializeExternalApiRegistry()` was previously called on every route/tab transition in `App.tsx` (`useEffect(..., [activeTab])`).
- In the refactored `App.tsx`, initialization runs strictly once on application mount (`useEffect(..., [])`).
- Top-level providers (`I18nProvider`, `Toaster`) are hoisted into `AppProviders.tsx`, isolating UI chrome re-renders from route viewport updates.

---

## 4. Verification & Health Summary

Execution of the full automated verification suite confirmed:

```bash
# 1. Frontend Unit Tests (Vitest)
npm --prefix frontend test -- --run
# Result: 19 test files passed (19), 136 tests passed (136). Duration: ~31.5s.

# 2. Frontend Production Build & TypeScript Checking
npm --prefix frontend run build
# Result: tsc -b passed with 0 errors. Vite built 2,372 modules cleanly in 13.52s.

# 3. Python Engine Unit Tests (Pytest)
python -m pytest tests/ -v
# Result: 98 passed, 1 skipped (live optional Gemini test) in 7.39s.
```

No new errors or regressions were introduced. All 136 frontend unit tests, all 98 Python engine tests, and production bundling pass with exit code `0`.
