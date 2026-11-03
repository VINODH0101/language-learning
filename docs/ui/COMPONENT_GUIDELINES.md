# Lexilume — Component Guidelines (Milestone 8.5.2)

> **Document Type:** Component Architecture & Usage Guidelines  
> **Phase:** Phase 8.5 — Editorial UI/UX Redesign  
> **Milestone:** 8.5.2 — Component Guidelines  
> **Branch:** `phase-8-ui-redesign`  
> **Date:** 2026-11-03

---

## 1. Core Component Guidelines

### 1.1 Buttons (`Button.tsx`)
- **Philosophy:** Restrained, high-contrast, tactile. Avoid glowing borders or heavy drop shadows.
- **Variants:**
  - `primary`: Deep dark ink (`bg-stone-900 text-stone-50 hover:bg-stone-800`). Used for single primary action per view (e.g., "Start Reading", "Publish Version").
  - `secondary`: Warm stone (`bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200`). Used for supporting controls.
  - `outline`: Hairline stone border (`border border-stone-300 text-stone-700 hover:bg-stone-50`).
  - `ghost`: Transparent with subtle hover tint (`text-stone-700 hover:bg-stone-100/70`). Used for navigation links and contextual icon triggers.
  - `danger`: Muted crimson (`bg-rose-700 text-white hover:bg-rose-800`). Reserved strictly for destructive mutations (e.g., delete version, reset data).

### 1.2 Badges & Category Labels (`Badge.tsx`)
- **Philosophy:** Informational, unobtrusive, flat. No pulsating glows or rounded pill clusters.
- **Sizes:** `sm` (compact 11px) and `md` (standard 12px).
- **Variants:**
  - `slate`: Neutral stone background (`bg-stone-100 text-stone-700 border-stone-200`). Standard for CEFR tags (`B1`, `A2`).
  - `emerald`: Muted sage (`bg-emerald-50 text-emerald-800 border-emerald-200`). Standard for completed/mastered states.
  - `amber`: Warm amber (`bg-amber-50 text-amber-800 border-amber-200`). Standard for due SM-2 reviews.
  - `rose`: Soft rose (`bg-rose-50 text-rose-800 border-rose-200`). Standard for unresolved errors.

### 1.3 Editorial Headings & Masthead
- **Philosophy:** Treat headings like typography in a classic newspaper or literary journal.
- **Implementation:**
  - Section title: `font-serif text-2xl font-bold text-stone-900 tracking-tight`.
  - Section subtitle / kicker: `text-xs uppercase tracking-widest text-stone-500 font-semibold mb-1`.
  - Hairline rule below major sections: `<div className="border-b border-stone-200 my-6" />`.

### 1.4 Contextual Vocabulary Popover
- **Philosophy:** Non-modal, anchored, dismissible. Never block the article or force an artificial modal open/close interaction.
- **Placement:** Positioned alongside or immediately beneath the active sentence, or floating cleanly as a non-blocking card at the bottom right of the reader on mobile.
- **Contents:**
  1. Selected token & lemma.
  2. Contextual translation & meaning in the active sentence.
  3. Part of speech & CEFR level.
  4. Audio pronunciation trigger.
  5. Action button: "Save to My Words" (with SM-2 initial scheduling).

---

## 2. Layout Standards

```
Standard Editorial Reading Viewport:
┌─────────────────────────────────────────────────────────────────┐
│ Masthead / Global Editorial Navigation                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                 [ Back to Library ]                             │
│                                                                 │
│                 KICKER: LITERARY CULTURE                        │
│                 Article Headline (Serif 36px)                   │
│                 Byline, Date, Read Time, CEFR                   │
│                 ─────────────────────────────                   │
│                                                                 │
│                 Reading Column (max-w-2xl / 680px)              │
│                 Paragraph 1 (Serif 18px / line-height 1.8)      │
│                 Sentence 1 with interactive word tokens...      │
│                 [Inline Contextual Translation]                 │
│                                                                 │
│                 Paragraph 2...                                  │
│                                                                 │
│                 ─────────────────────────────                   │
│                 Pedagogical Reading Comprehension               │
│                 Questions & Reflection                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
