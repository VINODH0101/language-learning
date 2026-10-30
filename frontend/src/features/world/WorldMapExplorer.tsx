/**
 * Lexilume World Map Explorer Component
 * 
 * Powered by OpenStreetMap and Leaflet.
 * Features:
 * - Interactive map pins for 13 authorized language capitals
 * - Local greeting popovers and native language voice synthesis
 * - Strict compliance with OpenStreetMap attribution guidelines
 * - Robust fallback rendering for headless / testing environments
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Volume2,
  Globe2,
  Compass,
  Languages,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MapProvider, MapDestinationPin, MAP_DESTINATIONS } from '../../services/providers/maps/mapProvider';
import { SpeechService } from '../../services/speech';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const WorldMapExplorer: React.FC = () => {
  const [selectedPin, setSelectedPin] = useState<MapDestinationPin>(MAP_DESTINATIONS[0]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    // Dynamically initialize Leaflet map in browser environment
    const initLeafletMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      try {
        const L = await import('leaflet');
        // Leaflet CSS check / injection if not present
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        if (isCancelled || !mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current).setView([selectedPin.lat, selectedPin.lng], 3);
        mapInstanceRef.current = map;

        L.tileLayer(MapProvider.TILE_URL, {
          maxZoom: 18,
          attribution: MapProvider.ATTRIBUTION,
        }).addTo(map);

        // Add pins for destinations
        MAP_DESTINATIONS.forEach(dest => {
          const marker = L.circleMarker([dest.lat, dest.lng], {
            radius: 8,
            fillColor: dest.id === selectedPin.id ? '#38bdf8' : '#6366f1',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(map);

          marker.bindTooltip(`<strong>${dest.cityName}</strong> (${dest.countryName})`, {
            direction: 'top',
          });

          marker.on('click', () => {
            setSelectedPin(dest);
          });
        });
      } catch (err) {
        // Fallback gracefully in environments where leaflet canvas cannot mount
        console.warn('Leaflet client initialization fallback:', err);
      }
    };

    initLeafletMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleSelectPin = (dest: MapDestinationPin) => {
    setSelectedPin(dest);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([dest.lat, dest.lng], 5, { animate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Explore the World — Mapa Global Interativo</h2>
                <Badge variant="sky" size="sm">OpenStreetMap & Leaflet</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Navegue pelas capitais dos 13 idiomas da plataforma, ouça saudações locais autênticas e explore contextos culturais.
              </p>
            </div>
          </div>
        </div>

        {/* Destination Quick Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {MAP_DESTINATIONS.map(d => (
            <button
              key={d.id}
              onClick={() => handleSelectPin(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedPin.id === d.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.cityName} ({d.countryCode})
            </button>
          ))}
        </div>
      </div>

      {/* Map Viewport & Selected Pin Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[360px] relative shadow-inner">
          <div ref={mapContainerRef} className="w-full h-[360px] z-10" />

          {/* Fallback visual pin indicator */}
          <div className="absolute bottom-2 left-2 z-20 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Foco: <strong>{selectedPin.cityName}</strong> ({selectedPin.countryName})</span>
          </div>
        </div>

        {/* Selected Destination Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="sky">{selectedPin.countryCode}</Badge>
              <Badge variant="indigo">{selectedPin.languageCode.toUpperCase()}</Badge>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-100">{selectedPin.cityName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedPin.countryName}</p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                <span>Saudação Local em {selectedPin.cityName}</span>
                <button
                  onClick={() => SpeechService.speak(selectedPin.localGreeting, selectedPin.languageCode)}
                  title="Ouvir pronúncia"
                  className="text-slate-400 hover:text-sky-300 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-sm font-bold text-sky-200">
                "{selectedPin.localGreeting}"
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Fuso Horário IANA:</span>
                <span className="font-mono text-slate-200">{selectedPin.localTimezone}</span>
              </div>
              <div className="flex justify-between">
                <span>Coordenadas:</span>
                <span className="font-mono text-slate-200">{selectedPin.lat.toFixed(2)}°, {selectedPin.lng.toFixed(2)}°</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3">
            Map data &copy; OpenStreetMap contributors. Renderizado com Leaflet client-side.
          </div>
        </div>
      </div>
    </div>
  );
};
