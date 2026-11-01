import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  HelpCircle,
  PenTool,
  BookOpen,
  CheckCircle2,
  Filter,
  Mic,
  Headphones,
  Camera,
  MessageSquare,
  Bookmark,
  Feather,
} from 'lucide-react';
import { Language, VocabularyItem, ExerciseTemplate } from '../types';
import {
  ptVocabulary,
  esVocabulary,
  enVocabulary,
  exerciseTemplates,
} from '../data/seedData';
import { StorageService } from '../services/storage';
import { getMistakes } from '../services/localDb';
import { useI18n } from '../i18n/i18nContext';

// Practice feature modules
import { PracticeCategory, PracticeSubMode, VocabDeckPartition } from '../features/practice/types';
import { practiceVocabService } from '../features/practice/services/practiceVocabService';
import { PracticeHeader } from '../features/practice/components/PracticeHeader';
import { PracticeDashboardSummary } from '../features/practice/components/PracticeDashboardSummary';
import { PracticeCategoryNav } from '../features/practice/components/PracticeCategoryNav';
import { DailyPoetryPracticeCard } from '../features/practice/components/DailyPoetryPracticeCard';
import { SavedPhrasebookPracticeCard } from '../features/practice/components/SavedPhrasebookPracticeCard';

// Practice modes
import { FlashcardDeck } from '../components/practice/FlashcardDeck';
import { ExerciseSection } from '../components/lesson/ExerciseSection';
import { MistakeNotebook } from '../components/practice/MistakeNotebook';
import { FalseFriendsTrainer } from '../components/practice/FalseFriendsTrainer';
import { WritingCoach } from '../features/writing/WritingCoach';
import { SpeakingCoach } from '../features/speaking/SpeakingCoach';
import { ListeningStudio } from '../features/listening/ListeningStudio';
import { ReadingStudio } from '../features/reading/ReadingStudio';
import { ScanAndLearn } from '../features/ocr/ScanAndLearn';
import { ConversationStudio } from '../features/conversation/ConversationStudio';

export const PracticePage: React.FC = () => {
  const { t } = useI18n();

  // Selected language track
  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    try {
      const activeTrack = StorageService.getSettings()?.primary_target_language;
      return activeTrack || 'pt';
    } catch {
      return 'pt';
    }
  });

  // Categorized navigation state
  const [category, setCategory] = useState<PracticeCategory>('all');
  const [subMode, setSubMode] = useState<PracticeSubMode>('srs');

  // Vocabulary Deck Partitions
  const [deckPartition, setDeckPartition] = useState<VocabDeckPartition>({
    due: [],
    newWords: [],
    mastered: [],
    savedPhrasebook: [],
    all: [],
  });

  const [mistakeCount, setMistakeCount] = useState<number>(0);

  // Load vocabulary deck partition and mistake count on language change
  const refreshData = async () => {
    const partition = await practiceVocabService.getDeckPartition(selectedLang);
    setDeckPartition(partition);

    try {
      const mistakes = await getMistakes(selectedLang);
      setMistakeCount(mistakes.length);
    } catch {
      setMistakeCount(0);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedLang]);

  // Track state & settings
  const track = useMemo(() => StorageService.getTrackState(selectedLang), [selectedLang]);
  const settings = useMemo(() => StorageService.getSettings(), []);
  const todayReviewed = practiceVocabService.getTodayReviewCount(selectedLang);
  const dailyTarget = settings.study_mode === 'compact' ? 10 : 20;

  // Active deck selection:
  // If cards are due, review due cards; otherwise provide all available words so new learners can start immediately.
  const activeDeck: VocabularyItem[] = useMemo(() => {
    if (deckPartition.due.length > 0) {
      return deckPartition.due;
    }
    if (deckPartition.all.length > 0) {
      return deckPartition.all;
    }
    // Fallback seed vocabulary
    return selectedLang === 'pt'
      ? ptVocabulary
      : selectedLang === 'es'
      ? esVocabulary
      : enVocabulary;
  }, [deckPartition, selectedLang]);

  // Exercise templates filtered strictly by target language
  const langTemplates = useMemo(
    () => exerciseTemplates.filter(e => e.language === selectedLang),
    [selectedLang]
  );

  const multipleChoiceTemplates = useMemo(
    () => langTemplates.filter(e => e.exercise_type === 'multiple_choice'),
    [langTemplates]
  );

  const clozeTemplates = useMemo(
    () =>
      langTemplates.filter(
        e => e.exercise_type === 'cloze' || e.exercise_type === 'error_correction'
      ),
    [langTemplates]
  );

  // Navigation handlers
  const handleSelectCategory = (newCat: PracticeCategory, newSub?: PracticeSubMode) => {
    setCategory(newCat);
    if (newSub) {
      setSubMode(newSub);
    } else {
      // Default sub-mode per category
      if (newCat === 'vocabulary') setSubMode('srs');
      else if (newCat === 'exercises') setSubMode('multiple_choice');
      else if (newCat === 'receptive') setSubMode('listening');
      else if (newCat === 'productive') setSubMode('speaking');
      else if (newCat === 'tools') setSubMode('ocr');
    }
  };

  const handleSelectSubMode = (newSub: PracticeSubMode) => {
    setSubMode(newSub);
  };

  const handleQuickStart = () => {
    setCategory('vocabulary');
    setSubMode('srs');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Practice Header with Language Matrix & Variety Pill */}
      <PracticeHeader
        selectedLanguage={selectedLang}
        regionalVariety={track.regional_variety}
        onSelectLanguage={setSelectedLang}
      />

      {/* 2. Practice Dashboard Summary Banner */}
      <PracticeDashboardSummary
        language={selectedLang}
        cefrLevel={track.current_cefr_level || 'B1'}
        dueCount={deckPartition.due.length}
        newCount={deckPartition.newWords.length}
        todayReviewed={todayReviewed}
        dailyTarget={dailyTarget}
        onQuickStart={handleQuickStart}
        onSelectCategory={handleSelectCategory}
      />

      {/* 3. Categorized Practice Navigation */}
      <PracticeCategoryNav
        selectedCategory={category}
        selectedSubMode={subMode}
        language={selectedLang}
        counts={{
          srsDue: deckPartition.due.length,
          srsTotal: deckPartition.all.length,
          phrasebook: deckPartition.savedPhrasebook.length,
          multipleChoice: multipleChoiceTemplates.length,
          cloze: clozeTemplates.length,
          mistakes: mistakeCount,
        }}
        onSelectCategory={handleSelectCategory}
        onSelectSubMode={handleSelectSubMode}
      />

      {/* 4. Active Practice Viewport */}
      <div className="pt-2">
        {/* Vocabulary Cluster */}
        {subMode === 'srs' && (
          <FlashcardDeck
            vocabularyList={activeDeck}
            dailyTarget={dailyTarget}
            onReviewFinished={refreshData}
          />
        )}

        {subMode === 'phrasebook' && (
          <SavedPhrasebookPracticeCard language={selectedLang} />
        )}

        {subMode === 'daily_poetry_vocab' && (
          <DailyPoetryPracticeCard language={selectedLang} onAddedToDeck={refreshData} />
        )}

        {/* Exercises Cluster */}
        {subMode === 'multiple_choice' && (
          <ExerciseSection
            exercises={multipleChoiceTemplates.map(t => ({
              id: t.id,
              exercise_type: t.exercise_type,
              prompt: t.prompt,
              context_passage: t.context_passage,
              options: [t.acceptable_solutions[0], ...t.distractors.map(d => d.text)].sort(),
              hint: t.hint,
              distractor_explanations: Object.fromEntries(
                t.distractors.map(d => [d.text, d.why_incorrect])
              ),
            }))}
            answerKeys={multipleChoiceTemplates.map(t => ({
              exercise_id: t.id,
              acceptable_solutions: t.acceptable_solutions,
              explanation: t.explanation,
              distractor_feedback: Object.fromEntries(
                t.distractors.map(d => [d.text, d.why_incorrect])
              ),
            }))}
            language={selectedLang}
          />
        )}

        {subMode === 'cloze' && (
          <ExerciseSection
            exercises={clozeTemplates.map(t => ({
              id: t.id,
              exercise_type: t.exercise_type,
              prompt: t.prompt,
              context_passage: t.context_passage,
              hint: t.hint,
            }))}
            answerKeys={clozeTemplates.map(t => ({
              exercise_id: t.id,
              acceptable_solutions: t.acceptable_solutions,
              explanation: t.explanation,
            }))}
            language={selectedLang}
          />
        )}

        {subMode === 'mistakes' && (
          <MistakeNotebook language={selectedLang} />
        )}

        {subMode === 'false_friends' && (
          <FalseFriendsTrainer language={selectedLang} />
        )}

        {/* Receptive Cluster */}
        {subMode === 'listening' && (
          <ListeningStudio language={selectedLang} />
        )}

        {subMode === 'reading' && (
          <ReadingStudio language={selectedLang} />
        )}

        {/* Productive Cluster */}
        {subMode === 'speaking' && (
          <SpeakingCoach language={selectedLang} />
        )}

        {subMode === 'conversation' && (
          <ConversationStudio language={selectedLang} />
        )}

        {subMode === 'proofreading' && (
          <WritingCoach language={selectedLang} />
        )}

        {/* Tools Cluster */}
        {subMode === 'ocr' && (
          <ScanAndLearn language={selectedLang} />
        )}
      </div>
    </div>
  );
};
