import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationStudio } from '../../features/conversation/ConversationStudio';
import { DiscoverHub } from '../../features/discover/DiscoverHub';
import { SpeechService } from '../../services/speech';
import * as localDb from '../../services/localDb';
import { ReadingManager } from '../../services/providers/reading/readingManager';

describe('Step 8: Advanced Learning Features — Conversation & Discover Hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('8. Conversation Practice Studio', () => {
    it('renders structured roleplay, handles turn-taking, enforces bounded limits, and saves vocabulary', async () => {
      const speakSpy = vi.spyOn(SpeechService, 'speak').mockResolvedValue();
      const saveVocabSpy = vi.spyOn(localDb, 'savePhrasebookWord').mockResolvedValue('mock-vocab-id');

      render(<ConversationStudio language="pt" />);

      // Scenario header and CEFR badge
      expect(screen.getByText(/Conversation Studio & Roleplay/i)).toBeDefined();
      expect(screen.getByText(/Check-in e Reservas em Hotel Boutique/i)).toBeDefined();

      // Initial prompt token and translation
      expect(screen.getByText('Miradouro')).toBeDefined();
      expect(screen.getByText(/Good afternoon! Welcome to Hotel Miradouro de Lisboa/i)).toBeDefined();

      // Suggested candidate responses
      const candidateBtn = screen.getByRole('button', { name: /Sim, tenho uma reserva em meu nome por duas noites/i });
      expect(candidateBtn).toBeDefined();

      // Send turn via candidate button
      fireEvent.click(candidateBtn);

      // Verify turn counter incremented
      await waitFor(() => {
        expect(screen.getByText(/Turnos: 1 \/ 10/i)).toBeDefined();
      });

      // User's turn text appears in dialogue
      expect(screen.getAllByText(/reserva/i).length).toBeGreaterThan(0);

      // Save vocabulary word
      const saveWordBtns = screen.getAllByTitle(/Salvar no caderno/i);
      expect(saveWordBtns.length).toBeGreaterThan(0);
      fireEvent.click(saveWordBtns[0]);

      expect(saveVocabSpy).toHaveBeenCalled();
    });
  });

  describe('9. Discover Hub', () => {
    it('renders books, thematic vocabulary clusters, and supports CEFR filtering', async () => {
      vi.spyOn(ReadingManager.getInstance(), 'getPublicDomainBooks').mockResolvedValue([
        {
          id: '1',
          title: 'Os Lusíadas',
          authors: ['Luís de Camões'],
          languages: ['pt'],
          subjects: ['Literature', 'Epic Poetry'],
          isPublicDomain: true,
          provider: 'gutendex',
        },
      ]);

      render(<DiscoverHub initialLanguage="pt" />);

      // Hub title
      expect(screen.getByText(/Discover Hub — Exploração Multilingual/i)).toBeDefined();

      // Thematic vocabulary clusters
      await waitFor(() => {
        expect(screen.getByText(/Gastronomia e Doçaria Conventual Portuguesa/i)).toBeDefined();
        expect(screen.getByText(/Discurso Acadêmico & Ensaística Contemporânea/i)).toBeDefined();
      });

      // Filter by C1
      const c1FilterBtn = screen.getByRole('button', { name: 'C1' });
      fireEvent.click(c1FilterBtn);

      // C1 cluster should be present
      expect(screen.getByText(/Discurso Acadêmico & Ensaística Contemporânea/i)).toBeDefined();

      // Switch language to ES
      const esBtn = screen.getByRole('button', { name: 'ES' });
      fireEvent.click(esBtn);

      // Spanish themes displayed
      await waitFor(() => {
        expect(screen.getByText(/Retórica Jurídica y Filosofía Política Hispánica/i)).toBeDefined();
      });
    });
  });
});
