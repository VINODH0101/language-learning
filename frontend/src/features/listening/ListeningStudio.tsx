/**
 * Lexilume Listening Studio Component
 * 
 * Features:
 * - Web Speech / audio playback with variable speeds: 0.75x, 1.0x, 1.25x
 * - Dual-language synchronized sentence transcript
 * - Active sentence highlighting & individual sentence replay
 * - Interactive comprehension questions with immediate scoring & explanation
 * - Integrated ContextualWordPopover for instant word lookup and vocabulary saving
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Languages,
  BookOpen,
  FastForward,
  Headphones,
} from 'lucide-react';
import { Language } from '../../types';
import { SpeechService } from '../../services/speech';
import { contentAccess } from '../../services/contentAccess';
import { dailyContentService } from '../../services/dailyContentService';
import { VocabularyService } from '../../services/vocabularyService';
import { ContextualWordPopover } from '../../components/common/ContextualWordPopover';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export interface ListeningSentence {
  id: string;
  targetText: string;
  explanationText: string;
}

export interface ListeningQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ListeningPassage {
  id: string;
  title: string;
  category: string;
  cefrLevel: string;
  sentences: ListeningSentence[];
  questions: ListeningQuestion[];
}

export interface ListeningStudioProps {
  language: Language;
  passages?: ListeningPassage[];
}

export const ListeningStudio: React.FC<ListeningStudioProps> = ({ language, passages: providedPassages }) => {
  const [passages, setPassages] = useState<ListeningPassage[]>(providedPassages || []);
  const [selectedPassageIndex, setSelectedPassageIndex] = useState(0);

  useEffect(() => {
    if (providedPassages) {
      setPassages(providedPassages);
      setSelectedPassageIndex(0);
      return;
    }
    let cancelled = false;
    const loadLivePassages = async () => {
      try {
        await VocabularyService.loadLiveCatalog(language, language === 'en' ? 'pt' : 'en').catch(() => {});
        const [publishedConvos, daily, sentences] = await Promise.all([
          contentAccess.getPublishedConversations(language).catch(() => []),
          dailyContentService.getAllContent(),
          Promise.resolve(VocabularyService.getSentences(language)),
        ]);

        const built: ListeningPassage[] = [];
        for (const c of [...publishedConvos, ...daily.activeConversations.filter(x => x.learning_language === language)]) {
          if (c.dialogue.length === 0) continue;
          built.push({
            id: `listen-conv-${c.id}`,
            title: c.title,
            category: 'Conversation',
            cefrLevel: c.cefr_level,
            sentences: c.dialogue.map((t, i) => ({
              id: `s-${i}`,
              targetText: t.line,
              explanationText: t.translation || '',
            })),
            questions: [],
          });
        }

        if (sentences.length > 0) {
          built.push({
            id: `listen-corpus-${language}`,
            title: `Tatoeba Corpus Sentences (${language.toUpperCase()})`,
            category: 'Open Corpus Audio',
            cefrLevel: 'B1',
            sentences: sentences.slice(0, 6).map((s, i) => ({
              id: `t-${i}`,
              targetText: s.sentence_target,
              explanationText: s.translations.en || Object.values(s.translations)[0] || '',
            })),
            questions: [],
          });
        }

        if (!cancelled) {
          setPassages(built);
          setSelectedPassageIndex(0);
        }
      } catch {
        if (!cancelled) setPassages([]);
      }
    };
    loadLivePassages();
    return () => {
      cancelled = true;
    };
  }, [language, providedPassages]);

  const passage = passages[selectedPassageIndex] || passages[0];

  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showTranslations, setShowTranslations] = useState(false);
  const [activeLookupWord, setActiveLookupWord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | undefined>();

  // Comprehension question state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // Stop audio on unmount or passage change
  useEffect(() => {
    return () => {
      SpeechService.stop();
    };
  }, [selectedPassageIndex, language]);

  const handlePlayFullAudio = async () => {
    if (isPlaying) {
      SpeechService.stop();
      setIsPlaying(false);
      setActiveSentenceIndex(null);
      return;
    }

    setIsPlaying(true);
    for (let i = 0; i < passage.sentences.length; i++) {
      setActiveSentenceIndex(i);
      await SpeechService.speak(passage.sentences[i].targetText, language, 'all', null, playbackSpeed);
      // Brief pause between sentences
      await new Promise(r => setTimeout(r, 400));
    }
    setIsPlaying(false);
    setActiveSentenceIndex(null);
  };

  const handlePlaySentence = async (index: number) => {
    SpeechService.stop();
    setIsPlaying(true);
    setActiveSentenceIndex(index);
    await SpeechService.speak(passage.sentences[index].targetText, language, 'all', null, playbackSpeed);
    setIsPlaying(false);
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const calculateScore = () => {
    if (!passage) return { correct: 0, total: 0 };
    let correct = 0;
    for (const q of passage.questions) {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    }
    return { correct, total: passage.questions.length };
  };

  if (!passage) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
        <Headphones className="w-8 h-8 text-indigo-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Listening Practice Studio</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No listening transcripts available yet for {language.toUpperCase()}. Publish conversations via Admin Content Studio or fetch open corpus sentences.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header & Passage Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Listening Practice Studio</h2>
                <Badge variant="indigo" size="sm">{passage.cefrLevel}</Badge>
                <Badge variant="slate" size="sm">{passage.category}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Áudio natural sincronizado, controle de velocidade fonética e checagem de compreensão auditiva.
              </p>
            </div>
          </div>

          {/* Passage Switcher */}
          {passages.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {passages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    SpeechService.stop();
                    setIsPlaying(false);
                    setSelectedPassageIndex(idx);
                    setActiveSentenceIndex(null);
                    setAnswers({});
                    setSubmitted(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedPassageIndex === idx
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Texto {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Passage Title */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-bold text-slate-100">
            {passage.title}
          </h3>
        </div>

        {/* Playback Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePlayFullAudio}
              variant={isPlaying ? 'danger' : 'primary'}
              size="md"
              className="gap-2 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pausar Áudio Completo' : 'Reproduzir Áudio Completo'}</span>
            </Button>

            <button
              onClick={() => {
                SpeechService.stop();
                setIsPlaying(false);
                setActiveSentenceIndex(null);
              }}
              title="Reiniciar áudio"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed & Translation Toggles */}
          <div className="flex items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-bold">
              <span className="text-slate-400 px-2 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <FastForward className="w-3 h-3 text-slate-400" /> Velocidade:
              </span>
              {[0.75, 1.0, 1.25].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2.5 py-1 rounded cursor-pointer transition ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Translation toggle */}
            <button
              onClick={() => setShowTranslations(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                showTranslations
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{showTranslations ? 'Ocultar Tradução' : 'Mostrar Tradução'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Transcript View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Transcrição Interativa Sincronizada
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Dica: Clique em qualquer palavra para abrir o dicionário instantâneo
          </span>
        </div>

        <div className="space-y-3">
          {passage.sentences.map((sentence, idx) => {
            const isActive = activeSentenceIndex === idx;
            // Tokenize words for contextual popover
            const words = sentence.targetText.split(/(\s+)/);

            return (
              <div
                key={sentence.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 text-base leading-relaxed text-slate-200">
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
                          className="hover:text-sky-300 hover:underline cursor-pointer transition-colors decoration-sky-400/50"
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>

                  {/* Individual sentence audio trigger */}
                  <button
                    onClick={() => handlePlaySentence(idx)}
                    title="Ouvir esta frase isolada"
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition cursor-pointer flex-shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtitle / Translation */}
                {showTranslations && (
                  <div className="mt-2 text-xs text-slate-400 italic border-t border-slate-800/80 pt-2 font-serif">
                    {sentence.explanationText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehension Questions Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              Perguntas de Compreensão Auditiva
            </h3>
          </div>
          {submitted && (
            <Badge variant={calculateScore().correct === calculateScore().total ? 'emerald' : 'amber'}>
              Acertos: {calculateScore().correct} / {calculateScore().total}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {passage.questions.map((q, qIndex) => {
            const selectedOpt = answers[q.id];
            const isCorrect = submitted && selectedOpt === q.correctIndex;
            const isWrong = submitted && selectedOpt !== undefined && selectedOpt !== q.correctIndex;

            return (
              <div
                key={q.id}
                className="p-5 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="font-semibold text-slate-200 text-sm">
                  <span className="text-amber-400 mr-2 font-mono">Q{qIndex + 1}.</span>
                  {q.question}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    let style = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800';

                    if (submitted) {
                      if (optIdx === q.correctIndex) {
                        style = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-bold';
                      } else if (isSelected) {
                        style = 'bg-rose-950/60 border-rose-500/80 text-rose-200 line-through';
                      } else {
                        style = 'bg-slate-900/40 border-slate-800/60 text-slate-500';
                      }
                    } else if (isSelected) {
                      style = 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-semibold';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={submitted}
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
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : isWrong
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">
                      {isCorrect ? '✓ Resposta Correta' : 'ℹ Justificativa Pedagógica:'}
                    </div>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit & Reset actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!submitted ? (
            <Button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < passage.questions.length}
              variant="primary"
              size="md"
              className="gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verificar Respostas</span>
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
