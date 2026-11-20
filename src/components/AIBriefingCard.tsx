'use client';

import React, { useState } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { UI_TRANSLATIONS } from '@/lib/constants';
import {
  Sparkles,
  ShieldAlert,
  ArrowUp,
  AlertTriangle,
  Zap,
  Droplet,
  Phone,
  Home,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const STEP_ICONS: Record<string, React.ElementType> = {
  shield: ShieldAlert,
  'arrow-up': ArrowUp,
  alert: AlertTriangle,
  plug: Zap,
  droplet: Droplet,
  phone: Phone,
  home: Home,
};

export const AIBriefingCard: React.FC = () => {
  const { briefing, isLoadingBriefing, refreshBriefing, language, disasterType, locationState } = useDisaster();
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [showJargon, setShowJargon] = useState<boolean>(true);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const toggleTask = (id: string) => {
    setCheckedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getAlertBannerColors = () => {
    switch (disasterType) {
      case 'tsunami':
        return 'from-blue-900/90 via-slate-900 to-blue-950/80 border-blue-500/80 text-blue-100';
      case 'earthquake':
        return 'from-red-900/90 via-slate-900 to-rose-950/80 border-red-500/80 text-red-100';
      case 'typhoon':
        return 'from-purple-900/90 via-slate-900 to-indigo-950/80 border-purple-500/80 text-purple-100';
      case 'normal':
      default:
        return 'from-emerald-950/80 via-slate-900 to-teal-950/80 border-emerald-500/60 text-emerald-100';
    }
  };

  if (!briefing && isLoadingBriefing) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 animate-pulse text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-red-400">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span className="font-bold text-sm tracking-wide">
            Google Gemini 2.5 Flash Generating Safety Protocol...
          </span>
        </div>
        <div className="h-6 bg-slate-800 rounded-lg w-3/4 mx-auto" />
        <div className="h-4 bg-slate-800 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="space-y-4">
      {/* Main Alert Card */}
      <div
        className={`bg-gradient-to-br ${getAlertBannerColors()} border rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md`}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/20 text-[11px] font-black uppercase tracking-wider">
              {briefing.alertLevel}
            </span>
            <span className="text-[11px] text-white/70 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              {briefing.generatedAt}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono">
              Model: gemini-2.5-flash
            </span>
          </div>

          <button
            onClick={refreshBriefing}
            disabled={isLoadingBriefing}
            className="flex items-center gap-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg border border-white/20 transition active:scale-95"
            title="Refresh Copilot with latest conditions"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingBriefing ? 'animate-spin' : ''}`} />
            <span>Update</span>
          </button>
        </div>

        {/* Alert Title & Summary */}
        <div className="space-y-2 mb-4">
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <span>{briefing.title}</span>
          </h2>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
            {briefing.summary}
          </p>
        </div>

        {/* Elevation Warning Banner if Coastal Tsunami */}
        {briefing.elevationWarning && (
          <div className="mb-4 bg-red-950/90 border-2 border-red-500 rounded-xl p-3.5 flex items-start gap-3 shadow-lg shadow-red-950/70">
            <ArrowUp className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs sm:text-sm text-red-100">
              <div className="font-black text-red-300 uppercase tracking-wide mb-0.5">
                URGENT VERTICAL EVACUATION DIRECTIVE:
              </div>
              <div className="font-medium">{briefing.elevationWarning}</div>
            </div>
          </div>
        )}

        {/* Immediate Survival Steps Section */}
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Immediate Survival Actions (Prioritized)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {briefing.survivalSteps.map((step) => {
              const IconComponent = STEP_ICONS[step.icon] || ShieldAlert;
              const isCrit = step.priority === 'CRITICAL';
              return (
                <div
                  key={step.step}
                  className={`rounded-xl p-3.5 border transition-all ${
                    isCrit
                      ? 'bg-red-950/60 border-red-500/70 shadow-md shadow-red-950/30'
                      : 'bg-black/30 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white font-black text-xs">
                      {step.step}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isCrit
                          ? 'bg-red-600 text-white'
                          : step.priority === 'HIGH'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {step.priority}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 mb-1">
                    <IconComponent className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {step.action}
                    </h4>
                  </div>
                  <p className="text-[11px] text-white/70 leading-normal pl-6">
                    {step.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Typhoon 72-Hour Preparedness Checklist (Dynamically rendered if typhoon) */}
      {briefing.typhoonChecklist && briefing.typhoonChecklist.length > 0 && (
        <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {t.typhoonChecklistTitle}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Track vital preparation milestones before typhoon landfall
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
              {Object.values(checkedTasks).filter(Boolean).length} / {briefing.typhoonChecklist.length} Done
            </span>
          </div>

          <div className="space-y-2">
            {briefing.typhoonChecklist.map((task) => {
              const isDone = !!checkedTasks[task.id];
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-purple-950/40 border-purple-600/60 text-slate-400'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${
                        isDone ? 'text-purple-400 fill-purple-400/20' : 'text-slate-600'
                      }`}
                    />
                    <div>
                      <div className={`text-xs sm:text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                        {task.task}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700">
                          {task.category}
                        </span>
                        <span className="text-amber-400 font-semibold">{task.urgency} Urgency</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Jargon Decoder Section */}
      {briefing.jargonDecoder && briefing.jargonDecoder.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div
            onClick={() => setShowJargon(!showJargon)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {t.jargonTitle}
              </h3>
            </div>
            <button className="text-slate-400 hover:text-white">
              {showJargon ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showJargon && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5 pt-3 border-t border-slate-800">
              {briefing.jargonDecoder.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm text-amber-300">
                      {item.term}
                    </span>
                    {item.romaji && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.romaji}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                  <div className="text-[10px] bg-slate-900 p-2 rounded-lg border border-slate-800/80 text-amber-200/90 font-medium">
                    ⚡ <strong>Action:</strong> {item.practicalImpact}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
