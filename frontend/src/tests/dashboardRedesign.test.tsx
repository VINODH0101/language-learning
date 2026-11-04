import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardView } from '../features/dashboard/DashboardView';
import { I18nProvider } from '../i18n/i18nContext';
import { courseService } from '../services/courseService';
import { StorageService } from '../services/storage';
import { dailyContentService } from '../services/dailyContentService';
import { ptCurriculum, esCurriculum, enCurriculum } from '../data/seedData';

describe('Lexilume Dashboard Redesign & Information Architecture Suite', () => {
  const mockNavigateTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderDashboard = (initialLang: 'en' | 'pt' | 'es' = 'en') => {
    localStorage.setItem('polyglot_interface_lang', initialLang);
    return render(
      <I18nProvider>
        <DashboardView onNavigateTab={mockNavigateTab} />
      </I18nProvider>
    );
  };

  it('1. Calculates dynamic curriculum progression based on actual curriculum nodes (not hardcoded 24)', () => {
    expect(courseService.getCurriculumTotalNodes('pt')).toBe(ptCurriculum.length);
    expect(courseService.getCurriculumTotalNodes('es')).toBe(esCurriculum.length);
    expect(courseService.getCurriculumTotalNodes('en')).toBe(enCurriculum.length);

    renderDashboard('en');

    // Should display curriculum units count in the hero card
    expect(screen.getByText(new RegExp(`${ptCurriculum.length} curriculum units completed`, 'i'))).toBeDefined();
    expect(screen.queryByText(/of 24 curriculum/i)).toBeNull();
  });

  it('2. Reflects genuine tracked cognitive minutes (0 min when unstarted; eliminates fake duration)', () => {
    // StorageService returns 0 when no study activity has occurred today
    const studyMinutes = StorageService.getTodayStudyMinutes('test_user');
    expect(studyMinutes).toBe(0);

    renderDashboard('en');

    // Goal progress should display 0 of 10 min (0%) rather than fabricated 2 or 6 min
    expect(screen.getByText(/0 of 10 min \(0%\)/i)).toBeDefined();
  });

  it('3. Renders Daily Masterpiece Learning (Poetry & Immersive Conversation)', () => {
    renderDashboard('en');

    // Section header
    expect(screen.getByText(/Daily Immersion: Poetry & Dialogue/i)).toBeDefined();
    // Daily Poetry card
    expect(screen.getByText(/Daily Poetry/i)).toBeDefined();
    expect(screen.getByText(/Read Poetry/i)).toBeDefined();
    // Daily Conversation card
    expect(screen.getByText(/Daily Dialogue/i)).toBeDefined();
    expect(screen.getByText(/Practice Dialogue/i)).toBeDefined();
  });

  it('4. Opens Daily Poetry Reader modal on click and renders full verses and audio button', () => {
    renderDashboard('en');

    const readPoemBtn = screen.getByText(/Read Poetry/i);
    fireEvent.click(readPoemBtn);

    // Modal should be open
    expect(screen.getByText(/Daily Masterpiece Poetry/i)).toBeDefined();
    expect(screen.getByText(/Listen to Verses/i)).toBeDefined();

    // Close button in modal
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);

    expect(screen.queryByText(/Daily Masterpiece Poetry/i)).toBeNull();
  });

  it('5. Opens Daily Conversation modal on click and renders interactive dialogue lines', () => {
    renderDashboard('en');

    const practiceDialogueBtn = screen.getByText(/Practice Dialogue/i);
    fireEvent.click(practiceDialogueBtn);

    // Modal should be open
    expect(screen.getByText(/Daily Immersive Dialogue/i)).toBeDefined();
    expect(screen.getByText(/Play Full Dialogue/i)).toBeDefined();

    // Close button in modal
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);

    expect(screen.queryByText(/Daily Immersive Dialogue/i)).toBeNull();
  });

  it('6. Enforces replacement semantics in DailyContentService (new activates, old archives)', async () => {
    const initial = await dailyContentService.getAllContent();

    // Publish new poem
    const newPoem = await dailyContentService.publishPoem({
      title: 'Mensagem',
      author: 'Fernando Pessoa',
      learning_language: 'pt',
      cefr_level: 'B2',
      excerpt: 'O mito é o nada que é tudo.',
      full_text: 'O mito é o nada que é tudo.\nO mesmo sol que abre os céus\nÉ um mito brilhante e mudo.',
      cultural_context: 'Epopeia lírica sobre a identidade e destino lusitano.',
      country_name: 'Portugal',
      country_code: 'PT',
    });

    expect(newPoem.is_active).toBe(true);

    const updated = await dailyContentService.getAllContent();
    const activePt = updated.activePoetry.filter(p => p.learning_language === 'pt');
    // Only 1 should be active per language
    expect(activePt.length).toBe(1);
    expect(activePt[0].id).toBe(newPoem.id);

    // Previous active poem was safely archived (not deleted)
    const archivedPt = updated.archivedPoetry.filter(p => p.learning_language === 'pt');
    expect(archivedPt.length).toBeGreaterThanOrEqual(1);
  });

  it('7. Displays Section 4 Vocabulary Summary with genuine review schedule and links to My Words', async () => {
    renderDashboard('en');

    expect(screen.getByText(/Vocabulary Summary/i)).toBeDefined();
    expect(screen.getByText(/Due for Review Today/i)).toBeDefined();
    expect(screen.getByText(/Saved in Past 7 Days/i)).toBeDefined();

    const myWordsBtn = screen.getByText(/My Words/i);
    fireEvent.click(myWordsBtn);
    expect(mockNavigateTab).toHaveBeenCalledWith('words');
  });

  it('8. Displays Section 6 Recently Learned and provides link to full progress history', async () => {
    renderDashboard('en');

    expect(screen.getByText(/Recently Learned/i)).toBeDefined();
    const historyBtn = screen.getByText(/View Learning History/i);
    fireEvent.click(historyBtn);
    expect(mockNavigateTab).toHaveBeenCalledWith('progress');
  });

  it('9. Enforces Four-Way Linguistic Decoupling in masthead', () => {
    renderDashboard('en');

    // Should indicate target language and explanation language separately
    expect(screen.getAllByText(/Learning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Portuguese/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Explanations in/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/English/i).length).toBeGreaterThan(0);
  });
});
