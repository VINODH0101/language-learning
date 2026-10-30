/**
 * Core Types and Structured Errors for Provider Architecture
 * Lexilume — Illuminate Your Words
 */

export type ProviderCategory =
  | 'translation'
  | 'dictionary'
  | 'examples'
  | 'frequency'
  | 'reading'
  | 'media'
  | 'speech'
  | 'grammar'
  | 'ai'
  | 'countries'
  | 'weather'
  | 'air-quality'
  | 'holidays'
  | 'currency'
  | 'avatars'
  | 'maps'
  | 'analytics'
  | 'monitoring'
  | 'bot-protection';

export interface ProviderRateLimit {
  maxRequests: number;
  windowMs: number;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  category: ProviderCategory;
  attribution: string;
  attributionUrl?: string;
  license?: string;
  isPaid: boolean;
  requiresKey: boolean;
  supportedLanguages?: string[];
  rateLimitInfo?: ProviderRateLimit;
}

export interface ExecutionOptions {
  bypassCache?: boolean;
  ttlMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

// ============================================================================
// STRUCTURED ERRORS
// ============================================================================

export class ProviderError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly cause?: unknown
  ) {
    super(`[${providerId}] ${message}`);
    this.name = 'ProviderError';
  }
}

export class ValidationError extends ProviderError {
  constructor(providerId: string, message: string) {
    super(providerId, message, 400);
    this.name = 'ValidationError';
  }
}

export class UnsupportedLanguageError extends ProviderError {
  constructor(providerId: string, language: string, context?: string) {
    super(providerId, `Idioma "${language}" não suportado pelo provedor${context ? ` (${context})` : ''}.`, 422);
    this.name = 'UnsupportedLanguageError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(providerId: string, message: string = 'Taxa de requisições excedida. Aguarde alguns instantes.') {
    super(providerId, message, 429);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends ProviderError {
  constructor(providerId: string, timeoutMs: number) {
    super(providerId, `Requisição excedeu o tempo limite de ${timeoutMs}ms.`, 408);
    this.name = 'TimeoutError';
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(providerId: string, statusCode: number = 503, message: string = 'Serviço temporariamente indisponível.', cause?: unknown) {
    super(providerId, message, statusCode, cause);
    this.name = 'ProviderUnavailableError';
  }
}
