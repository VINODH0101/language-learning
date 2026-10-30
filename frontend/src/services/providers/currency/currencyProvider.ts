/**
 * Frankfurter Currency Exchange API Provider
 * Endpoint: https://api.frankfurter.app/
 * 
 * Free open-source currency rates tracked by the European Central Bank.
 * Features:
 * - Real-time reference exchange rates (EUR, USD, BRL, GBP, JPY, KRW, TRY, etc.)
 * - Currency conversion calculator
 * - Multilingual financial vocabulary integration
 * - Indicative rate disclaimer & offline fallback
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface CurrencyConversionInput {
  from: string; // e.g. "EUR", "USD"
  to: string; // e.g. "BRL", "JPY"
  amount?: number;
}

export interface NormalizedCurrencyConversion {
  amount: number;
  from: string;
  to: string;
  rate: number;
  convertedAmount: number;
  date: string;
  attribution: string;
}

export interface CurrencyMetadata {
  code: string;
  name: string;
  symbol: string;
  localeCountry: string;
}

export const COMMON_CURRENCIES: Record<string, CurrencyMetadata> = {
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', localeCountry: 'União Europeia' },
  BRL: { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', localeCountry: 'Brasil' },
  USD: { code: 'USD', name: 'Dólar Americano', symbol: '$', localeCountry: 'Estados Unidos' },
  GBP: { code: 'GBP', name: 'Libra Esterlina', symbol: '£', localeCountry: 'Reino Unido' },
  JPY: { code: 'JPY', name: 'Iene Japonês', symbol: '¥', localeCountry: 'Japão' },
  KRW: { code: 'KRW', name: 'Won Sul-Coreano', symbol: '₩', localeCountry: 'Coreia do Sul' },
  TRY: { code: 'TRY', name: 'Lira Turca', symbol: '₺', localeCountry: 'Turquia' },
  INR: { code: 'INR', name: 'Rúpia Indiana', symbol: '₹', localeCountry: 'Índia' },
  CNY: { code: 'CNY', name: 'Yuan Chinês', symbol: '¥', localeCountry: 'China' },
};

export class CurrencyProvider extends BaseProvider<CurrencyConversionInput, NormalizedCurrencyConversion> {
  public readonly metadata: ProviderMetadata = {
    id: 'frankfurter_currency',
    name: 'Frankfurter Currency API',
    description: 'Free open exchange rates and currency conversion engine published by the European Central Bank.',
    category: 'currency',
    attribution: 'Frankfurter / European Central Bank Reference Data',
    attributionUrl: 'https://www.frankfurter.app',
    license: 'Open Data / MIT License',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 50,
      windowMs: 60000,
    },
  };

  protected validateInput(input: CurrencyConversionInput): void {
    if (!input.from || !input.to) {
      throw new ValidationError(this.metadata.id, 'Moedas de origem e destino são obrigatórias.');
    }
  }

  protected generateCacheKey(input: CurrencyConversionInput): string {
    const from = input.from.toUpperCase();
    const to = input.to.toUpperCase();
    const amt = input.amount || 1;
    return `currency:${from}:${to}:${amt}`;
  }

  protected override get defaultTimeoutMs(): number {
    return 6000;
  }

  protected async fetchRaw(input: CurrencyConversionInput, signal: AbortSignal): Promise<unknown> {
    const from = input.from.toUpperCase();
    const to = input.to.toUpperCase();
    const amount = input.amount || 1;

    if (from === to) {
      return {
        amount,
        base: from,
        date: new Date().toISOString().split('T')[0],
        rates: { [to]: 1.0 },
      };
    }

    const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new ProviderUnavailableError(this.metadata.id, response.status, `Frankfurter API HTTP ${response.status}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: CurrencyConversionInput): NormalizedCurrencyConversion {
    const from = input.from.toUpperCase();
    const to = input.to.toUpperCase();
    const amount = input.amount || 1;
    const rates = raw?.rates || {};
    const rate = rates[to] || (from === to ? 1.0 : this.getFallbackRate(from, to));
    const convertedAmount = Math.round(amount * rate * 100) / 100;

    return {
      amount,
      from,
      to,
      rate,
      convertedAmount,
      date: raw?.date || new Date().toISOString().split('T')[0],
      attribution: this.metadata.attribution,
    };
  }

  protected getFallback(input: CurrencyConversionInput): NormalizedCurrencyConversion {
    const from = input.from.toUpperCase();
    const to = input.to.toUpperCase();
    const amount = input.amount || 1;
    const rate = this.getFallbackRate(from, to);

    return {
      amount,
      from,
      to,
      rate,
      convertedAmount: Math.round(amount * rate * 100) / 100,
      date: new Date().toISOString().split('T')[0],
      attribution: `${this.metadata.attribution} (Fallback Estático)`,
    };
  }

  private getFallbackRate(from: string, to: string): number {
    if (from === to) return 1.0;
    // Approximated reference base to EUR
    const eurRates: Record<string, number> = {
      EUR: 1.0,
      USD: 1.08,
      BRL: 5.85,
      GBP: 0.86,
      JPY: 165.0,
      KRW: 1470.0,
      TRY: 37.0,
      INR: 90.0,
      CNY: 7.8,
    };

    const fromInEur = eurRates[from] || 1.0;
    const toInEur = eurRates[to] || 1.0;
    return Math.round((toInEur / fromInEur) * 10000) / 10000;
  }
}
