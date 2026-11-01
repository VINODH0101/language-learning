import React, { useState } from 'react';
import { X, Award, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { DiagnosticQuestion, DiagnosticResult, CEFRLevel, Language } from '../../types';
import { diagnosticQuestions } from '../../data/seedData';
import { StorageService } from '../../services/storage';
import { courseService } from '../../services/courseService';
import { getLanguageName } from '../../lib/languages/languageMatrix';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useI18n } from '../../i18n/i18nContext';

interface PlacementTestModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: DiagnosticResult) => void;
}

export const PlacementTestModal: React.FC<PlacementTestModalProps> = ({
  language,
  isOpen,
  onClose,
  onComplete,
}) => {
  const { t, interfaceLanguage } = useI18n();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  if (!isOpen) return null;

  const questions = diagnosticQuestions.filter(q => q.language === language);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">
            {t('progress:diagnostic_not_available_title', 'Placement Diagnostic In Preparation')}
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {t(
              'progress:diagnostic_not_available_desc',
              'Interactive diagnostic questions for this language track are currently under calibration. Placement starts at A1, and your level can be configured in Course Settings.'
            )}
          </p>
          <div className="mt-5">
            <Button variant="outline" size="sm" onClick={onClose} className="w-full text-xs cursor-pointer">
              {t('common:close', 'Close')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: optIdx }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = () => {
    let correctCount = 0;
    const levelTotals: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
    const levelCorrect: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
    const strengths: string[] = [];
    const focusAreas: string[] = [];

    questions.forEach(q => {
      const chosen = selectedAnswers[q.id];
      levelTotals[q.cefr_level] = (levelTotals[q.cefr_level] || 0) + 1;
      if (chosen === q.correct_option_index) {
        correctCount++;
        levelCorrect[q.cefr_level] = (levelCorrect[q.cefr_level] || 0) + 1;
        strengths.push(q.grammatical_focus);
      } else {
        focusAreas.push(q.grammatical_focus);
      }
    });

    const scoreByLevel: Record<string, number> = {};
    let recommendedLevel: CEFRLevel = 'A1';

    (['A1', 'A2', 'B1', 'B2'] as CEFRLevel[]).forEach(lvl => {
      const tot = levelTotals[lvl] || 0;
      const cor = levelCorrect[lvl] || 0;
      const pct = tot > 0 ? (cor / tot) * 100 : 0;
      scoreByLevel[lvl] = Math.round(pct);
      if (pct >= 70) {
        if (lvl === 'A1') recommendedLevel = 'A2';
        if (lvl === 'A2') recommendedLevel = 'B1';
        if (lvl === 'B1') recommendedLevel = 'B2';
        if (lvl === 'B2') recommendedLevel = 'C1';
      }
    });

    const overallPct = Math.round((correctCount / questions.length) * 100);

    const diagResult: DiagnosticResult = {
      user_id: StorageService.getCurrentUser(),
      language,
      recommended_cefr_level: recommendedLevel,
      recommended_curriculum_node_id: `${language}-${recommendedLevel.toLowerCase()}-01`,
      score_by_level: scoreByLevel,
      overall_score_percent: overallPct,
      total_questions: questions.length,
      correct_count: correctCount,
      diagnostic_date: new Date().toISOString().split('T')[0],
      feedback_summary: `Avaliação diagnóstica calibrada com ${overallPct}% de acerto global. Nível recomendado: ${recommendedLevel}.`,
      strengths: Array.from(new Set(strengths)).slice(0, 3),
      recommended_focus_areas: Array.from(new Set(focusAreas)).slice(0, 3),
    };

    // Save result and update track CEFR level directly
    StorageService.saveDiagnosticResult(diagResult);
    const track = StorageService.getTrackState(language);
    track.current_cefr_level = recommendedLevel;
    StorageService.saveTrackState(track);

    const matchingCourse = courseService.getCourseForLanguage(language);
    if (matchingCourse) {
      courseService.updateCourse(matchingCourse.id, { cefr_level: recommendedLevel });
    }

    setResult(diagResult);
    onComplete(diagResult);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setResult(null);
  };

  const localizedLangName = getLanguageName(language, interfaceLanguage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!result ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="indigo" size="sm">
                  {localizedLangName}
                </Badge>
                <span className="text-xs text-slate-400">
                  {t('progress:question_num', 'Question')} {currentIdx + 1} {t('progress:question_of', 'of')} {questions.length}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                {t('progress:placement_test_title', 'CEFR Diagnostic Placement Test')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('progress:placement_test_desc', 'Calibrate your recommended entrance curriculum level from A1 to C1.')}
              </p>
            </div>

            {/* Question Prompt */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                {t('progress:focus', 'Focus')}: {currentQ.grammatical_focus} ({currentQ.cefr_level})
              </span>
              <p className="text-sm font-semibold text-slate-100">{currentQ.prompt}</p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/60 text-white font-medium'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                {Math.round(((currentIdx + 1) / questions.length) * 100)}% {t('common:completed', 'completed')}
              </span>
              <Button
                variant="primary"
                size="md"
                disabled={selectedAnswers[currentQ.id] === undefined}
                icon={<ChevronRight className="w-4 h-4" />}
                onClick={handleNext}
                className="cursor-pointer"
              >
                {currentIdx < questions.length - 1
                  ? t('progress:next_question_btn', 'Next Question')
                  : t('progress:calculate_level_btn', 'Calculate CEFR Level')}
              </Button>
            </div>
          </div>
        ) : (
          /* Result Summary */
          <div className="space-y-5 text-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center mx-auto text-indigo-400 shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                {t('progress:placement_completed', 'Placement Test Completed')}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-100 mt-1">
                {t('progress:recommended_entry_level', 'Recommended Entrance Level')}: {result.recommended_cefr_level}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                {result.feedback_summary}
              </p>
            </div>

            {/* Score by level */}
            <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
              {Object.entries(result.score_by_level).map(([lvl, score]) => (
                <div key={lvl} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-center">
                  <div className="font-bold text-slate-200">{lvl}</div>
                  <div className={`text-xs mt-0.5 font-semibold ${score >= 70 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {score}%
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-4 border-t border-slate-800">
              <Button variant="outline" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleReset} className="cursor-pointer">
                {t('progress:retake_btn', 'Retake Test')}
              </Button>
              <Button variant="primary" size="sm" onClick={onClose} className="cursor-pointer">
                {t('progress:apply_and_study_btn', 'Apply & Start Learning')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
