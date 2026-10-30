# Lexilume — Global UI Internationalization (i18n) Audit Report

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Date:** October 30, 2026  
> **Status:** Critical Architectural Defect Identified & Migration Plan  
> **Author:** Antigravity AI Senior Architecture & i18n Lead  

---

## 1. Executive Summary & Root Cause Analysis

Lexilume was originally developed as an immersive platform with strong emphasis on European Portuguese (`pt-PT`) and Brazilian Portuguese (`pt-BR`). As the system evolved to support multiple target languages (Spanish, English, and 10 additional languages), the frontend UI maintained substantial blocks of Portuguese text hardcoded directly into JSX templates, labels, badge texts, toast notifications, and modal dialogues.

### The Critical Issue
When a learner selects **English** or **Spanish** as their **Interface Language**, numerous core components continue displaying Portuguese text. For example:
- **Dashboard:** "O que devo aprender hoje?", "Passo", "Ofensiva de", "Dias", "Retomar Lição", "LÉXICO", "GRAMÁTICA", "TEMPO", "Aprenda com o Mundo Real".
- **Navigation:** "Trilha Imersiva C1 / B2", "Dicionário Bilíngue & Tradução", "Imersão Cultural & Leituras Globais", "Menu do Perfil e Configurações".
- **Course & Lesson Steppers:** "1. Aprender", "2. Compreender", "3. Usar o Idioma", "4. Testar-se", "Concluir Lição de Hoje".
- **Guided Onboarding Modal:** "Passo 1 de 8", "1. Escolha o Idioma da Interface", "Controla os botões, navegação e menus do aplicativo Lexilume", "Avaliação Diagnóstica".
- **Authentication Modal:** "Por favor, informe seu nome completo", "Preservar Progresso de Visitante".
- **Progress & Practice:** "Distribuição do Léxico por Estágio SM-2", "Prática e Recordação Espaçada", "Cartões SM-2".

This creates a jarring, unpolished, and fractured user experience.

---

## 2. Current Localization Architecture Assessment

| Aspect | Current Implementation | Issues Identified |
| :--- | :--- | :--- |
| **Libraries** | `i18next@26.5.12`, `react-i18next@17.1.9` installed | Configured but underutilized; large sections bypassed i18next. |
| **Language Matrix** | Defined in `i18next.ts` | Only `['en', 'pt', 'es']` supported. 10 languages missing from interface selection (`fr`, `de`, `it`, `ja`, `ko`, `ru`, `nl`, `zh-Hans`, `tr`, `ta`). |
| **Translation Storage** | Single monolithic file `frontend/src/i18n/translations.ts` (~1,280 lines) | Flat dictionary without namespace partitioning (`common`, `navigation`, `dashboard`, `learning`, `practice`, `settings`, `auth`, `errors`). High merge conflict risk and difficult to scale. |
| **Context & Hooks** | Custom `i18nContext.tsx` with `t(key)` wrapper | Some components used `t()`, others hardcoded strings directly in JSX. |
| **Persistence** | `localStorage.getItem('polyglot_interface_lang')` | Local preference was not systematically synchronized with Supabase authenticated user profiles (`UserProfile.interface_language`). |
| **HTML Attribute** | Hardcoded in `index.html` as `<html lang="en">` | Never updated dynamically when user switches interface language, impairing screen readers and accessibility. |
| **Formatting** | Partial `Intl` usage | Inconsistent date and number formatting across languages. |

---

## 3. Four-Way Decoupling vs. UI Internationalization

The platform architecture strictly enforces **Three Independent Language Settings**:

1. **`interface_language`**: The language used for all UI chrome, headings, buttons, notifications, errors, and navigation (`en`, `pt`, `pt-BR`, `pt-PT`, `es`, `fr`, `de`, `it`, `ja`, `ko`, `ru`, `nl`, `zh-Hans`, `tr`, `ta`).
2. **`target_language`**: The language the user is actively acquiring (`pt`, `es`, `en`, `fr`, `de`, `it`, `ja`, `ko`, `ru`, `nl`, `zh`, `tr`, `ta`).
3. **`explanation_language`**: The pedagogical language used for grammatical explanations, linguistic notes, and definitions (`en`, `pt`, `es`).
4. **`regional_variety`**: Dialect/accent strictly tied to target learning language (`pt-BR`, `pt-PT`, `es-ES`, etc.).

### Critical Ground Rule:
Changing the target learning language must **never** alter the interface language. Changing the interface language must **never** alter student progress, curriculum node states, or vocabulary records.

---

## 4. Comprehensive Inventory of Hardcoded Strings

### 4.1. Navigation & Header (`frontend/src/components/common/Navigation.tsx`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `Navigation.tsx:151` | "Trilha Imersiva C1 / B2" | `nav.tracks.portuguese_desc` |
| `Navigation.tsx:158` | "Trilha Imersiva C1 / B2" | `nav.tracks.spanish_desc` |
| `Navigation.tsx:165` | "Trilha para Falantes PT/ES" | `nav.tracks.english_desc` |
| `Navigation.tsx:175` | "Top 200 & Frases do Cotidiano" | `nav.tools.vocabulary_desc` |
| `Navigation.tsx:182` | "Dicionário Bilíngue & Tradução" | `nav.tools.translate_desc` |
| `Navigation.tsx:189` | "Imersão Cultural & Leituras Globais" | `nav.tools.explore_desc` |
| `Navigation.tsx:322` | "Ofensiva de" | `nav.streak_prefix` |
| `Navigation.tsx:323` | "dias seguidos" | `nav.streak_suffix` |
| `Navigation.tsx:361` | "Menu do Perfil e Configurações" | `nav.profile_menu_aria` |
| `Navigation.tsx:378` | "Guia de Boas-Vindas" | `nav.onboarding_guide` |
| `Navigation.tsx:391` | "Painel de Governança" | `nav.admin_panel` |

### 4.2. Home Dashboard (`frontend/src/features/dashboard/DashboardView.tsx`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `DashboardView.tsx:280` | "O que devo aprender hoje? Aqui está seu roteiro diário:" | `dashboard.daily_roadmap_prompt` |
| `DashboardView.tsx:689` | "Lexilume World — Tempo Real" | `dashboard.world_hub_badge` |
| `DashboardView.tsx:704` | "Aprenda com o Mundo Real: {city}, {country}" | `dashboard.world_real_learning_title` |
| `DashboardView.tsx:714` | "Abrir Lexilume World" | `dashboard.world_open_btn` |
| `DashboardView.tsx:738` | "Saudação contextual para o horário local de destino." | `dashboard.world_greeting_desc` |
| `DashboardView.tsx:740` | "Ver relógio mundial" | `dashboard.world_clock_link` |
| `DashboardView.tsx:759` | "Aprenda vocabulário atmosférico com condições ao vivo." | `dashboard.world_weather_desc` |
| `DashboardView.tsx:761` | "Praticar vocabulário de clima" | `dashboard.world_weather_link` |
| `DashboardView.tsx:772` | "Celebração Cultural" | `dashboard.world_holiday_badge` |
| `DashboardView.tsx:780` | "Ver calendário global" | `dashboard.world_calendar_link` |

### 4.3. Guided Onboarding Modal (`frontend/src/components/onboarding/GuidedOnboardingModal.tsx`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `GuidedOnboardingModal.tsx:153` | "Passo {step} de {totalSteps}" | `onboarding.step_indicator` |
| `GuidedOnboardingModal.tsx:174` | "Pular" | `onboarding.skip_btn` |
| `GuidedOnboardingModal.tsx:208` | "Sugestão Inteligente (Baseada no Navegador)" | `onboarding.smart_suggestion_title` |
| `GuidedOnboardingModal.tsx:220` | "Zero GPS ou rastreamento de IP..." | `onboarding.smart_privacy_notice` |
| `GuidedOnboardingModal.tsx:230` | "Aplicar ({interface} / {target})" | `onboarding.smart_apply_btn` |
| `GuidedOnboardingModal.tsx:242` | "1. Escolha o Idioma da Interface" | `onboarding.step1_title` |
| `GuidedOnboardingModal.tsx:246` | "Controla os botões, navegação e menus..." | `onboarding.step1_desc` |
| `GuidedOnboardingModal.tsx:283` | "2. Escolha o Idioma que Deseja Aprender" | `onboarding.step2_title` |
| `GuidedOnboardingModal.tsx:327` | "3. Escolha o Idioma de Explicação" | `onboarding.step3_title` |
| `GuidedOnboardingModal.tsx:376` | "4. Selecione seu Nível de Proficiência (CEFR)" | `onboarding.step4_title` |
| `GuidedOnboardingModal.tsx:427` | "5. Meta Diária de Estudo" | `onboarding.step5_title` |
| `GuidedOnboardingModal.tsx:466` | "6. Avaliação Diagnóstica" | `onboarding.step6_title` |
| `GuidedOnboardingModal.tsx:556` | "7. Trilha de Aprendizado Personalizada" | `onboarding.step7_title` |
| `GuidedOnboardingModal.tsx:589` | "8. Tudo Pronto para Começar!" | `onboarding.step8_title` |
| `GuidedOnboardingModal.tsx:619` | "Começar Primeira Lição" | `onboarding.start_first_lesson_btn` |

### 4.4. Course View & Stepper (`frontend/src/features/course/CourseView.tsx`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `CourseView.tsx:102` | "1. Aprender" / "Vocabulário, Gramática & Regras" | `learning.stage1_title`, `learning.stage1_subtitle` |
| `CourseView.tsx:114` | "2. Compreender" / "Leitura, Áudio & Diálogo" | `learning.stage2_title`, `learning.stage2_subtitle` |
| `CourseView.tsx:125` | "3. Usar o Idioma" / "Fala, Conversação & Escrita" | `learning.stage3_title`, `learning.stage3_subtitle` |
| `CourseView.tsx:136` | "4. Testar-se" / "Exercícios, Falsos Amigos & Recursos" | `learning.stage4_title`, `learning.stage4_subtitle` |
| `CourseView.tsx:219` | "Concluir Lição de Hoje" / "Lição Concluída" | `learning.complete_lesson_btn`, `learning.completed_btn` |
| `CourseView.tsx:310` | "Próxima Etapa" / "Etapa Anterior" | `learning.next_stage_btn`, `learning.prev_stage_btn` |

### 4.5. Authentication Modal (`frontend/src/components/auth/AuthModal.tsx`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `AuthModal.tsx:55` | "Por favor, informe seu nome completo." | `auth.error_full_name_required` |
| `AuthModal.tsx:72` | "Por favor, confirme a verificação de segurança..." | `auth.error_bot_verification_required` |
| `AuthModal.tsx:156` | "Preservar Progresso de Visitante" | `auth.guest_migration_title` |
| `AuthModal.tsx:197` | "Seu Nome Completo" | `auth.full_name_placeholder` |
| `AuthModal.tsx:285` | "Aguarde..." | `auth.loading_button` |

### 4.6. Settings Page (`frontend/src/pages/SettingsPage.tsx`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `SettingsPage.tsx:70` | "Curso ativo: {name}" | `settings.active_course_toast` |
| `SettingsPage.tsx:72` | "Erro ao trocar curso." | `settings.error_change_course` |
| `SettingsPage.tsx:242` | "Português (Explicações teóricas e notas...)" | `settings.explanation_lang_pt` |
| `SettingsPage.tsx:290` | "Ajuste o modo de exibição de cores..." | `settings.theme_desc` |
| `SettingsPage.tsx:406` | "Fuso Horário Configurado" | `settings.timezone_label` |
| `SettingsPage.tsx:441` | "Notificações de sistema e alertas de ofensiva..." | `settings.system_notifications_label` |

### 4.7. Practice & SRS (`frontend/src/pages/PracticePage.tsx` & components)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `PracticePage.tsx:87` | "Prática e Recordação Espaçada" | `practice.title` |
| `PracticePage.tsx:139` | "Cartões SM-2" | `practice.tab_sm2` |
| `PracticePage.tsx:223` | "Múltipla Escolha" | `practice.tab_multiple_choice` |
| `PracticePage.tsx:235` | "Lacunas e Correção" | `practice.tab_cloze` |
| `FlashcardDeck.tsx:282` | "Errei (1)" | `practice.sm2_rating_again` |
| `FlashcardDeck.tsx:296` | "Difícil (3)" | `practice.sm2_rating_hard` |
| `FlashcardDeck.tsx:310` | "Fácil (5)" | `practice.sm2_rating_easy` |

### 4.8. Progress Page (`frontend/src/pages/ProgressPage.tsx`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `ProgressPage.tsx:180` | "Distribuição do Léxico por Estágio SM-2" | `progress.lexicon_distribution_title` |
| `ProgressPage.tsx:187` | "Expostos na lição" | `progress.stage_exposed` |
| `ProgressPage.tsx:193` | "1-2 repetições" | `progress.stage_learning` |
| `ProgressPage.tsx:199` | "3-4 repetições" | `progress.stage_consolidating` |
| `ProgressPage.tsx:205` | "5+ repetições (Longo Prazo)" | `progress.stage_mastered` |

### 4.9. Vocabulary Explorer & PDF Modal (`frontend/src/components/vocabulary/`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `DownloadPdfDialog.tsx:139` | "Idioma de Explicação" | `vocabulary.pdf.explanation_lang_label` |
| `DownloadPdfDialog.tsx:155` | "Tipo de Conteúdo" | `vocabulary.pdf.content_type_label` |
| `DownloadPdfDialog.tsx:162` | "Frases do Cotidiano e Diálogos" | `vocabulary.pdf.content_sentences` |
| `DownloadPdfDialog.tsx:163` | "Coleção Temática Completa" | `vocabulary.pdf.content_thematic` |
| `LiveDictionaryLookup.tsx:204` | "Salva no Vocabulário" | `vocabulary.saved_badge` |
| `PracticeFlashcards.tsx:177` | "Já Dominei" | `vocabulary.mastered_btn` |
| `PracticeQuiz.tsx:78` | "Teste Concluído!" | `vocabulary.quiz_completed_title` |
| `PracticeQuiz.tsx:89` | "Refazer Exercício" | `vocabulary.retry_quiz_btn` |

### 4.10. Lexilume World Hub & Features (`frontend/src/features/world/`)
| File & Line Range | Hardcoded Portuguese String | Proposed Translation Key |
| :--- | :--- | :--- |
| `WorldClock.tsx:190` | "World Clock & Saudações Contextuais" | `world.clock.title` |
| `WorldClock.tsx:210` | "Filtrar Idioma:" | `world.clock.filter_label` |
| `WeatherStudio.tsx` | "Estúdio Meteorológico e Qualidade do Ar" | `world.weather.title` |
| `CulturalCalendar.tsx` | "Calendário Cultural & Feriados Mundiais" | `world.holidays.title` |
| `CurrencyPractice.tsx` | "Conversor e Prática de Vocabulário Financeiro" | `world.currency.title` |

---

## 5. Target Architecture & Namespaced Translation Design

To ensure modularity and eliminate bundle bloat, we migrate from a monolithic flat object to clean, namespaced translation resources organized by domain:

```text
frontend/src/i18n/
  ├── index.ts                     # Primary entry point & initialization export
  ├── config.ts                    # i18next configuration, fallback rules & plugins
  ├── i18nContext.tsx              # Backward-compatible React Context & hook wrappers
  ├── languageDetector.ts          # Safe language detector with explicit user-preference priority
  └── locales/
      ├── en/                      # Fallback & Canonical Locale
      │   ├── common.json
      │   ├── navigation.json
      │   ├── dashboard.json
      │   ├── learning.json
      │   ├── practice.json
      │   ├── settings.json
      │   ├── auth.json
      │   ├── world.json
      │   └── errors.json
      ├── pt/                      # Base Portuguese
      ├── pt-BR/                   # Brazilian Portuguese Regional Variant
      ├── pt-PT/                   # European Portuguese Regional Variant
      ├── es/                      # Spanish
      ├── fr/                      # French
      ├── de/                      # German
      ├── it/                      # Italian
      ├── ja/                      # Japanese
      ├── ko/                      # Korean
      ├── ru/                      # Russian
      ├── nl/                      # Dutch
      ├── zh-Hans/                 # Simplified Chinese
      ├── tr/                      # Turkish
      └── ta/                      # Tamil
```

### Supported Interface Languages (Total: 13 Languages + 2 Regional Variants)

1. `en` — English (Canonical Base / Fallback)
2. `pt` — Português (Base Lusófona)
3. `pt-BR` — Português (Brasil)
4. `pt-PT` — Português (Portugal)
5. `es` — Español
6. `fr` — Français
7. `de` — Deutsch
8. `it` — Italiano
9. `ja` — 日本語
10. `ko` — 한국어
11. `ru` — Русский
12. `nl` — Nederlands
13. `zh-Hans` — 中文（简体）
14. `tr` — Türkçe
15. `ta` — தமிழ்
*(Hindi is explicitly excluded per project invariants)*

---

## 6. Implementation Strategy & Verification Plan

1. **Architecture Migration:**
   - Establish `locales/` directory with modular JSON namespaces.
   - Configure i18next with multi-namespace resolution (`ns: ['common', 'navigation', 'dashboard', 'learning', 'practice', 'settings', 'auth', 'world', 'errors']`).
   - Configure locale fallbacks: `pt-BR` -> `pt` -> `en`, `pt-PT` -> `pt` -> `en`, `zh` -> `zh-Hans` -> `en`, all other locales -> `en`.
2. **Preference Synchronization:**
   - On language switch, immediately update `document.documentElement.lang`.
   - Persist to `localStorage.setItem('polyglot_interface_lang', lang)`.
   - For authenticated users, persist to Supabase `user_profiles.interface_language`.
   - Immediate UI re-render without full page reload.
3. **Screen-by-Screen Refactoring:**
   - Replace every identified hardcoded string with typed keys.
   - Ensure learning content (vocabulary, example sentences, exercises) remains bound to `target_language` and `explanation_language`, and is **never** conflated with `interface_language`.
4. **Verification & Testing:**
   - Automated translation coverage unit tests ensuring no missing keys across all 15 locale variants.
   - Test UI switching between English, Portuguese, Spanish, and Tamil without data corruption.
   - Run complete Vitest suite, TypeScript production build (`tsc -b`), and Pytest engine tests.
