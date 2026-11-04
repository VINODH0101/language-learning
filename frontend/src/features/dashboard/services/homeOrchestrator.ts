/**
 * Lexilume — Home Page Data Orchestrator (Phase 8 Editorial Architecture)
 * 
 * Provides unified, decoupled, offline-first data resolution for the 6 learner Home sections:
 * 1. Personal Welcome: User profile, target language, CEFR level, explanation language (four-way decoupling).
 * 2. Continue Learning: Resumes most recently accessed unfinished published content ->
 *    fallback to daily curriculum lesson -> fallback to recommended content -> empty state.
 * 3. Today's Edition: Curated 2-3 items combining published stories, daily poetry, and daily dialogues.
 * 4. Vocabulary Summary: Due SRS review count, recently saved words (within 7 days) via distinct lemma union.
 * 5. Daily Learning Goal: Genuine cognitive study minutes vs configured daily goal.
 * 6. Recently Learned: Up to 3 recent learning activities from progress history (batch-loaded, no N+1).
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
  UserSavedWord,
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
 * Deterministic hash generator for stable daily item ordering.
 */
export const getDeterministicDateHash = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Priority 1: Unfinished published content item.
 *   - Prioritizes current CEFR level first, but safely falls back to any unfinished item
 *     in target_language if course level changed, preventing loss of access.
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

    // Batch load candidate items to avoid N+1 queries
    const publishedItems = await contentCentredService.getContentItems({
      target_language: course.target_language,
      status: 'published',
    });
    const publishedMap = new Map(publishedItems.map(it => [it.id, it]));

    // First pass: match target_language and exact current CEFR level
    for (const prog of inProgressList) {
      const item = publishedMap.get(prog.content_item_id);
      if (item && item.primary_cefr === course.cefr_level) {
        const fullItem = await contentCentredService.getContentItemById(item.id);
        if (fullItem && fullItem.version) {
          return {
            type: 'story',
            item: fullItem,
            version: fullItem.version,
            progress: prog,
          };
        }
      }
    }

    // Second pass: safe fallback across any CEFR level in target language
    for (const prog of inProgressList) {
      const item = publishedMap.get(prog.content_item_id);
      if (item) {
        const fullItem = await contentCentredService.getContentItemById(item.id);
        if (fullItem && fullItem.version) {
          return {
            type: 'story',
            item: fullItem,
            version: fullItem.version,
            progress: prog,
          };
        }
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
 * Resolves Today's Edition:
 * - Deterministically selects stories based on the learner's local date string (YYYY-MM-DD).
 * - Excludes the active Continue Learning item to prevent duplicate cards.
 * - Pairs with authentic daily poetry and daily dialogue.
 */
export const resolveTodaysEdition = async (
  course: Course,
  excludedItemId?: string
): Promise<TodaysEditionData> => {
  let stories: ContentItem[] = [];
  const localDate = getLocalTodayDateString();

  try {
    const published = await contentCentredService.getContentItems({
      target_language: course.target_language,
      status: 'published',
    });

    const eligible = published.filter(item => item.id !== excludedItemId);

    // Deterministic shuffle using localDate as seed
    const sorted = [...eligible].sort((a, b) => {
      const hashA = getDeterministicDateHash(`${localDate}_${a.id}`);
      const hashB = getDeterministicDateHash(`${localDate}_${b.id}`);
      return hashA - hashB;
    });

    stories = sorted.slice(0, 2);
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
 * Resolves Vocabulary Summary metrics:
 * - Deduplicates words across both StorageService SRS items and content-centred saved words
 *   using a distinct union of normalized lemmas/terms.
 * - Accurately counts distinct words due for review today.
 * - Accurately counts distinct words saved in the past 7 days (no Math.max approximation).
 */
export const resolveVocabularySummary = async (
  course: Course,
  userId: string
): Promise<VocabularySummaryData> => {
  const today = getLocalTodayDateString();

  const dueNormalizedTerms = new Set<string>();
  const savedThisWeekNormalizedTerms = new Set<string>();

  // 1. Process course SRS items
  const srsItems = StorageService.getSRSItems(course.target_language, userId);
  for (const item of srsItems) {
    const termKey = (item.vocabulary_item_id || '').trim().toLowerCase();
    if (!termKey) continue;

    if (item.next_review_date <= today) {
      dueNormalizedTerms.add(termKey);
    }

    const reviewDate = item.last_reviewed_at || (item as any).created_at;
    if (isWithinLast7Days(reviewDate)) {
      savedThisWeekNormalizedTerms.add(termKey);
    }
  }

  // 2. Process content-centred saved words
  try {
    const savedWords: UserSavedWord[] = await contentCentredService.getUserSavedWords(
      userId,
      course.target_language
    );

    for (const w of savedWords) {
      const termKey = (w.lemma || w.term).trim().toLowerCase();
      if (!termKey) continue;

      const nextDue = w.next_review || (w as any).next_review_date;
      if (nextDue && nextDue <= today) {
        dueNormalizedTerms.add(termKey);
      }

      if (isWithinLast7Days(w.created_at)) {
        savedThisWeekNormalizedTerms.add(termKey);
      }
    }
  } catch (err) {
    console.warn('Failed checking content-centred saved words:', err);
  }

  return {
    dueSRSCount: dueNormalizedTerms.size,
    savedThisWeekCount: savedThisWeekNormalizedTerms.size,
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
 * Batch retrieves content items to eliminate the N+1 query pattern.
 */
export const resolveRecentActivities = async (
  course: Course,
  userId: string
): Promise<RecentLearningActivity[]> => {
  const activities: RecentLearningActivity[] = [];
  const seenIds = new Set<string>();

  // 1. Batch load published content items for target language
  try {
    const publishedItems = await contentCentredService.getContentItems({
      target_language: course.target_language,
      status: 'published',
    });
    const contentMap = new Map(publishedItems.map(it => [it.id, it]));

    // Check learner content progress
    const progressList = await contentCentredService.getAllLearnerProgress(userId);
    for (const prog of progressList) {
      const item = contentMap.get(prog.content_item_id);
      if (item && !seenIds.has(prog.content_item_id)) {
        seenIds.add(prog.content_item_id);
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

  // 2. Check unified activity events (poetry, conversation, practice, curriculum)
  try {
    const events = StorageService.getActivityEvents(course.target_language, userId);
    for (const ev of events) {
      if (seenIds.has(ev.id)) continue;
      seenIds.add(ev.id);

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
