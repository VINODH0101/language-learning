import {
  UserSettings,
  UserTrackState,
  SRSItemState,
  ExerciseAttempt,
  DailyLessonPayload,
  DiagnosticResult,
  Language,
  SavedTranslationBookmark,
} from '../types';
import { syncEngine } from './syncEngine';

const STORAGE_KEYS = {
  SETTINGS: 'polyglot_settings',
  TRACK_PT: 'polyglot_track_pt',
  TRACK_ES: 'polyglot_track_es',
  TRACK_EN: 'polyglot_track_en',
  SRS_ITEMS: 'polyglot_srs_items',
  ATTEMPTS: 'polyglot_exercise_attempts',
  LESSONS: 'polyglot_daily_lessons',
  DIAGNOSTICS: 'polyglot_diagnostics',
  BOOKMARKS: 'polyglot_saved_translations',
  TRANSLATION_QUOTA: 'polyglot_translation_quota',
};

const DEFAULT_SETTINGS: UserSettings = {
  user_id: 'default_learner',
  full_name: 'Polyglot Learner',
  email: 'learner@polyglot.dev',
  native_language: 'pt',
  primary_target_language: 'en',
  pt_variety: 'pt-BR',
  es_variety: 'es-ES',
  study_mode: 'full',
  target_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  preferred_delivery_hour_utc: 4,
  email_notifications_enabled: true,
  diagnostic_completed_pt: false,
  diagnostic_completed_es: false,
};

export class StorageService {
  private static currentUserId: string = 'guest';

  /**
   * Set the active user ID for storage scoping to prevent cross-account data leakage.
   */
  static setCurrentUser(userId: string | null | undefined): void {
    this.currentUserId = userId && userId.trim() ? userId.trim() : 'guest';
  }

  static getCurrentUser(): string {
    return this.currentUserId;
  }

  /**
   * Resolves storage key scoped by the currently authenticated user ID or 'guest'.
   */
  static getKey(baseKey: string, explicitUserId?: string): string {
    const uid = explicitUserId || this.currentUserId || 'guest';
    return uid === 'guest' ? baseKey : `${baseKey}_${uid}`;
  }

  /**
   * Safely migrates guest progress to an authenticated user partition.
   */
  static migrateGuestData(targetUserId: string): void {
    if (!targetUserId || targetUserId === 'guest') return;
    const keysToMigrate = [
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.TRACK_PT,
      STORAGE_KEYS.TRACK_ES,
      STORAGE_KEYS.TRACK_EN,
      STORAGE_KEYS.SRS_ITEMS,
      STORAGE_KEYS.ATTEMPTS,
      STORAGE_KEYS.BOOKMARKS,
      STORAGE_KEYS.DIAGNOSTICS,
    ];
    for (const baseKey of keysToMigrate) {
      const guestVal = localStorage.getItem(baseKey);
      const userKey = `${baseKey}_${targetUserId}`;
      if (guestVal && !localStorage.getItem(userKey)) {
        localStorage.setItem(userKey, guestVal);
      }
    }
  }

  static getSettings(userId?: string): UserSettings {
    try {
      const raw = localStorage.getItem(this.getKey(STORAGE_KEYS.SETTINGS, userId));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: UserSettings, userId?: string): void {
    try {
      localStorage.setItem(this.getKey(STORAGE_KEYS.SETTINGS, userId), JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving settings to localStorage', e);
    }
  }

  static getTrackState(language: Language, userId?: string): UserTrackState {
    const baseKey =
      language === 'pt'
        ? STORAGE_KEYS.TRACK_PT
        : language === 'es'
        ? STORAGE_KEYS.TRACK_ES
        : STORAGE_KEYS.TRACK_EN;
    const key = this.getKey(baseKey, userId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading track state', e);
    }

    const settings = this.getSettings(userId);
    const regional =
      language === 'pt'
        ? settings.pt_variety
        : language === 'es'
        ? settings.es_variety
        : settings.en_variety || 'en-US';

    const defaultTrack: UserTrackState = {
      user_id: userId || this.currentUserId || settings.user_id,
      language,
      regional_variety: regional,
      current_cefr_level: 'A1',
      target_cefr_level: 'C1',
      streak_days: 1,
      total_lessons_completed: 0,
      completed_curriculum_node_ids: [],
      presented_vocabulary_ids: [],
      mastered_vocabulary_ids: [],
      recent_node_history: [],
      recent_exercise_history: [],
    };
    return defaultTrack;
  }

  static saveTrackState(track: UserTrackState, userId?: string): void {
    const baseKey =
      track.language === 'pt'
        ? STORAGE_KEYS.TRACK_PT
        : track.language === 'es'
        ? STORAGE_KEYS.TRACK_ES
        : STORAGE_KEYS.TRACK_EN;
    const key = this.getKey(baseKey, userId);
    try {
      localStorage.setItem(key, JSON.stringify(track));
    } catch (e) {
      console.warn('Error saving track state', e);
    }
  }

  static getSRSItems(language?: Language, userId?: string): SRSItemState[] {
    try {
      const raw = localStorage.getItem(this.getKey(STORAGE_KEYS.SRS_ITEMS, userId));
      if (raw) {
        const items: SRSItemState[] = JSON.parse(raw);
        return language ? items.filter(i => i.language === language) : items;
      }
    } catch (e) {
      console.warn('Error reading SRS items', e);
    }
    return [];
  }

  static saveSRSItem(item: SRSItemState, userId?: string): void {
    const uid = userId || this.currentUserId;
    const items = this.getSRSItems(undefined, uid);
    const idx = items.findIndex(i => i.vocabulary_item_id === item.vocabulary_item_id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    try {
      localStorage.setItem(this.getKey(STORAGE_KEYS.SRS_ITEMS, uid), JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving SRS items', e);
    }
    if (uid && uid !== 'guest') {
      syncEngine.queueAction('SYNC_SRS_REVIEW', item, uid).catch(() => {});
    }
  }

  static getExerciseAttempts(userId?: string): ExerciseAttempt[] {
    try {
      const raw = localStorage.getItem(this.getKey(STORAGE_KEYS.ATTEMPTS, userId));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading attempts', e);
    }
    return [];
  }

  static saveExerciseAttempt(attempt: ExerciseAttempt, userId?: string): void {
    const uid = userId || this.currentUserId;
    const attempts = this.getExerciseAttempts(uid);
    attempts.unshift(attempt);
    // Keep last 100 attempts
    const trimmed = attempts.slice(0, 100);
    try {
      localStorage.setItem(this.getKey(STORAGE_KEYS.ATTEMPTS, uid), JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Error saving exercise attempt', e);
    }
    if (uid && uid !== 'guest') {
      syncEngine.queueAction('SYNC_EXERCISE_ATTEMPT', attempt, uid).catch(() => {});
    }
  }

  static getDailyLesson(language: Language, dateStr: string, userId?: string): DailyLessonPayload | null {
    try {
      const key = `${this.getKey(STORAGE_KEYS.LESSONS, userId)}_${language}_${dateStr}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading lesson from storage', e);
    }
    return null;
  }

  static saveDailyLesson(lesson: DailyLessonPayload, userId?: string): void {
    try {
      const key = `${this.getKey(STORAGE_KEYS.LESSONS, userId)}_${lesson.language}_${lesson.lesson_date}`;
      localStorage.setItem(key, JSON.stringify(lesson));
    } catch (e) {
      console.warn('Error saving lesson to storage', e);
    }
  }

  static getDiagnosticResults(userId?: string): DiagnosticResult[] {
    try {
      const raw = localStorage.getItem(this.getKey(STORAGE_KEYS.DIAGNOSTICS, userId));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading diagnostic results', e);
    }
    return [];
  }

  static saveDiagnosticResult(result: DiagnosticResult, userId?: string): void {
    const results = this.getDiagnosticResults(userId);
    results.unshift(result);
    try {
      localStorage.setItem(this.getKey(STORAGE_KEYS.DIAGNOSTICS, userId), JSON.stringify(results));
    } catch (e) {
      console.warn('Error saving diagnostic result', e);
    }
  }

  static exportAllData(userId?: string): string {
    const payload = {
      settings: this.getSettings(userId),
      track_pt: this.getTrackState('pt', userId),
      track_es: this.getTrackState('es', userId),
      srs_items: this.getSRSItems(undefined, userId),
      attempts: this.getExerciseAttempts(userId),
      diagnostics: this.getDiagnosticResults(userId),
      exported_at: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  }

  static resetAllData(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Error resetting localStorage', e);
    }
  }

  static resetUserData(userId?: string): void {
    const uid = userId || this.currentUserId;
    if (!uid || uid === 'guest') {
      this.resetAllData();
      return;
    }
    const prefix = `_${uid}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.endsWith(prefix) || k.includes(`_${uid}_`))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  // --- Saved Translations & Bookmarks (Strict Free Tier Cap: 500 items) ---

  static getSavedTranslations(userId?: string): SavedTranslationBookmark[] {
    try {
      const raw = localStorage.getItem(this.getKey(STORAGE_KEYS.BOOKMARKS, userId));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading saved translations', e);
    }
    return [];
  }

  static saveTranslationBookmark(bookmark: SavedTranslationBookmark, userId?: string): boolean {
    const items = this.getSavedTranslations(userId);
    if (items.length >= 500) {
      return false; // Quota cap reached
    }
    const existingIdx = items.findIndex(
      i => i.source_text.toLowerCase() === bookmark.source_text.toLowerCase() && i.target_lang === bookmark.target_lang
    );
    if (existingIdx >= 0) {
      items[existingIdx] = bookmark;
    } else {
      items.unshift(bookmark);
    }
    try {
      localStorage.setItem(this.getKey(STORAGE_KEYS.BOOKMARKS, userId), JSON.stringify(items));
      return true;
    } catch (e) {
      console.warn('Error saving translation bookmark', e);
      return false;
    }
  }

  static deleteTranslationBookmark(id: string, userId?: string): void {
    const items = this.getSavedTranslations(userId).filter(i => i.id !== id);
    try {
      localStorage.setItem(this.getKey(STORAGE_KEYS.BOOKMARKS, userId), JSON.stringify(items));
    } catch (e) {
      console.warn('Error deleting bookmark', e);
    }
  }

  // --- Ephemeral Daily Quota Guards (Guest: 10, Registered: 50) ---

  static getTranslationQuotaStatus(isRegistered: boolean = false, userId?: string): { used: number; limit: number; remaining: number } {
    const limit = isRegistered ? 50 : 10;
    const today = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem(this.getKey(STORAGE_KEYS.TRANSLATION_QUOTA, userId));
      if (raw) {
        const data = JSON.parse(raw);
        if (data.date === today) {
          const used = data.count || 0;
          return { used, limit, remaining: Math.max(0, limit - used) };
        }
      }
    } catch (e) {
      console.warn('Error reading quota', e);
    }
    return { used: 0, limit, remaining: limit };
  }

  static consumeTranslationQuotaToken(isRegistered: boolean = false, userId?: string): boolean {
    const status = this.getTranslationQuotaStatus(isRegistered, userId);
    if (status.remaining <= 0) {
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem(
        this.getKey(STORAGE_KEYS.TRANSLATION_QUOTA, userId),
        JSON.stringify({ date: today, count: status.used + 1 })
      );
      return true;
    } catch (e) {
      console.warn('Error consuming quota token', e);
      return true;
    }
  }
}
