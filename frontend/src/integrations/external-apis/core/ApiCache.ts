/**
 * Central API Cache Manager integrating Dexie / IndexedDB persistence with memory fallback.
 */

import {
  getCachedApiResponse,
  setCachedApiResponse,
  clearAllApiCache,
  getApiCacheCount,
} from '../../../services/localDb';

export const DEFAULT_CACHE_TTLS: Record<string, number> = {
  mymemory: 30 * 24 * 60 * 60 * 1000, // 30 days
  'free-dictionary': 7 * 24 * 60 * 60 * 1000, // 7 days
  'dicionario-aberto': 7 * 24 * 60 * 60 * 1000, // 7 days
  wikipedia: 24 * 60 * 60 * 1000, // 24 hours
  jikan: 7 * 24 * 60 * 60 * 1000, // 7 days
  languagetool: 1 * 60 * 60 * 1000, // 1 hour
  gemini: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export class ApiCache {
  private static instance: ApiCache;

  public static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache();
    }
    return ApiCache.instance;
  }

  public async get<T>(provider: string, key: string): Promise<T | null> {
    try {
      const cached = await getCachedApiResponse(provider, key);
      return (cached as T) ?? null;
    } catch {
      return null;
    }
  }

  public async set<T>(provider: string, key: string, data: T, customTtlMs?: number): Promise<void> {
    const ttl = customTtlMs ?? DEFAULT_CACHE_TTLS[provider] ?? 24 * 60 * 60 * 1000;
    try {
      await setCachedApiResponse(provider, key, data, ttl);
    } catch (err) {
      console.warn(`Failed to set API cache for ${provider}:${key}`, err);
    }
  }

  public async clearAll(): Promise<void> {
    await clearAllApiCache();
  }

  public async getItemCount(): Promise<number> {
    return await getApiCacheCount();
  }
}
