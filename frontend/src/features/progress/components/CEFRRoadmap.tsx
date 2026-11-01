import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Info,
} from 'lucide-react';
import { CurriculumNode, CEFRLevel, Language } from '../../../types';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';

interface CEFRRoadmapProps {
  curriculum: CurriculumNode[];
  completedNodeIds: string[];
  currentNodeId?: string | null;
  selectedLanguage: Language;
}

const CEFR_LEVELS_ORDER: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const LEVEL_DESCRIPTIONS: Record<CEFRLevel, string> = {
  A1: 'Beginner / Breakthrough — Essential greetings, basic verbs, foundational phrases',
  A2: 'Elementary / Waystage — Narrative past tense, everyday descriptions, basic travel',
  B1: 'Intermediate / Threshold — Subjunctive hypotheses, opinion expression, complex connectors',
  B2: 'Upper Intermediate / Vantage — Abstract reasoning, nuanced idioms, professional discussions',
  C1: 'Advanced / Effective Operational Proficiency — Complex literary prose, idiomatic mastery, native fluidity',
};

export const CEFRRoadmap: React.FC<CEFRRoadmapProps> = ({
  curriculum,
  completedNodeIds,
  currentNodeId,
  selectedLanguage,
}) => {
  const { t } = useI18n();
  const [activeTabLevel, setActiveTabLevel] = useState<CEFRLevel>('A1');

  // If no published nodes exist for this language track, display honest curation state
  if (curriculum.length === 0) {
    return (
      <Card
        title={t('progress:roadmap_title', 'Curriculum Progression Roadmap')}
        subtitle={t('progress:roadmap_subtitle', 'Structured competency progression from A1 to C1')}
      >
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            {t('progress:curriculum_curating_title', 'Curriculum Units Under Active Curation')}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
            {t(
              'progress:curriculum_curating_desc',
              'The open educational curriculum for this language track is currently being compiled according to CEFR standards. Daily literature and vocabulary features remain fully accessible.'
            )}
          </p>
        </div>
      </Card>
    );
  }

  // Group curriculum nodes by CEFR level
  const nodesByLevel = CEFR_LEVELS_ORDER.reduce<Record<CEFRLevel, CurriculumNode[]>>(
    (acc, lvl) => {
      acc[lvl] = curriculum.filter(n => n.cefr_level === lvl);
      return acc;
    },
    { A1: [], A2: [], B1: [], B2: [], C1: [] }
  );

  const selectedLevelNodes = nodesByLevel[activeTabLevel] || [];
  const selectedLevelCompleted = selectedLevelNodes.filter(n =>
    completedNodeIds.includes(n.id)
  ).length;
  const selectedLevelTotal = selectedLevelNodes.length;
  const levelPct = selectedLevelTotal > 0 ? Math.round((selectedLevelCompleted / selectedLevelTotal) * 100) : 0;

  return (
    <Card
      title={`${t('progress:roadmap_title', 'Curriculum Progression Roadmap')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:roadmap_subtitle',
        'Sequential competency nodes from A1 to C1 with objective-based completion tracking'
      )}
    >
      {/* CEFR Level Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-800">
        {CEFR_LEVELS_ORDER.map(lvl => {
          const nodes = nodesByLevel[lvl];
          const completedCount = nodes.filter(n => completedNodeIds.includes(n.id)).length;
          const isSelected = activeTabLevel === lvl;

          return (
            <button
              key={lvl}
              onClick={() => setActiveTabLevel(lvl)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{lvl}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-900/80 text-slate-400'
                }`}
              >
                {completedCount}/{nodes.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Level Summary Header */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100">
              {activeTabLevel} — {LEVEL_DESCRIPTIONS[activeTabLevel].split('—')[0].trim()}
            </span>
            <Badge variant={levelPct === 100 ? 'emerald' : 'indigo'} size="sm">
              {levelPct}% {t('common:completed', 'Completed')}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {LEVEL_DESCRIPTIONS[activeTabLevel]}
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <span className="text-xs font-mono font-bold text-slate-300 block">
            {selectedLevelCompleted} / {selectedLevelTotal} {t('progress:units_label', 'Units')}
          </span>
          <ProgressBar progress={levelPct} className="w-32 mt-1.5" variant={levelPct === 100 ? 'emerald' : 'indigo'} />
        </div>
      </div>

      {/* Nodes List */}
      {selectedLevelNodes.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 italic">
          {t('progress:no_units_at_level', 'No units published for this CEFR level yet.')}
        </div>
      ) : (
        <div className="space-y-3">
          {selectedLevelNodes.map((node, idx) => {
            const isCompleted = completedNodeIds.includes(node.id);
            const isCurrent =
              currentNodeId === node.id || (!isCompleted && idx === 0 && activeTabLevel === 'A1');

            return (
              <div
                key={node.id}
                className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700/60'
                    : isCurrent
                    ? 'bg-indigo-950/30 border-indigo-700/70 shadow-sm'
                    : 'bg-slate-800/30 border-slate-800/80 opacity-70 hover:opacity-90'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        {node.sequence_order}. {node.title}
                      </span>
                      <Badge variant="slate" size="sm">
                        {node.skill_category}
                      </Badge>
                      {node.is_consolidation_review && (
                        <Badge variant="amber" size="sm">
                          {t('progress:consolidation', 'Consolidation')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {node.can_do_statement}
                    </p>
                    {node.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">
                        {node.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right ml-4">
                  <span
                    className={`text-[11px] font-mono px-2 py-1 rounded-lg ${
                      isCompleted
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                        : isCurrent
                        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                        : 'text-slate-500'
                    }`}
                  >
                    {isCompleted
                      ? t('common:completed', 'Completed')
                      : isCurrent
                      ? t('common:active', 'Active Unit')
                      : t('common:upcoming', 'Locked')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
