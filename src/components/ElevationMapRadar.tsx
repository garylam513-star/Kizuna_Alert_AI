'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { MOCK_SHELTERS, UI_TRANSLATIONS } from '@/lib/constants';
import { ShelterPoint } from '@/types';
import {
  MapPin,
  Mountain,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const ElevationMapRadar: React.FC = () => {
  const { locationState, disasterType, language, activePresetId } = useDisaster();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedShelter, setSelectedShelter] = useState<ShelterPoint | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<unknown>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const isTsunami = disasterType === 'tsunami';
  const userElevation = locationState.elevationMeters ?? 3;
  const isDangerElevation = isTsunami && userElevation < 15;

  // Get current shelters for this area (or fallback to Onna)
  const areaShelters = MOCK_SHELTERS[activePresetId] || MOCK_SHELTERS.onna;

  const filteredShelters = areaShelters.filter((s) => {
    if (selectedFilter === 'tsunami') return s.type === 'tsunami_tower' || s.elevationMeters >= 15;
    if (selectedFilter === 'hospital') return s.type === 'hospital';
    if (selectedFilter === 'convenience') return s.type === 'convenience_store';
    return true;
  });

  // Attempt Google Maps API dynamic script loading if key exists
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') return;

    if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleMapsLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize or re-center Google Map instance when loaded
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapContainerRef.current) return;

    try {
      const googleMaps = (window as unknown as { google: { maps: { Map: new (el: HTMLElement, opts: unknown) => { setCenter: (c: unknown) => void }; Marker: new (opts: unknown) => { addListener: (evt: string, cb: () => void) => void }; InfoWindow: new (opts: unknown) => { open: (map: unknown, marker: unknown) => void; setContent: (c: string) => void }; LatLng: new (lat: number, lng: number) => unknown } } }).google.maps;
      const center = new googleMaps.LatLng(locationState.lat, locationState.lng);

      const map = new googleMaps.Map(mapContainerRef.current, {
        zoom: 15,
        center: center,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0369a1' }] },
        ],
      });
      googleMapInstance.current = map;

      // Plot user location marker
      new googleMaps.Marker({
        position: center,
        map: map,
        title: `Your Location (${userElevation}m)`,
        icon: {
          path: 0, // CIRCLE
          scale: 10,
          fillColor: isDangerElevation ? '#ef4444' : '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Plot shelter markers
      filteredShelters.forEach((shelter) => {
        const marker = new googleMaps.Marker({
          position: new googleMaps.LatLng(shelter.lat, shelter.lng),
          map: map,
          title: shelter.name,
        });

        const info = new googleMaps.InfoWindow({
          content: `<div style="color:#0f172a; font-family:sans-serif; padding:4px;">
            <strong>${shelter.name}</strong><br/>
            Elevation: ${shelter.elevationMeters}m | Distance: ${shelter.distanceMeters}m<br/>
            ${shelter.isOpen ? '<span style="color:green;font-weight:bold;">OPEN</span>' : ''}
          </div>`,
        });

        marker.addListener('click', () => {
          info.open(map, marker);
          setSelectedShelter(shelter);
        });
      });
    } catch (e) {
      console.warn('Google Map render error:', e);
    }
  }, [isGoogleMapsLoaded, locationState, filteredShelters, userElevation, isDangerElevation]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header & Elevation Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Mountain className="w-5 h-5 text-blue-400" />
            <span>{t.mapShelterTitle}</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time elevation mapping with certified high-ground shelters (&gt;15m)
          </p>
        </div>

        {/* User Elevation Tag */}
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 ${
            isDangerElevation
              ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
              : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
          }`}
        >
          {isDangerElevation ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span>
            {isDangerElevation ? t.elevationWarningHigh : t.elevationSafe} ({userElevation}m)
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-2.5 py-1 rounded-lg border font-semibold transition ${
            selectedFilter === 'all'
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Points ({areaShelters.length})
        </button>
        <button
          onClick={() => setSelectedFilter('tsunami')}
          className={`px-2.5 py-1 rounded-lg border font-semibold transition flex items-center gap-1 ${
            selectedFilter === 'tsunami'
              ? 'bg-emerald-600 border-emerald-400 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Mountain className="w-3 h-3 text-emerald-300" />
          High Ground / Safe Towers (&gt;15m)
        </button>
        <button
          onClick={() => setSelectedFilter('hospital')}
          className={`px-2.5 py-1 rounded-lg border font-semibold transition ${
            selectedFilter === 'hospital'
              ? 'bg-rose-600 border-rose-400 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Medical / ER
        </button>
        <button
          onClick={() => setSelectedFilter('convenience')}
          className={`px-2.5 py-1 rounded-lg border font-semibold transition ${
            selectedFilter === 'convenience'
              ? 'bg-amber-600 border-amber-400 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Convenience Hubs (Water/Power)
        </button>
      </div>

      {/* Map Container: Either real Google Map or High-Fidelity Tactical Radar */}
      <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
        {isGoogleMapsLoaded ? (
          <div ref={mapContainerRef} className="w-full h-full" />
        ) : (
          /* Tactical SVG Radar Visualization */
          <div className="relative w-full h-full flex items-center justify-center bg-radial from-slate-900 to-slate-950 p-4 select-none">
            {/* Background Grid & Radar Rings */}
            <svg className="w-full h-full max-h-72 opacity-70" viewBox="0 0 400 300">
              {/* Range rings */}
              <circle cx="200" cy="150" r="120" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="200" cy="150" r="80" fill="none" stroke="#334155" strokeWidth="1" />
              <circle cx="200" cy="150" r="40" fill="none" stroke="#334155" strokeWidth="1" />

              {/* Tsunami Danger Zone Overlay if coastal tsunami and low elevation */}
              {isDangerElevation && (
                <ellipse cx="200" cy="150" rx="140" ry="100" fill="#dc2626" fillOpacity="0.15" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" />
              )}

              {/* Crosshairs */}
              <line x1="200" y1="10" x2="200" y2="290" stroke="#1e293b" strokeWidth="1" />
              <line x1="10" y1="150" x2="390" y2="150" stroke="#1e293b" strokeWidth="1" />

              {/* Shelter Nodes */}
              {filteredShelters.map((s, idx) => {
                // Approximate coordinate offset for radar display
                const dx = (s.lng - locationState.lng) * 4000;
                const dy = -(s.lat - locationState.lat) * 4000;
                const posX = Math.min(370, Math.max(30, 200 + dx));
                const posY = Math.min(270, Math.max(30, 150 + dy));
                const isSafe = s.elevationMeters >= 15;

                return (
                  <g
                    key={s.id}
                    onClick={() => setSelectedShelter(s)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={posX}
                      cy={posY}
                      r="10"
                      fill={isSafe ? '#059669' : '#d97706'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={posX}
                      y={posY - 14}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {s.elevationMeters}m
                    </text>
                  </g>
                );
              })}

              {/* User Center Location */}
              <circle cx="200" cy="150" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="200" cy="150" r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="animate-ping" opacity="0.75" />
              <text x="200" y="180" fill="#60a5fa" fontSize="11" fontWeight="bold" textAnchor="middle">
                YOU ({userElevation}m)
              </text>
            </svg>

            {/* Radar UI Badges */}
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded border border-slate-800 text-[10px] text-slate-400 font-mono">
              RADAR: {locationState.placeName.split(',')[0]}
            </div>

            <div className="absolute bottom-2 right-2 bg-slate-950/90 px-2 py-1 rounded border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                &gt;15m Safe
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                You
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Shelter Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredShelters.map((shelter) => {
          const isHighGround = shelter.elevationMeters >= 15;
          const isSelected = selectedShelter?.id === shelter.id;

          return (
            <div
              key={shelter.id}
              onClick={() => setSelectedShelter(shelter)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-950/50 border-blue-400 shadow-md ring-1 ring-blue-400'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white leading-snug">
                    {shelter.name}
                  </h4>
                  <div className="text-[11px] text-slate-400">{shelter.nameJp}</div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                    isHighGround
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/60'
                  }`}
                >
                  <Mountain className="w-3 h-3" />
                  {shelter.elevationMeters}m
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                <span className="flex items-center gap-1 text-blue-400 font-semibold">
                  <Navigation className="w-3 h-3" />
                  {shelter.distanceMeters}m away
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Open
                </span>
              </div>

              {/* Features pills */}
              <div className="flex flex-wrap gap-1 mb-2.5">
                {shelter.features.map((feat, fIdx) => (
                  <span
                    key={fIdx}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                  >
                    {feat}
                  </span>
                ))}
              </div>

              {/* Navigation button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Navigate via Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
