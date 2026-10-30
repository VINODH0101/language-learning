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

const LISTENING_DATA: Record<string, ListeningPassage[]> = {
  pt: [
    {
      id: 'pt-listen-1',
      title: 'Aviso na Estação de Santa Apolónia',
      category: 'Vida Diária & Transportes',
      cefrLevel: 'B1',
      sentences: [
        {
          id: 's1',
          targetText: 'Atenção passageiros com destino ao Porto, o comboio Alfa Pendular com partida às quinze horas e trinta minutos encontra-se na linha quatro.',
          explanationText: 'Attention passengers heading to Porto, the Alfa Pendular train departing at 15:30 is on platform four.',
        },
        {
          id: 's2',
          targetText: 'Solicita-se a todos os passageiros que preparem os respetivos bilhetes e documentos de identificação antes de embarcar.',
          explanationText: 'All passengers are kindly requested to prepare their respective tickets and ID documents prior to boarding.',
        },
        {
          id: 's3',
          targetText: 'Lembramos que o uso de máscara no interior das carruagens é facultativo, mas recomendado para pessoas em situação vulnerável.',
          explanationText: 'We remind you that wearing a mask inside carriages is optional, but recommended for vulnerable individuals.',
        },
        {
          id: 's4',
          targetText: 'Desejamos a todos uma excelente e segura viagem pelos caminhos de ferro portugueses.',
          explanationText: 'We wish everyone an excellent and safe journey on the Portuguese railways.',
        },
      ],
      questions: [
        {
          id: 'q1',
          question: 'Para onde viaja o comboio Alfa Pendular mencionado?',
          options: ['Coimbra', 'Porto', 'Faro', 'Braga'],
          correctIndex: 1,
          explanation: 'O áudio informa explicitamente "passageiros com destino ao Porto".',
        },
        {
          id: 'q2',
          question: 'Em que linha o comboio está posicionado?',
          options: ['Linha 2', 'Linha 3', 'Linha 4', 'Linha 7'],
          correctIndex: 2,
          explanation: 'O locutor anuncia que o comboio "encontra-se na linha quatro".',
        },
      ],
    },
    {
      id: 'pt-listen-2',
      title: 'Debate Ecológico: Energia Limpa e Sustentabilidade',
      category: 'Ciência & Sociedade',
      cefrLevel: 'C1',
      sentences: [
        {
          id: 's1',
          targetText: 'A transição energética requer não apenas subsídios estatais, mas uma reformulação estrutural de toda a cadeia de abastecimento.',
          explanationText: 'The energy transition requires not merely state subsidies, but a structural overhaul of the entire supply chain.',
        },
        {
          id: 's2',
          targetText: 'A intermitência dos recursos eólicos e solares exige sistemas robustos de armazenamento eletroquímico e redes inteligentes.',
          explanationText: 'The intermittency of wind and solar resources demands robust electrochemical storage systems and smart grids.',
        },
        {
          id: 's3',
          targetText: 'Caso contrário, correremos o risco de estagnação e dependência cíclica de combustíveis fósseis em períodos de pico.',
          explanationText: 'Otherwise, we run the risk of stagnation and cyclical reliance on fossil fuels during peak periods.',
        },
      ],
      questions: [
        {
          id: 'q1',
          question: 'Qual é o principal desafio associado às energias eólica e solar mencionado?',
          options: ['Custo de extração elevado', 'Intermitência dos recursos', 'Falta de interesse público', 'Incompatibilidade física'],
          correctIndex: 1,
          explanation: 'O locutor destaca explicitamente que "A intermitência dos recursos eólicos e solares exige sistemas robustos".',
        },
      ],
    },
  ],
  es: [
    {
      id: 'es-listen-1',
      title: 'Anuncio en el Aeropuerto de Barajas',
      category: 'Viajes & Logística',
      cefrLevel: 'B1',
      sentences: [
        {
          id: 's1',
          targetText: 'Última llamada para los pasajeros del vuelo IB3160 con destino a la ciudad de Barcelona.',
          explanationText: 'Last call for passengers of flight IB3160 bound for Barcelona.',
        },
        {
          id: 's2',
          targetText: 'Por favor, acérquense inmediatamente a la puerta de embarque K24 situada en la terminal cuatro.',
          explanationText: 'Please proceed immediately to boarding gate K24 located in terminal four.',
        },
        {
          id: 's3',
          targetText: 'El embarque finalizará en cinco minutos y las puertas del avión se cerrarán.',
          explanationText: 'Boarding will close in five minutes and aircraft doors will be secured.',
        },
      ],
      questions: [
        {
          id: 'q1',
          question: '¿Cuál es el destino del vuelo IB3160?',
          options: ['Madrid', 'Valencia', 'Barcelona', 'Sevilla'],
          correctIndex: 2,
          explanation: 'El mensaje indica claramente que el vuelo tiene "destino a la ciudad de Barcelona".',
        },
      ],
    },
  ],
  en: [
    {
      id: 'en-listen-1',
      title: 'University Symposium on Cognitive Linguistics',
      category: 'Academia & Research',
      cefrLevel: 'B2',
      sentences: [
        {
          id: 's1',
          targetText: 'Today we explore how syntactic metaphors fundamentally shape human conceptual frameworks.',
          explanationText: 'Hoje exploramos como metáforas sintáticas moldam fundamentalmente os quadros conceituais humanos.',
        },
        {
          id: 's2',
          targetText: 'Rather than serving as mere poetic ornament, metaphors actively structure how we process abstract relations.',
          explanationText: 'Em vez de servir como mero ornamento poético, metáforas estruturam ativamente como processamos relações abstratas.',
        },
        {
          id: 's3',
          targetText: 'Empirical experiments in neuroscience have repeatedly substantiated this foundational hypothesis.',
          explanationText: 'Experimentos empíricos em neurociência têm repetidamente comprovado esta hipótese fundamental.',
        },
      ],
      questions: [
        {
          id: 'q1',
          question: 'According to the speaker, what role do metaphors serve?',
          options: ['Mere poetic decoration', 'Grammar filler', 'Structuring how we process abstract relations', 'Memory distraction'],
          correctIndex: 2,
          explanation: 'The lecture emphasizes that metaphors "actively structure how we process abstract relations".',
        },
      ],
    },
  ],
};

export interface ListeningStudioProps {
  language: Language;
}

export const ListeningStudio: React.FC<ListeningStudioProps> = ({ language }) => {
  const passages = LISTENING_DATA[language] || LISTENING_DATA.pt;
  const [selectedPassageIndex, setSelectedPassageIndex] = useState(0);
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
    let correct = 0;
    for (const q of passage.questions) {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    }
    return { correct, total: passage.questions.length };
  };

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
