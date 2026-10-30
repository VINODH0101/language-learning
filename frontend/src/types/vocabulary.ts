import { Language, CEFRLevel, Attribution } from './index';

export type VocabularyPartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'expression'
  | 'numeral';

export type VocabularyTopic =
  | 'daily_life'
  | 'food_drink'
  | 'travel'
  | 'work'
  | 'education'
  | 'family'
  | 'health'
  | 'shopping'
  | 'culture'
  | 'technology'
  | 'social';

export interface VocabularyEntry {
  id: string;
  lemma: string;
  target_language: Language;
  part_of_speech: VocabularyPartOfSpeech;
  cefr_level: CEFRLevel;
  frequency_rank?: number;
  phonetic_ipa?: string;
  translations: Partial<Record<Language, string>>;
  definitions: Partial<Record<Language, string>>;
  example_sentence_target: string;
  example_sentence_translations: Partial<Record<Language, string>>;
  topic: VocabularyTopic;
  grammar_notes?: string;
  collocations?: string[];
  attribution: Attribution;
}

export interface EverydaySentenceEntry {
  id: string;
  sentence_target: string;
  target_language: Language;
  translations: Partial<Record<Language, string>>;
  cefr_level: CEFRLevel;
  topic: VocabularyTopic;
  context_notes?: string;
  linked_vocabulary?: string[];
  attribution: Attribution;
}

export interface VocabularyFilterState {
  target_language?: Language;
  explanation_language?: Language;
  cefr_level?: CEFRLevel | 'all';
  part_of_speech?: VocabularyPartOfSpeech | 'all';
  topic?: VocabularyTopic | 'all';
  search_query?: string;
  is_top_200?: boolean;
}

export interface PdfExportConfig {
  title?: string;
  target_language: Language;
  explanation_language: Language;
  cefr_level: CEFRLevel | 'all';
  resource_type: 'top_200' | 'sentences' | 'topic_collection' | 'all';
  topic?: VocabularyTopic | 'all';
  part_of_speech?: VocabularyPartOfSpeech | 'all';
  include_translations: boolean;
  include_definitions: boolean;
  include_examples: boolean;
  include_grammar_notes: boolean;
  include_practice_quiz: boolean;
}
