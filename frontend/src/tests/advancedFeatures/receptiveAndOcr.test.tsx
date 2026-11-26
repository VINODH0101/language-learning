import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ListeningStudio, ListeningPassage } from '../../features/listening/ListeningStudio';
import { ReadingStudio, ReadingItem } from '../../features/reading/ReadingStudio';
import { ScanAndLearn } from '../../features/ocr/ScanAndLearn';
import { SpeechService } from '../../services/speech';
import { OcrService } from '../../services/ocrService';
import * as localDb from '../../services/localDb';

const MOCK_LISTENING_PASSAGE: ListeningPassage = {
  id: 'listen-pt-santa-apolonia',
  title: 'Aviso na Estação de Santa Apolónia',
  category: 'Transportes & Viagens',
  cefrLevel: 'B1',
  sentences: [
    {
      id: 's1',
      targetText: 'Atenção, senhores passageiros com destino ao Porto.',
      explanationText: 'Attention passengers heading to Porto.',
    },
    {
      id: 's2',
      targetText: 'O comboio Alfa Pendular partirá da Linha 4 dentro de cinco minutos.',
      explanationText: 'The Alfa Pendular train will depart from Platform 4 within five minutes.',
    },
  ],
  questions: [
    {
      id: 'q1',
      question: 'Para qual cidade se dirige o comboio mencionado no aviso?',
      options: ['Lisboa', 'Porto', 'Coimbra'],
      correctIndex: 1,
      explanation: 'O anúncio menciona explicitamente o destino ao Porto.',
    },
    {
      id: 'q2',
      question: 'De qual plataforma (linha) partirá o comboio?',
      options: ['Linha 1', 'Linha 2', 'Linha 4'],
      correctIndex: 2,
      explanation: 'O texto indica a Linha 4.',
    },
  ],
};

const MOCK_READING_ITEMS: ReadingItem[] = [
  {
    id: 'pt-read-c1-1',
    title: 'A Influência do Barroco na Arquitetura do Norte de Portugal',
    cefrLevel: 'C1',
    source: 'curated',
    authorOrAttribution: 'Lexilume Content Engine',
    summary: 'Estudo arquitetônico sobre o barroco em Braga e no Porto.',
    content: 'O estilo barroco deixou marcas profundas nas fachadas de granito e na talha dourada das igrejas nortenhas.',
    comprehensionQuestions: [],
  },
  {
    id: 'pt-read-b1-1',
    title: 'O Fado e a Tradição dos Bairros Típicos de Lisboa',
    cefrLevel: 'B1',
    source: 'wikipedia',
    authorOrAttribution: 'Wikipedia — CC BY-SA 4.0',
    summary: 'Panorama histórico do Fado em Alfama e na Mouraria.',
    content: 'O Fado é uma expressão musical urbana associada aos bairros tradicionais de Lisboa.',
    comprehensionQuestions: [],
  },
];

describe('Step 8: Advanced Learning Features — Receptive & Multi-Modal Skills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('5. Listening Practice Studio', () => {
    it('renders synchronized transcript, playback speed controls, and evaluates comprehension', async () => {
      const speakSpy = vi.spyOn(SpeechService, 'speak').mockResolvedValue();

      render(<ListeningStudio language="pt" passages={[MOCK_LISTENING_PASSAGE]} />);

      // Title & CEFR level
      expect(screen.getByText('Listening Practice Studio')).toBeDefined();
      expect(screen.getByText('Aviso na Estação de Santa Apolónia')).toBeDefined();

      // Playback speed selector
      const speed075Btn = screen.getByRole('button', { name: '0.75x' });
      const speed125Btn = screen.getByRole('button', { name: '1.25x' });
      expect(speed075Btn).toBeDefined();
      expect(speed125Btn).toBeDefined();

      fireEvent.click(speed075Btn);

      // Play audio full
      const playBtn = screen.getByRole('button', { name: /Reproduzir Áudio Completo/i });
      fireEvent.click(playBtn);
      expect(speakSpy).toHaveBeenCalled();

      // Toggle translation
      const toggleTransBtn = screen.getByRole('button', { name: /Mostrar Tradução/i });
      fireEvent.click(toggleTransBtn);
      expect(screen.getByText(/Attention passengers heading to Porto/i)).toBeDefined();

      // Answer comprehension question
      const optionB = screen.getByRole('button', { name: /B\.\s*Porto/i });
      fireEvent.click(optionB);

      const optionC = screen.getByRole('button', { name: /C\.\s*Linha 4/i });
      fireEvent.click(optionC);

      const checkAnswersBtn = screen.getByRole('button', { name: /Verificar Respostas/i });
      fireEvent.click(checkAnswersBtn);

      await waitFor(() => {
        expect(screen.getByText(/Acertos: 2 \/ 2/i)).toBeDefined();
      });
    });
  });

  describe('6. Reading Studio', () => {
    it('renders CEFR-filtered reading, tracks reading history, and validates comprehension', async () => {
      const logSessionSpy = vi.spyOn(localDb, 'logReadingSession').mockResolvedValue({
        id: 'mock-session-1',
        user_id: 'guest',
        article_id: 'pt-read-c1-1',
        title: 'A Influência do Barroco na Arquitetura do Norte de Portugal',
        language: 'pt',
        cefr_level: 'C1',
        source: 'curated',
        completed_at: new Date().toISOString(),
      });

      render(<ReadingStudio language="pt" items={MOCK_READING_ITEMS} />);

      // Title & CEFR level
      expect(screen.getByText(/Reading Studio & Text Comprehension/i)).toBeDefined();
      expect(screen.getByRole('heading', { level: 1, name: /A Influência do Barroco na Arquitetura do Norte de Portugal/i })).toBeDefined();

      // Filter by CEFR
      const b1Filter = screen.getByRole('button', { name: 'B1' });
      fireEvent.click(b1Filter);

      // B1 title appears in list
      expect(screen.getByText(/O Fado e a Tradição dos Bairros Típicos de Lisboa/i)).toBeDefined();

      // Switch back to C1
      const c1Filter = screen.getByRole('button', { name: 'C1' });
      fireEvent.click(c1Filter);

      // Mark as completed
      const completeBtn = screen.getByRole('button', { name: /Marcar Leitura Concluída/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(logSessionSpy).toHaveBeenCalled();
        expect(screen.getByText(/✓ Concluído/i)).toBeDefined();
      });
    });
  });

  describe('7. Scan and Learn (OCR)', () => {
    it('detects scripts and extracts editable text with confidence scoring from uploaded image', async () => {
      // Test script detection
      const latinRes = OcrService.detectScript('A rápida raposa castanha salta sobre o cão preguiçoso.');
      expect(latinRes.script).toBe('Latin Script');

      const cyrillicRes = OcrService.detectScript('Санкт-Петербург — прекрасный исторический город.');
      expect(cyrillicRes.script).toContain('Cyrillic');

      const tamilRes = OcrService.detectScript('தமிழ் மொழி மிகவும் தொன்மையானது.');
      expect(tamilRes.script).toContain('Tamil');

      class MockFileReader {
        public onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
        public readAsDataURL() {
          if (this.onload) {
            this.onload({
              target: { result: 'data:image/png;base64,iVBORw0KGgo=' } as FileReader,
            } as ProgressEvent<FileReader>);
          }
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);

      vi.spyOn(OcrService, 'recognizeImage').mockResolvedValue({
        text: 'Pastéis de bacalhau artesanais com azeite.',
        confidence: 94,
        detectedScript: 'Latin Script',
        detectedLanguage: 'pt',
        isLowConfidence: false,
        words: [
          { text: 'Pastéis', confidence: 95 },
          { text: 'bacalhau', confidence: 96 },
        ],
      });

      const { container } = render(<ScanAndLearn language="pt" />);

      expect(screen.getByText(/Scan & Learn — OCR Poliglota/i)).toBeDefined();

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['dummy-image'], 'menu.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const runOcrBtn = await screen.findByRole('button', { name: /Extrair Texto com OCR/i });
      fireEvent.click(runOcrBtn);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/O texto extraído aparecerá aqui.../i) as HTMLTextAreaElement;
        expect(textarea.value).toContain('Pastéis de bacalhau artesanais');
      });

      // Diagnostic info shown
      expect(screen.getByText(/Escrita Detectada/i)).toBeDefined();
      expect(screen.getByText(/Confiança do Motor/i)).toBeDefined();
      expect(screen.getByText('94%')).toBeDefined();

      // Interactive words rendered
      expect(screen.getAllByText(/bacalhau/i).length).toBeGreaterThan(0);

      vi.unstubAllGlobals();
    });
  });
});
