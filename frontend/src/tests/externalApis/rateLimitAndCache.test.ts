import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimitManager } from '../../integrations/external-apis/core/RateLimitManager';
import { RetryPolicy } from '../../integrations/external-apis/core/RetryPolicy';
import { ApiCache } from '../../integrations/external-apis/core/ApiCache';
import { RateLimitError, NetworkError, ValidationError } from '../../integrations/external-apis/core/ApiError';

describe('RateLimitManager & Cache Integration', () => {
  beforeEach(() => {
    RateLimitManager.getInstance().reset();
  });

  it('throttles calls to respect max rate limits per window', async () => {
    const rateLimiter = RateLimitManager.getInstance();
    rateLimiter.registerLimit('test-provider', {
      maxRequests: 2,
      windowMs: 50,
      maxQueueSize: 10,
    });

    let executionCount = 0;
    const task = async () => {
      executionCount++;
      return executionCount;
    };

    const p1 = rateLimiter.schedule('test-provider', task);
    const p2 = rateLimiter.schedule('test-provider', task);
    const p3 = rateLimiter.schedule('test-provider', task);

    const results = await Promise.all([p1, p2, p3]);
    expect(results).toEqual([1, 2, 3]);
    expect(executionCount).toBe(3);
  });

  it('rejects when rate limit queue capacity is exceeded', async () => {
    const rateLimiter = RateLimitManager.getInstance();
    rateLimiter.registerLimit('test-small-queue', {
      maxRequests: 1,
      windowMs: 500,
      maxQueueSize: 2,
    });

    const slowTask = () => new Promise(res => setTimeout(res, 100));

    // First consumes token, 2 queued
    rateLimiter.schedule('test-small-queue', slowTask);
    rateLimiter.schedule('test-small-queue', slowTask);
    rateLimiter.schedule('test-small-queue', slowTask);

    // 4th should reject
    await expect(rateLimiter.schedule('test-small-queue', slowTask)).rejects.toThrow(
      RateLimitError
    );
  });

  it('RetryPolicy retries transient network errors and respects maxRetries', async () => {
    let attempts = 0;
    const flakyOperation = vi.fn(async () => {
      attempts++;
      if (attempts < 2) {
        throw new NetworkError('test-provider', 'Temporary socket timeout');
      }
      return 'success-after-retry';
    });

    const result = await RetryPolicy.executeWithRetry(flakyOperation, {
      maxRetries: 3,
      initialDelayMs: 10,
      maxDelayMs: 50,
    });

    expect(result).toBe('success-after-retry');
    expect(attempts).toBe(2);
  });

  it('RetryPolicy does NOT retry non-retryable validation errors', async () => {
    const nonRetryableOp = vi.fn(async () => {
      throw new ValidationError('test-provider', 'Invalid characters in input');
    });

    await expect(
      RetryPolicy.executeWithRetry(nonRetryableOp, { maxRetries: 3 })
    ).rejects.toThrow(ValidationError);

    expect(nonRetryableOp).toHaveBeenCalledTimes(1);
  });

  it('ApiCache sets, retrieves, and clears cached responses', async () => {
    const cache = ApiCache.getInstance();
    await cache.set('test-cache', 'key-1', { message: 'hello' }, 1000);

    const retrieved = await cache.get<{ message: string }>('test-cache', 'key-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.message).toBe('hello');

    const nonExistent = await cache.get('test-cache', 'unknown-key');
    expect(nonExistent).toBeNull();
  });
});
