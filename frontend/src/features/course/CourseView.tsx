/**
 * Unified Course View Component — 4 Guided Learning Stages Architecture
 * 
 * Organizes daily lessons into 4 sequential stages:
 * - Stage 1: Learn (Vocabulary, Grammar, Definitions, Examples, Pronunciation)
 * - Stage 2: Understand (Reading, Listening, Comprehension)
 * - Stage 3: Use the Language (Speaking, Conversation, Writing)
 * - Stage 4: Test Yourself (Quizzes, Grammar exercises, False-friend challenges)
 */

import React, { useMemo } from 'react';
import {
  BookOpen,
  FileText,
  MessageSquare,
  Mic,
  PenTool,
  Headphones,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Award,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../types';
import { useCourse, SectionTab } from './useCourse';
import { VocabularySection } from '../../components/lesson/VocabularySection';
import { GrammarSection } from '../../components/lesson/GrammarSection';
import { ReadingSection } from '../../components/lesson/ReadingSection';
import { ConversationSection } from '../../components/lesson/ConversationSection';
import { SpeakingSection } from '../../components/lesson/SpeakingSection';
import { WritingSection } from '../../components/lesson/WritingSection';
import { ListeningSection } from '../../components/lesson/ListeningSection';
import { ExerciseSection } from '../../components/lesson/ExerciseSection';
import { FalseFriendCard } from '../../components/lesson/FalseFriendCard';
import { ScenariosSection } from '../../components/lesson/ScenariosSection';
import { ContextualLookupWrapper } from '../../components/common/ContextualWordPopover';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../i18n/i18nContext';
import { Badge } from '../../components/common/Badge';
import { getLanguageName } from '../../lib/languages/languageMatrix';

export interface CourseViewProps {
  language: Language;
}

export type LearningStage =
  | 'stage_1_learn'
  | 'stage_2_understand'
  | 'stage_3_use'
  | 'stage_4_test';

interface StageMeta {
  id: LearningStage;
  stageNumber: number;
  label: string;
  subtitle: string;
  tabs: { id: SectionTab; label: string; icon: (props: any) => React.ReactNode }[];
}

export const CourseView: React.FC<CourseViewProps> = ({ language }) => {
  const { t, interfaceLanguage } = useI18n();
  const {
    lesson,
    activeTab,
    convView,
    isCompleted,
    selectTab,
    setConvView,
    markComplete,
  } = useCourse(language);

  // 4 Guided Learning Stages
  const stages: StageMeta[] = useMemo(() => [
    {
      id: 'stage_1_learn',
      stageNumber: 1,
      label: t('learning:stage1_title', '1. Learn'),
      subtitle: t('learning:stage1_subtitle', 'Vocabulary, Grammar & Rules'),
      tabs: [
        { id: 'vocab', label: t('learning:tab_vocab', 'Essential Lexicon'), icon: (props) => <BookOpen {...props} /> },
        { id: 'grammar', label: t('learning:tab_grammar', 'Grammar Formula'), icon: (props) => <FileText {...props} /> },
      ],
    },
    {
      id: 'stage_2_understand',
      stageNumber: 2,
      label: t('learning:stage2_title', '2. Understand'),
      subtitle: t('learning:stage2_subtitle', 'Reading, Audio & Dialogue'),
      tabs: [
        { id: 'reading', label: t('learning:tab_reading', 'Reading & Culture'), icon: (props) => <BookOpen {...props} /> },
        { id: 'listening', label: t('learning:tab_listening', 'Listening Comprehension'), icon: (props) => <Headphones {...props} /> },
      ],
    },
    {
      id: 'stage_3_use',
      stageNumber: 3,
      label: t('learning:stage3_title', '3. Use the Language'),
      subtitle: t('learning:stage3_subtitle', 'Speaking, Conversation & Writing'),
      tabs: [
        { id: 'speaking', label: t('learning:tab_speaking', 'Speaking & Audio'), icon: (props) => <Mic {...props} /> },
        { id: 'conv', label: t('learning:tab_conv', 'Authentic Dialogue'), icon: (props) => <MessageSquare {...props} /> },
        { id: 'writing', label: t('learning:tab_writing', 'Writing Practice'), icon: (props) => <PenTool {...props} /> },
      ],
    },
    {
      id: 'stage_4_test',
      stageNumber: 4,
      label: t('learning:stage4_title', '4. Test Yourself'),
      subtitle: t('learning:stage4_subtitle', 'Exercises, False Friends & Resources'),
      tabs: [
        { id: 'exercises', label: t('learning:tab_exercises', 'Exercises & Quizzes'), icon: (props) => <CheckCircle {...props} /> },
        { id: 'false_friends', label: t('learning:tab_false_friends', 'False Friends'), icon: (props) => <AlertTriangle {...props} /> },
        { id: 'resources', label: t('learning:tab_resources', 'External Resources'), icon: (props) => <ExternalLink {...props} /> },
      ],
    },
  ], [t]);

  const activeStage = useMemo(() => {
    for (const stage of stages) {
      if (stage.tabs.some(tb => tb.id === activeTab)) {
        return stage;
      }
    }
    return stages[0];
  }, [stages, activeTab]);

  const handleStageSelect = (stage: StageMeta) => {
    if (!stage.tabs.some(tb => tb.id === activeTab)) {
      selectTab(stage.tabs[0].id);
    }
  };

  const handleNextStage = () => {
    const nextIdx = activeStage.stageNumber;
    if (nextIdx < stages.length) {
      selectTab(stages[nextIdx].tabs[0].id);
    }
  };

  const handlePrevStage = () => {
    const prevIdx = activeStage.stageNumber - 2;
    if (prevIdx >= 0) {
      selectTab(stages[prevIdx].tabs[0].id);
    }
  };

  if (!lesson) {
    return (
      <div className="p-8 text-center text-stone-500 text-sm">
        {t('common:loading', 'Loading...')}
      </div>
    );
  }

  return (
    <ContextualLookupWrapper
      language={language}
      variety={lesson.regional_variety}
      explanationLanguage={lesson.explanation_language}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Editorial Lesson Header */}
        <header className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/80">
                {getLanguageName(language, interfaceLanguage as any)} {lesson.cefr_level || 'C1'}
              </span>
              <Badge variant="slate" size="sm">
                {lesson.regional_variety}
              </Badge>
              {lesson.explanation_language && (
                <Badge variant="emerald" size="sm">
                  {t('dashboard:explanations_in', 'Explanations in')}: {lesson.explanation_language.toUpperCase()}
                </Badge>
              )}
              <span className="text-xs text-stone-500 font-mono">
                {lesson.lesson_date} • {lesson.estimated_study_minutes} min
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
              {lesson.curriculum_topic_title}
            </h1>
            {lesson.section_1_objectives[0]?.can_do_statement && (
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
                {lesson.section_1_objectives[0].can_do_statement}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <Button
              variant={isCompleted ? 'secondary' : 'primary'}
              size="md"
              className={!isCompleted ? 'w-full md:w-auto justify-center min-h-[44px]' : 'w-full md:w-auto justify-center min-h-[44px]'}
              icon={isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-700" /> : <Award className="w-4 h-4" />}
              onClick={markComplete}
              disabled={isCompleted}
            >
              {isCompleted ? t('learning:completed_btn', 'Lesson Completed') : t('learning:complete_lesson_btn', "Complete Today's Lesson")}
            </Button>
          </div>
        </header>

        {/* 4 GUIDED LEARNING STAGES STEPPER */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {stages.map((stg) => {
              const isCurrent = activeStage.id === stg.id;
              const isPast = activeStage.stageNumber > stg.stageNumber;

              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => handleStageSelect(stg)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : isPast
                      ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300 text-stone-800'
                      : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                  aria-label={`${stg.stageNumber}: ${stg.label}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isCurrent ? 'text-amber-300' : isPast ? 'text-emerald-700' : 'text-stone-400'
                      }`}
                    >
                      {stg.stageNumber} / 4
                    </span>
                    {isPast && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                  </div>
                  <div className={`font-serif font-bold text-sm ${isCurrent ? 'text-white' : 'text-stone-900'}`}>
                    {stg.label}
                  </div>
                  <div className={`text-[11px] truncate mt-0.5 ${isCurrent ? 'text-stone-300' : 'text-stone-500'}`}>
                    {stg.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Granular Sub-Tabs within Active Stage */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-xl bg-white border border-stone-200" role="tablist">
            {activeStage.tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count =
                tab.id === 'vocab'
                  ? lesson.section_2_vocabulary.length
                  : tab.id === 'exercises'
                  ? lesson.section_9_exercises.length
                  : undefined;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer min-h-[38px] ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {tab.icon({ className: `w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-400'}` })}
                  <span>{tab.label}</span>
                  {count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-amber-500/20 text-amber-200' : 'bg-stone-100 text-stone-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiet Lookup Tip */}
        <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-stone-700 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>
            {t(
              'learning:course_lookup_tip',
              'Select or click any word in the lesson to view instant translation, IPA audio, and save it to My Words.'
            )}
          </span>
        </div>

        {/* Active Tab Panel wrapped in editorial bridge for legacy lesson subcomponents */}
        <div className="pt-1 practice-stage" role="tabpanel">
          {activeTab === 'vocab' && (
            <VocabularySection
              vocabulary={lesson.section_2_vocabulary}
              language={language}
              variety={lesson.regional_variety}
            />
          )}

          {activeTab === 'grammar' && (
            <GrammarSection
              grammar={lesson.section_3_grammar}
              language={language}
              variety={lesson.regional_variety}
            />
          )}

          {activeTab === 'reading' && (
            <ReadingSection
              reading={lesson.section_4_reading}
              language={language}
              variety={lesson.regional_variety}
            />
          )}

          {activeTab === 'conv' && (
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setConvView('daily')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    convView === 'daily'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t('learning:tab_conv', 'Authentic Dialogue')}
                </button>
                <button
                  type="button"
                  onClick={() => setConvView('scenarios')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    convView === 'scenarios'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t('world:world_scenarios', 'Real-World Scenarios')}
                </button>
              </div>
              {convView === 'daily' ? (
                <ConversationSection
                  conversation={lesson.section_5_conversation}
                  language={language}
                  variety={lesson.regional_variety}
                />
              ) : (
                <ScenariosSection language={language} variety={lesson.regional_variety} />
              )}
            </div>
          )}

          {activeTab === 'speaking' && (
            <SpeakingSection
              speaking={lesson.section_6_speaking}
              language={language}
              variety={lesson.regional_variety}
            />
          )}

          {activeTab === 'writing' && (
            <WritingSection
              writing={lesson.section_7_writing}
              language={language}
            />
          )}

          {activeTab === 'listening' && (
            <ListeningSection
              listening={lesson.section_8_listening}
              language={language}
              variety={lesson.regional_variety}
            />
          )}

          {activeTab === 'exercises' && (
            <ExerciseSection
              exercises={lesson.section_9_exercises}
              answerKeys={lesson.section_10_answer_keys}
              language={language}
            />
          )}

          {activeTab === 'false_friends' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  {t('learning:false_friends_heading', 'Linguistic Interference: Critical False Cognates')}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  {t('practice:false_friends_subtitle', 'Compare cognates that diverge in everyday usage.')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.false_friend_alerts.map(item => (
                  <FalseFriendCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  {t('learning:open_resources_heading', 'Open Cultural & Linguistic Resources')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {lesson.section_12_further_resources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 block transition-all group shadow-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-stone-900 group-hover:text-amber-800">
                        {res.title}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                    </div>
                    <p className="text-xs text-stone-600">{res.description}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STAGE STEPPER BOTTOM NAVIGATION */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
          {activeStage.stageNumber > 1 ? (
            <Button
              variant="outline"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={handlePrevStage}
            >
              {t('learning:prev_stage_btn', 'Previous Stage')} ({stages[activeStage.stageNumber - 2].label})
            </Button>
          ) : (
            <div />
          )}

          {activeStage.stageNumber < 4 ? (
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handleNextStage}
            >
              {t('learning:next_stage_btn', 'Next Stage')}: {stages[activeStage.stageNumber].label}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={markComplete}
              disabled={isCompleted}
            >
              {isCompleted ? t('learning:completed_btn', 'Lesson Completed') : t('learning:complete_lesson_btn', "Complete Today's Lesson")}
            </Button>
          )}
        </div>
      </div>
    </ContextualLookupWrapper>
  );
};
