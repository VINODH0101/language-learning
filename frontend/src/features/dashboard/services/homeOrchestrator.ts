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
      type: 'recovery';
      item: ContentItem | null;
      requestedVersionId: string;
      reason: 'version_unavailable' | 'version_mismatch';
    }
  | {
      type: 'empty';
    };

/**
 * Returns the content item id represented by a Continue Learning resolution.
 * Used to guarantee the same item never appears twice between Continue Learning
 * and Today's Edition.
 */
export const getContinueContentItemId = (item: ContinueItemData | null): string | undefined => {
  if (!item) return undefined;
  if (item.type === 'story' || item.type === 'recommended') return item.item.id;
  if (item.type === 'recovery') return item.item?.id;
  return undefined;
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
 * Checks if an ISO date string falls within the past 7 local calendar days (including today).
 * Respects local midnight boundaries.
 */
export const isWithinLast7Days = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return false;

  const now = new Date();
  // Start of day 6 days ago in local timezone (7 calendar days total)
  const startOf7DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return targetDate.getTime() >= startOf7DaysAgo.getTime() && targetDate.getTime() <= endOfToday.getTime();
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
 * Normalizes vocabulary text canonically using Unicode NFC, lowercase, and trimming.
 * Accents and diacritics are strictly preserved (e.g. 'está' !== 'esta').
 */
export const normalizeCanonicalVocabKey = (text?: string | null): string => {
  return (text || '').normalize('NFC').trim().toLowerCase();
};

/**
 * Builds a composite canonical vocabulary identity:
 * 1. Target language is always a mandatory prefix (e.g. 'pt:café' vs 'es:café').
 * 2. Normalizes Unicode to canonical NFC.
 * 3. Normalizes whitespace and lowercase.
 * 4. Preserves meaningful accents and diacritics ('está' !== 'esta').
 * 5. Uses controlled fallback order: canonicalId -> lemma -> term.
 */
export const buildCanonicalVocabIdentity = (
  targetLanguage: string,
  canonicalId?: string | null,
  lemma?: string | null,
  term?: string | null
): string | null => {
  const lang = (targetLanguage || '').trim().toLowerCase();
  if (!lang) return null;

  const rawToken = canonicalId || lemma || term;
  const normalized = normalizeCanonicalVocabKey(rawToken);
  if (!normalized) return null;

  return `${lang}:${normalized}`;
};

/**
 * Detects legacy synthetic SRS identifiers (e.g. "srs_cafe_123", "legacy_42").
 * Such IDs may represent a real saved word, but without an explicit mapping to
 * a canonical lemma/term they must not be counted as a confirmed vocabulary word.
 */
export const isLegacySyntheticVocabId = (value?: string | null): boolean =>
  Boolean(value && /^(srs|legacy|legacy_srs|vocab_item)[_-]/i.test(value.trim()));

/**
 * Priority 1: Most recently accessed unfinished published content item.
 *   - Strictly restores the exact ContentVersion recorded in LearnerContentProgress.
 *   - If that exact version is unavailable or mismatched, returns a recovery state
 *     instead of silently opening a different version.
 *   - CEFR level never overrides recency for an item the learner already started;
 *     unfinished work in the target language always remains resumable.
 * Priority 2: Structured daily curriculum lesson.
 * Priority 3: Recommended published content item.
 *   - Excludes already completed items.
 *   - Matches CEFR level compatibility.
 *   - Deterministically rotated per user/course/date.
 * Priority 4: Empty state.
 */
export const resolveContinueLearning = async (
  course: Course,
  userId: string
): Promise<ContinueItemData> => {
  const today = getLocalTodayDateString();

  // 1. Try to find most recently accessed unfinished published content
  // Do NOT silently catch errors: allow errors to propagate so callers can show retry UI
  const allProgress = await contentCentredService.getAllLearnerProgress(userId);
  const inProgressList = allProgress
    .filter(p => p.status === 'in_progress')
    .sort((a, b) => new Date(b.last_studied_at || b.updated_at || b.created_at).getTime() - new Date(a.last_studied_at || a.updated_at || a.created_at).getTime());

  for (const prog of inProgressList) {
    const fullItem = await contentCentredService.getContentItemById(prog.content_item_id);

    // Never surface unpublished, archived, or out-of-language content.
    if (
      !fullItem ||
      fullItem.status !== 'published' ||
      fullItem.target_language !== course.target_language
    ) {
      continue;
    }

    // Invariant: If progress specifies a content_version_id, restore that EXACT version.
    // Never silently substitute the latest version when the recorded edition is missing.
    let version: ContentVersion | null = null;
    if (prog.content_version_id) {
      version = await contentCentredService.getContentVersion(prog.content_version_id);
      if (!version || version.content_item_id !== prog.content_item_id) {
        return {
          type: 'recovery',
          item: fullItem,
          requestedVersionId: prog.content_version_id,
          reason: version ? 'version_mismatch' : 'version_unavailable',
        };
      }
    }

    const effectiveVersion = version || fullItem.version;
    if (!effectiveVersion) {
      return {
        type: 'recovery',
        item: fullItem,
        requestedVersionId: prog.content_version_id || '',
        reason: 'version_unavailable',
      };
    }

    return {
      type: 'story',
      item: fullItem,
      version: effectiveVersion,
      progress: prog,
    };
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
    console.warn('Failed generating curriculum lesson, falling back to recommendation:', err);
  }

  // 3. Fallback to suitable published recommendation
  // - Exclude completed items (never recommend completed items as unfinished)
  // - Prefer exact CEFR match, then compatible CEFR match (|delta| <= 1)
  // - Never select arbitrary content merely because it is the first catalog item
  // - Deterministic rotation per user/course/date
  // Invariant: Do NOT swallow backend/network errors into fake empty states;
  // let errors propagate so caller presents the error state with a retry action!
  const published = await contentCentredService.getContentItems({
    target_language: course.target_language,
    status: 'published',
  });

  const completedIds = new Set(
    allProgress.filter(p => p.status === 'completed').map(p => p.content_item_id)
  );
  const uncompleted = published.filter(item => !completedIds.has(item.id));

  // If all published items have already been completed, honestly transition to empty state
  if (uncompleted.length === 0) {
    return { type: 'empty' };
  }

  const exactCefr = uncompleted.filter(item => item.primary_cefr === course.cefr_level);
  const compatibleCefr = uncompleted.filter(item => item.primary_cefr && isCEFRCompatible(item.primary_cefr, course.cefr_level));
  const eligiblePool = exactCefr.length > 0 ? exactCefr : compatibleCefr;

  // If no CEFR-compatible uncompleted items exist, do not recommend distant levels; return empty state
  if (eligiblePool.length === 0) {
    return { type: 'empty' };
  }

  const sortedPool = [...eligiblePool].sort((a, b) => {
    const hashA = getDeterministicDateHash(`${today}_${course.id}_${a.id}`);
    const hashB = getDeterministicDateHash(`${today}_${course.id}_${b.id}`);
    return hashA - hashB;
  });

  const selected = sortedPool[0];
  const full = await contentCentredService.getContentItemById(selected.id);
  return {
    type: 'recommended',
    item: full || selected,
    version: full?.version,
  };
};

/**
 * Resolves Today's Edition:
 * - Deterministically selects stories based on the learner's local date string (YYYY-MM-DD).
 * - Excludes the active Continue Learning item to prevent duplicate cards.
 * - Explicit CEFR policy:
 *     1. Exact CEFR matches preferred.
 *     2. If no exact match, falls back to compatible adjacent levels (|delta| <= 1).
 *     3. If neither exact nor compatible levels exist, returns [] (never unrelated distant levels).
 * - Pairs with authentic daily poetry and daily dialogue.
 * - Does NOT swallow errors, allowing callers to handle editionError.
 */
export const resolveTodaysEdition = async (
  course: Course,
  excludedItemId?: string
): Promise<TodaysEditionData> => {
  let stories: ContentItem[] = [];
  const localDate = getLocalTodayDateString();

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

  // Invariant: Do NOT silently swallow errors with empty array; propagate to let caller handle editionError!
  const published = await contentCentredService.getContentItems({
    target_language: course.target_language,
    status: 'published',
  });

  const nonExcluded = published.filter(item => item.id !== excludedItemId);
  const exactMatched = nonExcluded.filter(item => item.primary_cefr === course.cefr_level);
  const compatibleMatched = nonExcluded.filter(item => {
    if (item.primary_cefr && course.cefr_level) {
      return isCEFRCompatible(item.primary_cefr, course.cefr_level);
    }
    return false;
  });

  // Strict CEFR Fallback Policy:
  // Prefer exact match -> fallback to compatible adjacent level -> otherwise empty (no distant levels)
  const eligible = exactMatched.length > 0 ? exactMatched : compatibleMatched;

  // Deterministic shuffle using localDate + course.id as seed
  const sorted = [...eligible].sort((a, b) => {
    const hashA = getDeterministicDateHash(`${localDate}_${course.id}_${a.id}`);
    const hashB = getDeterministicDateHash(`${localDate}_${course.id}_${b.id}`);
    return hashA - hashB;
  });

  // Curated edition is capped at three items in total. Poetry and dialogue are
  // included first; published stories fill any remaining slots only.
  const availableSlots = 3 - (poem ? 1 : 0) - (conversation ? 1 : 0);
  stories = sorted.slice(0, Math.max(0, availableSlots));

  return {
    stories,
    poem,
    conversation,
  };
};

/**
 * Resolves Vocabulary Summary metrics:
 * - Deduplicates words across both StorageService SRS items and content-centred saved words
 *   using an authoritative canonical identity (target language + NFC normalized lemma/term).
 * - Preserves diacritics and accents using Unicode NFC normalization ('está' !== 'esta').
 * - Preserves language separation ('pt:sol' !== 'es:sol').
 * - Aliases legacy SRS item IDs to canonical lemma keys when referenced by UserSavedWord.
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
  const targetLang = course.target_language;

  const dueCanonicalKeys = new Set<string>();
  const savedThisWeekCanonicalKeys = new Set<string>();

  // Map to alias legacy SRS IDs to canonical lemma keys when known
  // e.g. 'pt:srs_123' -> 'pt:café'
  const legacyIdToCanonicalMap = new Map<string, string>();

  // 1. Process content-centred saved words (strictly scoped to course.target_language)
  // Let errors propagate to caller so caller can present error state to the user instead of fake zeros!
  const savedWords: UserSavedWord[] = await contentCentredService.getUserSavedWords(
    userId,
    targetLang
  );

  for (const w of savedWords) {
    const wordLang = w.target_language || (w as any).language;
    if (wordLang && wordLang !== targetLang) continue;

    const canonicalKey = buildCanonicalVocabIdentity(
      targetLang,
      (w as any).canonical_id,
      w.lemma,
      w.term
    );
    if (!canonicalKey) continue;

    // If word references a legacy SRS ID, map that legacy ID to this canonical key
    if (w.legacy_srs_item_id) {
      const legacyKey = `${targetLang.toLowerCase()}:${normalizeCanonicalVocabKey(w.legacy_srs_item_id)}`;
      legacyIdToCanonicalMap.set(legacyKey, canonicalKey);
      legacyIdToCanonicalMap.set(w.legacy_srs_item_id, canonicalKey);
    }

    const nextDue = w.next_review || (w as any).next_review_date;
    if (nextDue && nextDue <= today) {
      dueCanonicalKeys.add(canonicalKey);
    }

    // Authoritative creation date: w.created_at
    if (w.created_at && isWithinLast7Days(w.created_at)) {
      savedThisWeekCanonicalKeys.add(canonicalKey);
    }
  }

  // 2. Process course SRS items (strictly scoped to course.target_language)
  const srsItems = StorageService.getSRSItems(targetLang, userId);
  for (const item of srsItems) {
    if (item.language && item.language !== targetLang) continue;
    if (!item.vocabulary_item_id) continue;

    const rawItemId = item.vocabulary_item_id;
    const scopedItemId = `${targetLang.toLowerCase()}:${normalizeCanonicalVocabKey(rawItemId)}`;
    const mappedCanonicalKey =
      legacyIdToCanonicalMap.get(scopedItemId) || legacyIdToCanonicalMap.get(rawItemId);

    // An unmatched legacy synthetic ID is not a confirmed canonical word.
    if (!mappedCanonicalKey && isLegacySyntheticVocabId(rawItemId)) continue;

    // Resolve alias if mapped from a UserSavedWord legacy_srs_item_id; otherwise build canonical key
    const canonicalKey = mappedCanonicalKey ||
      buildCanonicalVocabIdentity(targetLang, rawItemId, (item as any).lemma, (item as any).term);
    if (!canonicalKey) continue;

    if (item.next_review_date && item.next_review_date <= today) {
      dueCanonicalKeys.add(canonicalKey);
    }

    // Invariant: DO NOT use last_reviewed_at as creation date substitute.
    // Only count if an explicit created_at exists on the SRS item.
    const createdAt = (item as any).created_at;
    if (createdAt && isWithinLast7Days(createdAt)) {
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
 * Strictly respects the 7 local calendar days window.
 * Distinguishes genuine empty history from failed requests by propagating errors.
 */
export const resolveRecentActivities = async (
  course: Course,
  userId: string
): Promise<RecentLearningActivity[]> => {
  const activities: RecentLearningActivity[] = [];
  const seenIds = new Set<string>();

  // 1. Batch load published content items and progress (propagate errors on backend failure)
  const publishedItems = await contentCentredService.getContentItems({
    target_language: course.target_language,
    status: 'published',
  });
  const contentMap = new Map(publishedItems.map(it => [it.id, it]));

  const progressList = await contentCentredService.getAllLearnerProgress(userId);
  for (const prog of progressList) {
    const item = contentMap.get(prog.content_item_id);
    const dateStr = prog.last_studied_at || prog.updated_at || prog.created_at;
    // Strictly filter for activities within the 7 local calendar days window
    if (item && !seenIds.has(prog.content_item_id) && isWithinLast7Days(dateStr)) {
      seenIds.add(prog.content_item_id);
      activities.push({
        id: `prog_${prog.id}`,
        title: item.title,
        type: 'story',
        date: dateStr,
        status: prog.status === 'completed' ? 'completed' : 'in_progress',
      });
    }
  }

  // 2. Check unified activity events (poetry, conversation, practice, curriculum)
  const events = StorageService.getActivityEvents(course.target_language, userId);
  for (const ev of events) {
    if (seenIds.has(ev.id)) continue;
    if (!isWithinLast7Days(ev.timestamp)) continue;
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

  // Sort by date descending and return top 3
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return activities.slice(0, 3);
};
