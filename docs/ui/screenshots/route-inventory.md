# Lexilume — Complete Route Inventory & Screenshot Mapping

> **Capture Date:** November 2026  
> **Repository:** `VINODH0101/language-learning`  
> **Target Production URL:** https://lexi.monster  
> **Local Verified Origin:** `http://localhost:4173`  

---

## 1. Route Inventory Table

| Page ID | Page Name | Route | User Type | Access | Desktop Captured | Mobile Captured | Full Page Captured | Viewport Breakdown | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | Home / Learner Dashboard | `/?tab=dashboard` | LEARNER | Public/Learner | Yes | Yes | Yes | Full page, Top, Section 02 (~750px), Section 03 (~1500px), Footer | Scroll height: 2607px |
| 02 | Learn / The Reading Room Catalog | `/?tab=learn` | LEARNER | Public/Learner | Yes | Yes | Yes | Full page, Top, Footer | Scroll height: 1139px |
| 03 | Practice & Quizzes / SRS | `/?tab=practice` | LEARNER | Public/Learner | Yes | Yes | Yes | Full page, Top, Footer | Scroll height: 1185px |
| 04 | Progress & Curriculum Mastery | `/?tab=progress` | LEARNER | Public/Learner | Yes | Yes | Yes | Full page, Top, Section 02 (~750px), Section 03 (~1500px), Section 04 (~2250px), Footer | Scroll height: 3568px |
| 05 | My Words / Personal Lexicon Notebook | `/?tab=words` | LEARNER | Public/Learner | Yes | Yes | Yes | Full page, Top, Footer | Scroll height: 1000px |
| 06 | My Mistakes / Error Diagnostics Notebook | `/?tab=mistakes` | LEARNER | Public/Learner | Yes | Yes | Yes | Full page, Top, Footer | Scroll height: 1000px |
| 07 | Vocabulary Deck Explorer | `/?tab=vocabulary` | LEARNER | Public/Learner | Yes | Pending | Yes | Full page, Top, Section 02 (~750px), Footer | Scroll height: 1488px |
| 08 | Culture & World Exploration | `/?tab=explore` | LEARNER | Public/Learner | Yes | Pending | Yes | Full page, Top, Footer | Scroll height: 1000px |
| 09 | Settings & 4-Way Language Matrix | `/?tab=settings` | LEARNER | Public/Learner | Yes | Yes | Yes | Full page, Top, Section 02 (~750px), Section 03 (~1500px), Footer | Scroll height: 2320px |
| 10 | Offline Translation Workbench | `/?tab=translate` | LEARNER | Public/Learner | Yes | Pending | Yes | Full page, Top, Section 02 (~750px), Section 03 (~1500px), Footer | Scroll height: 2626px |
| 11 | Portuguese Language Course Track | `/?tab=portuguese` | LEARNER | Public/Learner | Yes | Pending | Yes | Full page, Top, Section 02 (~750px), Section 03 (~1500px), Footer | Scroll height: 2378px |
| 12 | Spanish Language Course Track | `/?tab=spanish` | LEARNER | Public/Learner | Yes | Pending | Yes | Full page, Top, Section 02 (~750px), Section 03 (~1500px), Footer | Scroll height: 2442px |
| 13 | English Language Course Track | `/?tab=english` | LEARNER | Public/Learner | Yes | Pending | Yes | Full page, Top, Section 02 (~750px), Section 03 (~1500px), Section 04 (~2250px), Footer | Scroll height: 2752px |
| 14 | Admin Publishing Desk & Workbench | `/?tab=admin` | ADMIN | Role-restricted (admin) | Yes | Yes | Yes | Full page, Top, Footer | Scroll height: 1000px |
| 15 | Reader View & Contextual Lookup | `/?tab=learn` (Active Story) | LEARNER | Public/Learner | Yes | Yes | Yes | Interactive State | Contextual meaning popover & inline sentence translations |
| 16 | My Words Flashcard Review | `/?tab=words` (Review Mode) | LEARNER | Public/Learner | Yes | Yes | Yes | Interactive State | SuperMemo SM-2 study review card with recall ratings |
| 17 | Admin Manuscript Review Editor | `/?tab=admin` (Review Editor) | ADMIN | Role-restricted (admin) | Yes | Yes | Yes | Interactive State | Sentence alignments, extracted annotations, and activity review |

---

## 2. Directory Layout

```text
docs/ui/screenshots/
├── README.md
├── route-inventory.md
├── desktop/
│   ├── learner/
│   │   ├── 01-home-dashboard-full-page.png
│   │   ├── 01-home-dashboard-top.png
│   │   ├── 01-home-dashboard-section-02.png
│   │   ├── 01-home-dashboard-footer.png
│   │   ├── 02-learn-catalog-full-page.png
│   │   ├── 03-practice-full-page.png
│   │   ├── 04-progress-full-page.png
│   │   ├── 05-my-words-full-page.png
│   │   ├── 06-my-mistakes-full-page.png
│   │   └── ...
│   └── admin/
│       ├── 14-admin-workbench-full-page.png
│       └── ...
├── mobile/
│   ├── learner/
│   │   ├── 01-home-dashboard-mobile-full-page.png
│   │   ├── 02-learn-catalog-mobile-full-page.png
│   │   └── ...
│   └── admin/
│       └── 14-admin-workbench-mobile-full-page.png
└── interactive-states/
    ├── learner/
    │   ├── 01-reader-sentence-translation-and-word-lookup.png
    │   └── 02-my-words-flashcard-review-mode.png
    └── admin/
        └── 03-admin-content-review-editor.png
```
