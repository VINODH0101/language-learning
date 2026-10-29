# 02. Page and Module Behavior

> **Audit Date:** 2026-10-29  
> **Repository:** `language-learning`  
> **Scope:** Detailed operational lifecycle, state management, dependencies, error handling, and offline behavior for all 11 application views.

---

## 1. Application Shell & Global Layout (`App.tsx`, `Navigation.tsx`)

### 1.1 Architecture & State
- **Entry Component:** `frontend/src/App.tsx` (`AppContent` wrapped by `I18nProvider`).
- **Global States:**
  - `activeTab`: Current visible view (`dashboard`, `vocabulary`, `explore`, `portuguese`, `spanish`, `english`, `translate`, `practice`, `progress`, `settings`, `admin`).
  - `streakDays`: Synced from active track progress via `StorageService.getTrackState()`.
  - `isAuthModalOpen`, `isOnboardingModalOpen`: Global modal overlays that do not unmount or alter the active tab.
- **Top Header (`Navigation.tsx`):**
  - Desktop view (`>= 1024px`): Brand identity, "Learn" dropdown (grouping Portuguese, Spanish, English, Vocabulary), quick links (Explore, Practice, Progress, Settings, Admin), Streak pill, Font-size scaler (`normal`, `large`, `xlarge`), Interface Language toggle (`EN | PT | ES`), and Real-time Sync pill.
  - Mobile bottom dock (`< 1024px`): 5 high-priority touch targets (`Home`, `Learn` drawer trigger, `Explore`, `Practice`, `Progress`) with safe-area bottom padding (`pb-24 lg:pb-8`) preventing obstruction of page controls.

---

## 2. Learner Dashboard (`DashboardPage.tsx`)

### 2.1 State Management & Calculations
- **Active Course Context:** Reads `CourseService.getActiveCourse()` and `StorageService.getTrackState()`.
- **Metrics Displayed:**
  - **Daily Goal Progress:** Target minutes configured in settings vs. session elapsed study time.
  - **Consecutive Streak:** Streak count in days with freeze protection indicator.
  - **Curriculum Milestone:** Real completed lesson index within the curriculum track.
  - **Vocabulary Mastery:** Words with $\ge 5$ consecutive successful reviews and $\ge 21$-day interval in `SRSService`.
  - **Exercise Accuracy:** Calculated strictly from `StorageService.getExerciseAttempts()`.
- **Empty State:** For new learners, presents an interactive placement test prompt or direct "Start Lesson 1" CTA rather than zeroed or misleading progress bars.

---

## 3. Daily Lessons Workflow (`PortuguesePage.tsx`, `SpanishPage.tsx`, `EnglishPage.tsx`)

### 3.1 Synthesis & Section Rendering
- **Lesson Engine:** Generated deterministically via `lessonGenerator.ts` using active track CEFR level, target language, explanation language, and regional variant.
- **Section Workflow:**
  1. **Objectives & Title:** CEFR level badge, estimated duration, and communicative goals.
  2. **Vocabulary:** Advanced lexis with IPA transcription, monolingual definitions, and audio synthesis.
  3. **Grammar:** Structural syntax formulas, theoretical analysis, and contrastive notes.
  4. **Authentic Reading:** Excerpts from Wikipedia / cultural syllabi with word tap-to-translate and Wikimedia attribution.
  5. **False Friends:** Comparative analysis of deceptive cognates (e.g., PT *esquisito* vs. ES *exquisito*).
  6. **Pragmatic Dialogue:** Real-world conversations with audio playback and sociolinguistic register notes.
  7. **Spoken Production:** Prompt with guiding questions, recommended connectors, and browser speech recognition studio.
  8. **Listening Comprehension:** Audio player with transcript toggle and active listening tasks.
  9. **Interactive Exercises:** Multiple choice and cloze inputs with instant distractor feedback and auto-logging to Mistake Notebook.
  10. **Written Composition:** Argumentative essay prompt with target word counter, auto-connector detection, draft saving, and self-evaluation rubric.
- **Course Isolation:** Switching language page automatically resolves the course matching that language via `CourseService.getCourseForLanguage()`.

---

## 4. Vocabulary & Phrasebook Library (`VocabularyPage.tsx`)

### 4.1 Features & Capabilities
- **Curated Lexicon:** Seed data from `frontend/src/data/vocabularyData.ts` and `engine/data/` frequency lists.
- **Filter Controls:**
  - Resource type: Top 200 Core Words, Everyday Sentences, Themed Collections.
  - CEFR Level: A1 through C1 filter.
  - Topic: Daily Life, Business, Literature, Technology, Culture.
  - Part of Speech: Nouns, Verbs, Adjectives, Connectors.
- **Interactive Actions:**
  - Audio pronunciation via `SpeechService`.
  - Save to personal phrasebook in Dexie IndexedDB.
  - Client-side PDF study pack generation (`DownloadPdfDialog.tsx` → `PdfService.generatePdf`).
  - Interactive Flashcard and Quiz modalities.

---

## 5. Dictionary & Translation Hub (`TranslatePage.tsx`)

### 5.1 Architecture & Directionality
- **Bidirectional Matrix:** Supports PT ↔ EN, ES ↔ EN, and PT ↔ ES translation lookups.
- **Lookup Resolution:**
  - Fast offline dictionary lookup with substring matching.
  - Detection of interlinguistic false cognates.
  - Preservation of verified word history in IndexedDB (`saved_translations`).
- **Safety:** Missing dictionary terms present an explicit "No definition found" state rather than fabricated machine translation.

---

## 6. Cultural Discovery & Explore (`CultureExplorePage.tsx`)

### 6.1 Content & Metadata
- **Curriculum:** Cultural articles covering traditions, festivals, history, and cuisine of Portuguese-, Spanish-, and English-speaking regions.
- **Independent Country vs. Language Scoping:** Country of origin (e.g., Brazil, Colombia, Ireland) is decoupled from content language (`pt`, `es`, `en`), allowing learners to read Brazilian cultural essays in Spanish or English.
- **Reading Reader Modal:** Full passage reader with audio player, vocabulary glossary, comprehension quiz, and CC-BY-SA 4.0 license attribution.
- **Local Bookmarks:** Persisted in IndexedDB `cultural_bookmarks` and synced to Supabase when authenticated.

---

## 7. Practice & Spaced Repetition (`PracticePage.tsx`)

### 7.1 Algorithmic Behavior
- **SM-2 Engine (`srs.ts`):** Calculates repetition intervals ($I_n$) and ease factors ($EF$) based on user recall grades (0 to 5):
  $$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$
- **Modalities:**
  - Spaced Repetition Queue: Due items for the active course.
  - False Friends Trainer: Interactive recognition quiz for tricky cognates.
  - Mistake Notebook: Automated registry of failed exercise attempts with categorized grammar reasons.

---

## 8. Progress Analytics & Diagnostic Assessment (`ProgressPage.tsx`)

### 8.1 Tracking & Assessment
- **Placement Assessment (`PlacementTestModal.tsx`):** 12-question diagnostic test evaluating syntax, vocabulary, and discourse comprehension. Scores starting CEFR level (A1 to C1) without hardcoded beginner assumptions.
- **Milestone Registry:** Visual track of completed curriculum nodes, retention percentage, and cumulative study time.

---

## 9. Preferences & Language Architecture (`SettingsPage.tsx`)

### 9.1 Independent Configuration Matrix
- **Interface Language:** Toggles UI chrome (`en`, `pt`, `es`).
- **Learning Language:** Selects active course target.
- **Explanation Language:** Configures pedagogical explanation language.
- **Regional Variety:** Dynamically filtered to valid varieties for the selected target language.
- **Study Mode:** Full C1 Mastery (~45-60 min) or Compact Review (~15-20 min).
- **Theme & Font Scaling:** Light/Dark/System theme and 3-step font size.

---

## 10. Administration & Governance (`AdminPage.tsx`)

### 10.1 Operations & Authorization
- **Privilege Verification:** Verified via `authService.getState().role === 'admin'` on the client and enforced via PostgreSQL Row-Level Security (`006_auth_roles_audit_and_onboarding.sql`) on the backend.
- **Admin Capabilities:**
  - Overview metrics: Registered learners, active monthly learners, guest study sessions.
  - User management: Status toggle (Active / Suspended), Role management (Promote / Revoke Admin).
  - Security Audit Log: Immutable audit trail of administrative modifications.
