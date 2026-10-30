/**
 * Open-Meteo Weather API Provider
 * Endpoint: https://api.open-meteo.com/v1/forecast
 * 
 * Open weather forecast without API keys or subscriptions.
 * Features:
 * - Current conditions, temperature, humidity, wind, weather code, precipitation
 * - Daily forecast (min/max temps, rain probability)
 * - WMO Weather interpretation code translation
 * - Caching (15 min TTL) & deterministic fallback
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface WeatherInput {
  latitude: number;
  longitude: number;
  cityName?: string;
  timezone?: string;
}

export interface NormalizedCurrentWeather {
  cityName: string;
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  precipitationMm: number;
  weatherCode: number;
  conditionDescription: string;
  isDay: boolean;
  timestamp: string;
}

export interface NormalizedDailyForecast {
  date: string;
  weatherCode: number;
  conditionDescription: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbability: number;
}

export interface NormalizedWeatherData {
  cityName: string;
  latitude: number;
  longitude: number;
  current: NormalizedCurrentWeather;
  daily: NormalizedDailyForecast[];
}

export const WMO_WEATHER_CODES: Record<number, { en: string; pt: string; es: string; icon: string }> = {
  0: { en: 'Clear sky', pt: 'Céu limpo', es: 'Cielo despejado', icon: '☀️' },
  1: { en: 'Mainly clear', pt: 'Predominantemente limpo', es: 'Mayormente despejado', icon: '🌤️' },
  2: { en: 'Partly cloudy', pt: 'Parcialmente nublado', es: 'Parcialmente nublado', icon: '⛅' },
  3: { en: 'Overcast', pt: 'Encoberto', es: 'Nublado', icon: '☁️' },
  45: { en: 'Fog', pt: 'Nevoeiro', es: 'Niebla', icon: '🌫️' },
  48: { en: 'Depositing rime fog', pt: 'Nevoeiro com geada', es: 'Niebla con escarcha', icon: '🌫️' },
  51: { en: 'Light drizzle', pt: 'Chuvisco ligeiro', es: 'Llovizna ligera', icon: '🌦️' },
  53: { en: 'Moderate drizzle', pt: 'Chuvisco moderado', es: 'Llovizna moderada', icon: '🌦️' },
  55: { en: 'Dense drizzle', pt: 'Chuvisco denso', es: 'Llovizna densa', icon: '🌧️' },
  61: { en: 'Slight rain', pt: 'Chuva fraca', es: 'Lluvia ligera', icon: '🌧️' },
  63: { en: 'Moderate rain', pt: 'Chuva moderada', es: 'Lluvia moderada', icon: '🌧️' },
  65: { en: 'Heavy rain', pt: 'Chuva forte', es: 'Lluvia fuerte', icon: '⛈️' },
  71: { en: 'Slight snow', pt: 'Neve fraca', es: 'Nieve ligera', icon: '🌨️' },
  73: { en: 'Moderate snow', pt: 'Neve moderada', es: 'Nieve moderada', icon: '🌨️' },
  75: { en: 'Heavy snow', pt: 'Neve forte', es: 'Nieve intensa', icon: '❄️' },
  80: { en: 'Rain showers', pt: 'Aguaceiros', es: 'Chubascos', icon: '🌦️' },
  95: { en: 'Thunderstorm', pt: 'Trovoada', es: 'Tormenta', icon: '⚡' },
};

export class WeatherProvider extends BaseProvider<WeatherInput, NormalizedWeatherData> {
  public readonly metadata: ProviderMetadata = {
    id: 'open_meteo_weather',
    name: 'Open-Meteo Weather API',
    description: 'Free open-source weather forecast API for temperature, wind, humidity, and atmospheric conditions.',
    category: 'weather',
    attribution: 'Open-Meteo / Weather data by National Weather Services',
    attributionUrl: 'https://open-meteo.com',
    license: 'Open Database License (ODbL) / Non-commercial free tier',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 10000,
      windowMs: 86400000,
    },
  };

  protected validateInput(input: WeatherInput): void {
    if (typeof input.latitude !== 'number' || typeof input.longitude !== 'number') {
      throw new ValidationError(this.metadata.id, 'Latitude e longitude válidas são obrigatórias.');
    }
  }

  protected generateCacheKey(input: WeatherInput): string {
    const lat = input.latitude.toFixed(2);
    const lon = input.longitude.toFixed(2);
    return `weather:${lat}:${lon}`;
  }

  protected override get defaultTimeoutMs(): number {
    return 6000;
  }

  protected async fetchRaw(input: WeatherInput, signal: AbortSignal): Promise<unknown> {
    const tz = input.timezone || 'auto';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(tz)}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new ProviderUnavailableError(this.metadata.id, response.status, `Open-Meteo HTTP ${response.status}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: WeatherInput): NormalizedWeatherData {
    const current = raw?.current || {};
    const daily = raw?.daily || {};
    const code = current.weather_code ?? 0;
    const cond = WMO_WEATHER_CODES[code] || WMO_WEATHER_CODES[0];

    const currentNorm: NormalizedCurrentWeather = {
      cityName: input.cityName || 'Local',
      temperatureC: Math.round(current.temperature_2m ?? 20),
      apparentTemperatureC: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 20),
      relativeHumidity: Math.round(current.relative_humidity_2m ?? 50),
      windSpeedKmh: Math.round(current.wind_speed_10m ?? 12),
      precipitationMm: current.precipitation ?? 0,
      weatherCode: code,
      conditionDescription: cond.pt,
      isDay: current.is_day === 1,
      timestamp: current.time || new Date().toISOString(),
    };

    const dailyNorm: NormalizedDailyForecast[] = [];
    const times: string[] = daily.time || [];
    const maxTemps: number[] = daily.temperature_2m_max || [];
    const minTemps: number[] = daily.temperature_2m_min || [];
    const precipProbs: number[] = daily.precipitation_probability_max || [];
    const dailyCodes: number[] = daily.weather_code || [];

    for (let i = 0; i < Math.min(times.length, 5); i++) {
      const dCode = dailyCodes[i] ?? 0;
      dailyNorm.push({
        date: times[i],
        weatherCode: dCode,
        conditionDescription: (WMO_WEATHER_CODES[dCode] || WMO_WEATHER_CODES[0]).pt,
        tempMaxC: Math.round(maxTemps[i] ?? 22),
        tempMinC: Math.round(minTemps[i] ?? 14),
        precipitationProbability: Math.round(precipProbs[i] ?? 10),
      });
    }

    return {
      cityName: input.cityName || 'Localidade',
      latitude: input.latitude,
      longitude: input.longitude,
      current: currentNorm,
      daily: dailyNorm,
    };
  }

  protected getFallback(input: WeatherInput): NormalizedWeatherData {
    return {
      cityName: input.cityName || 'Lisboa',
      latitude: input.latitude,
      longitude: input.longitude,
      current: {
        cityName: input.cityName || 'Lisboa',
        temperatureC: 21,
        apparentTemperatureC: 21,
        relativeHumidity: 60,
        windSpeedKmh: 14,
        precipitationMm: 0,
        weatherCode: 0,
        conditionDescription: 'Céu limpo e ensolarado',
        isDay: true,
        timestamp: new Date().toISOString(),
      },
      daily: [
        {
          date: new Date().toISOString().split('T')[0],
          weatherCode: 0,
          conditionDescription: 'Céu limpo',
          tempMaxC: 23,
          tempMinC: 15,
          precipitationProbability: 0,
        },
      ],
    };
  }
}
