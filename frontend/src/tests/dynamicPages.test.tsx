import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import i18n from '../i18n/config';
import { I18nProvider } from '../i18n/i18nContext';
import { LanguageDetector } from '../i18n/languageDetector';
import { MyWordsPage } from '../pages/MyWordsPage';
import { MyMistakesPage } from '../pages/MyMistakesPage';
import { TranslatePage } from '../pages/TranslatePage';
import { VocabularyPage } from '../pages/VocabularyPage';
import { AdminContentReview } from '../features/admin/AdminContentReview';
import { computeLiveCefrAudit } from '../features/admin/adminMetricsHelper';
import { clearAllLocalLearningData } from '../services/localDb';
import { authService } from '../services/auth';
import { adminService } from '../services/adminService';
import { contentCentredService } from '../services/contentCentredService';
import { contentAccess } from '../services/contentAccess';
import type { ContentItem } from '../types/contentCentred';
import type { VocabularyEntry } from '../types/vocabulary';

const renderWithLang = async (lang: 'en' | 'pt' | 'es', node: React.ReactNode) => {
  LanguageDetector.persistSelection(lang);
  await i18n.changeLanguage(lang);
  return render(<I18nProvider>{node}</I18nProvider>);
};

describe('Dynamic Page Internationalization & Live Data Verification', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllLocalLearningData();
    await authService.signOut();
    LanguageDetector.persistSelection('en');
    await i18n.changeLanguage('en');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    LanguageDetector.persistSelection('en');
    await i18n.changeLanguage('en');
  });

  it('dynamically renders MyWordsPage headings and empty state across en, pt, and es', async () => {
    const enView = await renderWithLang('en', <MyWordsPage />);
    expect(await screen.findByRole('heading', { name: 'My Words' })).toBeDefined();
    expect(screen.getByText('No Saved Words Yet')).toBeDefined();
    enView.unmount();

    const ptView = await renderWithLang('pt', <MyWordsPage />);
    expect(await screen.findByRole('heading', { name: 'Minhas Palavras' })).toBeDefined();
    expect(screen.getByText('Nenhuma Palavra Salva Ainda')).toBeDefined();
    ptView.unmount();

    const esView = await renderWithLang('es', <MyWordsPage />);
    expect(await screen.findByRole('heading', { name: 'Mis Palabras' })).toBeDefined();
    expect(screen.getByText('Aún No Hay Palabras Guardadas')).toBeDefined();
    esView.unmount();
  });

  it('dynamically renders MyMistakesPage headings and filters across en, pt, and es', async () => {
    const enView = await renderWithLang('en', <MyMistakesPage />);
    expect(await screen.findByRole('heading', { name: 'My Mistakes Notebook' })).toBeDefined();
    expect(screen.getByText('No Unresolved Mistakes!')).toBeDefined();
    enView.unmount();

    const ptView = await renderWithLang('pt', <MyMistakesPage />);
    expect(await screen.findByRole('heading', { name: 'Meu Caderno de Erros' })).toBeDefined();
    expect(screen.getByText('Nenhum Erro Pendente!')).toBeDefined();
    ptView.unmount();

    const esView = await renderWithLang('es', <MyMistakesPage />);
    expect(await screen.findByRole('heading', { name: 'Mi Cuaderno de Errores' })).toBeDefined();
    expect(screen.getByText('¡No Hay Errores Pendientes!')).toBeDefined();
    esView.unmount();
  });

  it('dynamically localizes TranslatePage and renders published AI false-friend items with zero seed data', async () => {
    const mockAiEntry: VocabularyEntry = {
      id: 'ai-ff-propina',
      lemma: 'propina',
      target_language: 'pt',
      part_of_speech: 'noun',
      cefr_level: 'B2',
      translations: { pt: 'propina', es: 'propina' },
      definitions: { pt: 'Tuition fee (PT) or bribe (BR)', es: 'Tip / gratuity' },
      example_sentence_target: 'As propinas universitárias foram atualizadas.',
      example_sentence_translations: { es: 'Dejó una generosa propina al camarero.' },
      topic: 'daily_life',
      grammar_notes: 'False cognate: PT "propina" differs from ES "propina" (tip).',
      attribution: {
        source_name: 'Lexilume AI Content Engine',
        source_url: 'https://lexilume.local',
        license_type: 'Original-Curated',
        attribution_text: 'Generated and approved via Lexilume AI Content Engine',
      },
    };
    vi.spyOn(contentAccess, 'getPublishedVocabularyEntries').mockImplementation(async lang =>
      lang === 'pt' ? [mockAiEntry] : []
    );

    const enView = await renderWithLang('en', <TranslatePage />);
    expect(
      screen.getByRole('heading', { name: 'Multidirectional Translation & Learning' })
    ).toBeDefined();
    expect(await screen.findByText(/PT: propina ≠ ES: propina/i)).toBeDefined();
    enView.unmount();

    const ptView = await renderWithLang('pt', <TranslatePage />);
    expect(
      screen.getByRole('heading', { name: /Tradução & Aprendizado Multidirecional/i })
    ).toBeDefined();
    ptView.unmount();
  });

  it('dynamically localizes VocabularyPage headings and tabs between en and pt', async () => {
    const enView = await renderWithLang('en', <VocabularyPage />);
    expect(
      screen.getByRole('heading', { name: 'Vocabulary & Expressions Library' })
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Everyday Sentences/i })).toBeDefined();
    enView.unmount();

    const ptView = await renderWithLang('pt', <VocabularyPage />);
    expect(
      screen.getByRole('heading', { name: 'Biblioteca de Vocabulário & Expressões' })
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Frases do Cotidiano/i })).toBeDefined();
    ptView.unmount();
  });

  it('computes genuine CEFR audit metrics from published items and uses inline rejection controls in AdminContentReview', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    // Verify 0 seeded counts when no published items exist
    const emptyAudit = computeLiveCefrAudit([]);
    expect(emptyAudit.find(m => m.level === 'A1')?.vocab).toBe(0);
    expect(emptyAudit.find(m => m.level === 'C1')?.statusFallback).toBe('Insufficient');

    // Verify live counts scale accurately from published AI items
    const publishedFixtures: ContentItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `pub-c1-${i}`,
      title: `Generated C1 Lesson ${i}`,
      slug: `generated-c1-lesson-${i}`,
      target_language: 'pt',
      explanation_language: 'en',
      source_language: 'pt',
      summary: 'AI Content Engine generated unit',
      genre: 'short_story',
      content_type: i < 2 ? 'vocabulary' : 'story',
      primary_cefr: 'C1',
      estimated_read_minutes: 3,
      status: 'published',
      rights_status: 'public_domain',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    const populatedAudit = computeLiveCefrAudit(publishedFixtures);
    expect(populatedAudit.find(m => m.level === 'C1')?.vocab).toBe(2);
    expect(populatedAudit.find(m => m.level === 'C1')?.passages).toBe(4);
    expect(populatedAudit.find(m => m.level === 'C1')?.statusFallback).toBe('Excellent');

    // Add a real item to review queue (zero initial seeded queue items)
    await adminService.addReviewItem({
      titleOrTerm: 'Subjuntivo Imperfeito em Contexto Histórico',
      type: 'grammar',
      language: 'pt',
      cefrLevel: 'C1',
      source: 'Lexilume Content Engine',
    });

    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => '');
    await renderWithLang('en', <AdminContentReview />);

    expect(await screen.findByText('Moderation Queue & CEFR Audit')).toBeDefined();
    const rejectBtns = await screen.findAllByRole('button', { name: 'Reject' });
    expect(rejectBtns.length).toBeGreaterThan(0);

    fireEvent.click(rejectBtns[0]);
    const reasonInput = await screen.findByPlaceholderText('Reason for pedagogical rejection...');
    fireEvent.change(reasonInput, { target: { value: 'Needs clearer CEFR B2 gloss' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Rejection' }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Reason for pedagogical rejection...')).toBeNull();
    });
    expect(promptSpy).not.toHaveBeenCalled();
    expect(contentCentredService).toBeDefined();
  });
});
