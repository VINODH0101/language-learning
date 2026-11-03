import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  ActivityQuestion,
} from '../../types/contentCentred';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { contentCentredService } from '../../services/contentCentredService';
import { authService } from '../../services/auth';
import { toast } from 'sonner';

interface ContentActivitiesProps {
  item: ContentItem;
  version: ContentVersion;
  activities: LearningActivity[];
  onComplete?: (scorePercent: number) => void;
}

export const ContentActivities: React.FC<ContentActivitiesProps> = ({
  item,
  version,
  activities,
  onComplete,
}) => {
  const allQuestions: Array<{ activityId: string; question: ActivityQuestion }> = [];
  for (const act of activities) {
    if (act.configuration?.questions) {
      for (const q of act.configuration.questions) {
        allQuestions.push({ activityId: act.id, question: q });
      }
    }
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (allQuestions.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl space-y-2">
        <Sparkles className="w-8 h-8 text-stone-400 mx-auto" />
        <h3 className="text-sm font-semibold text-stone-800">No Interactive Activities Available</h3>
        <p className="text-xs text-stone-500">This reading text is self-directed reading practice.</p>
      </div>
    );
  }

  const current = allQuestions[currentIdx];
  const { question, activityId } = current;
  const isSubmitted = submittedAnswers[question.id] !== undefined;
  const isCorrect = submittedAnswers[question.id] === true;

  const handleSelectOption = (text: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [question.id]: text }));
  };

  const handleSubmitQuestion = async () => {
    const selected = selectedAnswers[question.id];
    if (!selected) return;

    const normalizedSelected = selected.trim().toLowerCase();
    const normalizedCorrect = question.correct_answer.trim().toLowerCase();
    const correct = normalizedSelected === normalizedCorrect;

    setSubmittedAnswers(prev => ({ ...prev, [question.id]: correct }));
    if (correct) {
      setCorrectCount(prev => prev + 1);
    } else {
      // Record mistake in pedagogical notebook
      try {
        const auth = authService.getState();
        const userId = auth.user?.id || 'guest_user';

        await contentCentredService.recordUserMistake({
          user_id: userId,
          content_item_id: item.id,
          content_version_id: version.id,
          activity_id: activityId,
          activity_type: 'reading_comprehension',
          error_category: question.type === 'vocabulary_in_context' ? 'vocabulary_choice' : 'comprehension_inference',
          stimulus: question.stem,
          user_response: selected,
          correct_response: question.correct_answer,
          pedagogical_explanation: question.explanation,
        });
      } catch (err) {
        console.warn('Error recording mistake:', err);
      }
    }
  };

  const handleNext = async () => {
    if (currentIdx + 1 < allQuestions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Completed all questions
      const finalCorrect = correctCount + (submittedAnswers[question.id] ? 0 : 0);
      const score = Math.round((finalCorrect / allQuestions.length) * 100);
      setIsCompleted(true);

      try {
        const auth = authService.getState();
        const userId = auth.user?.id || 'guest_user';

        await contentCentredService.updateLearnerProgress({
          user_id: userId,
          content_item_id: item.id,
          content_version_id: version.id,
          status: 'completed',
          percent_complete: 100,
          comprehension_score: score / 100,
          completed_activity_ids: activities.map(a => a.id),
        });

        toast.success(`Session finished with score of ${score}%!`);
        if (onComplete) onComplete(score);
      } catch (err) {
        console.warn('Error saving final progress:', err);
      }
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setCorrectCount(0);
    setCurrentIdx(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const score = Math.round((correctCount / allQuestions.length) * 100);
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-6 shadow-xs animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center mx-auto shadow-xs">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-serif font-bold text-stone-900">Comprehension Completed</h3>
          <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            You scored <span className="font-bold text-stone-900">{score}%</span> ({correctCount}/{allQuestions.length} correct).
            {score < 100 && ' Any incorrect answers have been added to your Mistake Notebook for spaced review.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="md" icon={<RotateCcw className="w-4 h-4" />} onClick={handleRestart}>
            Practice Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Question Header & Progress Bar */}
      <div className="space-y-3 border-b border-stone-200 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            Reading Exercise {currentIdx + 1} of {allQuestions.length}
          </span>
          <Badge variant="slate">{question.type.replace('_', ' ').toUpperCase()}</Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIdx + 1) / allQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stem / Question */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-snug">
          {question.stem}
        </h3>

        {/* Multiple Choice Options */}
        {question.options && question.options.length > 0 && (
          <div className="space-y-2.5">
            {question.options.map(opt => {
              const isSelected = selectedAnswers[question.id] === opt.text;
              let btnStyle = 'bg-white border-stone-200 text-stone-800 hover:border-stone-400 hover:bg-stone-50/50';

              if (isSubmitted) {
                const isCorrectOption = opt.text.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
                if (isCorrectOption) {
                  btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                } else {
                  btnStyle = 'bg-stone-50 border-stone-100 text-stone-400';
                }
              } else if (isSelected) {
                btnStyle = 'bg-amber-50 border-amber-300 text-stone-900 font-medium ring-1 ring-amber-300';
              }

              return (
                <button
                  key={opt.id}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(opt.text)}
                  className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                >
                  <span>{opt.text}</span>
                  {isSubmitted && opt.text.trim().toLowerCase() === question.correct_answer.trim().toLowerCase() && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Answer Feedback Panel */}
      {isSubmitted && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-150 ${
            isCorrect
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-sm">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Correct</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Incorrect — Saved to your Mistake Notebook</span>
              </>
            )}
          </div>
          <p className="leading-relaxed text-stone-700">{question.explanation}</p>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-200">
        <span className="text-xs text-stone-500 font-sans">
          Score: {correctCount}/{currentIdx + (isSubmitted ? 1 : 0)}
        </span>

        {!isSubmitted ? (
          <Button
            variant="primary"
            size="md"
            disabled={!selectedAnswers[question.id]}
            onClick={handleSubmitQuestion}
          >
            Check Answer
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={handleNext}
          >
            {currentIdx + 1 < allQuestions.length ? 'Next Question' : 'View Summary'}
          </Button>
        )}
      </div>
    </div>
  );
};
