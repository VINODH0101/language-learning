import React, { useState, useEffect } from 'react';
import {
  Language,
  UserTrackState,
  DiagnosticResult,
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

  // Active language track defaults to the user's active course or 'pt'
  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    try {
      const active = courseService.getActiveCourse();
      return active ? active.target_language : 'pt';
    } catch {
      return 'pt';
    }
  });

  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeNotebookItem[]>([]);
  const [culturalBookmarks, setCulturalBookmarks] = useState<CulturalBookmarkRecord[]>([]);

  // Load language-scoped learning data (Zero cross-language contamination)
  const track: UserTrackState = StorageService.getTrackState(selectedLang);
  const activeCourse = courseService.getCourseForLanguage(selectedLang);
  const curriculum = courseService.getCurriculumForLanguage(selectedLang);
  const attempts = StorageService.getExerciseAttempts(selectedLang);
  const srsItems = StorageService.getSRSItems(selectedLang);
  const diagnostics = StorageService.getDiagnosticResults().filter(d => d.language === selectedLang);
  const latestDiagnostic = diagnostics.length > 0 ? diagnostics[0] : null;

  // Real activity telemetry
  const activitySummary = activityService.getLanguageActivitySummary(selectedLang);
  const activePoem: DailyPoem | null = dailyContentService.getDailyPoem(selectedLang);
  const activeConversation: DailyConversation | null = dailyContentService.getDailyConversation(selectedLang);

  // Check if diagnostic questions exist for selected language
  const hasDiagnosticAvailable = diagnosticQuestions.some(q => q.language === selectedLang);

  // Load mistakes and cultural bookmarks asynchronously
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

  // Derived Genuine Metrics (Zero fabricated statistics)
  const totalCompleted = track.completed_curriculum_node_ids.length;
  const totalCurriculumNodes = curriculum.length;
  const completionPct =
    totalCurriculumNodes > 0 ? Math.round((totalCompleted / totalCurriculumNodes) * 100) : 0;

  const correctAttempts = attempts.filter(a => a.is_correct).length;
  const accuracyPct = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0;
  const failedAttempts = attempts.filter(a => !a.is_correct);

  // SM-2 distribution
  const presentedCount = srsItems.filter(s => s.mastery_status === 'presented').length;
  const learningCount = srsItems.filter(s => s.mastery_status === 'learning').length;
  const reviewingCount = srsItems.filter(s => s.mastery_status === 'reviewing').length;
  const masteredCount = srsItems.filter(s => s.mastery_status === 'mastered').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const dueSRSCount = srsItems.filter(s => s.next_review_date <= todayStr).length;

  const todayStudyMinutes = StorageService.getTodayStudyMinutes();
  const streakDays = activeCourse?.streak_days || track.streak_days || 1;

  const handleNavigatePractice = () => {
    if (onNavigateTab) {
      onNavigateTab('practice');
    }
  };

  const handleNavigateExplore = () => {
    if (onNavigateTab) {
      onNavigateTab('explore');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* 1. Progress Header & Multi-Language Track Selector */}
      <ProgressHeader
        selectedLang={selectedLang}
        onSelectLang={setSelectedLang}
        track={track}
        activeCourse={activeCourse}
        onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
        hasDiagnosticAvailable={hasDiagnosticAvailable}
      />

      {/* 2. Compact Overview KPI Metrics Grid (Language Scoped) */}
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

      {/* 3. Vocabulary Retention SM-2 Distribution & Queue */}
      <VocabularyRetentionCard
        presentedCount={presentedCount}
        learningCount={learningCount}
        reviewingCount={reviewingCount}
        masteredCount={masteredCount}
        dueCount={dueSRSCount}
        onNavigatePractice={handleNavigatePractice}
      />

      {/* 4. Sequential CEFR Curriculum Roadmap (A1 to C1) */}
      <CEFRRoadmap
        curriculum={curriculum}
        completedNodeIds={track.completed_curriculum_node_ids}
        currentNodeId={track.current_curriculum_node_id}
        selectedLanguage={selectedLang}
      />

      {/* 5. Exercise Performance & Accuracy Analytics (Language Scoped) */}
      <ExercisePerformanceCard
        attempts={attempts}
        selectedLanguage={selectedLang}
      />

      {/* 6. Skill Development & Linguistic Competencies */}
      <SkillDevelopmentCard
        skillActivityCounts={activitySummary.skillActivityCounts}
      />

      {/* 7. Daily Literature (Poetry) & Communicative Dialogue Progress */}
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

      {/* 8. Global Discovery & Cultural Exploration (Decoupled from CEFR) */}
      <CulturalDiscoveryCard
        exploredCountriesCount={activitySummary.countriesExploredCount}
        totalAvailableCountries={250}
        bookmarkedArticlesCount={culturalBookmarks.length}
        readArticlesCount={activitySummary.skillActivityCounts.reading}
        onNavigateExplore={handleNavigateExplore}
      />

      {/* 9. Weak Areas, Actionable Recommendations & Mistake Notebook */}
      <WeakAreasCard
        mistakes={mistakes}
        failedAttempts={failedAttempts}
        dueSRSCount={dueSRSCount}
        selectedLanguage={selectedLang}
        onNavigatePractice={handleNavigatePractice}
      />

      {/* 10. Diagnostic Placement Evaluation Summary */}
      <DiagnosticSummaryCard
        latestResult={latestDiagnostic}
        history={diagnostics}
        selectedLanguage={selectedLang}
        onTakeDiagnostic={() => setIsDiagnosticOpen(true)}
        hasQuestionsAvailable={hasDiagnosticAvailable}
      />

      {/* Diagnostic Placement Test Modal */}
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
