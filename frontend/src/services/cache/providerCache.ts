/**
 * Dual-Tier Provider Cache: In-Memory L1 + IndexedDB (Dexie) L2
 * Lexilume — Illuminate Your Words
 */

import { localDb } from '../localDb';

export interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: number;
}

export class ProviderCache {
  private static instance: ProviderCache;
  private l1Cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTtlMs = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  public static getInstance(): ProviderCache {
    if (!ProviderCache.instance) {
      ProviderCache.instance = new ProviderCache();
    }
    return ProviderCache.instance;
  }

  private buildKey(providerId: string, key: string): string {
    return `${providerId}:${key}`;
  }

  public async get<T>(providerId: string, key: string): Promise<T | null> {
    const fullKey = this.buildKey(providerId, key);
    const now = Date.now();

    // 1. Check L1 Memory Cache
    const mem = this.l1Cache.get(fullKey);
    if (mem) {
      if (mem.expiresAt > now) {
        return mem.data as T;
      }
      this.l1Cache.delete(fullKey);
    }

    // 2. Check L2 Dexie IndexedDB
    try {
      if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && localDb?.apiCache) {
        const record = await localDb.apiCache.get(fullKey);
        if (record) {
          if (record.expiresAt > now) {
            // Re-populate L1
            this.l1Cache.set(fullKey, {
              data: record.data,
              cachedAt: record.cachedAt,
              expiresAt: record.expiresAt,
            });
            return record.data as T;
          } else {
            await localDb.apiCache.delete(fullKey);
          }
        }
      }
    } catch (err) {
      console.warn(`[ProviderCache] Dexie read error for ${fullKey}:`, err);
    }

    return null;
  }

  public async set<T>(providerId: string, key: string, data: T, ttlMs?: number): Promise<void> {
    const fullKey = this.buildKey(providerId, key);
    const now = Date.now();
    const expiresAt = now + (ttlMs ?? this.defaultTtlMs);
    const cachedAt = new Date().toISOString();

    const entry: CacheEntry<T> = { data, cachedAt, expiresAt };

    // 1. Store in L1
    this.l1Cache.set(fullKey, entry as CacheEntry<unknown>);

    // 2. Store in L2 Dexie
    try {
      if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && localDb?.apiCache) {
        await localDb.apiCache.put({
          id: fullKey,
          provider: providerId,
          cacheKey: key,
          data,
          cachedAt,
          expiresAt,
        });
      }
    } catch (err) {
      console.warn(`[ProviderCache] Dexie write error for ${fullKey}:`, err);
    }
  }

  public async clearProvider(providerId: string): Promise<void> {
    const prefix = `${providerId}:`;
    for (const key of this.l1Cache.keys()) {
      if (key.startsWith(prefix)) {
        this.l1Cache.delete(key);
      }
    }

    try {
      if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && localDb?.apiCache) {
        await localDb.apiCache.where('provider').equals(providerId).delete();
      }
    } catch (err) {
      console.warn(`[ProviderCache] Dexie clear error for provider ${providerId}:`, err);
    }
  }

  public async clearAll(): Promise<void> {
    this.l1Cache.clear();
    try {
      if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && localDb?.apiCache) {
        await localDb.apiCache.clear();
      }
    } catch (err) {
      console.warn('[ProviderCache] Dexie clearAll error:', err);
    }
  }
}
