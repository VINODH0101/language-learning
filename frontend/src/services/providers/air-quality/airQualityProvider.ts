/**
 * Open-Meteo Air Quality API Provider
 * Endpoint: https://air-quality-api.open-meteo.com/v1/air-quality
 * 
 * Open air quality metrics without API keys.
 * Features:
 * - European Air Quality Index (AQI 1-5 scale)
 * - PM2.5, PM10, Ozone, NO2, CO concentration
 * - Pedagogical air quality status descriptors
 * - Caching (30 min TTL) & fallback
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface AirQualityInput {
  latitude: number;
  longitude: number;
  cityName?: string;
}

export interface NormalizedAirQuality {
  cityName: string;
  europeanAqi: number; // 0-20: Good, 20-40: Fair, 40-60: Moderate, 60-80: Poor, 80+: Very Poor
  aqiRating: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor';
  pm25: number; // μg/m³
  pm10: number; // μg/m³
  nitrogenDioxide: number; // μg/m³
  ozone: number; // μg/m³
  timestamp: string;
}

export class AirQualityProvider extends BaseProvider<AirQualityInput, NormalizedAirQuality> {
  public readonly metadata: ProviderMetadata = {
    id: 'open_meteo_air_quality',
    name: 'Open-Meteo Air Quality API',
    description: 'Free open atmospheric composition and air quality index provider.',
    category: 'air-quality',
    attribution: 'Open-Meteo / Copernicus Atmosphere Monitoring Service',
    attributionUrl: 'https://open-meteo.com/en/docs/air-quality-api',
    license: 'Open Database License (ODbL)',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: AirQualityInput): void {
    if (typeof input.latitude !== 'number' || typeof input.longitude !== 'number') {
      throw new ValidationError(this.metadata.id, 'Coordenadas geográficas válidas são obrigatórias.');
    }
  }

  protected generateCacheKey(input: AirQualityInput): string {
    const lat = input.latitude.toFixed(2);
    const lon = input.longitude.toFixed(2);
    return `aqi:${lat}:${lon}`;
  }

  protected override get defaultTimeoutMs(): number {
    return 6000;
  }

  protected async fetchRaw(input: AirQualityInput, signal: AbortSignal): Promise<unknown> {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${input.latitude}&longitude=${input.longitude}&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new ProviderUnavailableError(this.metadata.id, response.status, `Air Quality API HTTP ${response.status}`);
    }
    return await response.json();
  }

  protected normalize(raw: any, input: AirQualityInput): NormalizedAirQuality {
    const current = raw?.current || {};
    const aqi = Math.round(current.european_aqi ?? 20);

    let aqiRating: NormalizedAirQuality['aqiRating'] = 'Good';
    if (aqi > 80) aqiRating = 'Very Poor';
    else if (aqi > 60) aqiRating = 'Poor';
    else if (aqi > 40) aqiRating = 'Moderate';
    else if (aqi > 20) aqiRating = 'Fair';

    return {
      cityName: input.cityName || 'Local',
      europeanAqi: aqi,
      aqiRating,
      pm25: Math.round(current.pm2_5 ?? 8),
      pm10: Math.round(current.pm10 ?? 14),
      nitrogenDioxide: Math.round(current.nitrogen_dioxide ?? 15),
      ozone: Math.round(current.ozone ?? 45),
      timestamp: current.time || new Date().toISOString(),
    };
  }

  protected getFallback(input: AirQualityInput): NormalizedAirQuality {
    return {
      cityName: input.cityName || 'Lisboa',
      europeanAqi: 22,
      aqiRating: 'Good',
      pm25: 7,
      pm10: 12,
      nitrogenDioxide: 14,
      ozone: 40,
      timestamp: new Date().toISOString(),
    };
  }
}
