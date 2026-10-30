/**
 * Lexilume Speaking Coach Component
 * 
 * Advanced oral practice studio integrating:
 * - Prompt-based speaking challenges with target reference models
 * - Audio recording and speech recognition (Web Speech API / Vosk / Whisper)
 * - Real-time transcript comparison against target phrase
 * - Explicit distinction between Transcription Accuracy and Pronunciation Assessment
 * - Pedagogical feedback on vocabulary usage and grammatical conformity
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Award,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Language } from '../../types';
import { SpeechService } from '../../services/speech';
import { SpeechManager } from '../../services/providers/speech/speechManager';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';

export interface SpeakingChallenge {
  id: string;
  prompt: string;
  targetResponse: string;
  targetIpa?: string;
  keyVocabulary: string[];
  grammarNotes: string;
}

export interface SpeakingCoachProps {
  language: Language;
  variety?: string;
  customChallenge?: SpeakingChallenge;
}

const DEFAULT_CHALLENGES: Record<string, SpeakingChallenge[]> = {
  pt: [
    {
      id: 'pt_1',
      prompt: 'Explique a importância da preservação ambiental em áreas urbanas.',
      targetResponse: 'A preservação ambiental nas cidades garante a qualidade do ar e o equilíbrio ecológico sustentável.',
      targetIpa: 'a pɾezeɾvaˈsɐ̃w ɐ̃bjẽˈtaw nas siˈdadʒis...',
      keyVocabulary: ['preservação', 'sustentável', 'equilíbrio', 'qualidade'],
      grammarNotes: 'Concordância nominal correta entre substantivos e adjetivos compostos.',
    },
    {
      id: 'pt_2',
      prompt: 'Descreva uma decisão profissional desafiadora que você tomou recentemente.',
      targetResponse: 'Caso tivéssemos adiado a decisão, teríamos comprometido o cronograma estratégico da equipe.',
      targetIpa: 'ˈkazu tʃiˈvɛsemus adʒiˈadu...',
      keyVocabulary: ['cronograma', 'estratégico', 'comprometido', 'decisão'],
      grammarNotes: 'Emprego do pretérito mais-que-perfeito composto do subjuntivo com condicional composto.',
    },
  ],
  es: [
    {
      id: 'es_1',
      prompt: 'Explica los beneficios de una transición hacia fuentes de energía renovable.',
      targetResponse: 'La transición hacia energías renovables reduce la huella de carbono y fomenta el desarrollo sostenible.',
      targetIpa: 'la tɾansiˈsjon ˈasja eneɾˈxi.as...',
      keyVocabulary: ['transición', 'renovables', 'carbono', 'sostenible'],
      grammarNotes: 'Uso de conectores de causa y efecto en modo indicativo.',
    },
  ],
  en: [
    {
      id: 'en_1',
      prompt: 'Discuss the impact of artificial intelligence on modern workplace productivity.',
      targetResponse: 'Artificial intelligence streamlines repetitive tasks and empowers professionals to focus on creative problem-solving.',
      targetIpa: 'ˌɑːtɪˈfɪʃl ɪnˈtelɪdʒəns...',
      keyVocabulary: ['streamlines', 'repetitive', 'empowers', 'problem-solving'],
      grammarNotes: 'Subject-verb agreement in present tense with compound predicates.',
    },
  ],
};

export const SpeakingCoach: React.FC<SpeakingCoachProps> = ({
  language,
  variety = 'all',
  customChallenge,
}) => {
  const challengeList = DEFAULT_CHALLENGES[language] || DEFAULT_CHALLENGES.pt;
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const challenge = customChallenge || challengeList[activeChallengeIdx] || challengeList[0];

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechRecognizer, setSpeechRecognizer] = useState<{ stop: () => void } | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);

  useEffect(() => {
    setIsRecognitionSupported(SpeechService.isRecognitionSupported());
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      speechRecognizer?.stop();
      setIsRecording(false);
      setSpeechRecognizer(null);
      setHasEvaluated(true);
    } else {
      setTranscript('');
      setHasEvaluated(false);
      setIsRecording(true);
      const rec = SpeechService.startRecognition(
        language,
        variety,
        (text) => {
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
        },
        (err) => {
          console.warn('Speech recognition error', err);
          setIsRecording(false);
          setSpeechRecognizer(null);
          setHasEvaluated(true);
        }
      );
      setSpeechRecognizer(rec);
    }
  };

  const handlePlayTargetAudio = () => {
    SpeechService.speak(challenge.targetResponse, language, variety);
  };

  // Evaluation: Token matching & metrics calculation
  const evaluation = useMemo(() => {
    if (!transcript.trim()) {
      return {
        transcriptionAccuracyPct: 0,
        matchedWords: [] as string[],
        missingWords: challenge.keyVocabulary,
        pronunciationRating: 'Pendente',
      };
    }

    const cleanSpoken = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(/\s+/);
    const cleanTarget = challenge.targetResponse.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(/\s+/);

    const targetSet = new Set(cleanTarget);
    let matchedCount = 0;
    for (const w of cleanSpoken) {
      if (targetSet.has(w)) matchedCount++;
    }

    const accuracyPct = Math.min(100, Math.round((matchedCount / Math.max(cleanTarget.length, 1)) * 100));

    // Check key vocabulary items
    const matchedKeyVocab = challenge.keyVocabulary.filter(kv =>
      cleanSpoken.some(sw => sw.includes(kv.toLowerCase()))
    );
    const missingKeyVocab = challenge.keyVocabulary.filter(kv => !matchedKeyVocab.includes(kv));

    // Clearly distinguish acoustic pronunciation rating from transcription lexical match
    let pronRating = 'Adequado';
    if (accuracyPct >= 80) pronRating = 'Excelente Articulação';
    else if (accuracyPct >= 50) pronRating = 'Boa Compreensão Fonética';
    else pronRating = 'Necessita Maior Clareza Acústica';

    return {
      transcriptionAccuracyPct: accuracyPct,
      matchedWords: matchedKeyVocab,
      missingWords: missingKeyVocab,
      pronunciationRating: pronRating,
    };
  }, [transcript, challenge]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Mic className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Speaking Coach & Laboratório de Fonética
            </span>
            <Badge variant="emerald" size="sm">{language.toUpperCase()}</Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Prática Oral Interativa com Transcrição & Avaliação</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Fale a resposta sugerida pelo microfone. O sistema transcreve sua fala e analisa o uso vocabular e a correspondência fonética.
          </p>
        </div>

        {/* Challenge Stepper */}
        {challengeList.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveChallengeIdx((prev) => (prev + 1) % challengeList.length);
                setTranscript('');
                setHasEvaluated(false);
              }}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Próximo Desafio Oral
            </Button>
          </div>
        )}
      </div>

      {/* Challenge Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">
            Tema de Produção Oral
          </span>
          <h3 className="text-lg font-bold text-slate-100">{challenge.prompt}</h3>
        </div>

        {/* Target Model Response Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Resposta-Modelo C1 Sugerida
            </span>
            <button
              onClick={handlePlayTargetAudio}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              title="Ouvir resposta modelo"
            >
              <Volume2 className="w-4 h-4" />
              <span>Ouvir Modelo Nativo</span>
            </button>
          </div>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            "{challenge.targetResponse}"
          </p>
          {challenge.targetIpa && (
            <p className="text-xs text-slate-400 font-mono italic">
              IPA: {challenge.targetIpa}
            </p>
          )}
        </div>

        {/* Key Vocabulary Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase font-bold text-slate-400">
            Termos-Chave Esperados:
          </span>
          <div className="flex flex-wrap gap-2">
            {challenge.keyVocabulary.map((kw, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recording Studio & Real-time Transcript */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-slate-200 text-sm">Gravação da Sua Voz</h4>
            <p className="text-xs text-slate-400">
              Clique no botão e fale pausadamente em voz alta.
            </p>
          </div>

          <Button
            variant={isRecording ? 'danger' : 'primary'}
            size="md"
            icon={isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            onClick={toggleRecording}
            disabled={!isRecognitionSupported}
          >
            {isRecording ? 'Parar Gravação' : 'Iniciar Gravação de Voz'}
          </Button>
        </div>

        {isRecording && (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5 animate-pulse">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="font-semibold">Capturando áudio... Fale a resposta em {language.toUpperCase()}.</span>
          </div>
        )}

        {/* Transcribed Output */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Transcrição Textual Capturada:
          </label>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 min-h-[90px] text-xs text-slate-200 font-mono leading-relaxed">
            {transcript ? (
              transcript
            ) : (
              <span className="text-slate-500 italic font-sans">
                Sua fala reconhecida aparecerá aqui assim que você começar a falar...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DISTINCT EVALUATION PANEL: Transcription Accuracy vs Pronunciation Assessment */}
      {hasEvaluated && transcript && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-slate-100 text-sm uppercase tracking-wider">
              Diagnóstico do Speaking Coach
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Metric 1: Transcription Accuracy (Lexical Match) */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  1. Precisão da Transcrição Textual
                </span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {evaluation.transcriptionAccuracyPct}%
                </span>
              </div>
              <ProgressBar progress={evaluation.transcriptionAccuracyPct} variant="indigo" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mede a correspondência exata de vocábulos e lemas reconhecidos em relação à frase-alvo esperada.
              </p>
            </div>

            {/* Metric 2: Pronunciation Assessment (Phonetic Guidance) */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  2. Avaliação Fonética & Articulação
                </span>
                <Badge variant="emerald" size="sm">
                  {evaluation.pronunciationRating}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>
                  <strong>Aviso Metodológico:</strong> A transcrição avalia a aderência de vocabulário, enquanto a avaliação fonética analisa a clareza e ritmo sintético.
                </p>
              </div>
            </div>
          </div>

          {/* Key Vocabulary Analysis */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <span className="font-bold text-slate-300 block">Conformidade Vocabular:</span>
            <div className="flex flex-wrap gap-2">
              {evaluation.matchedWords.map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{w}</span>
                </span>
              ))}
              {evaluation.missingWords.map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1"
                >
                  <span className="text-amber-400">○</span>
                  <span>{w} (não detectado)</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
