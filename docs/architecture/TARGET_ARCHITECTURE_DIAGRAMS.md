# Lexilume — Target Architecture Diagrams

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 4 — Target Architecture Design  
> **Core Principle:** One authentic source of content powers multiple meaningful learning experiences.

---

## 1. Overview

This document consolidates the **12 mandatory architectural diagrams** for the target Lexilume platform. These diagrams represent the planned target architecture, cleanly distinguishing between MVP capabilities and future extensions.

---

## 2. Diagram 1 — Overall Target System Context

```mermaid
flowchart TB
    subgraph Actors ["Users & Roles"]
        Learner["Learner<br/>(Guest or Authenticated)"]
        Admin["Administrator / Editor<br/>(Content Provider & Reviewer)"]
    end

    subgraph ClientLayer ["Client Device Runtime (Browser / PWA)"]
        ClientApp["Modular React SPA (Vite)<br/>[Learn, My Words, My Mistakes, Settings]"]
        ContextLookup["Contextual Lookup Engine<br/>(Definitions, Audio, PT/ES Notes)"]
        ClientStorage["Three-Tier Local Persistence<br/>(LocalStorage, Dexie v4, SyncQueue)"]
    end

    subgraph CDNLayer ["Edge Hosting Layer"]
        EdgeCDN["Static CDN (Vercel / Cloudflare Pages)<br/>Domain: https://lexi.monster"]
    end

    subgraph CloudLayer ["Managed Cloud Platform (Supabase)"]
        AuthService["Supabase Auth (GoTrue JWT)"]
        PostgresDB[("PostgreSQL Database<br/>• english_content_items (Canonical Content)<br/>• content_versions (Immutable Editions)<br/>• learner_activity_attempts (Results)<br/>• user_saved_words (Personal Lexicon)<br/>• user_mistakes (Notebook)<br/>• Row-Level Security (RLS)")]
        StorageBucket["Supabase Storage<br/>(Static Reading Audio & Media)"]
    end

    subgraph PipelineLayer ["Content Processing & Pipeline (Serverless / CLI)"]
        IntakeEngine["Content Intake & Extraction Engine"]
        LinguisticEngine["Linguistic & Pedagogy Analysis Engine"]
        ActivityEngine["Content-Type-Aware Activity Synthesizer"]
    end

    subgraph ExternalServices ["External Services (Zero-Paid AI / Open Corpora)"]
        Wiktionary["Wiktionary API & Fixtures<br/>(Morphology, Definitions)"]
        Tatoeba["Tatoeba Project<br/>(Parallel Bilingual Sentences)"]
        FreeDict["Free Dictionary API<br/>(English Phonetics & Audio)"]
        SpeechAPI["Browser Web Speech API<br/>(Local Zero-Cost TTS & STT)"]
        OptionalLLM["Optional Gemini API<br/>(User-Key or Server Extraction Fallback)"]
    end

    Learner -->|Read & Practice| ClientApp
    Admin -->|Submit & Review Content| ClientApp

    ClientApp -->|HTTP Fetch Assets| EdgeCDN
    ClientApp <-->|Local-First Read/Write| ClientStorage
    ClientApp -->|Highlight Word/Phrase| ContextLookup
    ContextLookup -.->|Native Audio| SpeechAPI
    ContextLookup -.->|Free Definitions| FreeDict

    ClientApp <-->|Auth Tokens / RLS| AuthService
    ClientApp <-->|PostgREST REST Client| PostgresDB
    ClientStorage -->|Background Idempotent Sync| PostgresDB

    Admin -->|Submit Raw Text / URLs| IntakeEngine
    IntakeEngine --> LinguisticEngine
    LinguisticEngine --> ActivityEngine
    ActivityEngine -->|Save Drafts for Moderation| PostgresDB

    LinguisticEngine -.->|Open Morphological Data| Wiktionary
    LinguisticEngine -.->|Sentence Contexts| Tatoeba
    LinguisticEngine -.->|Optional Enrichment| OptionalLLM
```

---

## 3. Diagram 2 — Frontend Application Structure

```mermaid
flowchart TD
    IndexHTML["index.html (#root)"] --> MainTSX["main.tsx (Vite Entry)"]
    MainTSX --> AppProviders["AppProviders<br/>(I18nProvider, Toaster, AuthProvider)"]
    AppProviders --> AppShell["AppShell Layout<br/>(Clean Navigation Header & Main Viewport)"]

    AppShell --> Nav["Streamlined Navigation (4 Tabs)"]
    Nav --> Tab1["1. Learn (/learn)<br/>Content Hub, Graded Readers, Activities"]
    Nav --> Tab2["2. My Words (/words)<br/>Personal Lexicon, Notes, SM-2 Flashcards"]
    Nav --> Tab3["3. My Mistakes (/mistakes)<br/>Diagnostic Notebook, Targeted Remediation"]
    Nav --> Tab4["4. Settings (/settings)<br/>Interface, Target & Explanation Langs"]

    AppShell -.->|Protected Admin Route| AdminArea["Admin Studio (/admin)<br/>(Content Ingestion, Pipeline Review, Audit)"]

    subgraph LearnSubsystem ["Learn Subsystem Components"]
        ContentFilter["Content Filter & Discovery<br/>(Genre, CEFR, Reading Time)"]
        ReaderView["Unified Content Reader<br/>(Text, Audio Player, Paragraphs)"]
        ContextPopover["ContextualWordPopover<br/>(Definitions, Audio, PT/ES, Save)"]
        ActivityHost["Dynamic Activity Host<br/>(Comprehension, Cloze, Speech, Writing)"]
    end

    Tab1 --> ContentFilter
    ContentFilter --> ReaderView
    ReaderView --> ContextPopover
    ReaderView --> ActivityHost
```

---

## 4. Diagram 3 — Admin Content Ingestion and Publication

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator / Content Editor
    participant UI as Admin Content Studio (/admin)
    participant Pipe as Pipeline Orchestrator
    participant PostgREST as Supabase english_content_items
    participant ReviewQ as content_review_queue
    participant Audit as admin_audit_logs

    Admin->>UI: Submits authentic text (pasted text, file, URL)
    Admin->>UI: Selects genre (Workplace, News, Story, Guide), source & license
    UI->>Pipe: triggerProcessingJob(rawText, metadata)
    
    Note over Pipe: Stage 1 to 5: Ingestion, Normalization, Tokenization, Translation, Activity Prep
    Pipe->>PostgREST: INSERT INTO english_content_items (status = 'processing')
    Pipe-->>UI: Job completed with status = 'pending_review'

    Admin->>UI: Opens "Content Review" tab
    UI->>ReviewQ: Fetch items with status = 'pending_review'
    Admin->>UI: Inspects vocabulary extraction, grammar notes & generated activities
    alt Admin edits text or activities
        Admin->>UI: Modifies wording / regenerates specific exercise
        UI->>Pipe: reprocessStage(itemId, stageName)
    end

    Admin->>UI: Clicks "Approve & Publish"
    UI->>PostgREST: UPDATE english_content_items SET status = 'published', version = 1
    UI->>Audit: INSERT INTO admin_audit_logs (action = 'PUBLISH_CONTENT', item_id)
    UI-->>Admin: Confirmation toast: "Content published and available to learners"
```

---

## 5. Diagram 4 — Content-Processing Pipeline Architecture

```mermaid
flowchart TD
    subgraph Stage1Intake ["Stage 1: Intake & Rights Check"]
        I1["Source Intake (Plain Text, Markdown, Web Article)"]
        I2["Attribution & License Validation (Public Domain, CC-BY, Original)"]
        I1 --> I2
    end

    subgraph Stage2Normalize ["Stage 2: Normalization & Segmentation"]
        N1["Unicode NFC Normalization & Whitespace Cleanup"]
        N2["Paragraph & Sentence Segmentation"]
        N1 --> N2
    end

    subgraph Stage3Linguistic ["Stage 3: Lexical & Pedagogical Analysis"]
        L1["Lemma Extraction & Frequency Profiling"]
        L2["CEFR Difficulty & Reading-Time Estimation"]
        L3["Contextual Meaning & Idiom Identification"]
        L1 --> L2 --> L3
    end

    subgraph Stage4Bilingual ["Stage 4: Dual Explanation & Translation"]
        T1["Target Sentence Alignment"]
        T2["Portuguese Pedagogical Explanations (pt)"]
        T3["Spanish Pedagogical Explanations (es)"]
        T1 --> T2
        T1 --> T3
    end

    subgraph Stage5Activities ["Stage 5: Content-Type-Aware Activity Prep"]
        A1{"Content Genre Decision"}
        A1 -->|Workplace / Email| ActWork["Tone Analysis & Professional Reply Writing"]
        A1 -->|Conversation| ActConv["Turn-Taking, Pronunciation & Speaking Prompts"]
        A1 -->|News / Article| ActNews["Reading Comprehension & Cloze Summaries"]
        A1 -->|Story / Literature| ActStory["Narrative Ordering & Expression Matching"]
    end

    subgraph Stage6Gate ["Stage 6: Quality Gate & Publication"]
        Q1["Automated Consistency & Answer Key Verification"]
        Q2["Admin Human-in-the-Loop Review & Approval"]
        Q3["Immutable Publication Bundle (v1)"]
        Q1 --> Q2 --> Q3
    end

    Stage1Intake --> Stage2Normalize --> Stage3Linguistic --> Stage4Bilingual --> Stage5Activities --> Stage6Gate
```

---

## 6. Diagram 5 — Content Domain Relationships & Entities

```mermaid
erDiagram
    english_content_items ||--o{ content_versions : "has"
    english_content_items ||--o{ content_sources : "attributed_to"
    content_versions ||--o{ content_paragraphs : "contains"
    content_paragraphs ||--o{ content_sentences : "segments_into"
    content_sentences ||--o{ content_vocabulary : "highlights"
    content_sentences ||--o{ content_grammar_insights : "illustrates"
    content_versions ||--o{ learning_activities : "generates"
    learning_activities ||--o{ activity_questions : "includes"

    learner_profiles ||--o{ learner_content_progress : "tracks"
    content_versions ||--o{ learner_content_progress : "measured_against"
    learner_profiles ||--o{ user_saved_words : "bookmarks"
    learner_profiles ||--o{ user_mistakes : "logs"
    learner_profiles ||--o{ srs_items : "schedules"
    learning_activities ||--o{ activity_attempts : "recorded_in"

    english_content_items {
        uuid id PK
        string title
        string slug
        string genre
        string primary_cefr
        int estimated_reading_time_minutes
        string current_version_id FK
        string status
        timestamp published_at
    }

    content_versions {
        uuid id PK
        uuid content_item_id FK
        int version_number
        jsonb structured_payload
        string changelog
        timestamp created_at
    }

    learning_activities {
        uuid id PK
        uuid content_version_id FK
        string activity_type
        string skill_category
        jsonb configuration
    }

    learner_content_progress {
        uuid id PK
        uuid user_id FK
        uuid content_item_id FK
        uuid content_version_id FK
        boolean reading_completed
        int activities_completed_count
        int total_activities_count
        timestamp last_interacted_at
    }
```

---

## 7. Diagram 6 — Learner Reading and Contextual Lookup Interaction

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner
    participant Reader as Unified Reader (/learn/:slug)
    participant Popover as ContextualWordPopover
    participant Cache as Dexie apiCache / Local DB
    participant Speech as Web Speech API (TTS)
    participant Sync as SyncEngine

    Learner->>Reader: Reads "The company decided to phase out the old system."
    Learner->>Reader: Selects or taps phrase "phase out"
    Reader->>Popover: openPopover(selection = "phase out", sentence, offset)

    Popover->>Cache: checkPrecomputedLookup(contentVersionId, "phase out")
    alt Precomputed in Content Version Payload
        Cache-->>Popover: Contextual meaning, simple English, PT & ES translations
    else Fallback to Live / Local Dictionary
        Popover->>Cache: queryLocalDictionary("phase out")
        Cache-->>Popover: Wiktionary definition + Tatoeba example
    end

    Popover-->>Learner: Displays compact panel: Meaning in this sentence, PT & ES notes
    
    opt Learner taps Listen
        Learner->>Popover: Clicks "Listen" icon
        Popover->>Speech: SpeechService.speak("phase out", lang="en-US")
        Speech-->>Learner: Pronunciation audio plays instantly
    end

    opt Learner saves expression
        Learner->>Popover: Clicks "Save to My Words"
        Popover->>Cache: putSavedWord({ word: "phase out", contextSentence, ptTranslation })
        Popover->>Sync: queueAction('SAVE_WORD', wordPayload)
        Popover-->>Learner: Bookmark confirmed with checkmark animation
    end
```

---

## 8. Diagram 7 — Learning Activity Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Ingested: Admin submits content
    Ingested --> Analyzed: Pipeline extracts vocabulary & grammar
    Analyzed --> ActivitiesPrepared: Synthesizer prepares activities
    ActivitiesPrepared --> Published: Admin approves content item (v1)

    state Published {
        [*] --> Unstarted: Learner opens content item
        Unstarted --> ReadingActive: Learner reads source text
        ReadingActive --> ActivitiesReady: Learner finishes reading
        
        ActivitiesReady --> Attempting: Learner starts activity (e.g. Cloze)
        Attempting --> Evaluating: Learner submits answer
        
        Evaluating --> Correct: Answer matches key
        Evaluating --> Incorrect: Answer is erroneous
        
        Correct --> NextActivity: Award XP, update streak
        Incorrect --> LogNotebook: Record in My Mistakes with explanation
        LogNotebook --> NextActivity: Retry or proceed

        NextActivity --> Attempting: More activities remain
        NextActivity --> FullyCompleted: All activities finished
    }

    FullyCompleted --> SavedState: Persist completion to Dexie & Supabase
    SavedState --> [*]
```

---

## 9. Diagram 8 — Authentication, Authorization & Security Architecture

```mermaid
flowchart TD
    subgraph ClientAuth ["Client Auth Flow (authService.ts)"]
        InitCheck{Session exists in browser?}
        InitCheck -- No --> GuestMode[Guest Mode: User ID = 'guest', Role = 'learner']
        InitCheck -- Yes --> TokenCheck{JWT Token Valid?}
        TokenCheck -- Yes --> AuthLearner[Authenticated Learner: User ID = UUID]
        TokenCheck -- Expired --> Refresh[Auto-Refresh JWT via Supabase GoTrue]
        Refresh --> AuthLearner
    end

    subgraph SecurityEnforcement ["Security & Access Enforcement"]
        UI_Guard[Client Route Guard: Can display view?]
        PostgREST_RLS[Supabase PostgreSQL RLS: Row-Level Security]
    end

    subgraph DatabaseTables ["Database Protection Rules"]
        PublicContent[english_content_items: READ allowed if status = 'published']
        PersonalData[learner_progress, user_saved_words: ALL allowed WHERE auth.uid() = user_id]
        AdminTables[admin_audit_logs, review_queue: ALL allowed WHERE has_role(auth.uid(), 'admin')]
    end

    GuestMode --> UI_Guard
    AuthLearner --> UI_Guard

    UI_Guard -->|REST Request| PostgREST_RLS
    PostgREST_RLS --> PublicContent
    PostgREST_RLS --> PersonalData
    PostgREST_RLS --> AdminTables
```

---

## 10. Diagram 9 — Local-First Persistence and Background Synchronization

```mermaid
flowchart LR
    subgraph Tier1LocalStorage ["Tier 1: LocalStorage"]
        LS_Pref["polyglot_settings_{uid}<br/>(UI theme, interface_lang)"]
        LS_Active["polyglot_active_item_{uid}<br/>(Current reading pointer)"]
    end

    subgraph Tier2Dexie ["Tier 2: Dexie IndexedDB v4"]
        D_Content["cached_content_items<br/>(Full offline reading articles)"]
        D_Words["user_saved_words<br/>(Personal lexicon + SM-2)"]
        D_Mistakes["user_mistakes<br/>(Diagnostic error notebook)"]
        D_Progress["learner_progress<br/>(Content completion records)"]
        D_Queue["syncQueue<br/>(Pending mutations)"]
    end

    subgraph Tier3Supabase ["Tier 3: Supabase Cloud PostgreSQL"]
        S_Content["english_content_items (Canonical)"]
        S_Words["user_saved_words (Cloud Backup)"]
        S_Mistakes["user_mistakes (Cloud Backup)"]
        S_Progress["learner_content_progress (Telemetry)"]
    end

    LearnerAction[Learner Saves Word / Completes Activity] --> WriteTier1[Write lightweight state to LocalStorage]
    LearnerAction --> WriteTier2[Write structured entity to Dexie IndexedDB]
    WriteTier2 --> Enqueue[Enqueue mutation into Dexie syncQueue]

    Enqueue --> CheckOnline{Online & Authenticated?}
    CheckOnline -- No --> OfflineStay[Retain in syncQueue with Exponential Backoff]
    CheckOnline -- Yes --> SyncEngine[syncEngine.syncNow()]

    SyncEngine --> UpsertCloud[Idempotent PostgREST Upsert with Compound Conflict Key]
    UpsertCloud -- Success (200/201) --> Dequeue[Delete item from syncQueue]
    UpsertCloud -- Network Failure --> Backoff[Increment retry_count + Jitter Delay]
    Backoff --> OfflineStay
```

---

## 11. Diagram 10 — Content Versioning and Learner Progress Immutability

```mermaid
flowchart TD
    subgraph ContentLifecycle ["Content Evolution (Admin Action)"]
        Item[english_content_items: id = 'art-001']
        V1[content_versions: version_number = 1<br/>Original text published Nov 2026]
        V2[content_versions: version_number = 2<br/>Admin edits paragraph, published Dec 2026]
        
        Item --> V1
        Item --> V2
    end

    subgraph LearnerProgress ["Learner Historical Protection"]
        LP1[learner_content_progress:<br/>user_id = 'usr-101', content_item_id = 'art-001',<br/>content_version_id = 'v1_uuid', completed = true]
        
        Vocab1[user_saved_words:<br/>word = 'resilience', context_sentence = 'Original sentence...',<br/>content_item_id = 'art-001']
    end

    V1 --> LP1
    V1 --> Vocab1
    
    subgraph RuleOfImmutability ["Architectural Guarantee"]
        G1["Learner progress remains VALID because it references Immutable Version 1"]
        G2["Saved words survive intact because they store verbatim source sentence"]
        G3["When learner revisits art-001, UI shows: 'Updated edition available'"]
    end

    LP1 --- RuleOfImmutability
```

---

## 12. Diagram 11 — External Integration Architecture & Fallback Cascade

```mermaid
flowchart TD
    subgraph RequestLayer ["Application Subsystems"]
        VocabReq[Vocabulary Lookup Request]
        SentReq[Sentence Example Request]
        TransReq[Portuguese / Spanish Translation Request]
        AudioReq[Speech Pronunciation Request]
    end

    subgraph ProviderLayer ["Modular Provider Layer"]
        DictProvider[FreeDictionary / Wiktionary Provider]
        TatoebaProvider[Tatoeba Sentence Provider]
        TransProvider[MyMemory / LibreTranslate Provider]
        SpeechProvider[Web Speech API Provider]
    end

    subgraph CacheLayer ["Client Caching Layer (Dexie apiCache)"]
        ApiCacheStore[(IndexedDB apiCache: TTL Eviction)]
    end

    subgraph DeterministicFallbacks ["Offline Deterministic Fallbacks (Zero-Paid AI)"]
        PrecomputedData[(Precomputed Content Version Payload)]
        SeedVocab[(Local JSON Seed Dictionary)]
        SeedSentences[(Local Tatoeba Sentence Bank)]
        NativeTTS[(Native Browser Voice Synthesis)]
    end

    VocabReq --> DictProvider
    SentReq --> TatoebaProvider
    TransReq --> TransProvider
    AudioReq --> SpeechProvider

    DictProvider <--> ApiCacheStore
    TatoebaProvider <--> ApiCacheStore
    TransProvider <--> ApiCacheStore

    DictProvider -.->|Network Offline| PrecomputedData
    PrecomputedData -.->|Word Not in Text| SeedVocab
    TatoebaProvider -.->|Network Offline| SeedSentences
    TransProvider -.->|Rate Limit 429| PrecomputedData
    SpeechProvider --> NativeTTS
```

---

## 13. Diagram 12 — Target Production Deployment and Scheduled Automation

```mermaid
flowchart TB
    subgraph ClientBrowser ["Learner & Admin Browsers"]
        Browser[Client Browser / Mobile Web]
    end

    subgraph ProductionEdge ["Edge Hosting (Vercel / Cloudflare Pages)"]
        ViteBuild["Optimized Vite Production Bundle<br/>• Lazy-Loaded Route Chunks (/admin, /words, /mistakes)<br/>• Gzip / Brotli Compression<br/>• 200.html SPA Fallback"]
    end

    subgraph SupabaseManaged ["Managed Backend Platform (Supabase)"]
        Postgres[(PostgreSQL Managed Cluster)]
        AuthEngine[GoTrue Auth Service]
        RealtimeEngine[Realtime Replication Engine]
    end

    subgraph ScheduledAutomation ["GitHub Actions Automation (Cron)"]
        CronTrigger["GitHub Actions Scheduled Runner<br/>(daily_polyglot.yml @ 04:00 UTC)"]
        JobRunner["Python 3.12 Engine / Scripts<br/>• Harvest new Tatoeba sentence pairs<br/>• Validate database integrity & retention cleanup<br/>• Send daily study reminder emails via Resend"]
    end

    subgraph EmailDispatch ["Email Delivery Network"]
        ResendService["Resend API / Transactional SMTP"]
    end

    Browser -->|HTTPS GET Assets| ProductionEdge
    Browser -->|Direct Client REST HTTPS| Postgres
    Browser -->|Session Auth| AuthEngine

    CronTrigger --> JobRunner
    JobRunner -->|Admin Service Role HTTPS| Postgres
    JobRunner -->|Dispatch HTML Email| ResendService
```
