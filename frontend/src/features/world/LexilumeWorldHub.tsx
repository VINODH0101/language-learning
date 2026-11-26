/**
 * Lexilume World — Learn Languages Through the Real World
 */

import React, { useState } from 'react';
import {
  Globe2,
  Clock,
  CloudSun,
  Calendar,
  Coins,
  Compass,
} from 'lucide-react';
import { Language } from '../../types';
import { WorldClock } from './WorldClock';
import { CountryExplorer } from './CountryExplorer';
import { WeatherStudio } from './WeatherStudio';
import { CulturalCalendar } from './CulturalCalendar';
import { CurrencyPractice } from './CurrencyPractice';
import { WorldMapExplorer } from './WorldMapExplorer';
import { useI18n } from '../../i18n/i18nContext';

export type WorldHubTab = 'clock' | 'countries' | 'weather' | 'calendar' | 'currency' | 'map';

export interface LexilumeWorldHubProps {
  initialTab?: WorldHubTab;
  learningLanguage?: Language;
}

export const LexilumeWorldHub: React.FC<LexilumeWorldHubProps> = ({
  initialTab = 'clock',
  learningLanguage = 'pt',
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<WorldHubTab>(initialTab);

  const tabs: { id: WorldHubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'clock', label: t('world:tab_clock', 'World Clock & Greetings'), icon: Clock },
    { id: 'countries', label: t('world:tab_countries', 'Country Explorer'), icon: Globe2 },
    { id: 'weather', label: t('world:tab_weather', 'Weather & Vocabulary'), icon: CloudSun },
    { id: 'calendar', label: t('world:tab_calendar', 'Cultural Calendar'), icon: Calendar },
    { id: 'currency', label: t('world:tab_currency', 'Currency & Finance'), icon: Coins },
    { id: 'map', label: t('world:tab_map', 'World Map'), icon: Compass },
  ];

  return (
    <div className="space-y-5">
      {/* Calm Segmented World Navigator */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white border border-stone-200 p-1.5 rounded-2xl shadow-xs">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition min-h-[38px] ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Viewports */}
      <div className="pt-1">
        {activeTab === 'clock' && <WorldClock learningLanguage={learningLanguage} />}
        {activeTab === 'countries' && <CountryExplorer />}
        {activeTab === 'weather' && <WeatherStudio learningLanguage={learningLanguage} />}
        {activeTab === 'calendar' && <CulturalCalendar />}
        {activeTab === 'currency' && <CurrencyPractice learningLanguage={learningLanguage} />}
        {activeTab === 'map' && <WorldMapExplorer />}
      </div>
    </div>
  );
};
