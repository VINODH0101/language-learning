import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import {
  INTERFACE_LANGUAGES_LIST,
  getInterfaceLanguageInfo,
} from '../../i18n/interfaceLanguages';
import { InterfaceLanguage } from '../../types';

// Product invariant: only English, Portuguese and Spanish are offered in the UI.
const PRIMARY_INTERFACE_LANGUAGES = INTERFACE_LANGUAGES_LIST.filter(lang =>
  (['en', 'pt', 'es'] as InterfaceLanguage[]).includes(lang.code)
);

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

  // Regional variants (pt-BR / pt-PT / es-*) display as their base language.
  const normalizedInterfaceLanguage: InterfaceLanguage = interfaceLanguage.startsWith('pt')
    ? 'pt'
    : interfaceLanguage.startsWith('es')
    ? 'es'
    : interfaceLanguage;
  const currentInfo = getInterfaceLanguageInfo(normalizedInterfaceLanguage);

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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 hover:text-stone-900 transition cursor-pointer min-h-[38px] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
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
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('settings:interface_language', 'Interface Language')}
          className="absolute right-0 mt-2 w-60 overflow-hidden bg-[#FDFBF7] border border-stone-200 rounded-xl shadow-xl p-1.5 z-50 animate-fadeIn"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t('settings:interface_language', 'Interface Language')}
          </div>
          <div className="space-y-0.5">
            {PRIMARY_INTERFACE_LANGUAGES.map((lang) => {
              const isSelected = lang.code === normalizedInterfaceLanguage;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition cursor-pointer min-h-[40px] ${
                    isSelected
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'text-stone-700 hover:bg-amber-50/70 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none shrink-0" role="img" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold truncate">{lang.nativeName}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-500'} truncate`}>
                        {lang.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0 text-amber-400 ml-2" />
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
