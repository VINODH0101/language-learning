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
      <div className="bg-white border border-dashed border-stone-300 rounded-2xl text-center py-12 text-stone-500 text-sm max-w-lg mx-auto">
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
    <div className="max-w-xl mx-auto space-y-5">
      {/* Top Deck Stats & Controls */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>
          Cartão <strong className="text-stone-900">{currentIndex + 1}</strong> de {deck.length}
        </span>

        <div className="flex items-center gap-3">
          <span className="text-emerald-700 font-semibold">
            {masteredIds.size} Dominados
          </span>

          <button
            type="button"
            onClick={handleShuffle}
            className="flex items-center gap-1 hover:text-stone-900 transition cursor-pointer p-1.5 rounded-lg hover:bg-stone-100"
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
        className="min-h-[280px] sm:min-h-[320px] bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm cursor-pointer hover:border-amber-300 transition select-none"
      >
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
            {current.target_language} • {current.cefr_level}
          </span>

          <span className="flex items-center gap-1 text-xs text-stone-500 font-medium">
            <RotateCw className="w-3 h-3 text-amber-700" />
            <span>{isFlipped ? 'Frente' : 'Toque para Virar'}</span>
          </span>
        </div>

        {!isFlipped ? (
          <div className="text-center space-y-3 my-auto py-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              {current.lemma}
            </h2>

            {current.phonetic_ipa && (
              <p className="text-sm font-mono text-stone-700 bg-stone-100 inline-block px-3 py-1 rounded-full border border-stone-200">
                {current.phonetic_ipa}
              </p>
            )}

            <p className="text-xs text-stone-500 capitalize">
              {current.part_of_speech} • {current.topic.replace('_', ' ')}
            </p>
          </div>
        ) : (
          <div className="space-y-4 my-auto py-3 animate-fadeIn">
            <div className="text-center border-b border-stone-200 pb-3">
              <span className="text-xs uppercase font-bold text-stone-500 block">Significado:</span>
              <h3 className="font-serif text-2xl font-bold text-amber-800 mt-1">{translation}</h3>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed text-center">
              {definition}
            </p>

            <div className="p-3 bg-[#FAF9F6] rounded-xl border border-stone-200 space-y-1">
              <p className="font-serif text-xs font-semibold text-stone-900 italic">
                "{current.example_sentence_target}"
              </p>
              <p className="text-xs text-stone-500">
                → {exampleTrans}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div onClick={e => e.stopPropagation()}>
            <AudioButton text={current.lemma} language={current.target_language} />
          </div>

          <span className="text-[11px] text-stone-500">
            {isFlipped ? explanationLanguage.toUpperCase() : 'Recuperação ativa'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={handlePrev}
          className="p-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Cartão Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={() => handleNext()}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold border border-stone-200 transition min-h-[44px] cursor-pointer"
          >
            Ainda Aprendendo
          </button>

          <button
            type="button"
            onClick={() => handleMarkMastered(current.id)}
            className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Já Dominei</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="p-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Próximo Cartão"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
