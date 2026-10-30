/**
 * REST Countries API Provider
 * Endpoint: https://restcountries.com/v3.1/
 * 
 * Provides country metadata, official languages, currencies, flags, and timezones.
 * Features:
 * - In-memory and Dexie persistence caching
 * - Offline baseline dataset for core language countries
 * - Strong typing & input validation
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface CountrySearchInput {
  query?: string;
  code?: string;
  region?: string;
  languageCode?: string;
}

export interface NormalizedCountry {
  code: string; // cca2 (e.g. "PT")
  code3: string; // cca3 (e.g. "PRT")
  name: string; // common English name (e.g. "Portugal")
  officialName: string;
  nativeNames: Record<string, { official: string; common: string }>;
  capital: string;
  region: string;
  subregion: string;
  flagEmoji: string;
  flagUrl: string;
  languages: Record<string, string>; // e.g. { por: "Portuguese" }
  currencies: Record<string, { name: string; symbol: string }>;
  timezones: string[];
  latlng: [number, number];
  population: number;
}

export const FALLBACK_COUNTRIES: NormalizedCountry[] = [
  {
    code: 'PT',
    code3: 'PRT',
    name: 'Portugal',
    officialName: 'Portuguese Republic',
    nativeNames: { por: { official: 'República Portuguesa', common: 'Portugal' } },
    capital: 'Lisbon',
    region: 'Europe',
    subregion: 'Southern Europe',
    flagEmoji: '🇵🇹',
    flagUrl: 'https://flagcdn.com/w320/pt.png',
    languages: { por: 'Portuguese' },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    timezones: ['UTC+00:00'],
    latlng: [39.5, -8.0],
    population: 10300000,
  },
  {
    code: 'BR',
    code3: 'BRA',
    name: 'Brazil',
    officialName: 'Federative Republic of Brazil',
    nativeNames: { por: { official: 'República Federativa do Brasil', common: 'Brasil' } },
    capital: 'Brasília',
    region: 'Americas',
    subregion: 'South America',
    flagEmoji: '🇧🇷',
    flagUrl: 'https://flagcdn.com/w320/br.png',
    languages: { por: 'Portuguese' },
    currencies: { BRL: { name: 'Brazilian Real', symbol: 'R$' } },
    timezones: ['UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00'],
    latlng: [-10.0, -55.0],
    population: 214000000,
  },
  {
    code: 'ES',
    code3: 'ESP',
    name: 'Spain',
    officialName: 'Kingdom of Spain',
    nativeNames: { spa: { official: 'Reino de España', common: 'España' } },
    capital: 'Madrid',
    region: 'Europe',
    subregion: 'Southern Europe',
    flagEmoji: '🇪🇸',
    flagUrl: 'https://flagcdn.com/w320/es.png',
    languages: { spa: 'Spanish' },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    timezones: ['UTC+01:00'],
    latlng: [40.0, -4.0],
    population: 47400000,
  },
  {
    code: 'FR',
    code3: 'FRA',
    name: 'France',
    officialName: 'French Republic',
    nativeNames: { fra: { official: 'République française', common: 'France' } },
    capital: 'Paris',
    region: 'Europe',
    subregion: 'Western Europe',
    flagEmoji: '🇫🇷',
    flagUrl: 'https://flagcdn.com/w320/fr.png',
    languages: { fra: 'French' },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    timezones: ['UTC+01:00'],
    latlng: [46.0, 2.0],
    population: 67750000,
  },
  {
    code: 'DE',
    code3: 'DEU',
    name: 'Germany',
    officialName: 'Federal Republic of Germany',
    nativeNames: { deu: { official: 'Bundesrepublik Deutschland', common: 'Deutschland' } },
    capital: 'Berlin',
    region: 'Europe',
    subregion: 'Western Europe',
    flagEmoji: '🇩🇪',
    flagUrl: 'https://flagcdn.com/w320/de.png',
    languages: { deu: 'German' },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    timezones: ['UTC+01:00'],
    latlng: [51.0, 9.0],
    population: 83200000,
  },
  {
    code: 'IT',
    code3: 'ITA',
    name: 'Italy',
    officialName: 'Italian Republic',
    nativeNames: { ita: { official: 'Repubblica Italiana', common: 'Italia' } },
    capital: 'Rome',
    region: 'Europe',
    subregion: 'Southern Europe',
    flagEmoji: '🇮🇹',
    flagUrl: 'https://flagcdn.com/w320/it.png',
    languages: { ita: 'Italian' },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    timezones: ['UTC+01:00'],
    latlng: [42.8, 12.8],
    population: 59000000,
  },
  {
    code: 'JP',
    code3: 'JPN',
    name: 'Japan',
    officialName: 'Japan',
    nativeNames: { jpn: { official: '日本国', common: '日本' } },
    capital: 'Tokyo',
    region: 'Asia',
    subregion: 'Eastern Asia',
    flagEmoji: '🇯🇵',
    flagUrl: 'https://flagcdn.com/w320/jp.png',
    languages: { jpn: 'Japanese' },
    currencies: { JPY: { name: 'Japanese Yen', symbol: '¥' } },
    timezones: ['UTC+09:00'],
    latlng: [36.0, 138.0],
    population: 125800000,
  },
  {
    code: 'KR',
    code3: 'KOR',
    name: 'South Korea',
    officialName: 'Republic of Korea',
    nativeNames: { kor: { official: '대한민국', common: '한국' } },
    capital: 'Seoul',
    region: 'Asia',
    subregion: 'Eastern Asia',
    flagEmoji: '🇰🇷',
    flagUrl: 'https://flagcdn.com/w320/kr.png',
    languages: { kor: 'Korean' },
    currencies: { KRW: { name: 'South Korean Won', symbol: '₩' } },
    timezones: ['UTC+09:00'],
    latlng: [37.0, 127.5],
    population: 51740000,
  },
  {
    code: 'RU',
    code3: 'RUS',
    name: 'Russia',
    officialName: 'Russian Federation',
    nativeNames: { rus: { official: 'Российская Федерация', common: 'Россия' } },
    capital: 'Moscow',
    region: 'Europe',
    subregion: 'Eastern Europe',
    flagEmoji: '🇷🇺',
    flagUrl: 'https://flagcdn.com/w320/ru.png',
    languages: { rus: 'Russian' },
    currencies: { RUB: { name: 'Russian Ruble', symbol: '₽' } },
    timezones: ['UTC+03:00'],
    latlng: [60.0, 100.0],
    population: 143400000,
  },
  {
    code: 'NL',
    code3: 'NLD',
    name: 'Netherlands',
    officialName: 'Kingdom of the Netherlands',
    nativeNames: { nld: { official: 'Koninkrijk der Nederlanden', common: 'Nederland' } },
    capital: 'Amsterdam',
    region: 'Europe',
    subregion: 'Western Europe',
    flagEmoji: '🇳🇱',
    flagUrl: 'https://flagcdn.com/w320/nl.png',
    languages: { nld: 'Dutch' },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    timezones: ['UTC+01:00'],
    latlng: [52.5, 5.75],
    population: 17700000,
  },
  {
    code: 'CN',
    code3: 'CHN',
    name: 'China',
    officialName: "People's Republic of China",
    nativeNames: { zho: { official: '中华人民共和国', common: '中国' } },
    capital: 'Beijing',
    region: 'Asia',
    subregion: 'Eastern Asia',
    flagEmoji: '🇨🇳',
    flagUrl: 'https://flagcdn.com/w320/cn.png',
    languages: { zho: 'Mandarin' },
    currencies: { CNY: { name: 'Chinese Yuan', symbol: '¥' } },
    timezones: ['UTC+08:00'],
    latlng: [35.0, 105.0],
    population: 1412000000,
  },
  {
    code: 'TR',
    code3: 'TUR',
    name: 'Türkiye',
    officialName: 'Republic of Türkiye',
    nativeNames: { tur: { official: 'Türkiye Cumhuriyeti', common: 'Türkiye' } },
    capital: 'Ankara',
    region: 'Asia',
    subregion: 'Western Asia',
    flagEmoji: '🇹🇷',
    flagUrl: 'https://flagcdn.com/w320/tr.png',
    languages: { tur: 'Turkish' },
    currencies: { TRY: { name: 'Turkish Lira', symbol: '₺' } },
    timezones: ['UTC+03:00'],
    latlng: [39.0, 35.0],
    population: 85300000,
  },
  {
    code: 'IN',
    code3: 'IND',
    name: 'India',
    officialName: 'Republic of India',
    nativeNames: { tam: { official: 'இந்தியக் குடியரசு', common: 'இந்தியா' } },
    capital: 'New Delhi',
    region: 'Asia',
    subregion: 'Southern Asia',
    flagEmoji: '🇮🇳',
    flagUrl: 'https://flagcdn.com/w320/in.png',
    languages: { tam: 'Tamil', eng: 'English' },
    currencies: { INR: { name: 'Indian Rupee', symbol: '₹' } },
    timezones: ['UTC+05:30'],
    latlng: [20.0, 77.0],
    population: 1408000000,
  },
  {
    code: 'GB',
    code3: 'GBR',
    name: 'United Kingdom',
    officialName: 'United Kingdom of Great Britain and Northern Ireland',
    nativeNames: { eng: { official: 'United Kingdom of Great Britain and Northern Ireland', common: 'United Kingdom' } },
    capital: 'London',
    region: 'Europe',
    subregion: 'Northern Europe',
    flagEmoji: '🇬🇧',
    flagUrl: 'https://flagcdn.com/w320/gb.png',
    languages: { eng: 'English' },
    currencies: { GBP: { name: 'British Pound', symbol: '£' } },
    timezones: ['UTC+00:00'],
    latlng: [54.0, -2.0],
    population: 67330000,
  },
  {
    code: 'US',
    code3: 'USA',
    name: 'United States',
    officialName: 'United States of America',
    nativeNames: { eng: { official: 'United States of America', common: 'United States' } },
    capital: 'Washington, D.C.',
    region: 'Americas',
    subregion: 'North America',
    flagEmoji: '🇺🇸',
    flagUrl: 'https://flagcdn.com/w320/us.png',
    languages: { eng: 'English' },
    currencies: { USD: { name: 'United States Dollar', symbol: '$' } },
    timezones: ['UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00'],
    latlng: [38.0, -97.0],
    population: 331900000,
  },
];

export class CountryProvider extends BaseProvider<CountrySearchInput, NormalizedCountry[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'rest_countries',
    name: 'REST Countries API v3.1',
    description: 'Open dataset of sovereign nations, official languages, currencies, flags, and capitals.',
    category: 'countries',
    attribution: 'REST Countries / Open Data Community',
    attributionUrl: 'https://restcountries.com',
    license: 'Mozilla Public License 2.0',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 30,
      windowMs: 60000,
    },
  };

  protected validateInput(_input: CountrySearchInput): void {
    // Queries can be empty (meaning retrieve all or top countries)
  }

  protected generateCacheKey(input: CountrySearchInput): string {
    return `${input.code || 'all'}:${input.query || 'none'}:${input.region || 'all'}:${input.languageCode || 'all'}`;
  }

  protected async fetchRaw(input: CountrySearchInput, signal: AbortSignal): Promise<unknown> {
    let url = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion,languages,currencies,timezones,flags,latlng,population';
    
    if (input.code) {
      url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(input.code)}?fields=name,cca2,cca3,capital,region,subregion,languages,currencies,timezones,flags,latlng,population`;
    } else if (input.query && input.query.trim().length >= 2) {
      url = `https://restcountries.com/v3.1/name/${encodeURIComponent(input.query)}?fields=name,cca2,cca3,capital,region,subregion,languages,currencies,timezones,flags,latlng,population`;
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new ProviderUnavailableError(this.metadata.id, response.status, `REST Countries API HTTP ${response.status}`);
    }

    return await response.json();
  }

  protected normalize(raw: unknown, input: CountrySearchInput): NormalizedCountry[] {
    const list: any[] = Array.isArray(raw) ? raw : [raw];
    const results: NormalizedCountry[] = [];

    for (const item of list) {
      if (!item || !item.cca2) continue;

      const code = item.cca2.toUpperCase();
      const code3 = item.cca3 || code;
      const name = item.name?.common || item.name?.official || code;
      const officialName = item.name?.official || name;
      const nativeNames = item.name?.nativeName || {};
      const capital = Array.isArray(item.capital) ? item.capital[0] : (item.capital || 'N/A');
      const region = item.region || 'Unknown';
      const subregion = item.subregion || '';
      const flagEmoji = item.flag || '🌐';
      const flagUrl = item.flags?.svg || item.flags?.png || '';
      const languages = item.languages || {};
      const currencies = item.currencies || {};
      const timezones = Array.isArray(item.timezones) ? item.timezones : [];
      const latlng: [number, number] = Array.isArray(item.latlng) && item.latlng.length >= 2 ? [item.latlng[0], item.latlng[1]] : [0, 0];
      const population = item.population || 0;

      // Filter by languageCode if requested
      if (input.languageCode) {
        const langCode = input.languageCode.toLowerCase();
        const speaksLang = Object.keys(languages).some(k => k.toLowerCase().includes(langCode) || languages[k].toLowerCase().includes(langCode));
        if (!speaksLang) continue;
      }

      results.push({
        code,
        code3,
        name,
        officialName,
        nativeNames,
        capital,
        region,
        subregion,
        flagEmoji,
        flagUrl,
        languages,
        currencies,
        timezones,
        latlng,
        population,
      });
    }

    return results.length > 0 ? results : this.getFallback(input);
  }

  protected getFallback(input: CountrySearchInput): NormalizedCountry[] {
    let list = [...FALLBACK_COUNTRIES];
    if (input.code) {
      list = list.filter(c => c.code.toLowerCase() === input.code?.toLowerCase() || c.code3.toLowerCase() === input.code?.toLowerCase());
    }
    if (input.query) {
      const q = input.query.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.officialName.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q));
    }
    if (input.region && input.region !== 'all') {
      list = list.filter(c => c.region.toLowerCase() === input.region?.toLowerCase());
    }
    return list;
  }
}
