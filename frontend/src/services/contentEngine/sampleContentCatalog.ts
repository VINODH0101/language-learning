import { Language } from '../../types';
import {
  MultilingualVocabularyRecord,
  MultilingualGrammarRecord,
  MultilingualExerciseRecord,
} from '../../types/contentEngine';

/**
 * Sample catalog deprecated: content pipeline dynamically consumes live external
 * providers (Wiktionary/Kaikki, FreeDictionaryAPI, Dicionário Aberto, Tatoeba,
 * FrequencyWords) and AI Content Engine records persisted in backend/Dexie.
 */
export const SAMPLE_VOCABULARY_CATALOG: Record<Language, MultilingualVocabularyRecord[]> = {
  pt: [],
  es: [],
  en: [],
  fr: [],
  de: [],
  it: [],
  ja: [],
  ko: [],
  ru: [],
  nl: [],
  zh: [],
  tr: [],
  ta: [],
};

export const SAMPLE_GRAMMAR_CATALOG: Record<Language, MultilingualGrammarRecord> = {} as Record<
  Language,
  MultilingualGrammarRecord
>;

export const SAMPLE_EXERCISES_CATALOG: MultilingualExerciseRecord[] = [];
