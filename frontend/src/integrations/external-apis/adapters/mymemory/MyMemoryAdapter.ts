/**
 * MyMemory Translation Memory API Adapter.
 * Public endpoint: https://api.mymemory.translated.net/get
 */

import {
  BaseApiProvider,
  TranslationInput,
  NormalizedTranslationResult,
  ProviderMetadata,
  ValidationError,
  QuotaExceededError,
  ProviderUnavailableError,
} from '../../core';
import { StorageService } from '../../../../services/storage';
import { trilingualDictionary } from '../../../../data/translationData';

export class MyMemoryAdapter extends BaseApiProvider<TranslationInput, NormalizedTranslationResult> {
  public readonly metadata: ProviderMetadata = {
    id: 'mymemory',
    name: 'MyMemory Translation Memory',
    description: 'Free public translation memory API supporting English, Portuguese, and Spanish.',
    type: 'translation',
    attribution: 'MyMemory (Translated.net) — Collaborative Translation Memory',
    attributionUrl: 'https://mymemory.translated.net',
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

  protected async fetchRaw(input: TranslationInput): Promise<unknown> {
    // Ephemeral quota guard check
    const quotaOk = StorageService.consumeTranslationQuotaToken(false);
    if (!quotaOk) {
      throw new QuotaExceededError(this.metadata.id, 'Limite diário de traduções gratuitas atingido. Tente novamente amanhã.');
    }

    const encoded = encodeURIComponent(input.text.trim());
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${input.sourceLang}|${input.targetLang}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        response.status,
        `MyMemory HTTP error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  protected normalize(raw: unknown, input: TranslationInput): NormalizedTranslationResult {
    const data = raw as {
      responseData?: {
        translatedText?: string;
        match?: number;
      };
      responseStatus?: number;
    };

    const translatedText = data?.responseData?.translatedText;
    if (!translatedText || translatedText.startsWith('MYMEMORY WARNING')) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        500,
        'MyMemory returned invalid or rate-limited response.'
      );
    }

    return {
      translatedText: translatedText.trim(),
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      provider: this.metadata.id,
      isVerified: false,
      isApproximate: true,
      matchConfidence: data?.responseData?.match ?? 0.85,
      notes: 'Tradução automática via MyMemory. Não verificada por professores.',
      fromCache: false,
    };
  }

  protected getFallback(input: TranslationInput, _error: unknown): NormalizedTranslationResult {
    const q = input.text.trim().toLowerCase();
    
    // Check trilingual dictionary
    for (const item of trilingualDictionary) {
      if (input.sourceLang === 'pt' && input.targetLang === 'en' && item.portuguese.toLowerCase() === q) {
        return {
          translatedText: item.english,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          provider: 'offline-dictionary',
          isVerified: true,
          isApproximate: false,
          notes: item.notes_for_pt_speakers,
        };
      }
      if (input.sourceLang === 'es' && input.targetLang === 'en' && item.spanish.toLowerCase() === q) {
        return {
          translatedText: item.english,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          provider: 'offline-dictionary',
          isVerified: true,
          isApproximate: false,
          notes: item.notes_for_es_speakers,
        };
      }
      if (input.sourceLang === 'en' && input.targetLang === 'pt' && item.english.toLowerCase() === q) {
        return {
          translatedText: item.portuguese,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          provider: 'offline-dictionary',
          isVerified: true,
          isApproximate: false,
        };
      }
      if (input.sourceLang === 'en' && input.targetLang === 'es' && item.english.toLowerCase() === q) {
        return {
          translatedText: item.spanish,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          provider: 'offline-dictionary',
          isVerified: true,
          isApproximate: false,
        };
      }
    }

    // Default echo fallback
    return {
      translatedText: input.text.trim(),
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      provider: 'fallback',
      isVerified: false,
      isApproximate: true,
      notes: 'Tradução indisponível offline para sentenças completas. Consulte termos no vocabulário.',
    };
  }
}
