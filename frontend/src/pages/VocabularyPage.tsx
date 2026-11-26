import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  FileDown,
  Sparkles,
  RotateCcw,
  Layers,
  Globe,
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
import { contentAccess } from '../services/contentAccess';
import { PageHeader } from '../components/common/PageHeader';
import { VocabularyCard } from '../components/vocabulary/VocabularyCard';
import { SentenceCard } from '../components/vocabulary/SentenceCard';
import { PracticeFlashcards } from '../components/vocabulary/PracticeFlashcards';
import { PracticeQuiz } from '../components/vocabulary/PracticeQuiz';
import { DownloadPdfDialog } from '../components/vocabulary/DownloadPdfDialog';
import { EmptyState } from '../components/common/EmptyState';
import { VocabularyExplorer } from '../features/vocabulary/VocabularyExplorer';
import { courseService } from '../services/courseService';
import { getLanguageName } from '../lib/languages/languageMatrix';
import { useI18n } from '../i18n/i18nContext';

export type VocabularyTab = 'top_200' | 'sentences' | 'topics' | 'practice' | 'live_dict';

export const VocabularyPage: React.FC = () => {
  const { t, interfaceLanguage } = useI18n();
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
  const [showFilters, setShowFilters] = useState(false);

  // PDF Dialog state
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [aiVocabEntries, setAiVocabEntries] = useState<VocabularyEntry[]>([]);

  useEffect(() => {
    let active = true;
    contentAccess
      .getPublishedVocabularyEntries(targetLang, explanationLang)
      .then(entries => {
        if (active) setAiVocabEntries(entries);
      })
      .catch(() => {
        if (active) setAiVocabEntries([]);
      });
    return () => {
      active = false;
    };
  }, [targetLang, explanationLang]);

  const availableTopics = useMemo(() => VocabularyService.getTopics(), []);
  const availablePos = useMemo(() => VocabularyService.getPartsOfSpeech(), []);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    VocabularyService.loadLiveCatalog(targetLang, explanationLang, searchQuery)
      .then(() => {
        if (!cancelled) setLiveRefreshTick(n => n + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [targetLang, explanationLang, searchQuery]);

  const counts = useMemo(
    () => VocabularyService.getAvailableCounts(targetLang),
    [targetLang, liveRefreshTick]
  );

  // Filtered Vocabulary (published AI entries + live VocabularyService catalog)
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
    const base = VocabularyService.getVocabulary(filterState);
    if (aiVocabEntries.length === 0) return base;
    const q = searchQuery.trim().toLowerCase();
    const filteredAi = aiVocabEntries.filter(v => {
      if (selectedCefr !== 'all' && v.cefr_level !== selectedCefr) return false;
      if (selectedPos !== 'all' && v.part_of_speech !== selectedPos) return false;
      if (selectedTopic !== 'all' && v.topic !== selectedTopic) return false;
      if (q && !v.lemma.toLowerCase().includes(q)) return false;
      return true;
    });
    const seen = new Set(filteredAi.map(v => v.lemma.toLowerCase()));
    return [...filteredAi, ...base.filter(v => !seen.has(v.lemma.toLowerCase()))];
  }, [targetLang, explanationLang, selectedCefr, selectedPos, selectedTopic, searchQuery, activeTab, aiVocabEntries, liveRefreshTick]);

  // Filtered Sentences
  const filteredSentences = useMemo(() => {
    return VocabularyService.getSentences(targetLang, selectedTopic, selectedCefr, searchQuery);
  }, [targetLang, selectedTopic, selectedCefr, searchQuery, liveRefreshTick]);

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
    return t(`learning:vocab_topic_${topic}`, topic);
  };

  const activeFilterCount =
    (selectedCefr !== 'all' ? 1 : 0) +
    (selectedPos !== 'all' ? 1 : 0) +
    (selectedTopic !== 'all' ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: t('learning:vocab_breadcrumb_root', 'Home'), onClick: () => {} },
          { label: t('learning:vocab_breadcrumb_current', 'Vocabulary & Phrases'), active: true },
        ]}
        title={t('learning:vocab_title', 'Vocabulary & Expressions Library')}
        description={t(
          'learning:vocab_description',
          'Learn high-frequency vocabulary, authentic idioms, and everyday sentences with explanations in your preferred language.'
        )}
        targetLanguage={targetLang}
        explanationLanguage={explanationLang}
        cefrLevel={selectedCefr !== 'all' ? selectedCefr : 'A1–C1'}
        itemCount={activeTab === 'sentences' ? filteredSentences.length : filteredVocabulary.length}
        itemCountLabel={
          activeTab === 'sentences'
            ? t('learning:vocab_count_sentences', 'Sentences')
            : t('learning:vocab_count_words', 'Words')
        }
        primaryAction={{
          label: t('learning:vocab_action_flashcards', 'Practice with Flashcards'),
          icon: <Sparkles className="w-4 h-4" />,
          onClick: () => setActiveTab('practice'),
        }}
        secondaryAction={{
          label: t('learning:vocab_action_pdf', 'Download PDF'),
          icon: <FileDown className="w-4 h-4 text-amber-700" />,
          onClick: () => setIsPdfDialogOpen(true),
        }}
      />

      {/* Unified Calm Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white border border-stone-200 p-1.5 rounded-2xl shadow-xs">
        {[
          { id: 'top_200' as const, label: t('learning:vocab_tab_top200', 'Top 200 Essentials'), icon: BookOpen },
          { id: 'sentences' as const, label: t('learning:vocab_tab_sentences', 'Everyday Sentences'), icon: Layers, count: counts.sentences },
          { id: 'topics' as const, label: t('learning:vocab_tab_topics', 'Topic Collections'), icon: Globe },
          { id: 'practice' as const, label: t('learning:vocab_tab_practice', 'Interactive Practice'), icon: Sparkles },
          { id: 'live_dict' as const, label: t('learning:vocab_tab_explorer', 'Vocabulary Explorer'), icon: Search },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition min-h-[40px] cursor-pointer ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-500/20 text-amber-200' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Focused Search + Collapsible Secondary Filters */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t(
                'learning:vocab_search_placeholder',
                'Search by term, translation, definition, or example...'
              )}
              className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-white transition min-h-[42px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer min-h-[42px] shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t('learning:toggle_filters', 'Filters')}</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Detailed Filter Controls */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-3 border-t border-stone-100 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-stone-500 font-semibold">
                {t('learning:vocab_target_lang', 'Learning Language')}
              </label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value as Language)}
                className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
              >
                <option value="pt">{getLanguageName('pt', interfaceLanguage as any)} (PT)</option>
                <option value="es">{getLanguageName('es', interfaceLanguage as any)} (ES)</option>
                <option value="en">{getLanguageName('en', interfaceLanguage as any)} (EN)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-stone-500 font-semibold">
                {t('learning:vocab_explanation_lang', 'Explanation Language')}
              </label>
              <select
                value={explanationLang}
                onChange={e => setExplanationLang(e.target.value as Language)}
                className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
              >
                <option value="en">{getLanguageName('en', interfaceLanguage as any)} (EN)</option>
                <option value="pt">{getLanguageName('pt', interfaceLanguage as any)} (PT)</option>
                <option value="es">{getLanguageName('es', interfaceLanguage as any)} (ES)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-stone-500 font-semibold">
                {t('learning:vocab_cefr_label', 'CEFR Level')}
              </label>
              <select
                value={selectedCefr}
                onChange={e => setSelectedCefr(e.target.value as any)}
                className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
              >
                <option value="all">{t('learning:vocab_all_levels', 'All Levels')}</option>
                <option value="A1">{t('learning:cefr_level_a1', 'A1 Beginner')}</option>
                <option value="A2">{t('learning:cefr_level_a2', 'A2 Elementary')}</option>
                <option value="B1">{t('learning:cefr_level_b1', 'B1 Intermediate')}</option>
                <option value="B2">{t('learning:cefr_level_b2', 'B2 Upper-Int.')}</option>
                <option value="C1">{t('learning:cefr_level_c1', 'C1 Advanced')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-stone-500 font-semibold">
                {activeTab === 'sentences'
                  ? t('learning:vocab_topic_label', 'Topic')
                  : t('learning:vocab_pos_label', 'Part of Speech')}
              </label>
              {activeTab === 'sentences' ? (
                <select
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value as any)}
                  className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
                >
                  <option value="all">{t('learning:vocab_all_topics', 'All Topics')}</option>
                  {availableTopics.map(tp => (
                    <option key={tp} value={tp}>
                      {getTopicLabel(tp)}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedPos}
                  onChange={e => setSelectedPos(e.target.value as any)}
                  className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
                >
                  <option value="all">{t('learning:vocab_all_pos', 'All Classes')}</option>
                  {availablePos.map(p => (
                    <option key={p} value={p}>
                      {p.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-500">
              {t('learning:vocab_filters_active', 'Active filters applied.')}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-stone-900 hover:text-amber-800 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('learning:vocab_clear_filters', 'Clear Filters')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Viewport */}
      {activeTab === 'live_dict' ? (
        <div className="practice-stage">
          <VocabularyExplorer targetLang={targetLang} explanationLang={explanationLang} />
        </div>
      ) : activeTab === 'practice' ? (
        <div className="space-y-6 practice-stage">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPracticeMode('flashcards')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition min-h-[42px] cursor-pointer ${
                practiceMode === 'flashcards'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {t('learning:vocab_practice_flashcards', 'Memory Flashcards')}
            </button>
            <button
              type="button"
              onClick={() => setPracticeMode('quiz')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition min-h-[42px] cursor-pointer ${
                practiceMode === 'quiz'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {t('learning:vocab_practice_quiz', 'Multiple Choice Quiz')}
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
            title={t('learning:vocab_empty_sentences_title', 'No sentences found')}
            description={t(
              'learning:vocab_empty_sentences_desc',
              'No everyday sentences match your selected search criteria.'
            )}
            actionLabel={t('learning:vocab_clear_filters', 'Clear Filters')}
            onAction={handleResetFilters}
          />
        )
      ) : (
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
            title={t('learning:vocab_empty_words_title', 'No vocabulary found')}
            description={t(
              'learning:vocab_empty_words_desc',
              'No words matched the current filters. Try changing the CEFR level or search term.'
            )}
            actionLabel={t('learning:vocab_reset_filters', 'Reset Filters')}
            onAction={handleResetFilters}
          />
        )
      )}

      {/* Customizable PDF Download Modal */}
      <div className="practice-stage">
        <DownloadPdfDialog
          isOpen={isPdfDialogOpen}
          onClose={() => setIsPdfDialogOpen(false)}
          initialTargetLang={targetLang}
          initialExplanationLang={explanationLang}
          initialCefr={selectedCefr}
        />
      </div>
    </div>
  );
};
