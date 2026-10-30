import React from 'react';
import { SupportedLanguage } from '../../config/languages/types';
import { getLanguageCapabilities } from '../../config/languages/capabilities';
import { isLanguageSupported } from '../../config/languages/languageRegistry';
import { Volume2, Mic, BookOpen, PenTool, CheckCircle2 } from 'lucide-react';

interface LanguageCapabilityBadgeProps {
  language: SupportedLanguage | string;
  className?: string;
  compact?: boolean;
}

export const LanguageCapabilityBadge: React.FC<LanguageCapabilityBadgeProps> = ({
  language,
  className = '',
  compact = false,
}) => {
  if (!isLanguageSupported(language)) {
    return null;
  }

  const caps = getLanguageCapabilities(language);

  const capabilityItems = [
    {
      id: 'tts',
      name: 'Audio (TTS)',
      supported: caps.tts,
      icon: Volume2,
    },
    {
      id: 'stt',
      name: 'Speech Rec (STT)',
      supported: caps.stt,
      icon: Mic,
    },
    {
      id: 'grammar',
      name: `Grammar (${caps.grammarProvider})`,
      supported: caps.grammarCheck,
      icon: CheckCircle2,
    },
    {
      id: 'reading',
      name: 'Reading Passages',
      supported: caps.readingResources,
      icon: BookOpen,
    },
    {
      id: 'writing',
      name: 'Writing Exercises',
      supported: caps.writingPractice,
      icon: PenTool,
    },
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`} data-testid="capability-badges">
        {capabilityItems.map(item => {
          if (!item.supported) return null;
          const Icon = item.icon;
          return (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80"
              title={`${item.name}: Supported`}
            >
              <Icon className="w-3 h-3 text-emerald-400" />
              <span>{item.id.toUpperCase()}</span>
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider">Language Capabilities</span>
        <span className="text-[11px] font-mono text-slate-500">Script: {caps.script}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {capabilityItems.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                item.supported
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${item.supported ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className="truncate text-[11px] font-medium">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
