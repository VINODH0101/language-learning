/**
 * Lexilume World — Learn Languages Through the Real World
 * 
 * Unified portal bringing together:
 * 1. World Clock & Contextual Greetings
 * 2. Country Explorer (REST Countries)
 * 3. Weather Studio & Real-World Vocabulary (Open-Meteo)
 * 4. Cultural Calendar & Holidays (Nager.Date)
 * 5. Currency Practice & Financial Vocabulary (Frankfurter)
 * 6. Interactive Explore the World Map (Leaflet / OpenStreetMap)
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
import { Badge } from '../../components/common/Badge';

export type WorldHubTab = 'clock' | 'countries' | 'weather' | 'calendar' | 'currency' | 'map';

export interface LexilumeWorldHubProps {
  initialTab?: WorldHubTab;
  learningLanguage?: Language;
}

export const LexilumeWorldHub: React.FC<LexilumeWorldHubProps> = ({
  initialTab = 'clock',
  learningLanguage = 'pt',
}) => {
  const [activeTab, setActiveTab] = useState<WorldHubTab>(initialTab);

  const tabs: { id: WorldHubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'clock', label: 'World Clock & Saudações', icon: <Clock className="w-4 h-4 text-sky-400" /> },
    { id: 'countries', label: 'Explorador de Países', icon: <Globe2 className="w-4 h-4 text-emerald-400" /> },
    { id: 'weather', label: 'Clima & Vocabulário', icon: <CloudSun className="w-4 h-4 text-amber-400" /> },
    { id: 'calendar', label: 'Calendário Cultural', icon: <Calendar className="w-4 h-4 text-indigo-400" /> },
    { id: 'currency', label: 'Câmbio & Finanças', icon: <Coins className="w-4 h-4 text-teal-400" /> },
    { id: 'map', label: 'Mapa do Mundo', icon: <Compass className="w-4 h-4 text-rose-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* World Hub Top Navigator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.icon}
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
