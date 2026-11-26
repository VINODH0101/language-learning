import React from 'react';
import { Target, Info } from 'lucide-react';
import { ExerciseAttempt, Language } from '../../../types';
import { Card } from '../../../components/common/Card';
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
      title={`${t('progress:exercise_perf_title', 'Exercise Performance by Cognitive Type')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:exercise_perf_subtitle',
        'Accuracy tracked per exercise type for this language'
      )}
    >
      {total === 0 ? (
        <div className="text-center py-9 px-4 rounded-xl bg-[#FAF9F6] border border-dashed border-stone-200">
          <Target className="w-7 h-7 mx-auto text-stone-400 mb-2" />
          <p className="text-xs font-semibold text-stone-700">
            {t('progress:no_exercises_in_track', 'No exercise attempts recorded yet for this language.')}
          </p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {t('progress:complete_lesson_to_see_perf', 'Complete lessons and practice exercises to see accuracy trends.')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF9F6] p-4 rounded-xl border border-stone-200">
            <div>
              <span className="text-[11px] text-stone-500 font-semibold uppercase block">
                {t('progress:overall_track_accuracy', 'Overall Track Accuracy')}
              </span>
              <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">
                {accuracyPct}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 font-semibold uppercase block">
                {t('progress:correct_attempts', 'Correct Attempts')}
              </span>
              <span className="font-serif text-2xl font-bold text-emerald-700 mt-1 block">
                {correct} <span className="text-xs font-sans text-stone-500 font-normal">/ {total}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 font-semibold uppercase block">
                {t('progress:total_attempts', 'Total Attempts')}
              </span>
              <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">{total}</span>
            </div>
          </div>

          {/* Exercise Breakdown */}
          {typeBreakdown.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                {t('progress:perf_by_type', 'Performance Breakdown')}
              </span>

              <div className="space-y-2">
                {typeBreakdown.map(item => (
                  <div
                    key={item.type}
                    className="p-3 rounded-xl bg-stone-50/70 border border-stone-200"
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs font-semibold text-stone-800">{item.label}</span>
                      <span className="text-xs font-mono font-bold text-stone-700">
                        {item.pct}% ({item.correct}/{item.total})
                      </span>
                    </div>
                    <ProgressBar
                      progress={item.pct}
                      variant={item.pct >= 75 ? 'emerald' : item.pct >= 50 ? 'bronze' : 'amber'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Transparency Footnote */}
          <details className="text-xs text-stone-500 bg-[#FAF9F6] px-3.5 py-2.5 rounded-xl border border-stone-200">
            <summary className="cursor-pointer font-medium text-stone-700 flex items-center gap-1.5 select-none">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{t('progress:methodology_toggle', 'How this is calculated')}</span>
            </summary>
            <p className="mt-2 text-[11px] text-stone-500 leading-relaxed pl-5">
              {t(
                'progress:methodology_note',
                'Accuracy reflects verified learner submissions strictly within this language track.'
              )}
            </p>
          </details>
        </div>
      )}
    </Card>
  );
};
