/**
 * Standardized API Error hierarchy for external integrations.
 */

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'QUOTA_EXCEEDED_ERROR'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_UNAVAILABLE_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'PARSING_ERROR'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly provider: string;
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    options: {
      code: ApiErrorCode;
      provider: string;
      statusCode?: number;
      isRetryable?: boolean;
      details?: unknown;
      cause?: Error;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.code = options.code;
    this.provider = options.provider;
    this.statusCode = options.statusCode;
    this.isRetryable = options.isRetryable ?? false;
    this.details = options.details;
  }
}

export class NetworkError extends ApiError {
  constructor(provider: string, message = 'Network connection failed or timed out', cause?: Error) {
    super(message, {
      code: 'NETWORK_ERROR',
      provider,
      isRetryable: true,
      cause,
    });
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends ApiError {
  public readonly retryAfterMs: number;

  constructor(provider: string, retryAfterMs = 1000, message?: string) {
    super(
      message || `Rate limit exceeded for provider ${provider}. Retry in ${Math.round(retryAfterMs / 1000)}s.`,
      {
        code: 'RATE_LIMIT_ERROR',
        provider,
        statusCode: 429,
        isRetryable: true,
      }
    );
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class QuotaExceededError extends ApiError {
  constructor(provider: string, message?: string) {
    super(
      message || `Daily or ephemeral quota exceeded for provider ${provider}.`,
      {
        code: 'QUOTA_EXCEEDED_ERROR',
        provider,
        statusCode: 429,
        isRetryable: false,
      }
    );
    this.name = 'QuotaExceededError';
  }
}

export class ValidationError extends ApiError {
  constructor(provider: string, message: string, details?: unknown) {
    super(message, {
      code: 'VALIDATION_ERROR',
      provider,
      statusCode: 400,
      isRetryable: false,
      details,
    });
    this.name = 'ValidationError';
  }
}

export class ProviderUnavailableError extends ApiError {
  constructor(provider: string, statusCode = 503, message?: string, cause?: Error) {
    super(
      message || `Provider ${provider} is temporarily unavailable (status ${statusCode}).`,
      {
        code: 'PROVIDER_UNAVAILABLE_ERROR',
        provider,
        statusCode,
        isRetryable: statusCode >= 500 && statusCode < 600,
        cause,
      }
    );
    this.name = 'ProviderUnavailableError';
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.isRetryable;
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network disconnect / CORS drop
  }
  return false;
}
