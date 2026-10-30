import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Wand2,
  Loader2,
  Lightbulb,
  Check,
} from 'lucide-react';
import { Language } from '../../types';
import { ProofreadingService } from '../../services/proofreadingService';
import { NormalizedProofreadMatch, NormalizedProofreadResult } from '../../integrations/external-apis/core/types';

interface LanguageToolStudioProps {
  language: Language;
}

export const LanguageToolStudio: React.FC<LanguageToolStudioProps> = ({ language }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NormalizedProofreadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleTexts: Partial<Record<Language, string>> = {
    pt: 'Nós foi ao mercado e comprou duas maçãs maçãs ontem.',
    es: 'Yo sabo que los ninos juega en el parque.',
    en: 'She do not knows the the answer for this question.',
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setErrorMsg('Digite um texto antes de analisar.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const proofreadResult = await ProofreadingService.checkText(text, language);
      setResult(proofreadResult);
    } catch (err) {
      console.warn('Proofreading error:', err);
      setErrorMsg('Não foi possível conectar ao corretor gramatical. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReplacement = (match: NormalizedProofreadMatch, replacement: string) => {
    const updated = ProofreadingService.applyCorrection(text, match, replacement);
    setText(updated);

    // Update matches by removing applied match
    if (result) {
      setResult({
        ...result,
        text: updated,
        matches: result.matches.filter(m => m.id !== match.id),
      });
    }
  };

  const handleUseSample = () => {
    setText(sampleTexts[language] || '');
    setResult(null);
    setErrorMsg(null);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-950 text-teal-400 border border-teal-800">
              <Wand2 className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Estúdio de Revisão Gramatical e Estilo
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Análise sintática, ortográfica e estilística com sugestões de correção em tempo real.
          </p>
        </div>

        <button
          onClick={handleUseSample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Exemplo com Erros</span>
        </button>
      </div>

      {/* Text Input Area */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Escreva ou cole uma frase em ${
              language === 'pt' ? 'português' : language === 'es' ? 'espanhol' : 'inglês'
            } para ver sugestões de melhoria...`}
            rows={5}
            className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition leading-relaxed"
          />
          {text && (
            <span className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono">
              {text.length} caracteres
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Revisando...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Revisar Gramática</span>
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={!text}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-slate-800 animate-fadeIn">
          {result.matches.length === 0 ? (
            <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex items-center gap-3 text-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm">Excelente! Nenhum erro detectado.</p>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Sua construção está de acordo com as normas gramaticais e ortográficas do idioma.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  {result.matches.length} {result.matches.length === 1 ? 'melhoria sugerida' : 'melhorias sugeridas'}:
                </span>
                <span className="text-[10px] text-teal-400 font-semibold">
                  Clique em uma sugestão para aplicá-la ao texto
                </span>
              </div>

              <div className="space-y-3">
                {result.matches.map(m => {
                  const errorSnippet = text.slice(m.offset, m.offset + m.length);
                  return (
                    <div
                      key={m.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            {m.shortMessage || m.category}
                          </span>
                          <span className="text-xs font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/60">
                            "{errorSnippet}"
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Regra: {m.ruleId}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {m.message}
                      </p>

                      {m.replacements.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-400 font-semibold mr-1">
                            Sugestões:
                          </span>
                          {m.replacements.map((rep, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleApplyReplacement(m, rep)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-800 hover:border-teal-600 text-xs font-bold transition cursor-pointer"
                              title={`Substituir "${errorSnippet}" por "${rep}"`}
                            >
                              <Check className="w-3 h-3 text-teal-400" />
                              <span>{rep}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-right text-[10px] text-slate-500">
            Análise sintática e ortográfica concluída
          </div>
        </div>
      )}
    </div>
  );
};
