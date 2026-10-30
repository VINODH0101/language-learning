/**
 * Interactive Proofreading and Writing Correction Service.
 * Powered by LanguageTool HTTP API with offline rule-based fallback.
 */

import { LanguageToolAdapter } from '../integrations/external-apis/adapters/languagetool/LanguageToolAdapter';
import {
  NormalizedProofreadResult,
  NormalizedProofreadMatch,
} from '../integrations/external-apis/core/types';
import { Language } from '../types';

const languageToolAdapter = new LanguageToolAdapter();

export class ProofreadingService {
  /**
   * Check learner's text for grammar, spelling, and stylistic errors.
   */
  public static async checkText(
    text: string,
    language: Language | string
  ): Promise<NormalizedProofreadResult> {
    const langMap: Record<string, string> = {
      pt: 'pt-BR',
      en: 'en-US',
      es: 'es',
      fr: 'fr',
      de: 'de-DE',
      ru: 'ru-RU',
      nl: 'nl',
      it: 'it',
    };
    const langCode = langMap[language] || 'auto';
    return await languageToolAdapter.execute({
      text,
      language: langCode,
    });
  }

  /**
   * Apply replacement suggestion to text at the specified offset.
   */
  public static applyCorrection(
    originalText: string,
    match: NormalizedProofreadMatch,
    replacement: string
  ): string {
    const before = originalText.slice(0, match.offset);
    const after = originalText.slice(match.offset + match.length);
    return before + replacement + after;
  }
}
