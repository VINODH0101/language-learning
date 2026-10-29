import React, { useState } from 'react';
import { RotateCw, CheckCircle2, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { VocabularyItem, SRSItemState } from '../../types';
import { SRSService } from '../../services/srs';
import { StorageService } from '../../services/storage';
import { SpeechService } from '../../services/speech';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface FlashcardDeckProps {
  vocabularyList: VocabularyItem[];
  onReviewFinished?: () => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  vocabularyList,
  onReviewFinished,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  if (!vocabularyList || vocabularyList.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Deck em Dia!</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Não há vocábulos pendentes para revisão no momento pelo algoritmo SuperMemo SM-2.
        </p>
      </div>
    );
  }

  const currentVocab = vocabularyList[currentIndex];
  const srsStates = StorageService.getSRSItems(currentVocab.language);
  const currentSRS = srsStates.find(s => s.vocabulary_item_id === currentVocab.id) ||
    SRSService.createInitialState(currentVocab.id, currentVocab.language);

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

    setIsFlipped(false);
    setCompletedCount(prev => prev + 1);

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

  return (
    <div className="space-y-4 max-w-xl mx-auto">
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
          <span className="capitalize text-slate-300">Status: {currentSRS.mastery_status}</span>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        className="w-full min-h-[280px] bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl cursor-pointer transition-all flex flex-col justify-between select-none relative"
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

      {/* SM-2 Rating Controls (Only active when flipped) */}
      {isFlipped && (
        <div className="space-y-2 animate-fadeIn">
          <p className="text-xs text-slate-400 text-center font-medium">
            Avalie sua recordação (Algoritmo SuperMemo SM-2):
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRate(1)}
              className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">De Novo</div>
              <div className="text-[10px] text-rose-400/80">1 dia</div>
            </button>
            <button
              onClick={() => handleRate(3)}
              className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900 text-amber-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">Difícil</div>
              <div className="text-[10px] text-amber-400/80">Intervalo curto</div>
            </button>
            <button
              onClick={() => handleRate(4)}
              className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">Bom</div>
              <div className="text-[10px] text-indigo-400/80">Padrão SM-2</div>
            </button>
            <button
              onClick={() => handleRate(5)}
              className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900 text-emerald-200 text-xs font-semibold cursor-pointer transition-all text-center"
            >
              <div className="font-bold">Fácil</div>
              <div className="text-[10px] text-emerald-400/80">Maior bônus</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
