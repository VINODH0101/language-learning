import React, { useState } from 'react';
import { X, Award, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { DiagnosticQuestion, DiagnosticResult, CEFRLevel, Language } from '../../types';
import { diagnosticQuestions } from '../../data/seedData';
import { StorageService } from '../../services/storage';
import { courseService } from '../../services/courseService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  if (!isOpen) return null;

  const questions = diagnosticQuestions.filter(q => q.language === language);
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
      user_id: StorageService.getSettings().user_id,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {!result ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={language === 'pt' ? 'emerald' : 'amber'} size="sm">
                  {language === 'pt' ? 'Português' : 'Español'}
                </Badge>
                <span className="text-xs text-slate-400">
                  Questão {currentIdx + 1} de {questions.length}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                Teste Diagnóstico de Nivelamento CEFR
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Responda com atenção para calibrar seu nível de entrada sem assumir perfil iniciante.
              </p>
            </div>

            {/* Question Prompt */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                Foco: {currentQ.grammatical_focus} ({currentQ.cefr_level})
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
                {Math.round(((currentIdx + 1) / questions.length) * 100)}% concluído
              </span>
              <Button
                variant="primary"
                size="md"
                disabled={selectedAnswers[currentQ.id] === undefined}
                icon={<ChevronRight className="w-4 h-4" />}
                onClick={handleNext}
              >
                {currentIdx < questions.length - 1 ? 'Próxima Questão' : 'Calcular Nível CEFR'}
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
                Nivelamento Concluído com Sucesso
              </span>
              <h2 className="text-2xl font-extrabold text-slate-100 mt-1">
                Seu Nível Inicial Recomendado: {result.recommended_cefr_level}
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
              <Button variant="outline" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleReset}>
                Refazer Teste
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                Aplicar e Iniciar Estudos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
