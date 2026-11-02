import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { contentCentredService, SEED_CONTENT_ITEMS } from '../services/contentCentredService';
import { LearnCatalog } from '../features/learn/LearnCatalog';
import { ReaderView } from '../features/learn/ReaderView';
import { ContextualLookupModal } from '../features/learn/ContextualLookupModal';
import { ContentActivities } from '../features/learn/ContentActivities';
import { MyWordsPage } from '../pages/MyWordsPage';
import { MyMistakesPage } from '../pages/MyMistakesPage';

describe('Lexilume Learner Experience (Milestones 7.5, 7.6, 7.7)', () => {
  const seedDublin = SEED_CONTENT_ITEMS[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. LearnCatalog renders authentic published content with language and duration badges', async () => {
    const handleSelect = vi.fn();
    render(<LearnCatalog onSelectContent={handleSelect} />);

    // Check seed items render
    expect(await screen.findByText('A Morning Coffee in Dublin')).toBeDefined();
    expect(screen.getByText('Um Passeio pelo Bairro Alto')).toBeDefined();
    expect(screen.getByText('Tapas en el Mercado de San Miguel')).toBeDefined();

    // Verify language badges
    expect(screen.getAllByText('EN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ES').length).toBeGreaterThan(0);

    // Clicking a content card triggers onSelectContent
    const dublinCard = screen.getByText('A Morning Coffee in Dublin');
    fireEvent.click(dublinCard);

    await waitFor(() => {
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'ci_coffee_dublin_001' }),
        expect.objectContaining({ id: 'cv_coffee_dublin_v1' }),
        expect.any(Array)
      );
    });
  });

  it('2. ReaderView renders clear typography paragraphs and toggles sentence translation', async () => {
    const handleBack = vi.fn();
    render(
      <ReaderView
        item={seedDublin}
        version={seedDublin.version}
        activities={seedDublin.activities}
        onBack={handleBack}
      />
    );

    expect(screen.getByText('A Morning Coffee in Dublin')).toBeDefined();
    const sentenceSpan = screen.getByTestId('sentence-s1');
    expect(sentenceSpan).toBeDefined();
    expect(sentenceSpan.textContent).toContain('The barista poured the velvety flat white');

    // Clicking sentence reveals translation
    fireEvent.click(sentenceSpan);

    await waitFor(() => {
      expect(
        screen.getByText(/O barista despejou o flat white aveludado/i)
      ).toBeDefined();
    });
  });

  it('3. ContextualLookupModal displays contextual meaning and saves vocabulary with SM-2 invariants', async () => {
    const handleClose = vi.fn();
    const handleSaved = vi.fn();
    const sentence = seedDublin.version.structured_payload.paragraphs[0].sentences[0];
    const annot = seedDublin.version.structured_payload.annotations['g_velvety'];

    render(
      <ContextualLookupModal
        data={{
          selectedText: 'velvety',
          sentence,
          paragraph: seedDublin.version.structured_payload.paragraphs[0],
          targetLanguage: 'en',
          explanationLanguage: 'pt',
          contentId: seedDublin.id,
          versionId: seedDublin.version.id,
          annotation: annot,
        }}
        onClose={handleClose}
        onSavedWord={handleSaved}
      />
    );

    // Displays contextual definition & translation
    expect(screen.getByText('velvety')).toBeDefined();
    expect(
      screen.getByText(/Having a soft, smooth, creamy texture pleasant to the palate/i)
    ).toBeDefined();
    expect(screen.getByText(/aveludado, cremoso/i)).toBeDefined();

    // Save vocabulary action
    const saveBtn = screen.getByRole('button', { name: /Save to My Words/i });
    fireEvent.click(saveBtn);

    await waitFor(async () => {
      const saved = await contentCentredService.getUserSavedWords('guest_user');
      const found = saved.find(w => w.lemma === 'velvety');
      expect(found).toBeDefined();
      expect(found?.ease_factor).toBe(2.5);
      expect(found?.interval_days).toBe(0);
      expect(found?.state).toBe('learning');
    });
  });

  it('4. ContentActivities validates comprehension and auto-records mistakes in notebook', async () => {
    const handleComplete = vi.fn();
    render(
      <ContentActivities
        item={seedDublin}
        version={seedDublin.version}
        activities={seedDublin.activities}
        onComplete={handleComplete}
      />
    );

    expect(screen.getByText(/What was the weather like outside the café?/i)).toBeDefined();

    // Choose incorrect answer to test mistake notebook auto-recording
    const wrongOpt = screen.getByText('It was a clear and sunny morning');
    fireEvent.click(wrongOpt);

    const checkBtn = screen.getByRole('button', { name: /Check Answer/i });
    fireEvent.click(checkBtn);

    await waitFor(async () => {
      expect(screen.getByText(/Incorrect — Saved to your Mistake Notebook/i)).toBeDefined();
      const mistakes = await contentCentredService.getUserMistakes('guest_user');
      expect(mistakes.length).toBeGreaterThan(0);
      expect(mistakes[0].stimulus).toContain('What was the weather like');
    });
  });

  it('5. MyWordsPage renders personal lexicon and calculates review queue', async () => {
    // Seed word
    await contentCentredService.saveUserWord({
      user_id: 'guest_user',
      target_language: 'en',
      explanation_language: 'pt',
      term: 'velvety',
      lemma: 'velvety',
      pos: 'adjective',
      definition: 'Soft and smooth texture',
    });

    render(<MyWordsPage />);
    expect(await screen.findByText('velvety')).toBeDefined();
    expect(screen.getByText(/Personal Lexicon & Spaced Repetition/i)).toBeDefined();
  });

  it('6. MyMistakesPage renders unresolved mistakes and allows re-testing', async () => {
    await contentCentredService.recordUserMistake({
      user_id: 'guest_user',
      stimulus: 'What color was the tram in Lisbon?',
      user_response: 'Blue',
      correct_response: 'Yellow',
      pedagogical_explanation: 'The tram in Lisbon is famously yellow (amarelo).',
      error_category: 'comprehension_inference',
    });

    render(<MyMistakesPage />);
    expect(await screen.findByText(/What color was the tram in Lisbon?/i)).toBeDefined();
    expect(screen.getByText(/"Blue"/)).toBeDefined();
    expect(screen.getByText(/"Yellow"/)).toBeDefined();

    // Re-test button
    const retestBtns = screen.getAllByRole('button', { name: /Re-test/i });
    expect(retestBtns.length).toBeGreaterThan(0);
    expect(retestBtns[0]).toBeDefined();
  });
});
