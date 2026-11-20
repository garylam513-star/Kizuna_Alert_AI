'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, Persona, DisasterType, LocationState, AIBriefing } from '@/types';
import { LOCATION_PRESETS } from '@/lib/constants';
import { audioEngine } from '@/lib/audio';

interface DisasterContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  persona: Persona;
  setPersona: (persona: Persona) => void;
  disasterType: DisasterType;
  setDisasterType: (type: DisasterType) => void;
  locationState: LocationState;
  setLocationState: React.Dispatch<React.SetStateAction<LocationState>>;
  briefing: AIBriefing | null;
  isLoadingBriefing: boolean;
  refreshBriefing: () => Promise<void>;
  isOnline: boolean;
  isSirenOn: boolean;
  toggleSiren: () => void;
  volunteerMode: boolean;
  setVolunteerMode: (enabled: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  activePresetId: string;
  applyPreset: (presetId: string) => void;
  queryElevationForCoords: (lat: number, lng: number) => Promise<number>;
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export function DisasterProvider({ children }: { children: React.ReactNode }) {
  // Default scenario: Onna Coast, Okinawa (Coastal Tsunami / Typhoon scenario as required)
  const defaultPreset = LOCATION_PRESETS[0];

  const [language, setLanguageState] = useState<Language>('en');
  const [persona, setPersonaState] = useState<Persona>('traveler');
  const [disasterType, setDisasterTypeState] = useState<DisasterType>('tsunami');
  const [locationState, setLocationState] = useState<LocationState>(defaultPreset.location);
  const [activePresetId, setActivePresetId] = useState<string>('onna');
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSirenOn, setIsSirenOn] = useState<boolean>(false);
  const [volunteerMode, setVolunteerMode] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Restore saved preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('kizuna_language') as Language;
      const savedPersona = localStorage.getItem('kizuna_persona') as Persona;
      const onboarded = localStorage.getItem('kizuna_onboarded');

      if (savedLang) setLanguageState(savedLang);
      if (savedPersona) setPersonaState(savedPersona);
      if (!onboarded) {
        setShowOnboarding(true);
      }
    } catch {
      // LocalStorage access restriction fallback
    }

    // Network status listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration skipped:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('kizuna_language', lang);
    } catch {}
  };

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    try {
      localStorage.setItem('kizuna_persona', p);
    } catch {}
  };

  const toggleSiren = () => {
    const nextState = !isSirenOn;
    setIsSirenOn(nextState);
    audioEngine.toggleSiren(nextState);
  };

  const queryElevationForCoords = async (lat: number, lng: number): Promise<number> => {
    try {
      const res = await fetch(`/api/elevation?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      return data.elevationMeters ?? 5;
    } catch {
      return 5;
    }
  };

  const applyPreset = async (presetId: string) => {
    const preset = LOCATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(preset.id);
    setLocationState(preset.location);
    setDisasterTypeState(preset.recommendedDisaster);
    audioEngine.playChime();
  };

  const setDisasterType = (type: DisasterType) => {
    setDisasterTypeState(type);
    if (type !== 'normal') {
      audioEngine.playChime();
    }
  };

  // Fetch contextual briefing whenever disaster, location, persona, or language changes
  const refreshBriefing = useCallback(async () => {
    setIsLoadingBriefing(true);
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disasterType,
          location: locationState,
          persona,
          language,
        }),
      });
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error('Failed to load briefing:', err);
    } finally {
      setIsLoadingBriefing(false);
    }
  }, [disasterType, locationState, persona, language]);

  useEffect(() => {
    refreshBriefing();
  }, [refreshBriefing]);

  return (
    <DisasterContext.Provider
      value={{
        language,
        setLanguage,
        persona,
        setPersona,
        disasterType,
        setDisasterType,
        locationState,
        setLocationState,
        briefing,
        isLoadingBriefing,
        refreshBriefing,
        isOnline,
        isSirenOn,
        toggleSiren,
        volunteerMode,
        setVolunteerMode,
        showOnboarding,
        setShowOnboarding,
        activePresetId,
        applyPreset,
        queryElevationForCoords,
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
}

export function useDisaster() {
  const context = useContext(DisasterContext);
  if (!context) {
    throw new Error('useDisaster must be used within a DisasterProvider');
  }
  return context;
}
