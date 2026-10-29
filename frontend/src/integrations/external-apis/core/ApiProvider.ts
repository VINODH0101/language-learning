/**
 * Base Abstract Provider and provider-specific interfaces.
 */

import {
  ProviderMetadata,
  ProviderMetrics,
  ProviderStatus,
  CacheOptions,
  RetryOptions,
  NormalizedTranslationResult,
  NormalizedDictionaryEntry,
  NormalizedReadingArticle,
  NormalizedProofreadResult,
  NormalizedCulturalEntity,
} from './types';
import { ApiError, NetworkError, ProviderUnavailableError } from './ApiError';
import { ApiCache } from './ApiCache';
import { RateLimitManager } from './RateLimitManager';
import { RetryPolicy } from './RetryPolicy';

export abstract class BaseApiProvider<TInput, TOutput> {
  public abstract readonly metadata: ProviderMetadata;
  public status: ProviderStatus = 'ready';
  public metrics: ProviderMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedRequests: 0,
    averageLatencyMs: 0,
  };

  protected cache = ApiCache.getInstance();
  protected rateLimiter = RateLimitManager.getInstance();

  /**
   * Validate the input before attempting network requests.
   * Throws ValidationError if invalid.
   */
  protected abstract validateInput(input: TInput): void;

  /**
   * Generate unique cache key for the given input.
   */
  protected abstract generateCacheKey(input: TInput): string;

  /**
   * Execute actual network request.
   */
  protected abstract fetchRaw(input: TInput): Promise<unknown>;

  /**
   * Normalize external response into application domain model.
   */
  protected abstract normalize(raw: unknown, input: TInput): TOutput;

  /**
   * Optional local fallback if request fails or offline.
   */
  protected getFallback?(input: TInput, error: unknown): Promise<TOutput> | TOutput;

  /**
   * Custom retry options for this provider.
   */
  protected getRetryOptions(): RetryOptions {
    return {
      maxRetries: 2,
      initialDelayMs: 300,
      maxDelayMs: 2500,
    };
  }

  /**
   * Unified execution pipeline:
   * Validation -> Cache Check -> Rate Limiting -> Retry Fetch -> Normalize -> Cache Store -> Metrics
   */
  public async execute(input: TInput, options?: CacheOptions): Promise<TOutput> {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    this.metrics.lastRequestAt = new Date().toISOString();

    // 1. Validation
    this.validateInput(input);

    const cacheKey = this.generateCacheKey(input);

    // 2. Cache Lookup
    if (!options?.bypassCache) {
      const cached = await this.cache.get<TOutput>(this.metadata.id, cacheKey);
      if (cached !== null) {
        this.metrics.cachedRequests++;
        this.metrics.successfulRequests++;
        this.status = 'ready';
        if (Array.isArray(cached)) {
          return cached;
        }
        return {
          ...cached,
          fromCache: true,
        };
      }
    }

    // 3. Execution via Rate Limiter + Retry Policy
    try {
      const rawData = await this.rateLimiter.schedule(this.metadata.id, async () => {
        return await RetryPolicy.executeWithRetry(async () => {
          return await this.fetchRaw(input);
        }, this.getRetryOptions());
      });

      // 4. Normalization
      const normalized = this.normalize(rawData, input);

      // 5. Cache Store
      await this.cache.set(this.metadata.id, cacheKey, normalized, options?.ttlMs);

      // 6. Record Success Metrics
      const latency = Date.now() - startTime;
      this.recordLatency(latency);
      this.metrics.successfulRequests++;
      this.status = 'ready';

      return normalized;
    } catch (err) {
      const latency = Date.now() - startTime;
      this.recordLatency(latency);
      this.metrics.failedRequests++;
      this.metrics.lastError = err instanceof Error ? err.message : String(err);

      if (err instanceof NetworkError || (err instanceof Error && err.name === 'TypeError')) {
        this.status = 'offline';
      } else {
        this.status = 'degraded';
      }

      // 7. Check for Graceful Local Fallback
      if (this.getFallback) {
        try {
          return await this.getFallback(input, err);
        } catch (fallbackErr) {
          console.warn(`Fallback also failed for ${this.metadata.id}:`, fallbackErr);
        }
      }

      if (err instanceof ApiError) {
        throw err;
      }
      throw new ProviderUnavailableError(
        this.metadata.id,
        500,
        err instanceof Error ? err.message : 'Unknown provider error',
        err instanceof Error ? err : undefined
      );
    }
  }

  private recordLatency(latencyMs: number): void {
    const count = this.metrics.successfulRequests + this.metrics.failedRequests;
    if (count <= 1) {
      this.metrics.averageLatencyMs = latencyMs;
    } else {
      this.metrics.averageLatencyMs = Math.round(
        (this.metrics.averageLatencyMs * (count - 1) + latencyMs) / count
      );
    }
  }
}

// ============================================================================
// TYPED PROVIDER INTERFACES
// ============================================================================

export interface TranslationInput {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export type ITranslationProvider = BaseApiProvider<TranslationInput, NormalizedTranslationResult>;

export interface DictionaryInput {
  word: string;
  language: string;
}

export type IDictionaryProvider = BaseApiProvider<DictionaryInput, NormalizedDictionaryEntry>;

export interface ReadingInput {
  query?: string;
  language: string;
  date?: string; // YYYY/MM/DD
  limit?: number;
}

export type IReadingProvider = BaseApiProvider<ReadingInput, NormalizedReadingArticle[]>;

export interface ProofreadingInput {
  text: string;
  language: string; // e.g. pt-BR, es, en-US
}

export type IProofreadingProvider = BaseApiProvider<ProofreadingInput, NormalizedProofreadResult>;

export interface CultureInput {
  query: string;
  category?: string;
}

export type ICultureProvider = BaseApiProvider<CultureInput, NormalizedCulturalEntity[]>;
