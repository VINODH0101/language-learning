import React from 'react';
import { Award, CheckCircle2, RotateCcw, Info } from 'lucide-react';
import { DiagnosticResult, Language } from '../../../types';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';

interface DiagnosticSummaryCardProps {
  latestResult: DiagnosticResult | null;
  history: DiagnosticResult[];
  selectedLanguage: Language;
  onTakeDiagnostic: () => void;
  hasQuestionsAvailable: boolean;
}

export const DiagnosticSummaryCard: React.FC<DiagnosticSummaryCardProps> = ({
  latestResult,
  selectedLanguage,
  onTakeDiagnostic,
  hasQuestionsAvailable,
}) => {
  const { t } = useI18n();

  return (
    <Card
      title={`${t('progress:diagnostic_summary_title', 'Placement Diagnostic Evaluation')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:diagnostic_summary_subtitle',
        'Quick entry-level calibration across reading, vocabulary, and grammar'
      )}
    >
      <div className="space-y-4">
        {latestResult ? (
          <div className="space-y-4">
            {/* Result Summary Banner */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    {t('progress:recommended_placement', 'Recommended Placement')}
                  </span>
                  <Badge variant="emerald" size="sm">
                    {latestResult.recommended_cefr_level}
                  </Badge>
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  {latestResult.recommended_cefr_level} — {t('progress:level_entry_point', 'Entry Point')}
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  {t('progress:assessed_on', 'Assessed on')}: {latestResult.diagnostic_date} • {t('progress:overall_score', 'Score')}:{' '}
                  <strong className="text-stone-900">{latestResult.overall_score_percent}%</strong> ({latestResult.correct_count}/{latestResult.total_questions})
                </p>
              </div>

              {hasQuestionsAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw className="w-4 h-4 text-amber-700" />}
                  onClick={onTakeDiagnostic}
                  className="shrink-0 text-xs font-semibold cursor-pointer w-full sm:w-auto justify-center"
                >
                  {t('progress:retake_diagnostic_btn', 'Retake Diagnostic Assessment')}
                </Button>
              )}
            </div>

            {/* CEFR Stage Breakdown */}
            {latestResult.score_by_level && Object.keys(latestResult.score_by_level).length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {t('progress:score_by_level_breakdown', 'Score by CEFR Level')}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(latestResult.score_by_level).map(([lvl, score]) => (
                    <div
                      key={lvl}
                      className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center"
                    >
                      <span className="text-xs font-bold text-stone-500 block">{lvl}</span>
                      <span className="font-serif text-xl font-bold text-stone-900 block mt-0.5">{score}%</span>
                      <ProgressBar
                        progress={score}
                        className="mt-1.5"
                        variant={score >= 70 ? 'emerald' : score >= 50 ? 'bronze' : 'amber'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Focus */}
            {(latestResult.strengths?.length || latestResult.recommended_focus_areas?.length) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {latestResult.strengths && latestResult.strengths.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 block mb-1.5">
                      {t('progress:demonstrated_strengths', 'Demonstrated Strengths')}
                    </span>
                    <ul className="text-xs text-stone-700 space-y-1">
                      {latestResult.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestResult.recommended_focus_areas && latestResult.recommended_focus_areas.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 block mb-1.5">
                      {t('progress:recommended_focus', 'Recommended Focus')}
                    </span>
                    <ul className="text-xs text-stone-700 space-y-1">
                      {latestResult.recommended_focus_areas.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <p className="text-[11px] text-stone-500 flex items-start gap-1.5 px-1">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span>
                {t(
                  'progress:certification_disclaimer',
                  'Placement estimates curriculum entry level only and is not a formal external certification.'
                )}
              </span>
            </p>
          </div>
        ) : (
          <div className="text-center py-9 px-4 rounded-xl bg-[#FAF9F6] border border-dashed border-stone-200">
            <div className="w-11 h-11 mx-auto rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3">
              <Award className="w-5 h-5" />
            </div>
            <p className="font-serif text-sm font-bold text-stone-900">
              {t('progress:no_diagnostic_yet', 'No diagnostic placement test recorded yet.')}
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {hasQuestionsAvailable
                ? t(
                    'progress:take_diagnostic_prompt',
                    'Calibrate your entrance level from A1 to C1 in a few minutes.'
                  )
                : t(
                    'progress:diagnostic_not_supported_yet',
                    'Diagnostic placement test for this track is in preparation. Adjust course level in Settings anytime.'
                  )}
            </p>

            {hasQuestionsAvailable && (
              <Button
                variant="outline"
                size="sm"
                icon={<Award className="w-4 h-4 text-amber-700" />}
                onClick={onTakeDiagnostic}
                className="text-xs font-semibold cursor-pointer"
              >
                {t('progress:take_diagnostic_btn', 'Take Diagnostic Assessment')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
