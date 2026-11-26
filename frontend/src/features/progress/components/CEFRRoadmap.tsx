import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Circle, BookOpen } from 'lucide-react';
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
  A1: 'Breakthrough — Essential greetings, basic verbs, everyday survival phrases',
  A2: 'Elementary — Past tense narratives, routine descriptions, practical travel',
  B1: 'Threshold — Hypotheses, expressing opinions, connected narratives',
  B2: 'Vantage — Abstract reasoning, idiomatic nuance, professional register',
  C1: 'Proficiency — Complex literary prose, formal argumentation, native fluidity',
};

export const CEFRRoadmap: React.FC<CEFRRoadmapProps> = ({
  curriculum,
  completedNodeIds,
  currentNodeId,
  selectedLanguage,
}) => {
  const { t } = useI18n();
  const [activeTabLevel, setActiveTabLevel] = useState<CEFRLevel>('A1');

  if (curriculum.length === 0) {
    return (
      <Card
        title={t('progress:roadmap_title', 'CEFR Progression Roadmap & Milestone Units')}
        subtitle={t('progress:roadmap_subtitle', 'Structured competency progression from A1 to C1')}
      >
        <div className="text-center py-10 px-4 rounded-xl bg-[#FAF9F6] border border-dashed border-stone-200">
          <div className="w-11 h-11 mx-auto rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-stone-900">
            {t('progress:curriculum_curating_title', 'Curriculum Units Under Active Curation')}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            {t(
              'progress:curriculum_curating_desc',
              'The open educational curriculum for this track is being compiled to CEFR standards. Daily reading and vocabulary practice remain available.'
            )}
          </p>
        </div>
      </Card>
    );
  }

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
      title={`${t('progress:roadmap_title', 'CEFR Progression Roadmap & Milestone Units')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:roadmap_subtitle',
        'Select a CEFR milestone to inspect completed and upcoming competency units'
      )}
    >
      {/* CEFR Level Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-stone-200 no-scrollbar">
        {CEFR_LEVELS_ORDER.map(lvl => {
          const nodes = nodesByLevel[lvl];
          const completedCount = nodes.filter(n => completedNodeIds.includes(n.id)).length;
          const isSelected = activeTabLevel === lvl;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setActiveTabLevel(lvl)}
              aria-pressed={isSelected}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer min-h-[38px] border ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span>{lvl}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-amber-500/20 text-amber-200' : 'bg-white text-stone-500 border border-stone-200'
                }`}
              >
                {completedCount}/{nodes.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Level Summary Bar */}
      <div className="bg-[#FAF9F6] p-4 rounded-xl border border-stone-200 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-base font-bold text-stone-900">
              {activeTabLevel} — {LEVEL_DESCRIPTIONS[activeTabLevel].split('—')[0].trim()}
            </span>
            <Badge variant={levelPct === 100 ? 'emerald' : 'amber'} size="sm">
              {levelPct}% {t('common:completed', 'Completed')}
            </Badge>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
            {LEVEL_DESCRIPTIONS[activeTabLevel]}
          </p>
        </div>

        <div className="sm:text-right shrink-0 w-full sm:w-40">
          <span className="text-xs font-mono font-bold text-stone-700 block">
            {selectedLevelCompleted} / {selectedLevelTotal} {t('progress:units_label', 'Units')}
          </span>
          <ProgressBar
            progress={levelPct}
            className="w-full mt-1.5"
            variant={levelPct === 100 ? 'emerald' : 'bronze'}
          />
        </div>
      </div>

      {/* Units List */}
      {selectedLevelNodes.length === 0 ? (
        <div className="text-center py-8 text-xs text-stone-500 italic">
          {t('progress:no_units_at_level', 'No curriculum units found at this CEFR level.')}
        </div>
      ) : (
        <div className="space-y-2.5">
          {selectedLevelNodes.map((node, idx) => {
            const isCompleted = completedNodeIds.includes(node.id);
            const isCurrent =
              currentNodeId === node.id || (!isCompleted && idx === 0 && activeTabLevel === 'A1');

            return (
              <div
                key={node.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3 ${
                  isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : isCurrent
                    ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isCurrent ? (
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-stone-900">
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
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {node.can_do_statement}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 sm:ml-4 self-start sm:self-center">
                  <span
                    className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                      isCompleted
                        ? 'bg-white text-emerald-800 border-emerald-200'
                        : isCurrent
                        ? 'bg-stone-900 text-amber-200 border-stone-900'
                        : 'bg-stone-50 text-stone-500 border-stone-200'
                    }`}
                  >
                    {isCompleted
                      ? t('common:completed', 'Completed')
                      : isCurrent
                      ? t('common:active', 'Up Next')
                      : t('common:upcoming', 'Upcoming')}
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
