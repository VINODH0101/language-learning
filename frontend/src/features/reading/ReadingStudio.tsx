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

const DEFAULT_READING_ITEMS: Record<string, ReadingItem[]> = {
  pt: [
    {
      id: 'pt-read-c1-1',
      title: 'A Influência do Barroco na Arquitetura do Norte de Portugal',
      cefrLevel: 'C1',
      source: 'curated',
      authorOrAttribution: 'Lexilume Curated Portuguese Studies',
      summary: 'Uma análise da opulência estética das igrejas de Braga e Porto sob o prisma do barroco joanino.',
      content: 'A arquitetura barroca em Portugal manifestou-se com singular exuberância durante o reinado de D. João V. No norte do país, especialmente nas cidades de Braga e Porto, a talha dourada e o granito local fundiram-se numa simbiose estética inconfundível. Artistas como Nicolau Nasoni transformaram a paisagem urbana, erigindo monumentos vertiginosos como a Torre dos Clérigos. Essa linguagem visual traduzia não apenas poder eclesiástico, mas também o afluxo de riquezas minerais provenientes do Brasil colonial, refletindo contradições profundas na estrutura socioeconómica do império.',
      comprehensionQuestions: [
        {
          id: 'q1',
          question: 'Qual arquiteto é explicitamente citado como responsável pela transformação urbana no norte?',
          options: ['Aleijadinho', 'Nicolau Nasoni', 'Afonso Domingues', 'Mateus Vicente'],
          correctIndex: 1,
          explanation: 'O texto cita nominalmente "Artistas como Nicolau Nasoni transformaram a paisagem urbana, erigindo monumentos vertiginosos como a Torre dos Clérigos".',
        },
        {
          id: 'q2',
          question: 'De acordo com o texto, qual fator material possibilitou a exuberância barroca joanina?',
          options: ['A rota da seda asiática', 'O afluxo de riquezas minerais do Brasil colonial', 'As manufaturas têxteis do Alentejo', 'O comércio exclusivo de especiarias'],
          correctIndex: 1,
          explanation: 'O texto aponta diretamente o "afluxo de riquezas minerais provenientes do Brasil colonial".',
        },
      ],
    },
    {
      id: 'pt-read-b1-1',
      title: 'O Fado e a Tradição dos Bairros Típicos de Lisboa',
      cefrLevel: 'B1',
      source: 'curated',
      authorOrAttribution: 'Lexilume Cultural Corpus',
      summary: 'Descubra a história das tabernas de Alfama e a emoção da guitarra portuguesa.',
      content: 'O fado nasceu no coração dos bairros populares de Lisboa, como Alfama e Mouraria, durante o século dezanove. Inicialmente cantado por marinheiros e pessoas humildes, o fado transmite temas de saudade, amor e destino. Acompanhado pela guitarra portuguesa e pela viola de fado, este estilo musical conquistou palcos internacionais e foi classificado pela UNESCO como Património Cultural Imaterial da Humanidade.',
      comprehensionQuestions: [
        {
          id: 'q1',
          question: 'Em que século o fado surgiu nos bairros populares de Lisboa?',
          options: ['Século quinze', 'Século dezassete', 'Século dezanove', 'Século vinte'],
          correctIndex: 2,
          explanation: 'O texto afirma com clareza: "durante o século dezanove".',
        },
      ],
    },
  ],
  es: [
    {
      id: 'es-read-c1-1',
      title: 'El Realismo Mágico y la Desarticulación Cronológica en la Narrativa Hispánica',
      cefrLevel: 'C1',
      source: 'curated',
      authorOrAttribution: 'Estudios Literarios Hispanoamericanos',
      summary: 'Reflexión crítica sobre la coexistencia entre la cotidianeidad tangible y lo prodigioso insólito.',
      content: 'El realismo mágico no constituye una simple evasión de la realidad objetiva, sino una decantación poética de las contradicciones históricas de América Latina. En las obras de Gabriel García Márquez y Juan Rulfo, los límites entre la vigilia y el espectro se difuminan deliberadamente. La cronología lineal se fragmenta para reflejar una concepción mítica y circular del tiempo, donde la memoria colectiva prevalece sobre el archivo documental.',
      comprehensionQuestions: [
        {
          id: 'q1',
          question: '¿Cómo concibe el texto el tiempo en el realismo mágico?',
          options: ['Estrictamente cronológico y acumulativo', 'Mítico y circular', 'Acelerado por la industrialización', 'Completamente inexistente'],
          correctIndex: 1,
          explanation: 'El texto señala que "La cronología lineal se fragmenta para reflejar una concepción mítica y circular del tiempo".',
        },
      ],
    },
  ],
  en: [
    {
      id: 'en-read-c1-1',
      title: 'Algorithmic Epistemology: Data Curation in Modern Science',
      cefrLevel: 'C1',
      source: 'curated',
      authorOrAttribution: 'Lexilume Academic Inquiry',
      summary: 'An investigation into how automated data heuristics alter the boundaries of empirical validation.',
      content: 'The proliferation of high-throughput data pipelines has transformed scientific inquiry from deductive hypothesis testing into exploratory pattern discovery. While computational models extract correlations across multi-dimensional parameter spaces, they inevitably introduce heuristic biases. Disentangling statistical artifacts from genuine physical phenomena remains the preeminent methodological challenge of computational science.',
      comprehensionQuestions: [
        {
          id: 'q1',
          question: 'What is described as the preeminent challenge of computational science?',
          options: ['Hardware cooling constraints', 'Disentangling statistical artifacts from genuine physical phenomena', 'Lack of open datasets', 'Translating code into English'],
          correctIndex: 1,
          explanation: 'The passage explicitly states that "Disentangling statistical artifacts from genuine physical phenomena remains the preeminent methodological challenge".',
        },
      ],
    },
  ],
};

export interface ReadingStudioProps {
  language: Language;
}

export const ReadingStudio: React.FC<ReadingStudioProps> = ({ language }) => {
  const [selectedCefr, setSelectedCefr] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [readingList, setReadingList] = useState<ReadingItem[]>(DEFAULT_READING_ITEMS[language] || DEFAULT_READING_ITEMS.pt);
  const [activeItem, setActiveItem] = useState<ReadingItem>(readingList[0]);
  
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

  // Update reading list when language changes
  useEffect(() => {
    const list = DEFAULT_READING_ITEMS[language] || DEFAULT_READING_ITEMS.pt;
    setReadingList(list);
    setActiveItem(list[0]);
    setAnswers({});
    setSubmitted(false);
    setCompleted(false);
    SpeechService.stop();
    setIsReadingAloud(false);
  }, [language]);

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
