import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationStudio, ScenarioPreset } from '../../features/conversation/ConversationStudio';
import { DiscoverHub, ThematicCluster, DiscoveryScenarioSummary } from '../../features/discover/DiscoverHub';
import { SpeechService } from '../../services/speech';
import * as localDb from '../../services/localDb';
import { ReadingManager } from '../../services/providers/reading/readingManager';

const MOCK_SCENARIO: ScenarioPreset = {
  id: 'pt-hotel-b1',
  title: 'Check-in e Reservas em Hotel Boutique',
  category: 'Viagens & Hospitalidade',
  cefrLevel: 'B1',
  initialPrompt: 'Boa tarde! Bem-vindo ao Hotel Miradouro de Lisboa. Em que posso ajudá-lo hoje?',
  initialPromptTranslation: 'Good afternoon! Welcome to Hotel Miradouro de Lisboa. How can I help you today?',
  candidateResponses: [
    'Sim, tenho uma reserva em meu nome por duas noites.',
    'Gostaria de saber o horário do café da manhã, por favor.',
  ],
  usefulVocab: [
    { word: 'Miradouro', meaning: 'Scenic viewpoint / overlook' },
    { word: 'Reserva', meaning: 'Reservation / booking' },
  ],
};

const MOCK_THEMES: ThematicCluster[] = [
  {
    id: 'theme-pt-gastro',
    title: 'Gastronomia e Doçaria Conventual Portuguesa',
    description: 'Vocabulário culinário tradicional e expressões regionais.',
    cefrLevel: 'B1',
    language: 'pt',
    terms: ['pastel de nata', 'bacalhau', 'azeite'],
  },
  {
    id: 'theme-pt-acad',
    title: 'Discurso Acadêmico & Ensaística Contemporânea',
    description: 'Conectores formais e léxico argumentativo C1.',
    cefrLevel: 'C1',
    language: 'pt',
    terms: ['não obstante', 'hermenêutica', 'prerrogativa'],
  },
  {
    id: 'theme-es-retorica',
    title: 'Retórica Jurídica y Filosofía Política Hispánica',
    description: 'Léxico de argumentación avanzada en español.',
    cefrLevel: 'C1',
    language: 'es',
    terms: ['jurisprudencia', 'idiosincrasia', 'consenso'],
  },
];

const MOCK_DISCOVER_SCENARIOS: DiscoveryScenarioSummary[] = [
  {
    id: 'disc-scen-pt-1',
    title: 'Debate Cultural em Coimbra',
    description: 'Prática de argumentação sobre patrimônio universitário.',
    cefrLevel: 'C1',
    language: 'pt',
  },
  {
    id: 'disc-scen-es-1',
    title: 'Coloquio Académico en Salamanca',
    description: 'Práctica de debate formal en español.',
    cefrLevel: 'C1',
    language: 'es',
  },
];

describe('Step 8: Advanced Learning Features — Conversation & Discover Hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('8. Conversation Practice Studio', () => {
    it('renders structured roleplay, handles turn-taking, enforces bounded limits, and saves vocabulary', async () => {
      vi.spyOn(SpeechService, 'speak').mockResolvedValue();
      const saveVocabSpy = vi.spyOn(localDb, 'savePhrasebookWord').mockResolvedValue('mock-vocab-id');

      render(<ConversationStudio language="pt" scenarios={[MOCK_SCENARIO]} />);

      // Scenario header and CEFR badge
      expect(screen.getByText(/Conversation Studio & Roleplay/i)).toBeDefined();
      expect(screen.getByText(/Check-in e Reservas em Hotel Boutique/i)).toBeDefined();

      // Initial prompt token and translation
      expect(screen.getAllByText('Miradouro').length).toBeGreaterThan(0);
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

      render(<DiscoverHub initialLanguage="pt" themes={MOCK_THEMES} scenarios={MOCK_DISCOVER_SCENARIOS} />);

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
