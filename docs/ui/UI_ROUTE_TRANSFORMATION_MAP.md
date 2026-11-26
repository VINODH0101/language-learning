# Lexilume — UI Route Transformation Map (Milestone 8.5.1)

> **Document Type:** Route Mapping & UX Journey Specification  
> **Phase:** Phase 8.5 — Editorial UI/UX Redesign  
> **Milestone:** 8.5.1 — Route Transformation  
> **Branch:** `phase-8-ui-redesign`  
> **Date:** 2026-11-03

---

## 1. Primary Learner Experience Mapping

```
Learner Journey:
   [Editorial Header]
           │
     ┌─────┴───────────────┬─────────────────┬──────────────┐
     ▼                     ▼                 ▼              ▼
1. LEARN              2. MY WORDS       3. MY MISTAKES  4. SETTINGS
(Catalog & Reader)   (Personal Lexicon) (Error Notebook)(Preferences)
     │
     ├─► Featured Article
     ├─► Latest Editorial
     ├─► Genre Collections (Conversations, Stories, Culture, Workplace)
     │
     └─► Select Article ──► [ READER VIEW ]
                                 │
                                 ├─► Serif Article Header & Meta
                                 ├─► Paragraph & Sentence Reading
                                 ├─► Word Click ──► [ Contextual Popover ]
                                 ├─► Sentence Click ──► [ Inline Translation ]
                                 ├─► Audio Icon ──► [ Speech Pronunciation ]
                                 │
                                 └─► Post-Reading ──► [ Comprehension Activities ]
```

---

## 2. Primary Administrator Experience Mapping

```
Administrator Publishing Workspace:
   [Admin Publishing Shell]
           │
     ┌─────┴──────────────────┬─────────────────┬──────────────────┐
     ▼                        ▼                 ▼                  ▼
1. CONTENT LIBRARY      2. IMPORT CONTENT  3. PROCESSING      4. REVIEW & PUBLISH
(Published & Drafts)    (Intake & Rights)  (8-Stage Pipeline) (Editorial Inspection)
     │                        │                 │                  │
     ├─► Filter by Target Lang├─► Title & Text  ├─► Stage Timeline ├─► Immutability Check
     ├─► Filter by CEFR / Gen ├─► Rights Status ├─► Progress %     ├─► Vocabulary & Grammar
     └─► Review / Edit Action └─► Fair Use Conf └─► Stage Retry    └─► Publish Action
```

---

## 3. Detailed Route Transformation Specification

### 3.1 Route: `learn` (Publication Discovery)
- **Baseline View:** `LearnPage` -> `LearnCatalog`
  - Heavy dark hero card with purple gradient (`from-indigo-950/80 via-slate-900 to-slate-950`).
  - Identical 3-column SaaS card grid with pill badges.
  - Search and filter dropdowns styling in dark mode slate.
- **Transformed Editorial View:**
  - **Editorial Masthead**: Clean publication title, subtle volume/issue date line, language badge.
  - **Lead Featured Story**: Asymmetrical editorial presentation with large serif title, author/source attribution, estimated read time, and direct reading action.
  - **Curated Reading Sections**:
    - *Conversations & Dialogues*
    - *Literary Stories & Culture*
    - *News & Contemporary Articles*
  - **Typography**: Serif headlines (`font-serif font-bold text-stone-900`), warm stone borders (`border-b border-stone-200`).

### 3.2 Route: `learn/reader` (The Core Reading Experience)
- **Baseline View:** `ReaderView`
  - Monolithic dark screen; max width 4xl (too wide for comfortable long-form reading).
  - Sentences formatted as dark interactive blocks.
  - Clicking any token opens a full-screen blocking modal overlay (`ContextualLookupModal`).
- **Transformed Editorial View:**
  - **Article Header**: Category kicker, elegant serif headline (`text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight`), subtitle, author/archive attribution, reading time.
  - **Reading Column**: Narrowed to `max-w-2xl` (680px), generous line-height (`leading-relaxed`), comfortable paragraph margins (`mb-6`).
  - **Typographical Rhythm**: Sentence tokens with subtle hover indicators; selected tokens highlighted in warm paper amber without blocking surrounding text.
  - **Word Lookup**: Replaced blocking modal with an anchored, non-modal contextual popover or sliding drawer that keeps the reading context completely in view.
  - **Learning Activities**: Rendered smoothly at the conclusion of the article as an editorial study section.

### 3.3 Route: `words` (Personal Lexicon)
- **Baseline View:** `MyWordsPage`
  - Dark cards with large pill badges and dark review modal.
- **Transformed Editorial View:**
  - Clean two-column or single-column dictionary index.
  - Term in bold serif (`font-serif text-lg text-stone-900`), part of speech in italics (`italic text-stone-500`), contextual sentence in warm quote box.
  - Retains SM-2 review trigger with clean, dignified button controls.

### 3.4 Route: `mistakes` (Pedagogical Notebook)
- **Baseline View:** `MyMistakesPage`
  - Heavy red/rose alerts, high cognitive load.
- **Transformed Editorial View:**
  - Editorial correction notebook.
  - Clear typographical contrast: Learner attempt struck or tinted in soft crimson; native correction in deep ink/emerald; pedagogical reasoning clearly articulated.
  - In-line retesting form.

### 3.5 Route: `settings` (Preferences)
- **Baseline View:** `SettingsPage`
  - Dark settings list.
- **Transformed Editorial View:**
  - Crisp light editorial form layout.
  - Explicit three-way linguistic separation:
    1. *Interface Language* (`en`, `pt`, `es`)
    2. *Learning Target Language* (`pt`, `es`, `en`)
    3. *Explanation Language* (`en`, `pt`, `es`)
  - Clear regional variety selection strictly bound to target language (`pt-BR`, `pt-PT`, `es-ES`, `es-MX`).

---

## 4. Architectural Invariants Preserved During Transformation

1. **Zero-Paid AI Mandate**: Offline open linguistic engines (Tatoeba, Wiktionary, deterministic synthesis) continue to power all reading annotations.
2. **Local-First & Offline**: Dexie v5 IndexedDB caching, offline queueing, and SM-2 calculations remain 100% functional.
3. **Four-Way Linguistic Decoupling**: Interface, target, explanation, and regional variety remain strictly orthogonal.
4. **Tenant Isolation**: Multi-user account security and RLS boundaries remain unbroken.
5. **Admin Authorization**: Non-administrators are completely restricted from administrative publishing routes.
