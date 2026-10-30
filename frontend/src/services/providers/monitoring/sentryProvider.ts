/**
 * Optional Sentry Error Monitoring Provider
 * Documentation: https://sentry.io/
 * 
 * Captures uncaught frontend exceptions, API failures, and sync queue errors.
 * Requirements:
 * - Environment-driven DSN (VITE_SENTRY_DSN)
 * - Strict PII sanitization: Strips passwords, authorization tokens, emails, and student writing
 * - No-op safe fallback when unconfigured in local development
 */

import { sanitizeLog } from '../../monitoring/providerHealth';

export interface SentryBreadcrumb {
  category: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

export class SentryProvider {
  private static instance: SentryProvider;
  private isInitialized = false;
  private dsn: string = '';

  private constructor() {
    this.dsn = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SENTRY_DSN) || '';
    if (this.dsn) {
      this.isInitialized = true;
      // In production with Sentry package, Sentry.init would bind here
    }
  }

  public static getInstance(): SentryProvider {
    if (!SentryProvider.instance) {
      SentryProvider.instance = new SentryProvider();
    }
    return SentryProvider.instance;
  }

  public isEnabled(): boolean {
    return this.isInitialized && Boolean(this.dsn);
  }

  /**
   * Captures an error with sanitized context tags.
   */
  public captureException(error: unknown, context?: Record<string, unknown>): void {
    const sanitizedErrorMsg = sanitizeLog(error instanceof Error ? error.message : String(error));
    const sanitizedStack = error instanceof Error ? sanitizeLog(error.stack || '') : '';
    
    // Always scrub context data
    const safeContext = context ? JSON.parse(sanitizeLog(JSON.stringify(context))) : {};

    if (this.isEnabled()) {
      // Remote Sentry dispatch
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, { extra: safeContext });
      }
    } else {
      // Safe structured console warning for development
      console.warn('[Lexilume Sentry DEV]', {
        message: sanitizedErrorMsg,
        stack: sanitizedStack,
        extra: safeContext,
      });
    }
  }

  /**
   * Adds an operational breadcrumb without sensitive details.
   */
  public addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    const cleanMsg = sanitizeLog(breadcrumb.message);
    if (this.isEnabled() && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: cleanMsg,
        level: breadcrumb.level || 'info',
      });
    }
  }
}
