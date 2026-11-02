# Lexilume — Current-State Architecture Diagrams

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 3 — Current-State Architecture Modeling  
> **Status:** 100% Verified against Codebase Implementation and Production Configurations

---

## 1. Executive Overview

This document consolidates the **10 mandatory system architecture diagrams** for Lexilume as it operates today. In strict adherence to the Phase 3 ground truth principles:
- All diagrams represent **implemented and verified functionality**.
- Unverified, optional, or fallback paths are explicitly labeled.
- Planned future-state capabilities are isolated from the current-state baseline.

---

## 2. Diagram 1 — System Context

```mermaid
flowchart TB
    subgraph Users ["Actors & Users"]
        Learner["Learner / Authenticated User"]
        Guest["Anonymous Guest Learner"]
        Admin["Administrator / Content Editor"]
    end

    subgraph ClientDevice ["Client Device (Browser Runtime)"]
        BrowserApp["React 19 SPA (Vite)"]
        subgraph ClientStorage ["Local Browser Storage Tier"]
            LocalStorage["Scoped LocalStorage<br/>(UserSettings, Course State)"]
            DexieDB["IndexedDB (PolyglotLocalDatabase v4)<br/>(8 Entity Stores, apiCache)"]
            SyncQueue["Dexie syncQueue Store<br/>(Offline Mutations)"]
        end
    end

    subgraph Hosting ["Production Hosting"]
        StaticCDN["Static Web Host (Vercel / Cloudflare)<br/>Domain: lexi.monster"]
    end

    subgraph BackendCloud ["Cloud Backend Layer (Supabase)"]
        SupaAuth["Supabase Auth Service<br/>(JWT Sessions)"]
        PostgresDB[("Supabase PostgreSQL Database<br/>(26 Active Tables with RLS)")]
    end

    subgraph AutomationHost ["Scheduled Execution (GitHub Actions)"]
        GHActions["GitHub Actions Runner<br/>(daily_polyglot.yml @ 04:00 UTC)"]
        PythonEngine["Python 3.12 Processing Engine<br/>(run_daily_batch.py)"]
    end

    subgraph ExternalServices ["External API Providers (Free / Open / Zero-Paid)"]
        Wiktionary["Wiktionary API (Definitions/IPA)"]
        Tatoeba["Tatoeba Project (Bilingual Sentences)"]
        Wikipedia["Wikipedia REST API (Culture/Reading)"]
        MyMemory["MyMemory Translation API"]
        LeafletTiles["OpenStreetMap Tile Servers"]
        OpenMeteo["Open-Meteo Weather API"]
        EmailService["Email Dispatch (Resend / SMTP)"]
        GeminiOptional["Google Gemini API<br/>(Optional: User-Provided Key Only)"]
    end

    %% Interactions
    Learner -->|Interactive UI| BrowserApp
    Guest -->|Offline Learning| BrowserApp
    Admin -->|Content Workbench| BrowserApp

    BrowserApp -->|HTTP Fetch Assets| StaticCDN
    BrowserApp <-->|Sync Read/Write| LocalStorage
    BrowserApp <-->|Async Entity Storage| DexieDB
    BrowserApp -->|Enqueue Mutations| SyncQueue

    BrowserApp <-->|REST PostgREST / RLS| PostgresDB
    BrowserApp <-->|Auth Tokens / Refresh| SupaAuth

    SyncQueue -->|Online Automatic Flush| PostgresDB

    BrowserApp -.->|Cached HTTP GET| Wiktionary
    BrowserApp -.->|Cached HTTP GET| Tatoeba
    BrowserApp -.->|Cached HTTP GET| Wikipedia
    BrowserApp -.->|Rate-Limited GET| MyMemory
    BrowserApp -.->|Raster PNG Tiles| LeafletTiles
    BrowserApp -.->|Cached Weather| OpenMeteo
    BrowserApp -.->|User Key Only / Fallback| GeminiOptional

    GHActions -->|Daily Scheduled Cron| PythonEngine
    PythonEngine -->|Admin Service Role Key| PostgresDB
    PythonEngine -.->|Harvest Parallel Data| Tatoeba
    PythonEngine -.->|Harvest Morphology| Wiktionary
    PythonEngine -.->|Send Daily Lessons| EmailService
```

---

## 3. Diagram 2 — Frontend Component & Route Architecture

```mermaid
flowchart TD
    IndexHTML["index.html (#root)"] --> MainTSX["main.tsx (Vite Entry)"]
    MainTSX --> AppProviders["AppProviders (I18nProvider, Sonner Toaster)"]
    AppProviders --> AppTSX["App.tsx (AppContent)"]
    
    AppTSX --> RouterHook["useAppRouter() (Custom Zero-Dependency Hash Router)"]
    AppTSX --> CourseHook["useCourse() (CourseService Subscription)"]
    AppTSX --> AppLayoutComp["AppLayout (Shell Layout)"]

    AppLayoutComp --> NavHeader["Navigation Header (Tabs, Streak, Auth/Onboard Triggers)"]
    AppLayoutComp --> Modals["Global Modals (AuthModal, GuidedOnboardingModal)"]
    AppLayoutComp --> ActiveView{"Route Resolution (currentRoute)"}

    ActiveView -->|'dashboard'| DashPage["DashboardPage (DashboardView)"]
    ActiveView -->|'vocabulary'| VocabPage["VocabularyPage (VocabularyExplorer, PDF Export)"]
    ActiveView -->|'explore'| CulturePage["CultureExplorePage (LexilumeWorldHub, Articles)"]
    ActiveView -->|'portuguese'| PtPage["PortuguesePage -> CourseView (lang='pt')"]
    ActiveView -->|'spanish'| EsPage["SpanishPage -> CourseView (lang='es')"]
    ActiveView -->|'english'| EnPage["EnglishPage -> CourseView (lang='en')"]
    ActiveView -->|'translate'| TransPage["TranslatePage (TranslationService, Challenges)"]
    ActiveView -->|'practice'| PracPage["PracticePage (Writing, Speaking, Listening, SRS)"]
    ActiveView -->|'progress'| ProgPage["ProgressPage (CEFR Roadmap, Retention, Weak Areas)"]
    ActiveView -->|'settings'| SettPage["SettingsPage (Preferences, Decoupling, Storage Reset)"]
    ActiveView -->|'admin'| AdminPage["AdminPage (AdminWorkbench, Review Queue, Content Studio)"]

    subgraph CourseViewStages ["CourseView 4 Guided Learning Stages"]
        S1["Stage 1: Learn (Vocab, Grammar, Audio)"]
        S2["Stage 2: Understand (Reading, Listening)"]
        S3["Stage 3: Use (Speaking, Writing, Dialogue)"]
        S4["Stage 4: Test (Exercises, False Friends)"]
    end

    PtPage --> CourseViewStages
    EsPage --> CourseViewStages
    EnPage --> CourseViewStages
```

---

## 4. Diagram 3 — Authentication & User Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner
    participant UI as AppLayout / Navigation
    participant Auth as authService
    participant Storage as StorageService
    participant SupaAuth as Supabase Auth (GoTrue)
    participant PostgREST as Supabase Database (RLS)
    participant Sync as syncEngine

    Note over Learner, Sync: Lifecycle 1: Anonymous Guest Experience
    Learner->>UI: Opens https://lexi.monster
    UI->>Auth: initializeAuth()
    Auth->>Storage: setCurrentUser('guest')
    Auth-->>UI: isGuest = true, user = { id: 'guest', role: 'learner' }
    UI->>Storage: getSettings('guest')
    Note right of Storage: All progress written to localStorage key polyglot_*_guest

    Note over Learner, Sync: Lifecycle 2: Registration & Guest Migration
    Learner->>UI: Clicks "Sign In" -> Submits Email & Password
    UI->>Auth: signUp(email, password)
    Auth->>SupaAuth: supabase.auth.signUp()
    SupaAuth->>PostgREST: Trigger handle_new_user() creates public.user_profiles
    SupaAuth-->>Auth: Session token + User UUID (usr_123)
    Auth->>Storage: setCurrentUser('usr_123')
    Auth->>Storage: migrateGuestData('usr_123')
    Storage->>Storage: Copy polyglot_*_guest -> polyglot_*_usr_123
    Auth->>Sync: queueAction('SYNC_COURSE', courses, 'usr_123')
    Sync->>PostgREST: Upsert user_courses (user_id = 'usr_123')
    Auth-->>UI: Auth state updated (isGuest = false, role = 'learner')

    Note over Learner, Sync: Lifecycle 3: Session Restore on Return
    Learner->>UI: Revisits application next day
    UI->>Auth: getSession()
    Auth->>SupaAuth: supabase.auth.getSession()
    SupaAuth-->>Auth: Valid JWT Session
    Auth->>PostgREST: SELECT role FROM user_roles WHERE user_id = 'usr_123'
    PostgREST-->>Auth: Role: 'learner' (or 'admin')
    Auth-->>UI: Session restored seamlessly

    Note over Learner, Sync: Lifecycle 4: Sign Out
    Learner->>UI: Clicks "Sign Out"
    UI->>Auth: signOut()
    Auth->>SupaAuth: supabase.auth.signOut()
    Auth->>Storage: setCurrentUser('guest')
    Auth-->>UI: State reset to guest mode
```

---

## 5. Diagram 4 — Learner Session & Study Loop

```mermaid
flowchart TD
    Start([Learner Opens App]) --> SelectCourse[Select / Switch Course in CourseService]
    SelectCourse --> CheckTrackState[Check Track State in LocalStorage / Dexie]
    CheckTrackState --> LoadLesson[Generate or Retrieve Daily Lesson via ClientLessonGenerator]
    
    LoadLesson --> Stage1[Stage 1: Learn Vocabulary & Grammar Rules]
    Stage1 --> ContextWord[Highlight Any Word -> ContextualWordPopover Lookup]
    ContextWord --> SaveVocab[Save Word to Dexie savedVocabulary]
    
    Stage1 --> Stage2[Stage 2: Read Text & Listen to Authentic Audio]
    Stage2 --> Stage3[Stage 3: Practice Speaking & Written Expression]
    Stage3 --> Stage4[Stage 4: Solve Cloze & Multiple Choice Exercises]
    
    Stage4 --> EvalAnswer{Answer Correct?}
    EvalAnswer -- Yes --> AwardXP[Increment Score & Progress]
    EvalAnswer -- No --> LogMistake[Record Mistake in Dexie mistakeNotebook]
    
    AwardXP --> MarkComplete[Mark Node Completed in CourseService]
    LogMistake --> MarkComplete
    
    MarkComplete --> UpdateStorage[Update LocalStorage Course Record]
    UpdateStorage --> QueueSync[Enqueue SYNC_COURSE & SYNC_EXERCISE_ATTEMPT]
    QueueSync --> CheckOnline{Online?}
    CheckOnline -- Yes --> FlushRemote[SyncEngine Upserts to Supabase user_courses]
    CheckOnline -- No --> RetainQueue[Retained in Dexie syncQueue for Auto-Sync]
    FlushRemote --> SessionComplete([Session Complete])
    RetainQueue --> SessionComplete
```

---

## 6. Diagram 5 — Administrator Operational Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Administrator
    participant UI as AdminPage / AdminWorkbench
    participant AdminSvc as adminService
    participant SupaAuth as Supabase Auth
    participant PostgREST as Supabase Database
    participant AuditLog as admin_audit_logs

    Admin->>UI: Navigates to #admin route
    UI->>SupaAuth: Check active user session
    UI->>PostgREST: RPC has_role(uid, 'admin')
    alt Role check fails
        PostgREST-->>UI: False
        UI-->>Admin: Render Access Denied Screen
    else Role check passes
        PostgREST-->>UI: True
        UI-->>Admin: Render AdminWorkbench Tabs
    end

    Note over Admin, AuditLog: Content Review & Moderation Flow
    Admin->>UI: Selects "Content Review" tab
    UI->>AdminSvc: getContentReviewItems()
    AdminSvc->>PostgREST: SELECT * FROM content_review_items WHERE status = 'pending'
    PostgREST-->>UI: Pending articles / lessons list
    Admin->>UI: Inspects article, edits text, clicks "Approve"
    UI->>AdminSvc: approveContentItem(itemId)
    AdminSvc->>PostgREST: UPDATE content_review_items SET status = 'approved'
    AdminSvc->>PostgREST: UPDATE daily_published_content SET status = 'published'
    AdminSvc->>AuditLog: INSERT INTO admin_audit_logs (action = 'APPROVE_CONTENT')
    AuditLog-->>UI: Mutation confirmed with audit trail entry

    Note over Admin, AuditLog: Daily Content Authoring Flow
    Admin->>UI: Opens "Daily Content Studio" tab
    Admin->>UI: Enters Poem / Conversation (Title, Text, CEFR, Language)
    Admin->>UI: Clicks "Preview" -> Reviews Dialog turns
    Admin->>UI: Clicks "Publish Content"
    UI->>PostgREST: UPSERT daily_published_content (status = 'published')
    UI->>AuditLog: INSERT INTO admin_audit_logs (action = 'PUBLISH_DAILY_CONTENT')
    UI-->>Admin: Toast: "Content published successfully"
```

---

## 7. Diagram 6 — Current Database Entity-Relationship Model (26 Tables)

```mermaid
erDiagram
    auth_users ||--o{ user_profiles : "owns"
    auth_users ||--o{ user_roles : "assigned"
    auth_users ||--o{ admin_audit_logs : "creates"
    auth_users ||--o{ user_courses : "maintains"
    auth_users ||--o{ user_learning_tracks : "tracks (legacy)"
    auth_users ||--o{ srs_items : "schedules"
    auth_users ||--o{ saved_translations : "saves"
    auth_users ||--o{ exercise_attempts : "submits"
    auth_users ||--o{ cultural_bookmarks : "bookmarks"
    auth_users ||--o{ learning_activity_events : "logs"
    auth_users ||--o{ email_deliveries : "receives"

    language_tracks ||--o{ curriculum_nodes : "structures"
    language_tracks ||--o{ curated_materials : "contains"
    language_tracks ||--o{ daily_lessons : "groups (legacy)"

    curriculum_nodes ||--o{ vocabulary_items : "teaches"
    curriculum_nodes ||--o{ grammar_rules : "explains"
    curriculum_nodes ||--o{ exercise_templates : "synthesizes"

    daily_published_content ||--o{ content_review_items : "moderates"
    daily_lessons ||--o{ lesson_exercises : "links"

    user_profiles {
        uuid id PK
        uuid auth_user_id FK
        string full_name
        string native_language
        string primary_target_language
        int streak_count
        int xp_points
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        string role
        timestamp granted_at
    }

    user_courses {
        uuid id PK
        uuid user_id FK
        string target_language
        string regional_variant
        string cefr_level
        string explanation_language
        int streak_days
        int total_lessons_completed
        boolean is_active
    }

    srs_items {
        uuid id PK
        uuid user_id FK
        string vocabulary_item_id
        string language
        float ease_factor
        int interval_days
        int repetition_count
        timestamp next_review_date
    }

    saved_translations {
        uuid id PK
        uuid user_id FK
        string source_text
        string translated_text
        string source_lang
        string target_lang
    }

    exercise_attempts {
        uuid id PK
        uuid user_id FK
        string exercise_id
        string submitted_answer
        boolean is_correct
        timestamp created_at
    }

    daily_published_content {
        uuid id PK
        date publish_date
        string learning_language
        string cefr_level
        string title
        jsonb payload
        string status
    }
```

---

## 8. Diagram 7 — Three-Tier Persistence & Synchronization Flow

```mermaid
flowchart TD
    subgraph Tier1 ["Tier 1: Scoped LocalStorage (Synchronous)"]
        LS_Settings["polyglot_settings_{uid}"]
        LS_Courses["polyglot_courses_{uid}"]
        LS_Active["polyglot_active_course_{uid}"]
        LS_Tracks["polyglot_track_{lang}_{uid}"]
        LS_SRS["polyglot_srs_items_{uid}"]
    end

    subgraph Tier2 ["Tier 2: Dexie IndexedDB v4 (Asynchronous Structured)"]
        D_Cached["cachedLessons"]
        D_Progress["activeLessonProgress"]
        D_Vocab["savedVocabulary"]
        D_Reviews["srsReviews (SM-2)"]
        D_Mistakes["mistakeNotebook"]
        D_Bookmarks["culturalBookmarks"]
        D_ApiCache["apiCache (TTL Eviction)"]
        D_SyncQueue["syncQueue (pending / failed)"]
    end

    subgraph Tier3 ["Tier 3: Supabase Cloud PostgreSQL (Remote Truth)"]
        S_Profiles["user_profiles"]
        S_Courses["user_courses"]
        S_SRS["srs_items"]
        S_Trans["saved_translations"]
        S_Attempts["exercise_attempts"]
        S_Content["daily_published_content"]
        S_Events["learning_activity_events"]
    end

    UIAction[User Completes Learning Action] --> WriteLS[Write to Scoped LocalStorage]
    UIAction --> WriteDexie[Write to Dexie Store]
    WriteDexie --> Enqueue[Enqueue mutation into Dexie syncQueue]

    Enqueue --> CheckNet{Online & Authenticated?}
    CheckNet -- Offline or Guest --> RetainQueue[Retained in syncQueue with Exponential Backoff]
    CheckNet -- Online & Authenticated --> SyncEngine[syncEngine.syncNow()]

    SyncEngine --> PostgRESTUpsert[Execute Supabase Idempotent Upsert]
    PostgRESTUpsert -- HTTP 200/201 --> Dequeue[Delete record from syncQueue]
    PostgRESTUpsert -- Failure / 4xx / 5xx --> Backoff[Increment retry_count with Jitter Guard]
    Backoff --> RetainQueue
```

---

## 9. Diagram 8 — Implemented Content-Processing Pipeline (Actual vs Documented)

```mermaid
flowchart TD
    subgraph ImplementedPipeline ["ACTUAL Implemented 6-Stage Pipeline"]
        I1["Stage 1: Raw Text Intake<br/>(Admin textarea paste or seedData.ts fixtures)"]
        I2["Stage 2: Lexical Tokenization<br/>(Basic whitespace / regex splitting)"]
        I3["Stage 3: Sentence Pairing<br/>(Tatoeba API search or seed sentencesData.ts)"]
        I4["Stage 4: Exercise Synthesis<br/>(Deterministic template_engine.py / lessonGenerator.ts)"]
        I5["Stage 5: Admin Review Queue<br/>(content_review_items approve / reject)"]
        I6["Stage 6: Publishing & Delivery<br/>(daily_published_content in Supabase + Dexie)"]

        I1 --> I2 --> I3 --> I4 --> I5 --> I6
    end

    subgraph DocumentedAspirations ["DOCUMENTED / UNIMPLEMENTED 21-Stage Specification"]
        D1["Multi-format Intake (PDF, EPUB, DOCX, Video, Podcasts)"]
        D2["WASM Audio Alignment & Phoneme Timing"]
        D3["Multi-Agent Autonomous LLM Refactoring"]
        D4["Grammar Extraction via Deep Syntax Trees"]
        D5["CEFR Dynamic Rewriting Engine (A1 through C2)"]
        D6["Contextual Semantic Disambiguation"]
    end

    ImplementedPipeline -.->|Phase 4 Gap to Bridge| DocumentedAspirations
```

---

## 10. Diagram 9 — External Integration & Fallback Cascade

```mermaid
flowchart LR
    subgraph UIComponents ["UI Component Requests"]
        ReqDict[Dictionary / Definition Request]
        ReqSent[Sentence Example Request]
        ReqTrans[Translation Request]
        ReqGram[Grammar Analysis Request]
        ReqMap[World Geography Request]
    end

    subgraph ProviderLayer ["Provider Integration Layer"]
        DictProv[FreeDictionary / Wiktionary Adapter]
        TatoebaProv[Tatoeba Provider]
        TransProv[MyMemory Provider]
        GrammarProv[LanguageTool / Gemini Provider]
        MapProv[OpenStreetMap Leaflet Provider]
    end

    subgraph CacheTier ["Dexie apiCache (IndexedDB)"]
        ApiCacheTable[(apiCache Store: key, data, expiresAt)]
    end

    subgraph FallbackTier ["Deterministic Offline Fallbacks (Zero-Paid AI)"]
        SeedVocab[(seedData.ts / *_vocabulary.json)]
        SeedSent[(sentencesData.ts)]
        SeedGrammar[(grammarRules / Deterministic Regex Engine)]
        SeedMap[(Static SVG Vector Map)]
    end

    ReqDict --> DictProv
    ReqSent --> TatoebaProv
    ReqTrans --> TransProv
    ReqGram --> GrammarProv
    ReqMap --> MapProv

    DictProv <--> ApiCacheTable
    TatoebaProv <--> ApiCacheTable
    TransProv <--> ApiCacheTable
    GrammarProv <--> ApiCacheTable

    DictProv -.->|Network Fail| SeedVocab
    TatoebaProv -.->|Network Fail| SeedSent
    TransProv -.->|Rate Limit 429| SeedVocab
    GrammarProv -.->|No User Key / Offline| SeedGrammar
    MapProv -.->|Offline Tile Error| SeedMap
```

---

## 11. Diagram 10 — Production Deployment & Operational Architecture

```mermaid
flowchart TB
    subgraph PublicDomain ["Public Production Domain: https://lexi.monster"]
        DNS[DNS Route 53 / Cloudflare CDN]
    end

    subgraph FrontendHosting ["Edge Static Hosting (Vercel / Cloudflare Pages)"]
        StaticAssets["Vite Production Bundle<br/>(dist/index.html, dist/assets/*.js, *.css)"]
        SPA_Rewrite["200.html / SPA Routing Fallback"]
    end

    subgraph CloudDatabase ["Managed Database Cloud (Supabase Managed Service)"]
        SupabasePostgres[("Supabase PostgreSQL Cluster<br/>(PostgREST REST API, Realtime, Auth Engine)")]
    end

    subgraph GitHubAutomation ["Automated CI/CD & Batch Runners (GitHub)"]
        RepoOrigin["GitHub Repository: VINODH0101/language-learning (main)"]
        CI_Workflow["CI Workflow: Run Vitest, Vite Build & Pytest on Push"]
        Cron_Workflow["Cron Workflow: daily_polyglot.yml (Daily @ 04:00 UTC)"]
        RunnerVM["Ubuntu-Latest GitHub Actions VM"]
        DailyBatchScript["python scripts/run_daily_batch.py"]
    end

    subgraph ExternalDelivery ["Transactional Email Dispatch"]
        ResendAPI["Resend Email API / SMTP Mailer"]
    end

    DNS --> StaticAssets
    StaticAssets --> SPA_Rewrite
    SPA_Rewrite -->|Client-side HTTPS REST| SupabasePostgres

    RepoOrigin -->|Git Push Event| CI_Workflow
    RepoOrigin -->|Scheduled Schedule Event| Cron_Workflow
    Cron_Workflow --> RunnerVM
    RunnerVM --> DailyBatchScript
    DailyBatchScript -->|HTTPS Write (Service Role Key)| SupabasePostgres
    DailyBatchScript -->|HTTPS POST| ResendAPI
```
