/**
 * Business Logic Hook for Course & Daily Lesson Management
 * 
 * Separates lesson generation, progress persistence, and completion logic from the UI.
 */

import { useState, useEffect, useCallback } from 'react';
import { DailyLessonPayload, Language } from '../../types';
import { ClientLessonGenerator } from '../../services/lessonGenerator';
import { StorageService } from '../../services/storage';
import { courseService } from '../../services/courseService';
import { getActiveProgress, saveActiveProgress, clearActiveProgress } from '../../services/localDb';
import { UmamiProvider } from '../../services/providers/analytics/umamiProvider';
import { toast } from 'sonner';

export type SectionTab =
  | 'vocab'
  | 'grammar'
  | 'reading'
  | 'conv'
  | 'speaking'
  | 'writing'
  | 'listening'
  | 'exercises'
  | 'false_friends'
  | 'resources';

export interface UseCourseReturn {
  lesson: DailyLessonPayload | null;
  activeTab: SectionTab;
  convView: 'daily' | 'scenarios';
  isCompleted: boolean;
  selectTab: (tab: SectionTab) => void;
  setConvView: (view: 'daily' | 'scenarios') => void;
  markComplete: () => void;
}

export function useCourse(language: Language): UseCourseReturn {
  const [lesson, setLesson] = useState<DailyLessonPayload | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('vocab');
  const [convView, setConvView] = useState<'daily' | 'scenarios'>('daily');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const course = courseService.getCourseForLanguage(language);
    const generated = ClientLessonGenerator.generateOrGetLesson(
      course ? courseService.toCourseConfig(course) : language,
      today
    );
    setLesson(generated);
    UmamiProvider.getInstance().trackEvent('lesson_started', { language });

    const track = StorageService.getTrackState(language);
    if (track.completed_curriculum_node_ids.includes(generated.curriculum_node_id)) {
      setIsCompleted(true);
    }

    getActiveProgress(language).then(saved => {
      if (saved && saved.lesson_date === today && saved.selected_tab) {
        setActiveTab(saved.selected_tab as SectionTab);
      }
    });
  }, [language]);

  const selectTab = useCallback((tab: SectionTab) => {
    setActiveTab(tab);
    if (lesson) {
      saveActiveProgress({
        id: language,
        language,
        curriculum_node_id: lesson.curriculum_node_id,
        lesson_date: lesson.lesson_date,
        selected_tab: tab,
        exercise_answers: {},
        completed_sections: [],
        updated_at: new Date().toISOString(),
      });
    }
  }, [language, lesson]);

  const markComplete = useCallback(() => {
    if (!lesson) return;

    const track = StorageService.getTrackState(language);
    if (!track.completed_curriculum_node_ids.includes(lesson.curriculum_node_id)) {
      track.completed_curriculum_node_ids.push(lesson.curriculum_node_id);
      track.total_lessons_completed += 1;
      track.streak_days += 1;
      track.last_lesson_date = new Date().toISOString().split('T')[0];
      StorageService.saveTrackState(track);

      // Synchronize course curriculum progress to cloud
      const activeCourse = courseService.getCourseForLanguage(language);
      if (activeCourse) {
        const updatedCompletedNodes = Array.from(new Set([
          ...(activeCourse.completed_curriculum_node_ids || []),
          lesson.curriculum_node_id,
        ]));
        courseService.updateCourse(activeCourse.id, {
          completed_curriculum_node_ids: updatedCompletedNodes,
          total_lessons_completed: (activeCourse.total_lessons_completed || 0) + 1,
          streak_days: (activeCourse.streak_days || 0) + 1,
        });
      }
    }

    clearActiveProgress(language);
    setIsCompleted(true);
    UmamiProvider.getInstance().trackEvent('lesson_completed', { language });

    const completionMessages: Partial<Record<Language, string>> = {
      pt: 'Parabéns! Lição de Português C1 concluída!',
      es: '¡Felicitaciones! Lección de Español C1 completada!',
      en: 'Congratulations! English C1 lesson completed!',
    };
    toast.success(completionMessages[language] || 'Lesson completed successfully!');
  }, [language, lesson]);

  return {
    lesson,
    activeTab,
    convView,
    isCompleted,
    selectTab,
    setConvView,
    markComplete,
  };
}
