import React, { useState } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { MistakeNotebookItem, ExerciseAttempt, Language } from '../../../types';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { useI18n } from '../../../i18n/i18nContext';

interface WeakAreasCardProps {
  mistakes: MistakeNotebookItem[];
  failedAttempts: ExerciseAttempt[];
  dueSRSCount: number;
  selectedLanguage: Language;
  onNavigatePractice?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  subjunctive_mood: 'Subjunctive Mood / Hypotheses',
  preposition: 'Prepositions & Contractions',
  false_friend: 'False Friends / Lexical Interference',
  agreement: 'Gender & Number Agreement',
  vocabulary: 'Vocabulary & Idioms',
  grammar: 'Grammar & Conjugation',
};

export const WeakAreasCard: React.FC<WeakAreasCardProps> = ({
  mistakes,
  failedAttempts,
  dueSRSCount,
  selectedLanguage,
  onNavigatePractice,
}) => {
  const { t } = useI18n();
  const [isMistakesExpanded, setIsMistakesExpanded] = useState(false);

  const categoryCounts = new Map<string, number>();
  mistakes.forEach(m => {
    const cat = m.error_category || 'grammar';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  const topErrorCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const recommendations: Array<{
    id: string;
    title: string;
    desc: string;
    priority: 'high' | 'medium' | 'general';
  }> = [];

  if (dueSRSCount > 0) {
    recommendations.push({
      id: 'rec_srs',
      title: `${t('progress:rec_due_reviews_title', 'Clear Pending SRS Reviews')} (${dueSRSCount})`,
      desc: t(
        'progress:rec_due_reviews_desc',
        'You have {{count}} cards due for SuperMemo SM-2 recall.',
        { count: dueSRSCount }
      ),
      priority: 'high',
    });
  }

  if (topErrorCategories.length > 0) {
    const topCat = topErrorCategories[0];
    const catName = CATEGORY_LABELS[topCat[0]] || topCat[0];
    recommendations.push({
      id: 'rec_cat',
      title: `${t('progress:rec_weak_cat_title', 'Strengthen Focus: {{category}}', { category: catName })}`,
      desc: t(
        'progress:rec_weak_cat_desc',
        'Focused practice on {{category}} will help turn recurring mistakes into mastery.',
        { category: catName, accuracy: 0 }
      ),
      priority: 'high',
    });
  }

  if (failedAttempts.length > 3) {
    recommendations.push({
      id: 'rec_exercises',
      title: t('progress:rec_error_recovery_title', 'Review Mistake Notebook'),
      desc: t(
        'progress:rec_error_recovery_desc',
        'You have {{count}} recorded mistakes in this track. Targeted correction builds confidence.',
        { count: failedAttempts.length }
      ),
      priority: 'medium',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec_general',
      title: t('progress:rec_keep_going_title', 'Pace Your Daily Practice'),
      desc: t(
        'progress:rec_keep_going_desc',
        'Complete daily lessons and practice exercises to build personalized focus insights.',
        { accuracy: 100 }
      ),
      priority: 'general',
    });
  }

  return (
    <Card
      title={`${t('progress:weak_areas_title', 'Diagnostic Weak Areas & Mistake Recovery')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:weak_areas_subtitle',
        'Practical next steps based on your due flashcards and recorded mistakes'
      )}
    >
      <div className="space-y-4">
        {/* Actionable Recommendations */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            {t('progress:actionable_recommendations', 'Actionable Next Steps')}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  rec.priority === 'high'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-[#FAF9F6] border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-start gap-2 mb-1.5">
                    <Lightbulb
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        rec.priority === 'high' ? 'text-amber-700' : 'text-stone-600'
                      }`}
                    />
                    <span className="text-xs font-bold text-stone-900 leading-snug">{rec.title}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{rec.desc}</p>
                </div>

                {onNavigatePractice && (
                  <div className="pt-2 border-t border-stone-200/70 flex justify-end">
                    <button
                      type="button"
                      onClick={onNavigatePractice}
                      className="text-xs font-semibold text-stone-900 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{t('progress:practice_now', 'Practice Now')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Categories */}
        {topErrorCategories.length > 0 && (
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2.5">
              {t('progress:recurring_error_categories', 'Recurring Mistake Categories')}
            </span>

            <div className="flex flex-wrap gap-2">
              {topErrorCategories.map(([cat, count]) => (
                <div
                  key={cat}
                  className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold text-stone-800">
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                  <Badge variant="amber" size="sm">
                    {count} {t('progress:errors', 'errors')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Mistake Notebook Preview */}
        {(mistakes.length > 0 || failedAttempts.length > 0) && (
          <div className="border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={() => setIsMistakesExpanded(!isMistakesExpanded)}
              className="w-full flex items-center justify-between text-xs font-semibold text-stone-700 hover:text-stone-900 p-2 rounded-xl hover:bg-stone-100 cursor-pointer transition"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>
                  {t('progress:view_mistake_history', 'View Mistake History ({{count}})', {
                    count: mistakes.length + failedAttempts.length,
                  })}
                </span>
              </span>
              {isMistakesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isMistakesExpanded && (
              <div className="mt-3 space-y-2.5 animate-fadeIn">
                {mistakes.slice(0, 5).map(m => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-[#FAF9F6] border border-stone-200 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="amber" size="sm">
                        {CATEGORY_LABELS[m.error_category] || m.error_category}
                      </Badge>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {new Date(m.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-stone-900 font-medium">"{m.prompt}"</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                        <span className="font-bold block text-[10px] uppercase text-rose-700">
                          {t('progress:your_answer', 'Your answer')}:
                        </span>
                        "{m.user_answer}"
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <span className="font-bold block text-[10px] uppercase text-emerald-700">
                          {t('progress:correct_answer', 'Correct answer')}:
                        </span>
                        "{m.correct_answer}"
                      </div>
                    </div>

                    {m.explanation && (
                      <p className="text-[11px] text-stone-600 italic">{m.explanation}</p>
                    )}
                  </div>
                ))}

                {failedAttempts.length > 0 && mistakes.length === 0 && (
                  <div className="space-y-2">
                    {failedAttempts.slice(0, 5).map(att => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl bg-[#FAF9F6] border border-stone-200 text-xs flex justify-between items-center gap-3"
                      >
                        <div className="min-w-0">
                          <span className="text-rose-700 font-semibold block truncate">
                            "{att.submitted_answer}"
                          </span>
                          <span className="text-stone-600 text-[11px] block">{att.feedback}</span>
                        </div>
                        <span className="text-[11px] text-stone-500 font-mono shrink-0">
                          {new Date(att.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
