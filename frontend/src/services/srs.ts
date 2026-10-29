import { SRSItemState, MasteryStatus, Language } from '../types';

export class SRSService {
  static readonly DEFAULT_EASE_FACTOR = 2.5;
  static readonly MIN_EASE_FACTOR = 1.3;
  static readonly MASTERY_REP_THRESHOLD = 5;
  static readonly MASTERY_INTERVAL_THRESHOLD = 21;

  static calculateNextState(
    current: SRSItemState,
    grade: number, // 0 to 5
    reviewDate: Date = new Date()
  ): SRSItemState {
    const q = Math.max(0, Math.min(5, Math.round(grade)));
    const rep = current.repetition_count;
    const ef = current.ease_factor;
    const interval = current.interval_days;
    const lapses = current.lapse_count;

    let newRep: number;
    let newInterval: number;
    let newLapses: number;
    let newStatus: MasteryStatus;

    if (q < 3) {
      // Failed recall (lapse)
      newRep = 0;
      newInterval = 1;
      newLapses = lapses + 1;
      newStatus = 'learning';
    } else {
      // Successful recall
      if (rep === 0) {
        newInterval = 1;
      } else if (rep === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.max(1, Math.round(interval * ef));
      }
      newRep = rep + 1;
      newLapses = lapses;

      // Status progression
      if (newRep >= this.MASTERY_REP_THRESHOLD && newInterval >= this.MASTERY_INTERVAL_THRESHOLD) {
        newStatus = 'mastered';
      } else if (newRep >= 3) {
        newStatus = 'reviewing';
      } else {
        newStatus = 'learning';
      }
    }

    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEf = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    newEf = Math.max(this.MIN_EASE_FACTOR, Math.round(newEf * 100) / 100);

    const nextDate = new Date(reviewDate);
    nextDate.setDate(nextDate.getDate() + newInterval);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const newHistory = [
      ...current.history,
      {
        review_date: reviewDate.toISOString().split('T')[0],
        grade: q,
        interval_days: newInterval,
        ease_factor: newEf,
      },
    ];

    return {
      vocabulary_item_id: current.vocabulary_item_id,
      language: current.language,
      repetition_count: newRep,
      ease_factor: newEf,
      interval_days: newInterval,
      next_review_date: nextDateStr,
      last_reviewed_at: reviewDate.toISOString(),
      lapse_count: newLapses,
      mastery_status: newStatus,
      history: newHistory,
    };
  }

  static createInitialState(vocabularyItemId: string, language: Language, targetDate: string = new Date().toISOString().split('T')[0]): SRSItemState {
    return {
      vocabulary_item_id: vocabularyItemId,
      language,
      repetition_count: 0,
      ease_factor: this.DEFAULT_EASE_FACTOR,
      interval_days: 1,
      next_review_date: targetDate,
      lapse_count: 0,
      mastery_status: 'presented',
      history: [],
    };
  }
}
