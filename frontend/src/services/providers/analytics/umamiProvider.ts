/**
 * Umami Privacy-Friendly Product Analytics Provider
 * Documentation: https://umami.is/
 * 
 * Tracks educational usage milestones without collecting personal data, cookies, or student text.
 * Features:
 * - Event tracking with privacy safeguards
 * - Environment variables configuration (VITE_UMAMI_WEBSITE_ID, VITE_UMAMI_SRC)
 * - Safe no-op fallback when disabled in local development
 */

export type UmamiEventName =
  | 'registration_completed'
  | 'onboarding_completed'
  | 'language_selected'
  | 'lesson_started'
  | 'lesson_completed'
  | 'vocabulary_saved'
  | 'review_completed'
  | 'reading_activity_started'
  | 'writing_activity_completed'
  | 'speaking_practice_started'
  | 'country_explored'
  | 'weather_practiced'
  | 'currency_calculated';

export class UmamiProvider {
  private static instance: UmamiProvider;
  private websiteId: string = '';
  private scriptUrl: string = '';

  private constructor() {
    this.websiteId = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UMAMI_WEBSITE_ID) || '';
    this.scriptUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UMAMI_SRC) || '';
  }

  public static getInstance(): UmamiProvider {
    if (!UmamiProvider.instance) {
      UmamiProvider.instance = new UmamiProvider();
    }
    return UmamiProvider.instance;
  }

  public isEnabled(): boolean {
    return Boolean(this.websiteId);
  }

  /**
   * Tracks a privacy-preserving product usage milestone.
   */
  public trackEvent(eventName: UmamiEventName, eventData?: Record<string, string | number>): void {
    // Sanitize eventData: only numbers and non-sensitive category strings
    const sanitizedData: Record<string, string | number> = {};
    if (eventData) {
      for (const [key, value] of Object.entries(eventData)) {
        // Exclude any keys that might contain sensitive text or names
        if (/(text|password|email|input|query|sentence|token)/i.test(key)) continue;
        if (typeof value === 'string' && value.length > 50) continue;
        sanitizedData[key] = value;
      }
    }

    if (this.isEnabled() && typeof window !== 'undefined' && (window as any).umami) {
      try {
        (window as any).umami.track(eventName, sanitizedData);
      } catch (e) {
        // Silently ignore telemetry dispatch errors
      }
    } else {
      // Development mode non-intrusive log
      if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
        console.debug(`[Umami Analytics DEV] ${eventName}`, sanitizedData);
      }
    }
  }
}
