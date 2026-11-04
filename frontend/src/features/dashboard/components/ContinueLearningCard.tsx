import React from 'react';
import { ArrowRight, BookOpen, PlayCircle, Compass, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ProgressBar } from '../../../components/common/ProgressBar';
import {
  Course,
  DailyLessonPayload,
  ActiveLessonProgress,
  Language,
  RegionalVariety,
} from '../../../types';
import { useI18n } from '../../../i18n/i18nContext';
import { courseService } from '../../../services/courseService';
import { getLanguageName } from '../../../lib/languages/languageMatrix';
import { ContinueItemData } from '../services/homeOrchestrator';

interface ContinueLearningCardProps {
  activeCourse: Course;
  activeLesson?: DailyLessonPayload | null;
  activeLessonProgress?: ActiveLessonProgress | null;
  continueItem?: ContinueItemData | null;
  onOpenLesson?: (course: Course) => void;
  onContinue?: (item: ContinueItemData) => void;
  onExploreCatalog?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  activeCourse,
  activeLesson,
  activeLessonProgress,
  continueItem,
  onOpenLesson,
  onContinue,
  onExploreCatalog,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const getLanguageLabel = (lang: Language) => {
    return getLanguageName(lang, (interfaceLanguage as any) || 'en');
  };

  const getLanguageFlag = (lang: Language, variant?: RegionalVariety) => {
    if (lang === 'en') return variant?.includes('GB') ? '🇬🇧' : '🇺🇸';
    if (lang === 'pt') return variant?.includes('PT') ? '🇵🇹' : '🇧🇷';
    if (lang === 'es') return variant?.includes('ES') ? '🇪🇸' : '🇲🇽';
    return '🌐';
  };

  // Section Loading Skeleton (only if neither continueItem nor activeLesson is available yet)
  if (isLoading && !continueItem && !activeLesson) {
    return (
      <section
        aria-label="Continue Learning"
        className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5 animate-pulse"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100" />
            <div className="space-y-1.5">
              <div className="w-24 h-3 bg-stone-100 rounded" />
              <div className="w-36 h-3 bg-stone-100 rounded" />
            </div>
          </div>
          <div className="w-14 h-6 bg-stone-100 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="w-2/3 h-7 bg-stone-100 rounded" />
          <div className="w-full h-4 bg-stone-100 rounded" />
        </div>
        <div className="w-full h-2 bg-stone-100 rounded" />
        <div className="w-36 h-10 bg-stone-100 rounded-xl" />
      </section>
    );
  }

  // Section Error State
  if (isError && !continueItem && !activeLesson) {
    return (
      <section
        aria-label="Continue Learning"
        className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-serif font-bold text-stone-900">
              {t('dashboard:error_continue_title', 'Unable to load active lesson')}
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              {errorMessage || t('dashboard:error_continue_desc', 'A temporary error occurred while retrieving your learning progress.')}
            </p>
          </div>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('common:retry', 'Retry')}
          </Button>
        )}
      </section>
    );
  }

  // Determine effective data: prioritize continueItem if provided, else use activeLesson
  const itemType = continueItem?.type || (activeLesson ? 'curriculum' : 'empty');

  // Dynamic Curriculum Progression stats
  const totalCurriculumNodes = courseService.getCurriculumTotalNodes(
    activeCourse.target_language,
    activeCourse.cefr_level
  );
  const completedNodesCount =
    activeCourse.completed_curriculum_node_ids?.length ||
    activeCourse.total_lessons_completed ||
    0;
  const curriculumProgressPct = Math.min(
    100,
    Math.round((completedNodesCount / Math.max(1, totalCurriculumNodes)) * 100)
  );

  // 1. Exact edition recovery state
  if (continueItem && continueItem.type === 'recovery') {
    return (
      <section
        aria-label="Continue Learning"
        className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 block">
              {t('dash_resume_lesson_title', 'Resume Reading')}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              {t('dashboard:continue_recovery_title', 'Exact Edition Unavailable')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5 max-w-2xl leading-relaxed">
              {continueItem.reason === 'version_mismatch'
                ? t(
                    'dashboard:continue_recovery_mismatch',
                    'The saved edition does not match the content item. Your progress is preserved and will not be reopened in a different edition.'
                  )
                : t(
                    'dashboard:continue_recovery_missing',
                    'The edition you were reading is no longer available. Your progress is preserved, but another version will not be opened automatically.'
                  )}
            </p>
            {continueItem.item && (
              <p className="text-xs text-stone-500 mt-2">
                {continueItem.item.title}
                {continueItem.requestedVersionId
                  ? ` • ${t('dashboard:continue_recovery_version', 'Requested edition')}: ${continueItem.requestedVersionId}`
                  : ''}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="md"
          className="w-full sm:w-auto min-h-[44px]"
          icon={<Compass className="w-4 h-4" />}
          onClick={() => onExploreCatalog && onExploreCatalog()}
        >
          {t('dashboard:browse_library_btn', 'Explore Library')}
        </Button>
      </section>
    );
  }

  // 2. Unfinished authentic story
  if (continueItem && continueItem.type === 'story') {
    const { item, version, progress } = continueItem;
    const pct = Math.min(100, Math.max(0, Math.round(progress.percent_complete || 0)));
    const storyLevel = version.cefr_level || item.primary_cefr;
    const isLevelMismatched = storyLevel && storyLevel !== activeCourse.cefr_level;

    return (
      <section
        aria-label="Continue Learning"
        className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-bold text-sm shrink-0">
              <BookOpen className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 block">
                {t('dash_resume_lesson_title', 'Resume Reading')}
              </span>
              <span className="text-xs text-stone-500">
                {t('dash_active_course', 'Active Language')}: {getLanguageFlag(activeCourse.target_language, activeCourse.regional_variant)} {getLanguageLabel(activeCourse.target_language)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="slate" size="md">
              {storyLevel}
            </Badge>
            {isLevelMismatched && (
              <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                {t('dashboard:resumed_level', 'Resumed Level')}
              </span>
            )}
            <Badge variant="indigo" size="md">
              {item.genre.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
            {item.title}
          </h2>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed max-w-3xl">
            {item.summary || 'Continue reading authentic literature with contextual sentence lookup and glossing.'}
          </p>
        </div>

        {/* Reading progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs text-stone-500">
            <span>{t('dashboard:reading_progress_label', 'Reading Progress')}</span>
            <span className="font-semibold text-stone-900">{pct}%</span>
          </div>
          <ProgressBar progress={pct} variant="bronze" />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto min-h-[44px]"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => {
            if (onContinue) onContinue(continueItem);
            else if (onExploreCatalog) onExploreCatalog();
          }}
        >
          {t('dash_continue_lesson_btn', 'Continue Reading')}
        </Button>
      </section>
    );
  }

  // 2. Structured daily curriculum lesson
  if (itemType === 'curriculum' && (continueItem?.type === 'curriculum' ? continueItem.lesson : activeLesson)) {
    const lesson = continueItem?.type === 'curriculum' ? continueItem.lesson : activeLesson!;
    const isResume = Boolean(continueItem?.type === 'curriculum' ? continueItem.progress : activeLessonProgress);

    return (
      <section
        aria-label="Continue Learning"
        className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-900 border border-stone-200 flex items-center justify-center font-bold text-sm shrink-0">
              <PlayCircle className="w-5 h-5 text-stone-800" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 block">
                {isResume
                  ? t('dash_resume_lesson_title', 'Resume Reading')
                  : t('dash_next_lesson_title', 'Next Lesson of the Day')}
              </span>
              <span className="text-xs text-stone-500">
                {t('dash_active_course', 'Active Language')}: {getLanguageFlag(activeCourse.target_language, activeCourse.regional_variant)} {getLanguageLabel(activeCourse.target_language)} • CEFR {activeCourse.cefr_level}
              </span>
            </div>
          </div>

          <Badge variant="slate" size="md">
            {activeCourse.cefr_level}
          </Badge>
        </div>

        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
            {lesson.curriculum_topic_title}
          </h2>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed max-w-3xl">
            {lesson.section_1_objectives[0]?.can_do_statement ||
              'Develop receptive and productive language mastery with authentic structures.'}
          </p>
        </div>

        {/* Lesson metrics breakdown */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-semibold">
              {t('dash_vocab_stat', 'Vocabulary')}
            </span>
            <span className="font-bold text-stone-900">
              {t('dashboard:vocab_terms_count', '{{count}} terms', {
                count: lesson.section_2_vocabulary?.length || 0,
              })}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-semibold">
              {t('dash_grammar_stat', 'Grammar')}
            </span>
            <span className="font-bold text-stone-900 truncate block">
              {lesson.section_3_grammar?.category || 'Syntax & Morphology'}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-semibold">
              {t('dash_time_stat', 'Pace')}
            </span>
            <span className="font-bold text-stone-900">
              {lesson.estimated_study_minutes || 10} min
            </span>
          </div>
        </div>

        {/* Dynamic Curriculum Progression */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs text-stone-500">
            <span>
              {t('dashboard:curriculum_units_completed', '{{completed}} of {{total}} curriculum units completed', {
                completed: completedNodesCount,
                total: totalCurriculumNodes,
              })}
            </span>
            <span className="font-semibold text-stone-800">{curriculumProgressPct}%</span>
          </div>
          <ProgressBar progress={curriculumProgressPct} variant="bronze" />
        </div>

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto min-h-[44px]"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => {
            if (continueItem && onContinue) onContinue(continueItem);
            else if (onOpenLesson) onOpenLesson(activeCourse);
          }}
        >
          {isResume
            ? t('dash_continue_lesson_btn', 'Continue Reading')
            : `${t('dash_start_lesson_btn', 'Start Reading')} (${getLanguageLabel(activeCourse.target_language)})`}
        </Button>
      </section>
    );
  }

  // 3. Recommended published content
  if (continueItem && continueItem.type === 'recommended') {
    const { item, version } = continueItem;

    return (
      <section
        aria-label="Continue Learning"
        className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-900 border border-stone-200 flex items-center justify-center font-bold text-sm shrink-0">
              <Compass className="w-5 h-5 text-stone-800" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 block">
                {t('dashboard:recommended_reading', 'Recommended Reading')}
              </span>
              <span className="text-xs text-stone-500">
                {getLanguageFlag(activeCourse.target_language, activeCourse.regional_variant)} {getLanguageLabel(activeCourse.target_language)} • {item.estimated_read_minutes} min read
              </span>
            </div>
          </div>

          <Badge variant="slate" size="md">
            {version?.cefr_level || item.primary_cefr}
          </Badge>
        </div>

        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
            {item.title}
          </h2>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed max-w-3xl">
            {item.summary}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto min-h-[44px]"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => {
            if (onContinue) onContinue(continueItem);
            else if (onExploreCatalog) onExploreCatalog();
          }}
        >
          {t('dashboard:start_reading_btn', 'Start Reading')}
        </Button>
      </section>
    );
  }

  // 4. Empty State
  return (
    <section
      aria-label="Continue Learning"
      className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4"
    >
      <BookOpen className="w-10 h-10 mx-auto text-stone-300" />
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-900">
          {t('dashboard:no_active_story', 'No active story in progress')}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto">
          {t('dashboard:explore_library_subhead', 'Explore the library of authentic short stories, dialogues, and cultural readings.')}
        </p>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={() => onExploreCatalog && onExploreCatalog()}
        icon={<Compass className="w-4 h-4" />}
      >
        {t('dashboard:browse_library_btn', 'Explore Library')}
      </Button>
    </section>
  );
};