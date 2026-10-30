import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storage';

describe('StorageService (Local State Persistence)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes default user settings correctly', () => {
    const settings = StorageService.getSettings();
    expect(settings).toBeDefined();
    expect(settings.pt_variety).toBe('pt-BR');
    expect(settings.es_variety).toBe('es-ES');
    expect(settings.study_mode).toBe('full');
    expect(settings.email_notifications_enabled).toBe(true);
  });

  it('updates and persists user settings', () => {
    const current = StorageService.getSettings();
    const updated = {
      ...current,
      pt_variety: 'pt-PT' as const,
      es_variety: 'es-419' as const,
      study_mode: 'compact' as const,
    };
    StorageService.saveSettings(updated);

    const retrieved = StorageService.getSettings();
    expect(retrieved.pt_variety).toBe('pt-PT');
    expect(retrieved.es_variety).toBe('es-419');
    expect(retrieved.study_mode).toBe('compact');
  });

  it('manages track state and progression', () => {
    const ptState = StorageService.getTrackState('pt');
    expect(ptState.language).toBe('pt');
    expect(ptState.total_lessons_completed).toBe(0);

    const updated = {
      ...ptState,
      total_lessons_completed: 1,
      streak_days: 2,
      completed_curriculum_node_ids: ['pt-c1-01'],
    };
    StorageService.saveTrackState(updated);

    const fresh = StorageService.getTrackState('pt');
    expect(fresh.total_lessons_completed).toBe(1);
    expect(fresh.streak_days).toBe(2);
    expect(fresh.completed_curriculum_node_ids).toContain('pt-c1-01');
  });

  it('records exercise attempts and stores history', () => {
    StorageService.saveExerciseAttempt({
      id: 'att-1',
      exercise_id: 'ex-1',
      submitted_answer: 'correto',
      is_correct: true,
      feedback: 'Correto!',
      attempt_count: 1,
      timestamp: new Date().toISOString(),
    });

    StorageService.saveExerciseAttempt({
      id: 'att-2',
      exercise_id: 'ex-2',
      submitted_answer: 'errado',
      is_correct: false,
      feedback: 'Incorreto.',
      attempt_count: 1,
      timestamp: new Date().toISOString(),
    });

    const attempts = StorageService.getExerciseAttempts();
    expect(attempts.length).toBe(2);
    expect(attempts[0].id).toBe('att-2'); // Unshifted, latest first
    expect(attempts[1].id).toBe('att-1');
  });

  it('enforces multi-user account isolation without cross-tenant data leakage', () => {
    // 1. User Alpha logs in and saves Portuguese progress
    StorageService.setCurrentUser('user_alpha');
    const alphaTrack = StorageService.getTrackState('pt');
    alphaTrack.total_lessons_completed = 10;
    alphaTrack.streak_days = 5;
    StorageService.saveTrackState(alphaTrack);

    StorageService.saveSRSItem({
      vocabulary_item_id: 'voc-alpha-1',
      language: 'pt',
      repetition_count: 3,
      ease_factor: 2.5,
      interval_days: 6,
      next_review_date: '2026-11-05',
      lapse_count: 0,
      mastery_status: 'reviewing',
      history: [],
    });

    // 2. User Beta logs in on the same browser
    StorageService.setCurrentUser('user_beta');
    const betaTrack = StorageService.getTrackState('pt');
    // Beta must not see Alpha's progress!
    expect(betaTrack.total_lessons_completed).toBe(0);
    expect(betaTrack.streak_days).toBe(1);

    const betaSRS = StorageService.getSRSItems('pt');
    expect(betaSRS).toHaveLength(0);

    // Beta saves their own Spanish progress
    betaTrack.total_lessons_completed = 2;
    StorageService.saveTrackState(betaTrack);

    // 3. User Alpha switches back
    StorageService.setCurrentUser('user_alpha');
    const alphaFresh = StorageService.getTrackState('pt');
    expect(alphaFresh.total_lessons_completed).toBe(10);
    expect(alphaFresh.streak_days).toBe(5);

    const alphaSRS = StorageService.getSRSItems('pt');
    expect(alphaSRS).toHaveLength(1);
    expect(alphaSRS[0].vocabulary_item_id).toBe('voc-alpha-1');

    // 4. Return to guest mode
    StorageService.setCurrentUser('guest');
  });

  it('safely migrates guest progress to newly registered user account', () => {
    StorageService.setCurrentUser('guest');
    const guestTrack = StorageService.getTrackState('pt');
    guestTrack.total_lessons_completed = 3;
    StorageService.saveTrackState(guestTrack);

    // User signs up with ID usr_newbie
    StorageService.migrateGuestData('usr_newbie');
    StorageService.setCurrentUser('usr_newbie');

    const migratedTrack = StorageService.getTrackState('pt');
    expect(migratedTrack.total_lessons_completed).toBe(3);

    // Reset guest scope
    StorageService.setCurrentUser('guest');
  });
});
