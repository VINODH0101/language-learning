/**
 * Google Gemini API Client Adapter (Educational Content Generation Contract).
 * Strictly guarantees ZERO API KEY EXPOSURE in browser bundles.
 * Client uses deterministic local pedagogical templates and pre-generated
 * curricula, delegating live LLM calls exclusively to server/pipeline workflows.
 */

import {
  BaseApiProvider,
  ProviderMetadata,
  ValidationError,
} from '../../core';
import { ClientLessonGenerator } from '../../../../services/lessonGenerator';
import { DailyLessonPayload, Language, CEFRLevel, CourseConfig } from '../../../../types';

export interface GeminiContentInput {
  language: Language;
  level: CEFRLevel;
  topic?: string;
  seedPrompt?: string;
}

export class GeminiAdapter extends BaseApiProvider<GeminiContentInput, DailyLessonPayload> {
  public readonly metadata: ProviderMetadata = {
    id: 'gemini',
    name: 'Google Gemini Educational Generator',
    description: 'Server-side structured curriculum generation engine with offline deterministic browser contract.',
    type: 'content_generator',
    attribution: 'Google Gemini API / Polyglot C1 Pedagogical Pipeline',
    attributionUrl: 'https://ai.google.dev',
    isPaid: false,
    requiresKey: false, // In browser, zero client key required!
    rateLimitInfo: {
      maxRequests: 5,
      windowMs: 1000,
    },
  };

  protected validateInput(input: GeminiContentInput): void {
    if (!['pt', 'es', 'en'].includes(input.language)) {
      throw new ValidationError(this.metadata.id, `Idioma inválido para geração: ${input.language}`);
    }
    if (!input.level) {
      throw new ValidationError(this.metadata.id, 'O nível CEFR deve ser especificado.');
    }
  }

  protected generateCacheKey(input: GeminiContentInput): string {
    return `${input.language}:${input.level}:${input.topic || 'daily'}`;
  }

  protected async fetchRaw(input: GeminiContentInput): Promise<unknown> {
    const today = new Date().toISOString().split('T')[0];
    const config: CourseConfig = {
      target_language: input.language,
      cefr_level: input.level,
      explanation_language: 'en',
      regional_variant: input.language === 'pt' ? 'pt-BR' : input.language === 'es' ? 'es-ES' : 'en-US',
    };
    return ClientLessonGenerator.generateOrGetLesson(config, today);
  }

  protected normalize(raw: unknown, _input: GeminiContentInput): DailyLessonPayload {
    return raw as DailyLessonPayload;
  }

  protected getFallback(input: GeminiContentInput, _error: unknown): DailyLessonPayload {
    const today = new Date().toISOString().split('T')[0];
    const config: CourseConfig = {
      target_language: input.language,
      cefr_level: input.level,
      explanation_language: 'en',
      regional_variant: input.language === 'pt' ? 'pt-BR' : input.language === 'es' ? 'es-ES' : 'en-US',
    };
    return ClientLessonGenerator.generateOrGetLesson(config, today);
  }
}
