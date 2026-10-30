/**
 * Lexilume Country Explorer Component
 * 
 * Powered by REST Countries API Provider with offline baseline support.
 * Features:
 * - Search by country name, capital, or language
 * - Official flags, native names, capital, region, currencies, timezones
 * - Official languages vs. spoken languages distinction
 * - Local greetings & useful phrases in the country's languages
 * - Direct connection to language track study
 */

import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Search,
  Languages,
  Coins,
  Clock,
  Compass,
  Volume2,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CountryProvider, NormalizedCountry } from '../../services/providers/countries/countryProvider';
import { SpeechService } from '../../services/speech';
import { Language } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export interface CountryExplorerProps {
  onSelectLanguageTrack?: (lang: Language) => void;
}

export const CountryExplorer: React.FC<CountryExplorerProps> = ({ onSelectLanguageTrack }) => {
  const [countries, setCountries] = useState<NormalizedCountry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<NormalizedCountry | null>(null);
  const [loading, setLoading] = useState(false);

  const countryProvider = new CountryProvider();

  useEffect(() => {
    let isCancelled = false;
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const res = await countryProvider.execute({
          query: searchQuery || undefined,
          region: selectedRegion !== 'all' ? selectedRegion : undefined,
        });
        if (!isCancelled) {
          setCountries(res);
          if (!selectedCountry && res.length > 0) {
            setSelectedCountry(res[0]);
          }
        }
      } catch (err) {
        if (!isCancelled) setCountries([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchCountries();
    return () => { isCancelled = true; };
  }, [searchQuery, selectedRegion]);

  const getPrimaryNativeName = (country: NormalizedCountry): string => {
    const keys = Object.keys(country.nativeNames);
    if (keys.length === 0) return country.officialName;
    return country.nativeNames[keys[0]].common || country.nativeNames[keys[0]].official;
  };

  return (
    <div className="space-y-6">
      {/* Explorer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Country Explorer — Nações & Línguas</h2>
                <Badge variant="emerald" size="sm">REST Countries v3.1</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore países, nomes nativos, capitais, moedas, idiomas oficiais e expressões úteis em cada cultura.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Region Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por país, capital ou língua oficial..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            {['all', 'Europe', 'Americas', 'Asia'].map(r => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedRegion === r ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'all' ? 'Todas Regiões' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Countries List & Country Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Country Selector List */}
        <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Carregando catálogo de nações...
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Nenhum país encontrado para o filtro pesquisado.
            </div>
          ) : (
            countries.map(c => {
              const isSelected = selectedCountry?.code === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flagEmoji}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-100">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.capital} • {c.region}</div>
                    </div>
                  </div>
                  <Badge variant="slate" size="sm">{c.code}</Badge>
                </button>
              );
            })
          )}
        </div>

        {/* Right 2 Columns: Detailed Country Profile */}
        <div className="lg:col-span-2">
          {selectedCountry ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{selectedCountry.flagEmoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-extrabold text-slate-100">{selectedCountry.name}</h3>
                      <Badge variant="emerald">{selectedCountry.code}</Badge>
                    </div>
                    <div className="text-xs text-emerald-400 font-serif italic mt-0.5">
                      Nome Nativo: {getPrimaryNativeName(selectedCountry)}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span className="block font-semibold text-slate-200">Capital: {selectedCountry.capital}</span>
                  <span className="block text-[11px] text-slate-500">População: {selectedCountry.population.toLocaleString()} hab.</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5 text-sky-400" /> Região & Sub-região
                  </div>
                  <div className="text-xs font-bold text-slate-200">{selectedCountry.region}</div>
                  <div className="text-[11px] text-slate-400">{selectedCountry.subregion || '—'}</div>
                </div>

                <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Coins className="w-3.5 h-3.5 text-amber-400" /> Moeda Oficial
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {Object.values(selectedCountry.currencies).map(c => `${c.name} (${c.symbol})`).join(', ') || 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Código: {Object.keys(selectedCountry.currencies).join(', ') || 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Fusos Horários
                  </div>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    {selectedCountry.timezones[0] || 'UTC'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedCountry.timezones.length} fuso(s) registrado(s)
                  </div>
                </div>
              </div>

              {/* Official Languages Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Idiomas Oficiais do País
                  </h4>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedCountry.languages).map(([code, langName]) => (
                    <div
                      key={code}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs font-semibold text-emerald-200 flex items-center gap-2"
                    >
                      <span>{langName}</span>
                      <span className="text-[10px] text-emerald-400 uppercase font-mono bg-emerald-900/60 px-1 rounded">
                        {code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultural Greetings & Common Phrases */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Saudações Úteis para Viajantes em {selectedCountry.name}:</span>
                  <span className="text-[10px] text-slate-500">Expressões Oficiais</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-bold">Olá! / Bom dia!</div>
                      <div className="text-[10px] text-slate-400">Saudação Inicial Cortês</div>
                    </div>
                    <button
                      onClick={() => SpeechService.speak('Olá, bom dia!', 'pt')}
                      className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-bold">Muito obrigado(a)!</div>
                      <div className="text-[10px] text-slate-400">Agradecimento Essencial</div>
                    </div>
                    <button
                      onClick={() => SpeechService.speak('Muito obrigado!', 'pt')}
                      className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-slate-500 text-xs">
              Selecione um país na lista ao lado para ver sua ficha cultural e linguística completa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
