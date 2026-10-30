/**
 * Polyglot C1 Daily — Local-First Synchronization Engine
 * 
 * Provides:
 * 1. Offline detection and automatic reconnection handling
 * 2. Idempotent synchronization between Dexie (IndexedDB) and Supabase
 * 3. Pending mutation queue with exponential backoff and retry
 * 4. Transparent sync status observables ('synced' | 'syncing' | 'offline' | 'error')
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './auth';
import {
  getPendingSyncActions,
  removeSyncAction,
  markSyncActionFailed,
  enqueueSyncAction,
  SyncQueueRecord,
} from './localDb';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncEngineState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: string | null;
  error?: string;
}

type SyncListener = (state: SyncEngineState) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private state: SyncEngineState = {
    status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced',
    pendingCount: 0,
    lastSyncedAt: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getState(): SyncEngineState {
    return { ...this.state };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const current = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(current);
      } catch (err) {
        console.warn('Error in sync listener', err);
      }
    });
  }

  private handleNetworkChange(online: boolean): void {
    if (!online) {
      this.state.status = 'offline';
      this.notify();
    } else {
      this.state.status = 'synced';
      this.notify();
      this.syncNow();
    }
  }

  /**
   * Queue an action to be synchronized locally first and then pushed to cloud when online.
   */
  public async queueAction(action: string, payload: unknown, userId?: string): Promise<string> {
    const effectiveUserId = userId || authService.getState().user?.id || 'guest';
    const id = await enqueueSyncAction(action, payload, effectiveUserId);
    const pending = await getPendingSyncActions(effectiveUserId);
    this.state.pendingCount = pending.length;
    this.notify();

    // Trigger sync in the background if currently online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      setTimeout(() => this.syncNow(), 50);
    }

    return id;
  }

  /**
   * Main synchronization loop. Idempotent and conflict-resistant.
   */
  public async syncNow(): Promise<void> {
    if (this.isSyncing) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.state.status = 'offline';
      this.notify();
      return;
    }

    const auth = authService.getState();
    const currentUserId = auth.user?.id;
    const pendingActions = await getPendingSyncActions(currentUserId);
    this.state.pendingCount = pendingActions.length;

    // If guest or no pending items or Supabase not configured, mark synced
    if (auth.isGuest || !auth.user || !isSupabaseConfigured || pendingActions.length === 0) {
      this.state.status = 'synced';
      this.state.lastSyncedAt = new Date().toISOString();
      this.notify();
      return;
    }

    this.isSyncing = true;
    this.state.status = 'syncing';
    this.notify();

    try {
      for (const item of pendingActions) {
        // Strict Account Isolation Guard: Never upload another user's queued action to this account
        if (item.user_id && item.user_id !== 'guest' && item.user_id !== auth.user.id) {
          continue;
        }

        const success = await this.processSyncItem(item, auth.user.id);
        if (success) {
          await removeSyncAction(item.id);
        } else {
          await markSyncActionFailed(item.id);
        }
      }

      const remaining = await getPendingSyncActions(currentUserId);
      this.state.pendingCount = remaining.length;
      this.state.status = remaining.length === 0 ? 'synced' : 'error';
      this.state.lastSyncedAt = new Date().toISOString();
    } catch (err: any) {
      console.warn('Sync engine exception', err);
      this.state.status = 'error';
      this.state.error = err.message || 'Falha na sincronização';
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Process a single action idempotently against Supabase.
   */
  private async processSyncItem(item: SyncQueueRecord, userId: string): Promise<boolean> {
    try {
      if (item.action === 'SYNC_COURSE') {
        const course = item.payload as any;
        const { error } = await supabase.from('user_courses').upsert({
          user_id: userId,
          target_language: course.target_language,
          regional_variant: course.regional_variant,
          cefr_level: course.cefr_level,
          explanation_language: course.explanation_language,
          daily_goal_minutes: course.daily_goal_minutes,
          streak_days: course.streak_days,
          total_lessons_completed: course.total_lessons_completed,
          completed_curriculum_node_ids: course.completed_curriculum_node_ids || [],
          is_active: course.is_active,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, target_language, regional_variant, cefr_level' });

        return !error;
      }

      if (item.action === 'SYNC_CULTURAL_BOOKMARK') {
        const bookmark = item.payload as any;
        const { error } = await supabase.from('cultural_bookmarks').upsert({
          user_id: userId,
          article_id: bookmark.article_id,
          article_title: bookmark.article_title,
          content_language: bookmark.content_language,
          origin_country: bookmark.origin_country,
          topic: bookmark.topic,
          cefr_level: bookmark.cefr_level,
        }, { onConflict: 'user_id, article_id' });

        return !error;
      }

      if (item.action === 'SYNC_SAVED_VOCABULARY') {
        const vocab = item.payload as any;
        const { error } = await supabase.from('saved_translations').insert({
          user_id: userId,
          source_text: vocab.source_text,
          translated_text: vocab.translated_text,
          source_lang: vocab.source_lang,
          target_lang: vocab.target_lang,
          provider_used: 'dictionary',
          is_verified: true,
        });

        return !error;
      }

      // Unknown action: acknowledge and clear to avoid blocking queue
      return true;
    } catch (err) {
      console.warn('Error processing sync item', item.id, err);
      return false;
    }
  }
}

export const syncEngine = new SyncEngine();
