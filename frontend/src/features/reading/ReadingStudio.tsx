/**
 * Lexilume Reading Studio Component
 * 
 * Features:
 * - CEFR-filtered reading materials (A1 - C1)
 * - Multi-provider source selection: Curated, Wikipedia, Gutendex
 * - Interactive word lookup via ContextualWordPopover
 * - Direct save-to-vocabulary integration
 * - Reading comprehension check with pedagogical explanations
 * - Local reading history logging and completed badges
 * - Multi-modal read-aloud via Web Speech API
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Filter,
  Volume2,
  CheckCircle2,
  Bookmark,
  History,
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Library,
} from 'lucide-react';
import { Language } from '../../types';
import { ReadingManager } from '../../services/providers/reading/readingManager';
import { contentAccess } from '../../services/contentAccess';
import { CultureService } from '../../services/cultureService';
import { ContextualWordPopover } from '../../components/common/ContextualWordPopover';
import { SpeechService } from '../../services/speech';
import { logReadingSession, getReadingHistory, ReadingHistoryRecord } from '../../services/localDb';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export interface ReadingItem {
  id: string;
  title: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  source: 'curated' | 'wikipedia' | 'gutendex';
  authorOrAttribution: string;
  summary: string;
  content: string;
  comprehensionQuestions: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface ReadingStudioProps {
  language: Language;
  items?: ReadingItem[];
}

export const ReadingStudio: React.FC<ReadingStudioProps> = ({ language, items: providedItems }) => {
  const [selectedCefr, setSelectedCefr] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [readingList, setReadingList] = useState<ReadingItem[]>(providedItems || []);
  const [activeItem, setActiveItem] = useState<ReadingItem | null>(providedItems?.[0] || null);
  
  // Reading state
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryRecord[]>([]);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // Comprehension answers
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeLookupWord, setActiveLookupWord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | undefined>();

  // Load history on mount
  useEffect(() => {
    getReadingHistory().then(setReadingHistory);
  }, []);

  // Load live reading passages from AI Content Engine & Wikipedia when language changes
  useEffect(() => {
    if (providedItems) {
      setReadingList(providedItems);
      setActiveItem(providedItems[0] || null);
      return;
    }
    let cancelled = false;
    SpeechService.stop();
    setIsReadingAloud(false);
    setAnswers({});
    setSubmitted(false);
    setCompleted(false);

    const loadLiveReadings = async () => {
      try {
        const [publishedStories, wikiArticles] = await Promise.all([
          contentAccess.listPublishedContentItems({ targetLanguage: language }).catch(() => []),
          CultureService.loadLiveArticles(language).catch(() => []),
        ]);

        const built: ReadingItem[] = [];
        for (const item of publishedStories.filter(i => i.content_type === 'story' || i.content_type === 'cultural_article' || i.content_type === 'academic_essay')) {
          const detail = (await contentAccess.getContent(item.id).catch(() => null)) as any;
          const body = detail?.body || detail?.version?.structured_payload || {};
          const text =
            typeof body.narrative === 'string'
              ? body.narrative
              : typeof body.article_body === 'string'
              ? body.article_body
              : Array.isArray(body.paragraphs)
              ? body.paragraphs.map((p: any) => p.sentences?.map((s: any) => s.text).join(' ')).join('\n\n')
              : item.summary;
          if (!text) continue;
          built.push({
            id: item.id,
            title: item.title,
            cefrLevel: (['A1', 'A2', 'B1', 'B2', 'C1'].includes(item.primary_cefr) ? item.primary_cefr : 'B1') as ReadingItem['cefrLevel'],
            source: 'curated',
            authorOrAttribution: item.attribution_notice || 'Lexilume AI Content Engine',
            summary: item.summary || '',
            content: text,
            comprehensionQuestions: [],
          });
        }

        for (const w of wikiArticles) {
          if (!w.content_paragraphs?.length) continue;
          built.push({
            id: w.id,
            title: w.title,
            cefrLevel: (['A1', 'A2', 'B1', 'B2', 'C1'].includes(w.cefr_level) ? w.cefr_level : 'B2') as ReadingItem['cefrLevel'],
            source: 'wikipedia',
            authorOrAttribution: w.attribution_text || 'Wikipedia — CC-BY-SA 4.0',
            summary: w.summary,
            content: w.content_paragraphs.join('\n\n'),
            comprehensionQuestions: [],
          });
        }

        if (!cancelled) {
          setReadingList(built);
          setActiveItem(built[0] || null);
        }
      } catch {
        if (!cancelled) {
          setReadingList([]);
          setActiveItem(null);
        }
      }
    };

    loadLiveReadings();
    return () => {
      cancelled = true;
    };
  }, [language, providedItems]);

  const filteredItems = readingList.filter(item => {
    if (selectedCefr !== 'all' && item.cefrLevel !== selectedCefr) return false;
    if (selectedSource !== 'all' && item.source !== selectedSource) return false;
    return true;
  });

  const handleSelectArticle = (item: ReadingItem) => {
    SpeechService.stop();
    setIsReadingAloud(false);
    setActiveItem(item);
    setAnswers({});
    setSubmitted(false);
    setCompleted(false);
  };

  const handleToggleReadAloud = async () => {
    if (!activeItem) return;
    if (isReadingAloud) {
      SpeechService.stop();
      setIsReadingAloud(false);
      return;
    }

    setIsReadingAloud(true);
    await SpeechService.speak(activeItem.content, language);
    setIsReadingAloud(false);
  };

  const handleMarkCompleted = async () => {
    if (!activeItem) return;
    const record = await logReadingSession({
      user_id: 'guest',
      article_id: activeItem.id,
      title: activeItem.title,
      language,
      cefr_level: activeItem.cefrLevel,
      source: activeItem.source,
    });
    setCompleted(true);
    setReadingHistory(prev => [record, ...prev]);
    toast.success('Leitura concluída e registrada no seu histórico de estudos!');
  };

  if (!activeItem) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
        <BookOpen className="w-8 h-8 text-emerald-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Reading Studio & Text Comprehension</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No reading articles loaded yet for {language.toUpperCase()}. Publish articles via Admin Content Studio or fetch from Wikipedia.
        </p>
      </div>
    );
  }

  // Tokenize paragraphs & words for contextual click-to-lookup
  const paragraphs = activeItem.content.split('\n\n');

  return (
    <div className="space-y-6">
      {/* Studio Header & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Reading Studio & Text Comprehension</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Textos graduados por nível CEFR (A1–C1), anotações léxicas interativas e checagem de compreensão.
              </p>
            </div>
          </div>

          {/* CEFR Level Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {['all', 'A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedCefr(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCefr === lvl
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl === 'all' ? 'Todos os Níveis' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Article Selector List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map(item => {
            const isSelected = activeItem.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectArticle(item)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="emerald" size="sm">{item.cefrLevel}</Badge>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {item.source}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.summary}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Reading Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reader Passage */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Passage Header */}
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="emerald">{activeItem.cefrLevel}</Badge>
                  <span className="text-xs text-slate-400 font-medium">
                    Fonte: {activeItem.authorOrAttribution}
                  </span>
                </div>

                {/* Read aloud toggle */}
                <Button
                  onClick={handleToggleReadAloud}
                  variant={isReadingAloud ? 'danger' : 'secondary'}
                  size="sm"
                  className="gap-2 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isReadingAloud ? 'Pausar Áudio' : 'Ouvir Leitura'}</span>
                </Button>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
                {activeItem.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1 italic">
                {activeItem.summary}
              </p>
            </div>

            {/* Tokenized Passage Text */}
            <div className="space-y-4 font-serif text-slate-200 text-base sm:text-lg leading-relaxed">
              {paragraphs.map((para, pIdx) => {
                const words = para.split(/(\s+)/);
                return (
                  <p key={pIdx} className="tracking-wide">
                    {words.map((word, wIdx) => {
                      const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '').trim();
                      if (!clean || /^\s+$/.test(word)) {
                        return <span key={wIdx}>{word}</span>;
                      }
                      return (
                        <span
                          key={wIdx}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverPos({ top: rect.bottom + 8, left: rect.left });
                            setActiveLookupWord(clean);
                          }}
                          className="hover:text-emerald-300 hover:bg-emerald-950/40 rounded px-0.5 cursor-pointer transition-colors decoration-emerald-500/40 underline decoration-dotted"
                        >
                          {word}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
            </div>

            {/* Completion trigger */}
            <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Toque em qualquer vocábulo acima para ver definição, pronúncia e salvar no caderno.
              </div>
              <Button
                onClick={handleMarkCompleted}
                disabled={completed}
                variant={completed ? 'secondary' : 'primary'}
                size="md"
                className="gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{completed ? '✓ Concluído' : 'Marcar Leitura Concluída'}</span>
              </Button>
            </div>
          </div>

          {/* Reading Comprehension Questions */}
          {activeItem.comprehensionQuestions && activeItem.comprehensionQuestions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Questões de Interpretação Textual
                </h3>
              </div>

              <div className="space-y-4">
                {activeItem.comprehensionQuestions.map((q, qIdx) => {
                  const selectedOpt = answers[q.id];
                  const isCorrect = submitted && selectedOpt === q.correctIndex;
                  const isWrong = submitted && selectedOpt !== undefined && selectedOpt !== q.correctIndex;

                  return (
                    <div key={q.id} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                      <div className="text-sm font-semibold text-slate-200">
                        <span className="text-emerald-400 mr-2 font-mono">#{qIdx + 1}</span>
                        {q.question}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          let style = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800';
                          if (submitted) {
                            if (optIdx === q.correctIndex) {
                              style = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-bold';
                            } else if (isSelected) {
                              style = 'bg-rose-950/60 border-rose-500/80 text-rose-200 line-through';
                            }
                          } else if (isSelected) {
                            style = 'bg-emerald-600 text-white border-emerald-500';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={submitted}
                              onClick={() => setAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className={`text-left p-3 rounded-lg border text-xs transition cursor-pointer ${style}`}
                            >
                              <span className="font-mono text-slate-500 mr-2">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {submitted && (
                        <div className={`p-3 rounded-lg text-xs border ${isCorrect ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'}`}>
                          <div className="font-semibold mb-0.5">
                            {isCorrect ? '✓ Resposta Correta' : 'ℹ Análise Pedagógica:'}
                          </div>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {!submitted ? (
                  <Button
                    onClick={() => setSubmitted(true)}
                    disabled={Object.keys(answers).length < activeItem.comprehensionQuestions.length}
                    variant="primary"
                    size="md"
                    className="gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conferir Interpretação</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setAnswers({});
                      setSubmitted(false);
                    }}
                    variant="secondary"
                    size="md"
                    className="gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Tentar Novamente</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Reading History & Stats */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                Histórico Recente de Leitura
              </h3>
              <Badge variant="slate" size="sm">
                {readingHistory.length} Leituras
              </Badge>
            </div>

            {readingHistory.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhuma leitura registrada ainda. Conclua seu primeiro texto para registrar aqui!
              </div>
            ) : (
              <div className="space-y-3">
                {readingHistory.slice(0, 6).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="emerald" size="sm">{item.cefr_level}</Badge>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeLookupWord && (
        <ContextualWordPopover
          selectedWord={activeLookupWord}
          language={language}
          position={popoverPos}
          onClose={() => {
            setActiveLookupWord(null);
            setPopoverPos(undefined);
          }}
        />
      )}
    </div>
  );
};
