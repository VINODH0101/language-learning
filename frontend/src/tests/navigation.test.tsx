import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Navigation, NavTab } from '../components/common/Navigation';
import { I18nProvider } from '../i18n/i18nContext';
import { courseService } from '../services/courseService';
import { authService } from '../services/auth';
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

  it('renders brand identity with a dynamic target/explanation language context', () => {
    renderNav();
    expect(screen.getByText('Lexilume')).toBeDefined();
    expect(screen.getByText('AI')).toBeDefined();
    // Default active course is Portuguese with English explanations.
    expect(screen.getByText('Portuguese')).toBeDefined();
    expect(screen.getByText(/Explanations in English/)).toBeDefined();
    // The old hardcoded language strip must be gone.
    expect(screen.queryByText(/PT · ES · EN/)).toBeNull();
  });

  it('localizes the header language context by interface language and active course', async () => {
    localStorage.setItem('lexilume_interface_lang', 'pt-BR');
    await i18n.changeLanguage('pt-BR');
    const courses = courseService.getCourses('guest');
    const spanishCourse = courses.find(c => c.target_language === 'es');
    if (spanishCourse) {
      courseService.setActiveCourse(spanishCourse.id, 'guest');
    }

    renderNav();

    expect(screen.getByText('Espanhol')).toBeDefined();
    expect(screen.getByText(/Inglês/)).toBeDefined();
    expect(screen.queryByText(/Explanations in English/)).toBeNull();
  });

  it('renders exactly the three supported interface languages', () => {
    renderNav();
    const selectors = screen.getAllByTestId('interface-language-selector');
    expect(selectors.length).toBeGreaterThan(0);

    const trigger = selectors[0].querySelector('button');
    expect(trigger).toBeDefined();
    fireEvent.click(trigger!);

    // Should list only native readable names for the three product languages.
    expect(screen.getAllByText('Português').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Español').length).toBeGreaterThan(0);
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.queryByText('Français')).toBeNull();
    expect(screen.queryByText('Deutsch')).toBeNull();
    expect(screen.queryByText('日本語')).toBeNull();
  });

  it('clicking language in interface selector changes active interface language', () => {
    renderNav();
    const trigger = screen.getAllByTestId('interface-language-selector')[0].querySelector('button');
    fireEvent.click(trigger!);

    const ptOption = screen.getAllByText('Português')[0].closest('button');
    fireEvent.click(ptOption!);
    expect(localStorage.getItem('polyglot_interface_lang')).toBe('pt');
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

  it('renders all 7 primary learner destinations on desktop', () => {
    renderNav('dashboard');

    // Desktop main navigation container
    const navMenu = screen.getByRole('navigation', { name: 'Navigation Menu' });
    expect(navMenu).toBeDefined();

    // 1. Home
    expect(within(navMenu).getByRole('button', { name: /^Home$/i })).toBeDefined();
    // 2. Learn / Texts
    expect(within(navMenu).getByRole('button', { name: /Content Library/i })).toBeDefined();
    // 3. Practice
    expect(within(navMenu).getByRole('button', { name: /^Practice$/i })).toBeDefined();
    // 4. My Words
    expect(within(navMenu).getByRole('button', { name: /^My Words$/i })).toBeDefined();
    // 5. My Mistakes
    expect(within(navMenu).getByRole('button', { name: /^My Mistakes$/i })).toBeDefined();
    // 6. Progress
    expect(within(navMenu).getByRole('button', { name: /^Progress$/i })).toBeDefined();
    // 7. Settings
    expect(within(navMenu).getByRole('button', { name: /^Settings$/i })).toBeDefined();
  });

  it('renders 5 destinations on mobile bottom dock including More which opens drawer', () => {
    renderNav('dashboard');

    const mobileDock = screen.getByRole('navigation', { name: 'Mobile Navigation' });
    expect(mobileDock).toBeDefined();

    // The 5 dock destinations
    expect(screen.getByRole('button', { name: /More menu|Mais/i })).toBeDefined();

    // Clicking More opens drawer
    const moreBtn = screen.getByRole('button', { name: /More menu|Mais/i });
    fireEvent.click(moreBtn);

    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByText(/(Navegação Completa|Full Navigation)/i)).toBeDefined();
  });

  it('renders dedicated admin navigation header when activeTab is admin and user is authorized admin', async () => {
    const adminUser = {
      id: 'admin_1',
      auth_user_id: 'auth_admin_1',
      email: 'admin@lexilume.com',
      full_name: 'Lead Admin',
      role: 'admin',
      account_status: 'active',
      native_language: 'en',
      primary_target_language: 'pt',
      interface_language: 'en',
      explanation_language: 'en',
      theme: 'light',
      onboarding_completed: true,
    };
    const adminState = {
      user: adminUser as any,
      role: 'admin' as const,
      isGuest: false,
      isLoading: false,
    };
    const authSpy = vi.spyOn(authService, 'getState').mockReturnValue(adminState);
    const subSpy = vi.spyOn(authService, 'subscribe').mockImplementation((listener) => {
      listener(adminState);
      return () => {};
    });

    renderNav('admin');

    // Admin Desk identity
    expect(screen.getByText(/Admin Desk/i)).toBeDefined();
    // Learner App return button
    expect(screen.getByRole('button', { name: /Return to Learner View/i })).toBeDefined();
    // Admin primary destinations
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Content Library/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Import Content/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Processing Studio/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Review & Publish/i })).toBeDefined();

    // Clicking Learner App button returns to dashboard
    const returnBtn = screen.getByRole('button', { name: /Return to Learner View/i });
    fireEvent.click(returnBtn);
    expect(mockOnSelectTab).toHaveBeenCalledWith('dashboard');

    authSpy.mockRestore();
    subSpy.mockRestore();
  });
});
