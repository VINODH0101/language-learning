import React, { useState, useEffect } from 'react';
import { BookMarked, Compass, Target } from 'lucide-react';
import {
  Language,
  UserTrackState,
  MistakeNotebookItem,
  DailyPoem,
  DailyConversation,
} from '../types';
import { StorageService } from '../services/storage';
import { courseService } from '../services/courseService';
import { activityService } from '../services/activityService';
import { dailyContentService } from '../services/dailyContentService';
import { getMistakes, getCulturalBookmarks, CulturalBookmarkRecord } from '../services/localDb';
import { diagnosticQuestions } from '../data/seedData';
import { useI18n } from '../i18n/i18nContext';
import { PlacementTestModal } from '../components/diagnostic/PlacementTestModal';

import {
  ProgressHeader,
  LearningOverviewGrid,
  CEFRRoadmap,
  VocabularyRetentionCard,
  ExercisePerformanceCard,
  SkillDevelopmentCard,
  DailyContentProgressCard,
  CulturalDiscoveryCard,
  WeakAreasCard,
  DiagnosticSummaryCard,
} from '../features/progress/components';

type ProgressFocusView = 'path' | 'diagnostics' | 'immersion';

interface ProgressPageProps {
  onNavigateTab?: (
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

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigateTab }) => {
  const { t } = useI18n();

  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    try {
      const active = courseService.getActiveCourse();
      return active ? active.target_language : 'pt';
    } catch {
      return 'pt';
    }
  });

  const [focusView, setFocusView] = useState<ProgressFocusView>('path');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeNotebookItem[]>([]);
  const [culturalBookmarks, setCulturalBookmarks] = useState<CulturalBookmarkRecord[]>([]);

  // Language-scoped learning state
  const track: UserTrackState = StorageService.getTrackState(selectedLang);
  const activeCourse = courseService.getCourseForLanguage(selectedLang);
  const curriculum = courseService.getCurriculumForLanguage(selectedLang);
  const attempts = StorageService.getExerciseAttempts(selectedLang);
  const srsItems = StorageService.getSRSItems(selectedLang);
  const diagnostics = StorageService.getDiagnosticResults().filter(d => d.language === selectedLang);
  const latestDiagnostic = diagnostics.length > 0 ? diagnostics[0] : null;

  const activitySummary = activityService.getLanguageActivitySummary(selectedLang);
  const activePoem: DailyPoem | null = dailyContentService.getDailyPoem(selectedLang);
  const activeConversation: DailyConversation | null = dailyContentService.getDailyConversation(selectedLang);

  const hasDiagnosticAvailable = diagnosticQuestions.some(q => q.language === selectedLang);

  useEffect(() => {
    let isCancelled = false;
    getMistakes(selectedLang).then(res => {
      if (!isCancelled) setMistakes(res || []);
    });
    getCulturalBookmarks(StorageService.getCurrentUser()).then(res => {
      if (!isCancelled) setCulturalBookmarks(res || []);
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedLang]);

  // Derived metrics (strictly from real records)
  const totalCompleted = track.completed_curriculum_node_ids.length;
  const totalCurriculumNodes = curriculum.length;
  const completionPct =
    totalCurriculumNodes > 0 ? Math.round((totalCompleted / totalCurriculumNodes) * 100) : 0;

  const correctAttempts = attempts.filter(a => a.is_correct).length;
  const accuracyPct = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0;
  const failedAttempts = attempts.filter(a => !a.is_correct);

  const presentedCount = srsItems.filter(s => s.mastery_status === 'presented').length;
  const learningCount = srsItems.filter(s => s.mastery_status === 'learning').length;
  const reviewingCount = srsItems.filter(s => s.mastery_status === 'reviewing').length;
  const masteredCount = srsItems.filter(s => s.mastery_status === 'mastered').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const dueSRSCount = srsItems.filter(s => s.next_review_date <= todayStr).length;

  const todayStudyMinutes = StorageService.getTodayStudyMinutes();
  const streakDays = activeCourse?.streak_days || track.streak_days || 1;
  const attentionCount = mistakes.length + failedAttempts.length;

  const handleNavigatePractice = () => {
    onNavigateTab?.('practice');
  };

  const handleNavigateExplore = () => {
    onNavigateTab?.('explore');
  };

  const views: Array<{
    id: ProgressFocusView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'path',
      label: t('progress:tab_path_vocab', 'Path & Memory'),
      icon: BookMarked,
      badge: dueSRSCount > 0 ? dueSRSCount : undefined,
    },
    {
      id: 'diagnostics',
      label: t('progress:tab_diagnostics_skills', 'Focus & Skills'),
      icon: Target,
      badge: attentionCount > 0 ? attentionCount : undefined,
    },
    {
      id: 'immersion',
      label: t('progress:tab_immersion_placement', 'Immersion & Placement'),
      icon: Compass,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* 1. Editorial header with language track switcher */}
      <ProgressHeader
        selectedLang={selectedLang}
        onSelectLang={setSelectedLang}
        track={track}
        activeCourse={activeCourse}
        onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
        hasDiagnosticAvailable={hasDiagnosticAvailable}
      />

      {/* 2. Calm snapshot */}
      <LearningOverviewGrid
        currentCefr={track.current_cefr_level}
        targetCefr={track.target_cefr_level}
        totalCompletedNodes={totalCompleted}
        totalCurriculumNodes={totalCurriculumNodes}
        completionPct={completionPct}
        totalAttempts={attempts.length}
        correctAttempts={correctAttempts}
        accuracyPct={accuracyPct}
        masteredVocabCount={masteredCount}
        todayStudyMinutes={todayStudyMinutes}
        streakDays={streakDays}
      />

      {/* 3. Focused View Switcher — reduces cognitive overload from 8 simultaneous cards to 2–3 cohesive views */}
      <div className="space-y-5">
        <div
          role="tablist"
          aria-label={t('progress:progress_view_aria', 'Progress analytics views')}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white border border-stone-200 p-1.5 rounded-2xl shadow-xs w-full sm:w-fit"
        >
          {views.map(view => {
            const Icon = view.icon;
            const isSelected = focusView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setFocusView(view.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer min-h-[40px] flex-1 sm:flex-none justify-center ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-stone-400'}`} />
                <span>{view.label}</span>
                {typeof view.badge === 'number' && view.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-200'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {view.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Focused Panel 1: Path & Memory (Default) */}
        {focusView === 'path' && (
          <div className="space-y-5 animate-fadeIn">
            <VocabularyRetentionCard
              presentedCount={presentedCount}
              learningCount={learningCount}
              reviewingCount={reviewingCount}
              masteredCount={masteredCount}
              dueCount={dueSRSCount}
              onNavigatePractice={onNavigateTab ? handleNavigatePractice : undefined}
            />
            <CEFRRoadmap
              curriculum={curriculum}
              completedNodeIds={track.completed_curriculum_node_ids}
              currentNodeId={track.current_curriculum_node_id}
              selectedLanguage={selectedLang}
            />
          </div>
        )}

        {/* Focused Panel 2: Weak Areas, Exercises & Skills */}
        {focusView === 'diagnostics' && (
          <div className="space-y-5 animate-fadeIn">
            <WeakAreasCard
              mistakes={mistakes}
              failedAttempts={failedAttempts}
              dueSRSCount={dueSRSCount}
              selectedLanguage={selectedLang}
              onNavigatePractice={onNavigateTab ? handleNavigatePractice : undefined}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <ExercisePerformanceCard attempts={attempts} selectedLanguage={selectedLang} />
              <SkillDevelopmentCard skillActivityCounts={activitySummary.skillActivityCounts} />
            </div>
          </div>
        )}

        {/* Focused Panel 3: Daily Literature, World Discovery & Placement */}
        {focusView === 'immersion' && (
          <div className="space-y-5 animate-fadeIn">
            <DailyContentProgressCard
              selectedLanguage={selectedLang}
              activePoem={activePoem}
              activeConversation={activeConversation}
              poemsCompletedCount={activitySummary.poetryCompletedCount}
              poemsListenedCount={activitySummary.poetryListenedCount}
              conversationsCompletedCount={activitySummary.conversationCompletedCount}
              conversationsListenedCount={activitySummary.conversationListenedCount}
              recentDailyActivities={activitySummary.recentActivities}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <CulturalDiscoveryCard
                exploredCountriesCount={activitySummary.countriesExploredCount}
                totalAvailableCountries={250}
                bookmarkedArticlesCount={culturalBookmarks.length}
                readArticlesCount={activitySummary.skillActivityCounts.reading}
                onNavigateExplore={onNavigateTab ? handleNavigateExplore : undefined}
              />
              <DiagnosticSummaryCard
                latestResult={latestDiagnostic}
                history={diagnostics}
                selectedLanguage={selectedLang}
                onTakeDiagnostic={() => setIsDiagnosticOpen(true)}
                hasQuestionsAvailable={hasDiagnosticAvailable}
              />
            </div>
          </div>
        )}
      </div>

      {/* Placement Diagnostic Modal */}
      <PlacementTestModal
        language={selectedLang}
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onComplete={() => {
          setIsDiagnosticOpen(false);
        }}
      />
    </div>
  );
};

export default ProgressPage;
