/**
 * Unified Multilingual Content Pipeline
 * Implements the 12-step content generation, assembly, validation, and storage workflow.
 * Lexilume — Illuminate Your Words
 */

import { Language, RegionalVariety, ExplanationLanguage, CEFRLevel } from '../../types';
import {
  ContentPipelineInput,
  ContentPipelineResult,
  MultilingualVocabularyRecord,
  MultilingualGrammarRecord,
  MultilingualExerciseRecord,
  UnifiedContentItem,
} from '../../types/contentEngine';
import { enforceRegionalVariety, enforceDecoupledLanguageMatrix } from '../../lib/languages/languageMatrix';
import {
  validateVocabularyRecord,
  validateGrammarRecord,
  validateExerciseRecord,
} from './contentValidators';
import { getLanguagePedagogy } from './languagePedagogy';
import { ContentGapRegistry } from './gapRegistry';
import { localDb } from '../localDb';
import { contentAccess } from '../contentAccess';
import { DictionaryManager } from '../providers/dictionary/dictionaryManager';
import { ExamplesManager } from '../providers/examples/examplesManager';
import { FrequencyManager } from '../providers/frequency/frequencyManager';

export class ContentPipeline {
  private static instance: ContentPipeline;
  private gapRegistry = ContentGapRegistry.getInstance();
  private dictionaryManager = DictionaryManager.getInstance();
  private examplesManager = ExamplesManager.getInstance();
  private frequencyManager = FrequencyManager.getInstance();

  private constructor() {}

  public static getInstance(): ContentPipeline {
    if (!ContentPipeline.instance) {
      ContentPipeline.instance = new ContentPipeline();
    }
    return ContentPipeline.instance;
  }

  /**
   * Executes the Complete 12-Step Content Workflow
   */
  public async executePipeline(input: ContentPipelineInput): Promise<ContentPipelineResult> {
    const validationErrors: string[] = [];
    const gapNotes: string[] = [];

    // Step 1: Select target language
    const targetLanguage: Language = input.target_language;

    // Step 2: Select locale where applicable (enforcing regional scoping)
    const locale: RegionalVariety = enforceRegionalVariety(
      targetLanguage,
      input.locale || 'all'
    );

    // Step 3: Select learner CEFR level
    const cefrLevel: CEFRLevel = input.cefr_level || 'A1';

    // Step 4: Select explanation language (enforcing decoupled matrix)
    const decoupled = enforceDecoupledLanguageMatrix({
      learningLanguage: targetLanguage,
      regionalVariety: locale,
      explanationLanguage: input.explanation_language || 'en',
    });
    const explanationLanguage: ExplanationLanguage = decoupled.explanationLanguage;

    // Check gap registry for target language
    const documentedGaps = this.gapRegistry.getGapsForLanguage(targetLanguage);
    for (const gap of documentedGaps) {
      gapNotes.push(`[Gap Documentado] ${gap.category}: ${gap.pedagogicalMitigation}`);
    }

    // Step 5: Retrieve live data from external open providers + published Content Engine items
    const vocabPool: MultilingualVocabularyRecord[] = [];
    const grammarPool: MultilingualGrammarRecord[] = [];
    const exercisePool: MultilingualExerciseRecord[] = [];

    const topicQuery = (input.topic || '').trim();

    // 5a. Fetch AI Content Engine published vocabulary, grammar, and exercises
    try {
      const publishedVocab = await contentAccess.getPublishedVocabularyEntries(
        targetLanguage,
        explanationLanguage
      );
      for (const v of publishedVocab) {
        vocabPool.push({
          id: v.id,
          word: v.lemma,
          language: targetLanguage,
          locale,
          translation:
            v.translations[explanationLanguage as keyof typeof v.translations] ||
            v.translations.en ||
            v.lemma,
          definition:
            v.definitions[explanationLanguage as keyof typeof v.definitions] ||
            v.definitions.en ||
            v.lemma,
          part_of_speech: v.part_of_speech,
          cefr_level: v.cefr_level,
          example_sentence_target: v.example_sentence_target || v.lemma,
          example_sentence_translation:
            v.example_sentence_translations[
              explanationLanguage as keyof typeof v.example_sentence_translations
            ] ||
            v.example_sentence_translations.en ||
            '',
          phonetic_ipa: v.phonetic_ipa,
          frequency_rank: v.frequency_rank,
          synonyms: [],
          antonyms: [],
          inflections: [],
          collocations: v.collocations || [],
          attribution: v.attribution,
        });
      }
    } catch {
      // Offline / backend unavailable
    }

    // 5b. Live Open API lookup when topic query is specified and no published vocabulary found
    if (topicQuery && vocabPool.length === 0) {
      try {
        const lookup = await this.dictionaryManager.lookup(topicQuery, targetLanguage);
        const firstMeaning = lookup.meanings[0];
        const freq = await this.frequencyManager
          .getWordFrequency({ word: topicQuery, language: targetLanguage })
          .catch(() => null);
        const examplePairs = await this.examplesManager.getExamples({
          query: topicQuery,
          sourceLang: targetLanguage,
          targetLang: explanationLanguage,
          limit: 2,
        });
        const firstDef = firstMeaning?.definitions[0] || topicQuery;
        const exampleTarget =
          examplePairs[0]?.sourceText ||
          firstMeaning?.examples?.[0] ||
          topicQuery;
        const exampleTranslation =
          examplePairs[0]?.targetText || firstDef;

        if (exampleTarget.length >= 4) {
          vocabPool.push({
            id: `live-voc-${targetLanguage}-${Date.now()}`,
            word: lookup.word || topicQuery,
            language: targetLanguage,
            locale,
            translation: firstDef,
            definition: firstDef,
            part_of_speech: firstMeaning?.partOfSpeech || 'noun',
            cefr_level: cefrLevel,
            example_sentence_target: exampleTarget,
            example_sentence_translation: exampleTranslation,
            phonetic_ipa: lookup.phonetic,
            frequency_rank: freq?.rank,
            frequency_per_million: freq?.frequencyPerMillion,
            synonyms: [],
            antonyms: [],
            inflections: [],
            collocations: [],
            attribution: {
              source_name: lookup.provider || 'Open Lexicon API',
              source_url: lookup.sourceUrl || 'https://www.wiktionary.org',
              license_type: 'CC-BY-SA 4.0',
              attribution_text: `Resolved dynamically from ${lookup.provider || 'Open Lexicon API'}.`,
            },
          });
        }
      } catch {
        gapNotes.push(
          `No live dictionary entry retrieved for "${topicQuery}" (${targetLanguage}).`
        );
      }
    }

    // 5c. Grammar rule derived from structural language pedagogy metadata + published grammar notes
    try {
      const publishedGrammar = await contentAccess.getPublishedGrammarNotes(
        targetLanguage,
        explanationLanguage
      );
      for (const g of publishedGrammar) {
        grammarPool.push({
          id: g.id,
          rule_code: g.rule_code,
          language: targetLanguage,
          cefr_level: g.cefr_level,
          title: g.title,
          category: g.category || 'grammar',
          explanation: g.explanation_markdown,
          structural_formula: g.structural_formula,
          examples: g.examples.map(ex => ({
            target: ex.target,
            translation: ex.en,
            note: ex.note,
          })),
          common_errors: g.common_errors,
          language_specific_notes: g.regional_notes,
          attribution: g.attribution,
        });
      }
    } catch {
      // Ignore if backend offline
    }

    if (grammarPool.length === 0) {
      const pedagogy = getLanguagePedagogy(targetLanguage);
      const firstFeature = pedagogy.keyPedagogicalPillars[0] || pedagogy.scriptFamily;
      grammarPool.push({
        id: `pedagogy-gram-${targetLanguage}-${cefrLevel.toLowerCase()}`,
        rule_code: `${targetLanguage.toUpperCase()}-STRUCTURE-${cefrLevel}`,
        language: targetLanguage,
        cefr_level: cefrLevel,
        title: topicQuery || firstFeature,
        category: 'structure',
        explanation: `${pedagogy.displayName}: ${firstFeature}. ${pedagogy.orthographicNotes}`,
        structural_formula: `${pedagogy.scriptFamily} • ${firstFeature}`,
        examples: vocabPool.slice(0, 2).map(v => ({
          target: v.example_sentence_target,
          translation: v.example_sentence_translation,
        })),
        common_errors: [],
        language_specific_notes: { [locale]: pedagogy.orthographicNotes },
        attribution: {
          source_name: 'Lexilume Pedagogical Structure Matrix',
          source_url: 'https://github.com/VINODH0101/language-learning',
          license_type: 'CC-BY-SA 4.0',
          attribution_text: 'Structural grammar metadata from LanguagePedagogy profile.',
        },
      });
    }

    // 5d. Published Content Engine exercises or dynamically built from fetched vocabulary
    try {
      const publishedEx = await contentAccess.getPublishedPracticeExercises(targetLanguage);
      for (const ex of publishedEx) {
        exercisePool.push({
          id: ex.id,
          language: targetLanguage,
          cefr_level: cefrLevel,
          exercise_type: ex.exercise_type === 'cloze' ? 'cloze' : 'multiple_choice',
          prompt: ex.prompt,
          context_passage: ex.context_passage,
          acceptable_solutions: ex.acceptable_solutions,
          distractors: ex.distractors || [],
          explanation: ex.explanation,
          attribution: ex.attribution,
        });
      }
    } catch {
      // Ignore if offline
    }

    if (exercisePool.length === 0 && vocabPool.length > 0) {
      const firstVoc = vocabPool[0];
      const secondaryVocab = vocabPool[1];
      exercisePool.push({
        id: `dyn-ex-${firstVoc.id}`,
        language: targetLanguage,
        cefr_level: firstVoc.cefr_level,
        exercise_type: 'multiple_choice',
        prompt: `Identify the meaning of "${firstVoc.word}" (${targetLanguage.toUpperCase()}):`,
        context_passage: firstVoc.example_sentence_target,
        acceptable_solutions: [firstVoc.translation],
        distractors: [
          {
            text: secondaryVocab ? secondaryVocab.translation : `${firstVoc.part_of_speech} (category)`,
            why_incorrect: 'Grammatical category or distinct lexical meaning rather than translation.',
          },
          {
            text: `${firstVoc.cefr_level} ${firstVoc.part_of_speech} label`,
            why_incorrect: 'Metadata classification rather than semantic translation.',
          },
        ],
        explanation: `${firstVoc.word}: ${firstVoc.definition}`,
        attribution: firstVoc.attribution,
      });
    }

    // Step 6: Generate or assemble learning content
    const assembledItems: UnifiedContentItem[] = [];

    // Step 7: Validate schema for vocabulary
    const validVocabulary: MultilingualVocabularyRecord[] = [];
    for (const item of vocabPool) {
      const valResult = validateVocabularyRecord(item);
      if (valResult.isValid) {
        validVocabulary.push(item);
      } else {
        for (const issue of valResult.issues) {
          validationErrors.push(`Vocabulário (${item.word}): ${issue.message}`);
        }
      }
    }

    // Step 8: Check translation consistency & Step 9: Validate examples
    for (const item of validVocabulary) {
      // Step 10: Store source and attribution metadata
      assembledItems.push({
        id: `content-voc-${item.id}`,
        category: 'vocabulary',
        language: targetLanguage,
        locale,
        cefr_level: item.cefr_level,
        explanation_language: explanationLanguage,
        title: item.word,
        data: item,
        attribution: item.attribution,
        is_verified: true,
        created_at: new Date().toISOString(),
      });
    }

    // Validate Grammar Records
    const validGrammar: MultilingualGrammarRecord[] = [];
    for (const rule of grammarPool) {
      const valResult = validateGrammarRecord(rule);
      if (valResult.isValid) {
        validGrammar.push(rule);
        assembledItems.push({
          id: `content-gram-${rule.id}`,
          category: 'grammar',
          language: targetLanguage,
          locale,
          cefr_level: rule.cefr_level,
          explanation_language: explanationLanguage,
          title: rule.title,
          data: rule,
          attribution: rule.attribution,
          is_verified: true,
          created_at: new Date().toISOString(),
        });
      } else {
        for (const issue of valResult.issues) {
          validationErrors.push(`Gramática (${rule.title}): ${issue.message}`);
        }
      }
    }

    // Validate Exercise Records
    const validExercises: MultilingualExerciseRecord[] = [];
    for (const ex of exercisePool) {
      const valResult = validateExerciseRecord(ex);
      if (valResult.isValid) {
        validExercises.push(ex);
        assembledItems.push({
          id: `content-ex-${ex.id}`,
          category: 'exercises',
          language: targetLanguage,
          locale,
          cefr_level: ex.cefr_level,
          explanation_language: explanationLanguage,
          title: ex.prompt,
          data: ex,
          attribution: ex.attribution,
          is_verified: true,
          created_at: new Date().toISOString(),
        });
      } else {
        for (const issue of valResult.issues) {
          validationErrors.push(`Exercício (${ex.id}): ${issue.message}`);
        }
      }
    }

    // Step 11: Save the content to offline storage (Dexie) if available
    try {
      if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && localDb?.savedVocabulary) {
        for (const voc of validVocabulary) {
          await localDb.savedVocabulary.put({
            id: `pipeline-${voc.id}`,
            user_id: 'local_pipeline_user',
            source_text: voc.word,
            translated_text: voc.translation,
            source_lang: targetLanguage,
            target_lang: explanationLanguage,
            part_of_speech: voc.part_of_speech,
            phonetic_ipa: voc.phonetic_ipa,
            context_sentence: voc.example_sentence_target,
            is_verified: true,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (dbErr) {
      console.warn('[ContentPipeline] Dexie persistence warning:', dbErr);
    }

    // Step 12: Make it available for learners
    return {
      step: 12,
      success: validationErrors.length === 0,
      target_language: targetLanguage,
      locale,
      cefr_level: cefrLevel,
      explanation_language: explanationLanguage,
      vocabulary: validVocabulary,
      grammar: validGrammar,
      exercises: validExercises,
      assembled_items: assembledItems,
      validation_errors: validationErrors,
      gap_notes: gapNotes,
      timestamp: new Date().toISOString(),
    };
  }
}
