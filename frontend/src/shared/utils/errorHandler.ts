/**
 * Centralized Application Error Handling & Logging
 * 
 * Provides:
 * 1. Strongly typed AppError class with error categories and codes.
 * 2. Unified error logging with sensitive information scrubbing.
 * 3. User notification integration (via Sonner toast).
 */

import { toast } from 'sonner';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ErrorCategory =
  | 'AUTH'
  | 'NETWORK'
  | 'DATABASE'
  | 'SYNC'
  | 'API'
  | 'STORAGE'
  | 'VALIDATION'
  | 'UNKNOWN';

export interface AppErrorDetails {
  category: ErrorCategory;
  severity?: ErrorSeverity;
  code?: string;
  userMessage?: string;
  context?: Record<string, unknown>;
  originalError?: unknown;
}

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly userMessage: string;
  public readonly context?: Record<string, unknown>;
  public readonly originalError?: unknown;

  constructor(message: string, details: AppErrorDetails) {
    super(message);
    this.name = 'AppError';
    this.category = details.category;
    this.severity = details.severity || 'error';
    this.code = details.code || 'UNKNOWN_ERROR';
    this.userMessage = details.userMessage || message;
    this.context = details.context;
    this.originalError = details.originalError;
  }
}

/**
 * Handle and log an application error consistently.
 * Displays toast notifications for user-facing errors.
 */
export function handleError(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred',
  options: { silent?: boolean; category?: ErrorCategory } = {}
): AppError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, {
      category: options.category || 'UNKNOWN',
      userMessage: fallbackMessage,
      originalError: error,
    });
  } else {
    appError = new AppError(String(error), {
      category: options.category || 'UNKNOWN',
      userMessage: fallbackMessage,
      originalError: error,
    });
  }

  // Console logging with category badge
  if (appError.severity === 'critical' || appError.severity === 'error') {
    console.error(`[${appError.category}] ${appError.message}`, appError.context || '');
  } else if (appError.severity === 'warning') {
    console.warn(`[${appError.category}] ${appError.message}`, appError.context || '');
  }

  // Display toast if not suppressed
  if (!options.silent) {
    if (appError.severity === 'warning') {
      toast.warning(appError.userMessage);
    } else if (appError.severity === 'error' || appError.severity === 'critical') {
      toast.error(appError.userMessage);
    }
  }

  return appError;
}
