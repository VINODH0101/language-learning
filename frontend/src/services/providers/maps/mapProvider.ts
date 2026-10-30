/**
 * OpenStreetMap & Leaflet Map Provider
 * 
 * Provides map configuration, tile URLs, open attribution, and destination pin coordinates.
 * Features:
 * - OpenStreetMap attribution policy compliance
 * - Destination coordinates for all 13 authorized language capitals
 * - Local phrases and greetings mapped to geographic pins
 */

export interface MapDestinationPin {
  id: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  languageCode: string;
  lat: number;
  lng: number;
  localGreeting: string;
  localTimezone: string;
}

export const MAP_DESTINATIONS: MapDestinationPin[] = [
  {
    id: 'pin-lisbon',
    cityName: 'Lisbon',
    countryName: 'Portugal',
    countryCode: 'PT',
    languageCode: 'pt',
    lat: 38.7223,
    lng: -9.1393,
    localGreeting: 'Olá! Bem-vindo a Lisboa!',
    localTimezone: 'Europe/Lisbon',
  },
  {
    id: 'pin-saopaulo',
    cityName: 'São Paulo',
    countryName: 'Brazil',
    countryCode: 'BR',
    languageCode: 'pt',
    lat: -23.5505,
    lng: -46.6333,
    localGreeting: 'Olá! Seja bem-vindo ao Brasil!',
    localTimezone: 'America/Sao_Paulo',
  },
  {
    id: 'pin-madrid',
    cityName: 'Madrid',
    countryName: 'Spain',
    countryCode: 'ES',
    languageCode: 'es',
    lat: 40.4168,
    lng: -3.7038,
    localGreeting: '¡Hola! ¡Bienvenido a Madrid!',
    localTimezone: 'Europe/Madrid',
  },
  {
    id: 'pin-paris',
    cityName: 'Paris',
    countryName: 'France',
    countryCode: 'FR',
    languageCode: 'fr',
    lat: 48.8566,
    lng: 2.3522,
    localGreeting: 'Bonjour et bienvenue à Paris !',
    localTimezone: 'Europe/Paris',
  },
  {
    id: 'pin-berlin',
    cityName: 'Berlin',
    countryName: 'Germany',
    countryCode: 'DE',
    languageCode: 'de',
    lat: 52.5200,
    lng: 13.4050,
    localGreeting: 'Guten Tag! Willkommen in Berlin!',
    localTimezone: 'Europe/Berlin',
  },
  {
    id: 'pin-rome',
    cityName: 'Rome',
    countryName: 'Italy',
    countryCode: 'IT',
    languageCode: 'it',
    lat: 41.9028,
    lng: 12.4964,
    localGreeting: 'Buongiorno! Benvenuto a Roma!',
    localTimezone: 'Europe/Rome',
  },
  {
    id: 'pin-tokyo',
    cityName: 'Tokyo',
    countryName: 'Japan',
    countryCode: 'JP',
    languageCode: 'ja',
    lat: 35.6762,
    lng: 139.6503,
    localGreeting: 'こんにちは！東京へようこそ！',
    localTimezone: 'Asia/Tokyo',
  },
  {
    id: 'pin-seoul',
    cityName: 'Seoul',
    countryName: 'South Korea',
    countryCode: 'KR',
    languageCode: 'ko',
    lat: 37.5665,
    lng: 126.9780,
    localGreeting: '안녕하세요! 서울에 오신 것을 환영합니다!',
    localTimezone: 'Asia/Seoul',
  },
  {
    id: 'pin-moscow',
    cityName: 'Moscow',
    countryName: 'Russia',
    countryCode: 'RU',
    languageCode: 'ru',
    lat: 55.7558,
    lng: 37.6173,
    localGreeting: 'Здравствуйте! Добро пожаловать в Москву!',
    localTimezone: 'Europe/Moscow',
  },
  {
    id: 'pin-amsterdam',
    cityName: 'Amsterdam',
    countryName: 'Netherlands',
    countryCode: 'NL',
    languageCode: 'nl',
    lat: 52.3676,
    lng: 4.9041,
    localGreeting: 'Hallo! Welkom in Amsterdam!',
    localTimezone: 'Europe/Amsterdam',
  },
  {
    id: 'pin-beijing',
    cityName: 'Beijing',
    countryName: 'China',
    countryCode: 'CN',
    languageCode: 'zh',
    lat: 39.9042,
    lng: 116.4074,
    localGreeting: '你好！欢迎来到北京！',
    localTimezone: 'Asia/Shanghai',
  },
  {
    id: 'pin-istanbul',
    cityName: 'Istanbul',
    countryName: 'Türkiye',
    countryCode: 'TR',
    languageCode: 'tr',
    lat: 41.0082,
    lng: 28.9784,
    localGreeting: 'Merhaba! İstanbul’a hoş geldiniz!',
    localTimezone: 'Europe/Istanbul',
  },
  {
    id: 'pin-chennai',
    cityName: 'Chennai',
    countryName: 'India',
    countryCode: 'IN',
    languageCode: 'ta',
    lat: 13.0827,
    lng: 80.2707,
    localGreeting: 'வணக்கம்! சென்னைக்கு வருக!',
    localTimezone: 'Asia/Kolkata',
  },
  {
    id: 'pin-london',
    cityName: 'London',
    countryName: 'United Kingdom',
    countryCode: 'GB',
    languageCode: 'en',
    lat: 51.5074,
    lng: -0.1278,
    localGreeting: 'Hello! Welcome to London!',
    localTimezone: 'Europe/London',
  },
];

export class MapProvider {
  public static readonly TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  public static readonly ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

  public static getDestinations(): MapDestinationPin[] {
    return MAP_DESTINATIONS;
  }

  public static getDestinationByCode(countryCode: string): MapDestinationPin | undefined {
    return MAP_DESTINATIONS.find(d => d.countryCode.toLowerCase() === countryCode.toLowerCase());
  }
}
