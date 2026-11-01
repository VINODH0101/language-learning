import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PracticePage } from '../pages/PracticePage';
import { FlashcardDeck } from '../components/practice/FlashcardDeck';
import { PracticeEngine, StringNormalizer } from '../features/practice/engine/practiceEngine';
import { practiceVocabService } from '../features/practice/services/practiceVocabService';
import { StorageService } from '../services/storage';
import { dailyContentService } from '../services/dailyContentService';
import { getMistakes, getPhrasebookWords, savePhrasebookWord } from '../services/localDb';
import { I18nProvider } from '../i18n/i18nContext';
import { VocabularyItem, ExerciseTemplate, DailyPoem } from '../types';

describe('Lexilume Practice Suite Redesign & Engine Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockVocab: VocabularyItem[] = [
    {
      id: 'v1',
      language: 'pt',
      lemma: 'saudade',
      part_of_speech: 'noun',
      cefr_level: 'B2',
      definition_target: 'Sentimento melancólico devido ao afastamento',
      definition_en: 'Melancholic longing for someone or something absent',
      example_sentence_target: 'Sinto saudade da minha terra natal.',
      example_sentence_en: 'I feel longing for my homeland.',
      regional_tags: ['all'],
      collocations: [],
      attribution: {
        source_name: 'Lexilume Core',
        source_url: 'local',
        license_type: 'CC-BY-SA',
        attribution_text: 'Core seed vocabulary',
      },
    },
    {
      id: 'v2',
      language: 'pt',
      lemma: 'alvíssaras',
      part_of_speech: 'noun',
      cefr_level: 'C1',
      definition_target: 'Recompensa por boas notícias',
      definition_en: 'Reward for good news',
      example_sentence_target: 'Boas alvíssaras ao mensageiro.',
      example_sentence_en: 'Good rewards to the messenger.',
      regional_tags: ['all'],
      collocations: [],
      attribution: {
        source_name: 'Lexilume Core',
        source_url: 'local',
        license_type: 'CC-BY-SA',
        attribution_text: 'Core seed vocabulary',
      },
    },
  ];

  it('1. FlashcardDeck terminates properly with Session Completion Screen (no infinite loop on final card)', () => {
    const onFinished = vi.fn();

    render(
      <I18nProvider>
        <FlashcardDeck
          vocabularyList={mockVocab}
          dailyTarget={10}
          onReviewFinished={onFinished}
        />
      </I18nProvider>
    );

    // Card 1
    expect(screen.getByText('saudade')).toBeDefined();
    const card = screen.getByRole('button', { name: /Cartão de recordação espaçada/i });
    fireEvent.click(card);

    // Rate Good (4)
    const goodBtn1 = screen.getByRole('button', { name: /Bom \(4\)/i });
    fireEvent.click(goodBtn1);

    // Advances to Card 2 (final card)
    expect(screen.getByText('alvíssaras')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Cartão de recordação espaçada/i }));

    // Rate Easy (5) on final card
    const easyBtn = screen.getByRole('button', { name: /Fácil \(5\)/i });
    fireEvent.click(easyBtn);

    // Must call finish callback
    expect(onFinished).toHaveBeenCalledTimes(1);

    // Dedicated Session Completion View is displayed instead of repeating Card 2
    expect(screen.getByText(/Sessão de Revisão Concluída!/i)).toBeDefined();
    expect(screen.getByText(/Você revisou 2 cartões nesta sessão./i)).toBeDefined();
    expect(screen.getByText(/Revisar Novamente/i)).toBeDefined();
    expect(screen.getByText(/Voltar à Prática/i)).toBeDefined();

    // Clicking "Revisar Novamente" resets session
    const restartBtn = screen.getByRole('button', { name: /Revisar Novamente/i });
    fireEvent.click(restartBtn);
    expect(screen.getByText('saudade')).toBeDefined();
  });

  it('2. Scopes daily SRS review counter strictly by user ID and language', () => {
    // Increment for user A in Portuguese
    practiceVocabService.incrementTodayReviewCount('pt', 'user_A');
    practiceVocabService.incrementTodayReviewCount('pt', 'user_A');

    // Increment for user B in Portuguese
    practiceVocabService.incrementTodayReviewCount('pt', 'user_B');

    // Increment for user A in Spanish
    practiceVocabService.incrementTodayReviewCount('es', 'user_A');

    // Verify isolation
    expect(practiceVocabService.getTodayReviewCount('pt', 'user_A')).toBe(2);
    expect(practiceVocabService.getTodayReviewCount('pt', 'user_B')).toBe(1);
    expect(practiceVocabService.getTodayReviewCount('es', 'user_A')).toBe(1);
    expect(practiceVocabService.getTodayReviewCount('es', 'user_B')).toBe(0);
  });

  it('3. PracticeEngine evaluates answers with Unicode NFC normalization, whitespace collapsing, and accent-tolerant warnings', () => {
    const distractors = [
      { text: 'cumprir', why_incorrect: 'Falta a desinência pessoal -mos.' },
      { text: 'cumpramos', why_incorrect: 'Presente do subjuntivo incorreto.' },
    ];

    // Exact match
    const exactResult = PracticeEngine.evaluate({
      submittedAnswer: '  cumprirmos   ',
      acceptableSolutions: ['cumprirmos'],
      distractors,
      explanation: 'Usa-se infinitivo pessoal flexionado.',
    });
    expect(exactResult.isCorrect).toBe(true);
    expect(exactResult.score).toBe(1.0);

    // Accent-only error (e.g. Spanish 'hubieramos' without accent on 'e')
    const accentResult = PracticeEngine.evaluate({
      submittedAnswer: 'hubieramos',
      acceptableSolutions: ['hubiéramos', 'hubiésemos'],
      distractors: [],
      explanation: 'Pluscuamperfecto de subjuntivo con tilde.',
    });
    expect(accentResult.isCorrect).toBe(false);
    expect(accentResult.isAccentErrorOnly).toBe(true);
    expect(accentResult.feedback).toContain('Quase correto! Verifique os acentos ortográficos.');

    // Distractor match gives targeted pedagogical feedback
    const distractorResult = PracticeEngine.evaluate({
      submittedAnswer: 'cumprir',
      acceptableSolutions: ['cumprirmos'],
      distractors,
      explanation: 'Usa-se infinitivo pessoal flexionado.',
    });
    expect(distractorResult.isCorrect).toBe(false);
    expect(distractorResult.matchedDistractorFeedback).toBe('Falta a desinência pessoal -mos.');
    expect(distractorResult.feedback).toContain('Incorreto: Falta a desinência pessoal -mos.');
  });

  it('4. PracticeEngine records mistakes under the authenticated user without using hardcoded learner identity', async () => {
    StorageService.setCurrentUser('usr_lexilume_99');

    const validation = PracticeEngine.evaluate({
      submittedAnswer: 'cumprir',
      acceptableSolutions: ['cumprirmos'],
      distractors: [{ text: 'cumprir', why_incorrect: 'Falta desinência.' }],
      explanation: 'Infinitivo pessoal.',
    });

    await PracticeEngine.recordAttempt({
      exerciseId: 'ex_test_99',
      submittedAnswer: 'cumprir',
      validation,
      attemptCount: 1,
      language: 'pt',
      exerciseType: 'multiple_choice',
      prompt: 'Selecione a forma correta do infinitivo:',
      primarySolution: 'cumprirmos',
    });

    const mistakes = await getMistakes('pt');
    expect(mistakes.length).toBeGreaterThanOrEqual(1);
    const lastMistake = mistakes.find(m => m.prompt.includes('infinitivo'));
    expect(lastMistake).toBeDefined();
    expect(lastMistake?.user_id).toBe('usr_lexilume_99');
    expect(lastMistake?.user_id).not.toBe('learner');
  });

  it('5. Integrates Daily Poetry vocabulary and saves into personal phrasebook for flashcard review', async () => {
    StorageService.setCurrentUser('usr_test_poet');

    const testPoem: DailyPoem = {
      id: 'poem-test-100',
      title: 'Versos Íntimos',
      author: 'Augusto dos Anjos',
      learning_language: 'pt',
      cefr_level: 'C1',
      excerpt: 'Vês! Ninguém assistiu ao quase infindo espetáculo...',
      full_text: 'Vês! Ninguém assistiu...',
      cultural_context: 'Parnasianismo e simbolismo brasileiro.',
      country_name: 'Brasil',
      country_code: 'BR',
      published_at: '2026-11-01T00:00:00Z',
      is_active: true,
    };

    await dailyContentService.publishPoem(testPoem);

    // Save a word from the poem into phrasebook
    await savePhrasebookWord({
      user_id: 'usr_test_poet',
      source_text: 'infindo',
      translated_text: 'infinito / sem fim',
      source_lang: 'pt',
      target_lang: 'en',
      context_sentence: testPoem.excerpt,
      is_verified: true,
    });

    // Check vocabulary pool includes phrasebook word
    const partition = await practiceVocabService.getDeckPartition('pt');
    expect(partition.savedPhrasebook.some(w => w.source_text === 'infindo')).toBe(true);
    expect(partition.all.some(w => w.lemma === 'infindo')).toBe(true);
  });

  it('6. PracticePage switches between supported languages and excludes Hindi from track selectors', async () => {
    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>
    );

    // Check that Hindi is not in select options
    const select = screen.getByLabelText(/Selecionar trilha de idioma de prática/i) as HTMLSelectElement;
    const options = Array.from(select.options).map(o => o.value);

    expect(options).toContain('en');
    expect(options).toContain('pt');
    expect(options).toContain('es');
    expect(options).toContain('fr');
    expect(options).toContain('ja');
    expect(options).not.toContain('hi');

    // Switch to English using the quick toggle button
    const enButton = screen.getByRole('button', { name: /English \(EN\)/i });
    fireEvent.click(enButton);

    // English vocabulary is loaded
    await waitFor(() => {
      expect(screen.getAllByText(/EN/).length).toBeGreaterThan(0);
    });
  });
});
