import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Navigation } from '../components/common/Navigation';
import { AdminPage } from '../pages/AdminPage';
import { useAppRouter } from '../app/router/useAppRouter';
import { I18nProvider } from '../i18n/i18nContext';
import { authService } from '../services/auth';
import i18n from '../i18n/config';

const RouterHarness: React.FC = () => {
  const { currentRoute, adminTab, navigate, navigateAdmin } = useAppRouter('admin');

  return (
    <>
      <Navigation
        activeTab={currentRoute}
        onSelectTab={navigate}
        adminTab={adminTab}
        onSelectAdminTab={navigateAdmin}
        onOpenAuth={vi.fn()}
        onOpenOnboarding={vi.fn()}
      />
      {currentRoute === 'admin' && (
        <AdminPage
          onNavigateTab={navigate}
          activeAdminTab={adminTab}
          onSelectAdminTab={navigateAdmin}
        />
      )}
      {currentRoute === 'dashboard' && <main>Learner Home</main>}
    </>
  );
};

const renderHarness = (hash = '#admin/overview') => {
  window.location.hash = hash;
  return render(
    <I18nProvider>
      <RouterHarness />
    </I18nProvider>
  );
};

const getDesktopAdminNav = () =>
  screen.getByRole('navigation', { name: 'Admin Destinations' });

const clickAdminDestination = (label: string) => {
  fireEvent.click(within(getDesktopAdminNav()).getByRole('button', { name: label }));
};

describe('Phase 8 Admin navigation destination mapping', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
    await i18n.changeLanguage('en');
    await authService.signOut();
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('maps all six navigation labels to their intended AdminWorkbench sections', () => {
    renderHarness();

    clickAdminDestination('Dashboard');
    expect(screen.getByText(/Visão Geral da Plataforma Lexilume/i)).toBeDefined();
    expect(
      within(getDesktopAdminNav())
        .getByRole('button', { name: 'Dashboard' })
        .getAttribute('aria-current')
    ).toBe('page');

    clickAdminDestination('Content Library');
    expect(screen.getByPlaceholderText('Search content titles...')).toBeDefined();
    expect(
      within(getDesktopAdminNav())
        .getByRole('button', { name: 'Content Library' })
        .getAttribute('aria-current')
    ).toBe('page');

    clickAdminDestination('Import Content');
    expect(screen.getByText(/Import Authentic Text/i)).toBeDefined();
    expect(
      within(getDesktopAdminNav())
        .getByRole('button', { name: 'Import Content' })
        .getAttribute('aria-current')
    ).toBe('page');

    clickAdminDestination('Processing Studio');
    expect(screen.getByText(/No processing job in progress/i)).toBeDefined();
    expect(screen.queryByPlaceholderText('Search content titles...')).toBeNull();
    expect(screen.queryByText(/Import Authentic Text/i)).toBeNull();
    expect(
      within(getDesktopAdminNav())
        .getByRole('button', { name: 'Processing Studio' })
        .getAttribute('aria-current')
    ).toBe('page');

    clickAdminDestination('Review & Publish');
    expect(screen.getByText(/Fila de Moderação e Validação de Conteúdo/i)).toBeDefined();
    expect(
      within(getDesktopAdminNav())
        .getByRole('button', { name: 'Review & Publish' })
        .getAttribute('aria-current')
    ).toBe('page');

    clickAdminDestination('Settings');
    expect(screen.getByText(/Matriz de Idiomas Suportados \(13 Idiomas Oficiais\)/i)).toBeDefined();
    expect(
      within(getDesktopAdminNav())
        .getByRole('button', { name: 'Settings' })
        .getAttribute('aria-current')
    ).toBe('page');
  });

  it('keeps the URL destination in sync and restores it after a refresh', () => {
    const firstRender = renderHarness();
    clickAdminDestination('Import Content');
    expect(window.location.hash).toBe('#admin/content_import');
    firstRender.unmount();

    // Simulate a browser refresh by mounting a fresh router at the same URL.
    const refreshed = renderHarness('#admin/content_import');
    expect(screen.getByText(/Import Authentic Text/i)).toBeDefined();
    refreshed.unmount();
  });

  it('falls back to overview for an invalid admin destination', () => {
    renderHarness('#admin/not_a_real_destination');
    expect(screen.getByText(/Visão Geral da Plataforma Lexilume/i)).toBeDefined();
    expect(
      within(getDesktopAdminNav())
        .getByRole('button', { name: 'Dashboard' })
        .getAttribute('aria-current')
    ).toBe('page');
  });

  it('admin logo returns to the default destination', () => {
    renderHarness('#admin/review');
    fireEvent.click(screen.getByLabelText('Lexilume Admin Desk'));
    expect(screen.getByText(/Visão Geral da Plataforma Lexilume/i)).toBeDefined();
  });

  it('switches from admin back to the learner shell and can return to admin', () => {
    renderHarness('#admin/settings');
    fireEvent.click(screen.getByRole('button', { name: 'Return to Learner View' }));
    expect(screen.getByText('Learner Home')).toBeDefined();

    fireEvent.click(screen.getByLabelText(/Menu do Perfil e Configurações|Profile and Settings Menu/i));
    fireEvent.click(screen.getByText(/Console Admin|Governance Panel|Painel Administrativo/i));

    expect(screen.getByText(/Visão Geral da Plataforma Lexilume/i)).toBeDefined();
    expect(window.location.hash).toBe('#admin/overview');
  });

  it('exposes all six destinations through the tablet/mobile admin menu', () => {
    renderHarness('#admin/overview');

    const menuTrigger = screen.getByRole('button', { name: 'Admin navigation menu' });
    expect(menuTrigger.textContent).toContain('Dashboard');
    fireEvent.click(menuTrigger);

    const mobileNav = screen.getByRole('navigation', { name: 'Admin Destinations Mobile' });
    const labels = [
      'Dashboard',
      'Content Library',
      'Import Content',
      'Processing Studio',
      'Review & Publish',
      'Settings',
    ];

    labels.forEach(label => {
      expect(within(mobileNav).getByRole('button', { name: label })).toBeDefined();
    });

    fireEvent.click(within(mobileNav).getByRole('button', { name: 'Review & Publish' }));
    expect(screen.getByText(/Fila de Moderação e Validação de Conteúdo/i)).toBeDefined();
    expect(window.location.hash).toBe('#admin/review');
  });

  it('blocks unauthorized users from protected admin functionality', async () => {
    await authService.signOut();
    renderHarness('#admin/review');

    expect(screen.getByText(/Access Restricted|Acesso Restrito/i)).toBeDefined();
    expect(screen.queryByText(/Fila de Moderação e Validação de Conteúdo/i)).toBeNull();
  });
});
