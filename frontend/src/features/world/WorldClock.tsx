/**
 * Lexilume World Clock & Contextual Greetings Component
 * 
 * Powered by browser-native Intl.DateTimeFormat (zero paid APIs).
 * Features:
 * - Real-time clock for 13 authorized language destinations
 * - Time difference relative to user's local timezone
 * - Day / Night indication (Sun / Moon)
 * - Time-appropriate greeting suggestions in the target language
 * - Audio pronunciation via Web Speech API
 * - Favorite destination toggling & persistence
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sun,
  Moon,
  Volume2,
  Star,
  Globe2,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import { Language } from '../../types';
import { SpeechService } from '../../services/speech';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export interface WorldClockDestination {
  id: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  timezone: string;
  language: Language;
}

export const DEFAULT_DESTINATIONS: WorldClockDestination[] = [
  { id: 'dest-lisbon', cityName: 'Lisboa', countryName: 'Portugal', countryCode: 'PT', timezone: 'Europe/Lisbon', language: 'pt' },
  { id: 'dest-saopaulo', cityName: 'São Paulo', countryName: 'Brasil', countryCode: 'BR', timezone: 'America/Sao_Paulo', language: 'pt' },
  { id: 'dest-madrid', cityName: 'Madrid', countryName: 'Espanha', countryCode: 'ES', timezone: 'Europe/Madrid', language: 'es' },
  { id: 'dest-paris', cityName: 'Paris', countryName: 'França', countryCode: 'FR', timezone: 'Europe/Paris', language: 'fr' },
  { id: 'dest-berlin', cityName: 'Berlim', countryName: 'Alemanha', countryCode: 'DE', timezone: 'Europe/Berlin', language: 'de' },
  { id: 'dest-rome', cityName: 'Roma', countryName: 'Itália', countryCode: 'IT', timezone: 'Europe/Rome', language: 'it' },
  { id: 'dest-tokyo', cityName: 'Tóquio', countryName: 'Japão', countryCode: 'JP', timezone: 'Asia/Tokyo', language: 'ja' },
  { id: 'dest-seoul', cityName: 'Seul', countryName: 'Coreia do Sul', countryCode: 'KR', timezone: 'Asia/Seoul', language: 'ko' },
  { id: 'dest-moscow', cityName: 'Moscovo', countryName: 'Rússia', countryCode: 'RU', timezone: 'Europe/Moscow', language: 'ru' },
  { id: 'dest-amsterdam', cityName: 'Amesterdão', countryName: 'Países Baixos', countryCode: 'NL', timezone: 'Europe/Amsterdam', language: 'nl' },
  { id: 'dest-beijing', cityName: 'Pequim', countryName: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', language: 'zh' },
  { id: 'dest-istanbul', cityName: 'Istambul', countryName: 'Turquia', countryCode: 'TR', timezone: 'Europe/Istanbul', language: 'tr' },
  { id: 'dest-chennai', cityName: 'Chennai', countryName: 'Índia (Tâmil)', countryCode: 'IN', timezone: 'Asia/Kolkata', language: 'ta' },
  { id: 'dest-london', cityName: 'Londres', countryName: 'Reino Unido', countryCode: 'GB', timezone: 'Europe/London', language: 'en' },
];

export const TIME_GREETINGS: Record<string, { morning: string; afternoon: string; evening: string }> = {
  pt: { morning: 'Bom dia!', afternoon: 'Boa tarde!', evening: 'Boa noite!' },
  es: { morning: '¡Buenos días!', afternoon: '¡Buenas tardes!', evening: '¡Buenas noches!' },
  en: { morning: 'Good morning!', afternoon: 'Good afternoon!', evening: 'Good evening!' },
  fr: { morning: 'Bonjour !', afternoon: 'Bon après-midi !', evening: 'Bonsoir !' },
  de: { morning: 'Guten Morgen!', afternoon: 'Guten Tag!', evening: 'Guten Abend!' },
  it: { morning: 'Buongiorno!', afternoon: 'Buon pomeriggio!', evening: 'Buonasera!' },
  ja: { morning: 'おはようございます！', afternoon: 'こんにちは！', evening: 'こんばんは！' },
  ko: { morning: '좋은 아침입니다!', afternoon: '좋은 오후입니다!', evening: '좋은 저녁입니다!' },
  ru: { morning: 'Доброе утро!', afternoon: 'Добрый день!', evening: 'Добрый вечер!' },
  nl: { morning: 'Goedemorgen!', afternoon: 'Goedemiddag!', evening: 'Goedenavond!' },
  zh: { morning: '早上好！', afternoon: '下午好！', evening: '晚上好！' },
  tr: { morning: 'Günaydın!', afternoon: 'İyi günler!', evening: 'İyi akşamlar!' },
  ta: { morning: 'காலை வணக்கம்!', afternoon: 'மதிய வணக்கம்!', evening: 'மாலை வணக்கம்!' },
};

export interface WorldClockProps {
  learningLanguage?: Language;
}

export const WorldClock: React.FC<WorldClockProps> = ({ learningLanguage = 'pt' }) => {
  const [now, setNow] = useState(new Date());
  const [destinations, setDestinations] = useState<WorldClockDestination[]>(DEFAULT_DESTINATIONS);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('lexilume_favorite_destinations');
        return saved ? new Set(JSON.parse(saved)) : new Set(['dest-lisbon', 'dest-saopaulo', 'dest-madrid']);
      } catch {
        return new Set(['dest-lisbon', 'dest-saopaulo', 'dest-madrid']);
      }
    }
    return new Set(['dest-lisbon', 'dest-saopaulo', 'dest-madrid']);
  });

  const [filterLang, setFilterLang] = useState<string>(learningLanguage || 'all');

  // Update clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lexilume_favorite_destinations', JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const getUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  };

  const getDestinationTimeData = (timezone: string) => {
    try {
      const timeFormatter = new Intl.DateTimeFormat('pt-PT', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
        timeZone: timezone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });

      const timeString = timeFormatter.format(now);
      const dateString = dateFormatter.format(now);
      const hour = parseInt(hourFormatter.format(now), 10);
      const isDay = hour >= 6 && hour < 19;

      return { timeString, dateString, hour, isDay };
    } catch (e) {
      return { timeString: '--:--', dateString: '--', hour: 12, isDay: true };
    }
  };

  const getGreetingForHour = (hour: number, lang: Language) => {
    const greetings = TIME_GREETINGS[lang] || TIME_GREETINGS.pt;
    if (hour >= 5 && hour < 12) return { text: greetings.morning, period: 'Manhã' };
    if (hour >= 12 && hour < 18) return { text: greetings.afternoon, period: 'Tarde' };
    return { text: greetings.evening, period: 'Noite' };
  };

  const getTimeOffsetDiff = (destTz: string) => {
    try {
      const userTz = getUserTimezone();
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
      const destTime = new Date(now.toLocaleString('en-US', { timeZone: destTz }));
      const diffHours = Math.round((destTime.getTime() - userTime.getTime()) / (1000 * 60 * 60));

      if (diffHours === 0) return 'Mesmo fuso';
      return diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`;
    } catch {
      return '—';
    }
  };

  const filteredDestinations = destinations.filter(d => {
    if (filterLang !== 'all' && d.language !== filterLang) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">World Clock & Saudações Contextuais</h2>
                <Badge variant="sky" size="sm">Fuso Nativo</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fusos horários oficiais (Intl API), saudação situacional de acordo com o período do dia e diferença em relação ao seu horário local.
              </p>
            </div>
          </div>

          {/* User local time badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Seu Fuso ({getUserTimezone()}):</span>
            <span className="font-mono font-bold text-sky-300">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2">
            Filtrar Idioma:
          </span>
          <button
            onClick={() => setFilterLang('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterLang === 'all' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          {(['pt', 'es', 'en', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'nl', 'zh', 'tr', 'ta'] as Language[]).map(l => (
            <button
              key={l}
              onClick={() => setFilterLang(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                filterLang === l ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Destination Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDestinations.map(dest => {
          const { timeString, dateString, hour, isDay } = getDestinationTimeData(dest.timezone);
          const greeting = getGreetingForHour(hour, dest.language);
          const offsetDiff = getTimeOffsetDiff(dest.timezone);
          const isFav = favoriteIds.has(dest.id);

          return (
            <div
              key={dest.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                isFav
                  ? 'bg-slate-900 border-sky-500/60 shadow-md ring-1 ring-sky-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-base">{dest.cityName}</span>
                    <Badge variant="slate" size="sm">{dest.countryCode}</Badge>
                    <Badge variant="indigo" size="sm">{dest.language.toUpperCase()}</Badge>
                  </div>
                  <button
                    onClick={() => toggleFavorite(dest.id)}
                    title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      isFav ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight flex items-center gap-2">
                    <span>{timeString}</span>
                    {isDay ? (
                      <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
                    ) : (
                      <Moon className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 capitalize block">{dateString}</span>
                    <span className="text-[10px] text-sky-400 font-bold block">{offsetDiff}</span>
                  </div>
                </div>
              </div>

              {/* Contextual Greeting Box */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  <span>Saudação de {greeting.period}</span>
                  <button
                    onClick={() => SpeechService.speak(greeting.text, dest.language)}
                    title="Ouvir pronúncia"
                    className="text-slate-400 hover:text-sky-300 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-sm font-bold text-sky-200">
                  {greeting.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
