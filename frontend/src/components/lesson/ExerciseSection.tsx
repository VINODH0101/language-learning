import React, { useState } from 'react';
import { Check, X, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { DailyLessonPayload, ExerciseAttempt, Language } from '../../types';
import { Button } from '../common/Button';
import { useI18n } from '../../i18n/i18nContext';
import { PracticeEngine } from '../../features/practice/engine/practiceEngine';

interface ExerciseSectionProps {
  exercises: DailyLessonPayload['section_9_exercises'];
  answerKeys: DailyLessonPayload['section_10_answer_keys'];
  language: Language;
}

export const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercises,
  answerKeys,
  language,
}) => {
  const { t } = useI18n();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; explanation: string } | null>(null);

  const currentExercise = exercises[currentIdx];
  const currentKey = answerKeys.find(k => k.exercise_id === currentExercise.id) || answerKeys[currentIdx];

  const handleCheck = () => {
    const answer = (currentExercise.options ? selectedOption : textInput).trim();
    if (!answer) return;

    const currentAttempts = (attemptsCount[currentExercise.id] || 0) + 1;
    setAttemptsCount(prev => ({ ...prev, [currentExercise.id]: currentAttempts }));

    const distractorsList = currentKey.distractor_feedback
      ? Object.entries(currentKey.distractor_feedback).map(([text, why_incorrect]) => ({
          text,
          why_incorrect,
        }))
      : [];

    const validation = PracticeEngine.evaluate({
      submittedAnswer: answer,
      acceptableSolutions: currentKey.acceptable_solutions,
      distractors: distractorsList,
      explanation: currentKey.explanation,
      attemptNumber: currentAttempts,
      exerciseType: currentExercise.exercise_type,
    });

    setFeedback({
      isCorrect: validation.isCorrect,
      message: validation.feedback,
      explanation: currentKey.explanation,
    });
    setSubmitted(true);

    PracticeEngine.recordAttempt({
      exerciseId: currentExercise.id,
      submittedAnswer: answer,
      validation,
      attemptCount: currentAttempts,
      language,
      exerciseType: currentExercise.exercise_type,
      prompt: currentExercise.prompt,
      contextPassage: currentExercise.context_passage,
      primarySolution: currentKey.acceptable_solutions[0] || '',
    });
  };

  const handleNext = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption('');
      setTextInput('');
      setSubmitted(false);
      setFeedback(null);
    }
  };

  const handleResetCurrent = () => {
    setSelectedOption('');
    setTextInput('');
    setSubmitted(false);
    setFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Exercise Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Progress & Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t('lesson_exercise_label', 'Exercício')} {currentIdx + 1} {t('lesson_exercise_of', 'de')} {exercises.length}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 uppercase font-mono">
              {currentExercise.exercise_type}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {exercises.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIdx(idx);
                  setSelectedOption('');
                  setTextInput('');
                  setSubmitted(false);
                  setFeedback(null);
                }}
                className={`w-6 h-6 rounded text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  currentIdx === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            {currentExercise.prompt}
          </p>
          {currentExercise.context_passage && (
            <div className="p-3.5 rounded-lg bg-slate-800/80 border-l-2 border-indigo-500 text-xs sm:text-sm font-serif text-slate-200">
              {currentExercise.context_passage}
            </div>
          )}
        </div>

        {/* Multiple Choice Options */}
        {currentExercise.options && currentExercise.options.length > 0 ? (
          <div className="space-y-2 pt-2">
            {currentExercise.options.map((opt, optIdx) => {
              const isSelected = selectedOption === opt;
              let optClasses = 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700/60';

              if (submitted) {
                const isAcceptable = currentKey.acceptable_solutions.includes(opt);
                if (isAcceptable) {
                  optClasses = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold';
                } else if (isSelected && !feedback?.isCorrect) {
                  optClasses = 'border-rose-500 bg-rose-950/40 text-rose-200';
                }
              } else if (isSelected) {
                optClasses = 'border-indigo-500 bg-indigo-950/50 text-indigo-200';
              }

              return (
                <div
                  key={optIdx}
                  onClick={() => !submitted && setSelectedOption(opt)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-between ${optClasses}`}
                >
                  <span>{opt}</span>
                  {submitted && currentKey.acceptable_solutions.includes(opt) && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {submitted && isSelected && !feedback?.isCorrect && (
                    <X className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Text Input for Cloze / Error Correction */
          <div className="pt-2 space-y-2">
            <input
              type="text"
              value={textInput}
              disabled={submitted}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('lesson_exercise_placeholder', 'Digite sua resposta aqui...')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !submitted) handleCheck();
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Hint if available */}
        {currentExercise.hint && !submitted && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1 italic">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {t('lesson_exercise_hint', 'Dica:')} {currentExercise.hint}
          </p>
        )}

        {/* Feedback Alert */}
        {submitted && feedback && (
          <div
            className={`p-4 rounded-xl text-xs space-y-1.5 border animate-fadeIn ${
              feedback.isCorrect
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-950 border-slate-700 text-slate-300'
            }`}
          >
            <p className="font-bold flex items-center gap-1.5">
              {feedback.isCorrect ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
              {feedback.message}
            </p>
            <p className="text-slate-300 leading-relaxed pl-5">{feedback.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            {submitted && !feedback?.isCorrect && (
              <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleResetCurrent}>
                {t('lesson_exercise_try_again', 'Tentar Novamente')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!submitted ? (
              <Button
                variant="primary"
                size="md"
                disabled={!(currentExercise.options ? selectedOption : textInput.trim())}
                onClick={handleCheck}
              >
                {t('lesson_exercise_check', 'Verificar Resposta')}
              </Button>
            ) : currentIdx < exercises.length - 1 ? (
              <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} onClick={handleNext}>
                {t('lesson_exercise_next', 'Próximo Exercício')}
              </Button>
            ) : (
              <span className="text-xs font-semibold text-emerald-400">
                {t('lesson_exercise_all_completed', '🎉 Todos os exercícios concluídos!')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
