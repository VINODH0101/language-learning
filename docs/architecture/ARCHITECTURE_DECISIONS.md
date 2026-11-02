# Lexilume — Architecture Decision Records (ADRs)

> **Context:** Architectural invariants and design decisions governing Lexilume's evolution into a content-centred English learning platform.

---

## Index of Architecture Decision Records

| ADR # | Title | Status | Date |
| :---: | :--- | :---: | :---: |
| **ADR-001** | Content-Centred Architecture Over Disconnected Course Silos | **Accepted** | 2026-11-02 |
| **ADR-002** | Four-Way Linguistic Decoupling as an Immutable System Invariant | **Accepted** | 2026-11-02 |
| **ADR-003** | Local-First Offline Persistence via Dexie v4 with Background Sync | **Accepted** | 2026-11-02 |
| **ADR-004** | Forward-Only Additive Database Migrations (Zero Deletions) | **Accepted** | 2026-11-02 |
| **ADR-005** | 21-Stage Content Processing Pipeline with Isolated Stage Retries | **Accepted** | 2026-11-02 |
| **ADR-006** | Zero-Paid AI Mandate with Deterministic Pedagogical Fallbacks | **Accepted** | 2026-11-02 |
| **ADR-007** | Cognitive Mastery & Mistake Notebook Over Manipulative Streaks | **Accepted** | 2026-11-02 |
| **ADR-008** | Progressive 17-Format Intake with Side-by-Side Extraction Canvas | **Accepted** | 2026-11-02 |

---

## ADR-001: Content-Centred Architecture Over Disconnected Course Silos

### Context
Previously, learning content was fragmented across language-specific templates and hardcoded daily generators. Supporting new English topics required duplicating lesson generator logic and curriculum trees.

### Decision
Unify all English learning around **Authentic Content Packages**. A single content item (e.g. a workplace negotiation dialogue or a technology article) generates reading, listening, vocabulary, phrase analysis, grammar insights, comprehension checks, speaking prompts, and writing exercises.

### Consequences
- **Positive:** Massive reduction in duplicated component code; admin can publish rich real-world material in minutes.
- **Negative:** Requires robust text segmentation and automated question generation. Mitigated by the 21-stage pipeline.

---

## ADR-002: Four-Way Linguistic Decoupling

### Context
Multi-language applications often conflate interface language with the learning target or explanation language.

### Decision
Enforce the strict invariant:
1. `interface_language`: UI chrome, buttons, menus (`en`, `pt`, `es`, etc.).
2. `learning_language`: English (`en`).
3. `explanation_language`: Pedagogical explanations (`pt`, `es`, `en`).
4. `regional_variety`: Regional dialect (`en-US` or `en-GB`).
These concerns must never be merged or conflated.

### Consequences
- **Positive:** Portuguese and Spanish learners can study English with explanations in their native language while using an English or native UI.

---

## ADR-003: Local-First Offline Persistence via Dexie v4

### Context
Learners frequently study on mobile devices with intermittent or severed network connectivity (airplanes, transit, rural areas).

### Decision
Store all user learning activity, vocabulary, mistake logs, and SM-2 review dates in IndexedDB via Dexie v4. UI operations commit instantly to local storage; mutations are queued in `syncQueue` and synchronized to Supabase in the background when connectivity is available.

### Consequences
- **Positive:** Zero latency UI; 100% offline functionality.
- **Negative:** Requires client-side conflict resolution (Server-Timestamp Last-Write-Wins and Additive Set Merging).

---

## ADR-004: Forward-Only Additive Database Migrations

### Context
The database contains 14 applied migrations (`001` through `014`) and 26 production tables with active user accounts and historical progress.

### Decision
Never delete or rewrite historical migrations. Never drop or truncate existing production tables. New schema features are introduced strictly via forward-only migration `015_content_centred_english_pipeline.sql`.

### Consequences
- **Positive:** Zero risk of production data loss; zero downtime; verifiable audit history.

---

## ADR-005: 21-Stage Content Processing Pipeline with Isolated Stage Retries

### Context
A monolith content generator fails completely if an external API (such as audio synthesis or translation) times out, losing all previous progress.

### Decision
Decompose content processing into 21 independent, typed, idempotent stages. Each stage saves its execution record in `admin_background_jobs`.

### Consequences
- **Positive:** If audio generation fails, translation and comprehension work remain saved. Administrators can re-execute individual stages.

---

## ADR-006: Zero-Paid AI Mandate with Deterministic Pedagogical Fallbacks

### Context
Relying on mandatory external paid LLM APIs creates recurring costs, rate limit vulnerabilities, and latency spikes.

### Decision
Lexilume must operate reliably using open educational datasets (Wiktionary, Tatoeba, Wikipedia) and deterministic synthesis engines. Optional Gemini API integration must always have full deterministic fallbacks.

### Consequences
- **Positive:** Predictable zero operating cost; platform runs indefinitely without API budget exhaustion.

---

## ADR-007: Cognitive Mastery & Mistake Notebook Over Manipulative Streaks

### Context
Gamified streaks often encourage superficial clicking rather than genuine language acquisition.

### Decision
Focus learner progress metrics on **real cognitive evidence**:
- Active cognitive minutes tracked in Dexie.
- Specific mistake categories resolved in `learner_mistake_notebook`.
- Genuine SM-2 vocabulary items mastered.
- Exercises completed.

### Consequences
- **Positive:** Honest, high-trust pedagogical environment without artificial numbers.

---

## ADR-008: Progressive 17-Format Intake with Side-by-Side Extraction Canvas

### Context
Administrative users need to ingest content from diverse file types (PDF, Word, Subtitles, Webpages, Plain text).

### Decision
Provide an intake system supporting 17 formats progressively. Extraction occurs client-side or via non-blocking workers. An interactive **Extraction Correction Canvas** allows administrators to preview, correct, and confirm rights attribution *before* pipeline processing.

### Consequences
- **Positive:** Eliminates garbage-in-garbage-out; gives administrators total editorial control.
