/**
 * Lexilume — Unified Learning Activity & Telemetry Service
 * 
 * Provides:
 * 1. Unified event-logging across Daily Poetry, Daily Dialogue, Exercise Completion,
 *    and Country Discovery.
 * 2. Strict language-scoping: events are bound to the active learning language.
 * 3. Content version pinning: When daily content is replaced/archived, historical
 *    activity events retain their original content_id and content_version.
 * 4. Zero fabricated numbers: aggregations derive strictly from recorded events.
 */

import {
  UnifiedActivityEvent,
  ActivityType,
  Language,
  DailyPoem,
  DailyConversation,
  ExerciseAttempt,
} from '../types';
import { StorageService } from './storage';

export interface LanguageActivitySummary {
  poetryCompletedCount: number;
  poetryListenedCount: number;
  poetryOpenedCount: number;
  conversationCompletedCount: number;
  conversationListenedCount: number;
  conversationStartedCount: number;
  exercisesCompletedCount: number;
  vocabularyReviewsCount: number;
  countriesExploredCount: number;
  recentActivities: UnifiedActivityEvent[];
  skillActivityCounts: {
    reading: number;
    listening: number;
    grammar: number;
    vocabulary: number;
    speaking: number;
    writing: number;
  };
}

class ActivityService {
  private static instance: ActivityService;

  public static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  /**
   * Log an activity event idempotently.
   */
  public logEvent(event: Omit<UnifiedActivityEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): UnifiedActivityEvent {
    const id = event.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fullEvent: UnifiedActivityEvent = {
      ...event,
      id,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    StorageService.saveActivityEvent(fullEvent);
    return fullEvent;
  }

  /**
   * Record poetry interaction with content versioning.
   */
  public recordPoetryInteraction(
    poem: DailyPoem,
    action: 'opened' | 'listened' | 'completed'
  ): void {
    const typeMap: Record<string, ActivityType> = {
      opened: 'poetry_opened',
      listened: 'poetry_listened',
      completed: 'poetry_completed',
    };

    // Idempotent event key for same user, content, version, and action
    const eventId = `act_poem_${poem.id}_${action}_${poem.published_at.slice(0, 10)}`;

    this.logEvent({
      id: eventId,
      user_id: StorageService.getCurrentUser(),
      learning_language: poem.learning_language,
      activity_type: typeMap[action] || 'poetry_opened',
      content_id: poem.id,
      content_version: poem.published_at,
      title: poem.title,
      cefr_level: poem.cefr_level,
      completion_status: action === 'completed' ? 'completed' : 'in_progress',
      metadata: {
        author: poem.author,
        country_name: poem.country_name,
        country_code: poem.country_code,
      },
    });
  }

  /**
   * Record daily conversation interaction with dialogue turns metadata.
   */
  public recordConversationInteraction(
    conversation: DailyConversation,
    action: 'started' | 'listened' | 'completed'
  ): void {
    const typeMap: Record<string, ActivityType> = {
      started: 'conversation_started',
      listened: 'conversation_listened',
      completed: 'conversation_completed',
    };

    const eventId = `act_convo_${conversation.id}_${action}_${conversation.published_at.slice(0, 10)}`;

    this.logEvent({
      id: eventId,
      user_id: StorageService.getCurrentUser(),
      learning_language: conversation.learning_language,
      activity_type: typeMap[action] || 'conversation_started',
      content_id: conversation.id,
      content_version: conversation.published_at,
      title: conversation.title,
      cefr_level: conversation.cefr_level,
      completion_status: action === 'completed' ? 'completed' : 'in_progress',
      metadata: {
        scenario: conversation.scenario,
        turn_count: conversation.dialogue.length,
        country_name: conversation.country_name,
      },
    });
  }

  /**
   * Record exercise attempt as an activity event.
   */
  public recordExerciseAttempt(attempt: ExerciseAttempt): void {
    this.logEvent({
      id: `act_ex_${attempt.id}`,
      user_id: StorageService.getCurrentUser(),
      learning_language: attempt.language,
      activity_type: attempt.is_correct ? 'exercise_completed' : 'exercise_attempted',
      content_id: attempt.exercise_id,
      completion_status: attempt.is_correct ? 'completed' : 'in_progress',
      score: attempt.is_correct ? 1 : 0,
      max_score: 1,
      metadata: {
        exercise_type: attempt.exercise_type,
        submitted_answer: attempt.submitted_answer,
        attempt_count: attempt.attempt_count,
      },
    });
  }

  /**
   * Record country exploration (strictly isolated from language proficiency).
   */
  public recordCountryExplored(countryCode: string): void {
    StorageService.recordCountryExplored(countryCode);
    this.logEvent({
      id: `act_country_${countryCode.toUpperCase()}`,
      user_id: StorageService.getCurrentUser(),
      activity_type: 'country_explored',
      content_id: countryCode.toUpperCase(),
      completion_status: 'completed',
      metadata: {
        country_code: countryCode.toUpperCase(),
      },
    });
  }

  /**
   * Aggregate genuine activity metrics for a specific learning language.
   */
  public getLanguageActivitySummary(
    language: Language,
    userId?: string
  ): LanguageActivitySummary {
    const events = StorageService.getActivityEvents(language, userId);
    const attempts = StorageService.getExerciseAttempts(language, userId);
    const srsItems = StorageService.getSRSItems(language, userId);
    const exploredCountries = StorageService.getExploredCountries(userId);

    // Distinct content IDs completed
    const completedPoemIds = new Set<string>();
    const listenedPoemIds = new Set<string>();
    const openedPoemIds = new Set<string>();

    const completedConvoIds = new Set<string>();
    const listenedConvoIds = new Set<string>();
    const startedConvoIds = new Set<string>();

    // Skill counts derived from verified attempts and activities
    let readingCount = 0;
    let listeningCount = 0;
    let grammarCount = 0;
    let vocabularyCount = 0;
    let speakingCount = 0;
    let writingCount = 0;

    for (const ev of events) {
      if (ev.activity_type === 'poetry_completed' && ev.content_id) {
        completedPoemIds.add(ev.content_id);
        readingCount++;
      } else if (ev.activity_type === 'poetry_listened' && ev.content_id) {
        listenedPoemIds.add(ev.content_id);
        listeningCount++;
      } else if (ev.activity_type === 'poetry_opened' && ev.content_id) {
        openedPoemIds.add(ev.content_id);
      } else if (ev.activity_type === 'conversation_completed' && ev.content_id) {
        completedConvoIds.add(ev.content_id);
        listeningCount++;
        speakingCount++;
      } else if (ev.activity_type === 'conversation_listened' && ev.content_id) {
        listenedConvoIds.add(ev.content_id);
        listeningCount++;
      } else if (ev.activity_type === 'conversation_started' && ev.content_id) {
        startedConvoIds.add(ev.content_id);
      } else if (ev.activity_type === 'cultural_article_read') {
        readingCount++;
      }
    }

    // Exercise attempts contributions to skills
    for (const att of attempts) {
      const type = att.exercise_type || '';
      if (type.includes('listening')) {
        listeningCount++;
      } else if (type.includes('reading')) {
        readingCount++;
      } else if (type.includes('cloze') || type.includes('matching') || type.includes('vocab')) {
        vocabularyCount++;
      } else if (type.includes('grammar') || type.includes('error') || type.includes('reorder')) {
        grammarCount++;
      } else if (type.includes('writing')) {
        writingCount++;
      } else if (type.includes('pronunciation') || type.includes('speaking')) {
        speakingCount++;
      } else {
        grammarCount++;
      }
    }

    // Vocabulary review contributions
    for (const srs of srsItems) {
      if (srs.repetition_count > 0) {
        vocabularyCount += srs.repetition_count;
      }
    }

    const correctAttempts = attempts.filter(a => a.is_correct);

    return {
      poetryCompletedCount: completedPoemIds.size,
      poetryListenedCount: listenedPoemIds.size,
      poetryOpenedCount: openedPoemIds.size,
      conversationCompletedCount: completedConvoIds.size,
      conversationListenedCount: listenedConvoIds.size,
      conversationStartedCount: startedConvoIds.size,
      exercisesCompletedCount: correctAttempts.length,
      vocabularyReviewsCount: srsItems.reduce((acc, curr) => acc + curr.repetition_count, 0),
      countriesExploredCount: exploredCountries.length,
      recentActivities: events.slice(0, 10),
      skillActivityCounts: {
        reading: readingCount,
        listening: listeningCount,
        grammar: grammarCount,
        vocabulary: vocabularyCount,
        speaking: speakingCount,
        writing: writingCount,
      },
    };
  }
}

export const activityService = ActivityService.getInstance();
