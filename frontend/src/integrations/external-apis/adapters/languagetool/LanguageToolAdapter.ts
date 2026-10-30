/**
 * LanguageTool API Adapter for interactive grammar and spelling proofreading.
 * Public endpoint: https://api.languagetool.org/v2/check
 */

import {
  BaseApiProvider,
  ProofreadingInput,
  NormalizedProofreadResult,
  NormalizedProofreadMatch,
  ProviderMetadata,
  ValidationError,
  ProviderUnavailableError,
} from '../../core';
import { falseFriends } from '../../../../data/seedData';

interface RawLTReplacement {
  value: string;
}

interface RawLTMiniRule {
  id: string;
  category?: {
    name?: string;
  };
  issueType?: string;
}

interface RawLTMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements?: RawLTReplacement[];
  rule?: RawLTMiniRule;
}

interface RawLTResponse {
  matches?: RawLTMatch[];
}

export class LanguageToolAdapter extends BaseApiProvider<ProofreadingInput, NormalizedProofreadResult> {
  public readonly metadata: ProviderMetadata = {
    id: 'languagetool',
    name: 'LanguageTool Grammar & Style Checker',
    description: 'Rule-based neural grammar, spelling, and stylistic proofreader supporting Portuguese, Spanish, and English.',
    type: 'proofreading',
    attribution: 'LanguageTool Community / Open Source Multilingual Proofreader',
    attributionUrl: 'https://languagetool.org',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 5,
      windowMs: 1000,
    },
  };

  protected validateInput(input: ProofreadingInput): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'O texto para revisão gramatical não pode estar vazio.');
    }
    if (input.text.length > 3000) {
      throw new ValidationError(
        this.metadata.id,
        `O texto excede o limite recomendado de 3.000 caracteres (${input.text.length} caracteres enviados).`
      );
    }
  }

  protected generateCacheKey(input: ProofreadingInput): string {
    const lang = this.mapLanguageCode(input.language);
    return `${lang}:${input.text.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: ProofreadingInput): Promise<unknown> {
    const lang = this.mapLanguageCode(input.language);
    const body = new URLSearchParams();
    body.append('text', input.text);
    body.append('language', lang);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    let response: Response;
    try {
      response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 429) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        429,
        'Limite de requisições do LanguageTool atingido temporariamente. Aguarde alguns instantes.'
      );
    }
    if (!response.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        response.status,
        `LanguageTool HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  protected normalize(raw: unknown, input: ProofreadingInput): NormalizedProofreadResult {
    const data = raw as RawLTResponse;
    const rawMatches = data?.matches || [];

    const matches: NormalizedProofreadMatch[] = rawMatches.map((m, idx) => ({
      id: `lt-${idx}-${m.offset}`,
      message: m.message,
      shortMessage: m.shortMessage || 'Gramática/Ortografia',
      offset: m.offset,
      length: m.length,
      replacements: (m.replacements || []).slice(0, 4).map(r => r.value),
      ruleId: m.rule?.id || 'UNKNOWN_RULE',
      category: m.rule?.category?.name || 'Grammar',
      issueType: m.rule?.issueType || 'style',
    }));

    return {
      text: input.text,
      language: input.language,
      matches,
      provider: this.metadata.id,
      hasErrors: matches.length > 0,
    };
  }

  protected getFallback(input: ProofreadingInput, _error: unknown): NormalizedProofreadResult {
    // Local offline heuristics: detect false friends and common mistakes
    const matches: NormalizedProofreadMatch[] = [];
    const textLower = input.text.toLowerCase();

    // Check false friends in target language
    for (const ff of falseFriends) {
      const term = input.language.startsWith('pt') ? ff.portuguese_term.toLowerCase() : ff.spanish_term.toLowerCase();
      const pos = textLower.indexOf(term);
      if (pos !== -1) {
        matches.push({
          id: `local-ff-${pos}`,
          message: `Atenção: falso amigo detectado. "${term}". ${ff.interference_warning}`,
          shortMessage: 'Falso Cognato',
          offset: pos,
          length: term.length,
          replacements: input.language.startsWith('pt') ? [ff.spanish_term] : [ff.portuguese_term],
          ruleId: 'FALSE_FRIEND_HEURISTIC',
          category: 'Interferência Linguística',
          issueType: 'warning',
        });
      }
    }

    // Check double words: e.g. "o o", "the the", "de de"
    const doubleWordRegex = /\b([a-zA-ZáéíóúÁÉÍÓÚñÑçÇ]+)\s+\1\b/gi;
    let dwMatch: RegExpExecArray | null;
    while ((dwMatch = doubleWordRegex.exec(input.text)) !== null) {
      matches.push({
        id: `local-dw-${dwMatch.index}`,
        message: `Palavra repetida consecutivamente: "${dwMatch[1]}"`,
        shortMessage: 'Repetição',
        offset: dwMatch.index,
        length: dwMatch[0].length,
        replacements: [dwMatch[1]],
        ruleId: 'CONSECUTIVE_DUPLICATE',
        category: 'Tipografia',
        issueType: 'typographical',
      });
    }

    return {
      text: input.text,
      language: input.language,
      matches,
      provider: 'offline-heuristics',
      hasErrors: matches.length > 0,
    };
  }

  private mapLanguageCode(lang: string): string {
    const l = (lang || 'pt').toLowerCase();
    if (l.startsWith('pt')) return 'pt-BR';
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en-US';
    return 'pt-BR';
  }
}
