import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CultureService } from '../services/cultureService';
import { clearAllLocalLearningData } from '../services/localDb';
import { translations } from '../i18n/translations';
import { CulturalArticle } from '../types/culture';

const LIVE_CULTURE_ARTICLES: CulturalArticle[] = [
  {
    id: 'art_jp_pt_hanami',
    title: 'Hanami: A Contemplação das Flores de Cerejeira no Japão',
    summary: 'Como a primavera e a efemeridade da natureza inspiram a cultura japonesa.',
    content_paragraphs: [
      'A chegada da primavera traz o florescimento das árvores de sakura em todo o arquipélago japonês.',
    ],
    content_language: 'pt',
    target_learning_language: 'pt',
    origin_country: 'Japan',
    origin_region: 'Asia',
    topic: 'festivals',
    content_type: 'cultural_guide',
    cefr_level: 'B1',
    read_time_minutes: 4,
    tags: ['hanami', 'sakura', 'japao'],
    source_url: 'https://pt.wikipedia.org/wiki/Hanami',
    publisher: 'Wikimedia Foundation',
    published_at: '2026-10-01',
    license: 'CC-BY-SA-4.0',
    attribution_text: 'Wikipedia CC-BY-SA-4.0',
    glossary: { efemeridade: 'transience / fleetingness' },
  },
  {
    id: 'art_in_es_diwali',
    title: 'Diwali: El Festival de las Luces en la India',
    summary: 'Tradiciones luminosas, gastronomía y simbolismo cultural de Diwali.',
    content_paragraphs: [
      'Diwali celebra el triunfo simbólico de la luz sobre la oscuridad en comunidades de toda la India.',
    ],
    content_language: 'es',
    target_learning_language: 'es',
    origin_country: 'India',
    origin_region: 'Asia',
    topic: 'festivals',
    content_type: 'cultural_guide',
    cefr_level: 'C1',
    read_time_minutes: 5,
    tags: ['diwali', 'india', 'luces'],
    source_url: 'https://es.wikipedia.org/wiki/Diwali',
    publisher: 'Wikimedia Foundation',
    published_at: '2026-10-02',
    license: 'CC-BY-SA-4.0',
    attribution_text: 'Wikipedia CC-BY-SA-4.0',
    comprehension_questions: [
      {
        question: '¿Qué simboliza principalmente el festival de Diwali?',
        options: ['El triunfo de la luz', 'La llegada del invierno'],
        correct_index: 0,
        explanation: 'Representa la victoria simbólica de la luz.',
      },
      {
        question: '¿Dónde se celebra tradicionalmente?',
        options: ['En toda la India', 'Solo en las montañas'],
        correct_index: 0,
        explanation: 'Se celebra en todo el país.',
      },
    ],
  },
  {
    id: 'art_br_en_capoeira',
    title: 'Capoeira and Afro-Brazilian Cultural Heritage in Salvador',
    summary: 'Afro-Brazilian martial art blending rhythm, history, and music with berimbau.',
    content_paragraphs: [
      'Guided by the berimbau, practitioners turn movement and song into living historical memory.',
    ],
    content_language: 'en',
    target_learning_language: 'en',
    origin_country: 'Brazil',
    origin_region: 'Americas',
    topic: 'music',
    content_type: 'cultural_guide',
    cefr_level: 'A2',
    read_time_minutes: 3,
    tags: ['capoeira', 'berimbau', 'brazil'],
    source_url: 'https://en.wikipedia.org/wiki/Capoeira',
    publisher: 'Wikimedia Foundation',
    published_at: '2026-10-03',
    license: 'CC-BY-SA-4.0',
    attribution_text: 'Wikipedia CC-BY-SA-4.0',
  },
  {
    id: 'art_ng_en_yoruba',
    title: 'Yoruba Oral Storytelling and Musical Proverbs in Nigeria',
    summary: 'How talking drums preserve community memory across generations.',
    content_paragraphs: [
      'Across western Nigeria, Yoruba poetry weaves tone, proverb, and rhythm together.',
    ],
    content_language: 'en',
    target_learning_language: 'en',
    origin_country: 'Nigeria',
    origin_region: 'Africa',
    topic: 'literature',
    content_type: 'cultural_guide',
    cefr_level: 'B1',
    read_time_minutes: 4,
    tags: ['yoruba', 'nigeria', 'music'],
    source_url: 'https://en.wikipedia.org/wiki/Yoruba_music',
    publisher: 'Wikimedia Foundation',
    published_at: '2026-10-04',
    license: 'CC-BY-SA-4.0',
    attribution_text: 'Wikipedia CC-BY-SA-4.0',
  },
  {
    id: 'art_pt_pt_azulejos',
    title: 'A Arte dos Azulejos Portugueses em Lisboa',
    summary: 'Fachadas históricas e narrativa visual em cerâmica.',
    content_paragraphs: ['Os azulejos decoram igrejas e estações em Portugal desde o século XVI.'],
    content_language: 'pt',
    target_learning_language: 'pt',
    origin_country: 'Portugal',
    origin_region: 'Europe',
    topic: 'art',
    content_type: 'cultural_guide',
    cefr_level: 'A2',
    read_time_minutes: 3,
    tags: ['azulejos', 'lisboa'],
    source_url: 'https://pt.wikipedia.org/wiki/Azulejo',
    publisher: 'Wikimedia Foundation',
    published_at: '2026-10-05',
    license: 'CC-BY-SA-4.0',
    attribution_text: 'Wikipedia CC-BY-SA-4.0',
  },
  {
    id: 'art_mx_es_gastronomia',
    title: 'Patrimonio Culinario y Mercados de México',
    summary: 'Sabores ancestrales y biodiversidad agrícola mesoamericana.',
    content_paragraphs: ['El maíz, el cacao y los chiles forman la base de la cocina mexicana.'],
    content_language: 'es',
    target_learning_language: 'es',
    origin_country: 'Mexico',
    origin_region: 'Americas',
    topic: 'food',
    content_type: 'cultural_guide',
    cefr_level: 'C1',
    read_time_minutes: 5,
    tags: ['mexico', 'gastronomia'],
    source_url: 'https://es.wikipedia.org/wiki/Gastronom%C3%ADa_de_M%C3%A9xico',
    publisher: 'Wikimedia Foundation',
    published_at: '2026-10-06',
    license: 'CC-BY-SA-4.0',
    attribution_text: 'Wikipedia CC-BY-SA-4.0',
  },
];

describe('Worldwide Culture Discovery & Filtering Engine (cultureService.ts)', () => {
  beforeEach(async () => {
    await clearAllLocalLearningData();
    CultureService.setDynamicArticles(LIVE_CULTURE_ARTICLES);
  });

  afterEach(() => {
    CultureService.clearDynamicArticles();
  });

  it('starts strictly empty before live articles are fetched (zero static seeds)', () => {
    CultureService.clearDynamicArticles();
    expect(CultureService.getAllArticles()).toHaveLength(0);
    expect(CultureService.getAvailableCountries()).toHaveLength(0);
  });

  it('retrieves live cultural catalog entries covering multiple continents', () => {
    const all = CultureService.getAllArticles();
    expect(all.length).toBeGreaterThanOrEqual(6);

    const countries = CultureService.getAvailableCountries();
    expect(countries).toContain('Japan');
    expect(countries).toContain('India');
    expect(countries).toContain('Brazil');
    expect(countries).toContain('Mexico');
    expect(countries).toContain('Portugal');
    expect(countries).toContain('Nigeria');
  });

  it('filters Japanese culture written in authentic Portuguese (PT immersion for international learners)', () => {
    const results = CultureService.filterArticles({
      origin_country: 'Japan',
      content_language: 'pt',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const article = results[0];
    expect(article.origin_country).toBe('Japan');
    expect(article.content_language).toBe('pt');
    expect(article.title).toContain('Hanami');
    expect(article.content_paragraphs[0]).toContain('sakura');
    expect(article.glossary?.['efemeridade']).toBeDefined();
  });

  it('filters Indian culture written in authentic Spanish (ES immersion for learners)', () => {
    const results = CultureService.filterArticles({
      origin_country: 'India',
      content_language: 'es',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const article = results[0];
    expect(article.origin_country).toBe('India');
    expect(article.content_language).toBe('es');
    expect(article.title).toContain('Diwali');
    expect(article.comprehension_questions?.length).toBeGreaterThanOrEqual(2);
  });

  it('filters Brazilian culture written in authentic English (EN track immersion)', () => {
    const results = CultureService.filterArticles({
      origin_country: 'Brazil',
      content_language: 'en',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const article = results[0];
    expect(article.origin_country).toBe('Brazil');
    expect(article.content_language).toBe('en');
    expect(article.title).toContain('Capoeira');
    expect(article.summary).toContain('Afro-Brazilian');
  });

  it('CRITICAL: NEVER silently substitutes unrelated English when a filter yields no results', () => {
    const results = CultureService.filterArticles({
      origin_country: 'Japan',
      topic: 'food',
      search_query: 'non_existent_unmatched_term_xyz_123',
    });
    expect(results).toHaveLength(0);
  });

  it('filters accurately by CEFR proficiency levels (A1 through C1)', () => {
    const c1Articles = CultureService.filterArticles({ cefr_level: 'C1' });
    expect(c1Articles.length).toBeGreaterThanOrEqual(2);
    expect(c1Articles.every(a => a.cefr_level === 'C1')).toBe(true);

    const b1Articles = CultureService.filterArticles({ cefr_level: 'B1' });
    expect(b1Articles.length).toBeGreaterThanOrEqual(2);
    expect(b1Articles.every(a => a.cefr_level === 'B1')).toBe(true);

    const a2Articles = CultureService.filterArticles({ cefr_level: 'A2' });
    expect(a2Articles.length).toBeGreaterThanOrEqual(2);
    expect(a2Articles.every(a => a.cefr_level === 'A2')).toBe(true);
  });

  it('supports full-text search across titles, summaries, tags, and origin countries', () => {
    const results = CultureService.filterArticles({ search_query: 'berimbau' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].origin_country).toBe('Brazil');

    const yorubaResults = CultureService.filterArticles({ search_query: 'yoruba' });
    expect(yorubaResults.length).toBeGreaterThanOrEqual(1);
    expect(yorubaResults[0].origin_country).toBe('Nigeria');
  });

  it('manages local bookmarks reliably in IndexedDB/Dexie', async () => {
    const userId = 'learner_guest_01';
    const all = CultureService.getAllArticles();
    const article = all[0];

    expect(await CultureService.isBookmarked(userId, article.id)).toBe(false);
    expect(await CultureService.toggleBookmark(userId, article)).toBe(true);
    expect(await CultureService.isBookmarked(userId, article.id)).toBe(true);

    const bookmarks = await CultureService.getUserBookmarks(userId);
    expect(bookmarks.length).toBe(1);
    expect(bookmarks[0].article_id).toBe(article.id);

    expect(await CultureService.toggleBookmark(userId, article)).toBe(false);
    expect(await CultureService.isBookmarked(userId, article.id)).toBe(false);
  });

  it('verifies that all internationalization keys for cultural discovery exist across en, pt, es', () => {
    const langs = ['en', 'pt', 'es'] as const;
    const requiredKeys = [
      'nav_explore',
      'explore_title',
      'explore_subtitle',
      'explore_tab_discover',
      'explore_tab_bookmarks',
      'explore_search_placeholder',
      'explore_filter_origin',
      'explore_filter_region',
      'explore_filter_content_lang',
      'explore_filter_level',
      'explore_filter_topic',
      'explore_empty_title',
      'explore_empty_desc',
      'explore_empty_reset',
      'explore_read_article',
      'explore_bookmark_save',
      'explore_bookmark_remove',
      'explore_quiz_title',
      'explore_quiz_correct',
      'explore_glossary_title',
      'explore_source_attribution',
    ] as const;

    for (const lang of langs) {
      const dict = translations[lang];
      for (const key of requiredKeys) {
        expect(dict[key], `Missing key "${key}" in translation "${lang}"`).toBeDefined();
        expect(dict[key].length).toBeGreaterThan(0);
      }
    }
  });
});
