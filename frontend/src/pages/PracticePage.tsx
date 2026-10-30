import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  PenTool,
  BookOpen,
  CheckCircle2,
  Filter,
  Wand2,
  Mic,
  Headphones,
  Camera,
  MessageSquare,
} from 'lucide-react';
import { Language, VocabularyItem, ExerciseTemplate } from '../types';
import { ptVocabulary, esVocabulary, enVocabulary, exerciseTemplates, curatedMaterials } from '../data/seedData';
import { StorageService } from '../services/storage';
import { FlashcardDeck } from '../components/practice/FlashcardDeck';
import { ExerciseSection } from '../components/lesson/ExerciseSection';
import { ReadingSection } from '../components/lesson/ReadingSection';
import { MistakeNotebook } from '../components/practice/MistakeNotebook';
import { FalseFriendsTrainer } from '../components/practice/FalseFriendsTrainer';
import { LanguageToolStudio } from '../components/practice/LanguageToolStudio';
import { WritingCoach } from '../features/writing/WritingCoach';
import { SpeakingCoach } from '../features/speaking/SpeakingCoach';
import { ListeningStudio } from '../features/listening/ListeningStudio';
import { ReadingStudio } from '../features/reading/ReadingStudio';
import { ScanAndLearn } from '../features/ocr/ScanAndLearn';
import { ConversationStudio } from '../features/conversation/ConversationStudio';
import { Badge } from '../components/common/Badge';
import { useI18n } from '../i18n/i18nContext';

type PracticeMode =
  | 'srs'
  | 'listening'
  | 'reading'
  | 'speaking'
  | 'conversation'
  | 'proofreading'
  | 'ocr'
  | 'multiple_choice'
  | 'cloze'
  | 'mistakes'
  | 'false_friends';

export const PracticePage: React.FC = () => {
  const { t } = useI18n();
  const [selectedLang, setSelectedLang] = useState<Language>('pt');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('srs');

  // Filter vocabulary for SRS deck
  const vocabPool =
    selectedLang === 'pt'
      ? ptVocabulary
      : selectedLang === 'es'
      ? esVocabulary
      : enVocabulary;
  const srsItems = StorageService.getSRSItems(selectedLang);
  const today = new Date().toISOString().split('T')[0];
  const dueItems = srsItems.filter(s => s.next_review_date <= today);
  const dueIds = new Set(dueItems.map(s => s.vocabulary_item_id));

  // If due items exist, review those; otherwise provide full review pool
  const activeDeck: VocabularyItem[] = dueItems.length > 0
    ? vocabPool.filter(v => dueIds.has(v.id))
    : vocabPool;

  // Filter exercises
  const langTemplates = exerciseTemplates.filter(e => e.language === selectedLang);
  const multipleChoiceTemplates = langTemplates.filter(e => e.exercise_type === 'multiple_choice');
  const clozeTemplates = langTemplates.filter(e => e.exercise_type === 'cloze' || e.exercise_type === 'error_correction');

  // Reading material
  const readingMat = curatedMaterials.find(m => m.language === selectedLang && m.material_type === 'reading_passage') || curatedMaterials[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {t('practice:title', 'Centro de Treinamento e Consolidação')}
            </span>
            <Badge variant="sky" size="sm">
              {t('common:active', 'Treino Ativo')}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{t('practice:title', 'Prática e Recordação Espaçada')}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t('practice:subtitle', 'Pratique com exercícios determinísticos, flashcards de retenção SM-2 e interpretação de texto.')}
          </p>
        </div>

        {/* Language Track Toggle */}
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setSelectedLang('pt')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedLang === 'pt'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Português (PT)
          </button>
          <button
            onClick={() => setSelectedLang('es')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedLang === 'es'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Español (ES)
          </button>
          <button
            onClick={() => setSelectedLang('en')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedLang === 'en'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English (EN)
          </button>
        </div>
      </div>

      {/* Practice Mode Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        <button
          onClick={() => setPracticeMode('srs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'srs'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{t('practice:tab_sm2', 'Cartões SM-2')} ({activeDeck.length})</span>
        </button>

        <button
          onClick={() => setPracticeMode('listening')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'listening'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Headphones className="w-4 h-4 text-indigo-400" />
          <span>Listening Studio</span>
        </button>

        <button
          onClick={() => setPracticeMode('reading')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'reading'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Reading Studio</span>
        </button>

        <button
          onClick={() => setPracticeMode('speaking')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'speaking'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Mic className="w-4 h-4 text-purple-400" />
          <span>Speaking Coach</span>
        </button>

        <button
          onClick={() => setPracticeMode('conversation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'conversation'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <span>Conversation Studio</span>
        </button>

        <button
          onClick={() => setPracticeMode('proofreading')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'proofreading'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4 text-teal-400" />
          <span>Writing Coach</span>
        </button>

        <button
          onClick={() => setPracticeMode('ocr')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'ocr'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Scan & Learn (OCR)</span>
        </button>

        <button
          onClick={() => setPracticeMode('multiple_choice')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'multiple_choice'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Múltipla Escolha ({multipleChoiceTemplates.length})</span>
        </button>

        <button
          onClick={() => setPracticeMode('cloze')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'cloze'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4 text-emerald-400" />
          <span>Lacunas e Correção ({clozeTemplates.length})</span>
        </button>

        <button
          onClick={() => setPracticeMode('mistakes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'mistakes'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-rose-400" />
          <span>Caderno de Erros</span>
        </button>

        <button
          onClick={() => setPracticeMode('false_friends')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            practiceMode === 'false_friends'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Filter className="w-4 h-4 text-amber-400" />
          <span>Treinador Falsos Cognatos</span>
        </button>
      </div>

      {/* Practice Viewports */}
      <div className="pt-2">
        {practiceMode === 'srs' && (
          <FlashcardDeck vocabularyList={activeDeck} />
        )}

        {practiceMode === 'listening' && (
          <ListeningStudio language={selectedLang} />
        )}

        {practiceMode === 'reading' && (
          <ReadingStudio language={selectedLang} />
        )}

        {practiceMode === 'speaking' && (
          <SpeakingCoach language={selectedLang} />
        )}

        {practiceMode === 'conversation' && (
          <ConversationStudio language={selectedLang} />
        )}

        {practiceMode === 'proofreading' && (
          <WritingCoach language={selectedLang} />
        )}

        {practiceMode === 'ocr' && (
          <ScanAndLearn language={selectedLang} />
        )}

        {practiceMode === 'multiple_choice' && (
          <ExerciseSection
            exercises={multipleChoiceTemplates.map(t => ({
              id: t.id,
              exercise_type: t.exercise_type,
              prompt: t.prompt,
              context_passage: t.context_passage,
              options: [t.acceptable_solutions[0], ...t.distractors.map(d => d.text)].sort(),
              hint: t.hint,
              distractor_explanations: Object.fromEntries(t.distractors.map(d => [d.text, d.why_incorrect])),
            }))}
            answerKeys={multipleChoiceTemplates.map(t => ({
              exercise_id: t.id,
              acceptable_solutions: t.acceptable_solutions,
              explanation: t.explanation,
              distractor_feedback: Object.fromEntries(t.distractors.map(d => [d.text, d.why_incorrect])),
            }))}
            language={selectedLang}
          />
        )}

        {practiceMode === 'cloze' && (
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

        {practiceMode === 'mistakes' && (
          <MistakeNotebook language={selectedLang} />
        )}

        {practiceMode === 'false_friends' && (
          <FalseFriendsTrainer language={selectedLang} />
        )}
      </div>
    </div>
  );
};
