/**
 * Standard Reusable Service Interfaces for External & Data APIs
 */

import {
  NormalizedDictionaryEntry,
  NormalizedProofreadResult,
  NormalizedTranslationResult,
} from '../../integrations/external-apis/core/types';
import { Language } from '../../types';
import { LearningLanguage } from '../../lib/languages/languageMatrix';
import { CulturalArticle, CultureFilterState } from '../../types/culture';

export interface IDictionaryService {
  lookup(word: string, language: Language | LearningLanguage): Promise<NormalizedDictionaryEntry>;
}

export interface IProofreadingService {
  checkText(text: string, language: string): Promise<NormalizedProofreadResult>;
  applyCorrection(text: string, match: any, replacement: string): string;
}

export interface ITranslationService {
  translate(query: string, sourceLang: string, targetLang: string): Promise<NormalizedTranslationResult>;
}

export interface ICultureService {
  getAllArticles(): CulturalArticle[];
  getArticleById(id: string): CulturalArticle | undefined;
  filterArticles(filters: CultureFilterState): CulturalArticle[];
}
