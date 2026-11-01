import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation, NavTab } from '../components/common/Navigation';
import { I18nProvider } from '../i18n/i18nContext';
import { courseService } from '../services/courseService';
import i18n from '../i18n/config';

describe('Navigation Component & UX', () => {
  const mockOnSelectTab = vi.fn();
  const mockOnOpenAuth = vi.fn();
  const mockOnOpenOnboarding = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  const renderNav = (activeTab: NavTab = 'dashboard') => {
    return render(
      <I18nProvider>
        <Navigation
          activeTab={activeTab}
          onSelectTab={mockOnSelectTab}
          onOpenAuth={mockOnOpenAuth}
          onOpenOnboarding={mockOnOpenOnboarding}
        />
      </I18nProvider>
    );
  };

  it('renders brand identity, title and subtitle accurately', () => {
    renderNav();
    expect(screen.getByText('Lexilume')).toBeDefined();
    expect(screen.getByText('AI')).toBeDefined();
    expect(screen.getByText(/PT · ES · EN/)).toBeDefined();
  });

  it('renders the accessible interface language selector with native readable names', () => {
    renderNav();
    const selectors = screen.getAllByTestId('interface-language-selector');
    expect(selectors.length).toBeGreaterThan(0);

    const trigger = selectors[0].querySelector('button');
    expect(trigger).toBeDefined();
    fireEvent.click(trigger!);

    // Should list native names
    expect(screen.getAllByText('Português (Brasil)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Español').length).toBeGreaterThan(0);
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
  });

  it('clicking language in interface selector changes active interface language', () => {
    renderNav();
    const trigger = screen.getAllByTestId('interface-language-selector')[0].querySelector('button');
    fireEvent.click(trigger!);

    const ptOption = screen.getAllByText('Português (Brasil)')[0].closest('button');
    fireEvent.click(ptOption!);
    expect(localStorage.getItem('polyglot_interface_lang')).toBe('pt-BR');
  });

  it('toggles the Learn dropdown and displays both language tracks and study tools', () => {
    renderNav('dashboard');
    const learnButton = screen.getByRole('button', { name: /learn menu/i });
    expect(learnButton).toBeDefined();

    // Initially dropdown items are not in the DOM
    expect(screen.queryByText(/(Trilhas de Idiomas|Language Tracks)/i)).toBeNull();

    // Click to open dropdown
    fireEvent.click(learnButton);
    expect(screen.getByText(/(Trilhas de Idiomas|Language Tracks)/i)).toBeDefined();
    expect(screen.getByText(/(Ferramentas de Estudo|Study Tools)/i)).toBeDefined();

    // Click Portuguese track inside the open dropdown
    const ptTracks = screen.getAllByText(/(Trilha Imersiva|Immersive Track)/i);
    fireEvent.click(ptTracks[0].closest('button')!);
    expect(mockOnSelectTab).toHaveBeenCalled();
  });

  it('course-aware mobile learn navigates to active course target language', () => {
    // Set active course to Spanish
    const courses = courseService.getCourses('guest');
    const spanishCourse = courses.find((c) => c.target_language === 'es');
    if (spanishCourse) {
      courseService.setActiveCourse(spanishCourse.id, 'guest');
    }

    renderNav('dashboard');

    // Mobile learn button in bottom dock
    const mobileLearnBtn = screen.getByRole('button', { name: /^(Learn|Aprender)$/i });
    fireEvent.click(mobileLearnBtn);

    expect(mockOnSelectTab).toHaveBeenCalledWith('spanish');
  });

  it('does not display removed legacy badges (cloud synced, streak days pill, font scaler)', () => {
    renderNav();
    expect(screen.queryByText(/Cloud Synced/i)).toBeNull();
    expect(screen.queryByText(/Sincronizado na Nuvem/i)).toBeNull();
    expect(screen.queryByText(/days/i)).toBeNull();
    expect(screen.queryByTitle(/Tamanho da Fonte/i)).toBeNull();
  });

  it('opens and closes mobile drawer and toggles body scroll lock', () => {
    renderNav();
    const hamburgerBtn = screen.getByLabelText(/(Abrir Menu de Navegação|Open Navigation Menu)/i);
    expect(hamburgerBtn).toBeDefined();

    // Open drawer
    fireEvent.click(hamburgerBtn);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByText(/(Navegação Completa|Full Navigation)/i)).toBeDefined();

    // Close drawer via close button
    const closeBtns = screen.getAllByLabelText(/(Fechar Menu|Close Menu)/i);
    fireEvent.click(closeBtns[0]);
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('renders a compact sign in button with accessible label for all viewports', () => {
    renderNav();
    const signInBtn = screen.getByRole('button', { name: /entrar|sign in/i });
    expect(signInBtn).toBeDefined();
    expect(signInBtn.getAttribute('aria-label') || signInBtn.getAttribute('title')).toMatch(/entrar|sign in/i);
  });
});
