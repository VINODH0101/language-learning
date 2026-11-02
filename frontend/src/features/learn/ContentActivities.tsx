import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen,
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
    for (const q of act.configuration.questions) {
      allQuestions.push({ activityId: act.id, question: q });
    }
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (allQuestions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">No Interactive Activities Available</h3>
        <p className="text-xs text-slate-400">This reading text is self-directed reading practice.</p>
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-100">Comprehension Completed!</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You scored <span className="font-bold text-indigo-400">{score}%</span> ({correctCount}/{allQuestions.length} correct).
            {score < 100 && ' Incorrect answers have been added to your Mistake Notebook for spaced remediation.'}
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Question Header & Progress Bar */}
      <div className="space-y-3 border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Activity Question {currentIdx + 1} of {allQuestions.length}
          </span>
          <Badge variant="slate">{question.type.replace('_', ' ').toUpperCase()}</Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIdx + 1) / allQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stem / Question */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
          {question.stem}
        </h3>

        {/* Multiple Choice Options */}
        {question.options && question.options.length > 0 && (
          <div className="space-y-2.5">
            {question.options.map(opt => {
              const isSelected = selectedAnswers[question.id] === opt.text;
              let btnStyle = 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700';

              if (isSubmitted) {
                const isCorrectOption = opt.text.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
                if (isCorrectOption) {
                  btnStyle = 'bg-emerald-950/40 border-emerald-600 text-emerald-200 font-semibold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/40 border-rose-600 text-rose-200';
                } else {
                  btnStyle = 'bg-slate-950/30 border-slate-800/40 text-slate-500';
                }
              } else if (isSelected) {
                btnStyle = 'bg-indigo-950/50 border-indigo-500 text-indigo-100 shadow-sm';
              }

              return (
                <button
                  key={opt.id}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(opt.text)}
                  className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <span>{opt.text}</span>
                  {isSubmitted && opt.text.trim().toLowerCase() === question.correct_answer.trim().toLowerCase() && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
          className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
            isCorrect
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Incorrect — Saved to your Mistake Notebook</span>
              </>
            )}
          </div>
          <p className="leading-relaxed text-slate-300">{question.explanation}</p>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <span className="text-xs text-slate-500">
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
