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
});
