# Polyglot C1 Daily — Comprehensive Technical Documentation Index

> **Audit Date:** 2026-10-29  
> **Repository:** `language-learning`  
> **Status:** Empirically Verified against Source Code & Automated Test Suites (166 Passing Tests)

---

## Technical Audit & Architecture Catalog

This directory contains the verified, evidence-based technical documentation for the **Polyglot C1 Daily** application, detailing its local-first architecture, decoupled linguistic matrix, pedagogical engine, data persistence, and security posture.

| Document | Title | Scope & Description |
| :--- | :--- | :--- |
| [`00-PROJECT-OVERVIEW.md`](./00-PROJECT-OVERVIEW.md) | **Project Overview & Topology** | Executive summary, core principles, system topology, repository layout, and capabilities. |
| [`01-UI-UX-AND-DESIGN-SYSTEM.md`](./01-UI-UX-AND-DESIGN-SYSTEM.md) | **UI/UX & Design System** | Dark-first design tokens, typography, layout containers, navigation, and component catalog. |
| [`02-PAGE-AND-MODULE-BEHAVIOR.md`](./02-PAGE-AND-MODULE-BEHAVIOR.md) | **Page & Module Behavior** | Traced lifecycle and user workflows for all 11 views (Dashboard, Lessons, Vocabulary, Practice, Admin). |
| [`03-DATA-ACCESS-AND-DISPLAY.md`](./03-DATA-ACCESS-AND-DISPLAY.md) | **Data Access & Display** | Step-by-step data transformations from user actions to IndexedDB, LocalStorage, and Supabase. |
| [`04-API-DATABASE-AND-PERSISTENCE.md`](./04-API-DATABASE-AND-PERSISTENCE.md) | **API, Database & Persistence** | PostgreSQL migrations (001–008), Dexie schemas, offline mutation queue, and idempotency guarantees. |
| [`05-MULTILINGUAL-AND-TRANSLATION-CONSISTENCY.md`](./05-MULTILINGUAL-AND-TRANSLATION-CONSISTENCY.md) | **Multilingual Architecture** | 4-way language matrix (UI, target, explanation, regional variety), 9 language pairs, TTS scoping. |
| [`06-SECURITY-AND-DATA-OWNERSHIP.md`](./06-SECURITY-AND-DATA-OWNERSHIP.md) | **Security & Data Ownership** | Row-Level Security, role authorization, content sanitization (XSS guard), and account isolation. |
| [`07-TESTING-AND-VALIDATION.md`](./07-TESTING-AND-VALIDATION.md) | **Testing & Quality Assurance** | Verification log of 176 automated tests (98 Vitest + 78 Pytest), build performance, and CI workflows. |
| [`08-KNOWN-ISSUES-AND-TECHNICAL-DEBT.md`](./08-KNOWN-ISSUES-AND-TECHNICAL-DEBT.md) | **Known Issues & Technical Debt** | Confirmed defects, typographic boundaries in PDF exports, and environment constraints. |
| [`09-RECOMMENDED-ROADMAP.md`](./09-RECOMMENDED-ROADMAP.md) | **Engineering Roadmap** | Prioritized, evidence-backed recommendations for feature evolution and performance enhancements. |
| [`10-AI-ASSISTANT-PROJECT-CONTEXT.md`](./10-AI-ASSISTANT-PROJECT-CONTEXT.md) | **AI Assistant Project Context** | Concise ground-truth architectural reference and invariant rules for future coding agents. |
| [`11-EVIDENCE-AND-FINDINGS.md`](./11-EVIDENCE-AND-FINDINGS.md) | **Evidence & Verification Findings** | Exact CLI outputs, test logs, package manifests, and code citations backing this audit. |
| [`12-IMPLEMENTATION-VERIFICATION.md`](./12-IMPLEMENTATION-VERIFICATION.md) | **Implementation Verification** | Claim-by-claim verification of the initial project review against actual codebase reality. |

---

## Core System Invariants

1. **Zero-Paid AI Mandate**: All lesson content, vocabulary definitions, grammar rules, exercises, and cultural materials are derived from open educational resources (Wiktionary CC-BY-SA 3.0, Tatoeba CC-BY 2.0 FR, Wikipedia CC-BY-SA 4.0) and deterministic synthesis engines.
2. **Local-First Reliability**: Core studying, spaced repetition reviews, vocabulary browsing, and placement testing function 100% offline in browser storage via Dexie / IndexedDB.
3. **Four-Way Linguistic Decoupling**: Interface language (`en`, `pt`, `es`), Target learning language (`pt`, `es`, `en`), Explanation language (`en`, `pt`, `es`), and Regional variety (`pt-BR`, `pt-PT`, `es-ES`, `es-MX`, `en-US`, etc.) are strictly isolated across client and server.
4. **Server-Enforced Data Protection**: Row-Level Security (RLS) policies on Supabase guarantee that unauthenticated users or normal learners cannot access or corrupt private progress records or perform administrative operations.
