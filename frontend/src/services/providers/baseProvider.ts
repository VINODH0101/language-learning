/**
 * Abstract Base Provider with Complete Execution Lifecycle
 * Lexilume — Illuminate Your Words
 */

import { ProviderCache } from '../cache/providerCache';
import { ProviderHealthTracker } from '../monitoring/providerHealth';
import {
  ProviderMetadata,
  ExecutionOptions,
  ValidationError,
  TimeoutError,
  ProviderUnavailableError,
  UnsupportedLanguageError,
} from './types';

export abstract class BaseProvider<TInput, TOutput> {
  public abstract readonly metadata: ProviderMetadata;

  protected cache = ProviderCache.getInstance();
  protected healthTracker = ProviderHealthTracker.getInstance();

  constructor() {
    // Self-register with health tracker
    setTimeout(() => {
      this.healthTracker.registerProvider(
        this.metadata.id,
        this.metadata.name,
        this.metadata.category
      );
    }, 0);
  }

  /**
   * Validate input parameters. Throws ValidationError if invalid.
   */
  protected abstract validateInput(input: TInput): void;

  /**
   * Generates a stable cache key from input.
   */
  protected abstract generateCacheKey(input: TInput): string;

  /**
   * Execute actual network or I/O request with AbortSignal support.
   */
  protected abstract fetchRaw(input: TInput, signal: AbortSignal): Promise<unknown>;

  /**
   * Validates and normalizes raw response into strongly-typed output.
   */
  protected abstract normalize(raw: unknown, input: TInput): TOutput;

  /**
   * Optional language compatibility check.
   */
  protected checkLanguageSupport?(input: TInput): void;

  /**
   * Optional fallback when network or provider fails.
   */
  protected getFallback?(input: TInput, error: unknown): Promise<TOutput> | TOutput;

  /**
   * Default timeout in milliseconds.
   */
  protected get defaultTimeoutMs(): number {
    return 7000;
  }

  /**
   * Default max retries.
   */
  protected get defaultMaxRetries(): number {
    return 2;
  }

  /**
   * Full execution lifecycle.
   */
  public async execute(input: TInput, options?: ExecutionOptions): Promise<TOutput> {
    const startTime = Date.now();

    // 1. Input Validation
    this.validateInput(input);

    // 2. Language Capability Check
    if (this.checkLanguageSupport) {
      this.checkLanguageSupport(input);
    }

    const cacheKey = this.generateCacheKey(input);

    // 3. Cache Lookup
    if (!options?.bypassCache) {
      const cached = await this.cache.get<TOutput>(this.metadata.id, cacheKey);
      if (cached !== null) {
        this.healthTracker.recordSuccess(this.metadata.id, 0);
        return {
          ...cached,
          fromCache: true,
        };
      }
    }

    // 4. Request with Timeout & Retries
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const raw = await this.fetchRaw(input, controller.signal);
        clearTimeout(timeoutId);

        // 5. Response Normalization & Schema Validation
        const normalized = this.normalize(raw, input);

        // 6. Cache Storage
        await this.cache.set(this.metadata.id, cacheKey, normalized, options?.ttlMs);

        // 7. Record Metrics
        const latency = Date.now() - startTime;
        this.healthTracker.recordSuccess(this.metadata.id, latency);

        return normalized;
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          lastError = new TimeoutError(this.metadata.id, timeoutMs);
        } else {
          lastError = err;
        }

        // If validation or unsupported language, don't retry
        if (err instanceof ValidationError || err instanceof UnsupportedLanguageError) {
          break;
        }

        // Jittered backoff delay before retry
        if (attempt < maxRetries) {
          const delay = Math.min(2500, 300 * Math.pow(2, attempt) + Math.random() * 100);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }

    // 8. Record Failure Metrics
    const latency = Date.now() - startTime;
    this.healthTracker.recordFailure(this.metadata.id, lastError, latency);

    // 9. Execute Fallback (if registered)
    if (this.getFallback) {
      try {
        return await this.getFallback(input, lastError);
      } catch (fallbackErr) {
        console.warn(`[${this.metadata.id}] Fallback failed:`, fallbackErr);
      }
    }

    // 10. Re-throw structured error
    if (
      lastError instanceof ValidationError ||
      lastError instanceof UnsupportedLanguageError ||
      lastError instanceof TimeoutError
    ) {
      throw lastError;
    }

    throw new ProviderUnavailableError(
      this.metadata.id,
      503,
      lastError instanceof Error ? lastError.message : 'Provider request failed',
      lastError
    );
  }
}
