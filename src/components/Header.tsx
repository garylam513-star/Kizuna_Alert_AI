'use client';

import React from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { Language, Persona } from '@/types';
import { UI_TRANSLATIONS } from '@/lib/constants';
import { ShieldAlert, Volume2, VolumeX, Globe, UserCheck, Wifi, WifiOff, Sparkles, Settings2 } from 'lucide-react';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
];

const PERSONA_LABELS: Record<Persona, { label: string; icon: string; color: string }> = {
  traveler: { label: 'Traveler', icon: '🧳', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  worker: { label: 'Worker', icon: '👷', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  resident: { label: 'Resident', icon: '🏠', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
};

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    persona,
    setPersona,
    isOnline,
    isSirenOn,
    toggleSiren,
    volunteerMode,
    setShowOnboarding,
  } = useDisaster();

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-900/30 ring-2 ring-red-500/50">
            <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -bottom-1 -right-1 text-[10px] font-black bg-slate-900 text-red-400 border border-red-500/40 rounded px-1">
              AI
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-red-200 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-700/50">
                <Sparkles className="w-2.5 h-2.5 text-red-400" />
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls & Pickers */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Volunteer Translator Badge if active */}
          {volunteerMode && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-semibold animate-pulseSlow">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.volunteerBadge}</span>
            </div>
          )}

          {/* Siren Alert Toggle */}
          <button
            onClick={toggleSiren}
            title={isSirenOn ? 'Mute Emergency Siren' : 'Test Emergency Siren Chime'}
            className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
              isSirenOn
                ? 'bg-red-600 text-white border-red-400 animate-bounce'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}
          >
            {isSirenOn ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden xl:inline">{isSirenOn ? 'SIREN ON' : 'Chime'}</span>
          </button>

          {/* Persona Switcher Quick Pill */}
          <div className="relative group">
            <button
              onClick={() => {
                const next: Persona = persona === 'traveler' ? 'worker' : persona === 'worker' ? 'resident' : 'traveler';
                setPersona(next);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${PERSONA_LABELS[persona].color}`}
              title="Click to cycle persona or configure"
            >
              <span>{PERSONA_LABELS[persona].icon}</span>
              <span className="capitalize">{t[persona] || PERSONA_LABELS[persona].label}</span>
            </button>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              aria-label="Select Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium pl-8 pr-7 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 text-slate-400 text-[10px]">▼</div>
          </div>

          {/* Network Online / Zero-Signal Status Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border ${
              isOnline
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                : 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
            }`}
            title={isOnline ? 'Online - Live Cloud & Gemini' : 'Offline - Emergency Local Pack Active'}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
            <span className="hidden sm:inline">{isOnline ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          {/* Quick Onboarding / Help Trigger */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
            title="Open Persona & Settings Guide"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
