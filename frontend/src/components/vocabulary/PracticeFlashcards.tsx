import React, { useState } from 'react';
import { RotateCw, Volume2, CheckCircle2, AlertCircle, Shuffle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { VocabularyEntry } from '../../types/vocabulary';
import { Language } from '../../types';
import { AudioButton } from '../common/AudioButton';

interface PracticeFlashcardsProps {
  entries: VocabularyEntry[];
  explanationLanguage: Language;
}

export const PracticeFlashcards: React.FC<PracticeFlashcardsProps> = ({
  entries,
  explanationLanguage,
}) => {
  const [deck, setDeck] = useState<VocabularyEntry[]>([...entries]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  if (deck.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Nenhum cartão disponível para os filtros atuais.
      </div>
    );
  }

  const current = deck[currentIndex];
  const translation = current.translations[explanationLanguage] || current.translations['en'];
  const definition = current.definitions[explanationLanguage] || current.definitions['en'];
  const exampleTrans = current.example_sentence_translations[explanationLanguage] || current.example_sentence_translations['en'];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % deck.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + deck.length) % deck.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
  };

  const handleMarkMastered = (id: string) => {
    setMasteredIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    handleNext();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Deck Stats & Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Cartão <strong className="text-slate-100">{currentIndex + 1}</strong> de {deck.length}
        </span>

        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-semibold">
            {masteredIds.size} Dominados
          </span>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 hover:text-slate-200 transition cursor-pointer p-1 rounded"
            title="Embaralhar Cartões"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Embaralhar</span>
          </button>
        </div>
      </div>

      {/* Flip Card Viewport */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[280px] sm:min-h-[320px] bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl cursor-pointer hover:border-indigo-400 transition transform hover:-translate-y-0.5 select-none"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 uppercase">
            {current.target_language} • {current.cefr_level}
          </span>

          <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <RotateCw className="w-3 h-3 text-indigo-400" />
            <span>{isFlipped ? 'Frente' : 'Toque para Virar'}</span>
          </span>
        </div>

        {/* Card Body */}
        {!isFlipped ? (
          /* FRONT SIDE */
          <div className="text-center space-y-3 my-auto py-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              {current.lemma}
            </h2>

            {current.phonetic_ipa && (
              <p className="text-sm font-mono text-indigo-300 bg-slate-800/80 inline-block px-3 py-1 rounded-full border border-slate-700">
                {current.phonetic_ipa}
              </p>
            )}

            <p className="text-xs text-slate-400 capitalize">
              {current.part_of_speech} • Tema: {current.topic.replace('_', ' ')}
            </p>
          </div>
        ) : (
          /* BACK SIDE */
          <div className="space-y-4 my-auto py-3 animate-fadeIn">
            <div className="text-center border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-bold text-slate-400 block">Significado:</span>
              <h3 className="text-2xl font-bold text-indigo-300 mt-1">{translation}</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-center">
              {definition}
            </p>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
              <p className="text-xs font-semibold text-slate-100 italic">
                "{current.example_sentence_target}"
              </p>
              <p className="text-xs text-slate-400">
                → {exampleTrans}
              </p>
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div onClick={e => e.stopPropagation()}>
            <AudioButton text={current.lemma} language={current.target_language} />
          </div>

          <span className="text-[11px] text-slate-500">
            {isFlipped ? 'Explicação em ' + explanationLanguage.toUpperCase() : 'Recuperação ativa'}
          </span>
        </div>
      </div>

      {/* Navigation & Learning Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Cartão Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => handleNext()}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition min-h-[44px] cursor-pointer"
          >
            Ainda Aprendendo
          </button>

          <button
            onClick={() => handleMarkMastered(current.id)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Já Dominei</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Próximo Cartão"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
