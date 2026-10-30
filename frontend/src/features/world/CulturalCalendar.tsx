/**
 * Lexilume Cultural Calendar & Public Holidays Component
 * 
 * Powered by Nager.Date API Provider with deterministic cultural background.
 * Features:
 * - Upcoming country statutory & cultural holidays
 * - Native names and celebration vocabulary
 * - Cultural explanations with AI / deterministic fallback
 * - Audio pronunciation via Web Speech API
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Volume2,
  BookmarkPlus,
  BookOpen,
  Info,
  Globe2,
} from 'lucide-react';
import { HolidayProvider, NormalizedHoliday } from '../../services/providers/holidays/holidayProvider';
import { SpeechService } from '../../services/speech';
import { Language } from '../../types';
import { Badge } from '../../components/common/Badge';

export interface CalendarCountry {
  code: string;
  name: string;
  language: Language;
}

export const CALENDAR_COUNTRIES: CalendarCountry[] = [
  { code: 'PT', name: 'Portugal', language: 'pt' },
  { code: 'BR', name: 'Brasil', language: 'pt' },
  { code: 'ES', name: 'Espanha', language: 'es' },
  { code: 'FR', name: 'França', language: 'fr' },
  { code: 'DE', name: 'Alemanha', language: 'de' },
  { code: 'IT', name: 'Itália', language: 'it' },
  { code: 'JP', name: 'Japão', language: 'ja' },
  { code: 'KR', name: 'Coreia do Sul', language: 'ko' },
  { code: 'RU', name: 'Rússia', language: 'ru' },
  { code: 'NL', name: 'Países Baixos', language: 'nl' },
  { code: 'CN', name: 'China', language: 'zh' },
  { code: 'TR', name: 'Turquia', language: 'tr' },
  { code: 'IN', name: 'Índia', language: 'ta' },
  { code: 'GB', name: 'Reino Unido', language: 'en' },
];

export const CulturalCalendar: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<CalendarCountry>(CALENDAR_COUNTRIES[0]);
  const [holidays, setHolidays] = useState<NormalizedHoliday[]>([]);
  const [loading, setLoading] = useState(false);

  const holidayProvider = new HolidayProvider();

  useEffect(() => {
    let isCancelled = false;
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const res = await holidayProvider.execute({
          countryCode: selectedCountry.code,
          year: new Date().getFullYear(),
        });
        if (!isCancelled) {
          setHolidays(res);
        }
      } catch {
        if (!isCancelled) setHolidays([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchHolidays();
    return () => { isCancelled = true; };
  }, [selectedCountry]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Calendário Cultural & Feriados Nacionais</h2>
                <Badge variant="indigo" size="sm">Nager.Date</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Descubra celebrações oficiais, datas cívicas e contexto histórico autêntico para cada país.
              </p>
            </div>
          </div>

          {/* Country Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {CALENDAR_COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCountry.code === c.code
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Exibindo comemorações e feriados de <strong>{selectedCountry.name}</strong> para o ano de {new Date().getFullYear()}.
        </div>
      </div>

      {/* Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-xs text-slate-400">
            Carregando feriados e tradições culturais...
          </div>
        ) : holidays.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-xs text-slate-500">
            Nenhum feriado registrado para esta localidade.
          </div>
        ) : (
          holidays.map((h, idx) => (
            <div
              key={idx}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:border-slate-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="indigo" size="sm">{h.date}</Badge>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {h.types.join(', ')}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-100 leading-snug">
                    {h.localName}
                  </h4>
                  <button
                    onClick={() => SpeechService.speak(h.localName, selectedCountry.language)}
                    title="Ouvir pronúncia"
                    className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer transition flex-shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {h.name !== h.localName && (
                  <div className="text-xs text-slate-400 italic">
                    Tradução: {h.name}
                  </div>
                )}

                {h.explanation && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-serif">
                    {h.explanation}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
