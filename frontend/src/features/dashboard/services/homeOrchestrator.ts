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
  CEFRLevel,
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

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

/**
 * Checks if content CEFR level is pedagogically compatible (within 1 CEFR level)
 * with the learner's current course level.
 */
export const isCEFRCompatible = (contentCefr: CEFRLevel, learnerCefr: CEFRLevel): boolean => {
  const cIdx = CEFR_ORDER.indexOf(contentCefr);
  const lIdx = CEFR_ORDER.indexOf(learnerCefr);
  return cIdx !== -1 && lIdx !== -1 && Math.abs(cIdx - lIdx) <= 1;
};

/**
 * Priority 1: Unfinished published content item.
 *   - Strictly restores the exact ContentVersion recorded in LearnerContentProgress.
 *   - Never silently binds to latest version if recorded version is inaccessible.
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
      .sort((a, b) => new Date(b.last_studied_at || b.updated_at || b.created_at).getTime() - new Date(a.last_studied_at || a.updated_at || a.created_at).getTime());

    const tryResolveStory = async (
      prog: LearnerContentProgress,
      requireCEFRMatch: boolean
    ): Promise<ContinueItemData | null> => {
      // Invariant: If prog specifies a content_version_id, fetch that EXACT version.
      // Do NOT silently bind to latest version if exact version is missing or inaccessible.
      let version: ContentVersion | null = null;
      if (prog.content_version_id) {
        version = await contentCentredService.getContentVersion(prog.content_version_id);
        if (!version || version.content_item_id !== prog.content_item_id) {
          console.warn(`Exact version ${prog.content_version_id} for item ${prog.content_item_id} inaccessible; skipping candidate.`);
          return null;
        }
      }

      const fullItem = await contentCentredService.getContentItemById(prog.content_item_id);
      if (!fullItem || fullItem.status !== 'published' || fullItem.target_language !== course.target_language) {
        return null;
      }

      const effectiveVersion = version || fullItem.version;
      if (!effectiveVersion) return null;

      const storyLevel = effectiveVersion.cefr_level || fullItem.primary_cefr;
      if (requireCEFRMatch && storyLevel !== course.cefr_level) {
        return null;
      }

      return {
        type: 'story',
        item: fullItem,
        version: effectiveVersion,
        progress: prog,
      };
    };

    // First pass: match target_language and exact current CEFR level
    for (const prog of inProgressList) {
      const resolved = await tryResolveStory(prog, true);
      if (resolved) return resolved;
    }

    // Second pass: safe fallback across any CEFR level in target language
    for (const prog of inProgressList) {
      const resolved = await tryResolveStory(prog, false);
      if (resolved) return resolved;
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
 * - Filters for pedagogical CEFR compatibility (within 1 CEFR level of the active course).
 * - Pairs with authentic daily poetry and daily dialogue.
 * - Does NOT swallow errors, allowing callers to handle editionError.
 */
export const resolveTodaysEdition = async (
  course: Course,
  excludedItemId?: string
): Promise<TodaysEditionData> => {
  let stories: ContentItem[] = [];
  const localDate = getLocalTodayDateString();

  // Invariant: Do NOT silently swallow errors with empty array; propagate to let caller handle editionError!
  const published = await contentCentredService.getContentItems({
    target_language: course.target_language,
    status: 'published',
  });

  const nonExcluded = published.filter(item => item.id !== excludedItemId);
  const cefrMatched = nonExcluded.filter(item => {
    if (item.primary_cefr && course.cefr_level) {
      return isCEFRCompatible(item.primary_cefr, course.cefr_level);
    }
    return true;
  });

  const eligible = cefrMatched.length > 0 ? cefrMatched : nonExcluded;

  // Deterministic shuffle using localDate as seed
  const sorted = [...eligible].sort((a, b) => {
    const hashA = getDeterministicDateHash(`${localDate}_${a.id}`);
    const hashB = getDeterministicDateHash(`${localDate}_${b.id}`);
    return hashA - hashB;
  });

  stories = sorted.slice(0, 2);

  const poem = dailyContentService.getDailyPoem(
    course.target_language,
    course.explanation_language,
    course.cefr_level
  );

  const conversation = dailyContentService.getDailyConversation(
    course.target_language,
    course.explanation_language,
    course.cefr_level
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
 *   using a canonical identity key (preferring legacy_srs_item_id or lemma/term).
 * - Accurately counts distinct words due for review today.
 * - Accurately counts distinct words saved in the past 7 days based on authoritative creation timestamp
 *   (never substituting last_reviewed_at as creation date).
 * - Does NOT swallow errors, allowing callers to handle vocabError.
 */
export const resolveVocabularySummary = async (
  course: Course,
  userId: string
): Promise<VocabularySummaryData> => {
  const today = getLocalTodayDateString();

  const dueCanonicalKeys = new Set<string>();
  const savedThisWeekCanonicalKeys = new Set<string>();

  // 1. Process course SRS items (strictly scoped to course.target_language)
  const srsItems = StorageService.getSRSItems(course.target_language, userId);
  for (const item of srsItems) {
    if (item.language && item.language !== course.target_language) continue;
    const termKey = (item.vocabulary_item_id || '').trim().toLowerCase();
    if (!termKey) continue;

    if (item.next_review_date && item.next_review_date <= today) {
      dueCanonicalKeys.add(termKey);
    }

    // Invariant: DO NOT use last_reviewed_at as creation date substitute.
    // Only count if an explicit created_at exists on the SRS item.
    const createdAt = (item as any).created_at;
    if (createdAt && isWithinLast7Days(createdAt)) {
      savedThisWeekCanonicalKeys.add(termKey);
    }
  }

  // 2. Process content-centred saved words (strictly scoped to course.target_language)
  // Let errors propagate to caller so caller can present error state to the user instead of fake zeros!
  const savedWords: UserSavedWord[] = await contentCentredService.getUserSavedWords(
    userId,
    course.target_language
  );

  for (const w of savedWords) {
    const targetLang = w.target_language || (w as any).language;
    if (targetLang && targetLang !== course.target_language) continue;
    // Canonical mapping: prefer legacy_srs_item_id if set, else lemma or term
    const canonicalKey = (w.legacy_srs_item_id || w.lemma || w.term).trim().toLowerCase();
    if (!canonicalKey) continue;

    const nextDue = w.next_review || (w as any).next_review_date;
    if (nextDue && nextDue <= today) {
      dueCanonicalKeys.add(canonicalKey);
    }

    // Authoritative creation date: w.created_at
    if (w.created_at && isWithinLast7Days(w.created_at)) {
      savedThisWeekCanonicalKeys.add(canonicalKey);
    }
  }

  return {
    dueSRSCount: dueCanonicalKeys.size,
    savedThisWeekCount: savedThisWeekCanonicalKeys.size,
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
