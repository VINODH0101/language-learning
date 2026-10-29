import {
  DailyLessonPayload,
  Language,
  RegionalVariety,
  StudyMode,
  VocabularyItem,
  GrammarRule,
  ExerciseTemplate,
  CourseConfig,
  Course,
  CEFRLevel,
  ExplanationLanguage,
} from '../types';
import {
  enforceRegionalVariety,
  enforceDecoupledLanguageMatrix,
  getLanguageName,
  getRegionalVarietyLabel,
} from '../lib/languages/languageMatrix';
import { courseService } from './courseService';
import {
  ptCurriculum,
  esCurriculum,
  enCurriculum,
  ptVocabulary,
  esVocabulary,
  enVocabulary,
  ptGrammar,
  esGrammar,
  enGrammar,
  curatedMaterials,
  exerciseTemplates,
  falseFriends,
  wikipediaArticles,
} from '../data/seedData';
import { dialogueScenarios } from '../data/scenarioData';
import { StorageService } from './storage';
import { SRSService } from './srs';

export function getDateDayNumber(dateStr: string, salt: string = ''): number {
  const parsed = new Date(`${dateStr}T00:00:00Z`).getTime();
  const dayNumber = isNaN(parsed) ? 0 : Math.floor(parsed / 86400000);
  if (!salt) return dayNumber;
  let saltHash = 0;
  for (let i = 0; i < salt.length; i++) {
    saltHash = ((saltHash << 5) - saltHash) + salt.charCodeAt(i);
  }
  return Math.abs(dayNumber + saltHash);
}

export class ClientLessonGenerator {
  static generateOrGetLesson(
    targetOrConfig: Language | CourseConfig | Course,
    lessonDate: string = new Date().toISOString().split('T')[0]
  ): DailyLessonPayload {
    // 1. Normalize course configuration
    let config: CourseConfig;
    if (typeof targetOrConfig === 'string') {
      const activeMatchingCourse = courseService.getCourseForLanguage(targetOrConfig);
      const settings = StorageService.getSettings();
      const track = StorageService.getTrackState(targetOrConfig);

      let savedExplanationLang: ExplanationLanguage = 'en';
      try {
        const stored = localStorage.getItem('polyglot_explanation_lang');
        if (stored === 'en' || stored === 'pt' || stored === 'es') {
          savedExplanationLang = stored;
        }
      } catch {}

      const regionalCandidate = activeMatchingCourse?.regional_variant ||
        (targetOrConfig === 'pt'
          ? settings.pt_variety
          : targetOrConfig === 'es'
          ? settings.es_variety
          : (settings.en_variety || 'en-US'));

      const variety = enforceRegionalVariety(targetOrConfig, regionalCandidate);
      const expLang = activeMatchingCourse?.explanation_language || savedExplanationLang;

      config = {
        course_id: activeMatchingCourse?.id,
        target_language: targetOrConfig,
        regional_variant: variety,
        cefr_level: track.current_cefr_level || activeMatchingCourse?.cefr_level || 'A1',
        explanation_language: expLang,
      };
    } else {
      const targetLang = targetOrConfig.target_language;
      const enforcedVariety = enforceRegionalVariety(targetLang, targetOrConfig.regional_variant);
      config = {
        course_id: (targetOrConfig as Course).id || (targetOrConfig as CourseConfig).course_id,
        target_language: targetLang,
        regional_variant: enforcedVariety,
        cefr_level: targetOrConfig.cefr_level,
        explanation_language: targetOrConfig.explanation_language || 'en',
        interface_language: (targetOrConfig as CourseConfig).interface_language,
      };
    }

    const { target_language, regional_variant, cefr_level, explanation_language, course_id } = config;

    // Check if already generated today in local storage with matching variety & explanation language
    const existing = StorageService.getDailyLesson(target_language, lessonDate);
    if (
      existing &&
      existing.regional_variety === regional_variant &&
      (!existing.explanation_language || existing.explanation_language === explanation_language)
    ) {
      return existing;
    }

    const settings = StorageService.getSettings();
    const track = StorageService.getTrackState(target_language);

    // 2. Select language pools
    const curriculum =
      target_language === 'pt'
        ? ptCurriculum
        : target_language === 'es'
        ? esCurriculum
        : enCurriculum;

    const vocabularyPool =
      target_language === 'pt'
        ? ptVocabulary
        : target_language === 'es'
        ? esVocabulary
        : enVocabulary;

    const grammarPool =
      target_language === 'pt'
        ? ptGrammar
        : target_language === 'es'
        ? esGrammar
        : enGrammar;

    // 3. Select curriculum node
    const compatibleNodes = curriculum.filter(
      n => n.regional_relevance === 'all' || n.regional_relevance === regional_variant
    );
    const levelNodes = compatibleNodes.filter(n => n.cefr_level === cefr_level);
    const poolForSelection = levelNodes.length > 0 ? levelNodes : compatibleNodes;

    const uncompleted = poolForSelection.filter(n => !track.completed_curriculum_node_ids.includes(n.id));
    const currentNode = uncompleted.length > 0 ? uncompleted[0] : poolForSelection[poolForSelection.length - 1] || curriculum[0];

    // 4. Select vocabulary items matching level with date-seeded dynamic rotation
    const levelVocab = vocabularyPool.filter(v => v.cefr_level === cefr_level);
    const vocabSelection = [...levelVocab];
    if (vocabSelection.length < 12) {
      for (const v of vocabularyPool) {
        if (!vocabSelection.some(sel => sel.id === v.id)) {
          vocabSelection.push(v);
        }
      }
    }

    // Dynamic rotation: cycle through available vocabulary items based on calendar date
    const poolLength = vocabSelection.length;
    const daySeed = getDateDayNumber(lessonDate, target_language);
    const startIndex = (daySeed * 12) % Math.max(1, poolLength);
    const finalVocabPool: VocabularyItem[] = [];
    for (let i = 0; i < Math.min(12, poolLength); i++) {
      finalVocabPool.push(vocabSelection[(startIndex + i) % poolLength]);
    }

    const vocabItems: VocabularyItem[] = finalVocabPool.map(v => {
      const def = explanation_language === 'en' ? v.definition_en : (v.definition_target || v.definition_en);
      return {
        ...v,
        definition_target: def,
      };
    });

    // 5. Select grammar rule matching level
    const levelGrammar = grammarPool.filter(g => g.cefr_level === cefr_level);
    const grammarRule: GrammarRule = levelGrammar.length > 0 ? levelGrammar[0] : grammarPool[0];

    // 6. Select reading material with date-seeded rotation (Wikipedia prioritized with curated fallback)
    const matchingWikis = wikipediaArticles.filter(w => w.language === target_language);
    const wikiMatch = matchingWikis.length > 0
      ? matchingWikis[getDateDayNumber(lessonDate, 'reading') % matchingWikis.length]
      : undefined;

    const curatedMatch =
      curatedMaterials.find(m => m.language === target_language && m.material_type === 'reading_passage') ||
      curatedMaterials.find(m => m.material_type === 'reading_passage') ||
      curatedMaterials[0];

    const readingMat = curatedMatch;
    const readingSection = wikiMatch
      ? {
          title: wikiMatch.title,
          passage_target: wikiMatch.extract,
          passage_en: wikiMatch.extract_en || (target_language === 'en' ? wikiMatch.extract : `[${wikiMatch.description}]`),
          passage_pt: wikiMatch.extract_pt || (target_language === 'pt' ? wikiMatch.extract : undefined),
          passage_es: wikiMatch.extract_es || (target_language === 'es' ? wikiMatch.extract : undefined),
          glossary: wikiMatch.glossary,
          comprehension_questions: wikiMatch.comprehension_questions,
          attribution: wikiMatch.attribution,
          article_url: wikiMatch.content_url,
          thumbnail_url: wikiMatch.thumbnail_url,
          topic_category: wikiMatch.topic_category,
          provider: 'wikipedia' as const,
          article_id: `wiki-${target_language}-${wikiMatch.pageid}`,
        }
      : {
          title: curatedMatch.title,
          passage_target: curatedMatch.content_target,
          passage_en: curatedMatch.content_en,
          passage_pt: curatedMatch.content_pt || (target_language === 'pt' ? curatedMatch.content_target : undefined),
          passage_es: curatedMatch.content_es || (target_language === 'es' ? curatedMatch.content_target : undefined),
          glossary: curatedMatch.glossary || {},
          comprehension_questions: curatedMatch.comprehension_questions || [],
          attribution: curatedMatch.attribution,
          provider: 'curated' as const,
          article_id: curatedMatch.id,
        };

    // 7. Select dialogue / conversation material with date-seeded rotation
    const matchingScenarios = dialogueScenarios.filter(s => s.language === target_language);
    let dialogueLines: Array<{
      speaker: string;
      line: string;
      translation?: string;
      translation_pt?: string;
      translation_es?: string;
    }> = [];
    let convTitle = '';
    let convContext = '';
    let convNotes: string[] = [];
    let convAttribution = curatedMaterials[0].attribution;

    if (matchingScenarios.length > 0) {
      const scenarioIndex = getDateDayNumber(lessonDate, 'scenario') % matchingScenarios.length;
      const selectedScenario = matchingScenarios[scenarioIndex];
      convTitle = selectedScenario.title;
      convContext = selectedScenario.context;
      convNotes = [
        ...selectedScenario.pragmatic_tips,
        `Register appropriate for ${regional_variant}.`,
      ];
      convAttribution = {
        source_name: 'Polyglot C1 Daily Open Curriculum',
        source_url: 'https://github.com/polyglot-c1-daily',
        license_type: 'Original-Curated',
        attribution_text: `Pedagogical situational scenario (${selectedScenario.category}) for Polyglot C1 Daily.`,
      };
      dialogueLines = selectedScenario.turns.map(turn => ({
        speaker: turn.speaker,
        line: turn.line,
        translation: turn.translation,
        translation_pt: turn.translation_pt || (target_language === 'pt' ? turn.line : undefined),
        translation_es: turn.translation_es || (target_language === 'es' ? turn.line : undefined),
      }));
    } else {
      const convMat =
        curatedMaterials.find(m => m.language === target_language && m.material_type === 'conversation_script') ||
        curatedMaterials.find(m => m.material_type === 'conversation_script') ||
        curatedMaterials[1];
      convTitle = convMat.title;
      convContext = 'Formal negotiation and argumentation dialogue.';
      convNotes = [
        `Register appropriate for ${regional_variant}.`,
        'Notice discursive markers and formal hedges.',
      ];
      convAttribution = convMat.attribution;
      const targetLines = convMat.content_target.split('\n').filter(l => l.includes(':'));
      const enLines = convMat.content_en ? convMat.content_en.split('\n').filter(l => l.includes(':')) : [];
      const ptLines = convMat.content_pt ? convMat.content_pt.split('\n').filter(l => l.includes(':')) : [];
      const esLines = convMat.content_es ? convMat.content_es.split('\n').filter(l => l.includes(':')) : [];

      dialogueLines = targetLines.map((line, idx) => {
        const [speaker, text] = line.split(':');
        return {
          speaker: speaker.trim(),
          line: text.trim(),
          translation: enLines[idx] ? enLines[idx].split(':')[1]?.trim() : undefined,
          translation_pt: ptLines[idx] ? ptLines[idx].split(':')[1]?.trim() : undefined,
          translation_es: esLines[idx] ? esLines[idx].split(':')[1]?.trim() : undefined,
        };
      });
    }

    // 8. Select exercises and generate dynamic vocabulary exercises for today's words
    const langExercises = exerciseTemplates.filter(e => e.language === target_language);

    const dynamicVocabExercises: ExerciseTemplate[] = [];
    if (vocabItems.length >= 4) {
      // Dynamic Exercise 1: Cloze test using today's rotated word and authentic example sentence
      const targetWord1 = vocabItems[0];
      const distractors1 = vocabItems.filter(v => v.id !== targetWord1.id).slice(0, 3).map(v => ({
        text: v.lemma,
        why_incorrect: `${v.lemma} significa '${v.definition_target || v.definition_en}', o que não se adequa ao sentido desta oração.`,
      }));

      const regex1 = new RegExp(`\\b${targetWord1.lemma}\\b`, 'i');
      let clozeSentence = targetWord1.example_sentence_target.replace(regex1, '_____');
      if (clozeSentence === targetWord1.example_sentence_target) {
        const baseStem = targetWord1.lemma.slice(0, Math.max(4, targetWord1.lemma.length - 2));
        const stemRegex = new RegExp(`\\b${baseStem}\\w*\\b`, 'i');
        clozeSentence = targetWord1.example_sentence_target.replace(stemRegex, '_____');
        if (clozeSentence === targetWord1.example_sentence_target) {
          clozeSentence = `${targetWord1.example_sentence_target} [_____]`;
        }
      }

      dynamicVocabExercises.push({
        id: `dyn-vocab-cloze-${target_language}-${targetWord1.id}-${lessonDate}`,
        curriculum_node_id: currentNode.id,
        language: target_language,
        exercise_type: 'cloze',
        prompt:
          explanation_language === 'es'
            ? `Seleccione el vocablo adecuado para completar el contexto según el léxico de hoy:`
            : explanation_language === 'pt'
            ? `Selecione o vocábulo adequado para preencher a lacuna segundo o léxico de hoje:`
            : `Select the appropriate vocabulary item to complete the sentence based on today's study pool:`,
        context_passage: clozeSentence,
        acceptable_solutions: [targetWord1.lemma],
        distractors: distractors1,
        explanation:
          explanation_language === 'es'
            ? `'${targetWord1.lemma}' es la opción precisa. Definición: ${targetWord1.definition_target || targetWord1.definition_en}.`
            : explanation_language === 'pt'
            ? `'${targetWord1.lemma}' é a opção correta. Definição: ${targetWord1.definition_target || targetWord1.definition_en}.`
            : `'${targetWord1.lemma}' is the correct lexical choice. Definition: ${targetWord1.definition_target || targetWord1.definition_en}.`,
        hint: targetWord1.phonetic_ipa ? `Pronúncia / IPA: ${targetWord1.phonetic_ipa}` : undefined,
        difficulty: 3,
        attribution: targetWord1.attribution,
      });

      // Dynamic Exercise 2: Multiple choice definition matching using today's second rotated word
      const targetWord2 = vocabItems[1];
      const distractors2 = vocabItems.filter(v => v.id !== targetWord2.id).slice(0, 3).map(v => ({
        text: v.lemma,
        why_incorrect: `${v.lemma} significa '${v.definition_target || v.definition_en}', diferente da definição apresentada.`,
      }));

      dynamicVocabExercises.push({
        id: `dyn-vocab-def-${target_language}-${targetWord2.id}-${lessonDate}`,
        curriculum_node_id: currentNode.id,
        language: target_language,
        exercise_type: 'multiple_choice',
        prompt:
          explanation_language === 'es'
            ? `¿Cuál de los siguientes términos corresponde a la definición: "${targetWord2.definition_target || targetWord2.definition_en}"?`
            : explanation_language === 'pt'
            ? `Qual dos seguintes termos corresponde à definição: "${targetWord2.definition_target || targetWord2.definition_en}"?`
            : `Which of the following terms matches the definition: "${targetWord2.definition_target || targetWord2.definition_en}"?`,
        acceptable_solutions: [targetWord2.lemma],
        distractors: distractors2,
        explanation:
          explanation_language === 'es'
            ? `'${targetWord2.lemma}': ${targetWord2.definition_target || targetWord2.definition_en}. Ejemplo: "${targetWord2.example_sentence_target}".`
            : explanation_language === 'pt'
            ? `'${targetWord2.lemma}': ${targetWord2.definition_target || targetWord2.definition_en}. Exemplo: "${targetWord2.example_sentence_target}".`
            : `'${targetWord2.lemma}': ${targetWord2.definition_target || targetWord2.definition_en}. Example: "${targetWord2.example_sentence_target}".`,
        hint: targetWord2.collocations && targetWord2.collocations.length > 0 ? `Colocações comuns: ${targetWord2.collocations.join(', ')}` : undefined,
        difficulty: 3,
        attribution: targetWord2.attribution,
      });
    }

    const exercisesList: ExerciseTemplate[] = [
      ...(langExercises.length >= 2 ? langExercises : exerciseTemplates),
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

    // 9. Spaced repetition due items
    const userSRS = StorageService.getSRSItems(target_language);
    const dueSRS = userSRS.filter(s => s.next_review_date <= lessonDate);
    const dueVocabIds = new Set(dueSRS.map(s => s.vocabulary_item_id));
    const dueVocab = vocabularyPool.filter(v => dueVocabIds.has(v.id));

    // 10. Language-specific prompts and guides
    let speakingPrompt = '';
    let suggestedPhrases: string[] = [];
    let suggestedPhrasesTranslations: Record<string, { pt?: string; es?: string; en?: string }> = {};
    let writingPrompt = '';
    let writingConnectors: string[] = [];
    let listeningTitle = '';
    let pronunciationGuide = '';

    if (target_language === 'en') {
      speakingPrompt = `Oral Presentation (${cefr_level}): Speak for 3 minutes on '${currentNode.title}'. Utilize: ${grammarRule.structural_formula}.`;
      suggestedPhrases = [
        'First and foremost, it is crucial to note that...',
        'Rarely does one observe such a shift...',
        'From an analytical perspective...',
      ];
      suggestedPhrasesTranslations = {
        'First and foremost, it is crucial to note that...': {
          pt: 'Em primeiro lugar, é crucial notar que...',
          es: 'En primer lugar, es crucial señalar que...',
        },
        'Rarely does one observe such a shift...': {
          pt: 'Raramente se observa tal mudança...',
          es: 'Rara vez se observa tal cambio...',
        },
        'From an analytical perspective...': {
          pt: 'De uma perspectiva analítica...',
          es: 'Desde una perspectiva analítica...',
        },
      };
      writingPrompt = `Formal Academic Essay (${cefr_level}, 150-200 words): Critically analyze the topic '${currentNode.title}'.`;
      writingConnectors = ['Nevertheless', 'Consequently', 'Furthermore', 'Notwithstanding', 'In essence'];
      listeningTitle = `English Auditory Comprehension & Prosody (${cefr_level})`;
      pronunciationGuide = 'Focus on sentence-level stress timing, vowel reduction (schwa), and connected speech linking.';
    } else if (target_language === 'pt') {
      speakingPrompt = `Apresentação oral (${cefr_level}): Discorra durante 3 minutos sobre '${currentNode.title}'. Utilize: ${grammarRule.structural_formula}.`;
      suggestedPhrases = [
        'Em primeiro lugar, convém ressaltar que...',
        'Por mais que se argumente...',
        'Do meu ponto de vista...',
      ];
      suggestedPhrasesTranslations = {
        'Em primeiro lugar, convém ressaltar que...': {
          en: 'First and foremost, it is worth emphasizing that...',
        },
        'Por mais que se argumente...': {
          en: 'However much one may argue...',
        },
        'Do meu ponto de vista...': {
          en: 'From my perspective...',
        },
      };
      writingPrompt = `Redação dissertativo-argumentativa (${cefr_level}, 150-200 palavras): Analise com rigor crítico a temática '${currentNode.title}'.`;
      writingConnectors = ['Não obstante', 'Por conseguinte', 'Com efeito', 'Conquanto'];
      listeningTitle = `Compreensão Auditiva e Prosódia (${cefr_level})`;
      pronunciationGuide = 'Atenção às vogais átonas e nasais.';
    } else {
      speakingPrompt = `Producción oral (${cefr_level}): Exponga durante 3 minutos sobre '${currentNode.title}'. Incorpore: ${grammarRule.structural_formula}.`;
      suggestedPhrases = [
        'En primer lugar, cabe destacar que...',
        'Por mucho que se insista...',
        'Desde una perspectiva crítica...',
      ];
      suggestedPhrasesTranslations = {
        'En primer lugar, cabe destacar que...': {
          en: 'First and foremost, it is worth pointing out that...',
        },
        'Por mucho que se insista...': {
          en: 'No matter how much one insists...',
        },
        'Desde una perspectiva crítica...': {
          en: 'From a critical perspective...',
        },
      };
      writingPrompt = `Composición argumentativa (${cefr_level}, 150-200 palabras): Analice críticamente el tema '${currentNode.title}'.`;
      writingConnectors = ['No obstante', 'Por consiguiente', 'En efecto', 'A tenor de'];
      listeningTitle = `Comprensión Auditiva y Prosodia (${cefr_level})`;
      pronunciationGuide = 'Atención a la oclusión bilabial y ritmo silábico.';
    }

    // Listening tasks localized to explanation language
    const listeningTasks =
      explanation_language === 'en'
        ? [
            '1. Listen attentively once, focusing on overall intonation, rhythm, and flow.',
            '2. Identify the three core arguments and logical connectors employed.',
            '3. Repeat sentences aloud to practice authentic C1 cadence and phonetics.',
          ]
        : explanation_language === 'es'
        ? [
            '1. Escuche atentamente una vez prestando atención a la entonación y al ritmo.',
            '2. Identifique los tres argumentos centrales y los conectores lógicos empleados.',
            '3. Repita las frases en voz alta practicando cadencia y fonética C1.',
          ]
        : [
            '1. Escute uma vez atentamente prestando atenção à entonação e ritmo.',
            '2. Identifique os três argumentos centrais e os conectores lógicos empregados.',
            '3. Repita as frases em voz alta treinando cadência e fonética C1.',
          ];

    // Speaking guiding questions localized to explanation language
    const guidingQuestions =
      explanation_language === 'en'
        ? [
            'What are the key friction points identified?',
            'How do ethical and regulatory considerations shape the proposed resolution?',
          ]
        : explanation_language === 'es'
        ? [
            '¿Cuáles son los principales puntos de fricción identificados?',
            '¿De qué manera las consideraciones éticas y regulatorias moldean la solución propuesta?',
          ]
        : [
            'Quais são os principais pontos de fricção identificados?',
            'De que modo considerações éticas e regulatórias moldam a solução proposta?',
          ];

    const alerts = falseFriends.slice(0, 2);
    const studyMode: StudyMode = settings.study_mode;
    const estimatedMinutes = studyMode === 'compact' ? 20 : 50;
    const lessonId = `lesson-${settings.user_id}-${target_language}-${lessonDate}`;

    const lesson: DailyLessonPayload = {
      lesson_id: lessonId,
      lesson_date: lessonDate,
      language: target_language,
      regional_variety: regional_variant,
      explanation_language: explanation_language,
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
        title: convTitle,
        context: convContext,
        dialogue: dialogueLines,
        pragmatic_notes: convNotes,
        attribution: convAttribution,
      },
      section_6_speaking: {
        prompt: speakingPrompt,
        guiding_questions: guidingQuestions,
        suggested_phrases: suggestedPhrases,
        suggested_phrases_translations: suggestedPhrasesTranslations,
        model_pronunciation_guide: pronunciationGuide,
        target_duration_minutes: 10,
      },
      section_7_writing: {
        prompt: writingPrompt,
        genre_register: 'Formal Academic Essay / Policy Analysis',
        structural_guidelines: [
          'Contextualized thesis introduction.',
          'Substantiated body paragraphs with complex subordinators.',
          'Synthesized reflective conclusion.',
        ],
        evaluation_criteria: [
          'Lexical precision and avoidance of inappropriate colloquialisms.',
          'Cohesion and sophisticated temporal correlation.',
        ],
        suggested_connectors: writingConnectors,
        target_word_count: 160,
      },
      section_8_listening: {
        title: listeningTitle,
        audio_source_url: readingMat.audio_url,
        audio_player_notes: 'Áudio nativo disponível. Para estudo assistido, utilize o botão de síntese de voz (Web Speech API).',
        transcript_target: readingMat.content_target,
        comprehension_tasks: listeningTasks,
        attribution: readingMat.attribution,
      },
      section_9_exercises: exerciseItems,
      section_10_answer_keys: answerKeys,
      section_11_review: {
        due_vocabulary_reviews: dueVocab,
        consolidated_grammar_rules: [grammarRule],
        review_strategy_note: 'Utilize a recordação ativa antes de verificar as respostas no baralho de repetição espaçada.',
      },
      section_12_further_resources: [
        {
          title:
            target_language === 'pt'
              ? 'RTP Ensina — Língua Portuguesa'
              : target_language === 'es'
              ? 'Centro Virtual Cervantes — Rinconete'
              : 'BBC Learning English — Advanced C1',
          resource_type: 'article',
          url:
            target_language === 'pt'
              ? 'https://ensina.rtp.pt'
              : target_language === 'es'
              ? 'https://cvc.cervantes.es'
              : 'https://www.bbc.co.uk/learningenglish',
          description: 'Open linguistic and cultural resource for CEFR advanced progression.',
        },
        {
          title: 'Tatoeba Bilingual Open Corpus',
          resource_type: 'audio',
          url: 'https://tatoeba.org',
          description: 'Authentic native audio recordings under Creative Commons.',
        },
      ],
      false_friend_alerts: alerts,
      attributions: [grammarRule.attribution, readingMat.attribution, convAttribution],
    };

    // Initialize SRS states for new vocabulary
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

    // Save lesson and updated track
    StorageService.saveDailyLesson(lesson);
    StorageService.saveTrackState(track);

    return lesson;
  }
}
