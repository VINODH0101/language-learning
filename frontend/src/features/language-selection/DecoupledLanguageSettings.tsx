import React from 'react';
import { InterfaceLanguage, ExplanationLanguage, SupportedLanguage } from '../../config/languages/types';
import { LanguageSelector } from './LanguageSelector';
import { RegionalVarietySelector } from './RegionalVarietySelector';
import { LanguageCapabilityBadge } from './LanguageCapabilityBadge';
import { getDefaultVariant } from '../../config/languages/languageRegistry';
import { Sliders, HelpCircle, ShieldCheck } from 'lucide-react';

interface DecoupledLanguageSettingsProps {
  interfaceLanguage: InterfaceLanguage;
  onSelectInterfaceLanguage: (lang: InterfaceLanguage) => void;
  targetLanguage: SupportedLanguage;
  onSelectTargetLanguage: (lang: SupportedLanguage) => void;
  regionalVariety: string;
  onSelectRegionalVariety: (variety: string) => void;
  explanationLanguage: ExplanationLanguage;
  onSelectExplanationLanguage: (lang: ExplanationLanguage) => void;
  className?: string;
}

export const DecoupledLanguageSettings: React.FC<DecoupledLanguageSettingsProps> = ({
  interfaceLanguage,
  onSelectInterfaceLanguage,
  targetLanguage,
  onSelectTargetLanguage,
  regionalVariety,
  onSelectRegionalVariety,
  explanationLanguage,
  onSelectExplanationLanguage,
  className = '',
}) => {
  const handleTargetChange = (newTarget: string) => {
    // Invariant: Changing target learning language does NOT change interface language!
    onSelectTargetLanguage(newTarget as SupportedLanguage);
    const defaultVar = getDefaultVariant(newTarget as SupportedLanguage);
    onSelectRegionalVariety(defaultVar);
  };

  return (
    <div
      className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6 ${className}`}
      data-testid="decoupled-language-settings"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Four-Way Linguistic Decoupling</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Independent Dimensions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Dimension 1: Interface Language */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">1. Interface Language</span>
            <span
              className="text-slate-500 hover:text-slate-400"
              title="Controls UI buttons, navigation, and system dialogs."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 min-h-[32px]">
            Controls UI buttons, navigation chrome, and dialog messages.
          </p>
          <LanguageSelector
            mode="interface"
            selectedLanguage={interfaceLanguage}
            onSelectLanguage={l => onSelectInterfaceLanguage(l as InterfaceLanguage)}
          />
        </div>

        {/* Dimension 2: Target Learning Language */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">2. Target Language</span>
            <span
              className="text-slate-500 hover:text-slate-400"
              title="The language you are actively studying."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 min-h-[32px]">
            The target language being learned through daily lessons & SRS.
          </p>
          <LanguageSelector
            mode="target"
            selectedLanguage={targetLanguage}
            onSelectLanguage={handleTargetChange}
          />
        </div>

        {/* Dimension 3: Explanation Language */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">3. Explanation Language</span>
            <span
              className="text-slate-500 hover:text-slate-400"
              title="The language used to explain grammar rules and definitions."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 min-h-[32px]">
            The pedagogical language for grammar notes and answer feedback.
          </p>
          <LanguageSelector
            mode="explanation"
            selectedLanguage={explanationLanguage}
            onSelectLanguage={l => onSelectExplanationLanguage(l as ExplanationLanguage)}
          />
        </div>
      </div>

      {/* Dimension 4: Regional Variety */}
      <div className="pt-2 border-t border-slate-800/80">
        <RegionalVarietySelector
          language={targetLanguage}
          selectedVariety={regionalVariety}
          onSelectVariety={onSelectRegionalVariety}
          label="Regional Dialect / Variety (Bound Strictly to Target Language)"
        />
      </div>

      {/* Target Language Capabilities */}
      <LanguageCapabilityBadge language={targetLanguage} />
    </div>
  );
};
