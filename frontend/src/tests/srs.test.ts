import { describe, it, expect } from 'vitest';
import { SRSService } from '../services/srs';

describe('SRSService (SM-2 Spaced Repetition)', () => {
  it('calculates initial state properly', () => {
    const initial = SRSService.createInitialState('pt-voc-01', 'pt', '2026-10-30');
    expect(initial.vocabulary_item_id).toBe('pt-voc-01');
    expect(initial.language).toBe('pt');
    expect(initial.repetition_count).toBe(0);
    expect(initial.ease_factor).toBe(2.5);
    expect(initial.interval_days).toBe(1);
    expect(initial.next_review_date).toBe('2026-10-30');
    expect(initial.mastery_status).toBe('presented');
    expect(initial.lapse_count).toBe(0);
  });

  it('progresses intervals on successful grades (grade >= 3)', () => {
    const initial = SRSService.createInitialState('pt-voc-01', 'pt', '2026-10-29');
    
    // First review with grade 4 (Good)
    const reviewDate = new Date('2026-10-29T10:00:00Z');
    const step1 = SRSService.calculateNextState(initial, 4, reviewDate);
    expect(step1.repetition_count).toBe(1);
    expect(step1.interval_days).toBe(1);
    expect(step1.mastery_status).toBe('learning');

    // Second review with grade 5 (Easy)
    const step2 = SRSService.calculateNextState(step1, 5, new Date('2026-10-30T10:00:00Z'));
    expect(step2.repetition_count).toBe(2);
    expect(step2.interval_days).toBe(6);
    expect(step2.mastery_status).toBe('learning');

    // Third review with grade 4
    const step3 = SRSService.calculateNextState(step2, 4, new Date('2026-11-05T10:00:00Z'));
    expect(step3.repetition_count).toBe(3);
    expect(step3.interval_days).toBeGreaterThanOrEqual(14);
    expect(step3.mastery_status).toBe('reviewing');
  });

  it('marks item as mastered after >= 5 successful repetitions and interval >= 21 days', () => {
    let state = SRSService.createInitialState('es-voc-01', 'es', '2026-10-29');
    let reviewDate = new Date('2026-10-29T10:00:00Z');

    for (let i = 0; i < 5; i++) {
      state = SRSService.calculateNextState(state, 5, reviewDate);
      reviewDate = new Date(state.next_review_date + 'T10:00:00Z');
    }

    expect(state.repetition_count).toBe(5);
    expect(state.interval_days).toBeGreaterThanOrEqual(21);
    expect(state.mastery_status).toBe('mastered');
  });

  it('resets interval to 1 on failure (grade < 3) and records lapse', () => {
    let state = SRSService.createInitialState('pt-voc-02', 'pt', '2026-10-29');
    state = SRSService.calculateNextState(state, 4, new Date('2026-10-29T10:00:00Z'));
    state = SRSService.calculateNextState(state, 4, new Date('2026-10-30T10:00:00Z'));
    expect(state.repetition_count).toBe(2);
    expect(state.interval_days).toBe(6);

    // Fail review (grade 1)
    const failedState = SRSService.calculateNextState(state, 1, new Date('2026-11-05T10:00:00Z'));
    expect(failedState.repetition_count).toBe(0);
    expect(failedState.interval_days).toBe(1);
    expect(failedState.lapse_count).toBe(1);
    expect(failedState.mastery_status).toBe('learning');
  });

  it('does not allow ease factor to drop below 1.3', () => {
    let state = SRSService.createInitialState('pt-voc-03', 'pt', '2026-10-29');
    const reviewDate = new Date('2026-10-29T10:00:00Z');
    
    // Multiple zero ratings
    for (let i = 0; i < 10; i++) {
      state = SRSService.calculateNextState(state, 0, reviewDate);
    }

    expect(state.ease_factor).toBe(1.3);
  });
});
