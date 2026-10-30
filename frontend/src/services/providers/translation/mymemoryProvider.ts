/**
 * MyMemory Translation Provider
 * Free community translation memory with attribution.
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, UnsupportedLanguageError } from '../types';
import { MyMemoryResponseSchema } from '../../validation/schemas';
import { normalizeTranslation } from '../../normalization/responseNormalizers';
import { NormalizedTranslationResult } from '../../../integrations/external-apis/core/types';
import { trilingualDictionary } from '../../../data/translationData';

export interface TranslationInput {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export class MyMemoryProvider extends BaseProvider<TranslationInput, NormalizedTranslationResult> {
  public readonly metadata: ProviderMetadata = {
    id: 'mymemory',
    name: 'MyMemory Translated',
    description: 'Collaborative translation memory API with community and human-verified segments.',
    category: 'translation',
    attribution: 'MyMemory (Translated.net) — Free Collaborative Translation Memory',
    attributionUrl: 'https://mymemory.translated.net',
    license: 'Attribution Required / Non-commercial Free Tier',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 10,
      windowMs: 1000,
    },
  };

  protected validateInput(input: TranslationInput): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'O texto para tradução não pode estar vazio.');
    }
    if (input.text.trim().length > 1000) {
      throw new ValidationError(
        this.metadata.id,
        `O texto excede o limite máximo permitido de 1.000 caracteres (${input.text.length} enviados).`
      );
    }
    if (!input.sourceLang || !input.targetLang) {
      throw new ValidationError(this.metadata.id, 'Os idiomas de origem e destino devem ser especificados.');
    }
  }

  protected generateCacheKey(input: TranslationInput): string {
    return `${input.sourceLang.toLowerCase()}:${input.targetLang.toLowerCase()}:${input.text.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: TranslationInput, signal: AbortSignal): Promise<unknown> {
    const encoded = encodeURIComponent(input.text.trim());
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${input.sourceLang}|${input.targetLang}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`MyMemory HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: unknown, input: TranslationInput): NormalizedTranslationResult {
    const parsed = MyMemoryResponseSchema.parse(raw);
    const translatedText = parsed.responseData.translatedText;

    if (!translatedText || translatedText.startsWith('MYMEMORY WARNING')) {
      throw new Error('MyMemory returned an invalid warning or quota notice.');
    }

    return normalizeTranslation(
      translatedText,
      input.sourceLang,
      input.targetLang,
      this.metadata.id,
      {
        isVerified: false,
        isApproximate: true,
        matchConfidence: parsed.responseData.match,
      }
    );
  }

  protected getFallback(input: TranslationInput, _err: unknown): NormalizedTranslationResult {
    const term = input.text.trim().toLowerCase();
    const entry = trilingualDictionary.find(
      d =>
        d.portuguese?.toLowerCase() === term ||
        d.spanish?.toLowerCase() === term ||
        d.english?.toLowerCase() === term
    );

    if (entry) {
      let targetVal = entry.english;
      if (input.targetLang === 'pt') targetVal = entry.portuguese;
      else if (input.targetLang === 'es') targetVal = entry.spanish;

      return normalizeTranslation(
        targetVal,
        input.sourceLang,
        input.targetLang,
        'local_dictionary_fallback',
        {
          isVerified: true,
          isApproximate: false,
          notes: 'Traduzido via vocabulário offline local de segurança.',
        }
      );
    }

    throw new Error(`Nenhuma tradução offline encontrada para "${input.text}".`);
  }
}
