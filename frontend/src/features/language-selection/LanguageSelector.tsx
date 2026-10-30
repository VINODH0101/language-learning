import React, { useState, useMemo } from 'react';
import { SupportedLanguage, InterfaceLanguage, ExplanationLanguage } from '../../config/languages/types';
import {
  getAllSupportedLanguages,
  isLanguageSupported,
  isForbiddenLanguage,
} from '../../config/languages/languageRegistry';
import { Globe, Search, Check } from 'lucide-react';

export type LanguageSelectorMode = 'target' | 'interface' | 'explanation';

interface LanguageSelectorProps {
  mode?: LanguageSelectorMode;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  className?: string;
  label?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  mode = 'target',
  selectedLanguage,
  onSelectLanguage,
  className = '',
  label,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Interface & Explanation languages are restricted to 'en' | 'pt' | 'es'
  // Target language supports all 13 languages
  const availableLanguages = useMemo(() => {
    const all = getAllSupportedLanguages();
    if (mode === 'interface' || mode === 'explanation') {
      return all.filter(l => l.id === 'en' || l.id === 'pt' || l.id === 'es');
    }
    return all.filter(l => !isForbiddenLanguage(l.id));
  }, [mode]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return availableLanguages;
    const q = searchQuery.toLowerCase().trim();
    return availableLanguages.filter(
      l =>
        l.displayName.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    );
  }, [availableLanguages, searchQuery]);

  const currentConfig = availableLanguages.find(l => l.id === selectedLanguage);

  return (
    <div className={`relative ${className}`} data-testid="language-selector">
      {label && (
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Selected Language Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl text-left text-sm text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg leading-none" role="img" aria-label={currentConfig?.displayName}>
            {currentConfig?.flag || '🌐'}
          </span>
          <span className="font-medium text-slate-100 truncate">
            {currentConfig?.displayName || selectedLanguage}
          </span>
          <span className="text-xs text-slate-400 font-normal">
            ({currentConfig?.nativeName})
          </span>
        </div>
        <Globe className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 max-h-72 overflow-hidden flex flex-col">
          {availableLanguages.length > 5 && (
            <div className="relative mb-2 shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search language..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
          )}

          <div className="overflow-y-auto space-y-1 pr-1" role="listbox">
            {filteredLanguages.map(lang => {
              const isSelected = lang.id === selectedLanguage;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="truncate">{lang.displayName}</span>
                    <span className="text-[11px] text-slate-500">({lang.nativeName})</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
            {filteredLanguages.length === 0 && (
              <div className="text-center py-3 text-xs text-slate-500">
                No matching languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
