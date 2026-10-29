import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation, NavTab } from '../components/common/Navigation';
import { I18nProvider } from '../i18n/i18nContext';
import { courseService } from '../services/courseService';

describe('Navigation Component & UX', () => {
  const mockOnSelectTab = vi.fn();
  const mockOnOpenAuth = vi.fn();
  const mockOnOpenOnboarding = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  it('renders the segmented interface language switcher (EN, PT, ES)', () => {
    renderNav();
    // In segmented control, all 3 languages should be present as buttons
    const enButtons = screen.getAllByRole('button', { name: /en/i });
    const ptButtons = screen.getAllByRole('button', { name: /pt/i });
    const esButtons = screen.getAllByRole('button', { name: /es/i });

    expect(enButtons.length).toBeGreaterThan(0);
    expect(ptButtons.length).toBeGreaterThan(0);
    expect(esButtons.length).toBeGreaterThan(0);
  });

  it('clicking segmented language switcher changes active language', () => {
    renderNav();
    const ptButton = screen.getAllByRole('button', { name: /^pt$/i })[0];
    fireEvent.click(ptButton);
    expect(localStorage.getItem('polyglot_interface_lang')).toBe('pt');
  });

  it('toggles the Learn dropdown and displays both language tracks and study tools', () => {
    renderNav('dashboard');
    const learnButton = screen.getByRole('button', { name: /learn menu/i });
    expect(learnButton).toBeDefined();

    // Initially dropdown items are not in the DOM
    expect(screen.queryByText(/Trilhas de Idiomas/i)).toBeNull();

    // Click to open dropdown
    fireEvent.click(learnButton);
    expect(screen.getByText(/Trilhas de Idiomas/i)).toBeDefined();
    expect(screen.getByText(/Ferramentas de Estudo/i)).toBeDefined();

    // Click Portuguese track
    const ptTrack = screen.getByText('Portuguese');
    fireEvent.click(ptTrack);
    expect(mockOnSelectTab).toHaveBeenCalledWith('portuguese');
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
    const mobileLearnBtn = screen.getByLabelText('Learn');
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
    const hamburgerBtn = screen.getByLabelText(/Abrir Menu de Navegação/i);
    expect(hamburgerBtn).toBeDefined();

    // Open drawer
    fireEvent.click(hamburgerBtn);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByText('Navegação Completa')).toBeDefined();

    // Close drawer via close button
    const closeBtn = screen.getByLabelText(/^Fechar Menu$/i);
    fireEvent.click(closeBtn);
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('renders a compact sign in button with accessible label for all viewports', () => {
    renderNav();
    const signInBtn = screen.getByRole('button', { name: /entrar|sign in/i });
    expect(signInBtn).toBeDefined();
    expect(signInBtn.getAttribute('aria-label') || signInBtn.getAttribute('title')).toMatch(/entrar|sign in/i);
  });
});
