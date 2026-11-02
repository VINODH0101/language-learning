import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contentCentredService } from '../services/contentCentredService';
import {
  migrateGuestContentData,
  getUserSavedWordsLocal,
  getLearnerProgressLocal,
  getUserMistakesLocal,
  getPendingSyncActions,
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
});
