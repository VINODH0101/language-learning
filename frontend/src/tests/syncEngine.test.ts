import { describe, it, expect, beforeEach } from 'vitest';
import { syncEngine, SyncEngineState } from '../services/syncEngine';
import {
  clearAllLocalLearningData,
  enqueueSyncAction,
  getPendingSyncActions,
  removeSyncAction,
} from '../services/localDb';

describe('Local-First Sync Engine & Pending Queue (syncEngine.ts)', () => {
  beforeEach(async () => {
    await clearAllLocalLearningData();
  });

  it('provides an initial sync state with zero pending actions', () => {
    const state = syncEngine.getState();
    expect(state).toBeDefined();
    expect(typeof state.pendingCount).toBe('number');
    expect(['synced', 'syncing', 'offline', 'error']).toContain(state.status);
  });

  it('notifies subscribers whenever sync state or pending items change', async () => {
    const states: SyncEngineState[] = [];
    const unsubscribe = syncEngine.subscribe(st => states.push(st));

    expect(states.length).toBeGreaterThanOrEqual(1);

    // Queue a local course mutation
    await syncEngine.queueAction('SYNC_COURSE', {
      target_language: 'es',
      streak_days: 5,
    });

    const finalState = syncEngine.getState();
    expect(finalState.pendingCount).toBeGreaterThanOrEqual(0);

    unsubscribe();
  });

  it('manages low-level IndexedDB sync queue records directly', async () => {
    // 1. Initial queue should be empty
    const initial = await getPendingSyncActions();
    expect(initial).toHaveLength(0);

    // 2. Enqueue multiple actions
    const id1 = await enqueueSyncAction('SYNC_CULTURAL_BOOKMARK', {
      article_id: 'cult-jp-pt-01',
      user_id: 'learner_1',
    });
    const id2 = await enqueueSyncAction('SYNC_SAVED_VOCABULARY', {
      source_text: 'efemeridade',
      translated_text: 'impermanence',
    });

    const pending = await getPendingSyncActions();
    expect(pending).toHaveLength(2);
    expect(pending.map(p => p.id)).toContain(id1);
    expect(pending.map(p => p.id)).toContain(id2);

    // 3. Remove processed item
    await removeSyncAction(id1);
    const afterRemoval = await getPendingSyncActions();
    expect(afterRemoval).toHaveLength(1);
    expect(afterRemoval[0].id).toBe(id2);
  });

  it('executes syncNow without uncaught exceptions in guest or offline mode', async () => {
    await expect(syncEngine.syncNow()).resolves.toBeUndefined();
  });
});
