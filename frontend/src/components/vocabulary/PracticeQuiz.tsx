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

  if (entries.length < 2) {
    return (
      <div className="text-center py-12 text-slate-400">
        São necessários pelo menos 2 vocábulos para gerar o teste prático.
      </div>
    );
  }

  const current = entries[currentIndex];
  const correctAnswer = current.translations[explanationLanguage] || current.translations['en'];

  // Generate 3 plausible distractors from the remaining entries
  const distractors = entries
    .filter(e => e.id !== current.id)
    .map(e => e.translations[explanationLanguage] || e.translations['en'])
    .slice(0, 3);

  // Shuffle options deterministically for current question
  const options = React.useMemo(() => {
    return [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
  }, [currentIndex, correctAnswer]);

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
      <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 mx-auto">
          <Award className="w-8 h-8 text-amber-400" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-100">Teste Concluído!</h2>
          <p className="text-sm text-slate-400">
            Você acertou <strong className="text-indigo-300 font-bold">{score}</strong> de {entries.length} questões ({accuracy}% de precisão).
          </p>
        </div>

        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition min-h-[44px] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refazer Exercício</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress & Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
        <span>
          Questão <strong className="text-slate-100">{currentIndex + 1}</strong> de {entries.length}
        </span>
        <span className="font-semibold text-indigo-400">
          Pontuação: {score}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase font-bold text-slate-400">
            Qual a tradução correta para {explanationLanguage.toUpperCase()}?
          </span>
          <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            {current.lemma}
          </h3>
          <p className="text-xs text-slate-400 italic">
            Exemplo: "{current.example_sentence_target}"
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            let classes = 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700/60';

            if (isSubmitted) {
              if (opt === correctAnswer) {
                classes = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold';
              } else if (isSelected) {
                classes = 'border-rose-500 bg-rose-950/40 text-rose-200';
              }
            } else if (isSelected) {
              classes = 'border-indigo-500 bg-indigo-950/60 text-indigo-200 font-semibold';
            }

            return (
              <button
                key={idx}
                onClick={() => !isSubmitted && setSelectedOption(opt)}
                disabled={isSubmitted}
                className={`w-full p-4 rounded-xl border text-sm text-left transition flex items-center justify-between min-h-[48px] cursor-pointer ${classes}`}
              >
                <span>{opt}</span>
                {isSubmitted && opt === correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isSubmitted && isSelected && opt !== correctAnswer && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Action */}
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition min-h-[44px] cursor-pointer shadow-md ${
              selectedOption
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Confirmar Resposta
          </button>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                selectedOption === correctAnswer
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              }`}
            >
              <p className="font-bold">
                {selectedOption === correctAnswer ? 'Correto! Excelente associação.' : 'Incorreto.'}
              </p>
              <p className="mt-1 text-slate-300">
                {current.definitions[explanationLanguage] || current.definitions['en']}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition min-h-[44px] cursor-pointer"
            >
              {currentIndex + 1 < entries.length ? 'Próxima Questão' : 'Ver Resultados'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
