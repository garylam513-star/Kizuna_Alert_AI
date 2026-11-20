'use client';

import React from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { DisasterType } from '@/types';
import { UI_TRANSLATIONS } from '@/lib/constants';
import { AlertTriangle, Waves, Wind, CheckCircle2, Flame } from 'lucide-react';

const DISASTER_BUTTONS: { type: DisasterType; icon: React.ElementType; color: string; activeColor: string }[] = [
  {
    type: 'normal',
    icon: CheckCircle2,
    color: 'hover:bg-emerald-950/40 text-emerald-400 border-emerald-900/60',
    activeColor: 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400',
  },
  {
    type: 'tsunami',
    icon: Waves,
    color: 'hover:bg-blue-950/40 text-blue-400 border-blue-900/60',
    activeColor: 'bg-blue-600 text-white border-blue-300 shadow-lg shadow-blue-900/50 ring-2 ring-blue-400 animate-siren',
  },
  {
    type: 'earthquake',
    icon: Flame,
    color: 'hover:bg-red-950/40 text-red-400 border-red-900/60',
    activeColor: 'bg-red-600 text-white border-red-300 shadow-lg shadow-red-900/50 ring-2 ring-red-400 animate-siren',
  },
  {
    type: 'typhoon',
    icon: Wind,
    color: 'hover:bg-purple-950/40 text-purple-400 border-purple-900/60',
    activeColor: 'bg-purple-600 text-white border-purple-300 shadow-lg shadow-purple-900/50 ring-2 ring-purple-400 animate-siren',
  },
];

export const DisasterSimulatorBar: React.FC = () => {
  const { disasterType, setDisasterType, language } = useDisaster();
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const getLabel = (type: DisasterType) => {
    switch (type) {
      case 'normal':
        return t.statusAllClear;
      case 'tsunami':
        return t.statusTsunami;
      case 'earthquake':
        return t.statusEarthquake;
      case 'typhoon':
        return t.statusTyphoon;
    }
  };

  return (
    <div className="bg-slate-900/80 border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 shrink-0">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3" />
          </div>
          <span>{t.simulatorTitle}:</span>
        </div>

        {/* Simulator Button Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          {DISASTER_BUTTONS.map((item) => {
            const Icon = item.icon;
            const isActive = disasterType === item.type;
            return (
              <button
                key={item.type}
                onClick={() => setDisasterType(item.type)}
                className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all transform active:scale-95 ${
                  isActive ? item.activeColor : `bg-slate-950/60 ${item.color}`
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span className="truncate">{getLabel(item.type)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
