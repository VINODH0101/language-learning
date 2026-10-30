import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VocabularyExplorer } from '../../features/vocabulary/VocabularyExplorer';
import { FlashcardDeck } from '../../components/practice/FlashcardDeck';
import { VocabularyItem } from '../../types';
import { SRSService } from '../../services/srs';
import { StorageService } from '../../services/storage';
import { getPhrasebookWords } from '../../services/localDb';

describe('Step 8: Advanced Learning Features — Vocabulary Explorer & SM-2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('1. Vocabulary Explorer', () => {
    it('searches for words and displays definitions, translation, and frequency rank', async () => {
      render(
        <VocabularyExplorer targetLang="pt" explanationLang="en" />
      );

      // Input a search query
      const input = screen.getByPlaceholderText(/Pesquisar vocábulo em PT/i);
      fireEvent.change(input, { target: { value: 'saudade' } });

      const searchBtn = screen.getByRole('button', { name: /Pesquisar/i });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('saudade')).toBeDefined();
      }, { timeout: 4000 });

      // Frequency rank badge from FrequencyWordsProvider
      await waitFor(() => {
        expect(screen.getByText(/Rank #/i)).toBeDefined();
      }, { timeout: 4000 });

      // Part of speech / Definitions header
      expect(screen.getByText(/Definições Gramaticais & Sentidos/i)).toBeDefined();
    });

    it('allows creating a new collection and saving the word into it', async () => {
      render(
        <VocabularyExplorer targetLang="pt" explanationLang="en" />
      );

      const input = screen.getByPlaceholderText(/Pesquisar vocábulo em PT/i);
      fireEvent.change(input, { target: { value: 'perspicácia' } });
      fireEvent.click(screen.getByRole('button', { name: /Pesquisar/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'perspicácia' })).toBeDefined();
      }, { timeout: 4000 });

      // Click "Salvar no Vocabulário"
      const saveBtn = screen.getByRole('button', { name: /Salvar no Vocabulário/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Salvo')).toBeDefined();
      });

      const saved = await getPhrasebookWords('en');
      const item = saved.find(w => w.source_text.toLowerCase() === 'perspicácia');
      expect(item).toBeDefined();
    });
  });

  describe('2. Spaced Repetition (SM-2 Scheduling)', () => {
    const mockVocab: VocabularyItem[] = [
      {
        id: 'v1',
        language: 'pt',
        lemma: 'inefável',
        part_of_speech: 'adjetivo',
        cefr_level: 'C1',
        definition_target: 'Que não se pode exprimir por palavras.',
        definition_en: 'Inexpressible; beyond words.',
        example_sentence_target: 'Uma beleza inefável que comoveu a todos.',
        example_sentence_en: 'An inexpressible beauty that moved everyone.',
        regional_tags: ['all'],
        collocations: [],
        attribution: {
          source_name: 'Lexilume',
          source_url: 'https://lexi.monster',
          license_type: 'Open Access',
          attribution_text: 'Lexilume Educational Corpus',
        },
      },
    ];

    it('renders card with daily target progress and flip behavior', () => {
      render(
        <FlashcardDeck vocabularyList={mockVocab} dailyTarget={10} />
      );

      expect(screen.getByText(/Meta Diária de Revisão SM-2/i)).toBeDefined();
      expect(screen.getByText('inefável')).toBeDefined();

      // Click card to flip
      const card = screen.getByRole('button', { name: /Cartão de recordação espaçada/i });
      fireEvent.click(card);

      // Now back content is revealed
      expect(screen.getByText(/Que não se pode exprimir por palavras/i)).toBeDefined();

      // SM-2 rating buttons with interval predictions exist
      expect(screen.getByRole('button', { name: /De Novo \(1\)/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Difícil \(3\)/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Bom \(4\)/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Fácil \(5\)/i })).toBeDefined();
    });

    it('applies SM-2 rating and updates state and daily progress', () => {
      render(
        <FlashcardDeck vocabularyList={mockVocab} dailyTarget={10} />
      );

      const card = screen.getByRole('button', { name: /Cartão de recordação espaçada/i });
      fireEvent.click(card);

      const goodBtn = screen.getByRole('button', { name: /Bom \(4\)/i });
      fireEvent.click(goodBtn);

      const srsItems = StorageService.getSRSItems('pt');
      const itemState = srsItems.find(s => s.vocabulary_item_id === 'v1');
      expect(itemState).toBeDefined();
      expect(itemState?.repetition_count).toBe(1);
      expect(itemState?.interval_days).toBeGreaterThanOrEqual(1);
    });
  });
});
