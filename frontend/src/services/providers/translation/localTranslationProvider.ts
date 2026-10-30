/**
 * Local Offline Trilingual Translation Provider
 * Zero external network calls. Always available offline fallback.
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { normalizeTranslation } from '../../normalization/responseNormalizers';
import { NormalizedTranslationResult } from '../../../integrations/external-apis/core/types';
import { trilingualDictionary } from '../../../data/translationData';

export class LocalTranslationProvider extends BaseProvider<{ text: string; sourceLang: string; targetLang: string }, NormalizedTranslationResult> {
  public readonly metadata: ProviderMetadata = {
    id: 'local_translation',
    name: 'Local Offline Trilingual Dictionary',
    description: 'Guaranteed offline fallback dictionary covering core curriculum vocabulary.',
    category: 'translation',
    attribution: 'Lexilume Offline Corpus — Public Domain & Creative Commons',
    license: 'CC-BY-SA 4.0',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: { text: string; sourceLang: string; targetLang: string }): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Texto para tradução não pode estar vazio.');
    }
  }

  protected generateCacheKey(input: { text: string; sourceLang: string; targetLang: string }): string {
    return `${input.sourceLang.toLowerCase()}:${input.targetLang.toLowerCase()}:${input.text.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: { text: string; sourceLang: string; targetLang: string }): Promise<unknown> {
    const term = input.text.trim().toLowerCase();
    const match = trilingualDictionary.find(
      d =>
        d.portuguese?.toLowerCase() === term ||
        d.spanish?.toLowerCase() === term ||
        d.english?.toLowerCase() === term
    );

    if (!match) {
      throw new Error(`Palavra "${input.text}" não encontrada no dicionário offline.`);
    }

    let translated = match.english;
    if (input.targetLang === 'pt') translated = match.portuguese;
    else if (input.targetLang === 'es') translated = match.spanish;

    return {
      translatedText: translated,
      match: 1.0,
      verified: true,
    };
  }

  protected normalize(raw: any, input: { text: string; sourceLang: string; targetLang: string }): NormalizedTranslationResult {
    return normalizeTranslation(
      raw.translatedText,
      input.sourceLang,
      input.targetLang,
      this.metadata.id,
      {
        isVerified: true,
        isApproximate: false,
        matchConfidence: 1.0,
        notes: 'Verificado pedagogicamente pelo corpus local.',
      }
    );
  }
}
