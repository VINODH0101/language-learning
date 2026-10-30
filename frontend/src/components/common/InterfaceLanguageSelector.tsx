import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import {
  INTERFACE_LANGUAGES_LIST,
  getInterfaceLanguageInfo,
} from '../../i18n/interfaceLanguages';
import { InterfaceLanguage } from '../../types';

interface InterfaceLanguageSelectorProps {
  variant?: 'compact' | 'full' | 'dropdown';
  className?: string;
  onLanguageChange?: (lang: InterfaceLanguage) => void;
}

export const InterfaceLanguageSelector: React.FC<InterfaceLanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
  onLanguageChange,
}) => {
  const { interfaceLanguage, setInterfaceLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentInfo = getInterfaceLanguageInfo(interfaceLanguage);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: InterfaceLanguage) => {
    setInterfaceLanguage(code);
    onLanguageChange?.(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} data-testid="interface-language-selector">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer min-h-[38px] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${t('settings:interface_language', 'Interface Language')}: ${currentInfo.nativeName}`}
        title={`${t('settings:interface_language', 'Interface Language')}: ${currentInfo.nativeName}`}
      >
        <span className="text-base leading-none" role="img" aria-hidden="true">
          {currentInfo.flag}
        </span>
        <span className="hidden sm:inline-block max-w-[95px] truncate">
          {currentInfo.nativeName}
        </span>
        <span className="sm:hidden text-[11px] font-bold uppercase tracking-wide">
          {currentInfo.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('settings:interface_language', 'Interface Language')}
          className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-md animate-fadeIn divide-y divide-slate-800/60"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('settings:interface_language', 'Interface Language')}
          </div>
          <div className="pt-1 space-y-0.5">
            {INTERFACE_LANGUAGES_LIST.map((lang) => {
              const isSelected = lang.code === interfaceLanguage;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition cursor-pointer min-h-[38px] ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none shrink-0" role="img" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold truncate">{lang.nativeName}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'} truncate`}>
                        {lang.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0 text-white ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
