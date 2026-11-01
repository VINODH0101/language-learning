import React, { useState } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  BookMarked,
  Layers,
} from 'lucide-react';
import { MistakeNotebookItem, ExerciseAttempt, Language } from '../../../types';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
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

  // Derive genuine error categories from mistake logs and failed attempts
  const categoryCounts = new Map<string, number>();
  mistakes.forEach(m => {
    const cat = m.error_category || 'grammar';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  const topErrorCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Generate actionable, data-backed recommendations
  const recommendations: Array<{ id: string; title: string; desc: string; priority: 'high' | 'medium' | 'general' }> = [];

  if (dueSRSCount > 0) {
    recommendations.push({
      id: 'rec_srs',
      title: `${t('progress:rec_due_reviews_title', 'Consolidate Due Lexicon')} (${dueSRSCount} ${t('progress:terms_due', 'terms')})`,
      desc: t('progress:rec_due_reviews_desc', 'Clear your SM-2 flashcard queue today to prevent memory lapses along the forgetting curve.'),
      priority: 'high',
    });
  }

  if (topErrorCategories.length > 0) {
    const topCat = topErrorCategories[0];
    const catName = CATEGORY_LABELS[topCat[0]] || topCat[0];
    recommendations.push({
      id: 'rec_cat',
      title: `${t('progress:rec_weak_cat_title', 'Targeted Review')}: ${catName}`,
      desc: `${t('progress:rec_weak_cat_desc', 'Recorded')} ${topCat[1]} ${t('progress:errors_in_category', 'inaccuracies in this linguistic category. Revisit related lesson nodes in Practice.')}`,
      priority: 'high',
    });
  }

  if (failedAttempts.length > 3) {
    recommendations.push({
      id: 'rec_exercises',
      title: t('progress:rec_error_recovery_title', 'Error Recovery Session'),
      desc: t('progress:rec_error_recovery_desc', 'Work through your Mistake Notebook to turn recurring errors into consolidated competencies.'),
      priority: 'medium',
    });
  }

  // If evidence is insufficient, show honest general learning suggestion
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec_general',
      title: t('progress:rec_keep_going_title', 'Pace Your Daily Practice'),
      desc: t('progress:rec_keep_going_desc', 'Complete daily lessons and practice exercises to unlock personalized weak-area diagnostics.'),
      priority: 'general',
    });
  }

  return (
    <Card
      title={`${t('progress:weak_areas_title', 'Diagnostic Insights & Recommendations')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:weak_areas_subtitle',
        'Actionable learning suggestions derived strictly from your verified exercise telemetry and error logs'
      )}
    >
      <div className="space-y-5">
        {/* Recommendations Grid */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            {t('progress:actionable_recommendations', 'Recommended Next Steps')}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  rec.priority === 'high'
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className={`w-4 h-4 ${rec.priority === 'high' ? 'text-amber-400' : 'text-indigo-400'}`} />
                    <span className="text-xs font-bold text-slate-200 line-clamp-1">{rec.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.desc}</p>
                </div>

                {onNavigatePractice && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-end">
                    <button
                      type="button"
                      onClick={onNavigatePractice}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t('progress:practice_now', 'Practice Now')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Error Categories Breakdown */}
        {topErrorCategories.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
              {t('progress:recurring_error_categories', 'Identified Error Categories')}
            </span>

            <div className="flex flex-wrap gap-2">
              {topErrorCategories.map(([cat, count]) => (
                <div
                  key={cat}
                  className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700/80 text-xs flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-slate-200">
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

        {/* Expandable Mistake History */}
        {(mistakes.length > 0 || failedAttempts.length > 0) && (
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setIsMistakesExpanded(!isMistakesExpanded)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  {t('progress:view_mistake_history', 'Detailed Mistake Notebook')} ({mistakes.length + failedAttempts.length}{' '}
                  {t('progress:entries', 'entries')})
                </span>
              </span>
              {isMistakesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isMistakesExpanded && (
              <div className="mt-3 space-y-2.5 animate-fadeIn">
                {mistakes.slice(0, 5).map(m => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="amber" size="sm">
                        {CATEGORY_LABELS[m.error_category] || m.error_category}
                      </Badge>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(m.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-slate-300 font-medium">"{m.prompt}"</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300">
                        <span className="font-semibold block text-[10px] uppercase">{t('progress:your_answer', 'Your Submission')}:</span>
                        "{m.user_answer}"
                      </div>
                      <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                        <span className="font-semibold block text-[10px] uppercase">{t('progress:correct_answer', 'Expected Answer')}:</span>
                        "{m.correct_answer}"
                      </div>
                    </div>

                    {m.explanation && (
                      <p className="text-[11px] text-slate-400 italic pt-0.5">
                        {m.explanation}
                      </p>
                    )}
                  </div>
                ))}

                {failedAttempts.length > 0 && mistakes.length === 0 && (
                  <div className="space-y-2">
                    {failedAttempts.slice(0, 5).map(att => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center gap-3"
                      >
                        <div>
                          <span className="text-rose-400 font-semibold block">"{att.submitted_answer}"</span>
                          <span className="text-slate-400 text-[11px]">{att.feedback}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
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
