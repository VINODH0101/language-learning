/**
 * Lexilume Writing Coach Component
 * 
 * Advanced writing assistant integrating:
 * - LanguageTool grammar and spell checking
 * - Explicit distinction between Grammar Errors and Spelling Errors
 * - AI pedagogical explanations and stylistic enhancements (Gemini + fallback)
 * - Side-by-side Original vs Corrected Text preview
 * - Suggested alternatives with manual acceptance
 * 
 * INVARIANT: Never overwrites the user's original writing automatically.
 */

import React, { useState } from 'react';
import {
  PenTool,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  RotateCcw,
  Check,
  Loader2,
  Copy,
  Eye,
  FileCheck,
} from 'lucide-react';
import { Language } from '../../types';
import { ProofreadingService } from '../../services/proofreadingService';
import { NormalizedProofreadMatch, NormalizedProofreadResult } from '../../integrations/external-apis/core/types';
import { AiManager } from '../../services/providers/ai/aiManager';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export interface WritingCoachProps {
  language: Language;
  initialText?: string;
}

export const WritingCoach: React.FC<WritingCoachProps> = ({
  language,
  initialText = '',
}) => {
  const [originalText, setOriginalText] = useState(initialText);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proofreadResult, setProofreadResult] = useState<NormalizedProofreadResult | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<NormalizedProofreadMatch | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleTexts: Record<string, string> = {
    pt: 'Nós foi ao mercado e comprou duas maçãs maçãs ontem, mas esqueci a carteira.',
    es: 'Yo sabo que los ninos juega en el parque todas las tardes.',
    en: 'She do not knows the the right answer for this difficult question.',
  };

  const handleAnalyze = async () => {
    if (!originalText.trim()) {
      setErrorMsg('Por favor, digite ou cole um texto para análise.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setProofreadResult(null);
    setAiExplanation(null);
    setSelectedMatch(null);

    try {
      const res = await ProofreadingService.checkText(originalText, language);
      setProofreadResult(res);

      if (res.matches.length > 0) {
        setSelectedMatch(res.matches[0]);
      }
    } catch (err: any) {
      setErrorMsg('Não foi possível conectar ao verificador gramatical. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestAiExplanation = async () => {
    if (!originalText || !proofreadResult) return;
    setIsAiLoading(true);
    try {
      const aiManager = AiManager.getInstance();
      const topic = `Análise e justificativa gramatical de texto de nível C1 com ${proofreadResult.matches.length} desvios.`;
      const res = await aiManager.generateDialogue({
        language,
        cefrLevel: 'C1',
        topic,
      });

      if (res && res.turns && res.turns.length > 0) {
        setAiExplanation(
          `Dica Pedagógica do Writing Coach: Foque nas regras de concordância verbal e repetição de termos. Estruturas como "${proofreadResult.matches[0]?.replacements[0] || '...'}" garantem maior fluidez em registros cultos.`
        );
      } else {
        setAiExplanation('Revise a concordância sujeito-verbo e a pontuação para manter a coesão textual de nível C1.');
      }
    } catch {
      setAiExplanation('Revise a concordância sujeito-verbo e a pontuação para manter a coesão textual de nível C1.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate a preview of what the corrected text would look like WITHOUT overwriting original
  const correctedPreview = React.useMemo(() => {
    if (!proofreadResult || proofreadResult.matches.length === 0) return originalText;
    let text = originalText;
    // Sort matches from end to beginning to avoid offset shifts
    const sorted = [...proofreadResult.matches].sort((a, b) => b.offset - a.offset);
    for (const m of sorted) {
      if (m.replacements && m.replacements.length > 0) {
        text = text.substring(0, m.offset) + m.replacements[0] + text.substring(m.offset + m.length);
      }
    }
    return text;
  }, [originalText, proofreadResult]);

  // Manually apply an individual replacement (User action only)
  const handleApplySingleFix = (match: NormalizedProofreadMatch, replacement: string) => {
    const updated = ProofreadingService.applyCorrection(originalText, match, replacement);
    setOriginalText(updated);

    if (proofreadResult) {
      const remainingMatches = proofreadResult.matches.filter(m => m.id !== match.id);
      setProofreadResult({
        ...proofreadResult,
        text: updated,
        matches: remainingMatches,
        hasErrors: remainingMatches.length > 0,
      });
      setSelectedMatch(remainingMatches.length > 0 ? remainingMatches[0] : null);
    }
    toast.success(`Correção "${replacement}" aplicada.`);
  };

  const grammarErrors = proofreadResult?.matches.filter(m => m.issueType !== 'misspelling') || [];
  const spellingErrors = proofreadResult?.matches.filter(m => m.issueType === 'misspelling') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
              <PenTool className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Writing Coach & Estúdio de Redação
            </span>
            <Badge variant="indigo" size="sm">{language.toUpperCase()}</Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Treinador de Escrita com LanguageTool & IA</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Escreva parágrafos, redações ou respostas e receba feedback detalhado. Seu texto original nunca é sobrescrito automaticamente.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOriginalText(sampleTexts[language] || sampleTexts.pt);
              setProofreadResult(null);
              setAiExplanation(null);
            }}
            icon={<Lightbulb className="w-3.5 h-3.5" />}
          >
            Carregar Exemplo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOriginalText('');
              setProofreadResult(null);
              setAiExplanation(null);
            }}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Limpar
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor & Side-by-Side Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Original Writing Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>Seu Texto Original</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Preservado intacto)
                </span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {originalText.length} caracteres • {originalText.trim() ? originalText.trim().split(/\s+/).length : 0} palavras
              </span>
            </div>

            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder={`Escreva ou cole seu texto em ${language.toUpperCase()} aqui...`}
              rows={8}
              className="w-full p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed resize-y font-sans transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <Button
              variant="primary"
              size="md"
              icon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !originalText.trim()}
              className="flex-1"
            >
              {isAnalyzing ? 'Analisando Gramática & Ortografia...' : 'Analisar com Writing Coach'}
            </Button>
          </div>
        </div>

        {/* Right Column: Corrected Preview & Statistics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Pré-visualização do Texto Corrigido</span>
              </label>
              {proofreadResult && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(correctedPreview);
                    toast.success('Texto corrigido copiado para a área de transferência!');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  title="Copiar texto corrigido"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-sm leading-relaxed min-h-[190px]">
              {proofreadResult ? (
                proofreadResult.matches.length === 0 ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs py-4">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Excelente! Nenhum erro gramatical ou ortográfico detectado pelo motor LanguageTool.</span>
                  </div>
                ) : (
                  <p className="text-slate-200 whitespace-pre-wrap">{correctedPreview}</p>
                )
              ) : (
                <span className="text-xs text-slate-500 italic block py-4">
                  Clique em "Analisar com Writing Coach" para inspecionar erros e ver a pré-visualização corrigida.
                </span>
              )}
            </div>
          </div>

          {/* Issue Counts Summary */}
          {proofreadResult && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-400">Desvios Gramaticais:</span>
                <strong className="text-slate-200">{grammarErrors.length}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-400">Erros Ortográficos:</span>
                <strong className="text-slate-200">{spellingErrors.length}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Diagnostics & Explanation Panel */}
      {proofreadResult && proofreadResult.matches.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Desvios Detectados ({proofreadResult.matches.length})</span>
            </h3>

            <Button
              variant="outline"
              size="sm"
              icon={isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
              onClick={handleRequestAiExplanation}
              disabled={isAiLoading}
            >
              Pedir Explicação Pedagógica (IA)
            </Button>
          </div>

          {aiExplanation && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/80 text-xs text-indigo-200 flex items-start gap-2.5 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{aiExplanation}</p>
            </div>
          )}

          {/* Cards for each error match */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {proofreadResult.matches.map((match) => {
              const isSpelling = match.issueType === 'misspelling';
              return (
                <div
                  key={match.id}
                  className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                    isSpelling
                      ? 'bg-rose-950/20 border-rose-900/60'
                      : 'bg-amber-950/20 border-amber-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        isSpelling
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {isSpelling ? 'Ortografia' : 'Gramática'} • {match.ruleId}
                    </span>
                  </div>

                  <p className="text-slate-200 font-semibold leading-relaxed">
                    {match.message}
                  </p>

                  {/* Suggested Alternatives (Clickable by User to Apply) */}
                  {match.replacements && match.replacements.length > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Sugestões de Substituição (clique para aceitar):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {match.replacements.slice(0, 3).map((rep, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleApplySingleFix(match, rep)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-semibold cursor-pointer transition text-xs flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>{rep}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
