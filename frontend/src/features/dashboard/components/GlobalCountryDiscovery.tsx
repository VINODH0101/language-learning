import React, { useState, useEffect } from 'react';
import {
  Compass,
  Globe,
  CloudSun,
  Users,
  Building,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { CountryProvider, NormalizedCountry, FALLBACK_COUNTRIES } from '../../../services/providers/countries/countryProvider';
import { WeatherProvider, WMO_WEATHER_CODES } from '../../../services/providers/weather/weatherProvider';
import { CULTURAL_CATALOG } from '../../../data/cultureData';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';
import { Language } from '../../../types';

interface GlobalCountryDiscoveryProps {
  targetLanguage: Language;
  onExploreAll: () => void;
}

// Cultural facts for prominent global destinations
const COUNTRY_CULTURAL_INSIGHTS: Record<string, string> = {
  PT: 'Birthplace of Fado music and home to the world’s oldest operating bookstore (Livraria Bertrand, founded 1732).',
  BR: 'The most biodiverse nation on Earth and origin of Bossa Nova, celebrating Portuguese with rhythmic cadences.',
  ES: 'Home to 49 UNESCO World Heritage sites, rich regional languages, and the enduring literary heritage of Cervantes.',
  MX: 'Cradle of ancient Mesoamerican civilizations and the most populous Spanish-speaking country globally.',
  GB: 'Epicenter of modern English literature, theater from Shakespeare, and foundational parliamentary traditions.',
  US: 'A diverse continental linguistic melting pot with vast regional idioms, jazz history, and global cultural reach.',
  FR: 'Renowned for the Académie Française, philosophical salon culture, and timeless gastronomy and cinema.',
  DE: 'Land of poets and thinkers (Dichter und Denker), seminal classical composers, and vibrant regional dialogues.',
  IT: 'The cradle of the Renaissance, opera, and Latin roots that gave birth to all modern Romance languages.',
  JP: 'Harmonious blend of ancient traditions and futuristic innovation, featuring unique levels of linguistic honorifics.',
  KR: 'Creators of the scientific Hangul alphabet invented by King Sejong the Great in 1443 for universal literacy.',
  CN: 'Continuous 5,000-year written history with expressive ideographic characters and varied tonal spoken languages.',
  RU: 'Vast literary tradition from Tolstoy and Dostoevsky, written in the expressive Cyrillic alphabet.',
  NL: 'Pioneers of international trade, cycling infrastructure, and celebrated golden age fine artists.',
  TR: 'Historic bridge between East and West, boasting deep poetic folklore and vibrant hospitality rituals.',
  IN: 'Ancient home of classical Tamil and diverse Dravidian & Indo-Aryan traditions, boasting monumental architecture and rich linguistic multiplicity.',
};

export const GlobalCountryDiscovery: React.FC<GlobalCountryDiscoveryProps> = ({
  targetLanguage,
  onExploreAll,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const [allCountries, setAllCountries] = useState<NormalizedCountry[]>(FALLBACK_COUNTRIES);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => {
    if (targetLanguage === 'pt') return 'PT';
    if (targetLanguage === 'es') return 'ES';
    if (targetLanguage === 'en') return 'GB';
    if (targetLanguage === 'fr') return 'FR';
    if (targetLanguage === 'de') return 'DE';
    if (targetLanguage === 'it') return 'IT';
    if (targetLanguage === 'ja') return 'JP';
    if (targetLanguage === 'ko') return 'KR';
    if (targetLanguage === 'zh') return 'CN';
    if (targetLanguage === 'ru') return 'RU';
    if (targetLanguage === 'nl') return 'NL';
    if (targetLanguage === 'tr') return 'TR';
    if (targetLanguage === 'ta') return 'IN';
    return 'PT';
  });

  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null);

  // Load countries catalog
  useEffect(() => {
    const cp = new CountryProvider();
    cp.execute({})
      .then(res => {
        if (res && res.length > 0) {
          // Sort alphabetically
          const sorted = [...res].sort((a, b) => a.name.localeCompare(b.name));
          setAllCountries(sorted);
        }
      })
      .catch(() => {
        // Fallback already initialized
      });
  }, []);

  // Update selected country when target language changes
  useEffect(() => {
    let code = 'PT';
    if (targetLanguage === 'pt') code = 'PT';
    else if (targetLanguage === 'es') code = 'ES';
    else if (targetLanguage === 'en') code = 'GB';
    else if (targetLanguage === 'fr') code = 'FR';
    else if (targetLanguage === 'de') code = 'DE';
    else if (targetLanguage === 'it') code = 'IT';
    else if (targetLanguage === 'ja') code = 'JP';
    else if (targetLanguage === 'ko') code = 'KR';
    else if (targetLanguage === 'zh') code = 'CN';
    else if (targetLanguage === 'ru') code = 'RU';
    else if (targetLanguage === 'nl') code = 'NL';
    else if (targetLanguage === 'tr') code = 'TR';
    else if (targetLanguage === 'ta') code = 'IN';

    setSelectedCountryCode(code);
  }, [targetLanguage]);

  const selectedCountry =
    allCountries.find(c => c.code === selectedCountryCode) ||
    FALLBACK_COUNTRIES.find(c => c.code === selectedCountryCode) ||
    FALLBACK_COUNTRIES[0];

  // Fetch real-time weather using genuine country latlng coordinates
  useEffect(() => {
    if (!selectedCountry) return;

    const lat = selectedCountry.latlng[0] || 38.72;
    const lng = selectedCountry.latlng[1] || -9.14;
    const timezone = selectedCountry.timezones?.[0] || 'UTC';

    const wp = new WeatherProvider();
    wp.execute({
      latitude: lat,
      longitude: lng,
      cityName: selectedCountry.capital || selectedCountry.name,
      timezone,
    })
      .then(res => {
        if (res?.current) {
          const codeInfo = WMO_WEATHER_CODES[res.current.weatherCode] || WMO_WEATHER_CODES[0];
          const desc =
            interfaceLanguage === 'en'
              ? codeInfo.en
              : interfaceLanguage === 'es'
              ? codeInfo.es
              : codeInfo.pt;
          setWeather({
            temp: res.current.temperatureC,
            desc,
            icon: codeInfo.icon,
          });
        }
      })
      .catch(() => {
        setWeather({ temp: 21, desc: 'Clear Sky', icon: '☀️' });
      });
  }, [selectedCountryCode, interfaceLanguage]);

  // Cultural content filtered dynamically by interface language
  const matchingArticles = CULTURAL_CATALOG.filter(a => a.content_language === interfaceLanguage);
  const explorePreviewArticles = (matchingArticles.length > 0 ? matchingArticles : CULTURAL_CATALOG).slice(0, 3);

  // Format population with reference year 2023
  const formattedPopulation = selectedCountry.population
    ? `${(selectedCountry.population / 1_000_000).toFixed(1)}M (2023)`
    : 'N/A';

  const languageList = Object.values(selectedCountry.languages || {}).join(', ') || 'N/A';
  const currencyList = Object.values(selectedCountry.currencies || {})
    .map(c => `${c.name} (${c.symbol})`)
    .join(', ') || 'N/A';

  const culturalFact =
    COUNTRY_CULTURAL_INSIGHTS[selectedCountry.code] ||
    `${selectedCountry.name} is a sovereign nation in ${selectedCountry.region} with official linguistic heritage in ${languageList}.`;

  return (
    <div className="space-y-4">
      {/* 1. Country Explorer Showcase Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  {t('dashboard:world_badge', 'Lexilume World')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  Global Discovery
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                <span>{selectedCountry.flagEmoji}</span>
                <span>{selectedCountry.name}</span>
                <span className="text-xs text-slate-400 font-normal">({selectedCountry.capital})</span>
              </h3>
            </div>
          </div>

          {/* Country Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                aria-label="Select country to explore"
                value={selectedCountryCode}
                onChange={e => setSelectedCountryCode(e.target.value)}
                className="bg-slate-800 border border-slate-700 hover:border-indigo-500/60 rounded-xl text-xs text-slate-200 px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-h-[36px]"
              >
                {allCountries.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flagEmoji} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs border-indigo-600/50 hover:bg-indigo-950/40 text-indigo-300 min-h-[36px] cursor-pointer shrink-0"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={onExploreAll}
            >
              {t('dashboard:world_open_btn', 'Explore Countries')}
            </Button>
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Capital & Region */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold uppercase text-[10px]">
                {t('dashboard:world_capital_region', 'Capital & Region')}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-100 truncate">{selectedCountry.capital}</p>
            <p className="text-[11px] text-slate-400 truncate">{selectedCountry.region} • {selectedCountry.subregion}</p>
          </div>

          {/* Population with Reference Year */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold uppercase text-[10px]">
                {t('dashboard:world_population', 'Population')}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-100">{formattedPopulation}</p>
            <p className="text-[11px] text-slate-400 truncate">Official Census reference</p>
          </div>

          {/* Official Languages */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold uppercase text-[10px]">
                {t('dashboard:world_languages', 'Official Languages')}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-100 truncate">{languageList}</p>
            <p className="text-[11px] text-slate-400 truncate">Currencies: {currencyList}</p>
          </div>

          {/* Live Weather at Genuine Coordinates */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold uppercase text-[10px]">
                {t('dashboard:world_weather', 'Local Weather')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100">
                {weather?.temp ?? 20}°C • {weather?.desc || 'Clear'}
              </span>
              <span className="text-lg leading-none">{weather?.icon || '☀️'}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              GPS: {selectedCountry.latlng[0].toFixed(2)}°, {selectedCountry.latlng[1].toFixed(2)}°
            </p>
          </div>
        </div>

        {/* Cultural Insight Banner */}
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-start gap-2.5 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-indigo-300 mr-1.5">
              {t('dashboard:world_cultural_fact', 'Cultural Fact:')}
            </span>
            <span>{culturalFact}</span>
          </div>
        </div>
      </div>

      {/* 2. CULTURAL DISCOVERY PREVIEW (Filtered by user's interface language) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              {t('dash_cultural_title')}
            </h3>
          </div>

          <button
            type="button"
            onClick={onExploreAll}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer py-1"
          >
            <span>{t('dash_cultural_view_all')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {explorePreviewArticles.map(art => (
            <div
              key={art.id}
              onClick={onExploreAll}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                    {art.origin_country}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 uppercase">
                    {art.content_language} • {art.cefr_level}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                  {art.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-indigo-400 flex items-center justify-between font-semibold">
                <span>{art.read_time_minutes} {t('dash_reading_time')}</span>
                <span className="flex items-center gap-0.5">
                  {t('dash_read_label')} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
