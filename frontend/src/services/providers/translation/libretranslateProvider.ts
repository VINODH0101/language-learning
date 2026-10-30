/**
 * LibreTranslate Provider
 * Open-source self-hostable translation engine with API key support.
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { LibreTranslateResponseSchema } from '../../validation/schemas';
import { normalizeTranslation } from '../../normalization/responseNormalizers';
import { NormalizedTranslationResult } from '../../../integrations/external-apis/core/types';
import { trilingualDictionary } from '../../../data/translationData';

export interface LibreTranslateConfig {
  endpoint?: string;
  apiKey?: string;
}

export class LibreTranslateProvider extends BaseProvider<{ text: string; sourceLang: string; targetLang: string }, NormalizedTranslationResult> {
  private endpoint: string;
  private apiKey?: string;

  public readonly metadata: ProviderMetadata = {
    id: 'libretranslate',
    name: 'LibreTranslate (Self-Hosted / Open API)',
    description: 'Free and open source machine translation engine powered by Argos Translate.',
    category: 'translation',
    attribution: 'LibreTranslate — AGPLv3 Open Source Neural Machine Translation',
    attributionUrl: 'https://libretranslate.com',
    license: 'AGPLv3',
    isPaid: false,
    requiresKey: false,
  };

  constructor(config?: LibreTranslateConfig) {
    super();
    this.endpoint = config?.endpoint || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LIBRETRANSLATE_URL) || 'http://localhost:5000';
    this.apiKey = config?.apiKey || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LIBRETRANSLATE_API_KEY);
  }

  protected validateInput(input: { text: string; sourceLang: string; targetLang: string }): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'O texto para tradução não pode estar vazio.');
    }
    if (!input.sourceLang || !input.targetLang) {
      throw new ValidationError(this.metadata.id, 'Idiomas de origem e destino são obrigatórios.');
    }
  }

  protected generateCacheKey(input: { text: string; sourceLang: string; targetLang: string }): string {
    return `${input.sourceLang.toLowerCase()}:${input.targetLang.toLowerCase()}:${input.text.trim().toLowerCase()}`;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint}/languages`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  protected async fetchRaw(
    input: { text: string; sourceLang: string; targetLang: string },
    signal: AbortSignal
  ): Promise<unknown> {
    const body: Record<string, string> = {
      q: input.text,
      source: input.sourceLang,
      target: input.targetLang,
      format: 'text',
    };

    if (this.apiKey) {
      body.api_key = this.apiKey;
    }

    const response = await fetch(`${this.endpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(
    raw: unknown,
    input: { text: string; sourceLang: string; targetLang: string }
  ): NormalizedTranslationResult {
    const parsed = LibreTranslateResponseSchema.parse(raw);

    if (parsed.error) {
      throw new Error(`LibreTranslate API error: ${parsed.error}`);
    }

    return normalizeTranslation(
      parsed.translatedText,
      input.sourceLang,
      input.targetLang,
      this.metadata.id,
      {
        isVerified: false,
        isApproximate: true,
        matchConfidence: parsed.detectedLanguage?.confidence ?? 0.88,
      }
    );
  }

  protected getFallback(
    input: { text: string; sourceLang: string; targetLang: string },
    _err: unknown
  ): NormalizedTranslationResult {
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
