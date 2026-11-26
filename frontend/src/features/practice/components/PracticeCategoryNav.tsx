import React from 'react';
import { Language } from '../../../types';
import { PracticeSubMode } from '../types';
import { useI18n } from '../../../i18n/i18nContext';
import {
  PRACTICE_GROUPS,
  PracticeModeCounts,
  getPracticeModeCount,
  getVisiblePracticeModes,
} from '../practiceModes';

interface PracticeCategoryNavProps {
  selectedMode: PracticeSubMode;
  language: Language;
  counts: PracticeModeCounts;
  onSelectMode: (mode: PracticeSubMode) => void;
}

/**
 * A single-level practice menu.
 *
 * On desktop it is a quiet grouped list in the left column; on mobile it
 * collapses to one native select. Either way the learner only has to scan
 * one dimension of choices instead of two stacked rows of tabs.
 */
export const PracticeCategoryNav: React.FC<PracticeCategoryNavProps> = ({
  selectedMode,
  language,
  counts,
  onSelectMode,
}) => {
  const { t } = useI18n();
  const visibleModes = getVisiblePracticeModes(language);

  const countLabel = (modeId: PracticeSubMode): number | null => {
    const meta = visibleModes.find(mode => mode.id === modeId);
    if (!meta) return null;
    const count = getPracticeModeCount(meta, counts);
    return count ? count.value : null;
  };

  return (
    <nav
      aria-label={t('practice:menu_aria', 'Practice activities')}
      className="space-y-3 lg:sticky lg:top-6"
    >
      {/* Mobile: one compact native picker */}
      <div className="lg:hidden bg-white border border-stone-200 rounded-2xl p-3 shadow-xs">
        <label
          htmlFor="practice-activity-select"
          className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5 px-1"
        >
          {t('practice:menu_activity_label', 'Activity')}
        </label>
        <select
          id="practice-activity-select"
          value={selectedMode}
          onChange={event => onSelectMode(event.target.value as PracticeSubMode)}
          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-800 focus:outline-none focus:border-stone-500 cursor-pointer"
        >
          {PRACTICE_GROUPS.map(group => {
            const modes = visibleModes.filter(mode => mode.group === group.id);
            if (modes.length === 0) return null;
            return (
              <optgroup key={group.id} label={t(group.labelKey, group.labelFallback)}>
                {modes.map(mode => {
                  const count = countLabel(mode.id);
                  return (
                    <option key={mode.id} value={mode.id}>
                      {t(mode.labelKey, mode.labelFallback)}
                      {count !== null ? ` (${count})` : ''}
                    </option>
                  );
                })}
              </optgroup>
            );
          })}
        </select>
      </div>

      {/* Desktop: grouped, scannable list */}
      <div className="hidden lg:block bg-white border border-stone-200 rounded-2xl p-3 shadow-xs">
        {PRACTICE_GROUPS.map((group, groupIndex) => {
          const modes = visibleModes.filter(mode => mode.group === group.id);
          if (modes.length === 0) return null;

          return (
            <div
              key={group.id}
              className={groupIndex > 0 ? 'mt-3 pt-3 border-t border-stone-100' : ''}
            >
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {t(group.labelKey, group.labelFallback)}
              </div>
              <div className="space-y-0.5">
                {modes.map(mode => {
                  const Icon = mode.icon;
                  const isActive = selectedMode === mode.id;
                  const count = getPracticeModeCount(mode, counts);

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onSelectMode(mode.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-amber-300' : 'text-stone-400'
                        }`}
                      />
                      <span className="flex-1 text-left truncate">
                        {t(mode.labelKey, mode.labelFallback)}
                      </span>
                      {count !== null && (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-white/15 text-white'
                              : count.urgent
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {count.value}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
