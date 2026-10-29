import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ShieldCheck,
  Zap,
  Target,
  Compass,
  Plus,
  Layers,
  Globe,
  Check,
  Languages,
} from 'lucide-react';
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
} from '../types';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { StorageService } from '../services/storage';
import { getActiveProgress } from '../services/localDb';
import { courseService } from '../services/courseService';
import { CULTURAL_CATALOG } from '../data/cultureData';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { useI18n } from '../i18n/i18nContext';
import { toast } from 'sonner';

interface DashboardPageProps {
  onNavigateTab: (tab: 'portuguese' | 'spanish' | 'english' | 'vocabulary' | 'explore' | 'translate' | 'practice' | 'progress' | 'settings') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { t, interfaceLanguage } = useI18n();
  const [courses, setCourses] = useState<Course[]>(courseService.getCourses());
  const [activeCourse, setActiveCourse] = useState<Course>(() => {
    // If interface language matches an available course and no manual pin exists, prefer it
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
  const [newExplanationLang, setNewExplanationLang] = useState<ExplanationLanguage>(interfaceLanguage);
  const [newDailyGoal, setNewDailyGoal] = useState<number>(10);

  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(() => {
    try {
      const saved = localStorage.getItem('polyglot_session_duration');
      if (saved === '5' || saved === '10' || saved === '20') return saved;
    } catch {}
    return '10';
  });

  const handleSelectDuration = (d: SessionDuration) => {
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
  };

  useEffect(() => {
    const unsub = courseService.subscribe((all, active) => {
      setCourses(all);
      setActiveCourse(active);
    });
    return unsub;
  }, []);

  // When interfaceLanguage changes, auto-adapt active course if user has not manually pinned one
  useEffect(() => {
    try {
      const activeKey = `polyglot_active_course_${courseService.getUserId()}`;
      const pinned = localStorage.getItem(activeKey);
      if (!pinned) {
        const matching = courses.find(c => c.target_language === interfaceLanguage);
        if (matching && matching.id !== activeCourse.id) {
          courseService.setActiveCourse(matching.id);
          setActiveCourse(matching);
        }
      }
    } catch {}
  }, [interfaceLanguage, courses]);

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
  }, [activeCourse]);

  const handleSwitchCourse = (courseId: string) => {
    try {
      const switched = courseService.setActiveCourse(courseId);
      setActiveCourse(switched);
      const msg = interfaceLanguage === 'en'
        ? `Active course switched to ${getLanguageLabel(switched.target_language)} (${switched.cefr_level})`
        : interfaceLanguage === 'es'
        ? `Curso activo cambiado a ${getLanguageLabel(switched.target_language)} (${switched.cefr_level})`
        : `Curso ativo alterado para ${getLanguageLabel(switched.target_language)} (${switched.cefr_level})`;
      toast.success(msg);
    } catch {
      toast.error(interfaceLanguage === 'en' ? 'Error switching course.' : 'Erro ao alternar curso.');
    }
  };

  const handleOpenCourseLesson = (course: Course) => {
    courseService.setActiveCourse(course.id);
    if (course.target_language === 'en') onNavigateTab('english');
    else if (course.target_language === 'pt') onNavigateTab('portuguese');
    else onNavigateTab('spanish');
  };

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
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
      setActiveCourse(created);
      setIsAddCourseModalOpen(false);
      const msg = interfaceLanguage === 'en'
        ? `New ${getLanguageLabel(created.target_language)} course created successfully!`
        : interfaceLanguage === 'es'
        ? `¡Nuevo curso de ${getLanguageLabel(created.target_language)} creado con éxito!`
        : `Novo curso de ${getLanguageLabel(created.target_language)} adicionado com sucesso!`;
      toast.success(msg);
    } catch (err: any) {
      toast.error(err.message || (interfaceLanguage === 'en' ? 'Error creating course.' : 'Erro ao criar novo curso.'));
    }
  };

  const getLanguageLabel = (lang: Language) => {
    if (interfaceLanguage === 'en') {
      return lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : 'Spanish';
    }
    if (interfaceLanguage === 'es') {
      return lang === 'en' ? 'Inglés' : lang === 'pt' ? 'Portugués' : 'Español';
    }
    return lang === 'en' ? 'Inglês' : lang === 'pt' ? 'Português' : 'Espanhol';
  };

  const getLanguageFlag = (lang: Language, variant?: string) => {
    if (lang === 'en') return variant?.includes('GB') ? '🇬🇧' : '🇺🇸';
    if (lang === 'pt') return variant?.includes('PT') ? '🇵🇹' : '🇧🇷';
    if (lang === 'es') return variant?.includes('ES') ? '🇪🇸' : '🇲🇽';
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

  if (!activeLesson || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
        {t('dash_loading')}
      </div>
    );
  }

  const attempts = StorageService.getExerciseAttempts();
  const recentAttempts = attempts.slice(0, 5);
  const correctAttempts = attempts.filter(a => a.is_correct).length;
  const accuracyPct = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0;

  // Estimated completed today based on completed sections or attempts
  const estimatedElapsedTodayMinutes = activeLessonProgress ? Math.min(activeCourse.daily_goal_minutes, 6) : 2;
  const goalProgressPct = Math.min(100, Math.round((estimatedElapsedTodayMinutes / activeCourse.daily_goal_minutes) * 100));

  // Cultural content filtered dynamically by interface language (so English users see English content, etc.)
  const matchingArticles = CULTURAL_CATALOG.filter(a => a.content_language === interfaceLanguage);
  const explorePreviewArticles = (matchingArticles.length > 0 ? matchingArticles : CULTURAL_CATALOG).slice(0, 3);

  // Localized date formatting matching the user's interface language
  const dateLocale = interfaceLanguage === 'en' ? 'en-US' : interfaceLanguage === 'es' ? 'es-ES' : 'pt-BR';
  const todayFormatted = new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full overflow-x-hidden">
      {/* 1. WELCOME HEADER (Personalized greeting in interface language, active course chip, streak) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {t('dash_banner_badge')}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shadow-sm">
                <span>{getLanguageFlag(activeCourse.target_language, activeCourse.regional_variant)}</span>
                <span>{getLanguageLabel(activeCourse.target_language)}</span>
                <span className="text-slate-400 font-normal">({activeCourse.cefr_level})</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('dash_explanations_in')} {activeCourse.explanation_language.toUpperCase()}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {t('dash_greeting_prefix')}, {settings.full_name?.split(' ')[0] || 'Learner'}! {t('dash_greeting_suffix')}
            </h1>

            <p className="text-xs text-slate-400">
              {t('dash_today_is')} {todayFormatted}. {t('dash_continue_focus')} {activeCourse.cefr_level}.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-sm">
              <Flame className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-100">{activeCourse.streak_days} {t('dash_streak_days')}</div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">{t('dash_streak_title')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-sm">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-100">{dueSRSCount} {t('dash_srs_due_terms')}</div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">{t('dash_srs_due_title')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAILY LEARNING GOAL (Progress percentage, elapsed time, progress bar) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-200">{t('dash_goal_progress_title')}</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              ({activeCourse.daily_goal_minutes} {t('dash_goal_scheduled')})
            </span>
          </div>

          <span className="font-bold text-indigo-300">
            {estimatedElapsedTodayMinutes} {t('dash_goal_of')} {activeCourse.daily_goal_minutes} min ({goalProgressPct}%)
          </span>
        </div>

        <ProgressBar progress={goalProgressPct} variant="indigo" />

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{t('dash_goal_tip')}</span>
          <span className="font-semibold text-slate-300">
            {goalProgressPct >= 100
              ? t('dash_goal_achieved')
              : `${Math.max(0, activeCourse.daily_goal_minutes - estimatedElapsedTodayMinutes)} ${t('dash_goal_remaining')}`}
          </span>
        </div>
      </div>

      {/* 3. PROMINENT CONTINUE LEARNING CARD */}
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
            <span className="font-bold text-slate-100">{activeLesson.section_2_vocabulary.length} terms</span>
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

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 shadow-lg min-h-[48px] cursor-pointer transition-all duration-150"
          icon={<ArrowRight className="w-5 h-5" />}
          onClick={() => handleOpenCourseLesson(activeCourse)}
        >
          {activeLessonProgress
            ? t('dash_continue_lesson_btn')
            : `${t('dash_start_lesson_btn')} (${getLanguageLabel(activeCourse.target_language)})`}
        </Button>
      </div>

      {/* 4. COURSE OVERVIEW FOR PORTUGUESE, SPANISH, AND ENGLISH */}
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
            onClick={() => setIsAddCourseModalOpen(true)}
          >
            {t('dash_add_course_btn')}
          </Button>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {courses.map(c => {
            const isCurrent = c.id === activeCourse.id;
            const completedCount = c.completed_curriculum_node_ids?.length || c.total_lessons_completed || 0;
            const totalNodes = 24;
            const courseProgressPct = Math.min(100, Math.round((completedCount / totalNodes) * 100));

            return (
              <div
                key={c.id}
                onClick={() => handleSwitchCourse(c.id)}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchCourse(c.id);
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCourseLesson(c);
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

      {/* 5. DAILY SESSION-DURATION SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">
            {t('dash_daily_pace_title')}
          </span>
          <h3 className="text-sm font-bold text-slate-100">
            {t('dash_daily_pace_subtitle')}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSelectDuration('5')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition min-h-[44px] ${
              sessionDuration === '5'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('dash_sprint_5m')}</span>
          </button>

          <button
            onClick={() => handleSelectDuration('10')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition min-h-[44px] ${
              sessionDuration === '10'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-300" />
            <span>{t('dash_standard_10m')}</span>
          </button>

          <button
            onClick={() => handleSelectDuration('20')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition min-h-[44px] ${
              sessionDuration === '20'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-300" />
            <span>{t('dash_immersion_20m')}</span>
          </button>
        </div>
      </div>

      {/* 6. PRACTICE & REPETITION SUMMARIES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SRS Flashcards Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-sm text-slate-100">{t('dash_srs_card_title')}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {dueSRSCount > 0
                ? t('dash_srs_card_desc_due').replace('{count}', String(dueSRSCount))
                : t('dash_srs_card_desc_clean')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full min-h-[44px] text-xs cursor-pointer"
            onClick={() => onNavigateTab('practice')}
          >
            {t('dash_srs_card_btn')}
          </Button>
        </div>

        {/* Vocabulary Library Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-100">{t('dash_vocab_card_title')}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('dash_vocab_card_desc')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full min-h-[44px] text-xs text-indigo-300 border-indigo-700/50 hover:bg-indigo-950/40 cursor-pointer"
            onClick={() => onNavigateTab('vocabulary')}
          >
            {t('dash_vocab_card_btn')}
          </Button>
        </div>

        {/* Translation & False Friends */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">{t('dash_translate_card_title')}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('dash_translate_card_desc')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full min-h-[44px] text-xs cursor-pointer"
            onClick={() => onNavigateTab('translate')}
          >
            {t('dash_translate_card_btn')}
          </Button>
        </div>
      </div>

      {/* 7. RECENT LEARNING ACTIVITY */}
      <Card
        title={t('dash_recent_activity_title')}
        subtitle={`${t('dash_accuracy_rate')}: ${accuracyPct}% (${attempts.length} ${t('dash_attempts_registered')})`}
      >
        {recentAttempts.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            {t('dash_no_activity')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentAttempts.map(att => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs gap-3"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {att.is_correct ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-semibold text-slate-200 block truncate">
                      {t('dash_exercise_label')} {att.exercise_id}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block">{att.feedback}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 8. CULTURAL DISCOVERY PREVIEW (Filtered to user's interface language) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              {t('dash_cultural_title')}
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('explore')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer py-1"
          >
            <span>{t('dash_cultural_view_all')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {explorePreviewArticles.map(art => (
            <div
              key={art.id}
              onClick={() => onNavigateTab('explore')}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                    {art.origin_country}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 uppercase">
                    {art.content_language} • {art.cefr_level}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                  {art.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-indigo-400 flex items-center justify-between font-semibold">
                <span>{art.read_time_minutes} {t('dash_reading_time')}</span>
                <span className="flex items-center gap-0.5">
                  {t('dash_read_label')} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add New Course */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-base">{t('dash_add_modal_title')}</h3>
              </div>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">{t('dash_target_lang_label')}</label>
                <select
                  value={newTargetLang}
                  onChange={e => {
                    const l = e.target.value as Language;
                    setNewTargetLang(l);
                    if (l === 'en') setNewRegionalVariant('en-US');
                    else if (l === 'pt') setNewRegionalVariant('pt-BR');
                    else setNewRegionalVariant('es-ES');
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
                >
                  <option value="en">English (EN)</option>
                  <option value="pt">Português (PT)</option>
                  <option value="es">Español (ES)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">{t('dash_regional_variant_label')}</label>
                <select
                  value={newRegionalVariant}
                  onChange={e => setNewRegionalVariant(e.target.value as RegionalVariety)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
                >
                  {newTargetLang === 'en' && (
                    <>
                      <option value="en-US">American English (en-US)</option>
                      <option value="en-GB">British English (en-GB)</option>
                    </>
                  )}
                  {newTargetLang === 'pt' && (
                    <>
                      <option value="pt-BR">Português Brasileiro (pt-BR)</option>
                      <option value="pt-PT">Português Europeu (pt-PT)</option>
                    </>
                  )}
                  {newTargetLang === 'es' && (
                    <>
                      <option value="es-ES">Español Peninsular (es-ES)</option>
                      <option value="es-419">Español Latinoamericano (es-419)</option>
                      <option value="es-MX">Español Mexicano (es-MX)</option>
                      <option value="es-AR">Español Rioplatense (es-AR)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">{t('dash_cefr_label')}</label>
                  <select
                    value={newCefrLevel}
                    onChange={e => setNewCefrLevel(e.target.value as CEFRLevel)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
                  >
                    <option value="A1">A1 — {interfaceLanguage === 'en' ? 'Beginner' : 'Iniciante'}</option>
                    <option value="A2">A2 — {interfaceLanguage === 'en' ? 'Elementary' : 'Básico'}</option>
                    <option value="B1">B1 — {interfaceLanguage === 'en' ? 'Intermediate' : 'Intermediário'}</option>
                    <option value="B2">B2 — {interfaceLanguage === 'en' ? 'Independent' : 'Independente'}</option>
                    <option value="C1">C1 — {interfaceLanguage === 'en' ? 'Advanced' : 'Avançado'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">{t('dash_explanation_label')}</label>
                  <select
                    value={newExplanationLang}
                    onChange={e => setNewExplanationLang(e.target.value as ExplanationLanguage)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
                  >
                    <option value="en">English (EN)</option>
                    <option value="pt">Português (PT)</option>
                    <option value="es">Español (ES)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                >
                  {t('dash_cancel_btn')}
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-indigo-600 hover:bg-indigo-500">
                  {t('dash_create_course_btn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
