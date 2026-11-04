import React, { useState, useEffect, useCallback } from 'react';
import {
  DailyLessonPayload,
  UserSettings,
  ActiveLessonProgress,
  Course,
  Language,
  DailyPoem,
  DailyConversation,
} from '../../types';
import { ContentItem } from '../../types/contentCentred';
import { ClientLessonGenerator } from '../../services/lessonGenerator';
import { StorageService } from '../../services/storage';
import { getActiveProgress } from '../../services/localDb';
import { courseService } from '../../services/courseService';
import { dailyContentService } from '../../services/dailyContentService';
import { useI18n } from '../../i18n/i18nContext';

import {
  WelcomeHeader,
  ContinueLearningCard,
  DailyContentPreview,
  VocabularySummary,
  DailyLearningGoal,
  RecentLearning,
  DailyPoetryReaderModal,
  DailyConversationModal,
  AddCourseModal,
} from './components';

import {
  ContinueItemData,
  RecentLearningActivity,
  getLocalTodayDateString,
  getContinueContentItemId,
  resolveContinueLearning,
  resolveTodaysEdition,
  resolveVocabularySummary,
  resolveDailyGoal,
  resolveRecentActivities,
} from './services/homeOrchestrator';

interface DashboardPageProps {
  onNavigateTab: (
    tab:
      | 'learn'
      | 'words'
      | 'mistakes'
      | 'dashboard'
      | 'portuguese'
      | 'spanish'
      | 'english'
      | 'vocabulary'
      | 'explore'
      | 'translate'
      | 'practice'
      | 'progress'
      | 'settings'
      | 'admin'
  ) => void;
}

export const DashboardView: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { t } = useI18n();

  // Active courses state
  const [courses, setCourses] = useState<Course[]>(() => courseService.getCourses());
  const [activeCourse, setActiveCourse] = useState<Course>(() => courseService.getActiveCourse());
  const [settings, setSettings] = useState<UserSettings | null>(() => StorageService.getSettings());

  // Section 2: Continue Learning
  const [continueItem, setContinueItem] = useState<ContinueItemData | null>(null);
  const [activeLesson, setActiveLesson] = useState<DailyLessonPayload | null>(() => {
    try {
      return ClientLessonGenerator.generateOrGetLesson(
        courseService.toCourseConfig(courseService.getActiveCourse()),
        getLocalTodayDateString()
      );
    } catch {
      return null;
    }
  });
  const [activeLessonProgress, setActiveLessonProgress] = useState<ActiveLessonProgress | null>(null);
  const [isContinueLoading, setIsContinueLoading] = useState(true);
  const [continueError, setContinueError] = useState<string | null>(null);

  // Section 3: Today's Edition
  const [dailyPoem, setDailyPoem] = useState<DailyPoem | null>(() => {
    return dailyContentService.getDailyPoem(
      courseService.getActiveCourse().target_language,
      courseService.getActiveCourse().explanation_language
    );
  });
  const [dailyConversation, setDailyConversation] = useState<DailyConversation | null>(() => {
    return dailyContentService.getDailyConversation(
      courseService.getActiveCourse().target_language,
      courseService.getActiveCourse().explanation_language
    );
  });
  const [todayStories, setTodayStories] = useState<ContentItem[]>([]);
  const [isEditionLoading, setIsEditionLoading] = useState(false);
  const [editionError, setEditionError] = useState<string | null>(null);
  const [isPoetryModalOpen, setIsPoetryModalOpen] = useState(false);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);

  // Section 4: Vocabulary Summary
  const [dueSRSCount, setDueSRSCount] = useState<number>(() => {
    const today = getLocalTodayDateString();
    const active = courseService.getActiveCourse();
    const items = StorageService.getSRSItems(active.target_language, courseService.getUserId());
    return items.filter(s => s.next_review_date <= today).length;
  });
  const [savedThisWeekCount, setSavedThisWeekCount] = useState(0);
  const [isVocabLoading, setIsVocabLoading] = useState(false);
  const [vocabError, setVocabError] = useState<string | null>(null);

  // Section 6: Recently Learned
  const [recentActivities, setRecentActivities] = useState<RecentLearningActivity[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  // Modals
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  // Subscribe to course updates
  useEffect(() => {
    const unsub = courseService.subscribe((all, active) => {
      setCourses(all);
      setActiveCourse(active);
    });
    return unsub;
  }, []);

  // Section 3 loader (independent or orchestrated)
  const loadEdition = useCallback(async (course: Course, excludedId?: string, isCurrent?: () => boolean) => {
    setIsEditionLoading(true);
    setEditionError(null);
    try {
      const edition = await resolveTodaysEdition(course, excludedId);
      if (isCurrent && !isCurrent()) return;
      setDailyPoem(edition.poem);
      setDailyConversation(edition.conversation);
      setTodayStories(edition.stories);
    } catch (err: any) {
      if (isCurrent && !isCurrent()) return;
      console.warn('Error resolving today edition:', err);
      setEditionError(err?.message || "Failed to load Today's Edition");
    } finally {
      if (!isCurrent || isCurrent()) {
        setIsEditionLoading(false);
      }
    }
  }, []);

  // Section 2 & 3 orchestrated loader: resolves Continue Learning first, then passes story ID to exclude
  const loadContinueAndEdition = useCallback(async (course: Course, userId: string, isCurrent?: () => boolean) => {
    setIsContinueLoading(true);
    setContinueError(null);
    let resolvedItem: ContinueItemData | null = null;
    try {
      resolvedItem = await resolveContinueLearning(course, userId);
      if (isCurrent && !isCurrent()) return;
      setContinueItem(resolvedItem);
    } catch (err: any) {
      if (isCurrent && !isCurrent()) return;
      console.warn('Error resolving continue learning:', err);
      setContinueError(err?.message || 'Failed to load continue learning progress');
    } finally {
      if (!isCurrent || isCurrent()) {
        setIsContinueLoading(false);
      }
    }

    if (isCurrent && !isCurrent()) return;

    // Orchestrated Section 3 loader: never duplicate the Continue Learning item.
    const excludedId = getContinueContentItemId(resolvedItem);
    await loadEdition(course, excludedId, isCurrent);
  }, [loadEdition]);

  // Section 4 loader (independent)
  const loadVocab = useCallback(async (course: Course, userId: string, isCurrent?: () => boolean) => {
    setIsVocabLoading(true);
    setVocabError(null);
    try {
      const vocab = await resolveVocabularySummary(course, userId);
      if (isCurrent && !isCurrent()) return;
      setDueSRSCount(vocab.dueSRSCount);
      setSavedThisWeekCount(vocab.savedThisWeekCount);
    } catch (err: any) {
      if (isCurrent && !isCurrent()) return;
      console.warn('Error resolving vocabulary summary:', err);
      setVocabError(err?.message || 'Failed to load vocabulary metrics');
    } finally {
      if (!isCurrent || isCurrent()) {
        setIsVocabLoading(false);
      }
    }
  }, []);

  // Section 6 loader (independent)
  const loadRecent = useCallback(async (course: Course, userId: string, isCurrent?: () => boolean) => {
    setIsRecentLoading(true);
    setRecentError(null);
    try {
      const acts = await resolveRecentActivities(course, userId);
      if (isCurrent && !isCurrent()) return;
      setRecentActivities(acts);
    } catch (err: any) {
      if (isCurrent && !isCurrent()) return;
      console.warn('Error resolving recent activities:', err);
      setRecentError(err?.message || 'Failed to load recent activities');
    } finally {
      if (!isCurrent || isCurrent()) {
        setIsRecentLoading(false);
      }
    }
  }, []);

  // Orchestrate independent Home sections when activeCourse changes
  useEffect(() => {
    let isCancelled = false;
    const isCurrent = () => !isCancelled;
    const userId = courseService.getUserId();
    const today = getLocalTodayDateString();

    // Ensure settings are synced
    setSettings(StorageService.getSettings());

    // Generate fallback curriculum lesson synchronously
    try {
      const generated = ClientLessonGenerator.generateOrGetLesson(
        courseService.toCourseConfig(activeCourse),
        today
      );
      setActiveLesson(generated);
    } catch (err) {
      console.warn('Error generating daily lesson fallback:', err);
    }

    // Check active lesson progress
    getActiveProgress(activeCourse.target_language)
      .then(p => {
        if (!isCurrent()) return;
        if (p && p.lesson_date === today) setActiveLessonProgress(p);
        else setActiveLessonProgress(null);
      })
      .catch(() => {
        if (isCurrent()) setActiveLessonProgress(null);
      });

    // Orchestrated Section 2 -> Section 3
    loadContinueAndEdition(activeCourse, userId, isCurrent);

    // Independent Section 4 loader
    loadVocab(activeCourse, userId, isCurrent);

    // Independent Section 6 loader
    loadRecent(activeCourse, userId, isCurrent);

    return () => {
      isCancelled = true;
    };
  }, [activeCourse, loadContinueAndEdition, loadVocab, loadRecent]);

  const handleOpenCourseLesson = (course: Course) => {
    courseService.setActiveCourse(course.id);
    if (course.target_language === 'en') onNavigateTab('english');
    else if (course.target_language === 'pt') onNavigateTab('portuguese');
    else if (course.target_language === 'es') onNavigateTab('spanish');
    else onNavigateTab('learn');
  };

  const handleContinue = (item: ContinueItemData) => {
    if (item.type === 'recovery') {
      onNavigateTab('learn');
      return;
    }
    if (item.type === 'story' || item.type === 'recommended') {
      try {
        sessionStorage.setItem('lexilume_open_content_id', item.item.id);
        if ('version' in item && item.version?.id) {
          sessionStorage.setItem('lexilume_open_version_id', item.version.id);
        }
      } catch {}
      onNavigateTab('learn');
    } else if (item.type === 'curriculum') {
      handleOpenCourseLesson(activeCourse);
    } else {
      onNavigateTab('learn');
    }
  };

  const handleOpenStory = (story: ContentItem) => {
    try {
      sessionStorage.setItem('lexilume_open_content_id', story.id);
      if (story.current_version_id) {
        sessionStorage.setItem('lexilume_open_version_id', story.current_version_id);
      }
    } catch {}
    onNavigateTab('learn');
  };

  // Genuine tracked cognitive learning minutes today
  const genuineStudyMinutes = StorageService.getTodayStudyMinutes(courseService.getUserId());

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#292923]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 overflow-x-hidden">
        {/* 1. Personal Welcome Header */}
        <WelcomeHeader
          fullName={settings?.full_name}
          activeCourse={activeCourse}
        />

        {/* 2. Hero Continue Learning Card (Primary Visual Focus) */}
        <ContinueLearningCard
          activeCourse={activeCourse}
          activeLesson={activeLesson}
          activeLessonProgress={activeLessonProgress}
          continueItem={continueItem}
          onContinue={handleContinue}
          onOpenLesson={handleOpenCourseLesson}
          onExploreCatalog={() => onNavigateTab('learn')}
          isLoading={isContinueLoading}
          isError={Boolean(continueError)}
          errorMessage={continueError || undefined}
          onRetry={() => loadContinueAndEdition(activeCourse, courseService.getUserId())}
        />

        {/* 3. Today's Edition: Mixed Content Discovery */}
        <DailyContentPreview
          dailyPoem={dailyPoem}
          dailyConversation={dailyConversation}
          publishedStories={todayStories}
          onOpenPoem={() => setIsPoetryModalOpen(true)}
          onOpenConversation={() => setIsConversationModalOpen(true)}
          onOpenStory={handleOpenStory}
          onExploreAll={() => onNavigateTab('learn')}
          isLoading={isEditionLoading}
          isError={Boolean(editionError)}
          errorMessage={editionError || undefined}
          onRetry={() => loadEdition(activeCourse, getContinueContentItemId(continueItem))}
        />

        {/* 4 & 5. Daily Practice & Goal — paired on desktop to shorten the page. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VocabularySummary
            dueSRSCount={dueSRSCount}
            savedThisWeekCount={savedThisWeekCount}
            onReviewDue={() => onNavigateTab('practice')}
            onOpenVocabulary={() => onNavigateTab('words')}
            isLoading={isVocabLoading}
            isError={Boolean(vocabError)}
            errorMessage={vocabError || undefined}
            onRetry={() => loadVocab(activeCourse, courseService.getUserId())}
          />

          <DailyLearningGoal
            dailyGoalMinutes={activeCourse.daily_goal_minutes || 10}
            elapsedMinutes={genuineStudyMinutes}
          />
        </div>

        {/* 6. Recently Learned Activities */}
        <RecentLearning
          activities={recentActivities}
          onViewAll={() => onNavigateTab('progress')}
          isLoading={isRecentLoading}
          isError={Boolean(recentError)}
          errorMessage={recentError || undefined}
          onRetry={() => loadRecent(activeCourse, courseService.getUserId())}
        />

        {/* Modals */}
        {dailyPoem && (
          <DailyPoetryReaderModal
            poem={dailyPoem}
            isOpen={isPoetryModalOpen}
            onClose={() => setIsPoetryModalOpen(false)}
          />
        )}

        {dailyConversation && (
          <DailyConversationModal
            conversation={dailyConversation}
            isOpen={isConversationModalOpen}
            onClose={() => setIsConversationModalOpen(false)}
          />
        )}

        <AddCourseModal
          isOpen={isAddCourseModalOpen}
          onClose={() => setIsAddCourseModalOpen(false)}
          onCourseCreated={course => setActiveCourse(course)}
        />
      </div>
    </div>
  );
};
