import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Volume2,
  ChevronRight,
  Eye,
  EyeOff,
  Compass,
  Briefcase,
  Plane,
  Utensils,
  UserCheck,
} from 'lucide-react';
import { Language, DialogueScenario } from '../../types';
import { dialogueScenarios } from '../../data/scenarioData';
import { AudioButton } from '../common/AudioButton';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useI18n } from '../../i18n/i18nContext';

interface ScenariosSectionProps {
  language: Language;
  variety: string;
}

export const ScenariosSection: React.FC<ScenariosSectionProps> = ({
  language,
  variety,
}) => {
  const { t } = useI18n();
  const scenarios = dialogueScenarios.filter(s => s.language === language);
  const [selectedId, setSelectedId] = useState<string>(scenarios[0]?.id || '');
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});

  const activeScenario = scenarios.find(s => s.id === selectedId) || scenarios[0];

  const toggleTranslation = (idx: number) => {
    setShowTranslations(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getCategoryIcon = (category: DialogueScenario['category']) => {
    switch (category) {
      case 'travel':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'interview':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      default:
        return <Compass className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!activeScenario) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        {t('lesson_scenarios_empty', 'Nenhum cenário de conversação disponível no momento.')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Scenario Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Imersão Comunicativa em Contexto Real
              </span>
              <Badge variant="sky" size="sm">
                Nível C1
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              {t('lesson_conversation_title', 'Cenários de Diálogo Autêntico')}
            </h2>
          </div>

          {/* Quick Scenario Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {scenarios.map(sc => {
              const isSelected = sc.id === activeScenario.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedId(sc.id);
                    setShowTranslations({});
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
                  }`}
                >
                  {getCategoryIcon(sc.category)}
                  <span>{sc.title.split(':')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Scenario Title & Context Box */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">{activeScenario.title}</h3>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {activeScenario.category}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-serif">
            {activeScenario.context}
          </p>
        </div>
      </div>

      {/* Dialogue Script */}
      <div className="space-y-3">
        {activeScenario.turns.map((turn, idx) => {
          const isRevealed = !!showTranslations[idx];
          const isEven = idx % 2 === 0;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                isEven
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isEven
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    }`}
                  >
                    {turn.speaker}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AudioButton text={turn.line} language={language} variety={variety} />
                  <button
                    onClick={() => toggleTranslation(idx)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs flex items-center gap-1"
                    title={isRevealed ? t('lesson_scenarios_hide_translation', 'Ocultar Tradução') : t('lesson_scenarios_show_translation', 'Revelar Tradução')}
                  >
                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="text-[11px] hidden sm:inline">
                      {isRevealed ? t('lesson_reading_hide_translation', 'Ocultar') : t('lesson_reading_show_translation', 'Tradução')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Target Line */}
              <p className="text-sm font-medium text-slate-100 leading-relaxed font-serif">
                {turn.line}
              </p>

              {/* Revealed Translations */}
              {isRevealed && (
                <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-2 animate-fadeIn">
                  {language === 'en' ? (
                    <>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                          Tradução em Português (PT):
                        </span>
                        <p className="text-slate-200">{turn.translation_pt || turn.translation}</p>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                          Traducción en Español (ES):
                        </span>
                        <p className="text-slate-200">{turn.translation_es || turn.translation}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          English Translation (EN):
                        </span>
                        <p className="text-slate-200">{turn.natural_translation || turn.translation}</p>
                      </div>
                      {turn.natural_translation && turn.translation !== turn.natural_translation && (
                        <div className="pt-1 border-t border-slate-800/60">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Tradução Literal:
                          </span>
                          <p className="text-slate-400 text-[11px]">{turn.translation}</p>
                        </div>
                      )}
                    </>
                  )}
                  {turn.notes && (
                    <div className="pt-1 text-[11px] text-amber-300/90 italic">
                      💡 {turn.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pragmatic Tips & Vocabulary Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pragmatic Tips */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            Orientações Pragmáticas e Registro
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {activeScenario.pragmatic_tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Vocabulary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Léxico Essencial do Diálogo
          </h3>
          <div className="space-y-2">
            {activeScenario.vocabulary.map((voc, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-100">{voc.term}</span>
                  <p className="text-[11px] text-slate-400">{voc.meaning}</p>
                  {voc.usage_note && (
                    <span className="text-[10px] text-indigo-400 italic block mt-0.5">
                      {voc.usage_note}
                    </span>
                  )}
                </div>
                <AudioButton text={voc.term} language={language} variety={variety} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
