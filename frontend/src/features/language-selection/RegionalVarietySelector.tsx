import React from 'react';
import { SupportedLanguage } from '../../config/languages/types';
import { getRegionalVariants, isLanguageSupported } from '../../config/languages/languageRegistry';
import { Check } from 'lucide-react';

interface RegionalVarietySelectorProps {
  language: SupportedLanguage | string;
  selectedVariety: string;
  onSelectVariety: (varietyCode: string) => void;
  className?: string;
  label?: string;
}

export const RegionalVarietySelector: React.FC<RegionalVarietySelectorProps> = ({
  language,
  selectedVariety,
  onSelectVariety,
  className = '',
  label,
}) => {
  if (!isLanguageSupported(language)) {
    return null;
  }

  const variants = getRegionalVariants(language);
  if (variants.length <= 1) {
    return null; // Don't show redundant selector if only 1 variant exists
  }

  return (
    <div className={`space-y-1.5 ${className}`} data-testid="regional-variety-selector">
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {variants.map(variant => {
          const isSelected = selectedVariety === variant.code;
          return (
            <button
              key={variant.code}
              type="button"
              onClick={() => onSelectVariety(variant.code)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500/60 text-indigo-200 shadow-sm'
                  : 'bg-slate-900 border-slate-700/80 hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base leading-none">{variant.flag}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{variant.displayName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{variant.nativeName}</div>
                </div>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
