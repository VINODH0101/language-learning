import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  Filter,
  RotateCcw,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Language, MistakeNotebookItem, MistakeCategory } from '../../types';
import { getMistakes, resolveMistake, deleteMistake } from '../../services/localDb';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface MistakeNotebookProps {
  language: Language;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({ language }) => {
  const [mistakes, setMistakes] = useState<MistakeNotebookItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await getMistakes(language, selectedCategory === 'all' ? undefined : selectedCategory);
    setMistakes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [language, selectedCategory]);

  const handleResolve = async (id: string) => {
    await resolveMistake(id);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteMistake(id);
    await loadData();
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Todos os Erros' },
    { id: 'false_friend', label: 'Falsos Cognatos' },
    { id: 'subjunctive_mood', label: 'Modo Subjuntivo' },
    { id: 'preposition', label: 'Preposições' },
    { id: 'vocabulary', label: 'Léxico & Vocabulário' },
    { id: 'agreement', label: 'Concordância' },
    { id: 'grammar', label: 'Regras Gramaticais' },
  ];

  const getCategoryBadge = (cat: MistakeCategory) => {
    switch (cat) {
      case 'false_friend':
        return <Badge variant="amber" size="sm">Falso Cognato</Badge>;
      case 'subjunctive_mood':
        return <Badge variant="indigo" size="sm">Subjuntivo</Badge>;
      case 'preposition':
        return <Badge variant="sky" size="sm">Preposição</Badge>;
      case 'vocabulary':
        return <Badge variant="emerald" size="sm">Vocabulário</Badge>;
      case 'agreement':
        return <Badge variant="rose" size="sm">Concordância</Badge>;
      default:
        return <Badge variant="slate" size="sm">Gramática</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Category Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Caderno de Erros Inteligente
              </span>
              <Badge variant="rose" size="sm">
                {mistakes.length} {mistakes.length === 1 ? 'registro' : 'registros'}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              {language === 'pt' ? 'Revisão Sistemática de Incorreções' : 'Revisión Sistemática de Errores'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Erros cometidos em exercícios são salvos localmente para que você revise a causa raiz e domine as nuances da língua.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mistake Cards List */}
      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Carregando caderno de erros...</div>
      ) : mistakes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">
            {selectedCategory === 'all'
              ? 'Nenhum erro registrado neste idioma!'
              : 'Nenhum erro nesta categoria!'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ao responder incorretamente em exercícios ou preenchimento de lacunas, as questões serão adicionadas automaticamente aqui para autoavaliação.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map(item => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.is_resolved
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                  : 'bg-slate-900 border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getCategoryBadge(item.error_category)}
                  {item.is_resolved && (
                    <Badge variant="emerald" size="sm">
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      Resolvido ({item.reviewed_count}x)
                    </Badge>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!item.is_resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      onClick={() => handleResolve(item.id)}
                    >
                      Dominado
                    </Button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Excluir do caderno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prompt and Passage */}
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-slate-100">{item.prompt}</p>
                {item.context_passage && (
                  <div className="p-3 rounded-lg bg-slate-950/70 border-l-2 border-indigo-500 text-xs font-serif text-slate-300">
                    {item.context_passage}
                  </div>
                )}
              </div>

              {/* Comparison Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs">
                  <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">
                    Sua Resposta:
                  </span>
                  <span className="text-rose-200 line-through font-mono">
                    {item.user_answer || '(Em branco)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                    Solução Correta:
                  </span>
                  <span className="text-emerald-200 font-bold font-mono">
                    {item.correct_answer}
                  </span>
                </div>
              </div>

              {/* Explanation */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-slate-200 block text-[11px]">
                  Explicação Pedagógica:
                </span>
                <p className="leading-relaxed">{item.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
