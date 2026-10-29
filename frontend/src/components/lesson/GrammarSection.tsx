import React from 'react';
import { BookOpen, Check, X, Globe, Sparkles } from 'lucide-react';
import { GrammarRule, Language } from '../../types';
import { Badge } from '../common/Badge';
import { AudioButton } from '../common/AudioButton';
import { useI18n } from '../../i18n/i18nContext';

interface GrammarSectionProps {
  grammar: GrammarRule;
  language: Language;
  variety: string;
}

export const GrammarSection: React.FC<GrammarSectionProps> = ({
  grammar,
  language,
  variety,
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Title & Metadata Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="indigo" size="sm">
            {grammar.rule_code}
          </Badge>
          <Badge variant="emerald" size="sm">
            CEFR {grammar.cefr_level}
          </Badge>
          <span className="text-xs text-slate-400 capitalize">• {grammar.category}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">{grammar.title}</h2>

        {/* Structural Formula Callout */}
        <div className="mt-4 p-3.5 rounded-lg bg-gradient-to-r from-indigo-950/70 via-slate-800 to-slate-900 border border-indigo-700/40 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-900/60 text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
              {t('lesson_grammar_structural_formula', 'Fórmula Estrutural Sintática')}
            </p>
            <p className="text-sm font-mono font-bold text-slate-100 mt-0.5">
              {grammar.structural_formula}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation Text */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          {t('lesson_grammar_theoretical_foundation', 'Fundamentação Teórica e Aplicação')}
        </h3>
        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {grammar.explanation_markdown}
        </div>
      </div>

      {/* Illustrative Examples */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">
          {t('lesson_grammar_authentic_examples', 'Exemplos Autênticos em Contexto C1')}
        </h3>
        <div className="space-y-3">
          {grammar.examples.map((ex, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 border-l-2 border-emerald-500 rounded-r-lg p-3 text-xs flex justify-between items-start gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{ex.target}</p>
                {language === 'en' ? (
                  <div className="space-y-0.5 mt-1 text-xs text-slate-300">
                    {ex.pt && (
                      <p>
                        <span className="font-bold text-indigo-400">PT:</span> {ex.pt}
                      </p>
                    )}
                    {ex.es && (
                      <p>
                        <span className="font-bold text-emerald-400">ES:</span> {ex.es}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-bold text-slate-300">EN:</span> {ex.en}
                  </p>
                )}
                {ex.note && (
                  <p className="text-[11px] text-indigo-300/90 mt-1 font-medium">
                    {t('lesson_grammar_note', 'Nota:')} {ex.note}
                  </p>
                )}
              </div>
              <AudioButton
                text={ex.target}
                language={language}
                variety={variety}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Common Learner Errors */}
      {grammar.common_errors && grammar.common_errors.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">
            {t('lesson_grammar_common_errors', 'Erros Comuns de Alunos e Interferências a Evitar')}
          </h3>
          <div className="space-y-3">
            {grammar.common_errors.map((err, idx) => (
              <div
                key={idx}
                className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 text-xs space-y-2"
              >
                <div className="flex items-start gap-2 text-rose-400">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-through">{err.incorrect}</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-400">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{err.correct}</span>
                </div>
                <div className="text-[11px] text-slate-400 pl-6 border-l border-slate-700 mt-1">
                  {err.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regional Variations */}
      {grammar.regional_notes && Object.keys(grammar.regional_notes).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            {t('lesson_grammar_regional_variation', 'Variação Linguística Regional')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(grammar.regional_notes).map(([region, note]) => (
              <div key={region} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs">
                <span className="font-bold text-sky-400 text-xs uppercase tracking-wider block mb-1">
                  {t('lesson_grammar_variety_prefix', 'Variedade')} {region}
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
