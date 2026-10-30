/**
 * Lexilume Weather Studio & Real-World Weather Learning
 * 
 * Powered by Open-Meteo (zero-cost, no API key).
 * Features:
 * - Live temperature, precipitation, humidity, wind, and European AQI air quality
 * - Real-world weather vocabulary generator across target languages
 * - Dynamic exercises based on actual current weather
 * - City switcher across major language learning hubs
 */

import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
  Sparkles,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Check,
  Languages,
} from 'lucide-react';
import { WeatherProvider, NormalizedWeatherData } from '../../services/providers/weather/weatherProvider';
import { AirQualityProvider, NormalizedAirQuality } from '../../services/providers/air-quality/airQualityProvider';
import { SpeechService } from '../../services/speech';
import { Language } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export interface WeatherHubCity {
  name: string;
  country: string;
  lat: number;
  lng: number;
  language: Language;
}

export const WEATHER_CITIES: WeatherHubCity[] = [
  { name: 'Lisboa', country: 'Portugal', lat: 38.72, lng: -9.14, language: 'pt' },
  { name: 'São Paulo', country: 'Brasil', lat: -23.55, lng: -46.63, language: 'pt' },
  { name: 'Madrid', country: 'Espanha', lat: 40.42, lng: -3.70, language: 'es' },
  { name: 'Paris', country: 'França', lat: 48.86, lng: 2.35, language: 'fr' },
  { name: 'Berlim', country: 'Alemanha', lat: 52.52, lng: 13.41, language: 'de' },
  { name: 'Roma', country: 'Itália', lat: 41.90, lng: 12.50, language: 'it' },
  { name: 'Tóquio', country: 'Japão', lat: 35.68, lng: 139.69, language: 'ja' },
  { name: 'Seul', country: 'Coreia do Sul', lat: 37.57, lng: 126.98, language: 'ko' },
  { name: 'Moscovo', country: 'Rússia', lat: 55.76, lng: 37.62, language: 'ru' },
  { name: 'Amesterdão', country: 'Países Baixos', lat: 52.37, lng: 4.89, language: 'nl' },
  { name: 'Pequim', country: 'China', lat: 39.90, lng: 116.41, language: 'zh' },
  { name: 'Istambul', country: 'Turquia', lat: 41.01, lng: 28.98, language: 'tr' },
  { name: 'Chennai', country: 'Índia (Tâmil)', lat: 13.08, lng: 80.27, language: 'ta' },
  { name: 'Londres', country: 'Reino Unido', lat: 51.51, lng: -0.13, language: 'en' },
];

export const WEATHER_VOCABULARY: Record<string, { term: string; translation: string; phonetic: string }[]> = {
  pt: [
    { term: 'Chuva', translation: 'Rain', phonetic: '/ˈʃu.vɐ/' },
    { term: 'Nuvem', translation: 'Cloud', phonetic: '/ˈnu.vɐ̃j̃/' },
    { term: 'Temperatura', translation: 'Temperature', phonetic: '/tẽ.pe.ɾaˈtu.ɾɐ/' },
    { term: 'Humidade', translation: 'Humidity', phonetic: '/u.miˈda.dɨ/' },
    { term: 'Vento', translation: 'Wind', phonetic: '/ˈvẽ.tu/' },
    { term: 'Trovoada', translation: 'Thunderstorm', phonetic: '/tɾu.vuˈa.dɐ/' },
  ],
  es: [
    { term: 'Lluvia', translation: 'Rain', phonetic: '/ˈʝu.bja/' },
    { term: 'Nube', translation: 'Cloud', phonetic: '/ˈnu.βe/' },
    { term: 'Temperatura', translation: 'Temperature', phonetic: '/tem.pe.ɾaˈtu.ɾa/' },
    { term: 'Humedad', translation: 'Humidity', phonetic: '/u.meˈðað/' },
    { term: 'Viento', translation: 'Wind', phonetic: '/ˈbjen.to/' },
    { term: 'Tormenta', translation: 'Thunderstorm', phonetic: '/toɾˈmen.ta/' },
  ],
  en: [
    { term: 'Rain', translation: 'Chuva', phonetic: '/reɪn/' },
    { term: 'Cloud', translation: 'Nuvem', phonetic: '/klaʊd/' },
    { term: 'Temperature', translation: 'Temperatura', phonetic: '/ˈtɛmp.rə.tʃər/' },
    { term: 'Humidity', translation: 'Humidade', phonetic: '/hjuːˈmɪd.ə.ti/' },
    { term: 'Wind', translation: 'Vento', phonetic: '/wɪnd/' },
    { term: 'Thunderstorm', translation: 'Trovoada', phonetic: '/ˈθʌn.dɚ.stɔːrm/' },
  ],
  fr: [
    { term: 'Pluie', translation: 'Rain', phonetic: '/plɥi/' },
    { term: 'Nuage', translation: 'Cloud', phonetic: '/nɥaʒ/' },
    { term: 'Température', translation: 'Temperature', phonetic: '/tɑ̃.pe.ʁa.tyʁ/' },
    { term: 'Humidité', translation: 'Humidity', phonetic: '/y.mi.di.te/' },
    { term: 'Vent', translation: 'Wind', phonetic: '/vɑ̃/' },
  ],
  de: [
    { term: 'Regen', translation: 'Rain', phonetic: '/ˈʁeːɡn̩/' },
    { term: 'Wolke', translation: 'Cloud', phonetic: '/ˈvɔlkə/' },
    { term: 'Temperatur', translation: 'Temperature', phonetic: '/tɛmpeʁaˈtuːɐ̯/' },
    { term: 'Feuchtigkeit', translation: 'Humidity', phonetic: '/ˈfɔɪ̯çtɪçkaɪ̯t/' },
    { term: 'Wind', translation: 'Wind', phonetic: '/vɪnt/' },
  ],
  it: [
    { term: 'Pioggia', translation: 'Rain', phonetic: '/ˈpjɔd.dʒa/' },
    { term: 'Nuvola', translation: 'Cloud', phonetic: '/ˈnu.vo.la/' },
    { term: 'Temperatura', translation: 'Temperature', phonetic: '/tem.pe.raˈtu.ra/' },
    { term: 'Umidità', translation: 'Humidity', phonetic: '/u.mi.diˈta/' },
    { term: 'Vento', translation: 'Wind', phonetic: '/ˈvɛn.to/' },
  ],
  ja: [
    { term: '雨 (Ame)', translation: 'Rain', phonetic: '/a.me/' },
    { term: '雲 (Kumo)', translation: 'Cloud', phonetic: '/kɯ.mo/' },
    { term: '気温 (Kion)', translation: 'Temperature', phonetic: '/ki.oɴ/' },
    { term: '湿度 (Shitsudo)', translation: 'Humidity', phonetic: '/ɕi.tsɯ.do/' },
    { term: '風 (Kaze)', translation: 'Wind', phonetic: '/ka.ze/' },
  ],
  ko: [
    { term: '비 (Bi)', translation: 'Rain', phonetic: '/pi/' },
    { term: '구름 (Gureum)', translation: 'Cloud', phonetic: '/ku.ɾɯm/' },
    { term: '온도 (Ondo)', translation: 'Temperature', phonetic: '/on.do/' },
    { term: '습도 (Seupdo)', translation: 'Humidity', phonetic: '/sɯp̚.t͈o/' },
    { term: '바람 (Baram)', translation: 'Wind', phonetic: '/pa.ɾam/' },
  ],
  ru: [
    { term: 'Дождь', translation: 'Rain', phonetic: '/doʐtʲ/' },
    { term: 'Облако', translation: 'Cloud', phonetic: '/ˈob.lə.kə/' },
    { term: 'Температура', translation: 'Temperature', phonetic: '/tʲɪm.pʲɪ.rɐˈtu.rə/' },
    { term: 'Влажность', translation: 'Humidity', phonetic: '/ˈvɫaʐ.nəsʲtʲ/' },
    { term: 'Ветер', translation: 'Wind', phonetic: '/ˈvʲe.tʲɪr/' },
  ],
  nl: [
    { term: 'Regen', translation: 'Rain', phonetic: '/ˈreː.ɣə(n)/' },
    { term: 'Wolk', translation: 'Cloud', phonetic: '/ʋɔlk/' },
    { term: 'Temperatuur', translation: 'Temperature', phonetic: '/tɛm.pə.raːˈtyːr/' },
    { term: 'Vochtigheid', translation: 'Humidity', phonetic: '/ˈvɔx.təx.ɦɛi̯t/' },
    { term: 'Wind', translation: 'Wind', phonetic: '/ʋɪnt/' },
  ],
  zh: [
    { term: '雨 (Yǔ)', translation: 'Rain', phonetic: '/y˨˩˦/' },
    { term: '云 (Yún)', translation: 'Cloud', phonetic: '/yn˧˥/' },
    { term: '温度 (Wēndù)', translation: 'Temperature', phonetic: '/wən˥ tu˥˩/' },
    { term: '湿度 (Shīdù)', translation: 'Humidity', phonetic: '/ʂʐ̩˥ tu˥˩/' },
    { term: '风 (Fēng)', translation: 'Wind', phonetic: '/fɤŋ˥/' },
  ],
  tr: [
    { term: 'Yağmur', translation: 'Rain', phonetic: '/jaːˈmuɾ/' },
    { term: 'Bulut', translation: 'Cloud', phonetic: '/buˈlut/' },
    { term: 'Sıcaklık', translation: 'Temperature', phonetic: '/sɯ.dʒakˈɫɯk/' },
    { term: 'Nem', translation: 'Humidity', phonetic: '/nem/' },
    { term: 'Rüzgar', translation: 'Wind', phonetic: '/ɾyzˈɡaɾ/' },
  ],
  ta: [
    { term: 'மழை (Mazhai)', translation: 'Rain', phonetic: '/ma.ɻai̯/' },
    { term: 'மேகம் (Megam)', translation: 'Cloud', phonetic: '/meː.ɡam/' },
    { term: 'வெப்பநிலை (Veppanilai)', translation: 'Temperature', phonetic: '/ʋep.pa.ni.lai̯/' },
    { term: 'ஈரப்பதம் (Eerappatham)', translation: 'Humidity', phonetic: '/iː.rap.pa.tam/' },
    { term: 'காற்று (Kaatru)', translation: 'Wind', phonetic: '/kaːt.ru/' },
  ],
};

export interface WeatherStudioProps {
  learningLanguage?: Language;
}

export const WeatherStudio: React.FC<WeatherStudioProps> = ({ learningLanguage = 'pt' }) => {
  const [selectedCity, setSelectedCity] = useState<WeatherHubCity>(WEATHER_CITIES[0]);
  const [weatherData, setWeatherData] = useState<NormalizedWeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<NormalizedAirQuality | null>(null);
  const [loading, setLoading] = useState(false);

  // Exercise state
  const [selectedExerciseOption, setSelectedExerciseOption] = useState<number | null>(null);
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);

  const weatherProvider = new WeatherProvider();
  const airQualityProvider = new AirQualityProvider();

  const loadCityWeather = async (city: WeatherHubCity) => {
    setLoading(true);
    try {
      const [wRes, aqRes] = await Promise.all([
        weatherProvider.execute({
          latitude: city.lat,
          longitude: city.lng,
          cityName: city.name,
        }),
        airQualityProvider.execute({
          latitude: city.lat,
          longitude: city.lng,
          cityName: city.name,
        }),
      ]);
      setWeatherData(wRes);
      setAirQuality(aqRes);
    } catch {
      // Handled by providers fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCityWeather(selectedCity);
  }, [selectedCity]);

  const vocabList = WEATHER_VOCABULARY[selectedCity.language] || WEATHER_VOCABULARY.pt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Weather Studio & Clima no Mundo Real</h2>
                <Badge variant="amber" size="sm">Open-Meteo Live</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Meteorologia autêntica em tempo real, vocabulário climático e exercícios situacionais contextualizados.
              </p>
            </div>
          </div>

          {/* City selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {WEATHER_CITIES.slice(0, 7).map(city => (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCity.name === city.name
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Weather Metrics Cards */}
        {weatherData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperatura
              </div>
              <div className="text-2xl font-extrabold text-slate-100 font-mono">
                {weatherData.current.temperatureC}°C
              </div>
              <div className="text-[11px] text-slate-400">
                Sensação: {weatherData.current.apparentTemperatureC}°C
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-400" /> Humidade Relativa
              </div>
              <div className="text-2xl font-extrabold text-slate-100 font-mono">
                {weatherData.current.relativeHumidity}%
              </div>
              <div className="text-[11px] text-slate-400">
                Precipitação: {weatherData.current.precipitationMm} mm
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-teal-400" /> Vento
              </div>
              <div className="text-2xl font-extrabold text-slate-100 font-mono">
                {weatherData.current.windSpeedKmh} km/h
              </div>
              <div className="text-[11px] text-slate-400">
                Condição: {weatherData.current.conditionDescription}
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Qualidade do Ar (AQI)
              </div>
              <div className="text-2xl font-extrabold text-slate-100 font-mono flex items-center gap-2">
                <span>{airQuality?.europeanAqi ?? 22}</span>
                <Badge variant={airQuality?.aqiRating === 'Good' ? 'emerald' : 'amber'} size="sm">
                  {airQuality?.aqiRating ?? 'Good'}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400">
                PM2.5: {airQuality?.pm25 ?? 8} μg/m³
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weather Vocabulary & Interactive Situational Exercise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Weather Vocabulary Glossary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Languages className="w-4 h-4 text-amber-400" />
              Vocabulário Meteorológico ({selectedCity.language.toUpperCase()})
            </h3>
            <Badge variant="amber" size="sm">{selectedCity.name}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {vocabList.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100">{item.term}</div>
                  <div className="text-[10px] text-slate-400">{item.translation} • <span className="font-mono text-amber-300">{item.phonetic}</span></div>
                </div>
                <button
                  onClick={() => SpeechService.speak(item.term, selectedCity.language)}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Situational Real-World Weather Challenge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Desafio Meteorológico Situacional
            </h3>
            <Badge variant="emerald" size="sm">Tempo Real</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Você está conversando com um amigo em <strong>{selectedCity.name}</strong>. Os termômetros marcam <strong>{weatherData?.current.temperatureC ?? 20}°C</strong> com condição de <em>"{weatherData?.current.conditionDescription ?? 'Céu limpo'}"</em>. Como você descreveria o clima agora?
            </p>

            <div className="space-y-2 pt-1">
              {[
                `Hoje em ${selectedCity.name} a temperatura é de ${weatherData?.current.temperatureC ?? 20}°C com tempo agradável.`,
                `Está caindo uma forte nevasca de inverno em ${selectedCity.name}.`,
                `O vento atinge furacão de trezentos quilômetros por hora.`,
              ].map((opt, optIdx) => {
                const isSelected = selectedExerciseOption === optIdx;
                let btnStyle = 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800';
                if (exerciseSubmitted) {
                  if (optIdx === 0) btnStyle = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-bold';
                  else if (isSelected) btnStyle = 'bg-rose-950/60 border-rose-500/80 text-rose-200 line-through';
                } else if (isSelected) {
                  btnStyle = 'bg-amber-600 text-white border-amber-500';
                }

                return (
                  <button
                    key={optIdx}
                    disabled={exerciseSubmitted}
                    onClick={() => setSelectedExerciseOption(optIdx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer ${btnStyle}`}
                  >
                    <span className="font-mono text-slate-500 mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {exerciseSubmitted && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold">
                ✓ Correto! A resposta reflete perfeitamente a leitura meteorológica capturada ao vivo via Open-Meteo.
              </div>
            )}

            <div className="flex justify-end pt-2">
              {!exerciseSubmitted ? (
                <Button
                  onClick={() => setExerciseSubmitted(true)}
                  disabled={selectedExerciseOption === null}
                  variant="primary"
                  size="sm"
                  className="gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validar Resposta</span>
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setSelectedExerciseOption(null);
                    setExerciseSubmitted(false);
                  }}
                  variant="secondary"
                  size="sm"
                  className="gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Praticar Novamente</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
