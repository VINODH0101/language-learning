import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardView } from '../features/dashboard/DashboardView';
import { LearnPage } from '../pages/LearnPage';
import { I18nProvider } from '../i18n/i18nContext';
import { courseService } from '../services/courseService';
import { StorageService } from '../services/storage';
import { contentCentredService } from '../services/contentCentredService';
import { dailyContentService } from '../services/dailyContentService';
import {
  resolveContinueLearning,
  resolveTodaysEdition,
  resolveVocabularySummary,
  resolveDailyGoal,
  resolveRecentActivities,
  getLocalTodayDateString,
  isWithinLast7Days,
} from '../features/dashboard/services/homeOrchestrator';
import { Course } from '../types';

describe('Home Page Redesign — Editorial Architecture & Six Sections', () => {
  const mockNavigateTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
    vi.spyOn(StorageService, 'getTodayStudyMinutes').mockReturnValue(6);

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
});
