import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContentAccessService,
  listItemToContentItem,
  recordToReaderVersion,
} from '../services/contentAccess';

const base = (overrides: Record<string, unknown> = {}) => ({
  id: 'item_1',
  title: 'Story One',
  slug: 'story-one',
  target_language: 'pt' as const,
  explanation_language: 'en' as const,
  genre: 'short_story' as const,
  primary_cefr: 'B1' as const,
  estimated_read_minutes: 4,
  status: 'published' as const,
  rights_status: 'public_domain' as const,
  created_at: '2026-01-02T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

describe('ContentAccessService (local)', () => {
  let service: ContentAccessService;

  beforeEach(() => {
    service = new ContentAccessService(
      async () => [
        base({ id: 's1', genre: 'short_story', target_language: 'pt', created_at: '2026-01-03T00:00:00.000Z' }),
        base({ id: 's2', genre: 'literature', target_language: 'pt', created_at: '2026-01-02T00:00:00.000Z' }),
        base({ id: 'g1', genre: 'grammar_in_action', target_language: 'es', primary_cefr: 'A2', created_at: '2026-01-01T00:00:00.000Z' }),
        base({ id: 'draft1', genre: 'short_story', target_language: 'pt', status: 'draft' }),
      ] as any,
      undefined
    );
  });

  it('lists only published content and orders by recency', async () => {
    const page = await service.listContent({ targetLanguage: 'pt', pageSize: 10 });
    expect(page.total).toBe(2);
    expect(page.data.map(i => i.id)).toEqual(['s1', 's2']);
  });

  it('paginates with a next cursor', async () => {
    const page = await service.listContent({ page: 1, pageSize: 2, sort: 'title' });
    expect(page.data.length).toBe(2);
    expect(page.nextCursor).toBe(2);
    const page2 = await service.listContent({ page: 2, pageSize: 2, sort: 'title' });
    expect(page2.nextCursor).toBeNull();
  });

  it('filters by content type and CEFR level', async () => {
    const page = await service.listContent({ contentType: 'grammar', targetLanguage: 'es' });
    expect(page.data.map(i => i.id)).toEqual(['g1']);
    const page2 = await service.listContent({ contentType: 'story', cefrLevel: 'A2' });
    expect(page2.data).toEqual([]);
  });

  it('rejects invalid filters', async () => {
    await expect(service.listContent({ contentType: 'nope' as any })).rejects.toThrow();
    await expect(service.listContent({ targetLanguage: 'fr' })).rejects.toThrow();
    await expect(service.listContent({ cefrLevel: 'X9' as any })).rejects.toThrow();
    await expect(service.listContent({ pageSize: 100 })).rejects.toThrow();
  });

  it('search matches title or summary', async () => {
    const page = await service.search('Story');
    expect(page.total).toBeGreaterThanOrEqual(1);
  });

  it('filters by explanationLanguage and distinguishes vocabulary vs grammar', async () => {
    const svc = new ContentAccessService(
      async () => [
        base({ id: 'v1', genre: 'grammar_in_action', content_type: 'vocabulary', target_language: 'pt', explanation_language: 'en', title: 'casa' }),
        base({ id: 'v2', genre: 'grammar_in_action', content_type: 'vocabulary', target_language: 'pt', explanation_language: 'es', title: 'mesa' }),
        base({ id: 'g1', genre: 'grammar_in_action', content_type: 'grammar', target_language: 'pt', explanation_language: 'en', title: 'Presente' }),
      ] as any,
      undefined
    );

    const vocab = await svc.vocabulary('pt', 'en');
    expect(vocab.map(v => v.id)).toEqual(['v1']);

    const grammar = await svc.grammar('pt', 'en');
    expect(grammar.map(g => g.id)).toEqual(['g1']);
  });

  it('uses HTTP endpoints when apiBase is configured', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/content/search')) {
        return { ok: true, status: 200, json: async () => ({ data: [], page: 1, pageSize: 20, total: 0, nextCursor: null }) };
      }
      if (url.includes('/content/item-1/activities')) {
        return { ok: true, status: 200, json: async () => [{ id: 'act-1' }] };
      }
      if (url.includes('/content/item-1')) {
        return { ok: true, status: 200, json: async () => base({ id: 'item-1' }) };
      }
      return { ok: true, status: 200, json: async () => ({ data: [], page: 1, pageSize: 20, total: 0, nextCursor: null }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const httpSvc = new ContentAccessService(undefined, 'https://api.example.test');
      await httpSvc.search('cafe', { targetLanguage: 'pt' });
      const item = await httpSvc.getContent('item-1');
      const acts = await httpSvc.getActivities('item-1');

      expect(item?.id).toBe('item-1');
      expect(acts).toEqual([{ id: 'act-1' }]);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('https://api.example.test/content/search?'));
      expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/content/item-1');
      expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/content/item-1/activities');
      expect(httpSvc.hasHttpBackend()).toBe(true);
      expect(service.hasHttpBackend()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('normalizes published AI items across Vocabulary, Practice, Culture, Poetry, Conversation, and Reader', async () => {
    const records: Record<string, any> = {
      'vocab-1': {
        id: 'vocab-1',
        content_type: 'vocabulary',
        target_language: 'pt',
        explanation_language: 'en',
        cefr_level: 'B1',
        title: 'saudade',
        summary: 'Nostalgia',
        status: 'published',
        body: { lemma: 'saudade', part_of_speech: 'noun', definition: 'Deep nostalgic longing' },
      },
      'prac-1': {
        id: 'prac-1',
        content_type: 'practice',
        target_language: 'pt',
        explanation_language: 'en',
        cefr_level: 'B1',
        title: 'Vocab check',
        summary: 'Choose correct word',
        status: 'published',
        body: {
          skill: 'vocabulary',
          exercise_type: 'multiple_choice',
          instructions: 'Choose one',
          questions: [{ prompt: 'Oposto de alto?', options: ['baixo', 'perto'], correct: 'baixo' }],
          correct_answers: ['baixo'],
        },
      },
      'cult-1': {
        id: 'cult-1',
        content_type: 'cultural_article',
        target_language: 'pt',
        explanation_language: 'en',
        cefr_level: 'B1',
        title: 'Azulejos',
        summary: 'Tiles in Portugal',
        status: 'published',
        body: {
          article_body: 'Os azulejos fazem parte da paisagem portuguesa.',
          source_references: [{ source_name: 'Lexilume Editorial', url: 'https://lexilume.local' }],
        },
      },
      'poem-1': {
        id: 'poem-1',
        content_type: 'poetry',
        target_language: 'pt',
        explanation_language: 'en',
        cefr_level: 'B1',
        title: 'Manhã',
        summary: 'Verso',
        status: 'published',
        body: { lines: ['Luz da manhã,', 'canta a cidade.'], interpretation: 'Morning light', copyright: 'Original' },
      },
      'conv-1': {
        id: 'conv-1',
        content_type: 'conversation',
        target_language: 'pt',
        explanation_language: 'en',
        cefr_level: 'B1',
        title: 'Padaria',
        summary: 'Café',
        status: 'published',
        body: { scenario: 'Na padaria', dialogue: [{ speaker: 'A', line: 'Bom dia!', translation: 'Good morning!' }] },
      },
    };

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/content?')) {
        const params = new URL(url).searchParams;
        const ct = params.get('contentType');
        const list = Object.values(records)
          .filter(r => !ct || r.content_type === ct)
          .map(r => ({
            id: r.id,
            contentType: r.content_type,
            targetLanguage: r.target_language,
            explanationLanguage: r.explanation_language,
            cefrLevel: r.cefr_level,
            title: r.title,
            summary: r.summary,
            estimatedReadMinutes: 1,
            publishedAt: '2026-01-01T00:00:00Z',
          }));
        return { ok: true, status: 200, json: async () => ({ data: list, page: 1, pageSize: 50, total: list.length, nextCursor: null }) };
      }
      const match = url.match(/\/content\/([^/?]+)$/);
      if (match && records[match[1]]) {
        return { ok: true, status: 200, json: async () => records[match[1]] };
      }
      return { ok: true, status: 200, json: async () => [] };
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const svc = new ContentAccessService(undefined, 'https://api.example.test');
      const vocab = await svc.getPublishedVocabularyEntries('pt', 'en');
      const prac = await svc.getPublishedPracticeExercises('pt');
      const cult = await svc.getPublishedCulturalArticles('pt');
      const poems = await svc.getPublishedPoetry('pt', 'en');
      const convs = await svc.getPublishedConversations('pt', 'en');

      expect(vocab[0].lemma).toBe('saudade');
      expect(prac[0].acceptable_solutions).toEqual(['baixo']);
      expect(cult[0].title).toBe('Azulejos');
      expect(poems[0].full_text).toContain('Luz da manhã');
      expect(convs[0].dialogue[0].line).toBe('Bom dia!');

      const readerVer = recordToReaderVersion(
        listItemToContentItem({
          id: 'conv-1',
          contentType: 'conversation',
          targetLanguage: 'pt',
          explanationLanguage: 'en',
          cefrLevel: 'B1',
          title: 'Padaria',
          summary: 'Café',
          estimatedReadMinutes: 1,
          publishedAt: '2026-01-01T00:00:00Z',
        }),
        records['conv-1']
      );
      expect(readerVer.structured_payload.paragraphs[0].sentences[0].tokens.length).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
