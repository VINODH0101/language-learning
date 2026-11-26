/**
 * Lexilume — Trilingual Translation & Challenge Types.
 *
 * Translation lookups and learning challenges are served dynamically from
 * live external APIs (MyMemory, LibreTranslate, Wiktionary/FreeDictionary/Dicionário Aberto, Tatoeba)
 * and AI Content Engine publications rather than static seed fixtures.
 */

export interface TrilingualEntry {
  id: string;
  english: string;
  portuguese: string;
  spanish: string;
  part_of_speech: string;
  phonetic_en: string;
  phonetic_pt?: string;
  phonetic_es?: string;
  definition_en: string;
  definition_pt: string;
  definition_es: string;
  example_en: string;
  example_pt: string;
  example_es: string;
  category: 'vocabulary' | 'phrasal_verb' | 'false_cognate' | 'business' | 'academic';
  notes_for_pt_speakers?: string;
  notes_for_es_speakers?: string;
}

export interface EnglishLearningChallenge {
  id: string;
  source_lang: 'pt' | 'es';
  source_text: string;
  target_english: string;
  accepted_answers: string[];
  options?: string[];
  explanation_pt: string;
  explanation_es: string;
  common_transfer_mistake: string;
  topic: string;
}

export const trilingualDictionary: TrilingualEntry[] = [];

export const englishChallenges: EnglishLearningChallenge[] = [];
