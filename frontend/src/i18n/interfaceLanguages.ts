import { InterfaceLanguage } from '../types';

export interface InterfaceLanguageInfo {
  code: InterfaceLanguage;
  name: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

export const INTERFACE_LANGUAGES_LIST: InterfaceLanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '中文（简体）', flag: '🇨🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
];

export const INTERFACE_LANGUAGES_MAP: Record<InterfaceLanguage, InterfaceLanguageInfo> =
  INTERFACE_LANGUAGES_LIST.reduce(
    (acc, item) => {
      acc[item.code] = item;
      return acc;
    },
    {} as Record<InterfaceLanguage, InterfaceLanguageInfo>
  );

export function getInterfaceLanguageInfo(code: InterfaceLanguage): InterfaceLanguageInfo {
  return (
    INTERFACE_LANGUAGES_MAP[code] || {
      code,
      name: code,
      nativeName: code,
      flag: '🌐',
    }
  );
}
