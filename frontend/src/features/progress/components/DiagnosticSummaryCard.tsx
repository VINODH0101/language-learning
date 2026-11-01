import React from 'react';
import { Award, CheckCircle2, ChevronRight, RotateCcw, AlertCircle, Info } from 'lucide-react';
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
  history,
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
        'Initial competency calibration used to recommend curriculum starting levels (non-accredited entrance estimate)'
      )}
    >
      <div className="space-y-5">
        {latestResult ? (
          <div className="space-y-4">
            {/* Top Result Banner */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('progress:recommended_placement', 'Recommended Entrance Level')}
                  </span>
                  <Badge variant="emerald" size="sm">
                    {latestResult.recommended_cefr_level}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-slate-100">
                  {latestResult.recommended_cefr_level} — {t('progress:level_entry_point', 'Calibrated Starting Point')}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t('progress:assessed_on', 'Assessed on')}: {latestResult.diagnostic_date} • {t('progress:overall_score', 'Score')}:{' '}
                  <strong className="text-slate-200">{latestResult.overall_score_percent}%</strong> ({latestResult.correct_count}/{latestResult.total_questions})
                </p>
              </div>

              {hasQuestionsAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw className="w-4 h-4 text-indigo-400" />}
                  onClick={onTakeDiagnostic}
                  className="shrink-0 text-xs font-semibold cursor-pointer border-slate-700"
                >
                  {t('progress:retake_diagnostic_btn', 'Retake Diagnostic')}
                </Button>
              )}
            </div>

            {/* Score by CEFR Level Breakdown */}
            {latestResult.score_by_level && Object.keys(latestResult.score_by_level).length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {t('progress:score_by_level_breakdown', 'Performance by CEFR Stage')}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(latestResult.score_by_level).map(([lvl, score]) => (
                    <div
                      key={lvl}
                      className="p-3 rounded-xl bg-slate-850/60 border border-slate-800 text-center"
                    >
                      <span className="text-xs font-bold text-slate-400 block">{lvl}</span>
                      <span className="text-lg font-black text-slate-100 block mt-0.5">{score}%</span>
                      <ProgressBar
                        progress={score}
                        className="mt-1.5"
                        variant={score >= 70 ? 'emerald' : score >= 50 ? 'indigo' : 'amber'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Focus Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {latestResult.strengths && latestResult.strengths.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                  <span className="text-xs font-bold text-emerald-300 block mb-1.5">
                    {t('progress:demonstrated_strengths', 'Demonstrated Strengths')}
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {latestResult.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestResult.recommended_focus_areas && latestResult.recommended_focus_areas.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40">
                  <span className="text-xs font-bold text-amber-300 block mb-1.5">
                    {t('progress:recommended_focus', 'Recommended Focus Areas')}
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {latestResult.recommended_focus_areas.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Truth in Advertising Certification Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                {t(
                  'progress:certification_disclaimer',
                  'Assessment Qualification: Placement results represent an estimated curriculum entry level. Lexilume does not provide accredited formal language certifications (such as DELE, CAPLE, or Cambridge exams).'
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 px-4 rounded-2xl bg-slate-950/40 border border-slate-800">
            <Award className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              {t('progress:no_diagnostic_yet', 'No diagnostic placement test recorded for this language track.')}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {hasQuestionsAvailable
                ? t(
                    'progress:take_diagnostic_prompt',
                    'Calibrate your entrance level from A1 to C1 without assuming a beginner profile.'
                  )
                : t(
                    'progress:diagnostic_not_supported_yet',
                    'Diagnostic placement test for this language track is currently under development. Study from A1 or adjust course level in Settings.'
                  )}
            </p>

            {hasQuestionsAvailable && (
              <Button
                variant="outline"
                size="sm"
                icon={<Award className="w-4 h-4 text-indigo-400" />}
                onClick={onTakeDiagnostic}
                className="text-xs font-semibold cursor-pointer border-slate-700"
              >
                {t('progress:take_diagnostic_btn', 'Take Placement Diagnostic')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
