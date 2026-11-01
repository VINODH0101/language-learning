import React from 'react';
import { Layers, Plus, Check, ArrowRight } from 'lucide-react';
import { Course, Language, RegionalVariety } from '../../../types';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';
import { courseService } from '../../../services/courseService';

interface CoursesOverviewCardProps {
  courses: Course[];
  activeCourse: Course;
  onSwitchCourse: (courseId: string) => void;
  onOpenCourseLesson: (course: Course) => void;
  onOpenAddCourseModal: () => void;
}

export const CoursesOverviewCard: React.FC<CoursesOverviewCardProps> = ({
  courses,
  activeCourse,
  onSwitchCourse,
  onOpenCourseLesson,
  onOpenAddCourseModal,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const getLanguageLabel = (lang: Language) => {
    if (interfaceLanguage === 'en') {
      return lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : lang;
    }
    if (interfaceLanguage === 'es') {
      return lang === 'en' ? 'Inglés' : lang === 'pt' ? 'Portugués' : lang === 'es' ? 'Español' : lang;
    }
    return lang === 'en' ? 'Inglês' : lang === 'pt' ? 'Português' : lang === 'es' ? 'Espanhol' : lang;
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            {t('dash_courses_overview')} ({courses.length})
          </h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs border-indigo-600/50 hover:bg-indigo-950/40 text-indigo-300 min-h-[36px] cursor-pointer"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={onOpenAddCourseModal}
        >
          {t('dash_add_course_btn')}
        </Button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {courses.map(c => {
          const isCurrent = c.id === activeCourse.id;
          const completedCount = c.completed_curriculum_node_ids?.length || c.total_lessons_completed || 0;
          // Dynamically calculated curriculum nodes count
          const totalNodes = courseService.getCurriculumTotalNodes(c.target_language, c.cefr_level);
          const courseProgressPct = Math.min(100, Math.round((completedCount / Math.max(1, totalNodes)) * 100));

          return (
            <div
              key={c.id}
              onClick={() => onSwitchCourse(c.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-3 ${
                isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{getLanguageFlag(c.target_language, c.regional_variant)}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{getLanguageLabel(c.target_language)}</span>
                      <Badge variant="indigo" size="sm">{c.cefr_level}</Badge>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {c.regional_variant} • {t('dash_explanations_in')} {c.explanation_language.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t('dash_active_badge')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchCourse(c.id);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                    >
                      {t('dash_activate_btn')}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar per course */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{completedCount} {t('dash_completed_lessons')}</span>
                  <span>{courseProgressPct}%</span>
                </div>
                <ProgressBar progress={courseProgressPct} variant={isCurrent ? 'indigo' : 'sky'} />
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {t('dash_goal_label')}: {c.daily_goal_minutes} min/dia
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCourseLesson(c);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer py-1"
                >
                  <span>{t('dash_study_now_btn')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
