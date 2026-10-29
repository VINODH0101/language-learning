import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18nContext';
import { PortuguesePage } from '../pages/PortuguesePage';
import { SpanishPage } from '../pages/SpanishPage';
import { EnglishPage } from '../pages/EnglishPage';
import { PracticePage } from '../pages/PracticePage';
import { ProgressPage } from '../pages/ProgressPage';
import { enVocabulary, ptVocabulary, esVocabulary, exerciseTemplates } from '../data/seedData';
import { dialogueScenarios } from '../data/scenarioData';
import { ClientLessonGenerator } from '../services/lessonGenerator';

describe('Course Translations & Multilingual Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('enVocabulary contains comprehensive Portuguese and Spanish translations for all lemmas & examples', () => {
    expect(enVocabulary.length).toBeGreaterThanOrEqual(12);
    enVocabulary.forEach((vocab) => {
      expect(vocab.definition_en).toBeTruthy();
      expect(vocab.definition_pt).toBeTruthy();
      expect(vocab.definition_es).toBeTruthy();
      expect(vocab.example_sentence_target).toBeTruthy();
      expect(vocab.example_sentence_pt).toBeTruthy();
      expect(vocab.example_sentence_es).toBeTruthy();
    });
  });

  it('ptVocabulary and esVocabulary provide English translations for all lemmas and examples', () => {
    ptVocabulary.forEach((vocab) => {
      expect(vocab.definition_target).toBeTruthy();
      expect(vocab.definition_en).toBeTruthy();
      expect(vocab.example_sentence_target).toBeTruthy();
      expect(vocab.example_sentence_en).toBeTruthy();
    });

    esVocabulary.forEach((vocab) => {
      expect(vocab.definition_target).toBeTruthy();
      expect(vocab.definition_en).toBeTruthy();
      expect(vocab.example_sentence_target).toBeTruthy();
      expect(vocab.example_sentence_en).toBeTruthy();
    });
  });

  it('English dialogue scenarios provide both Portuguese and Spanish translations for every turn', () => {
    const enScenarios = dialogueScenarios.filter((s) => s.language === 'en');
    expect(enScenarios.length).toBeGreaterThanOrEqual(2);

    enScenarios.forEach((scenario) => {
      expect(scenario.turns.length).toBeGreaterThan(0);
      scenario.turns.forEach((turn) => {
        expect(turn.line).toBeTruthy();
        expect(turn.translation_pt).toBeTruthy();
        expect(turn.translation_es).toBeTruthy();
      });
      scenario.vocabulary.forEach((voc) => {
        expect(voc.term).toBeTruthy();
        expect(voc.meaning).toContain('PT:');
        expect(voc.meaning).toContain('ES:');
      });
    });
  });

  it('English lesson generator includes both PT and ES translations in vocabulary, reading, and conversation', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson('en', '2026-10-30');
    expect(lesson.language).toBe('en');

    // Check vocabulary item translations
    expect(lesson.section_2_vocabulary[0].definition_pt).toBeTruthy();
    expect(lesson.section_2_vocabulary[0].definition_es).toBeTruthy();
    expect(lesson.section_2_vocabulary[0].example_sentence_pt).toBeTruthy();
    expect(lesson.section_2_vocabulary[0].example_sentence_es).toBeTruthy();

    // Check conversation dialogue turns
    expect(lesson.section_5_conversation.dialogue[0].translation_pt).toBeTruthy();
    expect(lesson.section_5_conversation.dialogue[0].translation_es).toBeTruthy();
  });

  it('renders English course page and displays dual PT and ES translations', async () => {
    render(
      <I18nProvider>
        <EnglishPage />
      </I18nProvider>
    );

    // Check that vocabulary section displays PT and ES labels for translations
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

describe('Practice & SRS Page — English Language Toggle & Content', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders English track toggle button on PracticePage and switches vocab pool to English', () => {
    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>
    );

    const enButton = screen.getByRole('button', { name: /English \(EN\)/i });
    expect(enButton).toBeDefined();

    // Switch to English
    fireEvent.click(enButton);

    // Verify active deck has English vocabulary
    expect(screen.getAllByText(/EN/).length).toBeGreaterThan(0);
    expect(screen.getByText(/prerogative|scrutiny|mitigate|nevertheless/i)).toBeDefined();
  });

  it('renders multiple choice exercises in English when English toggle is selected', () => {
    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>
    );

    // Select English track
    const enButton = screen.getByRole('button', { name: /English \(EN\)/i });
    fireEvent.click(enButton);

    // Select multiple choice practice mode
    const mcButton = screen.getByRole('button', { name: /Múltipla Escolha/i });
    fireEvent.click(mcButton);

    // English exercise prompt
    expect(screen.getByText(/Under no circumstances/i)).toBeDefined();
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

    // Switch to English
    fireEvent.click(enButton);

    // Should render English curriculum nodes
    expect(screen.getByText(/Introductions and Daily Routines in the Present Simple/i)).toBeDefined();
  });
});
