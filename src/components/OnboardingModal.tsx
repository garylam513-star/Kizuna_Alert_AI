'use client';

import React from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { Language, Persona } from '@/types';
import { UI_TRANSLATIONS } from '@/lib/constants';
import { ShieldAlert, Check, ArrowRight, X } from 'lucide-react';

const LANGUAGES: { code: Language; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', native: '简体中文', flag: '🇨🇳' },
  { code: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tl', label: 'Tagalog', native: 'Filipino', flag: '🇵🇭' },
];

export const OnboardingModal: React.FC = () => {
  const {
    showOnboarding,
    setShowOnboarding,
    language,
    setLanguage,
    persona,
    setPersona,
  } = useDisaster();

  if (!showOnboarding) return null;

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const handleFinish = () => {
    try {
      localStorage.setItem('kizuna_onboarded', 'true');
    } catch {}
    setShowOnboarding(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-7 space-y-5 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-950">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Kizuna Alert AI (絆・防災AI)
              </h2>
              <p className="text-xs text-slate-400">
                2-Second Setup: Instant Multilingual Disaster Copilot for Japan
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOnboarding(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Language Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Select Your Language / 言語選択:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-950/80 border-red-500 text-white ring-1 ring-red-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-xs font-bold">{lang.native}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Persona Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Select Your Persona / 属性選択:
          </label>
          <div className="space-y-2">
            {/* Foreign Traveler */}
            <button
              onClick={() => setPersona('traveler')}
              className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                persona === 'traveler'
                  ? 'bg-amber-950/50 border-amber-500 text-white ring-1 ring-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-2xl shrink-0">🧳</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-black text-amber-300">
                    {t.traveler}
                  </div>
                  {persona === 'traveler' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t.travelerDesc}
                </div>
              </div>
            </button>

            {/* Foreign Worker */}
            <button
              onClick={() => setPersona('worker')}
              className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                persona === 'worker'
                  ? 'bg-emerald-950/50 border-emerald-500 text-white ring-1 ring-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-2xl shrink-0">👷</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-black text-emerald-300">
                    {t.worker}
                  </div>
                  {persona === 'worker' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t.workerDesc}
                </div>
              </div>
            </button>

            {/* Local Resident / Volunteer */}
            <button
              onClick={() => setPersona('resident')}
              className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                persona === 'resident'
                  ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-2xl shrink-0">🏠</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-black text-indigo-300">
                    {t.resident}
                  </div>
                  {persona === 'resident' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t.residentDesc}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-extrabold text-sm transition shadow-xl shadow-red-950/60 flex items-center justify-center gap-2"
        >
          <span>Launch Emergency Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
