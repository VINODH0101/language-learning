# Lexilume — Editorial Design System (Milestone 8.5.2)

> **Document Type:** Design System Specification & Token Architecture  
> **Phase:** Phase 8.5 — Editorial UI/UX Redesign  
> **Milestone:** 8.5.2 — Design System  
> **Branch:** `phase-8-ui-redesign`  
> **Date:** 2026-11-03  
> **Aesthetic:** Editorial / Premium Light

---

## 1. Principles of the Editorial Aesthetic

1. **Reading as the Primary Destination**: The UI recedes to let long-form authentic pedagogical content command the eye. Whitespace, baseline rhythm, and generous line-heights replace crowded dashboards.
2. **Typography as Architecture**: Information hierarchy is established through a refined dual typography system (classical serif headlines and clean sans-serif controls) rather than heavy bounding containers.
3. **Restrained Warmth**: Replaces clinical tech blues and dark-mode matrices with warm paper whites (`#FDFBF7`), rich charcoal ink (`#1C1917`), subtle warm stone rules (`#E7E5E4`), and deep terracotta/burgundy accents (`#8B1E0F`).
4. **No Card Fatigue**: Content flows across natural editorial columns with hairline section dividers (`border-b border-stone-200`) instead of floating rounded cards.
5. **Non-Disruptive Interaction**: Word and phrase lookups happen in contextual, non-blocking anchored popovers that maintain the surrounding sentence context.

---

## 2. Design Tokens

### 2.1 Color Palette (Light Editorial)

| Token Name | Hex Value | Semantic Role | Tailwind Equivalent |
| :--- | :--- | :--- | :--- |
| `color-paper` | `#FDFBF7` | Primary canvas & page background | Custom / `bg-[#FDFBF7]` |
| `color-paper-muted` | `#F5F3EC` | Secondary subtle background / table heads | `bg-stone-100` / `#F5F3EC` |
| `color-paper-card` | `#FFFFFF` | Isolated document sheet / popover card | `bg-white` |
| `color-ink` | `#1C1917` | Primary text, article headlines | `text-stone-900` |
| `color-ink-muted` | `#57534E` | Secondary body text, summaries | `text-stone-600` |
| `color-ink-subtle` | `#857F77` | Metadata, timestamps, captions | `text-stone-500` |
| `color-rule` | `#E7E5E4` | Hairline section dividers and editorial rules | `border-stone-200` |
| `color-editorial-accent` | `#8B1E0F` | Featured tags, highlighted quotes | `text-amber-900` / `#8B1E0F` |
| `color-success-bg` | `#ECFDF5` | Mastery indicators, resolved mistakes | `bg-emerald-50` |
| `color-success-text` | `#065F46` | Mastery typography | `text-emerald-800` |
| `color-warning-bg` | `#FFFBEB` | Due reviews, warnings | `bg-amber-50` |
| `color-warning-text` | `#92400E` | Due review typography | `text-amber-800` |
| `color-danger-bg` | `#FEF2F2` | Unresolved mistakes | `bg-rose-50` |
| `color-danger-text` | `#991B1B` | Error typography | `text-rose-800` |

### 2.2 Typography Scale

| Hierarchy Level | Font Family | Size (px / rem) | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Headline 1** | Serif (`font-serif`) | `2.5rem` (40px) | `1.15` | Bold (700) | Article Title, Featured Story |
| **Headline 2** | Serif (`font-serif`) | `1.75rem` (28px) | `1.25` | Bold (700) | Section Header, Story Chapters |
| **Headline 3** | Serif (`font-serif`) | `1.25rem` (20px) | `1.35` | Semibold (600) | Activity Title, Sub-headings |
| **Reading Body** | Serif (`font-serif`) | `1.125rem` (18px) | `1.8` | Regular (400) | Target Language Article Paragraphs |
| **Interface Body** | Sans (`font-sans`) | `0.875rem` (14px) | `1.5` | Regular (400) | Translations, Explanations |
| **Control / Button** | Sans (`font-sans`) | `0.875rem` (14px) | `1.0` | Medium (500) | Navigation, Action Buttons |
| **Caption / Meta** | Sans (`font-sans`) | `0.75rem` (12px) | `1.4` | Regular (400) | Byline, Date, Read Time, CEFR |

### 2.3 Layout Breakpoints & Containers

- **Article Reading Column**: `max-w-2xl` (680px), centered with `mx-auto`. Optimized for 65–75 characters per line to minimize saccadic eye fatigue.
- **Publication Index / Catalog**: `max-w-6xl` (1152px), centered with `px-4 sm:px-6 lg:px-8`.
- **Administrative Workspace**: `max-w-7xl` (1280px), tailored for split-view editorial reviews and workflow inspection.

---

## 3. Responsive Breakpoints

- `360px` (Compact mobile / small smartphones)
- `390px` (Modern standard mobile viewport)
- `768px` (Tablets / split view)
- `1024px` (Desktop / landscape laptops)
- `1440px` (High-density displays / widescreen workstations)
