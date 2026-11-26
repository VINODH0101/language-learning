import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18nContext';
import { PortuguesePage } from '../pages/PortuguesePage';
import { SpanishPage } from '../pages/SpanishPage';
import { EnglishPage } from '../pages/EnglishPage';
import { PracticePage } from '../pages/PracticePage';
import { ProgressPage } from '../pages/ProgressPage';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { VocabularyService } from '../services/vocabularyService';
import { dailyContentService } from '../services/dailyContentService';
import { contentAccess } from '../services/contentAccess';
import type { VocabularyEntry } from '../types/vocabulary';

const TEST_ATTRIBUTION = {
  source_name: 'Lexilume AI Content Engine',
  source_url: 'https://lexilume.local',
  license_type: 'Original-Curated',
  attribution_text: 'Generated for test verification',
};

const LIVE_MULTILINGUAL_VOCAB: VocabularyEntry[] = [
  {
    id: 'en_prerogative',
    lemma: 'prerogative',
    target_language: 'en',
    part_of_speech: 'noun',
    cefr_level: 'C1',
    translations: { en: 'prerogative', pt: 'prerrogativa', es: 'prerrogativa' },
    definitions: {
      en: 'An exclusive right or privilege held by a person or group.',
      pt: 'Um direito ou privilégio exclusivo exercido por alguém.',
      es: 'Derecho o privilegio exclusivo.',
    },
    example_sentence_target: 'Strategic decisions remain the board’s prerogative.',
    example_sentence_translations: {
      en: 'Strategic decisions remain the board’s prerogative.',
      pt: 'As decisões estratégicas continuam sendo prerrogativa do conselho.',
      es: 'Las decisiones estratégicas siguen siendo prerrogativa de la junta.',
    },
    topic: 'work',
    attribution: TEST_ATTRIBUTION,
  },
  {
    id: 'en_mitigate',
    lemma: 'mitigate',
    target_language: 'en',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    translations: { en: 'mitigate', pt: 'mitigar', es: 'mitigar' },
    definitions: {
      en: 'To make less severe or painful.',
      pt: 'Tornar menos severo ou intenso.',
      es: 'Hacer menos intenso o severo.',
    },
    example_sentence_target: 'New safeguards help mitigate operational risks.',
    example_sentence_translations: {
      en: 'New safeguards help mitigate operational risks.',
      pt: 'Novas salvaguardas ajudam a mitigar riscos operacionais.',
      es: 'Nuevas salvaguardas ayudan a mitigar riesgos operativos.',
    },
    topic: 'work',
    attribution: TEST_ATTRIBUTION,
  },
  {
    id: 'pt_resiliencia',
    lemma: 'resiliência',
    target_language: 'pt',
    part_of_speech: 'noun',
    cefr_level: 'C1',
    translations: { en: 'resilience', pt: 'resiliência', es: 'resiliencia' },
    definitions: {
      en: 'Capacity to adapt and recover from challenges.',
      pt: 'Capacidade de adaptação e recuperação diante de adversidades.',
      es: 'Capacidad de adaptación ante dificultades.',
    },
    example_sentence_target: 'A resiliência institucional fortaleceu a equipe.',
    example_sentence_translations: {
      en: 'Institutional resilience strengthened the team.',
      pt: 'A resiliência institucional fortaleceu a equipe.',
      es: 'La resiliencia institucional fortaleció al equipo.',
    },
    topic: 'work',
    attribution: TEST_ATTRIBUTION,
  },
  {
    id: 'es_matiz',
    lemma: 'matiz',
    target_language: 'es',
    part_of_speech: 'noun',
    cefr_level: 'C1',
    translations: { en: 'nuance', pt: 'nuance / matiz', es: 'matiz' },
    definitions: {
      en: 'A subtle distinction or shade of meaning.',
      pt: 'Diferença sutil ou gradação de sentido.',
      es: 'Distinción sutil o grado de significado.',
    },
    example_sentence_target: 'El ensayo analiza cada matiz cultural del relato.',
    example_sentence_translations: {
      en: 'The essay examines every cultural nuance of the story.',
      pt: 'O ensaio analisa cada matiz cultural do relato.',
      es: 'El ensayo analiza cada matiz cultural del relato.',
    },
    topic: 'culture',
    attribution: TEST_ATTRIBUTION,
  },
];

describe('Course Translations & Multilingual Coverage', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    VocabularyService.setDynamicCatalog(LIVE_MULTILINGUAL_VOCAB);
    await dailyContentService.publishConversation({
      title: 'Briefing in London',
      scenario: 'Discussing quarterly strategy',
      learning_language: 'en',
      cefr_level: 'C1',
      cultural_context: 'British workplace register',
      country_name: 'United Kingdom',
      country_code: 'GB',
      dialogue: [
        { speaker: 'Alice', line: 'Shall we examine the quarterly projections?', translation: 'PT: Vamos examinar as projeções trimestrais? / ES: ¿Examinamos las proyecciones trimestrales?' },
      ],
    });
  });

  afterEach(() => {
    VocabularyService.clearDynamicCatalog();
    vi.restoreAllMocks();
  });

  it('starts with empty static catalogs and dynamically populates multilingual entries without seeds', () => {
    VocabularyService.clearDynamicCatalog();
    expect(VocabularyService.getVocabulary({ target_language: 'en' })).toHaveLength(0);

    VocabularyService.setDynamicCatalog(LIVE_MULTILINGUAL_VOCAB);
    const enLoaded = VocabularyService.getVocabulary({ target_language: 'en' });
    expect(enLoaded.length).toBeGreaterThanOrEqual(2);
    enLoaded.forEach(entry => {
      expect(entry.translations.pt).toBeTruthy();
      expect(entry.translations.es).toBeTruthy();
      expect(entry.definitions.en).toBeTruthy();
      expect(entry.definitions.pt).toBeTruthy();
      expect(entry.definitions.es).toBeTruthy();
    });
  });

  it('English lesson generator includes both PT and ES translations in vocabulary and dialogue', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson('en', '2026-10-30');
    expect(lesson.language).toBe('en');

    expect(lesson.section_2_vocabulary.length).toBeGreaterThan(0);
    expect(lesson.section_2_vocabulary[0].definition_pt).toBeTruthy();
    expect(lesson.section_2_vocabulary[0].definition_es).toBeTruthy();
    expect(lesson.section_2_vocabulary[0].example_sentence_pt).toBeTruthy();
    expect(lesson.section_2_vocabulary[0].example_sentence_es).toBeTruthy();

    expect(lesson.section_5_conversation.dialogue.length).toBeGreaterThan(0);
    expect(lesson.section_5_conversation.dialogue[0].translation_pt).toBeTruthy();
    expect(lesson.section_5_conversation.dialogue[0].translation_es).toBeTruthy();
  });

  it('renders English course page and displays live PT and ES translations', async () => {
    render(
      <I18nProvider>
        <EnglishPage />
      </I18nProvider>
    );

    await waitFor(() => {
      const ptLabels = screen.getAllByText(/PT:/);
      const esLabels = screen.getAllByText(/ES:/);
      expect(ptLabels.length).toBeGreaterThan(0);
      expect(esLabels.length).toBeGreaterThan(0);
    });
  });

  it('renders Portuguese course page and displays English translation (EN:)', async () => {
    render(
      <I18nProvider>
        <PortuguesePage />
      </I18nProvider>
    );

    await waitFor(() => {
      const enLabels = screen.getAllByText(/EN:/);
      expect(enLabels.length).toBeGreaterThan(0);
    });
  });

  it('renders Spanish course page and displays English translation (EN:)', async () => {
    render(
      <I18nProvider>
        <SpanishPage />
      </I18nProvider>
    );

    await waitFor(() => {
      const enLabels = screen.getAllByText(/EN:/);
      expect(enLabels.length).toBeGreaterThan(0);
    });
  });
});

describe('Practice & SRS Page — English Language Toggle & Live Content', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    VocabularyService.setDynamicCatalog(LIVE_MULTILINGUAL_VOCAB);
    vi.spyOn(VocabularyService, 'loadLiveCatalog').mockResolvedValue({
      vocabulary: LIVE_MULTILINGUAL_VOCAB,
      sentences: [],
    });
    vi.spyOn(contentAccess, 'getPublishedPracticeExercises').mockResolvedValue([
      {
        id: 'ex_en_inversion_1',
        curriculum_node_id: 'en-c1-1',
        language: 'en',
        exercise_type: 'multiple_choice',
        prompt: 'Under no circumstances _____ compromise editorial integrity.',
        acceptable_solutions: ['should we'],
        distractors: [{ text: 'we should', why_incorrect: 'Negative adverbial fronting requires auxiliary inversion.' }],
        explanation: 'Inversion after "Under no circumstances".',
        difficulty: 3,
        attribution: TEST_ATTRIBUTION,
      },
    ]);
  });

  afterEach(() => {
    VocabularyService.clearDynamicCatalog();
    vi.restoreAllMocks();
  });

  it('renders English track toggle button on PracticePage and switches live vocab pool to English', async () => {
    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>
    );

    const enButton = screen.getAllByRole('button', { name: /English \(EN\)/i })[0];
    fireEvent.click(enButton);

    await waitFor(() => {
      expect(screen.getByText(/prerogative|mitigate/i)).toBeDefined();
    });
  });

  it('renders live multiple choice exercises in English when English toggle is selected', async () => {
    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>
    );

    const enButton = screen.getAllByRole('button', { name: /English \(EN\)/i })[0];
    fireEvent.click(enButton);

    const mcButton = screen.getByRole('button', { name: /(Múltipla Escolha|Multiple Choice)/i });
    fireEvent.click(mcButton);

    expect(await screen.findByText(/Under no circumstances/i)).toBeDefined();
  });
});

describe('Progress Page — English Language Toggle & Curriculum', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders English track toggle button on ProgressPage and switches curriculum to English', () => {
    render(
      <I18nProvider>
        <ProgressPage />
      </I18nProvider>
    );

    const enButton = screen.getByRole('button', { name: /^English$/i });
    expect(enButton).toBeDefined();

    fireEvent.click(enButton);

    expect(screen.getByText(/Introductions and Daily Routines in the Present Simple/i)).toBeDefined();
  });
});
