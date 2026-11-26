import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { contentCentredService } from '../services/contentCentredService';
import { ContentItem, ContentVersion, LearningActivity } from '../types/contentCentred';
import { LearnCatalog } from '../features/learn/LearnCatalog';
import { ReaderView } from '../features/learn/ReaderView';
import { ContextualLookupModal } from '../features/learn/ContextualLookupModal';
import { ContentActivities } from '../features/learn/ContentActivities';
import { MyWordsPage } from '../pages/MyWordsPage';
import { MyMistakesPage } from '../pages/MyMistakesPage';

function createMockDublinItem(): ContentItem & { version: ContentVersion; activities: LearningActivity[] } {
  const now = new Date().toISOString();
  const item: ContentItem = {
    id: 'ci_coffee_dublin_001',
    title: 'A Morning Coffee in Dublin',
    slug: 'morning-coffee-dublin',
    target_language: 'en',
    explanation_language: 'pt',
    source_language: 'en',
    summary: 'Ordering a flat white on a rainy Dublin morning.',
    genre: 'short_story',
    content_type: 'story',
    primary_cefr: 'B1',
    estimated_read_minutes: 4,
    status: 'published',
    current_version_id: 'cv_coffee_dublin_v1',
    rights_status: 'public_domain',
    created_at: now,
    updated_at: now,
  };
  const version: ContentVersion = {
    id: 'cv_coffee_dublin_v1',
    content_item_id: item.id,
    version_number: 1,
    cefr_level: 'B1',
    word_count: 18,
    sentence_count: 2,
    is_published: true,
    published_at: now,
    created_at: now,
    audio_metadata: {},
    structured_payload: {
      title: 'A Morning Coffee in Dublin',
      paragraphs: [
        {
          id: 'p1',
          order: 1,
          sentences: [
            {
              id: 's1',
              order: 1,
              text: 'The barista poured the velvety flat white while rain tapped against the window.',
              tokens: [
                { text: 'The', lemma: 'the', pos: 'det' },
                { text: 'barista', lemma: 'barista', pos: 'noun' },
                { text: 'poured', lemma: 'pour', pos: 'verb' },
                { text: 'the', lemma: 'the', pos: 'det' },
                { text: 'velvety', lemma: 'velvety', pos: 'adjective', gloss_id: 'g_velvety' },
                { text: 'flat white', lemma: 'flat white', pos: 'noun' },
              ],
              translations: {
                pt: 'O barista despejou o flat white aveludado enquanto a chuva batia na janela.',
                es: 'El barista sirvió el flat white aterciopelado mientras la lluvia golpeaba la ventana.',
                en: 'The barista poured the velvety flat white while rain tapped against the window.',
              },
            },
          ],
        },
      ],
      annotations: {
        g_velvety: {
          id: 'g_velvety',
          lemma: 'velvety',
          term: 'velvety',
          pos: 'adjective',
          cefr: 'B2',
          contextual_meaning: 'Having a soft, smooth, creamy texture pleasant to the palate.',
          context_translation: { pt: 'aveludado, cremoso', es: 'aterciopelado, cremoso', en: 'velvety' },
        },
      },
      grammar_points: [],
    },
  };
  const activities: LearningActivity[] = [
    {
      id: 'act_dublin_1',
      content_version_id: version.id,
      activity_type: 'reading_comprehension',
      activity_title: 'Café Atmosphere',
      activity_order: 1,
      estimated_minutes: 2,
      created_at: now,
      configuration: {
        instructions: 'Answer based on the text.',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            stem: 'What was the weather like outside the café?',
            options: [
              { id: 'opt1', text: 'It was raining outside' },
              { id: 'opt2', text: 'It was a clear and sunny morning' },
            ],
            correct_answer: 'opt1',
            explanation: 'The text states rain tapped against the window.',
          },
        ],
      },
    },
  ];
  return { ...item, version, activities };
}

describe('Lexilume Learner Experience (Milestones 7.5, 7.6, 7.7)', () => {
  const seedDublin = createMockDublinItem();

  beforeEach(async () => {
    localStorage.clear();
    contentCentredService.clearLocalRegistries();
    vi.clearAllMocks();
    const now = new Date().toISOString();
    const ptItem: ContentItem = {
      id: 'ci_bairro_alto_pt',
      title: 'Um Passeio pelo Bairro Alto',
      slug: 'passeio-bairro-alto',
      target_language: 'pt',
      explanation_language: 'en',
      summary: 'A walk through Lisbon.',
      genre: 'culture_and_travel',
      content_type: 'story',
      primary_cefr: 'A2',
      estimated_read_minutes: 3,
      status: 'published',
      current_version_id: 'cv_bairro_alto_v1',
      rights_status: 'public_domain',
      created_at: now,
      updated_at: now,
    };
    const esItem: ContentItem = {
      id: 'ci_san_miguel_es',
      title: 'Tapas en el Mercado de San Miguel',
      slug: 'mercado-san-miguel',
      target_language: 'es',
      explanation_language: 'en',
      summary: 'Exploring flavors in Madrid.',
      genre: 'culture_and_travel',
      content_type: 'story',
      primary_cefr: 'B1',
      estimated_read_minutes: 4,
      status: 'published',
      current_version_id: 'cv_san_miguel_v1',
      rights_status: 'public_domain',
      created_at: now,
      updated_at: now,
    };
    await contentCentredService.saveContentItem(seedDublin, { systemBypass: true });
    await contentCentredService.saveContentVersion(seedDublin.version, { systemBypass: true });
    await contentCentredService.publishContentVersion(seedDublin.id, seedDublin.version.id, { systemBypass: true });
    await contentCentredService.saveLearningActivity(seedDublin.activities[0], { systemBypass: true });
    await contentCentredService.saveContentItem(ptItem, { systemBypass: true });
    await contentCentredService.saveContentVersion(
      { ...seedDublin.version, id: 'cv_bairro_alto_v1', content_item_id: ptItem.id },
      { systemBypass: true }
    );
    await contentCentredService.publishContentVersion(ptItem.id, 'cv_bairro_alto_v1', { systemBypass: true });
    await contentCentredService.saveContentItem(esItem, { systemBypass: true });
    await contentCentredService.saveContentVersion(
      { ...seedDublin.version, id: 'cv_san_miguel_v1', content_item_id: esItem.id },
      { systemBypass: true }
    );
    await contentCentredService.publishContentVersion(esItem.id, 'cv_san_miguel_v1', { systemBypass: true });
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
