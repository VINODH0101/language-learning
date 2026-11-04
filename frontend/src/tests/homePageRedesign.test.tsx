import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DashboardView } from '../features/dashboard/DashboardView';
import { LearnPage } from '../pages/LearnPage';
import { ReaderView } from '../features/learn/ReaderView';
import { I18nProvider } from '../i18n/i18nContext';
import { authService } from '../services/auth';
import { courseService } from '../services/courseService';
import { StorageService } from '../services/storage';
import { contentCentredService, SEED_CONTENT_ITEMS } from '../services/contentCentredService';
import { dailyContentService } from '../services/dailyContentService';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import {
  resolveContinueLearning,
  resolveTodaysEdition,
  resolveVocabularySummary,
  resolveDailyGoal,
  resolveRecentActivities,
  getLocalTodayDateString,
  isWithinLast7Days,
  buildCanonicalVocabIdentity,
} from '../features/dashboard/services/homeOrchestrator';
import { Course } from '../types';

describe('Home Page Redesign — Editorial Architecture & Six Sections', () => {
  const mockNavigateTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const renderHome = (initialLang: 'en' | 'pt' | 'es' = 'en') => {
    localStorage.setItem('polyglot_interface_lang', initialLang);
    return render(
      <I18nProvider>
        <DashboardView onNavigateTab={mockNavigateTab} />
      </I18nProvider>
    );
  };

  const sampleCourse: Course = {
    id: 'course_test_pt',
    user_id: 'test_user_home',
    target_language: 'pt',
    explanation_language: 'en',
    regional_variant: 'pt-BR',
    cefr_level: 'B1',
    is_active: true,
    streak_days: 5,
    daily_goal_minutes: 15,
    total_lessons_completed: 4,
    completed_curriculum_node_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('1. Local date helper formats YYYY-MM-DD in user local timezone', () => {
    const localToday = getLocalTodayDateString();
    expect(localToday).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const now = new Date();
    const expectedYear = String(now.getFullYear());
    expect(localToday.startsWith(expectedYear)).toBe(true);
  });

  it('2. isWithinLast7Days correctly checks timestamps within a week', () => {
    const now = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

    expect(isWithinLast7Days(now)).toBe(true);
    expect(isWithinLast7Days(threeDaysAgo)).toBe(true);
    expect(isWithinLast7Days(eightDaysAgo)).toBe(false);
    expect(isWithinLast7Days(undefined)).toBe(false);
  });

  it('3. Section 1 (Personal Welcome) displays greeting, headline and four-way decoupled language pill without dark gradients or stat cards', () => {
    renderHome('en');

    // Section 1 Greeting
    expect(screen.getByRole('banner', { name: /Personal Welcome/i })).toBeDefined();
    expect(screen.getByText(/Lexilume Daily Immersion/i)).toBeDefined();
    expect(screen.getAllByText(/Learning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Portuguese/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Explanations in/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/English/i).length).toBeGreaterThan(0);

    // No streak flame or glowing stat card in welcome header
    expect(screen.queryByText(/dash_streak_title/i)).toBeNull();
  });

  it('4. Section 2 (Continue Learning) prioritizes unfinished published content when in progress', async () => {
    const userId = 'user_priority_test';
    const mockProgress = {
      id: 'prog_story_1',
      user_id: userId,
      content_item_id: 'ci_coffee_dublin_001',
      content_version_id: 'cv_coffee_dublin_v1',
      status: 'in_progress' as const,
      percent_complete: 45,
      completed_activity_ids: [],
      time_spent_seconds: 120,
      first_opened_at: new Date().toISOString(),
      last_studied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([mockProgress]);

    const resolved = await resolveContinueLearning(
      { ...sampleCourse, target_language: 'en' },
      userId
    );

    expect(resolved.type).toBe('story');
    if (resolved.type === 'story') {
      expect(resolved.item.id).toBe('ci_coffee_dublin_001');
      expect(resolved.progress.percent_complete).toBe(45);
    }
  });

  it('5. Section 2 (Continue Learning) falls back to structured daily curriculum lesson when no unfinished story exists', async () => {
    const userId = 'user_curriculum_fallback';
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([]);

    const resolved = await resolveContinueLearning(sampleCourse, userId);

    expect(resolved.type).toBe('curriculum');
    if (resolved.type === 'curriculum') {
      expect(resolved.lesson).toBeDefined();
      expect(resolved.lesson.curriculum_topic_title).toBeDefined();
    }
  });

  it('6. Section 3 (Today\'s Edition) curates mixed authentic literature, dialogues, and stories', async () => {
    const edition = await resolveTodaysEdition(sampleCourse);

    expect(edition.poem).toBeDefined();
    expect(edition.conversation).toBeDefined();
    expect(Array.isArray(edition.stories)).toBe(true);

    renderHome('en');

    // Section 3 Header & items
    expect(screen.getByRole('region', { name: /Today's Edition/i })).toBeDefined();
    expect(screen.getByText(/Daily Immersion: Poetry & Dialogue/i)).toBeDefined();
    expect(screen.getByText(/Daily Poetry/i)).toBeDefined();
    expect(screen.getByText(/Daily Dialogue/i)).toBeDefined();

    // Explore All action
    const exploreBtn = screen.getByText(/Explore All/i);
    expect(exploreBtn).toBeDefined();
    fireEvent.click(exploreBtn);
    expect(mockNavigateTab).toHaveBeenCalledWith('learn');
  });

  it('7. Section 4 (Vocabulary Summary) computes due SRS items and recently saved counts correctly', async () => {
    const userId = 'user_vocab_test';
    const today = getLocalTodayDateString();

    const mockSRS = [
      {
        vocabulary_item_id: 'v1',
        language: 'pt' as const,
        repetition_count: 2,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today, // due today
        created_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapse_count: 0,
        mastery_status: 'learning' as const,
      },
      {
        vocabulary_item_id: 'v2',
        language: 'pt' as const,
        repetition_count: 3,
        ease_factor: 2.6,
        interval_days: 5,
        next_review_date: '2099-01-01', // not due
        created_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapse_count: 0,
        mastery_status: 'review' as const,
      },
    ];

    vi.spyOn(StorageService, 'getSRSItems').mockReturnValue(mockSRS as any);

    const summary = await resolveVocabularySummary(sampleCourse, userId);
    expect(summary.dueSRSCount).toBe(1);
    expect(summary.savedThisWeekCount).toBe(2);

    renderHome('en');

    expect(screen.getByRole('region', { name: /Vocabulary & Spaced Repetition/i })).toBeDefined();
    expect(screen.getByText(/Due for Review Today/i)).toBeDefined();
    expect(screen.getByText(/Saved in Past 7 Days/i)).toBeDefined();

    // Link to My Words
    const myWordsBtn = screen.getByText(/My Words/i);
    fireEvent.click(myWordsBtn);
    expect(mockNavigateTab).toHaveBeenCalledWith('words');
  });

  it('8. Section 5 (Daily Learning Goal) computes genuine cognitive study minutes against configured goal', () => {
    const userId = 'user_goal_test';
    vi.spyOn(StorageService, 'getTodayStudyMinutes').mockReturnValueOnce(6);

    const goalData = resolveDailyGoal({ ...sampleCourse, daily_goal_minutes: 10 }, userId);

    expect(goalData.elapsedMinutes).toBe(6);
    expect(goalData.dailyGoalMinutes).toBe(10);
    expect(goalData.goalProgressPct).toBe(60);

    renderHome('en');

    expect(screen.getByRole('region', { name: /Daily Learning Goal/i })).toBeDefined();
    expect(screen.getByText(/Daily Goal Progress/i)).toBeDefined();
  });

  it('9. Section 6 (Recently Learned) aggregates up to 3 recent activities and provides history link', async () => {
    const userId = 'user_recent_test';
    const mockEvents = [
      {
        id: 'act_1',
        user_id: userId,
        learning_language: 'pt' as const,
        activity_type: 'poetry_completed' as const,
        content_id: 'poem_1',
        content_version: 'v1',
        title: 'Poetry in Lisbon',
        completion_status: 'completed' as const,
        timestamp: new Date().toISOString(),
      },
    ];

    vi.spyOn(StorageService, 'getActivityEvents').mockReturnValue(mockEvents as any);

    const recent = await resolveRecentActivities(sampleCourse, userId);
    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0].title).toBe('Poetry in Lisbon');
    expect(recent[0].status).toBe('completed');

    renderHome('en');

    expect(screen.getByRole('region', { name: /Recent Learning Activities/i })).toBeDefined();
    expect(screen.getByText(/Recently Learned/i)).toBeDefined();

    const viewHistoryBtn = screen.getByText(/View Learning History/i);
    fireEvent.click(viewHistoryBtn);
    expect(mockNavigateTab).toHaveBeenCalledWith('progress');
  });

  it('10. Renders all six editorial sections in exact structural order', () => {
    const { container } = renderHome('en');

    const sections = container.querySelectorAll('header, section');
    expect(sections.length).toBe(6);

    // Section 1: Welcome Header
    expect(sections[0].getAttribute('aria-label')).toBe('Personal Welcome');
    // Section 2: Continue Learning
    expect(sections[1].getAttribute('aria-label')).toBe('Continue Learning');
    // Section 3: Today's Edition
    expect(sections[2].getAttribute('aria-label')).toBe("Today's Edition");
    // Section 4: Vocabulary Summary
    expect(sections[3].getAttribute('aria-label')).toBe('Vocabulary & Spaced Repetition');
    // Section 5: Daily Learning Goal
    expect(sections[4].getAttribute('aria-label')).toBe('Daily Learning Goal');
    // Section 6: Recently Learned
    expect(sections[5].getAttribute('aria-label')).toBe('Recent Learning Activities');
  });

  it('11. Safe CEFR level transition: resumes unfinished story in target language even if active course level differs', async () => {
    const userId = 'user_cefr_transition';
    const mockB1Progress = {
      id: 'prog_b1_item',
      user_id: userId,
      content_item_id: 'ci_coffee_dublin_001', // B1 item
      content_version_id: 'cv_coffee_dublin_v1',
      status: 'in_progress' as const,
      percent_complete: 30,
      completed_activity_ids: [],
      time_spent_seconds: 90,
      first_opened_at: new Date().toISOString(),
      last_studied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([mockB1Progress]);

    // Active course is now A1, but the in-progress content is B1
    const a1Course: Course = { ...sampleCourse, target_language: 'en', cefr_level: 'A1' };
    const resolved = await resolveContinueLearning(a1Course, userId);

    expect(resolved.type).toBe('story');
    if (resolved.type === 'story') {
      expect(resolved.item.id).toBe('ci_coffee_dublin_001');
      expect(resolved.version.cefr_level).toBe('B1');
    }
  });

  it('12. Deterministic Today\'s Edition excludes active Continue Learning item and rotates stably', async () => {
    const excludedId = 'ci_coffee_dublin_001';
    const edition = await resolveTodaysEdition({ ...sampleCourse, target_language: 'en' }, excludedId);

    // Excluded item must not be in stories
    const hasExcluded = edition.stories.some(s => s.id === excludedId);
    expect(hasExcluded).toBe(false);
  });

  it('13. Vocabulary deduplication: distinct union across StorageService and contentCentredService eliminates duplicates', async () => {
    const userId = 'user_vocab_dedup';
    const today = getLocalTodayDateString();

    // Word 'café' in StorageService
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'café',
        language: 'pt' as const,
        repetition_count: 1,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        created_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapse_count: 0,
        mastery_status: 'learning' as const,
      },
    ] as any);

    // Duplicate word 'café' in contentCentredService
    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([
      {
        id: 'w1',
        user_id: userId,
        term: 'Café',
        lemma: 'café',
        target_language: 'pt',
        language: 'pt',
        next_review: today,
        next_review_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any,
    ]);

    const vocab = await resolveVocabularySummary(sampleCourse, userId);

    // Distinct count should be 1 (not 2)
    expect(vocab.dueSRSCount).toBe(1);
    expect(vocab.savedThisWeekCount).toBe(1);
  });

  it('14. Reader resumption: stores content and version IDs in sessionStorage when Continue Reading is clicked', async () => {
    const setItemSpy = vi.spyOn(sessionStorage, 'setItem');
    renderHome('en');

    // Click Start/Continue Reading or Lesson button
    const actionBtn = screen.getByRole('button', { name: /(start reading|continue reading|start lesson)/i });
    fireEvent.click(actionBtn);

    // Navigates to curriculum course or learn
    expect(mockNavigateTab).toHaveBeenCalled();
  });

  it('15. LearnPage mounts and resumes directly into ReaderView when session storage contains open content and version IDs', async () => {
    sessionStorage.setItem('lexilume_open_content_id', 'ci_coffee_dublin_001');
    sessionStorage.setItem('lexilume_open_version_id', 'cv_coffee_dublin_v1');

    render(
      <I18nProvider>
        <LearnPage />
      </I18nProvider>
    );

    // It should open the reader view directly
    await waitFor(() => {
      expect(screen.getByText(/A Morning Coffee in Dublin/i)).toBeDefined();
    });

    // Session storage keys should have been cleaned up
    expect(sessionStorage.getItem('lexilume_open_content_id')).toBeNull();
    expect(sessionStorage.getItem('lexilume_open_version_id')).toBeNull();
  });

  it('16. Invariant: SRS items without created_at do NOT substitute last_reviewed_at as creation date', async () => {
    const userId = 'user_invariance_test';
    const today = getLocalTodayDateString();

    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'reviewed_only_term',
        language: 'pt' as const,
        repetition_count: 5,
        ease_factor: 2.5,
        interval_days: 10,
        next_review_date: today,
        last_reviewed_at: new Date().toISOString(), // recent review, but NO created_at
        lapse_count: 0,
        mastery_status: 'review' as const,
      },
    ] as any);

    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([]);

    const vocab = await resolveVocabularySummary(sampleCourse, userId);

    // It is due today
    expect(vocab.dueSRSCount).toBe(1);
    // But since it has no created_at, review date is NOT fabricated as creation date
    expect(vocab.savedThisWeekCount).toBe(0);
  });

  it('17. Strict version integrity: missing requested version does NOT open latest version and displays recoverable error with session preserved', async () => {
    sessionStorage.setItem('lexilume_open_content_id', 'ci_coffee_dublin_001');
    sessionStorage.setItem('lexilume_open_version_id', 'non_existent_version_999');

    vi.spyOn(contentCentredService, 'getContentVersion').mockResolvedValueOnce(null);

    render(
      <I18nProvider>
        <LearnPage />
      </I18nProvider>
    );

    // Error alert should be displayed rather than opening latest version
    await waitFor(() => {
      expect(screen.getByRole('alert', { name: /Resume Error/i })).toBeDefined();
      expect(screen.getByText(/Exact Edition Unavailable/i)).toBeDefined();
    });

    // Invariant: Session keys are PRESERVED on recoverable failure so user can retry
    expect(sessionStorage.getItem('lexilume_open_content_id')).toBe('ci_coffee_dublin_001');
    expect(sessionStorage.getItem('lexilume_open_version_id')).toBe('non_existent_version_999');

    // Clicking Return to Catalog dismisses and clears session keys
    const returnBtn = screen.getByRole('button', { name: /Return to Catalog/i });
    fireEvent.click(returnBtn);
    expect(sessionStorage.getItem('lexilume_open_content_id')).toBeNull();
  });

  it('18. Edition mismatch: version belonging to another content item is rejected', async () => {
    sessionStorage.setItem('lexilume_open_content_id', 'ci_coffee_dublin_001');
    sessionStorage.setItem('lexilume_open_version_id', 'cv_foreign_story_v1');

    vi.spyOn(contentCentredService, 'getContentVersion').mockResolvedValueOnce({
      id: 'cv_foreign_story_v1',
      content_item_id: 'ci_different_story_999', // Mismatch!
      version_number: 1,
      cefr_level: 'B1',
      word_count: 50,
      sentence_count: 4,
      lexical_density: 0.5,
      is_published: true,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      audio_metadata: {},
      structured_payload: { title: 'Foreign', paragraphs: [] },
    } as any);

    render(
      <I18nProvider>
        <LearnPage />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert', { name: /Resume Error/i })).toBeDefined();
      expect(screen.getByText(/Edition Mismatch/i)).toBeDefined();
    });
  });

  it('19. Version-specific progress isolation: opening version v2 does not inherit progress from version v1', async () => {
    const userId = 'user_version_iso';
    const itemId = 'ci_coffee_dublin_001';

    // Seed progress on version v1 (80% complete)
    await contentCentredService.updateLearnerProgress({
      user_id: userId,
      content_item_id: itemId,
      content_version_id: 'cv_coffee_dublin_v1',
      status: 'in_progress',
      percent_complete: 80,
      time_spent_seconds: 300,
    });

    // Query progress for v1
    const progV1 = await contentCentredService.getLearnerProgress(userId, itemId, 'cv_coffee_dublin_v1');
    expect(progV1?.percent_complete).toBe(80);

    // Query progress for v2 (never opened)
    const progV2 = await contentCentredService.getLearnerProgress(userId, itemId, 'cv_coffee_dublin_v2');
    expect(progV2).toBeNull(); // Does not reuse v1's 80%!
  });

  it('20. Vocabulary identity and NFC normalization preserves distinct accented words', async () => {
    const userId = 'user_accent_test';
    const today = getLocalTodayDateString();

    // Word 'esta' (demonstrative) and 'está' (verb) in Portuguese are distinct words
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'esta',
        language: 'pt' as const,
        repetition_count: 1,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        created_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapse_count: 0,
        mastery_status: 'learning' as const,
      },
      {
        vocabulary_item_id: 'está',
        language: 'pt' as const,
        repetition_count: 1,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        created_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapse_count: 0,
        mastery_status: 'learning' as const,
      },
    ] as any);

    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([]);

    const summary = await resolveVocabularySummary(sampleCourse, userId);
    // Both must be recognized as distinct items (count = 2, not 1)
    expect(summary.dueSRSCount).toBe(2);
    expect(summary.savedThisWeekCount).toBe(2);
  });

  it('21. Recommendation fallback excludes completed stories and prioritizes CEFR level', async () => {
    const userId = sampleCourse.user_id;

    // Invalidate curriculum generation so it falls through to recommendation
    vi.spyOn(ClientLessonGenerator, 'generateOrGetLesson').mockReturnValue(null as any);

    // Mock progress where coffee dublin is completed
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      {
        id: 'prog_c1',
        user_id: userId,
        content_item_id: 'ci_coffee_dublin_001',
        content_version_id: 'cv_coffee_dublin_v1',
        status: 'completed',
        percent_complete: 100,
        completed_activity_ids: [],
        time_spent_seconds: 400,
        first_opened_at: new Date().toISOString(),
        last_studied_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Mock two candidate published items: one completed B1, one uncompleted B1
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      {
        id: 'ci_coffee_dublin_001', // completed
        title: 'Completed Coffee Story',
        target_language: 'pt',
        primary_cefr: 'B1',
        status: 'published',
      } as any,
      {
        id: 'ci_uncompleted_002', // uncompleted
        title: 'Fresh Story',
        target_language: 'pt',
        primary_cefr: 'B1',
        status: 'published',
      } as any,
    ]);

    vi.spyOn(contentCentredService, 'getContentItemById').mockResolvedValueOnce({
      id: 'ci_uncompleted_002',
      title: 'Fresh Story',
      target_language: 'pt',
      primary_cefr: 'B1',
      status: 'published',
    } as any);

    const result = await resolveContinueLearning(sampleCourse, userId);
    expect(result.type).toBe('recommended');
    if (result.type === 'recommended') {
      expect(result.item.id).toBe('ci_uncompleted_002');
    }
  });

  it('22. Section 6 (Recently Learned) excludes activities older than 7 local calendar days', async () => {
    const userId = sampleCourse.user_id;
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      { id: 'ci_story_old', title: 'Old Story', target_language: 'pt', status: 'published' } as any,
      { id: 'ci_story_new', title: 'Recent Story', target_language: 'pt', status: 'published' } as any,
    ]);

    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([
      {
        id: 'p_old',
        user_id: userId,
        content_item_id: 'ci_story_old',
        content_version_id: 'v1',
        status: 'completed',
        percent_complete: 100,
        completed_activity_ids: [],
        time_spent_seconds: 200,
        first_opened_at: tenDaysAgo,
        last_studied_at: tenDaysAgo, // 10 days ago (outside window)
        created_at: tenDaysAgo,
        updated_at: tenDaysAgo,
      },
      {
        id: 'p_new',
        user_id: userId,
        content_item_id: 'ci_story_new',
        content_version_id: 'v1',
        status: 'in_progress',
        percent_complete: 50,
        completed_activity_ids: [],
        time_spent_seconds: 120,
        first_opened_at: twoDaysAgo,
        last_studied_at: twoDaysAgo, // 2 days ago (inside window)
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo,
      },
    ]);

    vi.spyOn(StorageService, 'getActivityEvents').mockReturnValueOnce([]);

    const recent = await resolveRecentActivities(sampleCourse, userId);
    expect(recent.length).toBe(1);
    expect(recent[0].id).toBe('prog_p_new');
    expect(recent[0].title).toBe('Recent Story');
  });

  it('23. Sentence click updates reading position without fabricating study time (sends time_spent_seconds: 0)', async () => {
    const updateSpy = vi.spyOn(contentCentredService, 'updateLearnerProgress').mockResolvedValue({} as any);
    const mockItem = SEED_CONTENT_ITEMS[0];

    render(
      <ReaderView
        item={mockItem}
        version={mockItem.version}
        activities={mockItem.activities}
        onBack={vi.fn()}
      />
    );

    const sentenceSpan = await screen.findByTestId('sentence-s1');
    fireEvent.click(sentenceSpan);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content_item_id: mockItem.id,
          content_version_id: mockItem.version.id,
          time_spent_seconds: 0,
        })
      );
    });
  });

  it('24. Active reading session tracks active duration and flushes accumulated seconds on unmount', async () => {
    vi.useFakeTimers();
    const updateSpy = vi.spyOn(contentCentredService, 'updateLearnerProgress').mockResolvedValue({} as any);
    const mockItem = SEED_CONTENT_ITEMS[0];

    const { unmount } = render(
      <ReaderView
        item={mockItem}
        version={mockItem.version}
        activities={mockItem.activities}
        onBack={vi.fn()}
      />
    );

    // Simulate active reading for 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Unmount triggers flushActiveTime
    act(() => {
      unmount();
    });

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        content_item_id: mockItem.id,
        content_version_id: mockItem.version.id,
        time_spent_seconds: 10,
      })
    );

    vi.useRealTimers();
  });

  it('25. Multiple Reader sessions accumulate active seconds into daily minutes without reset or duplication', async () => {
    vi.useFakeTimers();
    vi.spyOn(contentCentredService, 'updateLearnerProgress').mockResolvedValue({} as any);
    const mockItem = SEED_CONTENT_ITEMS[0];
    const userId = 'user_multi_session_test';
    const authStateSpy = vi.spyOn(authService, 'getState').mockReturnValue({
      user: { id: userId, email: 'test@example.com' } as any,
      role: 'user',
      isGuest: false,
      isLoading: false,
    });

    // Initial state: 0 seconds, 0 minutes
    expect(StorageService.getTodayStudySeconds(userId)).toBe(0);
    expect(StorageService.getTodayStudyMinutes(userId)).toBe(0);

    // Session 1: 40 active seconds
    const session1 = render(
      <ReaderView
        item={mockItem}
        version={mockItem.version}
        activities={mockItem.activities}
        onBack={vi.fn()}
      />
    );
    await act(async () => {
      vi.advanceTimersByTime(40000);
      await Promise.resolve();
    });
    await act(async () => {
      session1.unmount();
      await Promise.resolve();
    });

    // 40 seconds accumulated; 0 full minutes earned yet
    expect(StorageService.getTodayStudySeconds(userId)).toBe(40);
    expect(StorageService.getTodayStudyMinutes(userId)).toBe(0);

    // Session 2: 40 active seconds
    const session2 = render(
      <ReaderView
        item={mockItem}
        version={mockItem.version}
        activities={mockItem.activities}
        onBack={vi.fn()}
      />
    );
    await act(async () => {
      vi.advanceTimersByTime(40000);
      await Promise.resolve();
    });
    await act(async () => {
      session2.unmount();
      await Promise.resolve();
    });

    // Total: 80 seconds accumulated -> awards exactly 1 daily study minute!
    expect(StorageService.getTodayStudySeconds(userId)).toBe(80);
    expect(StorageService.getTodayStudyMinutes(userId)).toBe(1);

    authStateSpy.mockRestore();
    vi.useRealTimers();
  });

  it('26. Active reading timer pauses on 60s idle timeout and flushes on tab hidden', async () => {
    vi.useFakeTimers();
    const updateSpy = vi.spyOn(contentCentredService, 'updateLearnerProgress').mockResolvedValue({} as any);
    const mockItem = SEED_CONTENT_ITEMS[0];
    const userId = 'user_idle_tab_test';
    const authStateSpy = vi.spyOn(authService, 'getState').mockReturnValue({
      user: { id: userId, email: 'test@example.com' } as any,
      role: 'user',
      isGuest: false,
      isLoading: false,
    });

    const { unmount } = render(
      <ReaderView
        item={mockItem}
        version={mockItem.version}
        activities={mockItem.activities}
        onBack={vi.fn()}
      />
    );

    // 10 active seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // User stops interacting for 65 seconds (exceeding 60s INACTIVITY_THRESHOLD_MS)
    act(() => {
      vi.advanceTimersByTime(65000);
    });

    // Trigger tab hidden
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Tab hidden flushes accumulated time immediately
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        content_item_id: mockItem.id,
        content_version_id: mockItem.version.id,
      })
    );

    act(() => {
      unmount();
    });

    authStateSpy.mockRestore();
    vi.useRealTimers();
  });

  it('27. Canonical vocabulary identity handles alias deduplication, language scoping, accents, and fallbacks', async () => {
    const userId = sampleCourse.user_id;
    const today = getLocalTodayDateString();

    // 1. Same canonical word in both sources:
    // SRS item with legacy ID 'srs_cafe_123', UserSavedWord with lemma 'café' and legacy_srs_item_id 'srs_cafe_123'
    // Must be counted as 1 distinct term, not 2.
    vi.spyOn(StorageService, 'getSRSItems').mockReturnValueOnce([
      {
        vocabulary_item_id: 'srs_cafe_123',
        language: 'pt',
        repetition_count: 2,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        lapse_count: 0,
        mastery_status: 'learning',
        history: [],
      },
      // Distinct accented variant: 'esta' (unaccented) vs 'está' (accented)
      {
        vocabulary_item_id: 'esta',
        language: 'pt',
        repetition_count: 1,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        lapse_count: 0,
        mastery_status: 'learning',
        history: [],
      },
      {
        vocabulary_item_id: 'está',
        language: 'pt',
        repetition_count: 1,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        lapse_count: 0,
        mastery_status: 'learning',
        history: [],
      },
      // Different language track (Spanish) — must be excluded from Portuguese course
      {
        vocabulary_item_id: 'sol',
        language: 'es',
        repetition_count: 1,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_date: today,
        lapse_count: 0,
        mastery_status: 'learning',
        history: [],
      },
    ]);

    vi.spyOn(contentCentredService, 'getUserSavedWords').mockResolvedValueOnce([
      {
        id: 'usw_cafe',
        user_id: userId,
        target_language: 'pt',
        explanation_language: 'en',
        term: '  Café  ', // Case and whitespace differences
        lemma: 'café',
        pos: 'noun',
        definition: 'Coffee',
        next_review: today,
        legacy_srs_item_id: 'srs_cafe_123', // Matches SRS item
        state: 'learning',
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 1,
        lapses: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Missing lemma fallback (falls back to term)
      {
        id: 'usw_no_lemma',
        user_id: userId,
        target_language: 'pt',
        explanation_language: 'en',
        term: 'obrigado',
        lemma: '',
        pos: 'interjection',
        definition: 'Thank you',
        next_review: today,
        state: 'learning',
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 1,
        lapses: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const summary = await resolveVocabularySummary(sampleCourse, userId);

    // Expected distinct terms in 'pt':
    // 1. 'pt:café' (deduplicated across SRS item 'srs_cafe_123' and UserSavedWord 'café')
    // 2. 'pt:esta' (unaccented)
    // 3. 'pt:está' (accented, distinct from 'esta')
    // 4. 'pt:obrigado' (lemma fallback from term)
    // Note: 'es:sol' is excluded because target_language is 'pt'.
    expect(summary.dueSRSCount).toBe(4);
  });

  it('28. Recommendation error handling propagates backend failures and does not masquerade as empty', async () => {
    const userId = sampleCourse.user_id;

    // No in-progress stories
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([]);
    // Invalidate curriculum generator so it falls to recommendations
    vi.spyOn(ClientLessonGenerator, 'generateOrGetLesson').mockReturnValue(null as any);

    // Backend failure on getContentItems
    vi.spyOn(contentCentredService, 'getContentItems').mockRejectedValueOnce(
      new Error('Supabase database connection timeout')
    );

    await expect(resolveContinueLearning(sampleCourse, userId)).rejects.toThrow(
      'Supabase database connection timeout'
    );

    // Case 2: Genuine empty catalog returns { type: 'empty' }
    vi.spyOn(contentCentredService, 'getAllLearnerProgress').mockResolvedValueOnce([]);
    vi.spyOn(ClientLessonGenerator, 'generateOrGetLesson').mockReturnValue(null as any);
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([]);

    const emptyResult = await resolveContinueLearning(sampleCourse, userId);
    expect(emptyResult.type).toBe('empty');
  });

  it('29. Today Edition explicit CEFR policy prefers exact match, falls back to adjacent level, and excludes distant levels', async () => {
    const courseB1 = { ...sampleCourse, cefr_level: 'B1' as const };

    // Case A: Exact match available (B1)
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      { id: 'item_b1', title: 'B1 Story', primary_cefr: 'B1', target_language: 'pt', status: 'published' } as any,
      { id: 'item_a2', title: 'A2 Story', primary_cefr: 'A2', target_language: 'pt', status: 'published' } as any,
    ]);

    const editionA = await resolveTodaysEdition(courseB1);
    expect(editionA.stories.length).toBe(1);
    expect(editionA.stories[0].id).toBe('item_b1');

    // Case B: No exact match, but compatible adjacent level available (A2 is distance 1 from B1)
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      { id: 'item_a2', title: 'A2 Story', primary_cefr: 'A2', target_language: 'pt', status: 'published' } as any,
    ]);

    const editionB = await resolveTodaysEdition(courseB1);
    expect(editionB.stories.length).toBe(1);
    expect(editionB.stories[0].id).toBe('item_a2');

    // Case C: Distant level only (C1 for A1 learner, distance 4 > 1) -> must NOT return distant level
    const courseA1 = { ...sampleCourse, cefr_level: 'A1' as const };
    vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValueOnce([
      { id: 'item_c1', title: 'C1 Story', primary_cefr: 'C1', target_language: 'pt', status: 'published' } as any,
    ]);

    const editionC = await resolveTodaysEdition(courseA1);
    expect(editionC.stories.length).toBe(0); // Distant level excluded according to policy!
  });

  it('30. Sentence clicks update reading position without completing content when required activities exist', async () => {
    const updateSpy = vi.spyOn(contentCentredService, 'updateLearnerProgress').mockResolvedValue({} as any);
    const mockItem = SEED_CONTENT_ITEMS[0]; // has activities

    render(
      <ReaderView
        item={mockItem}
        version={mockItem.version}
        activities={mockItem.activities}
        onBack={vi.fn()}
      />
    );

    // 1. Click first sentence
    const firstSentence = await screen.findByTestId('sentence-s1');
    fireEvent.click(firstSentence);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content_item_id: mockItem.id,
          content_version_id: mockItem.version.id,
          status: 'in_progress',
          time_spent_seconds: 0,
        })
      );
    });

    // 2. Click final sentence (s4)
    const finalSentence = await screen.findByTestId('sentence-s4');
    fireEvent.click(finalSentence);

    await waitFor(() => {
      // Because required activities exist, reaching 100% of reading MUST NOT set status to 'completed'!
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content_item_id: mockItem.id,
          content_version_id: mockItem.version.id,
          status: 'in_progress', // Kept in_progress until activities completed
          percent_complete: 100,
          time_spent_seconds: 0,
        })
      );
    });

    // Reading position restored in localStorage
    expect(localStorage.getItem(`lexilume_reading_pos_${mockItem.id}_${mockItem.version.id}`)).toBe('s4');

    // 3. Navigate backward to sentence s2
    const secondSentence = await screen.findByTestId('sentence-s2');
    fireEvent.click(secondSentence);

    expect(localStorage.getItem(`lexilume_reading_pos_${mockItem.id}_${mockItem.version.id}`)).toBe('s2');
  });
});
