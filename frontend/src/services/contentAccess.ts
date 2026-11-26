/**
 * Lexilume — Shared content access client (Phase 9).
 *
 * One contract for every learner surface (Home, Learn, Reader, Vocabulary,
 * Grammar, Practice, Discovery, Admin). Honors published-visibility rules,
 * filter validation, and cursor pagination.
 *
 * Transport selection:
 *   - local (default): reads already-published content from the local-first
 *     content store (contentCentredService / Dexie). Works offline.
 *   - HTTP (optional): set `VITE_CONTENT_API_BASE` to the server's API base;
 *     requests then go to `${VITE_CONTENT_API_BASE}/content/...`.
 *
 * No provider credentials are ever exposed here.
 */

import { contentCentredService } from './contentCentredService';
import type { ContentItem, ContentParagraph, ContentVersion } from '../types/contentCentred';
import type {
  CEFRLevel,
  DailyConversation,
  DailyPoem,
  ExerciseTemplate,
  ExplanationLanguage,
  GrammarRule,
  Language,
} from '../types';
import type { VocabularyEntry, VocabularyPartOfSpeech } from '../types/vocabulary';
import type { CulturalArticle } from '../types/culture';

export type ContentType =
  | 'story'
  | 'conversation'
  | 'poetry'
  | 'grammar'
  | 'vocabulary'
  | 'academic_essay'
  | 'cultural_article'
  | 'practice';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface ContentFilters {
  contentType?: ContentType;
  targetLanguage?: string;
  explanationLanguage?: string;
  cefrLevel?: CefrLevel;
  topic?: string;
  page?: number;
  pageSize?: number;
  sort?: 'recent' | 'title';
}

export interface ContentListItem {
  id: string;
  contentType: ContentType;
  targetLanguage: string;
  explanationLanguage: string;
  cefrLevel: string;
  title: string;
  summary: string;
  estimatedReadMinutes: number;
  currentVersionId?: string;
  publishedAt: string;
}

export interface ContentPage {
  data: ContentListItem[];
  page: number;
  pageSize: number;
  total: number;
  nextCursor?: number | null;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TARGET_LANGUAGES = ['en', 'pt', 'es'];
const EXPLANATION_LANGUAGES = ['en', 'pt', 'es'];
const CONTENT_TYPES: ContentType[] = [
  'story',
  'conversation',
  'poetry',
  'grammar',
  'vocabulary',
  'academic_essay',
  'cultural_article',
  'practice',
];

/** Best-effort mapping from the eight content types to legacy genres. */
const CONTENT_TYPE_TO_GENRES: Record<ContentType, string[]> = {
  story: ['short_story', 'literature', 'news_article', 'culture_and_travel', 'reviews_and_opinions'],
  conversation: ['conversation', 'dialogue'],
  poetry: ['literature'],
  grammar: ['grammar_in_action'],
  vocabulary: ['grammar_in_action'],
  academic_essay: ['academic_essay'],
  cultural_article: ['culture_and_travel'],
  practice: ['grammar_in_action'],
};

function validateFilters(filters: ContentFilters): void {
  if (filters.contentType && !CONTENT_TYPES.includes(filters.contentType)) {
    throw new Error(`invalid contentType: ${filters.contentType}`);
  }
  if (filters.targetLanguage && !TARGET_LANGUAGES.includes(filters.targetLanguage)) {
    throw new Error(`invalid targetLanguage: ${filters.targetLanguage}`);
  }
  if (filters.explanationLanguage && !EXPLANATION_LANGUAGES.includes(filters.explanationLanguage)) {
    throw new Error(`invalid explanationLanguage: ${filters.explanationLanguage}`);
  }
  if (filters.cefrLevel && !CEFR_LEVELS.includes(filters.cefrLevel)) {
    throw new Error(`invalid cefrLevel: ${filters.cefrLevel}`);
  }
  if ((filters.page ?? 1) < 1) throw new Error('page must be >= 1');
  const pageSize = filters.pageSize ?? 20;
  if (pageSize < 1 || pageSize > 50) throw new Error('pageSize must be between 1 and 50');
}

function inferContentType(item: ContentItem): ContentType {
  if (item.content_type && CONTENT_TYPES.includes(item.content_type as ContentType)) {
    return item.content_type as ContentType;
  }
  switch (item.genre) {
    case 'conversation':
    case 'dialogue':
      return 'conversation';
    case 'academic_essay':
      return 'academic_essay';
    case 'grammar_in_action':
      return 'grammar';
    case 'culture_and_travel':
      return 'cultural_article';
    default:
      return 'story';
  }
}

function toListItem(item: ContentItem): ContentListItem {
  return {
    id: item.id,
    contentType: inferContentType(item),
    targetLanguage: item.target_language,
    explanationLanguage: item.explanation_language,
    cefrLevel: item.primary_cefr,
    title: item.title,
    summary: item.summary ?? '',
    estimatedReadMinutes: item.estimated_read_minutes,
    currentVersionId: item.current_version_id,
    publishedAt: item.created_at,
  };
}

const API_BASE: string | undefined =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONTENT_API_BASE
    ? String((import.meta as any).env.VITE_CONTENT_API_BASE)
    : undefined;

const VALID_POS: VocabularyPartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'expression',
  'numeral',
];

function mapContentTypeToGenre(contentType: ContentType): ContentItem['genre'] {
  switch (contentType) {
    case 'conversation':
      return 'conversation';
    case 'academic_essay':
      return 'academic_essay';
    case 'grammar':
    case 'vocabulary':
    case 'practice':
      return 'grammar_in_action';
    case 'cultural_article':
      return 'culture_and_travel';
    default:
      return 'short_story';
  }
}

export function extractParagraphsFromAiBody(
  title: string,
  summary: string,
  body: Record<string, any> | undefined,
  explanationLanguage: string = 'en'
): ContentParagraph[] {
  if (body?.paragraphs && Array.isArray(body.paragraphs) && body.paragraphs.length > 0) {
    return body.paragraphs as ContentParagraph[];
  }
  const pairs: Array<{ text: string; translation?: string }> = [];
  if (typeof body?.narrative === 'string' && body.narrative.trim()) {
    for (const s of body.narrative.trim().split(/(?<=[.!?])\s+/)) {
      if (s.trim()) pairs.push({ text: s.trim() });
    }
  } else if (typeof body?.article_body === 'string' && body.article_body.trim()) {
    for (const s of body.article_body.trim().split(/(?<=[.!?])\s+/)) {
      if (s.trim()) pairs.push({ text: s.trim() });
    }
  } else if (Array.isArray(body?.dialogue)) {
    for (const turn of body.dialogue) {
      if (turn?.line) {
        pairs.push({
          text: `${turn.speaker || 'Speaker'}: ${turn.line}`,
          translation: turn.translation,
        });
      }
    }
  } else if (Array.isArray(body?.lines)) {
    body.lines.forEach((line: unknown, idx: number) => {
      if (String(line || '').trim()) {
        pairs.push({
          text: String(line).trim(),
          translation: idx === 0 ? body.interpretation : undefined,
        });
      }
    });
  } else if (body?.grammar_topic) {
    pairs.push({ text: String(body.grammar_topic), translation: body.explanation });
    if (Array.isArray(body.examples)) {
      for (const ex of body.examples) {
        if (ex?.sentence) pairs.push({ text: String(ex.sentence), translation: ex.note });
      }
    }
  } else if (body?.lemma) {
    pairs.push({
      text: `${body.lemma} (${body.part_of_speech || 'word'})`,
      translation: body.definition,
    });
  } else if (body?.thesis) {
    for (const field of ['introduction', 'thesis', 'conclusion']) {
      if (typeof body[field] === 'string' && body[field].trim()) {
        pairs.push({ text: body[field].trim() });
      }
    }
  } else if (body?.instructions) {
    pairs.push({ text: String(body.instructions) });
    if (Array.isArray(body.questions)) {
      for (const q of body.questions) {
        if (q?.prompt) pairs.push({ text: String(q.prompt) });
      }
    }
  }

  if (pairs.length === 0) {
    pairs.push({ text: summary || title });
  }

  return [
    {
      id: 'p1',
      order: 1,
      sentences: pairs.map((p, idx) => {
        const rawTokens = p.text
          .split(/(\s+|[.,!?;:¿¡"“”'’()]+)/)
          .map(t => t.trim())
          .filter(Boolean);
        return {
          id: `s${idx + 1}`,
          order: idx + 1,
          text: p.text,
          translations: p.translation ? { [explanationLanguage]: p.translation } : {},
          tokens: rawTokens.map(tok => {
            const isPunct = /^[.,!?;:¿¡"“”'’()]+$/.test(tok);
            return {
              text: tok,
              lemma: tok.toLowerCase(),
              pos: isPunct ? 'PUNCT' : 'WORD',
            };
          }),
        };
      }),
    },
  ];
}

export function listItemToContentItem(it: ContentListItem): ContentItem {
  const now = it.publishedAt || new Date().toISOString();
  return {
    id: it.id,
    title: it.title,
    slug: it.id,
    target_language: it.targetLanguage as Language,
    explanation_language: it.explanationLanguage as ExplanationLanguage,
    summary: it.summary,
    genre: mapContentTypeToGenre(it.contentType),
    content_type: it.contentType,
    primary_cefr: (it.cefrLevel === 'C2' ? 'C1' : it.cefrLevel) as CEFRLevel,
    estimated_read_minutes: it.estimatedReadMinutes || 1,
    status: 'published',
    current_version_id: it.currentVersionId,
    rights_status: 'original',
    created_at: now,
    updated_at: now,
  };
}

export function recordToReaderVersion(
  item: ContentItem,
  record: Record<string, any> | null | undefined
): ContentVersion {
  if (record?.version?.structured_payload) {
    return record.version as ContentVersion;
  }
  const body = (record?.body && typeof record.body === 'object' ? record.body : {}) as Record<string, any>;
  const paragraphs = extractParagraphsFromAiBody(
    item.title,
    item.summary || '',
    body,
    item.explanation_language || 'en'
  );
  const sentenceList = paragraphs.flatMap(p => p.sentences || []);
  const wordCount = sentenceList.reduce(
    (sum, s) => sum + (s.text || '').split(/\s+/).filter(Boolean).length,
    0
  );
  return {
    id: record?.current_version_id || item.current_version_id || item.id,
    content_item_id: item.id,
    version_number: 1,
    cefr_level: item.primary_cefr,
    word_count: wordCount,
    sentence_count: Math.max(1, sentenceList.length),
    is_published: true,
    audio_metadata: {},
    structured_payload: {
      title: item.title,
      paragraphs,
      annotations: (record?.body?.annotations as any) || {},
      grammar_points: (record?.body?.grammar_points as any) || [],
    },
    created_at: item.created_at,
  };
}

class ContentAccessService {
  private items: () => Promise<ContentItem[]>;
  private apiBase: string | undefined;

  constructor(
    items?: () => Promise<ContentItem[]>,
    apiBase: string | undefined = API_BASE
  ) {
    this.apiBase = apiBase ? apiBase.replace(/\/+$/, '') : undefined;
    this.items =
      items ??
      (() =>
        contentCentredService.getContentItems({ status: 'published' }) as unknown as Promise<
          ContentItem[]
        >);
  }

  public hasHttpBackend(): boolean {
    return Boolean(this.apiBase);
  }

  async listContent(filters: ContentFilters = {}): Promise<ContentPage> {
    validateFilters(filters);
    if (this.apiBase) return this.httpList(filters);
    return this.localList(filters);
  }

  private async localList(filters: ContentFilters, searchQuery?: string): Promise<ContentPage> {
    const all = await this.items();
    let items = all.filter(i => i.status === 'published');

    if (filters.contentType) {
      const genres = CONTENT_TYPE_TO_GENRES[filters.contentType];
      items = items.filter(i =>
        i.content_type ? i.content_type === filters.contentType : genres.includes(i.genre)
      );
    }
    if (filters.targetLanguage) {
      items = items.filter(i => i.target_language === filters.targetLanguage);
    }
    if (filters.explanationLanguage) {
      items = items.filter(i => i.explanation_language === filters.explanationLanguage);
    }
    if (filters.cefrLevel) {
      items = items.filter(i => i.primary_cefr === filters.cefrLevel);
    }
    if (filters.topic) {
      const q = filters.topic.toLowerCase();
      items = items.filter(
        i =>
          i.title.toLowerCase().includes(q) ||
          (i.summary ?? '').toLowerCase().includes(q) ||
          i.slug.toLowerCase().includes(q)
      );
    }
    const q = searchQuery?.trim().toLowerCase();
    if (q) {
      items = items.filter(
        i => i.title.toLowerCase().includes(q) || (i.summary ?? '').toLowerCase().includes(q)
      );
    }

    if (filters.sort === 'title') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      items = [...items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const data = items.slice(start, start + pageSize).map(toListItem);
    return {
      data,
      page,
      pageSize,
      total: items.length,
      nextCursor: start + pageSize < items.length ? page + 1 : null,
    };
  }

  private buildQueryParams(filters: ContentFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.contentType) params.set('contentType', filters.contentType);
    if (filters.targetLanguage) params.set('targetLanguage', filters.targetLanguage);
    if (filters.explanationLanguage) params.set('explanationLanguage', filters.explanationLanguage);
    if (filters.cefrLevel) params.set('cefrLevel', filters.cefrLevel);
    if (filters.topic) params.set('topic', filters.topic);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('page', String(filters.page ?? 1));
    params.set('pageSize', String(filters.pageSize ?? 20));
    return params;
  }

  private async httpList(filters: ContentFilters): Promise<ContentPage> {
    const params = this.buildQueryParams(filters);
    const response = await fetch(`${this.apiBase}/content?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Content API error: ${response.status}`);
    }
    return (await response.json()) as ContentPage;
  }

  async getContent(id: string, versionId?: string): Promise<ContentItem | null> {
    if (this.apiBase) {
      const path = versionId
        ? `${this.apiBase}/content/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}`
        : `${this.apiBase}/content/${encodeURIComponent(id)}`;
      const response = await fetch(path);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Content API error: ${response.status}`);
      return (await response.json()) as ContentItem;
    }
    const full = (await contentCentredService.getContentItemById(
      id
    )) as unknown as ContentItem & { version?: { id?: string } };
    if (!full || full.status !== 'published') return null;
    if (versionId && full.current_version_id !== versionId) return null;
    return full;
  }

  async getActivities(id: string): Promise<unknown[]> {
    if (this.apiBase) {
      const response = await fetch(`${this.apiBase}/content/${encodeURIComponent(id)}/activities`);
      if (response.status === 404) return [];
      if (!response.ok) throw new Error(`Content API error: ${response.status}`);
      return (await response.json()) as unknown[];
    }
    const full = (await this.getContent(id)) as unknown as {
      version?: { id: string };
    };
    if (!full?.version?.id) return [];
    return contentCentredService.getActivitiesForVersion(full.version.id);
  }

  async search(query: string, filters: ContentFilters = {}): Promise<ContentPage> {
    validateFilters(filters);
    if (this.apiBase) {
      const params = this.buildQueryParams(filters);
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`${this.apiBase}/content/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Content API error: ${response.status}`);
      }
      return (await response.json()) as ContentPage;
    }
    return this.localList(filters, query);
  }

  async vocabulary(targetLanguage: string, explanationLanguage = 'en'): Promise<ContentListItem[]> {
    const page = await this.listContent({
      contentType: 'vocabulary',
      targetLanguage,
      explanationLanguage,
      pageSize: 50,
    });
    return page.data;
  }

  async grammar(targetLanguage: string, explanationLanguage = 'en'): Promise<ContentListItem[]> {
    const page = await this.listContent({
      contentType: 'grammar',
      targetLanguage,
      explanationLanguage,
      pageSize: 50,
    });
    return page.data;
  }

  async daily(): Promise<ContentPage> {
    return this.listContent({ sort: 'recent', pageSize: 3 });
  }

  async recommendations(
    targetLanguage: string,
    cefrLevel?: CefrLevel,
    limit = 5
  ): Promise<ContentListItem[]> {
    const page = await this.listContent({
      targetLanguage,
      cefrLevel,
      sort: 'recent',
      pageSize: limit,
    });
    return page.data;
  }

  async listPublishedContentItems(filters: ContentFilters = {}): Promise<ContentItem[]> {
    const page = await this.listContent({ pageSize: 50, ...filters });
    return page.data.map(listItemToContentItem);
  }

  private async resolveBodyForItem(
    listItem: ContentListItem
  ): Promise<{ body: Record<string, any>; detail: Record<string, any> | null }> {
    try {
      let detail = (await this.getContent(listItem.id)) as unknown as Record<string, any> | null;
      if (!detail && !this.apiBase) {
        const localAll = (await this.items()) as unknown as Array<Record<string, any>>;
        detail = localAll.find(it => it.id === listItem.id) || null;
      }
      if (!detail) return { body: {}, detail: null };
      const body =
        (detail.body && typeof detail.body === 'object'
          ? detail.body
          : detail.version?.structured_payload) || {};
      return { body: body as Record<string, any>, detail };
    } catch {
      return { body: {}, detail: null };
    }
  }

  private async loadTypedDetails(
    contentType: ContentType,
    targetLanguage?: string,
    explanationLanguage?: string
  ): Promise<Array<{ item: ContentListItem; body: Record<string, any> }>> {
    const page = await this.listContent({
      contentType,
      targetLanguage,
      explanationLanguage,
      pageSize: 50,
    });
    // Strict match when local items only share legacy genre (e.g. grammar_in_action)
    const matching = page.data.filter(it => it.contentType === contentType);
    if (matching.length === 0) return [];
    const results = await Promise.all(
      matching.map(async item => {
        const { body } = await this.resolveBodyForItem(item);
        return { item, body };
      })
    );
    return results;
  }

  async getPublishedPoetry(
    targetLanguage: string,
    _explanationLanguage = 'en'
  ): Promise<DailyPoem[]> {
    const rows = await this.loadTypedDetails('poetry', targetLanguage);
    return rows
      .filter(({ body }) => Array.isArray(body.lines) || typeof body.narrative === 'string')
      .map(({ item, body }) => {
        const lines = Array.isArray(body.lines)
          ? body.lines.map(String)
          : [String(body.narrative || item.summary)];
        const fullText = lines.join('\n');
        return {
          id: item.id,
          title: item.title,
          author: 'Lexilume Editorial',
          learning_language: item.targetLanguage as Language,
          cefr_level: (item.cefrLevel === 'C2' ? 'C1' : item.cefrLevel) as CEFRLevel,
          excerpt: lines.slice(0, 2).join('\n'),
          full_text: fullText,
          cultural_context: String(
            body.cultural_context || body.interpretation || item.summary || ''
          ),
          translation: String(body.interpretation || item.summary || ''),
          published_at: item.publishedAt || new Date().toISOString(),
          is_active: true,
        };
      });
  }

  async getPublishedConversations(
    targetLanguage: string,
    _explanationLanguage = 'en'
  ): Promise<DailyConversation[]> {
    const rows = await this.loadTypedDetails('conversation', targetLanguage);
    return rows
      .filter(({ body }) => Array.isArray(body.dialogue) && body.dialogue.length > 0)
      .map(({ item, body }) => ({
        id: item.id,
        title: item.title,
        scenario: String(body.scenario || item.summary || item.title),
        learning_language: item.targetLanguage as Language,
        cefr_level: (item.cefrLevel === 'C2' ? 'C1' : item.cefrLevel) as CEFRLevel,
        dialogue: body.dialogue.map((t: any) => ({
          speaker: String(t.speaker || 'A'),
          line: String(t.line || t.text_target || ''),
          translation: t.translation ? String(t.translation) : undefined,
        })),
        cultural_context: String(item.summary || body.scenario || ''),
        published_at: item.publishedAt || new Date().toISOString(),
        is_active: true,
      }));
  }

  async getPublishedVocabularyEntries(
    targetLanguage: string,
    explanationLanguage = 'en'
  ): Promise<VocabularyEntry[]> {
    const rows = await this.loadTypedDetails('vocabulary', targetLanguage);
    return rows
      .filter(({ body }) => Boolean(body.lemma))
      .map(({ item, body }) => {
        const rawPos = String(body.part_of_speech || 'noun').toLowerCase();
        const pos: VocabularyPartOfSpeech = VALID_POS.includes(rawPos as VocabularyPartOfSpeech)
          ? (rawPos as VocabularyPartOfSpeech)
          : 'noun';
        const expLang = (item.explanationLanguage || explanationLanguage || 'en') as Language;
        const example =
          Array.isArray(body.example_sentences) && body.example_sentences[0]
            ? String(body.example_sentences[0])
            : String(body.lemma);
        return {
          id: `ai-vocab-${item.id}`,
          lemma: String(body.lemma),
          target_language: item.targetLanguage as Language,
          part_of_speech: pos,
          cefr_level: (item.cefrLevel === 'C2' ? 'C1' : item.cefrLevel) as CEFRLevel,
          translations: {
            [expLang]: String(body.definition || item.summary || ''),
          },
          definitions: {
            [expLang]: String(body.definition || item.summary || ''),
          },
          example_sentence_target: example,
          example_sentence_translations: {
            [expLang]: String(body.definition || ''),
          },
          topic: 'daily_life',
          collocations: Array.isArray(body.collocations) ? body.collocations.map(String) : undefined,
          attribution: {
            source_name: 'Lexilume AI Content Engine',
            source_url: 'https://lexilume.local',
            license_type: 'Original-Curated',
            attribution_text: 'Generated and approved via Lexilume Admin Review',
          },
        };
      });
  }

  async getPublishedGrammarNotes(
    targetLanguage: string,
    _explanationLanguage = 'en'
  ): Promise<GrammarRule[]> {
    const rows = await this.loadTypedDetails('grammar', targetLanguage);
    return rows
      .filter(({ body }) => Boolean(body.grammar_topic || body.explanation))
      .map(({ item, body }) => ({
        id: `ai-gram-${item.id}`,
        rule_code: `AI-GRAM-${item.id.toUpperCase()}`,
        language: item.targetLanguage as Language,
        cefr_level: (item.cefrLevel === 'C2' ? 'C1' : item.cefrLevel) as CEFRLevel,
        title: String(body.grammar_topic || item.title),
        category: 'grammar',
        explanation_markdown: String(body.explanation || item.summary || ''),
        structural_formula: String(body.formula || body.grammar_topic || item.title),
        examples: Array.isArray(body.examples)
          ? body.examples.map((ex: any) => ({
              target: String(ex.sentence || ex.target || ''),
              en: String(ex.translation || ex.note || ''),
              note: ex.note ? String(ex.note) : undefined,
            }))
          : [],
        common_errors: [],
        regional_notes: {},
        attribution: {
          source_name: 'Lexilume AI Content Engine',
          source_url: 'https://lexilume.local',
          license_type: 'Original-Curated',
          attribution_text: 'Generated and approved via Lexilume Admin Review',
        },
      }));
  }

  async getPublishedPracticeExercises(targetLanguage: string): Promise<ExerciseTemplate[]> {
    const rows = await this.loadTypedDetails('practice', targetLanguage);
    const out: ExerciseTemplate[] = [];
    for (const { item, body } of rows) {
      if (!Array.isArray(body.questions)) continue;
      body.questions.forEach((q: any, idx: number) => {
        if (!q?.prompt) return;
        const correct = String(q.correct || (Array.isArray(body.correct_answers) ? body.correct_answers[idx] : '') || '');
        if (!correct) return;
        const opts: string[] = Array.isArray(q.options) ? q.options.map(String) : [];
        const distractors = opts
          .filter((opt: string) => opt !== correct)
          .map((opt: string) => ({ text: opt, why_incorrect: 'Alternative option' }));
        out.push({
          id: `ai-ex-${item.id}-${idx + 1}`,
          curriculum_node_id: `ai-${item.cefrLevel}`,
          language: item.targetLanguage as Language,
          exercise_type: body.exercise_type === 'cloze' ? 'cloze' : 'multiple_choice',
          prompt: String(q.prompt),
          context_passage: String(body.instructions || item.summary || ''),
          acceptable_solutions: [correct],
          distractors,
          explanation:
            (Array.isArray(body.explanations) && body.explanations[idx]) ||
            String(body.instructions || 'Published AI practice item.'),
          difficulty: 2,
          attribution: {
            source_name: 'Lexilume AI Content Engine',
            source_url: 'https://lexilume.local',
            license_type: 'Original-Curated',
            attribution_text: 'Generated and approved via Lexilume Admin Review',
          },
        });
      });
    }
    return out;
  }

  async getPublishedCulturalArticles(targetLanguage?: string): Promise<CulturalArticle[]> {
    const rows = await this.loadTypedDetails('cultural_article', targetLanguage);
    return rows
      .filter(({ body }) => Boolean(body.article_body))
      .map(({ item, body }) => {
        const refs = Array.isArray(body.source_references) ? body.source_references : [];
        const firstRef = refs[0] || {};
        return {
          id: `ai-culture-${item.id}`,
          title: item.title,
          summary: item.summary || String(body.article_body).slice(0, 140),
          content_paragraphs: String(body.article_body)
            .split(/\n+/)
            .map(s => s.trim())
            .filter(Boolean),
          content_language: item.targetLanguage as Language,
          target_learning_language: item.targetLanguage as Language,
          origin_country: String(body.country || 'International'),
          origin_region: 'Global',
          topic: 'culture' as any,
          content_type: 'cultural_guide',
          cefr_level: (item.cefrLevel === 'C2' ? 'C1' : item.cefrLevel) as CEFRLevel,
          read_time_minutes: item.estimatedReadMinutes || 2,
          tags: ['ai-curated', item.targetLanguage],
          source_url: String(firstRef.url || 'https://lexilume.local'),
          publisher: String(firstRef.source_name || 'Lexilume Editorial'),
          published_at: item.publishedAt || new Date().toISOString(),
          license: 'Original-Curated',
          attribution_text: String(firstRef.source_name || 'Lexilume Editorial'),
        };
      });
  }

  async listDiscovery(
    query: string,
    targetLanguage: string,
    category?: string
  ): Promise<Array<Record<string, any>>> {
    if (!this.apiBase) return [];
    const params = new URLSearchParams({ targetLanguage });
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    try {
      const response = await fetch(`${this.apiBase}/discovery/search?${params.toString()}`);
      if (!response.ok) return [];
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    } catch {
      return [];
    }
  }
}

export const contentAccess = new ContentAccessService();
export { ContentAccessService };
