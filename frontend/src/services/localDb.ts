import Dexie, { type EntityTable } from 'dexie';
import {
  DailyLessonPayload,
  Language,
  ActiveLessonProgress,
  MistakeNotebookItem,
  SavedVocabularyRecord,
  SRSItemState,
} from '../types';

export interface CachedLessonRecord {
  id: string; // `${language}_${lesson_date}`
  language: Language;
  lesson_date: string;
  cefr_level: string;
  lesson: DailyLessonPayload;
  cached_at: string;
  expires_at: string;
}

export interface SyncQueueRecord {
  id: string;
  action: string;
  payload: unknown;
  status: 'pending' | 'failed';
  retry_count: number;
  created_at: string;
}

export interface CulturalBookmarkRecord {
  id: string; // `${user_id}_${article_id}`
  user_id: string;
  article_id: string;
  article_title: string;
  content_language: Language;
  origin_country: string;
  topic: string;
  cefr_level: string;
  created_at: string;
}

export interface ApiCacheRecord {
  id: string; // `${provider}:${cacheKey}`
  provider: string;
  cacheKey: string;
  data: unknown;
  cachedAt: string;
  expiresAt: number; // timestamp in ms
}

export class PolyglotLocalDatabase extends Dexie {
  cachedLessons!: EntityTable<CachedLessonRecord, 'id'>;
  activeLessonProgress!: EntityTable<ActiveLessonProgress, 'id'>;
  savedVocabulary!: EntityTable<SavedVocabularyRecord, 'id'>;
  srsReviews!: EntityTable<SRSItemState & { id: string }, 'id'>;
  mistakeNotebook!: EntityTable<MistakeNotebookItem, 'id'>;
  syncQueue!: EntityTable<SyncQueueRecord, 'id'>;
  culturalBookmarks!: EntityTable<CulturalBookmarkRecord, 'id'>;
  apiCache!: EntityTable<ApiCacheRecord, 'id'>;

  constructor() {
    super('PolyglotLocalDatabase');
    this.version(1).stores({
      cachedLessons: 'id, language, lesson_date, cefr_level, expires_at',
      activeLessonProgress: 'id, language, curriculum_node_id, updated_at',
      savedVocabulary: 'id, user_id, source_text, target_lang, created_at',
      srsReviews: 'id, user_id, language, vocabulary_item_id, next_review_date',
      mistakeNotebook: 'id, user_id, language, error_category, timestamp, is_resolved',
      syncQueue: 'id, action, status, created_at',
    });
    this.version(2).stores({
      culturalBookmarks: 'id, user_id, article_id, content_language, origin_country, topic, cefr_level, created_at',
    });
    this.version(3).stores({
      apiCache: 'id, provider, cacheKey, expiresAt',
    });
  }
}

export const localDb = new PolyglotLocalDatabase();

// In-memory fallback if IndexedDB is unavailable
const memoryFallback = {
  cachedLessons: new Map<string, CachedLessonRecord>(),
  activeProgress: new Map<string, ActiveLessonProgress>(),
  mistakes: new Map<string, MistakeNotebookItem>(),
  savedVocabulary: new Map<string, SavedVocabularyRecord>(),
  culturalBookmarks: new Map<string, CulturalBookmarkRecord>(),
  syncQueue: new Map<string, SyncQueueRecord>(),
  apiCache: new Map<string, ApiCacheRecord>(),
};

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

// ============================================================================
// 1. ACTIVE LESSON RESUME & PROGRESS
// ============================================================================

export async function getActiveProgress(language: Language): Promise<ActiveLessonProgress | null> {
  if (!isIndexedDBAvailable()) {
    return memoryFallback.activeProgress.get(language) || null;
  }
  try {
    const item = await localDb.activeLessonProgress.get(language);
    return item || null;
  } catch (err) {
    console.warn('Error reading active lesson progress from localDb', err);
    return memoryFallback.activeProgress.get(language) || null;
  }
}

export async function saveActiveProgress(progress: ActiveLessonProgress): Promise<void> {
  memoryFallback.activeProgress.set(progress.language, progress);
  if (!isIndexedDBAvailable()) return;

  try {
    await localDb.activeLessonProgress.put({
      ...progress,
      id: progress.language,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error saving active lesson progress to localDb', err);
  }
}

export async function clearActiveProgress(language: Language): Promise<void> {
  memoryFallback.activeProgress.delete(language);
  if (!isIndexedDBAvailable()) return;

  try {
    await localDb.activeLessonProgress.delete(language);
  } catch (err) {
    console.warn('Error clearing active progress from localDb', err);
  }
}

// ============================================================================
// 2. CACHED DAILY LESSONS (14-DAY RETENTION TTL)
// ============================================================================

export async function getCachedLesson(language: Language, dateStr: string): Promise<DailyLessonPayload | null> {
  const key = `${language}_${dateStr}`;
  if (!isIndexedDBAvailable()) {
    const item = memoryFallback.cachedLessons.get(key);
    return item ? item.lesson : null;
  }
  try {
    const record = await localDb.cachedLessons.get(key);
    if (!record) return null;

    // Check expiration
    if (new Date(record.expires_at).getTime() < Date.now()) {
      await localDb.cachedLessons.delete(key);
      return null;
    }
    return record.lesson;
  } catch (err) {
    console.warn('Error reading cached lesson from localDb', err);
    const item = memoryFallback.cachedLessons.get(key);
    return item ? item.lesson : null;
  }
}

export async function cacheDailyLesson(lesson: DailyLessonPayload, ttlDays: number = 14): Promise<void> {
  const key = `${lesson.language}_${lesson.lesson_date}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  const record: CachedLessonRecord = {
    id: key,
    language: lesson.language,
    lesson_date: lesson.lesson_date,
    cefr_level: lesson.cefr_level,
    lesson,
    cached_at: now.toISOString(),
    expires_at: expiresAt,
  };

  memoryFallback.cachedLessons.set(key, record);
  if (!isIndexedDBAvailable()) return;

  try {
    await localDb.cachedLessons.put(record);
  } catch (err) {
    console.warn('Error caching lesson in localDb', err);
  }
}

export async function cleanExpiredLessons(): Promise<number> {
  if (!isIndexedDBAvailable()) {
    let purged = 0;
    const now = Date.now();
    for (const [key, val] of memoryFallback.cachedLessons.entries()) {
      if (new Date(val.expires_at).getTime() < now) {
        memoryFallback.cachedLessons.delete(key);
        purged++;
      }
    }
    return purged;
  }

  try {
    const nowIso = new Date().toISOString();
    const expired = await localDb.cachedLessons.where('expires_at').below(nowIso).toArray();
    if (expired.length > 0) {
      const keys = expired.map(e => e.id);
      await localDb.cachedLessons.bulkDelete(keys);
    }
    return expired.length;
  } catch (err) {
    console.warn('Error cleaning expired lessons', err);
    return 0;
  }
}

// ============================================================================
// 3. MISTAKE NOTEBOOK (ERROR RECOVERY & CATEGORIZATION)
// ============================================================================

export async function logMistake(
  item: Omit<MistakeNotebookItem, 'id' | 'timestamp' | 'reviewed_count' | 'is_resolved'>
): Promise<string> {
  const id = `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: MistakeNotebookItem = {
    ...item,
    id,
    timestamp: new Date().toISOString(),
    reviewed_count: 0,
    is_resolved: false,
  };

  memoryFallback.mistakes.set(id, record);

  if (isIndexedDBAvailable()) {
    try {
      await localDb.mistakeNotebook.put(record);

      // Enforce max 100 items limit to maintain low local storage footprint
      const count = await localDb.mistakeNotebook.count();
      if (count > 100) {
        const oldest = await localDb.mistakeNotebook
          .filter(m => m.is_resolved)
          .limit(count - 100)
          .primaryKeys();
        if (oldest.length > 0) {
          await localDb.mistakeNotebook.bulkDelete(oldest);
        }
      }
    } catch (err) {
      console.warn('Error writing mistake to localDb', err);
    }
  }

  return id;
}

export async function getMistakes(
  language?: Language,
  category?: string
): Promise<MistakeNotebookItem[]> {
  if (!isIndexedDBAvailable()) {
    let list = Array.from(memoryFallback.mistakes.values());
    if (language) list = list.filter(m => m.language === language);
    if (category) list = list.filter(m => m.error_category === category);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  try {
    let collection = localDb.mistakeNotebook.toCollection();
    if (language) {
      collection = localDb.mistakeNotebook.where('language').equals(language);
    }
    let list = await collection.toArray();
    if (category) {
      list = list.filter(m => m.error_category === category);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Error fetching mistakes from localDb', err);
    return Array.from(memoryFallback.mistakes.values());
  }
}

export async function resolveMistake(id: string): Promise<void> {
  const mem = memoryFallback.mistakes.get(id);
  if (mem) {
    mem.is_resolved = true;
    mem.reviewed_count += 1;
  }

  if (isIndexedDBAvailable()) {
    try {
      const record = await localDb.mistakeNotebook.get(id);
      if (record) {
        record.is_resolved = true;
        record.reviewed_count += 1;
        await localDb.mistakeNotebook.put(record);
      }
    } catch (err) {
      console.warn('Error resolving mistake', err);
    }
  }
}

export async function deleteMistake(id: string): Promise<void> {
  memoryFallback.mistakes.delete(id);
  if (isIndexedDBAvailable()) {
    try {
      await localDb.mistakeNotebook.delete(id);
    } catch (err) {
      console.warn('Error deleting mistake', err);
    }
  }
}

// ============================================================================
// 4. OFFLINE PHRASEBOOK / SAVED VOCABULARY
// ============================================================================

export async function savePhrasebookWord(
  item: Omit<SavedVocabularyRecord, 'id' | 'created_at'>
): Promise<string> {
  const id = `vocab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: SavedVocabularyRecord = {
    ...item,
    id,
    created_at: new Date().toISOString(),
  };

  memoryFallback.savedVocabulary.set(id, record);

  if (isIndexedDBAvailable()) {
    try {
      await localDb.savedVocabulary.put(record);
      const total = await localDb.savedVocabulary.count();
      if (total > 500) {
        // Keep strictly up to 500 words to ensure minimal browser footprint
        const oldest = await localDb.savedVocabulary.orderBy('created_at').limit(total - 500).primaryKeys();
        if (oldest.length > 0) {
          await localDb.savedVocabulary.bulkDelete(oldest);
        }
      }
    } catch (err) {
      console.warn('Error saving phrasebook word to localDb', err);
    }
  }

  return id;
}

export async function getPhrasebookWords(targetLang?: string): Promise<SavedVocabularyRecord[]> {
  if (!isIndexedDBAvailable()) {
    let list = Array.from(memoryFallback.savedVocabulary.values());
    if (targetLang) list = list.filter(v => v.target_lang === targetLang);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  try {
    let collection = localDb.savedVocabulary.toCollection();
    if (targetLang) {
      collection = localDb.savedVocabulary.where('target_lang').equals(targetLang);
    }
    const list = await collection.toArray();
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Error fetching phrasebook words', err);
    return Array.from(memoryFallback.savedVocabulary.values());
  }
}

export async function deletePhrasebookWord(id: string): Promise<void> {
  memoryFallback.savedVocabulary.delete(id);
  if (isIndexedDBAvailable()) {
    try {
      await localDb.savedVocabulary.delete(id);
    } catch (err) {
      console.warn('Error deleting phrasebook word', err);
    }
  }
}

// ============================================================================
// 5. CULTURAL BOOKMARKS (OFFLINE-FIRST)
// ============================================================================

export async function saveCulturalBookmark(bookmark: CulturalBookmarkRecord): Promise<void> {
  const key = `${bookmark.user_id}_${bookmark.article_id}`;
  const record = { ...bookmark, id: key };
  memoryFallback.culturalBookmarks.set(key, record);

  if (isIndexedDBAvailable()) {
    try {
      await localDb.culturalBookmarks.put(record);
    } catch (err) {
      console.warn('Error saving cultural bookmark to IndexedDB', err);
    }
  }
}

export async function deleteCulturalBookmark(userId: string, articleId: string): Promise<void> {
  const key = `${userId}_${articleId}`;
  memoryFallback.culturalBookmarks.delete(key);

  if (isIndexedDBAvailable()) {
    try {
      await localDb.culturalBookmarks.delete(key);
    } catch (err) {
      console.warn('Error deleting cultural bookmark from IndexedDB', err);
    }
  }
}

export async function getCulturalBookmarks(userId: string): Promise<CulturalBookmarkRecord[]> {
  if (!isIndexedDBAvailable()) {
    return Array.from(memoryFallback.culturalBookmarks.values()).filter(b => b.user_id === userId);
  }

  try {
    const list = await localDb.culturalBookmarks.where('user_id').equals(userId).toArray();
    return list;
  } catch (err) {
    console.warn('Error fetching cultural bookmarks from IndexedDB', err);
    return Array.from(memoryFallback.culturalBookmarks.values()).filter(b => b.user_id === userId);
  }
}

export async function isCulturalBookmarked(userId: string, articleId: string): Promise<boolean> {
  const key = `${userId}_${articleId}`;
  if (!isIndexedDBAvailable()) {
    return memoryFallback.culturalBookmarks.has(key);
  }

  try {
    const item = await localDb.culturalBookmarks.get(key);
    return !!item;
  } catch (err) {
    console.warn('Error checking cultural bookmark in IndexedDB', err);
    return memoryFallback.culturalBookmarks.has(key);
  }
}

// ============================================================================
// 6. SYNC QUEUE OPERATIONS
// ============================================================================

export async function enqueueSyncAction(action: string, payload: unknown): Promise<string> {
  const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record: SyncQueueRecord = {
    id,
    action,
    payload,
    status: 'pending',
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  memoryFallback.syncQueue.set(id, record);

  if (isIndexedDBAvailable()) {
    try {
      await localDb.syncQueue.put(record);
    } catch (err) {
      console.warn('Error enqueuing sync action in IndexedDB', err);
    }
  }

  return id;
}

export async function getPendingSyncActions(): Promise<SyncQueueRecord[]> {
  if (!isIndexedDBAvailable()) {
    return Array.from(memoryFallback.syncQueue.values()).filter(r => r.status === 'pending');
  }

  try {
    return await localDb.syncQueue.where('status').equals('pending').toArray();
  } catch (err) {
    console.warn('Error reading pending sync actions from IndexedDB', err);
    return Array.from(memoryFallback.syncQueue.values()).filter(r => r.status === 'pending');
  }
}

export async function removeSyncAction(id: string): Promise<void> {
  memoryFallback.syncQueue.delete(id);

  if (isIndexedDBAvailable()) {
    try {
      await localDb.syncQueue.delete(id);
    } catch (err) {
      console.warn('Error deleting sync action from IndexedDB', err);
    }
  }
}

export async function markSyncActionFailed(id: string): Promise<void> {
  const inMem = memoryFallback.syncQueue.get(id);
  if (inMem) {
    inMem.status = 'failed';
    inMem.retry_count += 1;
  }

  if (isIndexedDBAvailable()) {
    try {
      const item = await localDb.syncQueue.get(id);
      if (item) {
        item.status = 'failed';
        item.retry_count = (item.retry_count || 0) + 1;
        await localDb.syncQueue.put(item);
      }
    } catch (err) {
      console.warn('Error updating sync action failure in IndexedDB', err);
    }
  }
}

// ============================================================================
// 7. STORAGE QUOTA, PURGE & EXPORT
// ============================================================================

export async function estimateStorageUsage(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
}> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 1;
      return {
        usedBytes: used,
        quotaBytes: quota,
        percentUsed: Math.min(100, Math.round((used / quota) * 100 * 10) / 10),
      };
    } catch (err) {
      console.warn('Storage estimate failed', err);
    }
  }
  return { usedBytes: 0, quotaBytes: 0, percentUsed: 0 };
}

export async function clearAllLocalLearningData(): Promise<void> {
  memoryFallback.cachedLessons.clear();
  memoryFallback.activeProgress.clear();
  memoryFallback.mistakes.clear();
  memoryFallback.savedVocabulary.clear();
  memoryFallback.culturalBookmarks.clear();
  memoryFallback.syncQueue.clear();

  if (isIndexedDBAvailable()) {
    try {
      await Promise.all([
        localDb.cachedLessons.clear(),
        localDb.activeLessonProgress.clear(),
        localDb.mistakeNotebook.clear(),
        localDb.savedVocabulary.clear(),
        localDb.srsReviews.clear(),
        localDb.syncQueue.clear(),
        localDb.culturalBookmarks.clear(),
      ]);
    } catch (err) {
      console.warn('Error clearing IndexedDB data', err);
    }
  }
}

export async function exportAllIndexedDBData(): Promise<Record<string, unknown>> {
  if (!isIndexedDBAvailable()) {
    return {
      cachedLessons: Array.from(memoryFallback.cachedLessons.values()),
      activeProgress: Array.from(memoryFallback.activeProgress.values()),
      mistakes: Array.from(memoryFallback.mistakes.values()),
      savedVocabulary: Array.from(memoryFallback.savedVocabulary.values()),
      culturalBookmarks: Array.from(memoryFallback.culturalBookmarks.values()),
    };
  }

  try {
    const [cachedLessons, activeProgress, mistakes, savedVocabulary, srsReviews, culturalBookmarks] = await Promise.all([
      localDb.cachedLessons.toArray(),
      localDb.activeLessonProgress.toArray(),
      localDb.mistakeNotebook.toArray(),
      localDb.savedVocabulary.toArray(),
      localDb.srsReviews.toArray(),
      localDb.culturalBookmarks.toArray(),
    ]);

    return {
      cachedLessons,
      activeProgress,
      mistakes,
      savedVocabulary,
      srsReviews,
      culturalBookmarks,
      exported_at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Error exporting IndexedDB data', err);
    return {};
  }
}

// ============================================================================
// 8. EXTERNAL API CACHE PERSISTENCE
// ============================================================================

export async function getCachedApiResponse(provider: string, cacheKey: string): Promise<unknown | null> {
  const id = `${provider}:${cacheKey}`;
  const now = Date.now();

  if (!isIndexedDBAvailable()) {
    const record = memoryFallback.apiCache.get(id);
    if (!record) return null;
    if (record.expiresAt < now) {
      memoryFallback.apiCache.delete(id);
      return null;
    }
    return record.data;
  }

  try {
    const record = await localDb.apiCache.get(id);
    if (!record) return null;
    if (record.expiresAt < now) {
      await localDb.apiCache.delete(id);
      return null;
    }
    return record.data;
  } catch (err) {
    console.warn(`Error reading API cache for ${id}`, err);
    const fallback = memoryFallback.apiCache.get(id);
    return fallback && fallback.expiresAt >= now ? fallback.data : null;
  }
}

export async function setCachedApiResponse(
  provider: string,
  cacheKey: string,
  data: unknown,
  ttlMs: number
): Promise<void> {
  const id = `${provider}:${cacheKey}`;
  const now = Date.now();
  const record: ApiCacheRecord = {
    id,
    provider,
    cacheKey,
    data,
    cachedAt: new Date(now).toISOString(),
    expiresAt: now + ttlMs,
  };

  // Always keep in memory fallback
  memoryFallback.apiCache.set(id, record);

  if (!isIndexedDBAvailable()) return;

  try {
    await localDb.apiCache.put(record);
  } catch (err) {
    console.warn(`Error writing API cache for ${id}`, err);
  }
}

export async function clearExpiredApiCache(): Promise<void> {
  const now = Date.now();
  for (const [key, val] of memoryFallback.apiCache.entries()) {
    if (val.expiresAt < now) {
      memoryFallback.apiCache.delete(key);
    }
  }

  if (!isIndexedDBAvailable()) return;

  try {
    await localDb.apiCache.where('expiresAt').below(now).delete();
  } catch (err) {
    console.warn('Error clearing expired API cache', err);
  }
}

export async function clearAllApiCache(): Promise<void> {
  memoryFallback.apiCache.clear();
  if (!isIndexedDBAvailable()) return;
  try {
    await localDb.apiCache.clear();
  } catch (err) {
    console.warn('Error clearing all API cache', err);
  }
}

export async function getApiCacheCount(): Promise<number> {
  if (!isIndexedDBAvailable()) {
    return memoryFallback.apiCache.size;
  }
  try {
    return await localDb.apiCache.count();
  } catch {
    return memoryFallback.apiCache.size;
  }
}

