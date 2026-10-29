import React, { useState } from 'react';
import { PenTool, CheckSquare, Sparkles, Copy, Check, Save } from 'lucide-react';
import { DailyLessonPayload, Language } from '../../types';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { useI18n } from '../../i18n/i18nContext';
import { toast } from 'sonner';

interface WritingSectionProps {
  writing: DailyLessonPayload['section_7_writing'];
  language: Language;
}

export const WritingSection: React.FC<WritingSectionProps> = ({
  writing,
}) => {
  const { t } = useI18n();
  const [essayText, setEssayText] = useState('');
  const [copied, setCopied] = useState(false);
  const [rubricChecks, setRubricChecks] = useState<Record<number, boolean>>({});

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const targetWords = writing.target_word_count || 120;
  const progressPercent = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const handleCopy = () => {
    navigator.clipboard.writeText(essayText);
    setCopied(true);
    toast.success(t('lesson_writing_copied', 'Composição copiada para a área de transferência!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    if (!essayText.trim()) return;
    try {
      localStorage.setItem(`polyglot_draft_${writing.genre_register}`, essayText);
      toast.success(t('lesson_writing_draft_saved', 'Rascunho salvo no seu dispositivo com sucesso!'));
    } catch {
      toast.error(t('lesson_writing_draft_error', 'Erro ao salvar rascunho.'));
    }
  };

  const toggleRubricCheck = (idx: number) => {
    setRubricChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Determine which connectors have been used in the essay text
  const lowerEssay = essayText.toLowerCase();
  const connectorStatus = (writing.suggested_connectors || []).map(conn => {
    const isUsed = lowerEssay.includes(conn.toLowerCase());
    return { name: conn, isUsed };
  });

  const defaultRubric = [
    'Adequação estrita ao registro formal e objetivo do gênero textual',
    'Emprego de ao menos 2 conectores de transição interparagráfica',
    'Uso de construções hipotéticas ou subjuntivas avançadas',
    'Progressão lógica de premissas com conclusão fundamentada',
  ];

  return (
    <div className="space-y-6">
      {/* Writing Prompt Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3 flex justify-between items-start gap-3">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              {t('lesson_writing_title', 'Composição Escrita Argumentativa C1')}
            </span>
            <h2 className="text-base font-bold text-slate-100 mt-0.5">{writing.genre_register}</h2>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {t('lesson_writing_target', 'Meta:')} {targetWords} {t('lesson_writing_words', 'palavras')}
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">{writing.prompt}</p>
        </div>

        {/* Structural Guidelines & Evaluation Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {writing.structural_guidelines && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300">{t('lesson_writing_guidelines', 'Diretrizes de Estrutura:')}</h3>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {writing.structural_guidelines.map((g, idx) => (
                  <li key={idx} className="leading-relaxed">{g}</li>
                ))}
              </ul>
            </div>
          )}

          {writing.evaluation_criteria && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> {t('lesson_writing_rubric_c1', 'Critérios de Avaliação C1:')}
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {writing.evaluation_criteria.map((c, idx) => (
                  <li key={idx} className="leading-relaxed">{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Dynamic Connector Checklist */}
        {connectorStatus.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {t('lesson_writing_connectors_title', 'Conectores Discursivos Sugeridos (Reconhecimento Automático):')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {connectorStatus.map((c, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                    c.isUsed
                      ? 'bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 font-semibold shadow-sm'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {c.isUsed && <Check className="w-3 h-3 text-emerald-400" />}
                  <span>{c.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Writing Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="w-full sm:w-64">
            <ProgressBar
              progress={progressPercent}
              label={`${t('lesson_writing_word_counter', 'Contador de Palavras:')} ${wordCount} / ${targetWords}`}
              variant={wordCount >= targetWords ? 'emerald' : 'indigo'}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Save className="w-3.5 h-3.5" />}
              onClick={handleSaveDraft}
              disabled={!essayText.trim()}
            >
              {t('lesson_writing_save_draft', 'Salvar Rascunho')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopy}
              disabled={!essayText.trim()}
            >
              {copied ? t('lesson_writing_copied', 'Copiado!') : t('lesson_writing_copy_text', 'Copiar Texto')}
            </Button>
          </div>
        </div>

        <textarea
          rows={10}
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          placeholder={t('lesson_writing_placeholder', 'Redija aqui sua composição C1 utilizando os conectores e estruturas recomendados...')}
          className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
        />

        {wordCount >= targetWords && (
          <p className="text-xs text-emerald-400 font-medium">
            {t('lesson_writing_target_reached', '✓ Meta atingida! Revise a coesão interparagráfica.')}
          </p>
        )}

        {/* Self-Evaluation Rubric Checklist */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t('lesson_writing_self_rubric', 'Rubrica de Autoavaliação C1')}
          </h4>
          <div className="space-y-1.5">
            {defaultRubric.map((item, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none p-1.5 rounded hover:bg-slate-800/60"
              >
                <input
                  type="checkbox"
                  checked={!!rubricChecks[idx]}
                  onChange={() => toggleRubricCheck(idx)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
                <span className={rubricChecks[idx] ? 'text-emerald-300 line-through' : ''}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
