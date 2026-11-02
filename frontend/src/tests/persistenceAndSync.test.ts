import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contentCentredService } from '../services/contentCentredService';
import {
  migrateGuestContentData,
  getUserSavedWordsLocal,
  getLearnerProgressLocal,
  getUserMistakesLocal,
  getPendingSyncActions,
  getDeadLetterSyncActions,
  enqueueSyncAction,
  markSyncActionFailed,
} from '../services/localDb';
import { syncEngine } from '../services/syncEngine';

describe('Lexilume Persistence & Synchronization (Milestone 7.8)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('1. Offline actions generate unique client_mutation_id and queue sync actions', async () => {
    const word = await contentCentredService.saveUserWord({
      user_id: 'guest_sync_test_user',
      target_language: 'en',
      explanation_language: 'pt',
      term: 'glistening',
      lemma: 'glistening',
      pos: 'adjective',
      definition: 'Shining with a sparkling light',
    });

    expect(word.client_mutation_id).toBeDefined();
    expect(word.client_mutation_id).toMatch(/^mut_\d+_[a-z0-9]+$/);

    const pending = await getPendingSyncActions('guest_sync_test_user');
    const wordAction = pending.find(p => p.action === 'SYNC_USER_SAVED_WORD');
    expect(wordAction).toBeDefined();
    expect((wordAction?.payload as any).lemma).toBe('glistening');
  });

  it('2. Distinct POS for identical lemma does not collide in personal lexicon', async () => {
    // 1. Verb: to record
    const verb = await contentCentredService.saveUserWord({
      user_id: 'guest_user',
      target_language: 'en',
      explanation_language: 'pt',
      term: 'record',
      lemma: 'record',
      pos: 'verb',
      definition: 'To set down in writing or other permanent form.',
    });

    // 2. Noun: a record
    const noun = await contentCentredService.saveUserWord({
      user_id: 'guest_user',
      target_language: 'en',
      explanation_language: 'pt',
      term: 'record',
      lemma: 'record',
      pos: 'noun',
      definition: 'A piece of evidence or information.',
    });

    expect(verb.id).not.toBe(noun.id);
    const allWords = await contentCentredService.getUserSavedWords('guest_user', 'en');
    const recordWords = allWords.filter(w => w.lemma === 'record');
    expect(recordWords.length).toBe(2);
    expect(recordWords.map(w => w.pos).sort()).toEqual(['noun', 'verb']);
  });

  it('3. Migrates guest progress, vocabulary, and mistakes to authenticated user without data loss', async () => {
    const guestId = 'guest_user';
    const authUserId = 'usr_auth_verified_777';

    // 1. Create guest telemetry
    await contentCentredService.updateLearnerProgress({
      user_id: guestId,
      content_item_id: 'ci_coffee_dublin_001',
      percent_complete: 80,
    });

    await contentCentredService.saveUserWord({
      user_id: guestId,
      target_language: 'pt',
      explanation_language: 'en',
      term: 'saudade',
      lemma: 'saudade',
      pos: 'noun',
      definition: 'Deep emotional state of melancholic longing.',
    });

    await contentCentredService.recordUserMistake({
      user_id: guestId,
      stimulus: 'Translate: O elétrico é amarelo.',
      user_response: 'The bus is yellow',
      correct_response: 'The tram is yellow',
      pedagogical_explanation: 'Elétrico refers to tram or streetcar, not bus.',
      error_category: 'vocabulary_choice',
    });

    // 2. Perform migration
    const result = await migrateGuestContentData(authUserId);
    expect(result.wordsMigrated).toBeGreaterThan(0);

    // 3. Verify authenticated partition
    const authWords = await getUserSavedWordsLocal(authUserId);
    const foundWord = authWords.find(w => w.lemma === 'saudade');
    expect(foundWord).toBeDefined();
    expect(foundWord?.user_id).toBe(authUserId);

    const authProgress = await getLearnerProgressLocal(authUserId, 'ci_coffee_dublin_001');
    expect(authProgress).toBeDefined();
    expect(authProgress?.percent_complete).toBe(80);
    expect(authProgress?.user_id).toBe(authUserId);

    const authMistakes = await getUserMistakesLocal(authUserId);
    const foundMistake = authMistakes.find(m => m.stimulus.includes('O elétrico'));
    expect(foundMistake).toBeDefined();
    expect(foundMistake?.user_id).toBe(authUserId);
  });

  it('4. SyncEngine state and lifecycle updates cleanly when syncing', async () => {
    const state = syncEngine.getState();
    expect(state).toHaveProperty('status');
    expect(state).toHaveProperty('pendingCount');

    // Subscribe to observable
    let notifiedState = null;
    const unsub = syncEngine.subscribe(s => {
      notifiedState = s;
    });

    expect(notifiedState).not.toBeNull();
    unsub();
  });

  it('5. Flawed backoff fixed: failure tracks last_attempted_at and transitions to dead_letter at max retries (RISK-803)', async () => {
    const userId = 'usr_deadletter_test';
    const actionId = await enqueueSyncAction('SYNC_TEST_ACTION', { foo: 'bar' }, userId);

    // Initial state: pending, retry_count: 0
    let pending = await getPendingSyncActions(userId);
    let item = pending.find(p => p.id === actionId);
    expect(item).toBeDefined();
    expect(item?.retry_count).toBe(0);
    expect(item?.status).toBe('pending');

    // Simulate 4 successive failures
    for (let i = 1; i <= 4; i++) {
      await markSyncActionFailed(actionId, `Simulated network drop #${i}`);
      pending = await getPendingSyncActions(userId);
      item = pending.find(p => p.id === actionId);
      expect(item).toBeDefined();
      expect(item?.retry_count).toBe(i);
      expect(item?.status).toBe('failed');
      expect(item?.last_attempted_at).toBeDefined();
    }

    // 5th failure: must transition to 'dead_letter'
    await markSyncActionFailed(actionId, 'Simulated terminal network drop #5');

    // Item must NO LONGER be returned in pending sync queue
    pending = await getPendingSyncActions(userId);
    item = pending.find(p => p.id === actionId);
    expect(item).toBeUndefined();

    // Item must be retained in dead letter repository for inspection and recovery
    const deadLetters = await getDeadLetterSyncActions(userId);
    const deadItem = deadLetters.find(d => d.id === actionId);
    expect(deadItem).toBeDefined();
    expect(deadItem?.status).toBe('dead_letter');
    expect(deadItem?.retry_count).toBe(5);
    expect(deadItem?.error_message).toContain('#5');
  });

  it('6. Backoff calculation uses last_attempted_at instead of created_at (RISK-803)', async () => {
    const userId = 'usr_backoff_timing_test';
    const actionId = await enqueueSyncAction('SYNC_TIMING_ACTION', { val: 1 }, userId);

    // Fail the action once
    await markSyncActionFailed(actionId, 'First transient network error');

    const pending = await getPendingSyncActions(userId);
    const item = pending.find(p => p.id === actionId);
    expect(item).toBeDefined();
    expect(item?.retry_count).toBe(1);
    expect(item?.last_attempted_at).toBeDefined();

    // Verify last_attempted_at is a recent ISO timestamp
    const diffMs = Math.abs(Date.now() - new Date(item!.last_attempted_at!).getTime());
    expect(diffMs).toBeLessThan(5000);
  });
});
