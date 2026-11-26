import {
  CourseConfig,
  DailyLessonPayload,
  Language,
  VocabularyItem,
  GrammarRule,
  ExerciseTemplate,
  Attribution,
  StudyMode,
} from '../types';
import {
  ptCurriculum,
  esCurriculum,
  enCurriculum,
} from '../data/seedData';
import { enforceRegionalVariety, enforceDecoupledLanguageMatrix } from '../lib/languages/languageMatrix';
import { StorageService } from './storage';
import { SRSService } from './srs';
import { VocabularyService } from './vocabularyService';
import { CultureService } from './cultureService';
import { dailyContentService } from './dailyContentService';
import { contentAccess } from './contentAccess';
import { getLanguagePedagogy } from './contentEngine/languagePedagogy';

function getDateDayNumber(dateStr: string, salt: string = ''): number {
  const d = new Date(dateStr + 'T00:00:00Z');
  const rawDays = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
  const days = Number.isFinite(rawDays) ? rawDays : 0;
  let hash = 0;
  for (let i = 0; i < salt.length; i++) {
    hash = (hash * 31 + salt.charCodeAt(i)) % 10000;
  }
  return Math.abs(days + hash);
}

const EMPTY_ATTRIBUTION: Attribution = {
  source_name: 'Lexilume Content Engine & Open APIs',
  source_url: 'https://github.com/VINODH0101/language-learning',
  license_type: 'CC-BY-SA-4.0',
  attribution_text: 'Generated via Lexilume AI Content Engine and open linguistic APIs.',
};

export interface LiveLessonResources {
  vocabulary?: VocabularyItem[];
  grammarRule?: GrammarRule;
  readingArticle?: {
    title: string;
    passage_target: string;
    passage_en?: string;
    passage_pt?: string;
    passage_es?: string;
    glossary?: Record<string, string>;
    comprehension_questions?: Array<{
      question: string;
      options: string[];
      correct_option_index: number;
      explanation: string;
    }>;
    attribution: Attribution;
    article_url?: string;
    thumbnail_url?: string;
    topic_category?: string;
    provider?: 'wikipedia' | 'curated';
    article_id?: string;
  };
  exercises?: ExerciseTemplate[];
}

export class ClientLessonGenerator {
  /**
   * Resolves a daily lesson synchronously from structural CEFR outlines plus any
   * dynamically fetched/published Content Engine & Open API data currently loaded.
   * Zero static sample fixtures.
   */
  public static generateOrGetLesson(
    configOrLang: CourseConfig | Language = 'pt',
    dateStr?: string,
    liveResources?: LiveLessonResources
  ): DailyLessonPayload {
    const lessonDate = dateStr || new Date().toISOString().split('T')[0];

    const config: CourseConfig =
      typeof configOrLang === 'string'
        ? {
            target_language: configOrLang,
            regional_variant: enforceRegionalVariety(configOrLang, undefined),
            cefr_level: 'A1',
            explanation_language: configOrLang === 'en' ? 'pt' : 'en',
          }
        : {
            ...configOrLang,
            regional_variant: enforceRegionalVariety(
              configOrLang.target_language,
              configOrLang.regional_variant
            ),
          };

    const decoupled = enforceDecoupledLanguageMatrix({
      learningLanguage: config.target_language,
      regionalVariety: config.regional_variant,
      explanationLanguage: config.explanation_language,
    });
    config.regional_variant = decoupled.regionalVariety;
    config.explanation_language = decoupled.explanationLanguage;

    const { target_language, regional_variant, cefr_level, explanation_language } = config;

    // Return cached daily lesson only if it matches configuration AND contains populated resources (unless none supplied)
    const existing = StorageService.getDailyLesson(target_language, lessonDate);
    if (
      !liveResources &&
      existing &&
      existing.regional_variety === regional_variant &&
      (!existing.explanation_language || existing.explanation_language === explanation_language)
    ) {
      return existing;
    }

    const settings = StorageService.getSettings();
    const track = StorageService.getTrackState(target_language);

    // 1. Structural CEFR Curriculum Outline selection
    const curriculum =
      target_language === 'pt'
        ? ptCurriculum
        : target_language === 'es'
        ? esCurriculum
        : enCurriculum;

    const compatibleNodes = curriculum.filter(
      n => n.regional_relevance === 'all' || n.regional_relevance === regional_variant
    );
    const levelNodes = compatibleNodes.filter(n => n.cefr_level === cefr_level);
    const poolForSelection = levelNodes.length > 0 ? levelNodes : compatibleNodes;

    const uncompleted = poolForSelection.filter(
      n => !track.completed_curriculum_node_ids.includes(n.id)
    );
    const currentNode =
      uncompleted.length > 0
        ? uncompleted[0]
        : poolForSelection[poolForSelection.length - 1] ||
          curriculum[0] || {
            id: `${target_language}-${cefr_level.toLowerCase()}-node`,
            language: target_language,
            cefr_level,
            sequence_order: 1,
            title: `${target_language.toUpperCase()} ${cefr_level}`,
            slug: `${target_language}-${cefr_level.toLowerCase()}`,
            skill_category: 'grammar' as const,
            can_do_statement: `CEFR ${cefr_level}`,
            description: `${target_language.toUpperCase()} structural curriculum unit`,
            regional_relevance: 'all' as const,
            prerequisite_node_id: null,
            is_consolidation_review: false,
          };

    // 2. Live/Generated Vocabulary (from VocabularyService + passed resources)
    const vocabFromService: VocabularyItem[] = VocabularyService.getVocabulary({
      target_language,
    }).map(v => ({
      id: v.id,
      language: v.target_language,
      lemma: v.lemma,
      part_of_speech: v.part_of_speech,
      cefr_level: v.cefr_level,
      definition_en: v.definitions.en || v.translations.en || v.lemma,
      definition_pt: v.definitions.pt || v.translations.pt,
      definition_es: v.definitions.es || v.translations.es,
      definition_target:
        v.definitions[explanation_language as Language] ||
        v.definitions[target_language] ||
        v.definitions.en ||
        v.translations.en ||
        v.lemma,
      phonetic_ipa: v.phonetic_ipa,
      regional_tags: ['all'],
      example_sentence_target: v.example_sentence_target,
      example_sentence_en: v.example_sentence_translations.en || '',
      example_sentence_pt: v.example_sentence_translations.pt,
      example_sentence_es: v.example_sentence_translations.es,
      collocations: v.collocations || [],
      attribution: v.attribution,
    }));

    const vocabularyPool: VocabularyItem[] = [
      ...(liveResources?.vocabulary || []),
      ...vocabFromService,
    ];

    const levelVocab = vocabularyPool.filter(v => v.cefr_level === cefr_level);
    const vocabSelection = [...levelVocab];
    if (vocabSelection.length < 12) {
      for (const v of vocabularyPool) {
        if (!vocabSelection.some(sel => sel.id === v.id)) {
          vocabSelection.push(v);
        }
      }
    }

    const poolLength = vocabSelection.length;
    const daySeed = getDateDayNumber(lessonDate, target_language);
    const startIndex = poolLength > 0 ? (daySeed * 12) % poolLength : 0;
    const vocabItems: VocabularyItem[] = [];
    for (let i = 0; i < Math.min(12, poolLength); i++) {
      const v = vocabSelection[(startIndex + i) % poolLength];
      const def =
        explanation_language === 'en'
          ? v.definition_en
          : explanation_language === 'pt'
          ? v.definition_pt || v.definition_target || v.definition_en
          : v.definition_es || v.definition_target || v.definition_en;
      vocabItems.push({
        ...v,
        definition_target: def,
      });
    }

    // 3. Structural / Published Grammar Rule
    const pedagogy = getLanguagePedagogy(target_language);
    const grammarRule: GrammarRule = liveResources?.grammarRule || {
      id: `grammar-${currentNode.id}`,
      rule_code: currentNode.id.toUpperCase(),
      language: target_language,
      cefr_level: currentNode.cefr_level,
      title: currentNode.title,
      category: 'grammar',
      explanation_markdown: currentNode.description || currentNode.can_do_statement,
      structural_formula: pedagogy.keyPedagogicalPillars[0] || currentNode.title,
      examples: vocabItems.slice(0, 2).map(v => ({
        target: v.example_sentence_target,
        en: v.example_sentence_en || v.lemma,
        pt: v.example_sentence_pt,
        es: v.example_sentence_es,
        note: `${v.lemma} (${v.part_of_speech})`,
      })),
      common_errors: [],
      regional_notes: {
        [regional_variant]: `${pedagogy.displayName} — ${regional_variant}`,
      },
      attribution: EMPTY_ATTRIBUTION,
    };

    // 4. Reading section from live Content Engine / Wikipedia / CultureService cache
    const cachedCultureArticles = CultureService.filterArticles({
      content_language: target_language,
    });
    const selectedCulture =
      cachedCultureArticles.length > 0
        ? cachedCultureArticles[getDateDayNumber(lessonDate, 'reading') % cachedCultureArticles.length]
        : undefined;

    const readingSection = liveResources?.readingArticle
      ? {
          title: liveResources.readingArticle.title,
          passage_target: liveResources.readingArticle.passage_target,
          passage_en: liveResources.readingArticle.passage_en || '',
          passage_pt: liveResources.readingArticle.passage_pt,
          passage_es: liveResources.readingArticle.passage_es,
          glossary: liveResources.readingArticle.glossary || {},
          comprehension_questions: liveResources.readingArticle.comprehension_questions || [],
          attribution: liveResources.readingArticle.attribution,
          article_url: liveResources.readingArticle.article_url,
          thumbnail_url: liveResources.readingArticle.thumbnail_url,
          topic_category: liveResources.readingArticle.topic_category,
          provider: liveResources.readingArticle.provider,
          article_id: liveResources.readingArticle.article_id,
        }
      : selectedCulture
      ? {
          title: selectedCulture.title,
          passage_target: selectedCulture.content_paragraphs.join('\n\n'),
          passage_en: selectedCulture.content_translation?.join('\n\n') || selectedCulture.summary,
          glossary: selectedCulture.glossary || {},
          comprehension_questions: (selectedCulture.comprehension_questions || []).map(q => ({
            question: q.question,
            options: q.options,
            correct_option_index: q.correct_index,
            explanation: q.explanation,
          })),
          attribution: {
            source_name: selectedCulture.publisher,
            source_url: selectedCulture.source_url,
            license_type: selectedCulture.license,
            attribution_text: selectedCulture.attribution_text,
          },
          article_url: selectedCulture.source_url,
          thumbnail_url: selectedCulture.image_url,
          topic_category: selectedCulture.topic,
          provider: (selectedCulture.publisher.includes('Wikipedia') ? 'wikipedia' : 'curated') as 'wikipedia' | 'curated',
          article_id: selectedCulture.id,
        }
      : {
          title: currentNode.title,
          passage_target: '',
          passage_en: '',
          glossary: {},
          comprehension_questions: [],
          attribution: EMPTY_ATTRIBUTION,
          provider: 'curated' as const,
          article_id: '',
        };

    // 5. Daily Conversation from published DailyContentService
    const activeConvo = dailyContentService.getDailyConversation(
      target_language,
      explanation_language,
      cefr_level
    );

    const dialogueLines = activeConvo
      ? activeConvo.dialogue.map(turn => ({
          speaker: turn.speaker,
          line: turn.line,
          translation: turn.translation,
          translation_pt: target_language === 'pt' ? turn.line : turn.translation,
          translation_es: target_language === 'es' ? turn.line : turn.translation,
        }))
      : [];

    const convAttribution: Attribution = activeConvo
      ? {
          source_name: 'Lexilume Daily Conversation Studio',
          source_url: 'https://github.com/VINODH0101/language-learning',
          license_type: 'Original-Curated',
          attribution_text: activeConvo.cultural_context || activeConvo.scenario,
        }
      : EMPTY_ATTRIBUTION;

    // 6. Exercises (published exercises + dynamic vocabulary exercises built from live vocab)
    const dynamicVocabExercises: ExerciseTemplate[] = [];
    if (vocabItems.length >= 2) {
      const w0 = vocabItems[0];
      const distractors0 = vocabItems
        .filter(v => v.id !== w0.id)
        .slice(0, 3)
        .map(v => ({
          text: v.lemma,
          why_incorrect: `${v.lemma}: ${v.definition_target || v.definition_en}`,
        }));
      const blanked = w0.example_sentence_target
        ? w0.example_sentence_target.replace(new RegExp(`\\b${w0.lemma}\\b`, 'i'), '_____')
        : '_____';
      dynamicVocabExercises.push({
        id: `dyn-vocab-cloze-${target_language}-${w0.id}-${lessonDate}`,
        curriculum_node_id: currentNode.id,
        language: target_language,
        exercise_type: 'cloze',
        prompt: currentNode.title,
        context_passage: blanked === w0.example_sentence_target ? `${blanked} [_____]` : blanked,
        acceptable_solutions: [w0.lemma],
        distractors: distractors0,
        explanation: `${w0.lemma}: ${w0.definition_target || w0.definition_en}`,
        hint: w0.phonetic_ipa ? `IPA: ${w0.phonetic_ipa}` : undefined,
        difficulty: 2,
        attribution: w0.attribution,
      });

      const w1 = vocabItems[1];
      const distractors1 = vocabItems
        .filter(v => v.id !== w1.id)
        .slice(0, 3)
        .map(v => ({
          text: v.lemma,
          why_incorrect: `${v.lemma}: ${v.definition_target || v.definition_en}`,
        }));
      dynamicVocabExercises.push({
        id: `dyn-vocab-def-${target_language}-${w1.id}-${lessonDate}`,
        curriculum_node_id: currentNode.id,
        language: target_language,
        exercise_type: 'multiple_choice',
        prompt: w1.definition_target || w1.definition_en,
        acceptable_solutions: [w1.lemma],
        distractors: distractors1,
        explanation: `${w1.lemma}: ${w1.example_sentence_target}`,
        hint: w1.collocations?.[0],
        difficulty: 2,
        attribution: w1.attribution,
      });
    }

    const exercisesList: ExerciseTemplate[] = [
      ...(liveResources?.exercises || []),
      ...dynamicVocabExercises,
    ];

    const exerciseItems = exercisesList.map(tmpl => {
      const allOpts =
        tmpl.distractors && tmpl.distractors.length > 0
          ? [tmpl.acceptable_solutions[0], ...tmpl.distractors.map(d => d.text)]
          : undefined;
      const sortedOpts = allOpts ? [...allOpts].sort((a, b) => a.localeCompare(b)) : undefined;
      const distractorMap: Record<string, string> = {};
      tmpl.distractors?.forEach(d => {
        distractorMap[d.text] = d.why_incorrect;
      });
      return {
        id: tmpl.id,
        exercise_type: tmpl.exercise_type,
        prompt: tmpl.prompt,
        context_passage: tmpl.context_passage,
        options: sortedOpts,
        hint: tmpl.hint,
        distractor_explanations: distractorMap,
      };
    });

    const answerKeys = exercisesList.map(tmpl => {
      const distractorMap: Record<string, string> = {};
      tmpl.distractors?.forEach(d => {
        distractorMap[d.text] = d.why_incorrect;
      });
      return {
        exercise_id: tmpl.id,
        acceptable_solutions: tmpl.acceptable_solutions,
        explanation: tmpl.explanation,
        distractor_feedback: distractorMap,
      };
    });

    // 7. Spaced Repetition due items
    const userSRS = StorageService.getSRSItems(target_language);
    const dueSRS = userSRS.filter(s => s.next_review_date <= lessonDate);
    const dueVocabIds = new Set(dueSRS.map(s => s.vocabulary_item_id));
    const dueVocab = vocabularyPool.filter(v => dueVocabIds.has(v.id));

    const speakingPrompt =
      target_language === 'en'
        ? `Oral Presentation (${cefr_level}): Speak on '${currentNode.title}'.`
        : target_language === 'pt'
        ? `Apresentação oral (${cefr_level}): Discorra sobre '${currentNode.title}'.`
        : `Producción oral (${cefr_level}): Exponga sobre '${currentNode.title}'.`;

    const writingPrompt =
      target_language === 'en'
        ? `Written Production (${cefr_level}): Write about '${currentNode.title}'.`
        : target_language === 'pt'
        ? `Produção escrita (${cefr_level}): Redija um texto sobre '${currentNode.title}'.`
        : `Producción escrita (${cefr_level}): Redacte un texto sobre '${currentNode.title}'.`;

    const listeningTasksByExplanation: Record<'en' | 'pt' | 'es', string[]> = {
      en: [
        'Listen attentively once for the general meaning before checking the transcript.',
        'Note key expressions and regional pronunciation cues.',
      ],
      pt: [
        'Escute atentamente uma vez para captar o sentido geral antes de ler a transcrição.',
        'Anote expressões-chave e marcas de pronúncia regional.',
      ],
      es: [
        'Escuche atentamente una vez para captar el sentido general antes de leer la transcripción.',
        'Anote expresiones clave y rasgos de pronunciación regional.',
      ],
    };

    const speakingQuestionsByTarget: Record<string, string[]> = {
      en: [`Summarize the main point of "${currentNode.title}" in your own words.`],
      pt: [`Resuma a ideia principal de "${currentNode.title}" com suas próprias palavras.`],
      es: [`Resume la idea principal de "${currentNode.title}" con tus propias palabras.`],
    };

    const connectorsByTarget: Record<string, string[]> = {
      en: ['Nevertheless', 'Furthermore', 'Consequently', 'In contrast'],
      pt: ['Não obstante', 'Além disso', 'Portanto', 'Por outro lado'],
      es: ['No obstante', 'Además', 'Por consiguiente', 'Sin embargo'],
    };

    const studyMode: StudyMode = settings.study_mode;
    const estimatedMinutes = studyMode === 'compact' ? 20 : 50;
    const lessonId = `lesson-${settings.user_id}-${target_language}-${lessonDate}`;

    const lesson: DailyLessonPayload = {
      lesson_id: lessonId,
      lesson_date: lessonDate,
      language: target_language,
      regional_variety: regional_variant,
      explanation_language,
      cefr_level: currentNode.cefr_level,
      curriculum_node_id: currentNode.id,
      curriculum_topic_title: currentNode.title,
      study_mode: studyMode,
      estimated_study_minutes: estimatedMinutes,
      section_1_objectives: [
        {
          category: currentNode.skill_category,
          can_do_statement: currentNode.can_do_statement,
          target_competency: `CEFR ${currentNode.cefr_level}: ${currentNode.title}`,
        },
      ],
      section_2_vocabulary: vocabItems,
      section_3_grammar: grammarRule,
      section_4_reading: readingSection,
      section_5_conversation: {
        title: activeConvo?.title || currentNode.title,
        context: activeConvo?.scenario || currentNode.description,
        dialogue: dialogueLines,
        pragmatic_notes: activeConvo?.cultural_context
          ? [activeConvo.cultural_context, `Register: ${regional_variant}`]
          : [],
        attribution: convAttribution,
      },
      section_6_speaking: {
        prompt: speakingPrompt,
        guiding_questions: speakingQuestionsByTarget[target_language] || [],
        suggested_phrases: dialogueLines.slice(0, 3).map(d => d.line),
        suggested_phrases_translations: {},
        model_pronunciation_guide: pedagogy.orthographicNotes,
        target_duration_minutes: 10,
      },
      section_7_writing: {
        prompt: writingPrompt,
        genre_register: `CEFR ${cefr_level}`,
        structural_guidelines: [currentNode.can_do_statement],
        evaluation_criteria: [grammarRule.structural_formula],
        suggested_connectors: connectorsByTarget[target_language] || pedagogy.keyPedagogicalPillars.slice(0, 4),
        target_word_count: 160,
      },
      section_8_listening: {
        title: `${currentNode.title} (${cefr_level})`,
        audio_source_url: '',
        audio_player_notes: 'Web Speech API synthesis available.',
        transcript_target: readingSection.passage_target,
        comprehension_tasks:
          listeningTasksByExplanation[explanation_language as 'en' | 'pt' | 'es'] ||
          listeningTasksByExplanation.en,
        attribution: readingSection.attribution,
      },
      section_9_exercises: exerciseItems,
      section_10_answer_keys: answerKeys,
      section_11_review: {
        due_vocabulary_reviews: dueVocab,
        consolidated_grammar_rules: [grammarRule],
        review_strategy_note: 'Review saved flashcards via SM-2 spaced repetition.',
      },
      section_12_further_resources: [
        {
          title: 'Wiktionary Open Lexicon',
          resource_type: 'article',
          url: `https://${target_language}.wiktionary.org`,
          description: 'Open linguistic reference under CC-BY-SA 4.0.',
        },
        {
          title: 'Tatoeba Bilingual Open Corpus',
          resource_type: 'audio',
          url: 'https://tatoeba.org',
          description: 'Open corpus example sentences under CC-BY 2.0 FR.',
        },
      ],
      false_friend_alerts: [],
      attributions: [grammarRule.attribution, readingSection.attribution, convAttribution],
    };

    // Initialize SRS state only for live/published vocabulary present in this lesson
    vocabItems.forEach(v => {
      const existingSRS = userSRS.find(s => s.vocabulary_item_id === v.id);
      if (!existingSRS) {
        const init = SRSService.createInitialState(v.id, target_language, lessonDate);
        StorageService.saveSRSItem(init);
        if (!track.presented_vocabulary_ids.includes(v.id)) {
          track.presented_vocabulary_ids.push(v.id);
        }
      }
    });

    if (
      vocabItems.length > 0 ||
      readingSection.passage_target.length > 0 ||
      dialogueLines.length > 0 ||
      exerciseItems.length > 0
    ) {
      StorageService.saveDailyLesson(lesson);
    }
    StorageService.saveTrackState(track);

    return lesson;
  }

  /**
   * Asynchronously hydrates the lesson from live AI Content Engine items and Open APIs
   * (Wikipedia, Wiktionary/FreeDictionary/Dicionário Aberto, Tatoeba), caching in Dexie/localStorage.
   */
  public static async generateOrFetchDailyLesson(
    configOrLang: CourseConfig | Language = 'pt',
    dateStr?: string
  ): Promise<DailyLessonPayload> {
    const targetLang: Language =
      typeof configOrLang === 'string' ? configOrLang : configOrLang.target_language;
    const expLang: Language =
      typeof configOrLang === 'string'
        ? targetLang === 'en'
          ? 'pt'
          : 'en'
        : configOrLang.explanation_language;

    await Promise.allSettled([
      VocabularyService.loadLiveCatalog(targetLang, expLang),
      CultureService.loadLiveArticles(targetLang),
    ]);

    const [pubVocab, pubGrammar, pubExercises] = await Promise.all([
      contentAccess.getPublishedVocabularyEntries(targetLang, expLang).catch(() => []),
      contentAccess.getPublishedGrammarNotes(targetLang, expLang).catch(() => []),
      contentAccess.getPublishedPracticeExercises(targetLang).catch(() => []),
    ]);

    const mappedVocab: VocabularyItem[] = pubVocab.map(v => ({
      id: v.id,
      language: v.target_language,
      lemma: v.lemma,
      part_of_speech: v.part_of_speech,
      cefr_level: v.cefr_level,
      definition_en: v.definitions.en || v.translations.en || v.lemma,
      definition_pt: v.definitions.pt || v.translations.pt,
      definition_es: v.definitions.es || v.translations.es,
      definition_target:
        v.definitions[expLang] || v.definitions.en || v.translations.en || v.lemma,
      phonetic_ipa: v.phonetic_ipa,
      regional_tags: ['all'],
      example_sentence_target: v.example_sentence_target,
      example_sentence_en: v.example_sentence_translations.en || '',
      example_sentence_pt: v.example_sentence_translations.pt,
      example_sentence_es: v.example_sentence_translations.es,
      collocations: v.collocations || [],
      attribution: v.attribution,
    }));

    return this.generateOrGetLesson(configOrLang, dateStr, {
      vocabulary: mappedVocab.length > 0 ? mappedVocab : undefined,
      grammarRule: pubGrammar[0],
      exercises: pubExercises.length > 0 ? pubExercises : undefined,
    });
  }
}
