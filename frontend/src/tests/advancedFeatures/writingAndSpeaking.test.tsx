import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WritingCoach } from '../../features/writing/WritingCoach';
import { SpeakingCoach, SpeakingChallenge } from '../../features/speaking/SpeakingCoach';
import { SpeechService } from '../../services/speech';
import { ProofreadingService } from '../../services/proofreadingService';
import { contentAccess } from '../../services/contentAccess';
import { dailyContentService } from '../../services/dailyContentService';

const MOCK_SPEAKING_CHALLENGE: SpeakingChallenge = {
  id: 'speak-pt-env-c1',
  prompt: 'Discuta a importância da preservação ambiental nas cidades contemporâneas.',
  targetResponse: 'A preservação ambiental nas cidades garante a qualidade do ar',
  targetIpa: '/ɐ pɾɨzɨɾvɐˈsɐ̃w̃ ɐ̃bjẽˈtaw nɐs siˈdadɨʃ/',
  keyVocabulary: ['preservação', 'ambiental', 'qualidade'],
  grammarNotes: 'Concordância nominal e uso de preposição contrata (em + as = nas).',
};

describe('Step 8: Advanced Learning Features — Writing Coach & Speaking Coach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(contentAccess, 'getPublishedVocabularyEntries').mockResolvedValue([]);
    vi.spyOn(contentAccess, 'getPublishedConversations').mockResolvedValue([]);
    vi.spyOn(dailyContentService, 'getActivePoetry').mockResolvedValue(null);
  });

  describe('3. Writing Coach', () => {
    it('analyzes text, distinguishes errors, and never overwrites user text automatically', async () => {
      vi.spyOn(ProofreadingService, 'checkText').mockResolvedValue({
        text: 'Nós foi ao mercado e comprou duas maçãs.',
        language: 'pt',
        provider: 'languagetool',
        hasErrors: true,
        matches: [
          {
            id: 'mock-match-1',
            message: 'Erro de concordância verbal com o pronome "Nós". Recomenda-se "fomos".',
            shortMessage: 'Concordância Verbal',
            offset: 4,
            length: 3,
            replacements: ['fomos'],
            ruleId: 'VERB_AGREEMENT',
            category: 'Grammar',
            issueType: 'grammar',
          },
        ],
      });

      render(
        <WritingCoach language="pt" initialText="Nós foi ao mercado e comprou duas maçãs." />
      );

      // Verify original text area has the initial text
      const textarea = screen.getByPlaceholderText(/Escreva ou cole seu texto em PT aqui/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Nós foi ao mercado e comprou duas maçãs.');

      // Click analyze
      const analyzeBtn = screen.getByRole('button', { name: /Analisar com Writing Coach/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(screen.getByText(/Desvios Detectados/i)).toBeDefined();
      });

      // The original text in textarea is STILL intact (never automatically overwritten)
      expect(textarea.value).toBe('Nós foi ao mercado e comprou duas maçãs.');

      // Previews corrected text
      expect(screen.getByText(/Pré-visualização do Texto Corrigido/i)).toBeDefined();

      // Check if suggestion button exists and can be applied manually
      const suggestionBtns = screen.getAllByRole('button', { name: /fomos/i });
      expect(suggestionBtns.length).toBeGreaterThan(0);
      fireEvent.click(suggestionBtns[0]);
    });
  });

  describe('4. Speaking Practice', () => {
    it('renders honest empty state when no live speaking prompts are loaded', async () => {
      render(<SpeakingCoach language="pt" />);
      await waitFor(() => {
        expect(screen.getByText(/No speaking prompts loaded yet for PT/i)).toBeDefined();
      });
    });

    it('renders speaking challenge and clearly distinguishes transcription accuracy from pronunciation assessment', async () => {
      vi.spyOn(SpeechService, 'isRecognitionSupported').mockReturnValue(true);
      vi.spyOn(SpeechService, 'startRecognition').mockImplementation((lang, variety, onResult) => {
        onResult('A preservação ambiental nas cidades garante a qualidade do ar');
        return { stop: vi.fn() };
      });

      render(
        <SpeakingCoach language="pt" challenges={[MOCK_SPEAKING_CHALLENGE]} />
      );

      // Challenge prompt and target response
      expect(screen.getByText(/Tema de Produção Oral/i)).toBeDefined();
      expect(screen.getByText(/Resposta-Modelo C1 Sugerida/i)).toBeDefined();

      // Start recording
      const recordBtn = screen.getByRole('button', { name: /Iniciar Gravação de Voz/i });
      fireEvent.click(recordBtn);

      // Stop recording to evaluate
      const stopBtn = screen.getByRole('button', { name: /Parar Gravação/i });
      fireEvent.click(stopBtn);

      // Distinct evaluation panels
      await waitFor(() => {
        expect(screen.getByText(/1\. Precisão da Transcrição Textual/i)).toBeDefined();
        expect(screen.getByText(/2\. Avaliação Fonética & Articulação/i)).toBeDefined();
      });

      // Methodological disclaimer visible
      expect(screen.getByText(/Aviso Metodológico/i)).toBeDefined();
    });
  });
});
