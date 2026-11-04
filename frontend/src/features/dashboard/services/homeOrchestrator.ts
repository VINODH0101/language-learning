/**
 * Lexilume — Home Page Data Orchestrator (Phase 8 Editorial Architecture)
 * 
 * Provides unified, decoupled, offline-first data resolution for the 6 learner Home sections:
 * 1. Personal Welcome: User profile, target language, CEFR level, explanation language (four-way decoupling).
 * 2. Continue Learning: Resumes most recently accessed unfinished published content ->
 *    fallback to daily curriculum lesson -> fallback to recommended content -> empty state.
 * 3. Today's Edition: Curated 2-3 items combining published stories, daily poetry, and daily dialogues.
 * 4. Vocabulary Summary: Due SRS review count, recently saved words (within 7 days).
 * 5. Daily Learning Goal: Genuine cognitive study minutes vs configured daily goal.
 * 6. Recently Learned: Up to 3 recent learning activities from progress history.
 */

import {
  Course,
  Language,
  DailyPoem,
  DailyConversation,
  DailyLessonPayload,
  ActiveLessonProgress,
  UnifiedActivityEvent,
} from '../../../types';
import {
  ContentItem,
  ContentVersion,
  LearnerContentProgress,
} from '../../../types/contentCentred';
import { contentCentredService } from '../../../services/contentCentredService';
import { StorageService } from '../../../services/storage';
import { courseService } from '../../../services/courseService';
import { ClientLessonGenerator } from '../../../services/lessonGenerator';
import { getActiveProgress } from '../../../services/localDb';
import { dailyContentService } from '../../../services/dailyContentService';

export type ContinueItemData =
  | {
      type: 'story';
      item: ContentItem;
      version: ContentVersion;
      progress: LearnerContentProgress;
    }
  | {
      type: 'curriculum';
      lesson: DailyLessonPayload;
      progress: ActiveLessonProgress | null;
    }
  | {
      type: 'recommended';
      item: ContentItem;
      version?: ContentVersion;
    }
  | {
      type: 'empty';
    };

export interface TodaysEditionData {
  stories: ContentItem[];
  poem: DailyPoem | null;
  conversation: DailyConversation | null;
}

export interface VocabularySummaryData {
  dueSRSCount: number;
  savedThisWeekCount: number;
}

export interface DailyGoalData {
  elapsedMinutes: number;
  dailyGoalMinutes: number;
  goalProgressPct: number;
}

export interface RecentLearningActivity {
  id: string;
  title: string;
  type: 'story' | 'poetry' | 'conversation' | 'curriculum' | 'practice';
  date: string;
  status: 'completed' | 'in_progress';
}

/**
 * Returns today's date string in learner's local timezone (YYYY-MM-DD),
 * eliminating timezone discrepancies from UTC toISOString().
 */
export const getLocalTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if an ISO date string falls within the past 7 days.
 */
export const isWithinLast7Days = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return time >= sevenDaysAgo;
};

/**
 * Priority 1: Unfinished published content item.
 * Priority 2: Structured daily curriculum lesson.
 * Priority 3: Recommended published content item.
 * Priority 4: Empty state.
 */
export const resolveContinueLearning = async (
  course: Course,
  userId: string
): Promise<ContinueItemData> => {
  const today = getLocalTodayDateString();

  // 1. Try to find most recently accessed unfinished published content
  try {
    const allProgress = await contentCentredService.getAllLearnerProgress(userId);
    const inProgressList = allProgress
      .filter(p => p.status === 'in_progress')
      .sort((a, b) => new Date(b.last_studied_at).getTime() - new Date(a.last_studied_at).getTime());

    for (const prog of inProgressList) {
      const fullItem = await contentCentredService.getContentItemById(prog.content_item_id);
      if (
        fullItem &&
        fullItem.status === 'published' &&
        fullItem.target_language === course.target_language &&
        fullItem.version
      ) {
        return {
          type: 'story',
          item: fullItem,
          version: fullItem.version,
          progress: prog,
        };
      }
    }
  } catch (err) {
    console.warn('Failed resolving in-progress story, falling back:', err);
  }

  // 2. Fallback to structured daily curriculum lesson
  try {
    const lesson = ClientLessonGenerator.generateOrGetLesson(
      courseService.toCourseConfig(course),
      today
    );
    if (lesson) {
      const progress = await getActiveProgress(course.target_language);
      const isTodayProgress = progress && progress.lesson_date === today ? progress : null;
      return {
        type: 'curriculum',
        lesson,
        progress: isTodayProgress,
      };
    }
  } catch (err) {
    console.warn('Failed generating curriculum lesson, falling back:', err);
  }

  // 3. Fallback to recommended published content
  try {
    const published = await contentCentredService.getContentItems({
      target_language: course.target_language,
      status: 'published',
    });
    if (published.length > 0) {
      const full = await contentCentredService.getContentItemById(published[0].id);
      return {
        type: 'recommended',
        item: full || published[0],
        version: full?.version,
      };
    }
  } catch (err) {
    console.warn('Failed resolving recommended content:', err);
  }

  // 4. Empty state
  return { type: 'empty' };
};

/**
 * Resolves Today's Edition: Curates 2-3 items combining published stories,
 * daily poetry, and daily conversation.
 */
export const resolveTodaysEdition = async (
  course: Course,
  excludedItemId?: string
): Promise<TodaysEditionData> => {
  let stories: ContentItem[] = [];
  try {
    const published = await contentCentredService.getContentItems({
      target_language: course.target_language,
      status: 'published',
    });
    stories = published
      .filter(item => item.id !== excludedItemId)
      .slice(0, 2);
  } catch (err) {
    console.warn('Failed fetching published stories for edition:', err);
  }

  const poem = dailyContentService.getDailyPoem(
    course.target_language,
    course.explanation_language
  );

  const conversation = dailyContentService.getDailyConversation(
    course.target_language,
    course.explanation_language
  );

  return {
    stories,
    poem,
    conversation,
  };
};

/**
 * Resolves Vocabulary Summary metrics: Due SRS items count and words saved in past 7 days.
 */
export const resolveVocabularySummary = async (
  course: Course,
  userId: string
): Promise<VocabularySummaryData> => {
  const today = getLocalTodayDateString();
  const srsItems = StorageService.getSRSItems(course.target_language, userId);

  const dueSRSCount = srsItems.filter(s => s.next_review_date <= today).length;
  let savedThisWeekCount = srsItems.filter(s => isWithinLast7Days(s.last_reviewed_at || undefined)).length;

  try {
    const savedWords = await contentCentredService.getUserSavedWords(userId, course.target_language);
    const recentWords = savedWords.filter(w => isWithinLast7Days(w.created_at));
    // Union count approximation
    savedThisWeekCount = Math.max(savedThisWeekCount, recentWords.length);
  } catch (err) {
    console.warn('Failed checking content-centred saved words:', err);
  }

  return {
    dueSRSCount,
    savedThisWeekCount,
  };
};

/**
 * Resolves genuine daily study minutes and calculates goal progression percentage.
 */
export const resolveDailyGoal = (
  course: Course,
  userId: string
): DailyGoalData => {
  const elapsedMinutes = StorageService.getTodayStudyMinutes(userId);
  const dailyGoalMinutes = course.daily_goal_minutes || 10;
  const goalProgressPct = Math.min(
    100,
    dailyGoalMinutes > 0 ? Math.round((elapsedMinutes / dailyGoalMinutes) * 100) : 0
  );

  return {
    elapsedMinutes,
    dailyGoalMinutes,
    goalProgressPct,
  };
};

/**
 * Resolves up to 3 most recent learning activities for Section 6.
 */
export const resolveRecentActivities = async (
  course: Course,
  userId: string
): Promise<RecentLearningActivity[]> => {
  const activities: RecentLearningActivity[] = [];

  // 1. Check learner content progress
  try {
    const progressList = await contentCentredService.getAllLearnerProgress(userId);
    for (const prog of progressList) {
      const item = await contentCentredService.getContentItemById(prog.content_item_id);
      if (item && item.target_language === course.target_language) {
        activities.push({
          id: `prog_${prog.id}`,
          title: item.title,
          type: 'story',
          date: prog.last_studied_at || prog.updated_at || prog.created_at,
          status: prog.status === 'completed' ? 'completed' : 'in_progress',
        });
      }
    }
  } catch (err) {
    console.warn('Failed loading content progress for recent activities:', err);
  }

  // 2. Check unified activity events (poetry, conversation, practice)
  try {
    const events = StorageService.getActivityEvents(course.target_language, userId);
    for (const ev of events) {
      let actType: RecentLearningActivity['type'] = 'practice';
      if (ev.activity_type.startsWith('poetry')) actType = 'poetry';
      else if (ev.activity_type.startsWith('conversation')) actType = 'conversation';
      else if (ev.activity_type.startsWith('lesson')) actType = 'curriculum';

      activities.push({
        id: `ev_${ev.id}`,
        title: ev.title || `Lesson Activity`,
        type: actType,
        date: ev.timestamp,
        status: ev.completion_status === 'completed' ? 'completed' : 'in_progress',
      });
    }
  } catch (err) {
    console.warn('Failed loading activity events for recent activities:', err);
  }

  // Sort by date descending and return top 3
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return activities.slice(0, 3);
};
