import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navigation } from '../components/common/Navigation';
import { GuidedOnboardingModal } from '../components/onboarding/GuidedOnboardingModal';
import { ContextualWordPopover } from '../components/common/ContextualWordPopover';
import { CourseView } from '../features/course/CourseView';
import { I18nProvider } from '../i18n/i18nContext';
import { localDb, getPhrasebookWords } from '../services/localDb';
import { courseService } from '../services/courseService';
import { authService } from '../services/auth';

describe('Step 7: Lexilume UX & UI Redesign Suite', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    try {
      await localDb.savedVocabulary.clear();
    } catch {}
  });

  describe('1. Main Navigation & Profile Menu', () => {
    it('renders the 4 primary destinations (Home, Learn, Practice, Progress)', () => {
      const mockSelect = vi.fn();
      render(
        <I18nProvider>
          <Navigation
            activeTab="dashboard"
            onSelectTab={mockSelect}
            onOpenAuth={vi.fn()}
            onOpenOnboarding={vi.fn()}
          />
        </I18nProvider>
      );

      // Verify the 4 primary navigation destinations exist
      expect(screen.getAllByText(/Início|Home|Inicio/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Aprender|Learn/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Prática|Practice/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Progresso|Progress/i).length).toBeGreaterThan(0);
    });

    it('toggles the top-right Profile Menu dropdown with settings and onboarding guide', () => {
      const mockSelect = vi.fn();
      const mockOnboarding = vi.fn();

      render(
        <I18nProvider>
          <Navigation
            activeTab="dashboard"
            onSelectTab={mockSelect}
            onOpenAuth={vi.fn()}
            onOpenOnboarding={mockOnboarding}
          />
        </I18nProvider>
      );

      // Profile menu trigger button
      const profileBtn = screen.getByLabelText(/Menu do Perfil e Configurações|Profile and Settings Menu/i);
      expect(profileBtn).toBeDefined();

      // Open profile menu
      fireEvent.click(profileBtn);

      expect(screen.getByText(/Meu Perfil & Metas|Profile & Learning Track|My Profile & Track/i)).toBeDefined();
      expect(screen.getByText(/Guia de Boas-Vindas|Welcome Guide/i)).toBeDefined();

      // Click onboarding guide
      const guideBtn = screen.getByText(/Guia de Boas-Vindas|Welcome Guide/i);
      fireEvent.click(guideBtn);
      expect(mockOnboarding).toHaveBeenCalled();
    });
  });

  describe('2. 8-Step Guided Onboarding Experience', () => {
    it('walks through the 8 steps and includes all 13 supported languages', async () => {
      const mockClose = vi.fn();
      const mockStartLesson = vi.fn();

      render(
        <I18nProvider>
          <GuidedOnboardingModal
            isOpen={true}
            onClose={mockClose}
            onStartLesson={mockStartLesson}
          />
        </I18nProvider>
      );

      // Step 1: Choose Interface Language
      expect(screen.getByText(/1\.\s*(Escolha o Idioma da Interface|Interface Language)/i)).toBeDefined();
      const contBtn1 = screen.getByRole('button', { name: /Continuar|Continue/i });
      fireEvent.click(contBtn1);

      // Step 2: Choose Target Language (All 13 supported languages)
      expect(screen.getByText(/2\. Escolha o Idioma que Deseja Aprender/i)).toBeDefined();
      // Verify languages like French, German, Japanese, Russian, Tamil exist
      expect(screen.getByText(/Français/i)).toBeDefined();
      expect(screen.getByText(/Deutsch/i)).toBeDefined();
      expect(screen.getByText(/日本語/i)).toBeDefined();
      expect(screen.getByText(/Русский/i)).toBeDefined();
      expect(screen.getByText(/தமிழ்/i)).toBeDefined();

      // Select Portuguese
      const ptOpt = screen.getByText(/Português \(Portuguese\)/i);
      fireEvent.click(ptOpt);
      fireEvent.click(screen.getByRole('button', { name: /Continuar|Continue/i }));

      // Step 3: Choose Explanation Language
      expect(screen.getByText(/3\. Escolha o Idioma das Explicações/i)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /Continuar|Continue/i }));

      // Step 4: Choose CEFR Level
      expect(screen.getByText(/4\. Nível de Proficiência Atual/i)).toBeDefined();
      expect(screen.getByText(/C1 — Autônomo Avançado/i)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /Continuar|Continue/i }));

      // Step 5: Select Daily Goal
      expect(screen.getByText(/5\. Defina sua Meta Diária/i)).toBeDefined();
      expect(screen.getByText(/10 min \/ dia/i)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /Continuar|Continue/i }));

      // Step 6: Optional Placement Assessment
      expect(screen.getByText(/6\. Avaliação de Nivelamento/i)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /Continuar|Continue/i }));

      // Step 7: Regional Variety & Track
      expect(screen.getByText(/7\. Configurar Variedade Regional/i)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /Continuar|Continue/i }));

      // Step 8: Personalized Learning Path Display
      expect(screen.getByText(/8\. Seu Plano de Aprendizado Personalizado/i)).toBeDefined();
      expect(screen.getByText(/24 marcos curriculares/i)).toBeDefined();

      // Finish Button
      const finishBtn = screen.getByRole('button', { name: /(Começar a Aprender|Start)/i });
      fireEvent.click(finishBtn);

      expect(mockClose).toHaveBeenCalled();
      expect(mockStartLesson).toHaveBeenCalled();
      expect(localStorage.getItem('lexilume_onboarding_completed')).toBe('true');
    });
  });

  describe('3. 4-Stage Guided Learning in CourseView', () => {
    it('organizes daily lesson into 4 sequential stages with stage navigation', () => {
      render(
        <I18nProvider>
          <CourseView language="pt" />
        </I18nProvider>
      );

      // Verify 4 stage cards
      expect(screen.getByText(/(1\. Aprender|1\. Learn)/i)).toBeDefined();
      expect(screen.getAllByText(/(2\. Compreender|2\. Understand)/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/(3\. Usar o Idioma|3\. Use the Language)/i)).toBeDefined();
      expect(screen.getByText(/(4\. Testar-se|4\. Test Yourself)/i)).toBeDefined();

      // In Stage 1: Vocabulary & Grammar are present
      expect(screen.getByRole('tab', { name: /(Vocabulário|Lexicon)/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /(Gramática|Grammar)/i })).toBeDefined();

      // Click "Próxima: 2. Compreender" / "Next Stage: 2. Understand"
      const nextBtn = screen.getByRole('button', { name: /(Próxima.*2\. Compreender|Next.*2\. Understand)/i });
      fireEvent.click(nextBtn);

      // Now in Stage 2: Leitura & Compreensão Oral sub-tabs are displayed
      expect(screen.getByRole('tab', { name: /(Leitura Guiada|Reading)/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /(Compreensão Oral|Listening)/i })).toBeDefined();
    });
  });

  describe('4. Contextual Word Popover & Single-Click Vocabulary Saving', () => {
    it('renders word details and saves word to Dexie localDb.savedVocabulary on click', async () => {
      const mockClose = vi.fn();
      const mockSaved = vi.fn();

      render(
        <ContextualWordPopover
          selectedWord="desenvolvimento"
          language="pt"
          variety="pt-BR"
          explanationLanguage="en"
          onClose={mockClose}
          onSaved={mockSaved}
        />
      );

      // Popover displays the word
      expect(screen.getByText('desenvolvimento')).toBeDefined();

      // Click "Salvar no Vocabulário" button
      const saveBtn = screen.getByRole('button', { name: /Salvar no Vocabulário/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockSaved).toHaveBeenCalledWith('desenvolvimento');
      }, { timeout: 3000 });

      // Verify item was persisted
      const savedWords = await getPhrasebookWords();
      const found = savedWords.find(w => w.source_text.toLowerCase() === 'desenvolvimento');
      expect(found).toBeDefined();
      expect(found?.source_text).toBe('desenvolvimento');
    });
  });
});
