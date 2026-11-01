import React from 'react';
import { Target, CheckCircle2, XCircle, Info, BarChart2 } from 'lucide-react';
import { ExerciseAttempt, Language } from '../../../types';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';

interface ExercisePerformanceCardProps {
  attempts: ExerciseAttempt[];
  selectedLanguage: Language;
}

const TYPE_LABELS: Record<string, string> = {
  cloze: 'Cloze Fill-in-the-Blank',
  multiple_choice: 'Multiple Choice',
  reorder: 'Sentence Reordering',
  error_correction: 'Error Correction',
  translation: 'Sentence Translation',
  matching: 'Vocabulary Matching',
  listening_comprehension: 'Listening Comprehension',
  reading_comprehension: 'Reading Comprehension',
  grammar_correction: 'Grammar Correction',
  writing_response: 'Free Writing Response',
  conversation_response: 'Dialogue Response',
  pronunciation_practice: 'Pronunciation Practice',
};

export const ExercisePerformanceCard: React.FC<ExercisePerformanceCardProps> = ({
  attempts,
  selectedLanguage,
}) => {
  const { t } = useI18n();

  const total = attempts.length;
  const correct = attempts.filter(a => a.is_correct).length;
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Breakdown by exercise type
  const typeMap = new Map<string, { total: number; correct: number }>();
  attempts.forEach(a => {
    const rawType = a.exercise_type || 'multiple_choice';
    const curr = typeMap.get(rawType) || { total: 0, correct: 0 };
    curr.total += 1;
    if (a.is_correct) curr.correct += 1;
    typeMap.set(rawType, curr);
  });

  const typeBreakdown = Array.from(typeMap.entries()).map(([type, stats]) => ({
    type,
    label: TYPE_LABELS[type] || type,
    total: stats.total,
    correct: stats.correct,
    pct: Math.round((stats.correct / stats.total) * 100),
  }));

  return (
    <Card
      title={`${t('progress:exercise_perf_title', 'Exercise Performance & Accuracy')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:exercise_perf_subtitle',
        'Scoped strictly to this language track — independent from other language progress'
      )}
    >
      {total === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-slate-950/40 border border-slate-800">
          <Target className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <p className="text-xs font-semibold text-slate-300">
            {t('progress:no_exercises_in_track', 'No exercise attempts recorded for this language track yet.')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {t('progress:complete_lesson_to_see_perf', 'Complete lesson exercises to see diagnostic accuracy and category trends.')}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                {t('progress:overall_track_accuracy', 'Track Accuracy')}
              </span>
              <span className="text-2xl font-black text-slate-100 mt-1 block">
                {accuracyPct}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                {t('progress:correct_attempts', 'Successful Submissions')}
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {correct} <span className="text-xs text-slate-400 font-normal">/ {total}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                {t('progress:total_attempts', 'Total Track Attempts')}
              </span>
              <span className="text-2xl font-black text-slate-200 mt-1 block">{total}</span>
            </div>
          </div>

          {/* Exercise Types Performance Bars */}
          {typeBreakdown.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {t('progress:perf_by_type', 'Performance by Exercise Category')}
              </span>

              <div className="space-y-2.5">
                {typeBreakdown.map(item => (
                  <div
                    key={item.type}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {item.pct}% ({item.correct}/{item.total})
                        </span>
                      </div>
                      <ProgressBar
                        progress={item.pct}
                        variant={item.pct >= 75 ? 'emerald' : item.pct >= 50 ? 'indigo' : 'amber'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Methodology Transparency Footnote */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              {t(
                'progress:methodology_note',
                'Zero-Fabrication Guarantee: Accuracy rate is calculated strictly on verified learner submissions for the selected language track. Repeated attempts are counted individually to capture mastery progression over time.'
              )}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
