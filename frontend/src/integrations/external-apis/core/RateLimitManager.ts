/**
 * Rate Limiting Manager implementing token-bucket and delay-throttling per provider.
 * Especially crucial for Jikan (3 requests/second) and public APIs.
 */

import { RateLimitError } from './ApiError';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxQueueSize?: number;
}

interface QueuedTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export class RateLimitManager {
  private static instance: RateLimitManager;
  private configs: Map<string, RateLimitConfig> = new Map();
  private timestamps: Map<string, number[]> = new Map();
  private queues: Map<string, QueuedTask<unknown>[]> = new Map();
  private isProcessing: Map<string, boolean> = new Map();

  private constructor() {
    // Default rate limit for Jikan: 3 requests per 1000ms
    this.registerLimit('jikan', { maxRequests: 3, windowMs: 1000, maxQueueSize: 50 });
    // Default rate limit for LanguageTool: 5 requests per 1000ms
    this.registerLimit('languagetool', { maxRequests: 5, windowMs: 1000, maxQueueSize: 30 });
    // Default rate limit for MyMemory: 10 requests per 1000ms
    this.registerLimit('mymemory', { maxRequests: 10, windowMs: 1000, maxQueueSize: 50 });
  }

  public static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }

  public registerLimit(providerId: string, config: RateLimitConfig): void {
    this.configs.set(providerId, config);
    if (!this.timestamps.has(providerId)) {
      this.timestamps.set(providerId, []);
    }
    if (!this.queues.has(providerId)) {
      this.queues.set(providerId, []);
    }
  }

  /**
   * Schedule execution through the rate-limited queue.
   */
  public async schedule<T>(providerId: string, task: () => Promise<T>): Promise<T> {
    const config = this.configs.get(providerId);
    if (!config) {
      // Unrestricted provider
      return task();
    }

    const queue = this.queues.get(providerId)!;
    const maxQueue = config.maxQueueSize ?? 50;

    if (queue.length >= maxQueue) {
      throw new RateLimitError(
        providerId,
        config.windowMs,
        `Queue capacity exceeded for provider ${providerId}. Please wait.`
      );
    }

    return new Promise<T>((resolve, reject) => {
      queue.push({
        execute: task as () => Promise<unknown>,
        resolve: resolve as (val: unknown) => void,
        reject,
      });
      this.processQueue(providerId);
    });
  }

  private async processQueue(providerId: string): Promise<void> {
    if (this.isProcessing.get(providerId)) return;
    this.isProcessing.set(providerId, true);

    const config = this.configs.get(providerId)!;
    const queue = this.queues.get(providerId)!;
    const history = this.timestamps.get(providerId)!;

    while (queue.length > 0) {
      const now = Date.now();
      // Remove timestamps outside window
      while (history.length > 0 && history[0] <= now - config.windowMs) {
        history.shift();
      }

      if (history.length < config.maxRequests) {
        const item = queue.shift();
        if (item) {
          history.push(Date.now());
          item.execute().then(item.resolve).catch(item.reject);
        }
      } else {
        // Must wait until oldest token clears
        const waitTime = Math.max(10, history[0] + config.windowMs - now + 5);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }

    this.isProcessing.set(providerId, false);
  }

  /**
   * Reset limits and queues (useful for testing).
   */
  public reset(): void {
    this.timestamps.clear();
    this.queues.clear();
    this.isProcessing.clear();
  }
}
