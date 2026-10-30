/**
 * Unified Course View Component — 4 Guided Learning Stages Architecture
 * 
 * Organizes daily lessons into 4 sequential stages:
 * - Stage 1: Learn (Vocabulary, Grammar, Definitions, Examples, Pronunciation)
 * - Stage 2: Understand (Reading, Listening, Comprehension)
 * - Stage 3: Use the Language (Speaking, Conversation, Writing)
 * - Stage 4: Test Yourself (Quizzes, Grammar exercises, False-friend challenges)
 * 
 * Seamlessly integrates Contextual Learning Panel (ContextualLookupWrapper)
 * allowing users to highlight any word for instant definitions, IPA, audio, and Dexie saving.
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
  HelpCircle,
  Volume2,
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
  const { t } = useI18n();
  const {
    lesson,
    activeTab,
    convView,
    isCompleted,
    selectTab,
    setConvView,
    markComplete,
  } = useCourse(language);

  // 4 Guided Learning Stages Definitions
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
        { id: 'exercises', label: t('learning:tab_exercises', 'Exercises & Quizzes'), icon: (props) => <CheckCircle {...props} className="w-4 h-4 text-emerald-400" /> },
        { id: 'false_friends', label: t('learning:tab_false_friends', 'False Friends'), icon: (props) => <AlertTriangle {...props} className="w-4 h-4 text-amber-400" /> },
        { id: 'resources', label: t('learning:tab_resources', 'External Resources'), icon: (props) => <ExternalLink {...props} /> },
      ],
    },
  ], [t]);

  // Compute active stage from active tab
  const activeStage = useMemo(() => {
    for (const stage of stages) {
      if (stage.tabs.some(t => t.id === activeTab)) {
        return stage;
      }
    }
    return stages[0];
  }, [stages, activeTab]);

  const handleStageSelect = (stage: StageMeta) => {
    // If current tab is already in that stage, keep it; otherwise select stage's first tab
    if (!stage.tabs.some(t => t.id === activeTab)) {
      selectTab(stage.tabs[0].id);
    }
  };

  const handleNextStage = () => {
    const nextIdx = activeStage.stageNumber; // 1-based index to 0-based next
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
    return <div className="p-8 text-center text-slate-400">{t('common:loading', 'Loading...')}</div>;
  }

  return (
    <ContextualLookupWrapper
      language={language}
      variety={lesson.regional_variety}
      explanationLanguage={lesson.explanation_language}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="emerald" size="sm">
                {t(`common:lang_${language}`, language.toUpperCase())} {lesson.cefr_level || 'C1'}
              </Badge>
              <Badge variant="slate" size="sm">
                {lesson.regional_variety}
              </Badge>
              {lesson.explanation_language && (
                <Badge variant="amber" size="sm">
                  {t('dashboard:explanations_in', 'Explanations')}: {lesson.explanation_language.toUpperCase()}
                </Badge>
              )}
              <span className="text-xs text-slate-400 font-mono">
                {lesson.lesson_date} • {lesson.estimated_study_minutes} {t('common:minutes', 'min')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{lesson.curriculum_topic_title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {lesson.section_1_objectives[0]?.can_do_statement}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Button
              variant={isCompleted ? 'secondary' : 'primary'}
              size="md"
              className={!isCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              icon={isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Award className="w-4 h-4" />}
              onClick={markComplete}
              disabled={isCompleted}
            >
              {isCompleted ? t('learning:completed_btn', 'Lesson Completed') : t('learning:complete_lesson_btn', "Complete Today's Lesson")}
            </Button>
          </div>
        </div>

        {/* 4 GUIDED LEARNING STAGES STEPPER */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {stages.map((stg) => {
              const isCurrent = activeStage.id === stg.id;
              const isPast = activeStage.stageNumber > stg.stageNumber;

              return (
                <button
                  key={stg.id}
                  onClick={() => handleStageSelect(stg)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isCurrent
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : isPast
                      ? 'bg-slate-900/90 border-emerald-900/60 hover:border-emerald-700 text-slate-300'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                  aria-label={`${t('learning:stage', 'Etapa')} ${stg.stageNumber}: ${stg.label}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isCurrent ? 'text-indigo-400' : isPast ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {t('learning:stage', 'Etapa')} {stg.stageNumber} / 4
                    </span>
                    {isPast && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-100">{stg.label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{stg.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Granular Sub-Tabs within Active Stage */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-xl bg-slate-900/80 border border-slate-800" role="tablist">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 shrink-0">
              {t('learning:stage_sections', 'Seções')} {activeStage.stageNumber}:
            </span>
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
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer min-h-[36px] ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.icon({ className: 'w-3.5 h-3.5' })}
                  <span>{tab.label}</span>
                  {count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip: Contextual Word Lookup */}
        <div className="px-4 py-2 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              <strong>Dica de Aprendizado:</strong> Selecione qualquer palavra no texto para ver tradução, pronúncia e salvá-la no seu vocabulário.
            </span>
          </div>
        </div>

        {/* Active Tab Panel */}
        <div className="pt-1" role="tabpanel">
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
            <div className="space-y-6">
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
                <button
                  onClick={() => setConvView('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    convView === 'daily'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('learning:tab_conv', 'Diálogo da Lição')}
                </button>
                <button
                  onClick={() => setConvView('scenarios')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    convView === 'scenarios'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('world:world_scenarios', 'Cenários do Mundo Real')}
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
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">
                  Interferência Linguística: Falsos Amigos Críticos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vocábulos com formas semelhantes mas sentidos divergentes que costumam induzir a erros.
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
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">
                  Recursos Abertos de Aprofundamento Cultural e Linguístico
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fontes primárias, áudios e portais culturais para complementar o estudo.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {lesson.section_12_further_resources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 block transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                        {res.title}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-300">{res.description}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STAGE STEPPER BOTTOM NAVIGATION */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {activeStage.stageNumber > 1 ? (
            <Button
              variant="outline"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={handlePrevStage}
            >
              {t('learning:prev_stage_btn', 'Etapa Anterior')} ({stages[activeStage.stageNumber - 2].label})
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
              {t('learning:next_stage_btn', 'Próxima')}: {stages[activeStage.stageNumber].label}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={markComplete}
              disabled={isCompleted}
            >
              {isCompleted ? t('learning:completed_btn', 'Lição Concluída!') : t('learning:complete_lesson_btn', 'Concluir Lição de Hoje')}
            </Button>
          )}
        </div>
      </div>
    </ContextualLookupWrapper>
  );
};
