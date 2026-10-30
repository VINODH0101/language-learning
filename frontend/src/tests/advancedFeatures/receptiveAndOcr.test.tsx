import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ListeningStudio } from '../../features/listening/ListeningStudio';
import { ReadingStudio } from '../../features/reading/ReadingStudio';
import { ScanAndLearn } from '../../features/ocr/ScanAndLearn';
import { SpeechService } from '../../services/speech';
import { OcrService } from '../../services/ocrService';
import * as localDb from '../../services/localDb';

describe('Step 8: Advanced Learning Features — Receptive & Multi-Modal Skills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('5. Listening Practice Studio', () => {
    it('renders synchronized transcript, playback speed controls, and evaluates comprehension', async () => {
      const speakSpy = vi.spyOn(SpeechService, 'speak').mockResolvedValue();

      render(<ListeningStudio language="pt" />);

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

      render(<ReadingStudio language="pt" />);

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
    it('detects scripts and extracts editable text with confidence scoring', async () => {
      // Test script detection
      const latinRes = OcrService.detectScript('A rápida raposa castanha salta sobre o cão preguiçoso.');
      expect(latinRes.script).toBe('Latin Script');

      const cyrillicRes = OcrService.detectScript('Санкт-Петербург — прекрасный исторический город.');
      expect(cyrillicRes.script).toContain('Cyrillic');

      const tamilRes = OcrService.detectScript('தமிழ் மொழி மிகவும் தொன்மையானது.');
      expect(tamilRes.script).toContain('Tamil');

      render(<ScanAndLearn language="pt" />);

      expect(screen.getByText(/Scan & Learn — OCR Poliglota/i)).toBeDefined();

      // Click sample menu button
      const sampleBtn = screen.getByRole('button', { name: /Cardápio \/ Menu \(PT\)/i });
      fireEvent.click(sampleBtn);

      // Extracted text should populate textarea
      const textarea = screen.getByPlaceholderText(/O texto extraído aparecerá aqui.../i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Pastéis de bacalhau artesanais');

      // Diagnostic info shown
      expect(screen.getByText(/Escrita Detectada/i)).toBeDefined();
      expect(screen.getByText(/Confiança do Motor/i)).toBeDefined();
      expect(screen.getByText('94%')).toBeDefined();

      // Interactive words rendered
      expect(screen.getAllByText(/bacalhau/i).length).toBeGreaterThan(0);
    });
  });
});
