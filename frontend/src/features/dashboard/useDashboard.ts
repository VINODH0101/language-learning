/**
 * Business Logic Hook for Dashboard
 * 
 * Separates data fetching, course switching, and session management from presentation.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DailyLessonPayload,
  UserSettings,
  ActiveLessonProgress,
  SessionDuration,
  Course,
  Language,
  RegionalVariety,
  CEFRLevel,
  ExplanationLanguage,
} from '../../types';
import { ClientLessonGenerator } from '../../services/lessonGenerator';
import { StorageService } from '../../services/storage';
import { getActiveProgress } from '../../services/localDb';
import { courseService } from '../../services/courseService';
import { useI18n } from '../../i18n/i18nContext';
import { toast } from 'sonner';

export function useDashboard() {
  const { interfaceLanguage } = useI18n();
  const [courses, setCourses] = useState<Course[]>(courseService.getCourses());
  const [activeCourse, setActiveCourse] = useState<Course>(() => {
    const all = courseService.getCourses();
    try {
      const activeKey = `polyglot_active_course_${courseService.getUserId()}`;
      const pinned = localStorage.getItem(activeKey);
      if (pinned) {
        const found = all.find(c => c.id === pinned);
        if (found) return found;
      }
    } catch {}
    const langMatch = all.find(c => c.target_language === interfaceLanguage);
    return langMatch || courseService.getActiveCourse();
  });
  const [activeLesson, setActiveLesson] = useState<DailyLessonPayload | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dueSRSCount, setDueSRSCount] = useState(0);
  const [activeLessonProgress, setActiveLessonProgress] = useState<ActiveLessonProgress | null>(null);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  // New Course Form State
  const [newTargetLang, setNewTargetLang] = useState<Language>(interfaceLanguage === 'en' ? 'pt' : 'en');
  const [newRegionalVariant, setNewRegionalVariant] = useState<RegionalVariety>('en-US');
  const [newCefrLevel, setNewCefrLevel] = useState<CEFRLevel>('B1');
  const [newExplanationLang, setNewExplanationLang] = useState<ExplanationLanguage>(
    interfaceLanguage.startsWith('pt') ? 'pt' : interfaceLanguage === 'es' ? 'es' : 'en'
  );
  const [newDailyGoal, setNewDailyGoal] = useState<number>(10);

  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(() => {
    try {
      const saved = localStorage.getItem('polyglot_session_duration');
      if (saved === '5' || saved === '10' || saved === '20') return saved;
    } catch {}
    return '10';
  });

  const handleSelectDuration = useCallback((d: SessionDuration) => {
    setSessionDuration(d);
    try {
      localStorage.setItem('polyglot_session_duration', d);
      courseService.updateCourse(activeCourse.id, { daily_goal_minutes: parseInt(d, 10) });
      const msg = interfaceLanguage === 'en'
        ? `Daily goal updated to ${d} minutes.`
        : interfaceLanguage === 'es'
        ? `Meta diaria actualizada a ${d} minutos.`
        : `Meta diária atualizada para ${d} minutos.`;
      toast.success(msg);
    } catch {}
  }, [activeCourse.id, interfaceLanguage]);

  useEffect(() => {
    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);

    const today = new Date().toISOString().split('T')[0];
    const lesson = ClientLessonGenerator.generateOrGetLesson(
      courseService.toCourseConfig(activeCourse),
      today
    );
    setActiveLesson(lesson);

    // Calculate due SRS cards
    const srsItems = StorageService.getSRSItems();
    const due = srsItems.filter(item => {
      if (item.language !== activeCourse.target_language) return false;
      const nextDate = item.next_review_date ? item.next_review_date.split('T')[0] : '';
      return nextDate <= today;
    });
    setDueSRSCount(due.length);

    getActiveProgress(activeCourse.target_language).then(prog => {
      setActiveLessonProgress(prog);
    });
  }, [activeCourse]);

  const handleSelectCourse = useCallback((c: Course) => {
    courseService.setActiveCourse(c.id);
    setActiveCourse(c);
  }, []);

  const handleCreateCourse = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = courseService.createCourse({
        target_language: newTargetLang,
        regional_variant: newRegionalVariant,
        cefr_level: newCefrLevel,
        explanation_language: newExplanationLang,
        daily_goal_minutes: newDailyGoal,
        streak_days: 1,
        total_lessons_completed: 0,
        completed_curriculum_node_ids: [],
        is_active: true,
      });
      setCourses(courseService.getCourses());
      setActiveCourse(created);
      setIsAddCourseModalOpen(false);
      toast.success('Novo curso criado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar curso');
    }
  }, [newTargetLang, newRegionalVariant, newCefrLevel, newExplanationLang, newDailyGoal]);

  return {
    courses,
    activeCourse,
    activeLesson,
    settings,
    dueSRSCount,
    activeLessonProgress,
    sessionDuration,
    handleSelectDuration,
    handleSelectCourse,
    isAddCourseModalOpen,
    setIsAddCourseModalOpen,
    newTargetLang,
    setNewTargetLang,
    newRegionalVariant,
    setNewRegionalVariant,
    newCefrLevel,
    setNewCefrLevel,
    newExplanationLang,
    setNewExplanationLang,
    newDailyGoal,
    setNewDailyGoal,
    handleCreateCourse,
  };
}
