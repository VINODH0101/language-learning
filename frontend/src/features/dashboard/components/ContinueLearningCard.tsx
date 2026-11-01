import React from 'react';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { Course, DailyLessonPayload, ActiveLessonProgress, Language, RegionalVariety, CEFRLevel } from '../../../types';
import { useI18n } from '../../../i18n/i18nContext';
import { courseService } from '../../../services/courseService';
import { getLanguageName } from '../../../lib/languages/languageMatrix';

interface ContinueLearningCardProps {
  activeCourse: Course;
  activeLesson: DailyLessonPayload;
  activeLessonProgress: ActiveLessonProgress | null;
  onOpenLesson: (course: Course) => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  activeCourse,
  activeLesson,
  activeLessonProgress,
  onOpenLesson,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const getLanguageLabel = (lang: Language) => {
    return getLanguageName(lang, (interfaceLanguage as any) || 'en');
  };

  const getLanguageFlag = (lang: Language, variant?: RegionalVariety) => {
    if (lang === 'en') return variant?.includes('GB') ? '🇬🇧' : '🇺🇸';
    if (lang === 'pt') return variant?.includes('PT') ? '🇵🇹' : '🇧🇷';
    if (lang === 'es') return variant?.includes('ES') ? '🇪🇸' : '🇲🇽';
    if (lang === 'fr') return '🇫🇷';
    if (lang === 'de') return '🇩🇪';
    if (lang === 'it') return '🇮🇹';
    if (lang === 'ja') return '🇯🇵';
    if (lang === 'ko') return '🇰🇷';
    if (lang === 'ru') return '🇷🇺';
    if (lang === 'nl') return '🇳🇱';
    if (lang === 'zh') return '🇨🇳';
    if (lang === 'tr') return '🇹🇷';
    if (lang === 'ta') return '🇮🇳';
    return '🌐';
  };

  const getCefrDescription = (level: CEFRLevel) => {
    if (interfaceLanguage === 'en') {
      return level === 'C1' ? 'Advanced' : level === 'B2' ? 'Upper-Intermediate' : level === 'B1' ? 'Intermediate' : 'Beginner';
    }
    if (interfaceLanguage === 'es') {
      return level === 'C1' ? 'Avanzado' : level === 'B2' ? 'Intermedio Alto' : level === 'B1' ? 'Intermedio' : 'Principiante';
    }
    return level === 'C1' ? 'Avançado' : level === 'B2' ? 'Independente' : level === 'B1' ? 'Intermediário' : 'Iniciante';
  };

  // Genuine dynamic total curriculum nodes
  const totalCurriculumNodes = courseService.getCurriculumTotalNodes(activeCourse.target_language, activeCourse.cefr_level);
  const completedNodesCount = activeCourse.completed_curriculum_node_ids?.length || activeCourse.total_lessons_completed || 0;
  const curriculumProgressPct = Math.min(100, Math.round((completedNodesCount / Math.max(1, totalCurriculumNodes)) * 100));

  return (
    <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border-2 border-indigo-500/80 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
              {activeLessonProgress ? t('dash_resume_lesson_title') : t('dash_next_lesson_title')}
            </span>
            <span className="text-xs text-slate-400">
              {t('dash_active_course')}: {getLanguageFlag(activeCourse.target_language, activeCourse.regional_variant)} {getLanguageLabel(activeCourse.target_language)} • CEFR {activeCourse.cefr_level}
            </span>
          </div>
        </div>

        <Badge variant="indigo" size="md">
          {activeCourse.cefr_level} {getCefrDescription(activeCourse.cefr_level)}
        </Badge>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
          {activeLesson.curriculum_topic_title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
          {activeLesson.section_1_objectives[0]?.can_do_statement || 'Develop receptive and productive language mastery with authentic structures.'}
        </p>
      </div>

      {/* Lesson metrics breakdown */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t('dash_vocab_stat')}</span>
          <span className="font-bold text-slate-100">
            {t('dashboard:vocab_terms_count', '{{count}} terms', { count: activeLesson.section_2_vocabulary.length })}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t('dash_grammar_stat')}</span>
          <span className="font-bold text-slate-100 truncate block">{activeLesson.section_3_grammar.category}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t('dash_time_stat')}</span>
          <span className="font-bold text-slate-100">{activeLesson.estimated_study_minutes} min</span>
        </div>
      </div>

      {/* Dynamic Curriculum Progression */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>
            {t('dashboard:curriculum_units_completed', '{{completed}} of {{total}} curriculum units completed', {
              completed: completedNodesCount,
              total: totalCurriculumNodes,
            })}
          </span>
          <span className="font-semibold text-indigo-300">{curriculumProgressPct}%</span>
        </div>
        <ProgressBar progress={curriculumProgressPct} variant="indigo" />
      </div>

      {/* Primary Action Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 shadow-lg min-h-[48px] cursor-pointer transition-all duration-150"
        icon={<ArrowRight className="w-5 h-5" />}
        onClick={() => onOpenLesson(activeCourse)}
      >
        {activeLessonProgress
          ? t('dash_continue_lesson_btn')
          : `${t('dash_start_lesson_btn')} (${getLanguageLabel(activeCourse.target_language)})`}
      </Button>
    </div>
  );
};
