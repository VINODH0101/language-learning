import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { StorageService } from '../services/storage';
import { VocabularyService } from '../services/vocabularyService';
import { CultureService } from '../services/cultureService';
import { dailyContentService } from '../services/dailyContentService';
import { Language } from '../types';
import { VocabularyEntry } from '../types/vocabulary';
import { CulturalArticle } from '../types/culture';

function buildDynamicVocabBatch(lang: Language, count: number): VocabularyEntry[] {
  const sampleLemmaPrefix = lang === 'pt' ? 'termo' : lang === 'es' ? 'vocablo' : 'concept';
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    const lemma = `${sampleLemmaPrefix}${num}`;
    return {
      id: `live-${lang}-voc-${num}`,
      lemma,
      target_language: lang,
      part_of_speech: 'noun',
      cefr_level: 'A1',
      phonetic_ipa: `/sample-${num}/`,
      translations: {
        en: `en translation ${num}`,
        pt: `tradução pt ${num}`,
        es: `traducción es ${num}`,
      },
      definitions: {
        en: `Dynamic English definition for ${lemma} number ${num}.`,
        pt: `Definição dinâmica em português para ${lemma} número ${num}.`,
        es: `Definición dinámica en español para ${lemma} número ${num}.`,
      },
      example_sentence_target: `Este exemplo usa a palavra ${lemma} em contexto real hoje.`,
      example_sentence_translations: {
        en: `This example uses the word ${lemma} in real context today.`,
        pt: `Este exemplo usa a palavra ${lemma} em contexto real hoje.`,
        es: `Este ejemplo usa la palabra ${lemma} en contexto real hoy.`,
      },
      topic: 'culture',
      collocations: [`colocação ${lemma}`],
      attribution: {
        source_name: 'Lexilume Content Engine & Open APIs',
        source_url: 'https://www.wiktionary.org',
        license_type: 'CC-BY-SA-4.0',
        attribution_text: 'Generated via Content Engine and Wiktionary open APIs.',
      },
    };
  });
}

function buildLiveWikiArticle(lang: 'pt' | 'es' | 'en'): CulturalArticle {
  return {
    id: `live-wiki-${lang}-1`,
    title: lang === 'pt' ? 'Arquitetura e Literatura Lusófona' : lang === 'es' ? 'Patrimonio Histórico Hispánico' : 'Open Lexicon History',
    summary: 'Dynamic summary from Wikimedia REST API.',
    content_paragraphs: [
      'Authentic cultural reading passage loaded dynamically from the Wikimedia REST API under CC BY-SA 4.0 to support contextual comprehension practice.',
    ],
    content_language: lang,
    target_learning_language: lang,
    origin_country: lang === 'pt' ? 'Portugal' : lang === 'es' ? 'España' : 'Global',
    origin_region: lang === 'pt' ? 'Europe' : lang === 'es' ? 'Europe' : 'Global',
    topic: 'history',
    content_type: 'external_article',
    cefr_level: 'B1',
    read_time_minutes: 3,
    tags: ['Wikipedia', lang],
    image_url: `https://upload.wikimedia.org/wikipedia/commons/sample-${lang}.jpg`,
    publisher: 'Wikipedia',
    source_url: `https://${lang}.wikipedia.org/wiki/Sample_Cultural_Topic`,
    license: 'CC-BY-SA-4.0',
    attribution_text: 'Wikipedia (Wikimedia Foundation) — CC BY-SA 4.0',
    published_at: '2026-10-29T00:00:00Z',
  };
}

describe('ClientLessonGenerator', () => {
  beforeEach(async () => {
    localStorage.clear();
    VocabularyService.clearDynamicCatalog();
    CultureService.clearDynamicArticles();

    VocabularyService.setDynamicCatalog([
      ...buildDynamicVocabBatch('pt', 24),
      ...buildDynamicVocabBatch('es', 24),
      ...buildDynamicVocabBatch('en', 24),
    ]);

    CultureService.setDynamicArticles([
      buildLiveWikiArticle('pt'),
      buildLiveWikiArticle('es'),
      buildLiveWikiArticle('en'),
    ]);

    await dailyContentService.publishConversation({
      title: 'Encontro no Museu Municipal',
      scenario: 'Visiting a local museum exhibition.',
      learning_language: 'pt',
      cefr_level: 'A1',
      dialogue: [
        { speaker: 'Ana', line: 'Olá! A exposição de arte começa agora.', translation: 'Hello! The art exhibition starts now.' },
        { speaker: 'João', line: 'Ótimo, vamos visitar a galeria principal.', translation: 'Great, let us visit the main gallery.' },
      ],
      cultural_context: 'Museums across the Lusophone world.',
      country_name: 'Brasil',
      country_code: 'BR',
    });

    await dailyContentService.publishConversation({
      title: 'Visita a la Biblioteca Nacional',
      scenario: 'Asking for historical archives.',
      learning_language: 'es',
      cefr_level: 'A1',
      dialogue: [
        { speaker: 'Lucía', line: 'Buenos días, busco textos literarios.', translation: 'Good morning, I am looking for literary texts.' },
      ],
      cultural_context: 'Hispanic literary archives.',
      country_name: 'España',
      country_code: 'ES',
    });
  });

  afterEach(() => {
    VocabularyService.clearDynamicCatalog();
    CultureService.clearDynamicArticles();
  });

  it('starts empty when no dynamic or published content is loaded', () => {
    localStorage.clear();
    VocabularyService.clearDynamicCatalog();
    CultureService.clearDynamicArticles();

    const emptyLesson = ClientLessonGenerator.generateOrGetLesson('pt', '2026-11-01');
    expect(emptyLesson.section_2_vocabulary).toEqual([]);
    expect(emptyLesson.section_4_reading.passage_target).toBe('');
    expect(emptyLesson.section_5_conversation.dialogue).toEqual([]);
    expect(emptyLesson.section_9_exercises).toEqual([]);
  });

  it('generates a full Portuguese lesson payload with 12 sections from dynamic sources', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');

    expect(lesson).toBeDefined();
    expect(lesson.language).toBe('pt');
    expect(lesson.regional_variety).toBe('pt-BR');
    expect(lesson.cefr_level).toBe('A1');
    expect(lesson.section_1_objectives.length).toBeGreaterThan(0);
    expect(lesson.section_2_vocabulary.length).toBeGreaterThanOrEqual(12);
    expect(lesson.section_3_grammar).toBeDefined();
    expect(lesson.section_4_reading.passage_target.length).toBeGreaterThan(50);
    expect(lesson.section_5_conversation.dialogue.length).toBeGreaterThan(0);
    expect(lesson.section_6_speaking.prompt).toBeDefined();
    expect(lesson.section_7_writing.structural_guidelines.length).toBeGreaterThan(0);
    expect(lesson.section_8_listening.audio_source_url).toBeDefined();
    expect(lesson.section_9_exercises.length).toBeGreaterThan(0);
    expect(lesson.section_10_answer_keys.length).toBeGreaterThan(0);
    expect(lesson.section_11_review).toBeDefined();
    expect(lesson.section_12_further_resources.length).toBeGreaterThan(0);
    expect(Array.isArray(lesson.false_friend_alerts)).toBe(true);
  });

  it('generates Spanish daily lesson with appropriate variety', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson(
      {
        target_language: 'es',
        regional_variant: 'es-ES',
        cefr_level: 'C1',
        explanation_language: 'en',
      },
      '2026-10-29'
    );

    expect(lesson.language).toBe('es');
    expect(lesson.regional_variety).toBe('es-ES');
    expect(lesson.section_2_vocabulary.length).toBeGreaterThanOrEqual(12);
    expect(lesson.section_3_grammar.title).toContain('Subjuntivo');
  });

  it('caches generated lesson for the same day in localStorage', () => {
    const lesson1 = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');
    const lesson2 = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');

    expect(lesson1.curriculum_node_id).toBe(lesson2.curriculum_node_id);
    const stored = StorageService.getDailyLesson('pt', '2026-10-29');
    expect(stored).not.toBeNull();
    expect(stored?.lesson_date).toBe('2026-10-29');
  });

  it('initializes SRS items for presented vocabulary', () => {
    ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');
    const srsItems = StorageService.getSRSItems('pt');
    expect(srsItems.length).toBeGreaterThanOrEqual(12);
    expect(srsItems[0].mastery_status).toBe('presented');
  });

  it('supplies authentic Wikipedia reading section with attribution and metadata', () => {
    const lessonPt = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-30');
    expect(lessonPt.section_4_reading.provider).toBe('wikipedia');
    expect(lessonPt.section_4_reading.article_url).toContain('wikipedia.org');
    expect(lessonPt.section_4_reading.attribution.license_type).toBe('CC-BY-SA-4.0');
    expect(lessonPt.section_4_reading.thumbnail_url).toBeDefined();

    const lessonEs = ClientLessonGenerator.generateOrGetLesson('es', '2026-10-30');
    expect(lessonEs.section_4_reading.provider).toBe('wikipedia');
    expect(lessonEs.section_4_reading.article_url).toContain('wikipedia.org');
    expect(lessonEs.section_4_reading.attribution.license_type).toBe('CC-BY-SA-4.0');
  });

  it('dynamically rotates vocabulary, conversation scenario, and contextual exercises on consecutive calendar days', async () => {
    // Day 1 Portuguese
    const day1Pt = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');
    await dailyContentService.publishConversation({
      title: 'Debate Literário em Coimbra',
      scenario: 'Discussing contemporary prose.',
      learning_language: 'pt',
      cefr_level: 'A1',
      dialogue: [
        { speaker: 'Beatriz', line: 'Que romance leste esta semana?', translation: 'Which novel did you read this week?' },
      ],
      cultural_context: 'University traditions in Coimbra.',
      country_name: 'Portugal',
      country_code: 'PT',
    });
    const day2Pt = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-30');

    const day1PtVocabIds = new Set(day1Pt.section_2_vocabulary.map(v => v.id));
    const day2PtVocabIds = new Set(day2Pt.section_2_vocabulary.map(v => v.id));

    // Vocabulary lists must be distinct sets
    expect(day1Pt.section_2_vocabulary[0].id).not.toBe(day2Pt.section_2_vocabulary[0].id);
    const ptOverlap = [...day1PtVocabIds].filter(id => day2PtVocabIds.has(id));
    expect(ptOverlap.length).toBe(0);

    // Conversation scenarios reflect updated published edition
    expect(day1Pt.section_5_conversation.title).not.toBe(day2Pt.section_5_conversation.title);

    // Dynamic vocabulary cloze/definition exercises must be created targeting today's words
    expect(day1Pt.section_9_exercises.some(e => e.id.includes('dyn-vocab-cloze'))).toBe(true);
    expect(day1Pt.section_9_exercises.some(e => e.id.includes('dyn-vocab-def'))).toBe(true);
    expect(day2Pt.section_9_exercises.some(e => e.id.includes('dyn-vocab-cloze'))).toBe(true);

    // Day 1 & Day 2 Spanish
    const day1Es = ClientLessonGenerator.generateOrGetLesson('es', '2026-10-29');
    await dailyContentService.publishConversation({
      title: 'Tertulia en el Café Central',
      scenario: 'Talking about cinema and culture.',
      learning_language: 'es',
      cefr_level: 'A1',
      dialogue: [
        { speaker: 'Carlos', line: '¿Qué película viste anoche?', translation: 'What film did you watch last night?' },
      ],
      cultural_context: 'Madrid café tertulias.',
      country_name: 'España',
      country_code: 'ES',
    });
    const day2Es = ClientLessonGenerator.generateOrGetLesson('es', '2026-10-30');

    const day1EsVocabIds = new Set(day1Es.section_2_vocabulary.map(v => v.id));
    const day2EsVocabIds = new Set(day2Es.section_2_vocabulary.map(v => v.id));

    expect(day1Es.section_2_vocabulary[0].id).not.toBe(day2Es.section_2_vocabulary[0].id);
    const esOverlap = [...day1EsVocabIds].filter(id => day2EsVocabIds.has(id));
    expect(esOverlap.length).toBe(0);
    expect(day1Es.section_5_conversation.title).not.toBe(day2Es.section_5_conversation.title);

    // English Rotation across consecutive days
    const day1En = ClientLessonGenerator.generateOrGetLesson('en', '2026-10-29');
    const day2En = ClientLessonGenerator.generateOrGetLesson('en', '2026-10-30');

    const day1EnVocabIds = new Set(day1En.section_2_vocabulary.map(v => v.id));
    const day2EnVocabIds = new Set(day2En.section_2_vocabulary.map(v => v.id));

    expect(day1En.section_2_vocabulary[0].id).not.toBe(day2En.section_2_vocabulary[0].id);
    const enOverlap = [...day1EnVocabIds].filter(id => day2EnVocabIds.has(id));
    expect(enOverlap.length).toBe(0);
  });
});
