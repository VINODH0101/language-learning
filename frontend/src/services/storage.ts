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
  static getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving settings to localStorage', e);
    }
  }

  static getTrackState(language: Language): UserTrackState {
    const key =
      language === 'pt'
        ? STORAGE_KEYS.TRACK_PT
        : language === 'es'
        ? STORAGE_KEYS.TRACK_ES
        : STORAGE_KEYS.TRACK_EN;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading track state', e);
    }

    const settings = this.getSettings();
    const regional =
      language === 'pt'
        ? settings.pt_variety
        : language === 'es'
        ? settings.es_variety
        : settings.en_variety || 'en-US';

    const defaultTrack: UserTrackState = {
      user_id: settings.user_id,
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

  static saveTrackState(track: UserTrackState): void {
    const key =
      track.language === 'pt'
        ? STORAGE_KEYS.TRACK_PT
        : track.language === 'es'
        ? STORAGE_KEYS.TRACK_ES
        : STORAGE_KEYS.TRACK_EN;
    try {
      localStorage.setItem(key, JSON.stringify(track));
    } catch (e) {
      console.warn('Error saving track state', e);
    }
  }

  static getSRSItems(language?: Language): SRSItemState[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SRS_ITEMS);
      if (raw) {
        const items: SRSItemState[] = JSON.parse(raw);
        return language ? items.filter(i => i.language === language) : items;
      }
    } catch (e) {
      console.warn('Error reading SRS items', e);
    }
    return [];
  }

  static saveSRSItem(item: SRSItemState): void {
    const items = this.getSRSItems();
    const idx = items.findIndex(i => i.vocabulary_item_id === item.vocabulary_item_id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SRS_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving SRS items', e);
    }
  }

  static getExerciseAttempts(): ExerciseAttempt[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading attempts', e);
    }
    return [];
  }

  static saveExerciseAttempt(attempt: ExerciseAttempt): void {
    const attempts = this.getExerciseAttempts();
    attempts.unshift(attempt);
    // Keep last 100 attempts
    const trimmed = attempts.slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Error saving exercise attempt', e);
    }
  }

  static getDailyLesson(language: Language, dateStr: string): DailyLessonPayload | null {
    try {
      const key = `${STORAGE_KEYS.LESSONS}_${language}_${dateStr}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading lesson from storage', e);
    }
    return null;
  }

  static saveDailyLesson(lesson: DailyLessonPayload): void {
    try {
      const key = `${STORAGE_KEYS.LESSONS}_${lesson.language}_${lesson.lesson_date}`;
      localStorage.setItem(key, JSON.stringify(lesson));
    } catch (e) {
      console.warn('Error saving lesson to storage', e);
    }
  }

  static getDiagnosticResults(): DiagnosticResult[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DIAGNOSTICS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading diagnostic results', e);
    }
    return [];
  }

  static saveDiagnosticResult(result: DiagnosticResult): void {
    const results = this.getDiagnosticResults();
    results.unshift(result);
    try {
      localStorage.setItem(STORAGE_KEYS.DIAGNOSTICS, JSON.stringify(results));
    } catch (e) {
      console.warn('Error saving diagnostic result', e);
    }
  }

  static exportAllData(): string {
    const payload = {
      settings: this.getSettings(),
      track_pt: this.getTrackState('pt'),
      track_es: this.getTrackState('es'),
      srs_items: this.getSRSItems(),
      attempts: this.getExerciseAttempts(),
      diagnostics: this.getDiagnosticResults(),
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

  // --- Saved Translations & Bookmarks (Strict Free Tier Cap: 500 items) ---

  static getSavedTranslations(): SavedTranslationBookmark[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading saved translations', e);
    }
    return [];
  }

  static saveTranslationBookmark(bookmark: SavedTranslationBookmark): boolean {
    const items = this.getSavedTranslations();
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
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(items));
      return true;
    } catch (e) {
      console.warn('Error saving translation bookmark', e);
      return false;
    }
  }

  static deleteTranslationBookmark(id: string): void {
    const items = this.getSavedTranslations().filter(i => i.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(items));
    } catch (e) {
      console.warn('Error deleting bookmark', e);
    }
  }

  // --- Ephemeral Daily Quota Guards (Guest: 10, Registered: 50) ---

  static getTranslationQuotaStatus(isRegistered: boolean = false): { used: number; limit: number; remaining: number } {
    const limit = isRegistered ? 50 : 10;
    const today = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSLATION_QUOTA);
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

  static consumeTranslationQuotaToken(isRegistered: boolean = false): boolean {
    const status = this.getTranslationQuotaStatus(isRegistered);
    if (status.remaining <= 0) {
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem(
        STORAGE_KEYS.TRANSLATION_QUOTA,
        JSON.stringify({ date: today, count: status.used + 1 })
      );
      return true;
    } catch (e) {
      console.warn('Error consuming quota token', e);
      return true;
    }
  }
}
