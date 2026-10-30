/**
 * Dedicated User Preferences Service
 * 
 * Separates user preferences (UI theme, interface language, notification settings)
 * from core pedagogical learning progress (courses, SRS intervals, lesson completions).
 */

import { StorageService } from './storage';
import { InterfaceLanguage } from '../lib/languages/languageMatrix';

export interface UserPreferences {
  interfaceLanguage: InterfaceLanguage;
  dailyGoalMinutes: number;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  targetTimezone: string;
}

const PREFERENCES_KEY = 'lexilume_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  interfaceLanguage: 'en',
  dailyGoalMinutes: 20,
  emailNotifications: true,
  theme: 'dark',
  targetTimezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC',
};

export class PreferencesService {
  /**
   * Load user preferences scoped by active user.
   */
  public static getPreferences(userId?: string): UserPreferences {
    try {
      const key = StorageService.getKey(PREFERENCES_KEY, userId);
      const raw = localStorage.getItem(key);
      if (raw) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch {
      // Fallback on parse failure
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save user preferences scoped by active user.
   */
  public static savePreferences(prefs: Partial<UserPreferences>, userId?: string): UserPreferences {
    const current = this.getPreferences(userId);
    const updated: UserPreferences = { ...current, ...prefs };
    try {
      const key = StorageService.getKey(PREFERENCES_KEY, userId);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save user preferences', err);
    }
    return updated;
  }
}
