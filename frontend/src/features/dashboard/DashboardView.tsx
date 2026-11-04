import React, { useState, useEffect, useCallback } from 'react';
import {
  DailyLessonPayload,
  UserSettings,
  ActiveLessonProgress,
  SessionDuration,
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
import { toast } from 'sonner';

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
  const [activeLesson, setActiveLesson] = useState<DailyLessonPayload | null>(null);
  const [activeLessonProgress, setActiveLessonProgress] = useState<ActiveLessonProgress | null>(null);
  const [isContinueLoading, setIsContinueLoading] = useState(true);

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

  // Section 5: Daily Goal & Pace
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(() => {
    try {
      const saved = localStorage.getItem('polyglot_session_duration');
      if (saved === '5' || saved === '10' || saved === '20') return saved;
    } catch {}
    return '10';
  });

  // Section 6: Recently Learned
  const [recentActivities, setRecentActivities] = useState<RecentLearningActivity[]>([]);

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

  // Orchestrate independent Home sections when activeCourse changes
  useEffect(() => {
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

    // Load authentic daily literature and conversation immediately
    const poem = dailyContentService.getDailyPoem(
      activeCourse.target_language,
      activeCourse.explanation_language
    );
    const convo = dailyContentService.getDailyConversation(
      activeCourse.target_language,
      activeCourse.explanation_language
    );
    setDailyPoem(poem);
    setDailyConversation(convo);

    // Initial synchronous SRS count
    const allSRS = StorageService.getSRSItems(activeCourse.target_language, userId);
    const due = allSRS.filter(s => s.next_review_date <= today);
    setDueSRSCount(due.length);

    // Check active lesson progress
    getActiveProgress(activeCourse.target_language)
      .then(p => {
        if (p && p.lesson_date === today) setActiveLessonProgress(p);
        else setActiveLessonProgress(null);
      })
      .catch(() => setActiveLessonProgress(null));

    // Section 2: Resolve Continue Learning Priority
    setIsContinueLoading(true);
    resolveContinueLearning(activeCourse, userId)
      .then(res => {
        setContinueItem(res);
      })
      .catch(err => {
        console.warn('Error resolving continue learning:', err);
      })
      .finally(() => {
        setIsContinueLoading(false);
      });

    // Section 3: Resolve Today's Edition (Poem, Dialogue, Stories)
    resolveTodaysEdition(activeCourse)
      .then(edition => {
        setDailyPoem(edition.poem);
        setDailyConversation(edition.conversation);
        setTodayStories(edition.stories);
      })
      .catch(err => {
        console.warn('Error resolving today edition:', err);
      });

    // Section 4: Resolve Vocabulary Summary
    resolveVocabularySummary(activeCourse, userId)
      .then(vocab => {
        setDueSRSCount(vocab.dueSRSCount);
        setSavedThisWeekCount(vocab.savedThisWeekCount);
      })
      .catch(err => {
        console.warn('Error resolving vocabulary summary:', err);
      });

    // Section 6: Resolve Recent Learning Activities
    resolveRecentActivities(activeCourse, userId)
      .then(acts => {
        setRecentActivities(acts);
      })
      .catch(err => {
        console.warn('Error resolving recent activities:', err);
      });
  }, [activeCourse]);

  const handleSelectDuration = (d: SessionDuration) => {
    setSessionDuration(d);
    try {
      localStorage.setItem('polyglot_session_duration', d);
      courseService.updateCourse(activeCourse.id, { daily_goal_minutes: parseInt(d, 10) });
      toast.success(`${t('dashboard:goal_title', 'Daily Learning Goal')}: ${d} ${t('common:minutes', 'min')}`);
    } catch {}
  };

  const handleOpenCourseLesson = (course: Course) => {
    courseService.setActiveCourse(course.id);
    if (course.target_language === 'en') onNavigateTab('english');
    else if (course.target_language === 'pt') onNavigateTab('portuguese');
    else if (course.target_language === 'es') onNavigateTab('spanish');
    else onNavigateTab('portuguese');
  };

  const handleContinue = (item: ContinueItemData) => {
    if (item.type === 'story' || item.type === 'recommended') {
      try {
        sessionStorage.setItem('lexilume_open_content_id', item.item.id);
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
    } catch {}
    onNavigateTab('learn');
  };

  if (!activeLesson || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-stone-400 text-sm">
        {t('dash_loading', 'Loading editorial edition...')}
      </div>
    );
  }

  // Genuine tracked cognitive learning minutes today
  const genuineStudyMinutes = StorageService.getTodayStudyMinutes(courseService.getUserId());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 overflow-x-hidden">
      {/* 1. Personal Welcome Header */}
      <WelcomeHeader
        fullName={settings.full_name}
        streakDays={activeCourse.streak_days}
        dueSRSCount={dueSRSCount}
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
      />

      {/* 4. Vocabulary Summary & Spaced Repetition */}
      <VocabularySummary
        dueSRSCount={dueSRSCount}
        savedThisWeekCount={savedThisWeekCount}
        onReviewDue={() => onNavigateTab('practice')}
        onOpenVocabulary={() => onNavigateTab('words')}
      />

      {/* 5. Daily Learning Goal & Pace */}
      <DailyLearningGoal
        dailyGoalMinutes={activeCourse.daily_goal_minutes || 10}
        elapsedMinutes={genuineStudyMinutes}
        sessionDuration={sessionDuration}
        onSelectDuration={handleSelectDuration}
      />

      {/* 6. Recently Learned Activities */}
      <RecentLearning
        activities={recentActivities}
        onViewAll={() => onNavigateTab('progress')}
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
  );
};
