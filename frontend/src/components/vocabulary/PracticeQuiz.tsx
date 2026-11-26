import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, HelpCircle, Sparkles, Award } from 'lucide-react';
import { VocabularyEntry } from '../../types/vocabulary';
import { Language } from '../../types';

interface PracticeQuizProps {
  entries: VocabularyEntry[];
  explanationLanguage: Language;
}

export const PracticeQuiz: React.FC<PracticeQuizProps> = ({
  entries,
  explanationLanguage,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const current = entries && entries.length > 0 ? entries[currentIndex] : null;
  const correctAnswer = current ? (current.translations[explanationLanguage] || current.translations['en'] || '') : '';

  // Generate 3 plausible distractors from the remaining entries
  const distractors = React.useMemo(() => {
    if (!current || entries.length < 2) return [];
    return entries
      .filter(e => e.id !== current.id)
      .map(e => e.translations[explanationLanguage] || e.translations['en'] || '')
      .slice(0, 3);
  }, [entries, current, explanationLanguage]);

  // Shuffle options deterministically for current question
  const options = React.useMemo(() => {
    if (!correctAnswer) return [];
    return [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
  }, [currentIndex, correctAnswer, distractors]);

  if (entries.length < 2 || !current) {
    return (
      <div className="bg-white border border-dashed border-stone-300 rounded-2xl text-center py-12 text-stone-500 text-sm max-w-lg mx-auto">
        São necessários pelo menos 2 vocábulos para gerar o teste prático.
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    if (selectedOption === correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < entries.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const accuracy = Math.round((score / entries.length) * 100);
    return (
      <div className="max-w-md mx-auto bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-5 shadow-xs animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
          <Award className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Teste Concluído!</h2>
          <p className="text-sm text-stone-600">
            Você acertou <strong className="text-stone-900 font-bold">{score}</strong> de {entries.length} questões ({accuracy}% de precisão).
          </p>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold shadow-xs transition min-h-[44px] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refazer Exercício</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Progress & Header */}
      <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-200 pb-3">
        <span>
          Questão <strong className="text-stone-900">{currentIndex + 1}</strong> de {entries.length}
        </span>
        <span className="font-semibold text-amber-800">
          Pontuação: {score}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="text-center space-y-1.5">
          <span className="text-xs uppercase font-bold text-stone-500">
            Qual a tradução correta para {explanationLanguage.toUpperCase()}?
          </span>
          <h3 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
            {current.lemma}
          </h3>
          <p className="font-serif text-xs text-stone-500 italic">
            "{current.example_sentence_target}"
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            let classes = 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50';

            if (isSubmitted) {
              if (opt === correctAnswer) {
                classes = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold';
              } else if (isSelected) {
                classes = 'border-rose-300 bg-rose-50 text-rose-900';
              }
            } else if (isSelected) {
              classes = 'border-stone-900 bg-stone-100 text-stone-900 font-semibold';
            }

            return (
              <button
                type="button"
                key={idx}
                onClick={() => !isSubmitted && setSelectedOption(opt)}
                disabled={isSubmitted}
                className={`w-full p-4 rounded-xl border text-sm text-left transition flex items-center justify-between min-h-[48px] cursor-pointer ${classes}`}
              >
                <span>{opt}</span>
                {isSubmitted && opt === correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isSubmitted && isSelected && opt !== correctAnswer && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition min-h-[44px] cursor-pointer ${
              selectedOption
                ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
            }`}
          >
            Confirmar Resposta
          </button>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                selectedOption === correctAnswer
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <p className="font-bold">
                {selectedOption === correctAnswer ? 'Correto! Excelente associação.' : 'Incorreto.'}
              </p>
              <p className="mt-1 text-stone-700">
                {current.definitions[explanationLanguage] || current.definitions['en']}
              </p>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold shadow-xs transition min-h-[44px] cursor-pointer"
            >
              {currentIndex + 1 < entries.length ? 'Próxima Questão' : 'Ver Resultados'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
