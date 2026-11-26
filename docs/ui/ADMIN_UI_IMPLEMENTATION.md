# Lexilume — Milestone 8.5.4: Admin Editorial Publishing Workspace

> **Phase:** 8.5 — Editorial UI/UX Redesign  
> **Milestone:** 8.5.4 — Admin Pages Redesign  
> **Date:** November 2026  
> **Repository:** `VINODH0101/language-learning`  
> **Active Branch:** `phase-8-ui-redesign`  

---

## 1. Executive Summary

Milestone 8.5.4 redesigns the administrative experience from a dark, generic software dashboard into a **professional editorial desk and back-office of a quality publishing house**. 

Administrators manage the full lifecycle of authentic learning texts: source intake with rights provenance, automated deterministic linguistic pipeline execution, stage-by-stage telemetric inspection, in-line editorial review, and immutable versioned publication.

---

## 2. Redesigned Editorial Desk Workspaces

### 2.1 Editorial Publishing Desk Shell (`AdminWorkbench.tsx`, `AdminPage.tsx`)
- **Restrained Editorial Typography**: Classical serif masthead (`font-serif text-2xl sm:text-3xl font-bold text-stone-900`) on a warm paper-white canvas (`#FDFBF7`), accompanied by subtle hairline borders (`border-stone-200`) and refined status badges.
- **Unified Navigation Rails**: Clean stone tab pills categorizing administrative responsibilities:
  1. *Content Studio (Phase 7)*: The primary content-centred publishing engine.
  2. *Visão Geral*: Live platform health, learner analytics, and system uptime.
  3. *Gestão de Usuários*: Tenant user governance and role management.
  4. *Fila de Moderação*: Moderation queue for flagged corpus entries.
  5. *Matriz de Idiomas (13)*: Language enablement matrix (Hindi strictly excluded).
  6. *Auditoria CEFR*: Lexical density and text balance metrics across A1–C1.
  7. *Saúde de Provedores*: Latency and operational telemetry for open sources.
  8. *Fila de Falhas*: Bounded retry management for background tasks.
  9. *Detector de Duplicatas*: Content hash integrity checks.
  10. *Versões dos Datasets*: Open educational corpus licensing tracking (Wiktionary, Tatoeba, Gutendex).

### 2.2 Content Library & Catalog View (`AdminContentStudio.tsx`)
- **Catalog Overview**: Filterable by target language (`en`, `pt`, `es`), status (`published`, `review_required`, `draft`), and keyword search.
- **Editorial Card Layout**: Each content edition displays its CEFR level, target language, reading duration, publication status badge (`emerald` for Published, `amber` for Review Required, `slate` for Draft), and direct action button to inspect and edit.

### 2.3 Editorial Intake Desk (`ContentImportForm.tsx`)
- **Authentic Text Intake**: Formatted like a manuscript submission desk with live word counting (enforcing the $\ge 15$ word boundary required for linguistic processing).
- **Linguistic Separation**: Independent selection of Learning Target Language (`en`, `pt`, `es`), Explanation Language (`pt`, `en`, `es`), Genre, and CEFR target.
- **Rights Declaration & Fair Use Provenance**: Comprehensive attribution inputs:
  - Rights Status (`public_domain`, `original`, `licensed`, `permitted`, `restricted`, `unknown`).
  - Source Attribution & original publication URL.
  - Restricted Rights Guard: Warning that restricted or unknown rights will block final publication until legal clearance is documented.

### 2.4 Pipeline Processing Telemetry (`PipelineJobMonitor.tsx`)
- **Linear 9-Stage Telemetry**: Visual progression across all 9 deterministic pipeline stages:
  1. Intake & Validation
  2. Language Detection
  3. Classification & CEFR
  4. Text Segmentation
  5. Contextual Translation
  6. Lexicon Extraction
  7. Grammar Identification
  8. Activity Generation
  9. Structural Validation
- **Stage Timing & Stage Retry**: Millisecond timings logged per stage with instant individual stage retry buttons in the event of bounded network failure.

### 2.5 In-Line Review & Publishing Editor (`ContentReviewEditor.tsx`)
- **Tabbed Editorial Inspection**:
  - *Paragraphs & Sentences*: Edit individual sentence translations in the pedagogical explanation language.
  - *Extracted Vocabulary*: Review and refine lemmas, parts of speech, and contextual meanings.
  - *Grammar Points*: Inspect detected syntactic constructions and explanation glosses.
  - *Comprehension Activities*: Directly edit question stems, correct answers, and pedagogical feedback.
- **Version Immutability Gating**:
  - Published editions cannot be mutated in place (protecting historical learner progress and review queues).
  - Edits to published content automatically create a new draft edition (`v2`, `v3`).
  - One-click "Approve & Publish" action with rights clearance enforcement.

---

## 3. Verification & Test Evidence

All administrative test suites execute and pass with zero regressions:

### 3.1 Admin Workbench Suite
```bash
npm --prefix frontend test -- src/tests/adminWorkbenchRedesign.test.tsx
```
**Verified Output:**
```text
 ✓ src/tests/adminWorkbenchRedesign.test.tsx (9 tests) 285ms
   ✓ blocks unauthenticated guests and regular users from accessing AdminPage
   ✓ permits authenticated administrators full access to AdminPage and Workbench
   ✓ calculates dynamic platform overview metrics based on real database/storage records
   ✓ approves and rejects items in the content review queue with audit logging
   ✓ strictly excludes Hindi (hi) from content review submissions
   ✓ publishes a new daily poem and archives previously active poem for that language without deletion
   ✓ publishes a new daily conversation and archives previously active conversation for that language
   ✓ manages background jobs queue and enforces bounded retry attempts (cap at maxRetries)
   ✓ reports authentic provider health records without synthetic checks

Test Files  1 passed (1)
     Tests  9 passed (9)
```

### 3.2 Content-Centred Pipeline & E2E Integration Suite
```bash
npm --prefix frontend test -- src/tests/contentCentredPipeline.test.ts src/tests/contentCentredE2E.test.ts
```
**Verified Output:**
```text
 ✓ src/tests/contentCentredE2E.test.ts (1 test) 720ms
   ✓ executes full workflow: Admin Import -> Pipeline -> Publication -> Learner Reader -> Word Lookup -> SM-2 Review -> Mistake Notebook
 ✓ src/tests/contentCentredPipeline.test.ts (5 tests) 838ms
   ✓ executes 8-stage pedagogical pipeline on authentic text

Test Files  2 passed (2)
     Tests  6 passed (6)
```
