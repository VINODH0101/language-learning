import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '../pages/DashboardPage';
import { I18nProvider } from '../i18n/i18nContext';

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
    expect(screen.getByText(/Daily Learning Pace/i)).toBeDefined();
    expect(screen.getByText(/Vocabulary Summary/i)).toBeDefined();

    // Portuguese default strings should NOT be displayed as UI chrome
    expect(screen.queryByText('Imersão Diária Lexilume')).toBeNull();
    expect(screen.queryByText('Progresso da Meta Diária')).toBeNull();
    expect(screen.queryByText('Próxima Lição do Dia')).toBeNull();
  });

  it('renders content in Spanish when interface language is Spanish', () => {
    renderDashboard('es');

    expect(screen.getByText(/Inmersión Diaria Lexilume/i)).toBeDefined();
    expect(screen.getByText(/Progreso del Objetivo Diario/i)).toBeDefined();
    expect(screen.getByText(/Próxima Lección del Día/i)).toBeDefined();
  });

  it('renders content in Portuguese when interface language is Portuguese', () => {
    renderDashboard('pt');

    expect(screen.getByText(/Imersão Diária Lexilume/i)).toBeDefined();
    expect(screen.getByText(/Progresso da Meta Diária/i)).toBeDefined();
    expect(screen.getByText(/Próxima Lição do Dia/i)).toBeDefined();
  });
});
