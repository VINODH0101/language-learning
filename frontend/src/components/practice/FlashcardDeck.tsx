import React, { useState, useMemo } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Sparkles,
  Volume2,
  ArrowRight,
  TrendingUp,
  Target,
  Calendar,
  Layers,
  History,
} from 'lucide-react';
import { VocabularyItem, SRSItemState } from '../../types';
import { SRSService } from '../../services/srs';
import { StorageService } from '../../services/storage';
import { SpeechService } from '../../services/speech';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';

interface FlashcardDeckProps {
  vocabularyList: VocabularyItem[];
  onReviewFinished?: () => void;
  dailyTarget?: number;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  vocabularyList,
  onReviewFinished,
  dailyTarget = 20,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    total: 0,
  });

  // Today's completed reviews from localStorage
  const [todayCompletedCount, setTodayCompletedCount] = useState<number>(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`lexilume_srs_reviews_today_${todayStr}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const hasVocab = Boolean(vocabularyList && vocabularyList.length > 0);
  const currentVocab = hasVocab ? (vocabularyList[currentIndex] || vocabularyList[0]) : null;
  const currentSRS = useMemo(() => {
    if (!currentVocab) return null;
    const srsStates = StorageService.getSRSItems(currentVocab.language);
    return srsStates.find(s => s.vocabulary_item_id === currentVocab.id) ||
      SRSService.createInitialState(currentVocab.id, currentVocab.language);
  }, [currentVocab]);

  // Compute predicted intervals for each grade (Again: 1, Hard: 3, Good: 4, Easy: 5)
  const predictedNextStates = useMemo(() => {
    if (!currentSRS) return null;
    return {
      again: SRSService.calculateNextState(currentSRS, 1),
      hard: SRSService.calculateNextState(currentSRS, 3),
      good: SRSService.calculateNextState(currentSRS, 4),
      easy: SRSService.calculateNextState(currentSRS, 5),
    };
  }, [currentSRS]);

  if (!vocabularyList || vocabularyList.length === 0 || !currentVocab || !currentSRS || !predictedNextStates) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Deck em Dia!</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Não há vocábulos pendentes para revisão no momento pelo algoritmo SuperMemo SM-2.
          Você completou sua meta ou todos os itens estão consolidados.
        </p>
        <div className="pt-2 flex justify-center gap-4 text-xs font-mono text-slate-300">
          <span>Meta Diária: <strong>{todayCompletedCount}/{dailyTarget}</strong></span>
        </div>
      </div>
    );
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (grade: number) => {
    const updated = SRSService.calculateNextState(currentSRS, grade);
    StorageService.saveSRSItem(updated);

    // Update track mastery
    const track = StorageService.getTrackState(currentVocab.language);
    if (updated.mastery_status === 'mastered') {
      if (!track.mastered_vocabulary_ids.includes(currentVocab.id)) {
        track.mastered_vocabulary_ids.push(currentVocab.id);
      }
    } else {
      track.mastered_vocabulary_ids = track.mastered_vocabulary_ids.filter(id => id !== currentVocab.id);
    }
    StorageService.saveTrackState(track);

    // Increment today's review count
    const todayStr = new Date().toISOString().split('T')[0];
    const newTodayCount = todayCompletedCount + 1;
    setTodayCompletedCount(newTodayCount);
    try {
      localStorage.setItem(`lexilume_srs_reviews_today_${todayStr}`, String(newTodayCount));
    } catch {}

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      again: grade <= 1 ? prev.again + 1 : prev.again,
      hard: grade === 3 ? prev.hard + 1 : prev.hard,
      good: grade === 4 ? prev.good + 1 : prev.good,
      easy: grade >= 5 ? prev.easy + 1 : prev.easy,
      total: prev.total + 1,
    }));

    setIsFlipped(false);

    if (currentIndex < vocabularyList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onReviewFinished?.();
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    SpeechService.speak(
      currentVocab.lemma,
      currentVocab.language,
      'all',
      currentVocab.audio_url
    );
  };

  const progressPct = Math.min(100, Math.round((todayCompletedCount / dailyTarget) * 100));

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Daily Review Target Progress Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Meta Diária de Revisão SM-2</span>
          </div>
          <span className="font-mono text-indigo-300 font-bold">
            {todayCompletedCount} / {dailyTarget} itens ({progressPct}%)
          </span>
        </div>
        <ProgressBar progress={progressPct} variant="indigo" />
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Cartão {currentIndex + 1} de {vocabularyList.length}</span>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              currentVocab.language === 'pt'
                ? 'emerald'
                : currentVocab.language === 'es'
                ? 'amber'
                : 'indigo'
            }
            size="sm"
          >
            {currentVocab.language.toUpperCase()}
          </Badge>
          <span className="capitalize text-slate-300 font-mono text-[11px]">
            Repetições: {currentSRS.repetition_count} • EF: {currentSRS.ease_factor}
          </span>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        className="w-full min-h-[300px] bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl cursor-pointer transition-all flex flex-col justify-between select-none relative"
        role="button"
        tabIndex={0}
        aria-label="Cartão de recordação espaçada"
      >
        <div>
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-indigo-400 uppercase font-semibold">
              {currentVocab.part_of_speech} • CEFR {currentVocab.cefr_level}
            </span>
            <button
              onClick={handleSpeak}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
              title="Ouvir Pronúncia"
              aria-label="Ouvir Pronúncia"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Front content */}
          <div className="text-center py-6">
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {currentVocab.lemma}
            </h2>
            {currentVocab.phonetic_ipa && (
              <p className="text-sm font-mono text-indigo-300/80 mt-1.5">{currentVocab.phonetic_ipa}</p>
            )}
          </div>
        </div>

        {/* Back Content (Revealed on Flip) */}
        {isFlipped ? (
          <div className="pt-4 border-t border-slate-800 space-y-3 animate-fadeIn">
            {currentVocab.language === 'en' ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{currentVocab.definition_en}</p>
                  <div className="space-y-0.5 mt-1 text-xs text-slate-300">
                    {currentVocab.definition_pt && (
                      <p>
                        <span className="font-bold text-indigo-400">PT:</span> {currentVocab.definition_pt}
                      </p>
                    )}
                    {currentVocab.definition_es && (
                      <p>
                        <span className="font-bold text-emerald-400">ES:</span> {currentVocab.definition_es}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-lg border-l-2 border-indigo-500 text-xs space-y-1">
                  <p className="text-slate-100 font-medium">{currentVocab.example_sentence_target}</p>
                  <div className="space-y-0.5 pt-1 border-t border-slate-700/50 text-[11px] text-slate-300">
                    {currentVocab.example_sentence_pt && (
                      <p>
                        <span className="font-bold text-indigo-400">PT:</span> {currentVocab.example_sentence_pt}
                      </p>
                    )}
                    {currentVocab.example_sentence_es && (
                      <p>
                        <span className="font-bold text-emerald-400">ES:</span> {currentVocab.example_sentence_es}
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{currentVocab.definition_target}</p>
                  <p className="text-xs text-slate-400 italic mt-0.5">
                    <span className="font-bold text-slate-300 not-italic">EN:</span> {currentVocab.definition_en}
                  </p>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-lg border-l-2 border-indigo-500 text-xs">
                  <p className="text-slate-200">{currentVocab.example_sentence_target}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    <span className="font-bold text-slate-300">EN:</span> {currentVocab.example_sentence_en}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center pt-4 border-t border-slate-800/60">
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 hover:text-slate-300">
              <RotateCw className="w-3.5 h-3.5" /> Clique no cartão para virar e conferir
            </span>
          </div>
        )}
      </div>

      {/* SM-2 Rating Controls with Interval Predictions */}
      {isFlipped && (
        <div className="space-y-2 animate-fadeIn">
          <p className="text-xs text-slate-400 text-center font-medium">
            Avalie sua recordação com previsão de intervalo SM-2:
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRate(1)}
              className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">De Novo (1)</div>
              <div className="text-[10px] text-rose-400 font-mono">+{predictedNextStates.again.interval_days}d</div>
            </button>
            <button
              onClick={() => handleRate(3)}
              className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900 text-amber-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">Difícil (3)</div>
              <div className="text-[10px] text-amber-400 font-mono">+{predictedNextStates.hard.interval_days}d</div>
            </button>
            <button
              onClick={() => handleRate(4)}
              className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">Bom (4)</div>
              <div className="text-[10px] text-indigo-400 font-mono">+{predictedNextStates.good.interval_days}d</div>
            </button>
            <button
              onClick={() => handleRate(5)}
              className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900 text-emerald-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">Fácil (5)</div>
              <div className="text-[10px] text-emerald-400 font-mono">+{predictedNextStates.easy.interval_days}d</div>
            </button>
          </div>
        </div>
      )}

      {/* Session Progress Stats */}
      {sessionStats.total > 0 && (
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Sessão atual: {sessionStats.total} avaliados</span>
          <div className="flex gap-2">
            <span className="text-rose-400">↺ {sessionStats.again}</span>
            <span className="text-amber-400">⚡ {sessionStats.hard}</span>
            <span className="text-indigo-400">✓ {sessionStats.good}</span>
            <span className="text-emerald-400">★ {sessionStats.easy}</span>
          </div>
        </div>
      )}
    </div>
  );
};
