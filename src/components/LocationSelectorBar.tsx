'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { LOCATION_PRESETS, UI_TRANSLATIONS } from '@/lib/constants';
import { MapPin, Navigation, Mountain, Search, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

export const LocationSelectorBar: React.FC = () => {
  const {
    locationState,
    setLocationState,
    activePresetId,
    applyPreset,
    language,
    disasterType,
    queryElevationForCoords,
  } = useDisaster();

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const isCoastalTsunami = disasterType === 'tsunami';
  const isLowElevation = (locationState.elevationMeters ?? 0) < 15;

  // Manual search suggestions for Japan landmarks
  const JAPAN_SUGGESTIONS = [
    { name: 'Onna Village Coast, Okinawa', lat: 26.4950, lng: 127.8540, elev: 3.2, coastal: true },
    { name: 'Naha Airport, Okinawa', lat: 26.2048, lng: 127.6458, elev: 4.1, coastal: true },
    { name: 'Shibuya Crossing, Tokyo', lat: 35.6595, lng: 139.7005, elev: 22.0, coastal: false },
    { name: 'Tokyo Station (Marunouchi)', lat: 35.6812, lng: 139.7671, elev: 3.5, coastal: false },
    { name: 'Umeda Station, Osaka', lat: 34.7024, lng: 135.4959, elev: 1.8, coastal: false },
    { name: 'Kansai International Airport (KIX)', lat: 34.4320, lng: 135.2304, elev: 5.0, coastal: true },
    { name: 'Hakata Station, Fukuoka', lat: 33.5900, lng: 130.4206, elev: 6.2, coastal: false },
    { name: 'Sendai Coast, Miyagi', lat: 38.2682, lng: 140.8694, elev: 2.9, coastal: true },
  ];

  // Initialize Google Places Autocomplete if Google Maps JS API script is available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as unknown as { google?: { maps?: { places?: unknown } } }).google?.maps?.places && autocompleteInputRef.current) {
      try {
        const googleObj = (window as unknown as { google: { maps: { places: { Autocomplete: new (input: HTMLInputElement, opts: unknown) => { addListener: (evt: string, cb: () => void) => void; getPlace: () => { formatted_address?: string; name?: string; geometry?: { location: { lat: () => number; lng: () => number } } } } } } } }).google;
        const autocomplete = new googleObj.maps.places.Autocomplete(autocompleteInputRef.current, {
          componentRestrictions: { country: 'jp' },
          fields: ['geometry', 'name', 'formatted_address'],
        });

        autocomplete.addListener('place_changed', async () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const placeName = place.name || place.formatted_address || 'Selected Location, Japan';

            const elevationMeters = await queryElevationForCoords(lat, lng);
            setLocationState({
              lat,
              lng,
              placeName,
              elevationMeters,
              isCoastal: elevationMeters < 15,
            });
            setSearchInput(placeName);
          }
        });
      } catch (err) {
        console.warn('Google Places Autocomplete init skipped:', err);
      }
    }
  }, [queryElevationForCoords, setLocationState]);

  // Live GPS geolocation handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let placeName = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        // Reverse geocoding attempt
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
            const data = await res.json();
            if (data.results && data.results[0]) {
              placeName = data.results[0].formatted_address;
            }
          } else {
            // Friendly reverse geocode lookup
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await res.json();
            if (data && data.display_name) {
              placeName = data.display_name.split(',').slice(0, 3).join(', ');
            }
          }
        } catch {
          // Keep coordinate string
        }

        const elevationMeters = await queryElevationForCoords(lat, lng);
        setLocationState({
          lat,
          lng,
          placeName,
          elevationMeters,
          isCoastal: elevationMeters < 15,
        });
        setSearchInput(placeName);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not access live GPS. Please enable location permissions or select a demo preset.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectSuggestion = async (item: typeof JAPAN_SUGGESTIONS[0]) => {
    setShowSuggestions(false);
    setSearchInput(item.name);
    const elev = await queryElevationForCoords(item.lat, item.lng);
    setLocationState({
      lat: item.lat,
      lng: item.lng,
      placeName: item.name,
      elevationMeters: elev,
      isCoastal: item.coastal,
    });
  };

  return (
    <div className="bg-slate-950/70 border-b border-slate-800 px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Top Row: Autocomplete Search + Live GPS + Elevation Badge */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Places Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              ref={autocompleteInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-red-500 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
            />

            {/* Fallback Autocomplete Suggestion Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                <div className="p-1.5 text-[10px] font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800 flex justify-between">
                  <span>JAPAN LOCATIONS & LANDMARKS</span>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>
                {JAPAN_SUGGESTIONS.filter((s) =>
                  !searchInput || s.name.toLowerCase().includes(searchInput.toLowerCase())
                ).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 text-slate-200 border-b border-slate-800/40 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      Elev: {item.elev}m
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live GPS Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 transition shrink-0"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{isLocating ? t.searching : t.useMyLocation}</span>
          </button>

          {/* Dynamic Elevation Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition shrink-0 ${
              isCoastalTsunami && isLowElevation
                ? 'bg-red-950/90 border-red-500 text-red-200 shadow-lg shadow-red-950/50 animate-pulse'
                : !isLowElevation
                ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <Mountain className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold leading-none">
                Elevation API
              </span>
              <span className="text-xs sm:text-sm font-black">
                {locationState.elevationMeters != null
                  ? `${locationState.elevationMeters.toFixed(1)} m`
                  : 'Calculating...'}
              </span>
            </div>
            {isCoastalTsunami && isLowElevation ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
            ) : !isLowElevation ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : null}
          </div>
        </div>

        {/* Bottom Row: One-Tap Demo Location Presets for Hackathon Judges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Demo Presets:
          </span>
          {LOCATION_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  isSelected
                    ? 'bg-red-950 border-red-500 text-red-200 ring-1 ring-red-400'
                    : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-red-400' : 'text-slate-400'}`} />
                <span>{preset.name}</span>
                <span className="text-[10px] px-1 py-0.2 bg-slate-950 rounded text-slate-400">
                  {preset.location.elevationMeters}m
                </span>
              </button>
            );
          })}

          {/* Current Location Display Tag */}
          <div className="hidden lg:flex items-center gap-1 ml-auto text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Active Site:</span>
            <span className="text-white truncate max-w-[280px]">{locationState.placeName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
