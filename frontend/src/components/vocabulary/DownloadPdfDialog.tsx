import React, { useState, useEffect } from 'react';
import { X, FileDown, Check, Settings, Sparkles, AlertCircle } from 'lucide-react';
import { PdfExportConfig, VocabularyTopic } from '../../types/vocabulary';
import { Language, CEFRLevel } from '../../types';
import { PdfService } from '../../services/pdfService';
import { toast } from 'sonner';

interface DownloadPdfDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetLang?: Language;
  initialExplanationLang?: Language;
  initialCefr?: CEFRLevel | 'all';
}

export const DownloadPdfDialog: React.FC<DownloadPdfDialogProps> = ({
  isOpen,
  onClose,
  initialTargetLang = 'pt',
  initialExplanationLang = 'en',
  initialCefr = 'A1',
}) => {
  const [targetLang, setTargetLang] = useState<Language>(initialTargetLang);
  const [explanationLang, setExplanationLang] = useState<Language>(initialExplanationLang);
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel | 'all'>(initialCefr);
  const [resourceType, setResourceType] = useState<'top_200' | 'sentences' | 'topic_collection' | 'all'>('top_200');
  const [topic, setTopic] = useState<VocabularyTopic | 'all'>('all');

  const [includeTranslations, setIncludeTranslations] = useState(true);
  const [includeDefinitions, setIncludeDefinitions] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [includeGrammarNotes, setIncludeGrammarNotes] = useState(true);
  const [includePracticeQuiz, setIncludePracticeQuiz] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setTargetLang(initialTargetLang);
    setExplanationLang(initialExplanationLang);
    setCefrLevel(initialCefr);
  }, [initialTargetLang, initialExplanationLang, initialCefr]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      const config: PdfExportConfig = {
        title: `Lexilume — ${targetLang.toUpperCase()} Learning Guide`,
        target_language: targetLang,
        explanation_language: explanationLang,
        cefr_level: cefrLevel,
        resource_type: resourceType,
        topic: topic,
        include_translations: includeTranslations,
        include_definitions: includeDefinitions,
        include_examples: includeExamples,
        include_grammar_notes: includeGrammarNotes,
        include_practice_quiz: includePracticeQuiz,
      };

      PdfService.generatePdf(config);
      toast.success('PDF gerado com sucesso! O download foi iniciado.');
      onClose();
    } catch (err) {
      console.error('PDF export failed', err);
      toast.error('Erro ao gerar o documento PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getLangName = (lang: string) => {
    if (lang === 'pt') return 'Português';
    if (lang === 'es') return 'Español';
    return 'English';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Personalizar & Baixar Recurso em PDF
              </h2>
              <p className="text-xs text-slate-400">
                Gere guias de estudo offline com anotações e exercícios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Language Pair Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Idioma Alvo (Estudo)</label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value as Language)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
              >
                <option value="pt">Português (PT)</option>
                <option value="es">Español (ES)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Idioma de Explicação</label>
              <select
                value={explanationLang}
                onChange={e => setExplanationLang(e.target.value as Language)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
              >
                <option value="en">English (EN)</option>
                <option value="pt">Português (PT)</option>
                <option value="es">Español (ES)</option>
              </select>
            </div>
          </div>

          {/* Resource Type & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Tipo de Conteúdo</label>
              <select
                value={resourceType}
                onChange={e => setResourceType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
              >
                <option value="top_200">Top 200 Palavras Essenciais</option>
                <option value="sentences">Frases do Cotidiano e Diálogos</option>
                <option value="topic_collection">Coleção Temática Completa</option>
                <option value="all">Tudo Incluído (Vocabulário + Frases)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Nível CEFR</label>
              <select
                value={cefrLevel}
                onChange={e => setCefrLevel(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
              >
                <option value="all">Todos os Níveis (A1–C1)</option>
                <option value="A1">A1 — Principiante</option>
                <option value="A2">A2 — Básico</option>
                <option value="B1">B1 — Intermediário</option>
                <option value="B2">B2 — Independente</option>
                <option value="C1">C1 — Avançado</option>
              </select>
            </div>
          </div>

          {/* Content Inclusions Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-slate-300 font-semibold block">Elementos a Incluir no Documento:</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={includeTranslations}
                  onChange={e => setIncludeTranslations(e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">Traduções das Palavras</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={includeDefinitions}
                  onChange={e => setIncludeDefinitions(e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">Definições Explicativas</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={includeExamples}
                  onChange={e => setIncludeExamples(e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">Frases de Exemplo e Tradução</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={includePracticeQuiz}
                  onChange={e => setIncludePracticeQuiz(e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">Teste com Gabarito de Respostas</span>
              </label>
            </div>
          </div>

          {/* Live Summary Preview */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400">Resumo da Configuração:</span>
            <p className="text-xs text-slate-200">
              Gerando guia de <strong>{getLangName(targetLang)}</strong> com explicações em <strong>{getLangName(explanationLang)}</strong> ({cefrLevel.toUpperCase()}). Inclui formatação A4, quebras de página automáticas e licença CC-BY-SA 4.0.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold transition min-h-[44px] cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGenerating ? 'Gerando PDF...' : 'Baixar Arquivo PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
