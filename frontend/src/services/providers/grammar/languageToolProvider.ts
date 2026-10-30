/**
 * LanguageTool Grammar and Proofreading Provider
 * https://languagetool.org/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { LanguageToolResponseSchema } from '../../validation/schemas';
import {
  NormalizedProofreadResult,
  NormalizedProofreadMatch,
} from '../../../integrations/external-apis/core/types';

export interface GrammarCheckInput {
  text: string;
  language: string; // e.g. pt-BR, es, en-US
}

export class LanguageToolProvider extends BaseProvider<GrammarCheckInput, NormalizedProofreadResult> {
  private endpoint: string;

  public readonly metadata: ProviderMetadata = {
    id: 'languagetool',
    name: 'LanguageTool Grammar Engine',
    description: 'Multilingual grammar, style, and spell-checking rule engine with localized suggestions.',
    category: 'grammar',
    attribution: 'LanguageTool Community — LGPL 2.1 (Self-Hosted / Public API)',
    attributionUrl: 'https://languagetool.org',
    license: 'LGPL 2.1',
    isPaid: false,
    requiresKey: false,
    supportedLanguages: ['en-US', 'en-GB', 'pt-BR', 'pt-PT', 'es', 'fr', 'de', 'it', 'nl', 'ru', 'zh', 'ta'],
    rateLimitInfo: {
      maxRequests: 20,
      windowMs: 60000,
    },
  };

  constructor(endpoint?: string) {
    super();
    this.endpoint =
      endpoint ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LANGUAGETOOL_URL) ||
      'https://api.languagetool.org/v2/check';
  }

  protected validateInput(input: GrammarCheckInput): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Texto para análise gramatical não pode estar vazio.');
    }
    if (input.text.trim().length > 5000) {
      throw new ValidationError(this.metadata.id, 'Texto excede o limite máximo permitido de 5.000 caracteres.');
    }
  }

  protected generateCacheKey(input: GrammarCheckInput): string {
    return `${input.language}:${input.text.trim()}`;
  }

  protected async fetchRaw(input: GrammarCheckInput, signal: AbortSignal): Promise<unknown> {
    const params = new URLSearchParams({
      text: input.text,
      language: input.language,
    });

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
      signal,
    });

    if (!response.ok) {
      throw new Error(`LanguageTool HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: GrammarCheckInput): NormalizedProofreadResult {
    const parsed = LanguageToolResponseSchema.parse(raw);
    const matches: NormalizedProofreadMatch[] = parsed.matches.map((m, idx) => ({
      id: `match-${idx}-${m.offset}`,
      message: m.message,
      shortMessage: m.shortMessage,
      offset: m.offset,
      length: m.length,
      replacements: m.replacements.map(r => r.value).slice(0, 5),
      ruleId: m.rule?.id || 'GRAMMAR_RULE',
      category: m.rule?.category?.name || 'Gramática',
      issueType: m.rule?.issueType || 'grammar',
    }));

    return {
      text: input.text,
      language: input.language,
      matches,
      provider: this.metadata.id,
      hasErrors: matches.length > 0,
    };
  }
}
