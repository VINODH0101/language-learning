import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import { ReaderView } from '../features/learn/ReaderView';
import { DailyContentPreview } from '../features/dashboard/components/DailyContentPreview';
import {
  ContinueLearningCard,
  VocabularySummary,
  DailyLearningGoal,
} from '../features/dashboard/components';
import { I18nProvider } from '../i18n/i18nContext';
import { authService } from '../services/auth';
import { StorageService } from '../services/storage';
import { contentCentredService, SEED_CONTENT_ITEMS } from '../services/contentCentredService';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { dailyContentService } from '../services/dailyContentService';
import {
  getContinueContentItemId,
  getLocalTodayDateString,
  isLegacySyntheticVocabId,
  resolveContinueLearning,
  resolveTodaysEdition,
  resolveVocabularySummary,
} from '../features/dashboard/services/homeOrchestrator';
import { Course } from '../types';

const sampleCourse: Course = {
  id: 'course_phase8_corrections',
  user_id: 'user_phase8_corrections',
  target_language: 'pt',
  explanation_language: 'en',
  regional_variant: 'pt-BR',
  cefr_level: 'B1',
  is_active: true,
  streak_days: 2,
  daily_goal_minutes: 15,
  total_lessons_completed: 1,
  completed_curriculum_node_ids: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const progress = (overrides: Record<string, unknown>) => ({
  id: 'prog_1',
  user_id: sampleCourse.user_id,
  content_item_id: 'item_1',
  content_version_id: 'version_1',
  status: 'in_progress',
  percent_complete: 25,
  completed_activity_ids: [],
  time_spent_seconds: 30,
  first_opened_at: new Date().toISOString(),
  last_studied_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const publishedItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'item_1',
  title: 'Story One',
  target_language: 'pt',
  status: 'published',
  primary_cefr: 'B1',
  genre: 'short_story',
  summary: 'An editorial short story.',
  estimated_read_minutes: 4,
  version: {
    id: 'version_1',
    content_item_id: 'item_1',
    cefr_level: 'B1',
  },
  ...overrides,
});

const savedWord = (overrides: Record<string, unknown> = {}) => ({
  id: 'word_1',
  user_id: sampleCourse.user_id,
  target_language: 'pt',
  explanation_language: 'en',
  term: 'café',
  lemma: 'café',
  pos: 'noun',
  definition: 'coffee',
  ease_factor: 2.5,
  interval_days: 1,
  repetitions: 1,
  lapses: 0,
  next_review: getLocalTodayDateString(),
  state: 'learning',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
    writable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

const renderReader = (userId = 'user_active_time') => {
  const item = SEED_CONTENT_ITEMS[0];
  const authSpy = vi.spyOn(authService, 'getState').mockReturnValue({
    user: { id: userId, email: `${userId}@example.com` } as any,
    role: 'user',
    isGuest: false,
    isLoading: false,
  });
  const updateSpy = vi
    .spyOn(contentCentredService, 'updateLearnerProgress')
    .mockResolvedValue({} as any);

  const view = render(
    <I18nProvider>
      <ReaderView
        item={item}
        version={item.version}
        activities={item.activities}
        onBack={vi.fn()}
      />
    </I18nProvider>
  );

  return { ...view, authSpy, updateSpy, item, userId };
};

describe('Phase 8 Home page corrections', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setVisibility('visible');
  });

  it("caps Today's Edition at three total items while keeping poetry and dialogue first", async () => {
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      publishedItem({ id: 'story_a' }),
      publishedItem({ id: 'story_b' }),
      publishedItem({ id: 'story_c' }),
      publishedItem({ id: 'story_d' }),
    ] as any);

    const edition = await resolveTodaysEdition(sampleCourse);
    const totalItems =
      (edition.poem ? 1 : 0) + (edition.conversation ? 1 : 0) + edition.stories.length;

    expect(totalItems).toBeLessThanOrEqual(3);
    expect(edition.poem).toBeDefined();
    expect(edition.conversation).toBeDefined();
    expect(edition.stories.length).toBe(1);
  });

  it('returns a recovery state when the exact saved edition is unavailable instead of opening another version', async () => {
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      progress({
        content_item_id: 'item_1',
        content_version_id: 'missing_version_999',
      }),
    ] as any);
    vi.spyOn(contentCentredService, 'getContentItemById').mockResolvedValueOnce(
      publishedItem() as any
    );
    vi.spyOn(contentCentredService, 'getContentVersion').mockResolvedValueOnce(null);

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('recovery');
    if (result.type === 'recovery') {
      expect(result.item?.id).toBe('item_1');
      expect(result.requestedVersionId).toBe('missing_version_999');
      expect(result.reason).toBe('version_unavailable');
    }
    expect(result.type).not.toBe('story');
  });

  it('prioritizes the most recently accessed unfinished item over an older CEFR-exact item', async () => {
    const older = progress({
      id: 'prog_older',
      content_item_id: 'item_older',
      content_version_id: 'version_older',
      last_studied_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    const newer = progress({
      id: 'prog_newer',
      content_item_id: 'item_newer',
      content_version_id: 'version_newer',
      last_studied_at: new Date().toISOString(),
    });

    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      older,
      newer,
    ] as any);
    vi.spyOn(contentCentredService, 'getContentItemById').mockImplementation(async (id: string) =>
      publishedItem({
        id,
        primary_cefr: id === 'item_older' ? 'B1' : 'A2',
      }) as any
    );
    vi.spyOn(contentCentredService, 'getContentVersion').mockImplementation(async (id: string) =>
      ({
        id,
        content_item_id: id === 'version_older' ? 'item_older' : 'item_newer',
        cefr_level: id === 'version_older' ? 'B1' : 'A2',
      }) as any
    );

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('story');
    if (result.type === 'story') {
      expect(result.item.id).toBe('item_newer');
      expect(result.version.id).toBe('version_newer');
    }
  });

  it('excludes the Continue Learning item from Today\'s Edition for stories and recommendations', () => {
    expect(
      getContinueContentItemId({ type: 'story', item: { id: 'x' } as any } as any)
    ).toBe('x');
    expect(
      getContinueContentItemId({ type: 'recommended', item: { id: 'y' } as any } as any)
    ).toBe('y');
    expect(
      getContinueContentItemId({
        type: 'recovery',
        item: { id: 'z' } as any,
        requestedVersionId: 'v1',
        reason: 'version_unavailable',
      })
    ).toBe('z');
  });

  it('does not count an unmatched legacy synthetic SRS id as a canonical vocabulary word', async () => {
    const today = getLocalTodayDateString();
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'srs_unmapped_123',
        language: 'pt',
        repetition_count: 1,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        created_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapse_count: 0,
        mastery_status: 'learning',
      },
    ] as any);
    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([]);

    const summary = await resolveVocabularySummary(sampleCourse, sampleCourse.user_id);

    expect(isLegacySyntheticVocabId('srs_unmapped_123')).toBe(true);
    expect(summary.dueSRSCount).toBe(0);
    expect(summary.savedThisWeekCount).toBe(0);
  });

  it('attributes active reading seconds to the correct side of local midnight', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59, 50));
    vi.spyOn(contentCentredService, 'updateLearnerProgress').mockResolvedValue({} as any);
    const mockItem = SEED_CONTENT_ITEMS[0];
    const userId = 'user_midnight_test';
    const authSpy = vi.spyOn(authService, 'getState').mockReturnValue({
      user: { id: userId, email: 'midnight@example.com' } as any,
      role: 'user',
      isGuest: false,
      isLoading: false,
    });

    const { unmount } = render(
      <I18nProvider>
        <ReaderView
          item={mockItem}
          version={mockItem.version}
          activities={mockItem.activities}
          onBack={vi.fn()}
        />
      </I18nProvider>
    );

    act(() => {
      fireEvent.mouseMove(window);
    });

    // 20 ticks: 9 seconds before midnight, 11 seconds after midnight.
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate('2026-01-01', userId)).toBe(9);
    expect(StorageService.getStudySecondsForDate('2026-01-02', userId)).toBe(11);

    authSpy.mockRestore();
  });

  it('shows the recovery card without opening another edition', async () => {
    const recovery = {
      type: 'recovery' as const,
      item: publishedItem() as any,
      requestedVersionId: 'missing_version_999',
      reason: 'version_unavailable' as const,
    };

    const ContinueLearningCard = (
      await import('../features/dashboard/components/ContinueLearningCard')
    ).ContinueLearningCard;

    render(
      <I18nProvider>
        <ContinueLearningCard
          activeCourse={sampleCourse}
          continueItem={recovery}
          onContinue={vi.fn()}
          onExploreCatalog={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Exact Edition Unavailable/i)).toBeDefined();
    expect(screen.getByText(/missing_version_999/i)).toBeDefined();
    expect(screen.queryByText(/Continue Reading/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Genuine active-time tracking
  // --------------------------------------------------------------------------
  it('does not accrue study time on mount without learner interaction', () => {
    vi.useFakeTimers();
    const { unmount, userId } = renderReader('user_no_interaction');

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate(getLocalTodayDateString(), userId)).toBe(0);
  });

  it('accrues study time while the learner is actively interacting', () => {
    vi.useFakeTimers();
    const { unmount, userId } = renderReader('user_active_interaction');

    act(() => {
      fireEvent.mouseMove(window);
    });
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate(getLocalTodayDateString(), userId)).toBe(30);
  });

  it('pauses accumulation once the learner becomes idle', () => {
    vi.useFakeTimers();
    const { unmount, userId } = renderReader('user_idle');

    act(() => {
      fireEvent.mouseMove(window);
    });
    // 60 active seconds accrue, then the 60s inactivity threshold pauses tracking.
    act(() => {
      vi.advanceTimersByTime(120000);
    });
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate(getLocalTodayDateString(), userId)).toBe(60);
  });

  it('pauses on tab hide and requires fresh interaction after returning', () => {
    vi.useFakeTimers();
    const { unmount, userId } = renderReader('user_tab_visibility');
    const dateKey = getLocalTodayDateString();

    act(() => {
      fireEvent.mouseMove(window);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      setVisibility('hidden');
    });
    expect(StorageService.getStudySecondsForDate(dateKey, userId)).toBe(5);

    act(() => {
      setVisibility('visible');
    });
    // Visible again, but no fresh interaction: tracking stays paused.
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(StorageService.getStudySecondsForDate(dateKey, userId)).toBe(5);

    act(() => {
      fireEvent.keyDown(window, { key: 'a' });
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate(dateKey, userId)).toBe(10);
  });

  it('restores previously persisted study time across a remount', () => {
    const userId = 'user_restore';
    const dateKey = getLocalTodayDateString();
    StorageService.addTodayActiveSeconds(135, userId);

    expect(StorageService.getStudySecondsForDate(dateKey, userId)).toBe(135);
    expect(StorageService.getTodayStudyMinutes(userId)).toBe(2);

    const { unmount } = renderReader(userId);
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate(dateKey, userId)).toBe(135);
  });

  it('keeps local active time when remote synchronization fails (offline)', () => {
    vi.useFakeTimers();
    const userId = 'user_offline';
    const item = SEED_CONTENT_ITEMS[0];
    const authSpy = vi.spyOn(authService, 'getState').mockReturnValue({
      user: { id: userId, email: 'offline@example.com' } as any,
      role: 'user',
      isGuest: false,
      isLoading: false,
    });
    const updateSpy = vi
      .spyOn(contentCentredService, 'updateLearnerProgress')
      .mockRejectedValue(new Error('offline'));

    const { unmount } = render(
      <I18nProvider>
        <ReaderView
          item={item}
          version={item.version}
          activities={item.activities}
          onBack={vi.fn()}
        />
      </I18nProvider>
    );

    act(() => {
      fireEvent.mouseMove(window);
    });
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate(getLocalTodayDateString(), userId)).toBe(20);
    expect(updateSpy).toHaveBeenCalled();
    authSpy.mockRestore();
  });

  it('never double counts active seconds across periodic flushes and unmount', () => {
    vi.useFakeTimers();
    const { unmount, updateSpy, userId } = renderReader('user_no_double_count');

    act(() => {
      fireEvent.mouseMove(window);
    });
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    act(() => {
      unmount();
    });

    expect(StorageService.getStudySecondsForDate(getLocalTodayDateString(), userId)).toBe(20);

    const synchronizedSeconds = updateSpy.mock.calls
      .map(call => Number(call[0]?.time_spent_seconds || 0))
      .filter(seconds => seconds > 0)
      .reduce((total, seconds) => total + seconds, 0);

    expect(synchronizedSeconds).toBe(20);
  });

  // --------------------------------------------------------------------------
  // Continue Learning priority ladder
  // --------------------------------------------------------------------------
  it('falls back to the structured daily curriculum when no unfinished content exists', async () => {
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([]);

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('curriculum');
  });

  it('recommends a CEFR-matched published item and never a completed one', async () => {
    const completed = progress({
      id: 'prog_done',
      content_item_id: 'done_item',
      content_version_id: 'done_version',
      status: 'completed',
    });

    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      completed,
    ] as any);
    vi.spyOn(ClientLessonGenerator, 'generateOrGetLesson').mockReturnValueOnce(null as any);
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      publishedItem({ id: 'done_item' }),
      publishedItem({ id: 'good_item' }),
      publishedItem({ id: 'distant_item', primary_cefr: 'A1' }),
    ] as any);
    vi.spyOn(contentCentredService, 'getContentItemById').mockResolvedValueOnce(
      publishedItem({ id: 'good_item' }) as any
    );

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('recommended');
    if (result.type === 'recommended') {
      expect(result.item.id).toBe('good_item');
    }
  });

  it('returns an honest empty state when no suitable published content exists', async () => {
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([]);
    vi.spyOn(ClientLessonGenerator, 'generateOrGetLesson').mockReturnValueOnce(null as any);
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      publishedItem({ id: 'distant_item', primary_cefr: 'A1' }),
    ] as any);

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('empty');
  });

  it('skips unpublished in-progress items instead of surfacing them', async () => {
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      progress({ content_item_id: 'draft_item' }),
    ] as any);
    vi.spyOn(contentCentredService, 'getContentItemById').mockResolvedValueOnce(
      publishedItem({ id: 'draft_item', status: 'draft' }) as any
    );
    vi.spyOn(ClientLessonGenerator, 'generateOrGetLesson').mockReturnValueOnce(null as any);
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([]);

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('empty');
  });

  it('reports a version mismatch recovery when the recorded edition belongs to another item', async () => {
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      progress({ content_item_id: 'item_1', content_version_id: 'other_version' }),
    ] as any);
    vi.spyOn(contentCentredService, 'getContentItemById').mockResolvedValueOnce(
      publishedItem() as any
    );
    vi.spyOn(contentCentredService, 'getContentVersion').mockResolvedValueOnce({
      id: 'other_version',
      content_item_id: 'different_item',
      cefr_level: 'B1',
    } as any);

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('recovery');
    if (result.type === 'recovery') {
      expect(result.reason).toBe('version_mismatch');
    }
  });

  it('restores the exact saved content version for unfinished content', async () => {
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      progress({ content_item_id: 'item_1', content_version_id: 'version_1' }),
    ] as any);
    vi.spyOn(contentCentredService, 'getContentItemById').mockResolvedValueOnce(
      publishedItem() as any
    );
    vi.spyOn(contentCentredService, 'getContentVersion').mockResolvedValueOnce({
      id: 'version_1',
      content_item_id: 'item_1',
      cefr_level: 'B1',
    } as any);

    const result = await resolveContinueLearning(sampleCourse, sampleCourse.user_id);

    expect(result.type).toBe('story');
    if (result.type === 'story') {
      expect(result.item.id).toBe('item_1');
      expect(result.version.id).toBe('version_1');
      expect(result.progress.content_version_id).toBe('version_1');
    }
  });

  // --------------------------------------------------------------------------
  // Today's Edition selection
  // --------------------------------------------------------------------------
  it('excludes the Continue Learning item and shows fewer items when content is scarce', async () => {
    vi.spyOn(dailyContentService, 'getDailyPoem').mockReturnValueOnce(null);
    vi.spyOn(dailyContentService, 'getDailyConversation').mockReturnValueOnce(null);
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      publishedItem({ id: 'keep_item' }),
      publishedItem({ id: 'continue_item' }),
    ] as any);

    const edition = await resolveTodaysEdition(sampleCourse, 'continue_item');
    const totalItems =
      (edition.poem ? 1 : 0) + (edition.conversation ? 1 : 0) + edition.stories.length;

    expect(edition.stories.map(story => story.id)).toEqual(['keep_item']);
    expect(totalItems).toBeLessThanOrEqual(3);
  });

  it('keeps Today\'s Edition selection stable for the same local day', async () => {
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValue([
      publishedItem({ id: 'story_a' }),
      publishedItem({ id: 'story_b' }),
      publishedItem({ id: 'story_c' }),
      publishedItem({ id: 'story_d' }),
    ] as any);

    const first = await resolveTodaysEdition(sampleCourse);
    const second = await resolveTodaysEdition(sampleCourse);

    expect(second.stories.map(story => story.id)).toEqual(first.stories.map(story => story.id));
  });

  it("renders at most three items in Today's Edition even if more are supplied", () => {
    const stories = [1, 2, 3, 4, 5].map(index =>
      publishedItem({ id: `story_${index}`, title: `Story ${index}` })
    );

    render(
      <I18nProvider>
        <DailyContentPreview
          dailyPoem={null}
          dailyConversation={null}
          publishedStories={stories as any}
          onOpenPoem={vi.fn()}
          onOpenConversation={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  // --------------------------------------------------------------------------
  // Home section error & retry states
  // --------------------------------------------------------------------------
  it('shows a retryable error for Continue Learning', () => {
    const onRetry = vi.fn();

    render(
      <I18nProvider>
        <ContinueLearningCard activeCourse={sampleCourse} isError onRetry={onRetry} />
      </I18nProvider>
    );

    expect(screen.getByText(/Unable to load active lesson/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows a retryable error for Today's Edition", () => {
    const onRetry = vi.fn();

    render(
      <I18nProvider>
        <DailyContentPreview
          dailyPoem={null}
          dailyConversation={null}
          publishedStories={[]}
          onOpenPoem={vi.fn()}
          onOpenConversation={vi.fn()}
          isError
          onRetry={onRetry}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Unable to load Today's Edition/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows a retryable error for the vocabulary summary', () => {
    const onRetry = vi.fn();

    render(
      <I18nProvider>
        <VocabularySummary
          dueSRSCount={0}
          savedThisWeekCount={0}
          onReviewDue={vi.fn()}
          onOpenVocabulary={vi.fn()}
          isError
          onRetry={onRetry}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Unable to load vocabulary metrics/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows a retryable error for the daily learning goal', () => {
    const onRetry = vi.fn();

    render(
      <I18nProvider>
        <DailyLearningGoal
          dailyGoalMinutes={10}
          elapsedMinutes={0}
          isError
          onRetry={onRetry}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Unable to calculate goal progress/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton loading states for each Home section', () => {
    render(
      <I18nProvider>
        <ContinueLearningCard activeCourse={sampleCourse} isLoading />
        <DailyContentPreview
          dailyPoem={null}
          dailyConversation={null}
          publishedStories={[]}
          onOpenPoem={vi.fn()}
          onOpenConversation={vi.fn()}
          isLoading
        />
        <VocabularySummary
          dueSRSCount={0}
          savedThisWeekCount={0}
          onReviewDue={vi.fn()}
          onOpenVocabulary={vi.fn()}
          isLoading
        />
        <DailyLearningGoal dailyGoalMinutes={10} elapsedMinutes={0} isLoading />
      </I18nProvider>
    );

    expect(screen.getByLabelText('Continue Learning')).toBeDefined();
    expect(screen.getByLabelText("Today's Edition")).toBeDefined();
    expect(screen.getByLabelText('Vocabulary & Spaced Repetition')).toBeDefined();
    expect(screen.getByLabelText('Daily Learning Goal')).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // Vocabulary summary identity & scoping
  // --------------------------------------------------------------------------
  it('deduplicates canonical vocabulary while preserving accents', async () => {
    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([
      savedWord({ id: 'w1', lemma: 'está', term: 'está' }),
      savedWord({ id: 'w2', lemma: 'está ', term: 'está ' }),
      savedWord({ id: 'w3', lemma: 'esta', term: 'esta' }),
    ] as any);
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'está',
        language: 'pt',
        next_review_date: getLocalTodayDateString(),
        created_at: new Date().toISOString(),
      },
    ] as any);

    const summary = await resolveVocabularySummary(sampleCourse, sampleCourse.user_id);

    expect(summary.dueSRSCount).toBe(2);
    expect(summary.savedThisWeekCount).toBe(2);
  });

  it('scopes vocabulary identity to the active target language', async () => {
    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([
      savedWord({ id: 'es_word', target_language: 'es', lemma: 'casa', term: 'casa' }),
    ] as any);
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'casa',
        language: 'es',
        next_review_date: getLocalTodayDateString(),
        created_at: new Date().toISOString(),
      },
    ] as any);

    const summary = await resolveVocabularySummary(sampleCourse, sampleCourse.user_id);

    expect(summary.dueSRSCount).toBe(0);
    expect(summary.savedThisWeekCount).toBe(0);
  });

  it('keeps due vocabulary separate from recently saved vocabulary', async () => {
    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([
      savedWord({
        id: 'old_due',
        lemma: 'antigo',
        term: 'antigo',
        next_review: getLocalTodayDateString(),
        created_at: daysAgo(10),
      }),
    ] as any);
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([]);

    const summary = await resolveVocabularySummary(sampleCourse, sampleCourse.user_id);

    expect(summary.dueSRSCount).toBe(1);
    expect(summary.savedThisWeekCount).toBe(0);
  });

  it('counts a legacy SRS id once it is aliased to a canonical saved word', async () => {
    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([
      savedWord({
        id: 'legacy_word',
        lemma: 'café',
        term: 'café',
        legacy_srs_item_id: 'srs_123',
      }),
    ] as any);
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'srs_123',
        language: 'pt',
        next_review_date: getLocalTodayDateString(),
        created_at: new Date().toISOString(),
      },
    ] as any);

    const summary = await resolveVocabularySummary(sampleCourse, sampleCourse.user_id);

    expect(summary.dueSRSCount).toBe(1);
    expect(summary.savedThisWeekCount).toBe(1);
  });
});
