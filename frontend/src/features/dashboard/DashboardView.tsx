import React, { useState, useEffect } from 'react';
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
import { ClientLessonGenerator } from '../../services/lessonGenerator';
import { StorageService } from '../../services/storage';
import { getActiveProgress } from '../../services/localDb';
import { courseService } from '../../services/courseService';
import { dailyContentService } from '../../services/dailyContentService';
import { useI18n } from '../../i18n/i18nContext';
import { toast } from 'sonner';

import {
  WelcomeHeader,
  DailyLearningGoal,
  ContinueLearningCard,
  DailyContentPreview,
  DailyPoetryReaderModal,
  DailyConversationModal,
  GlobalCountryDiscovery,
  PracticeReminder,
  RecentActivityCard,
  CoursesOverviewCard,
  AddCourseModal,
} from './components';

interface DashboardPageProps {
  onNavigateTab: (
    tab:
      | 'portuguese'
      | 'spanish'
      | 'english'
      | 'vocabulary'
      | 'explore'
      | 'translate'
      | 'practice'
      | 'progress'
      | 'settings'
  ) => void;
}

export const DashboardView: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { t, interfaceLanguage } = useI18n();
  const [courses, setCourses] = useState<Course[]>(courseService.getCourses());
  const [activeCourse, setActiveCourse] = useState<Course>(() => {
    return courseService.getActiveCourse();
  });

  const [activeLesson, setActiveLesson] = useState<DailyLessonPayload | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dueSRSCount, setDueSRSCount] = useState(0);
  const [activeLessonProgress, setActiveLessonProgress] = useState<ActiveLessonProgress | null>(null);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  // Daily Content (Poetry & Conversation)
  const [dailyPoem, setDailyPoem] = useState<DailyPoem | null>(null);
  const [dailyConversation, setDailyConversation] = useState<DailyConversation | null>(null);
  const [isPoetryModalOpen, setIsPoetryModalOpen] = useState(false);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);

  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(() => {
    try {
      const saved = localStorage.getItem('polyglot_session_duration');
      if (saved === '5' || saved === '10' || saved === '20') return saved;
    } catch {}
    return '10';
  });

  // Subscribe to course updates
  useEffect(() => {
    const unsub = courseService.subscribe((all, active) => {
      setCourses(all);
      setActiveCourse(active);
    });
    return unsub;
  }, []);

  // Synchronize lesson, SRS, and daily content when active course changes
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const generated = ClientLessonGenerator.generateOrGetLesson(
      courseService.toCourseConfig(activeCourse),
      today
    );
    setActiveLesson(generated);
    setSettings(StorageService.getSettings());

    const allSRS = StorageService.getSRSItems(activeCourse.target_language);
    const due = allSRS.filter(s => s.next_review_date <= today);
    setDueSRSCount(due.length);

    getActiveProgress(activeCourse.target_language).then(p => {
      if (p && p.lesson_date === today) setActiveLessonProgress(p);
      else setActiveLessonProgress(null);
    });

    // Load authentic daily literature and conversation
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
  }, [activeCourse]);

  const handleSelectDuration = (d: SessionDuration) => {
    setSessionDuration(d);
    try {
      localStorage.setItem('polyglot_session_duration', d);
      courseService.updateCourse(activeCourse.id, { daily_goal_minutes: parseInt(d, 10) });
      toast.success(`${t('dashboard:goal_title', 'Daily Learning Goal')}: ${d} ${t('common:minutes', 'min')}`);
    } catch {}
  };

  const handleSwitchCourse = (courseId: string) => {
    try {
      const switched = courseService.setActiveCourse(courseId);
      setActiveCourse(switched);
      toast.success(`${t('dashboard:active_course', 'Active Course')}: ${switched.target_language.toUpperCase()} (${switched.cefr_level})`);
    } catch {
      toast.error(t('errors:course_switch_failed', 'Error switching course.'));
    }
  };

  const handleOpenCourseLesson = (course: Course) => {
    courseService.setActiveCourse(course.id);
    if (course.target_language === 'en') onNavigateTab('english');
    else if (course.target_language === 'pt') onNavigateTab('portuguese');
    else if (course.target_language === 'es') onNavigateTab('spanish');
    else onNavigateTab('portuguese');
  };

  if (!activeLesson || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
        {t('dash_loading')}
      </div>
    );
  }

  // Genuine tracked cognitive learning minutes today (Zero fabrication: returns 0 if unstarted)
  const genuineStudyMinutes = StorageService.getTodayStudyMinutes(courseService.getUserId());

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full overflow-x-hidden">
      {/* 1. Welcome & Immersion Header */}
      <WelcomeHeader
        fullName={settings.full_name}
        streakDays={activeCourse.streak_days}
        dueSRSCount={dueSRSCount}
        activeCourse={activeCourse}
      />

      {/* 2. Daily Learning Goal & Pace Tracker */}
      <DailyLearningGoal
        dailyGoalMinutes={activeCourse.daily_goal_minutes}
        elapsedMinutes={genuineStudyMinutes}
        sessionDuration={sessionDuration}
        onSelectDuration={handleSelectDuration}
      />

      {/* 3. Hero Continue Learning Card */}
      <ContinueLearningCard
        activeCourse={activeCourse}
        activeLesson={activeLesson}
        activeLessonProgress={activeLessonProgress}
        onOpenLesson={handleOpenCourseLesson}
      />

      {/* 4. Daily Learning Content (Poetry & Immersive Conversation) */}
      <DailyContentPreview
        dailyPoem={dailyPoem}
        dailyConversation={dailyConversation}
        onOpenPoem={() => setIsPoetryModalOpen(true)}
        onOpenConversation={() => setIsConversationModalOpen(true)}
      />

      {/* 5. Courses Overview & Multi-Track Manager */}
      <CoursesOverviewCard
        courses={courses}
        activeCourse={activeCourse}
        onSwitchCourse={handleSwitchCourse}
        onOpenCourseLesson={handleOpenCourseLesson}
        onOpenAddCourseModal={() => setIsAddCourseModalOpen(true)}
      />

      {/* 6. Spaced Repetition, Vocabulary & Translation Shortcuts */}
      <PracticeReminder
        dueSRSCount={dueSRSCount}
        onNavigateTab={onNavigateTab}
      />

      {/* 7. Worldwide Country Explorer & Cultural Discovery */}
      <GlobalCountryDiscovery
        targetLanguage={activeCourse.target_language}
        onExploreAll={() => onNavigateTab('explore')}
      />

      {/* 8. Recent Activity & Accuracy Statistics */}
      <RecentActivityCard
        onNavigateProgress={() => onNavigateTab('progress')}
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
