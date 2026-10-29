import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardPage } from '../pages/DashboardPage';
import { I18nProvider } from '../i18n/i18nContext';
import { courseService } from '../services/courseService';

describe('DashboardPage — Dynamic Content Language & Decoupling', () => {
  const mockNavigateTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderDashboard = (initialLang: 'en' | 'pt' | 'es' = 'en') => {
    localStorage.setItem('polyglot_interface_lang', initialLang);
    return render(
      <I18nProvider>
        <DashboardPage onNavigateTab={mockNavigateTab} />
      </I18nProvider>
    );
  };

  it('renders content in English when interface language is English, not Portuguese by default', () => {
    renderDashboard('en');

    // UI Headings & Badges should be in English
    expect(screen.getByText(/Lexilume Daily Immersion/i)).toBeDefined();
    expect(screen.getByText(/Daily Goal Progress/i)).toBeDefined();
    expect(screen.getByText(/Next Lesson of the Day/i)).toBeDefined();
    expect(screen.getByText(/Courses Overview/i)).toBeDefined();
    expect(screen.getByText(/Daily Learning Pace/i)).toBeDefined();
    expect(screen.getByText(/Spaced Repetition/i)).toBeDefined();
    expect(screen.getByText(/Vocabulary Library/i)).toBeDefined();
    expect(screen.getByText(/Worldwide Cultural Exploration/i)).toBeDefined();

    // Portuguese default strings should NOT be displayed as UI chrome
    expect(screen.queryByText('Imersão Diária Lexilume')).toBeNull();
    expect(screen.queryByText('Progresso da Meta Diária')).toBeNull();
    expect(screen.queryByText('Próxima Lição do Dia')).toBeNull();
    expect(screen.queryByText('Visão Geral dos Cursos')).toBeNull();
  });

  it('filters cultural preview articles according to interface language', () => {
    renderDashboard('en');

    // In English mode, English cultural articles (content_language: en) should be displayed
    const enBadges = screen.getAllByText(/en •/i);
    expect(enBadges.length).toBeGreaterThan(0);
  });

  it('renders content in Spanish when interface language is Spanish', () => {
    renderDashboard('es');

    expect(screen.getByText(/Inmersión Diaria Lexilume/i)).toBeDefined();
    expect(screen.getByText(/Progreso del Objetivo Diario/i)).toBeDefined();
    expect(screen.getByText(/Próxima Lección del Día/i)).toBeDefined();
    expect(screen.getByText(/Visión General de los Cursos/i)).toBeDefined();
    expect(screen.getByText(/Exploración Cultural del Mundo/i)).toBeDefined();
  });

  it('renders content in Portuguese when interface language is Portuguese', () => {
    renderDashboard('pt');

    expect(screen.getByText(/Imersão Diária Lexilume/i)).toBeDefined();
    expect(screen.getByText(/Progresso da Meta Diária/i)).toBeDefined();
    expect(screen.getByText(/Próxima Lição do Dia/i)).toBeDefined();
    expect(screen.getByText(/Visão Geral dos Cursos/i)).toBeDefined();
  });
});
