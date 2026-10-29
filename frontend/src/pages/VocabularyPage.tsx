import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  FileDown,
  Sparkles,
  RotateCcw,
  Layers,
  Award,
  Globe,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Language, CEFRLevel } from '../types';
import {
  VocabularyEntry,
  EverydaySentenceEntry,
  VocabularyTopic,
  VocabularyPartOfSpeech,
  VocabularyFilterState,
} from '../types/vocabulary';
import { VocabularyService } from '../services/vocabularyService';
import { PageHeader } from '../components/common/PageHeader';
import { VocabularyCard } from '../components/vocabulary/VocabularyCard';
import { SentenceCard } from '../components/vocabulary/SentenceCard';
import { PracticeFlashcards } from '../components/vocabulary/PracticeFlashcards';
import { PracticeQuiz } from '../components/vocabulary/PracticeQuiz';
import { DownloadPdfDialog } from '../components/vocabulary/DownloadPdfDialog';
import { EmptyState } from '../components/common/EmptyState';
import { LiveDictionaryLookup } from '../components/vocabulary/LiveDictionaryLookup';
import { courseService } from '../services/courseService';
import { useI18n } from '../i18n/i18nContext';

export type VocabularyTab = 'top_200' | 'sentences' | 'topics' | 'practice' | 'live_dict';

export const VocabularyPage: React.FC = () => {
  const { t } = useI18n();
  const activeCourse = courseService.getActiveCourse();

  // Language settings (Independent)
  const [targetLang, setTargetLang] = useState<Language>(activeCourse.target_language || 'pt');
  const [explanationLang, setExplanationLang] = useState<Language>(activeCourse.explanation_language || 'en');
  const [activeTab, setActiveTab] = useState<VocabularyTab>('top_200');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState<CEFRLevel | 'all'>('all');
  const [selectedPos, setSelectedPos] = useState<VocabularyPartOfSpeech | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<VocabularyTopic | 'all'>('all');
  const [practiceMode, setPracticeMode] = useState<'flashcards' | 'quiz'>('flashcards');

  // PDF Dialog state
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  const availableTopics = useMemo(() => VocabularyService.getTopics(), []);
  const availablePos = useMemo(() => VocabularyService.getPartsOfSpeech(), []);
  const counts = useMemo(() => VocabularyService.getAvailableCounts(targetLang), [targetLang]);

  // Filtered Vocabulary
  const filteredVocabulary = useMemo(() => {
    const filterState: VocabularyFilterState = {
      target_language: targetLang,
      explanation_language: explanationLang,
      cefr_level: selectedCefr,
      part_of_speech: selectedPos,
      topic: selectedTopic,
      search_query: searchQuery,
      is_top_200: activeTab === 'top_200',
    };
    return VocabularyService.getVocabulary(filterState);
  }, [targetLang, explanationLang, selectedCefr, selectedPos, selectedTopic, searchQuery, activeTab]);

  // Filtered Sentences
  const filteredSentences = useMemo(() => {
    return VocabularyService.getSentences(targetLang, selectedTopic, selectedCefr, searchQuery);
  }, [targetLang, selectedTopic, selectedCefr, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCefr !== 'all' ||
    selectedPos !== 'all' ||
    selectedTopic !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCefr('all');
    setSelectedPos('all');
    setSelectedTopic('all');
  };

  const getTopicLabel = (topic: string) => {
    const map: Record<string, string> = {
      daily_life: 'Cotidiano',
      food_drink: 'Comida & Bebida',
      travel: 'Viagem & Lugares',
      work: 'Trabalho & Negócios',
      education: 'Educação',
      family: 'Família & Relações',
      health: 'Saúde & Emergências',
      shopping: 'Compras & Dinheiro',
      culture: 'Cultura & Tradição',
      technology: 'Tecnologia & Comunicação',
      social: 'Social & Conversação',
    };
    return map[topic] || topic;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header with Breadcrumbs, Metadata, Counts and Actions */}
      <PageHeader
        breadcrumbs={[
          { label: 'Início', onClick: () => {} },
          { label: 'Vocabulário & Frases', active: true },
        ]}
        title="Biblioteca de Vocabulário & Expressões"
        description="Aprenda vocabulário frequente, expressões autênticas e frases do cotidiano com explicações no seu idioma de preferência."
        targetLanguage={targetLang}
        explanationLanguage={explanationLang}
        cefrLevel={selectedCefr !== 'all' ? selectedCefr : 'A1–C1'}
        itemCount={activeTab === 'sentences' ? filteredSentences.length : filteredVocabulary.length}
        itemCountLabel={activeTab === 'sentences' ? 'Frases' : 'Vocábulos'}
        primaryAction={{
          label: 'Praticar com Flashcards',
          icon: <Sparkles className="w-4 h-4" />,
          onClick: () => setActiveTab('practice'),
        }}
        secondaryAction={{
          label: 'Baixar PDF',
          icon: <FileDown className="w-4 h-4 text-indigo-400" />,
          onClick: () => setIsPdfDialogOpen(true),
        }}
      />

      {/* Tabs Bar: Top 200 Words, Everyday Sentences, Topic Collections, Interactive Practice */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('top_200')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition min-h-[44px] cursor-pointer ${
            activeTab === 'top_200'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Top 200 Essenciais</span>
        </button>

        <button
          onClick={() => setActiveTab('sentences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition min-h-[44px] cursor-pointer ${
            activeTab === 'sentences'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Frases do Cotidiano</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/60 text-slate-200">
            {counts.sentences}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('topics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition min-h-[44px] cursor-pointer ${
            activeTab === 'topics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Coleções por Tema</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition min-h-[44px] cursor-pointer ${
            activeTab === 'practice'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Prática Interativa</span>
        </button>

        <button
          onClick={() => setActiveTab('live_dict')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition min-h-[44px] cursor-pointer ${
            activeTab === 'live_dict'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Dicionário Aberto & Free Dict</span>
        </button>
      </div>

      {/* Multi-Dimensional Language & Filter Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por termo, tradução, definição ou exemplo..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Target Language */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Idioma em Estudo</label>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value as Language)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="pt">Português (PT)</option>
              <option value="es">Español (ES)</option>
              <option value="en">English (EN)</option>
            </select>
          </div>

          {/* Explanation Language */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Idioma de Explicação</label>
            <select
              value={explanationLang}
              onChange={e => setExplanationLang(e.target.value as Language)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="pt">Português (PT)</option>
              <option value="es">Español (ES)</option>
            </select>
          </div>

          {/* CEFR Level */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Nível CEFR</label>
            <select
              value={selectedCefr}
              onChange={e => setSelectedCefr(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="all">Todos os Níveis</option>
              <option value="A1">A1 — Principiante</option>
              <option value="A2">A2 — Básico</option>
              <option value="B1">B1 — Intermediário</option>
              <option value="B2">B2 — Independente</option>
              <option value="C1">C1 — Avançado</option>
            </select>
          </div>

          {/* Part of Speech or Topic */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">
              {activeTab === 'sentences' ? 'Tema' : 'Classe Gramatical'}
            </label>
            {activeTab === 'sentences' ? (
              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
              >
                <option value="all">Todos os Temas</option>
                {availableTopics.map(t => (
                  <option key={t} value={t}>
                    {getTopicLabel(t)}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedPos}
                onChange={e => setSelectedPos(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
              >
                <option value="all">Todas as Classes</option>
                {availablePos.map(p => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              Filtros ativos aplicados.
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Viewport Content based on Active Tab */}
      {activeTab === 'live_dict' ? (
        <LiveDictionaryLookup targetLang={targetLang} />
      ) : activeTab === 'practice' ? (
        <div className="space-y-6">
          {/* Practice Mode Switcher */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPracticeMode('flashcards')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${
                practiceMode === 'flashcards'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cartões de Memória (Flashcards)
            </button>
            <button
              onClick={() => setPracticeMode('quiz')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${
                practiceMode === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Teste de Múltipla Escolha
            </button>
          </div>

          {practiceMode === 'flashcards' ? (
            <PracticeFlashcards
              entries={filteredVocabulary}
              explanationLanguage={explanationLang}
            />
          ) : (
            <PracticeQuiz
              entries={filteredVocabulary}
              explanationLanguage={explanationLang}
            />
          )}
        </div>
      ) : activeTab === 'sentences' ? (
        /* Everyday Sentences Grid */
        filteredSentences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSentences.map(sent => (
              <SentenceCard
                key={sent.id}
                sentence={sent}
                explanationLanguage={explanationLang}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma frase encontrada"
            description="Nenhuma frase do cotidiano corresponde aos critérios de pesquisa selecionados."
            actionLabel="Limpar Filtros"
            onAction={handleResetFilters}
          />
        )
      ) : (
        /* Top 200 Words & Topic Collections Grid */
        filteredVocabulary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVocabulary.map(entry => (
              <VocabularyCard
                key={entry.id}
                entry={entry}
                explanationLanguage={explanationLang}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum vocábulo encontrado"
            description="Não encontramos palavras com os filtros atuais. Altere o nível CEFR ou o termo de busca."
            actionLabel="Redefinir Filtros"
            onAction={handleResetFilters}
          />
        )
      )}

      {/* Customizable PDF Download Modal Dialog */}
      <DownloadPdfDialog
        isOpen={isPdfDialogOpen}
        onClose={() => setIsPdfDialogOpen(false)}
        initialTargetLang={targetLang}
        initialExplanationLang={explanationLang}
        initialCefr={selectedCefr}
      />
    </div>
  );
};
