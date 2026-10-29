/**
 * Retry Policy with exponential backoff and jitter for transient API failures.
 */

import { RetryOptions } from './types';
import { isRetryableError, RateLimitError } from './ApiError';

export class RetryPolicy {
  public static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 2;
    const initialDelayMs = options.initialDelayMs ?? 300;
    const maxDelayMs = options.maxDelayMs ?? 3000;
    const backoffFactor = options.backoffFactor ?? 2;

    let attempt = 0;
    let delay = initialDelayMs;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt > maxRetries || !isRetryableError(error)) {
          throw error;
        }

        // Check if error specified a retry-after duration
        let waitTime = delay;
        if (error instanceof RateLimitError && error.retryAfterMs > 0) {
          waitTime = Math.min(error.retryAfterMs, maxDelayMs);
        } else {
          // Add 10-20% jitter to prevent thundering herd
          const jitter = Math.random() * 0.2 * waitTime;
          waitTime = Math.min(waitTime + jitter, maxDelayMs);
          delay = Math.min(delay * backoffFactor, maxDelayMs);
        }

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}
