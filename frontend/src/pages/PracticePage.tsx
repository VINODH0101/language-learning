import React, { useState, useEffect, useMemo } from 'react';
import { ExerciseTemplate, Language, VocabularyItem } from '../types';
import { contentAccess } from '../services/contentAccess';
import { VocabularyService } from '../services/vocabularyService';
import { StorageService } from '../services/storage';
import { getMistakes } from '../services/localDb';
import { useI18n } from '../i18n/i18nContext';

// Practice feature modules
import { PracticeSubMode, VocabDeckPartition } from '../features/practice/types';
import {
  getPracticeModeCount,
  getPracticeModeMeta,
} from '../features/practice/practiceModes';
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

  // One flat activity selection — no category + sub-mode double navigation.
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
  const [aiExercises, setAiExercises] = useState<ExerciseTemplate[]>([]);

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

    try {
      const publishedPractice = await contentAccess.getPublishedPracticeExercises(selectedLang);
      setAiExercises(publishedPractice);
    } catch {
      setAiExercises([]);
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
  // If cards are due, review due cards; otherwise provide all available words from Content Engine / Open APIs.
  const activeDeck: VocabularyItem[] = useMemo(() => {
    if (deckPartition.due.length > 0) {
      return deckPartition.due;
    }
    if (deckPartition.all.length > 0) {
      return deckPartition.all;
    }
    return VocabularyService.getVocabulary({ target_language: selectedLang }).map(v => ({
      id: v.id,
      language: v.target_language,
      lemma: v.lemma,
      part_of_speech: v.part_of_speech,
      cefr_level: v.cefr_level,
      definition_target:
        v.definitions[selectedLang] || v.definitions.en || v.translations.en || v.lemma,
      definition_en: v.definitions.en || v.translations.en || '',
      definition_pt: v.definitions.pt || v.translations.pt,
      definition_es: v.definitions.es || v.translations.es,
      phonetic_ipa: v.phonetic_ipa,
      regional_tags: ['all'],
      example_sentence_target: v.example_sentence_target,
      example_sentence_en: v.example_sentence_translations.en || '',
      collocations: v.collocations || [],
      attribution: v.attribution,
    }));
  }, [deckPartition, selectedLang]);

  // Exercise templates filtered strictly from published AI Content Engine exercises
  const langTemplates = useMemo(
    () => aiExercises.filter(e => e.language === selectedLang),
    [selectedLang, aiExercises]
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

  const counts = {
    srsDue: deckPartition.due.length,
    srsTotal: deckPartition.all.length,
    phrasebook: deckPartition.savedPhrasebook.length,
    multipleChoice: multipleChoiceTemplates.length,
    cloze: clozeTemplates.length,
    mistakes: mistakeCount,
  };

  const activeMode = getPracticeModeMeta(subMode);
  const ActiveModeIcon = activeMode.icon;
  const activeModeCount = getPracticeModeCount(activeMode, counts);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Editorial header with the language track switcher */}
      <PracticeHeader
        selectedLanguage={selectedLang}
        regionalVariety={track.regional_variety}
        onSelectLanguage={setSelectedLang}
      />

      {/* 2. One clear focus for today */}
      <PracticeDashboardSummary
        cefrLevel={track.current_cefr_level || 'B1'}
        dueCount={counts.srsDue}
        newCount={deckPartition.newWords.length}
        todayReviewed={todayReviewed}
        dailyTarget={dailyTarget}
        onQuickStart={() => setSubMode('srs')}
      />

      {/* 3. Activity menu + active practice */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
        <PracticeCategoryNav
          selectedMode={subMode}
          language={selectedLang}
          counts={counts}
          onSelectMode={setSubMode}
        />

        <section
          aria-label={t('practice:stage_aria', 'Active practice activity')}
          className="min-w-0 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                <ActiveModeIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-xl font-bold text-stone-900 leading-tight">
                  {t(activeMode.labelKey, activeMode.labelFallback)}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  {t(activeMode.descriptionKey, activeMode.descriptionFallback)}
                </p>
              </div>
            </div>

            {activeModeCount && (
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                  activeModeCount.urgent
                    ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                    : 'bg-white text-stone-500 border-stone-200'
                }`}
              >
                {activeModeCount.value}
              </span>
            )}
          </div>

          {/* Legacy activity modules are rendered on the light editorial theme here. */}
          <div className="practice-stage">
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

            {subMode === 'mistakes' && <MistakeNotebook language={selectedLang} />}

            {subMode === 'false_friends' && <FalseFriendsTrainer language={selectedLang} />}

            {subMode === 'listening' && <ListeningStudio language={selectedLang} />}

            {subMode === 'reading' && <ReadingStudio language={selectedLang} />}

            {subMode === 'speaking' && <SpeakingCoach language={selectedLang} />}

            {subMode === 'conversation' && <ConversationStudio language={selectedLang} />}

            {subMode === 'proofreading' && <WritingCoach language={selectedLang} />}

            {subMode === 'ocr' && <ScanAndLearn language={selectedLang} />}
          </div>
        </section>
      </div>
    </div>
  );
};
