/**
 * Nager.Date Public Holidays API Provider
 * Endpoint: https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}
 * 
 * Free worldwide public holidays provider for cultural learning.
 * Features:
 * - Local holiday names, holiday dates, types
 * - Cultural celebration explanations
 * - 7-day caching policy
 * - Fallback holiday schedules for major target countries
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface HolidayInput {
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "PT", "ES", "BR", "FR"
  year?: number;
}

export interface NormalizedHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
  explanation?: string;
  isAiGeneratedExplanation?: boolean;
}

export const FALLBACK_HOLIDAYS: Record<string, NormalizedHoliday[]> = {
  PT: [
    {
      date: '2026-04-25',
      localName: 'Dia da Liberdade (Revolução dos Cravos)',
      name: 'Freedom Day',
      countryCode: 'PT',
      fixed: true,
      global: true,
      types: ['Public'],
      explanation: 'Celebra a Revolução de 25 de Abril de 1974, que restaurou a democracia em Portugal simbolizada pela distribuição de cravos vermelhos.',
    },
    {
      date: '2026-06-10',
      localName: 'Dia de Portugal, de Camões e das Comunidades Portuguesas',
      name: 'Portugal Day',
      countryCode: 'PT',
      fixed: true,
      global: true,
      types: ['Public'],
      explanation: 'Feriado nacional comemorado no dia do falecimento do poeta Luís de Camões em 1580, homenageando a língua e a cultura lusófona.',
    },
    {
      date: '2026-10-05',
      localName: 'Implantação da República',
      name: 'Republic Day',
      countryCode: 'PT',
      fixed: true,
      global: true,
      types: ['Public'],
      explanation: 'Comemora a proclamação da Primeira República Portuguesa em 1910.',
    },
  ],
  ES: [
    {
      date: '2026-10-12',
      localName: 'Fiesta Nacional de España',
      name: 'National Day of Spain',
      countryCode: 'ES',
      fixed: true,
      global: true,
      types: ['Public'],
      explanation: 'Día de la Hispanidad, que conmemora los lazos históricos y culturales entre los pueblos de habla hispana.',
    },
    {
      date: '2026-12-06',
      localName: 'Día de la Constitución Española',
      name: 'Constitution Day',
      countryCode: 'ES',
      fixed: true,
      global: true,
      types: ['Public'],
      explanation: 'Celebra la aprobación de la Constitución democrática española de 1978.',
    },
  ],
  BR: [
    {
      date: '2026-09-07',
      localName: 'Dia da Independência do Brasil',
      name: 'Independence Day',
      countryCode: 'BR',
      fixed: true,
      global: true,
      types: ['Public'],
      explanation: 'Comemora o Grito do Ipiranga e a proclamação da independência do Brasil em 1822.',
    },
    {
      date: '2026-11-15',
      localName: 'Proclamação da República',
      name: 'Republic Proclamation Day',
      countryCode: 'BR',
      fixed: true,
      global: true,
      types: ['Public'],
      explanation: 'Marco histórico de 1889 que encerrou o período imperial e instaurou o regime republicano federativo no Brasil.',
    },
  ],
};

export class HolidayProvider extends BaseProvider<HolidayInput, NormalizedHoliday[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'nager_date_holidays',
    name: 'Nager.Date Public Holidays API',
    description: 'Free open API for worldwide statutory and cultural holidays.',
    category: 'holidays',
    attribution: 'Nager.Date / Open Source Holiday Engine',
    attributionUrl: 'https://date.nager.at',
    license: 'MIT License',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: HolidayInput): void {
    if (!input.countryCode || input.countryCode.length !== 2) {
      throw new ValidationError(this.metadata.id, 'Código de país de 2 letras ISO 3166-1 obrigatório (ex: PT, ES, BR).');
    }
  }

  protected generateCacheKey(input: HolidayInput): string {
    const yr = input.year || new Date().getFullYear();
    return `holidays:${input.countryCode.toUpperCase()}:${yr}`;
  }

  protected override get defaultTimeoutMs(): number {
    return 6000;
  }

  protected async fetchRaw(input: HolidayInput, signal: AbortSignal): Promise<unknown> {
    const yr = input.year || new Date().getFullYear();
    const code = input.countryCode.toUpperCase();
    const url = `https://date.nager.at/api/v3/PublicHolidays/${yr}/${code}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new ProviderUnavailableError(this.metadata.id, response.status, `Nager.Date API HTTP ${response.status}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: HolidayInput): NormalizedHoliday[] {
    if (!Array.isArray(raw)) {
      return this.getFallback(input);
    }

    const holidays: NormalizedHoliday[] = raw.map((item: any) => ({
      date: item.date,
      localName: item.localName || item.name,
      name: item.name,
      countryCode: item.countryCode,
      fixed: Boolean(item.fixed),
      global: Boolean(item.global),
      types: Array.isArray(item.types) ? item.types : ['Public'],
      explanation: undefined, // Enriched on demand
    }));

    return holidays.length > 0 ? holidays : this.getFallback(input);
  }

  protected getFallback(input: HolidayInput): NormalizedHoliday[] {
    const code = input.countryCode.toUpperCase();
    return FALLBACK_HOLIDAYS[code] || FALLBACK_HOLIDAYS.PT;
  }
}
