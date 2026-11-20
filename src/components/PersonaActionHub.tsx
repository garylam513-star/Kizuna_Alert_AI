'use client';

import React, { useState } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { Persona, CrowdsourcedReport } from '@/types';
import {
  EMBASSY_HOTLINES,
  WORKER_PRESET_MESSAGES,
  INITIAL_HAZARD_REPORTS,
  UI_TRANSLATIONS,
} from '@/lib/constants';
import {
  Train,
  PhoneCall,
  Copy,
  Check,
  UserCheck,
  AlertOctagon,
  Share2,
  PlusCircle,
  Building2,
  ThumbsUp,
  Shield,
} from 'lucide-react';

export const PersonaActionHub: React.FC = () => {
  const { persona, setPersona, disasterType, language, volunteerMode, setVolunteerMode } = useDisaster();
  const [activeTab, setActiveTab] = useState<Persona>(persona);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Crowdsourced reports state
  const [reports, setReports] = useState<CrowdsourcedReport[]>(INITIAL_HAZARD_REPORTS);
  const [newHazardType, setNewHazardType] = useState<CrowdsourcedReport['hazardType']>('downed_wire');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newLocation.trim()) return;

    const newRep: CrowdsourcedReport = {
      id: `rep-${Date.now()}`,
      timestamp: 'Just now',
      hazardType: newHazardType,
      description: newDesc,
      locationName: newLocation,
      lat: 26.4950,
      lng: 127.8540,
      reporterName: volunteerMode ? 'You (Volunteer Translator)' : 'You (Local Reporter)',
      severity: 'high',
      verifiedCount: 1,
    };

    setReports([newRep, ...reports]);
    setNewDesc('');
    setNewLocation('');
    setIsSubmittingReport(false);
  };

  const handleUpvote = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, verifiedCount: r.verifiedCount + 1 } : r))
    );
  };

  // Simulated transit line statuses based on disaster type
  const isSuspended = disasterType === 'earthquake' || disasterType === 'tsunami';
  const isDelayed = disasterType === 'typhoon';

  const TRANSIT_LINES = [
    {
      name: 'Tokaido Shinkansen (東海道新幹線)',
      route: 'Tokyo ⇄ Nagoya ⇄ Shin-Osaka',
      status: isSuspended ? 'SUSPENDED (全線見合わせ)' : isDelayed ? 'MAJOR DELAYS / WINDS' : 'NORMAL (平常運転)',
      color: isSuspended ? 'text-red-400 bg-red-950/80 border-red-800' : isDelayed ? 'text-amber-400 bg-amber-950/80 border-amber-800' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
    {
      name: 'JR Yamanote & Tokyo Metro Lines',
      route: 'Greater Tokyo Metropolitan Area',
      status: isSuspended ? 'EMERGENCY HALT (運転見合わせ)' : isDelayed ? 'REDUCED SPEED' : 'NORMAL (平常運転)',
      color: isSuspended ? 'text-red-400 bg-red-950/80 border-red-800' : isDelayed ? 'text-amber-400 bg-amber-950/80 border-amber-800' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
    {
      name: 'Osaka Loop Line (大阪環状線)',
      route: 'Osaka City Urban Rail',
      status: isSuspended ? 'SUSPENDED (全線運休)' : isDelayed ? 'HIGH WATER ALERT' : 'NORMAL (平常運転)',
      color: isSuspended ? 'text-red-400 bg-red-950/80 border-red-800' : isDelayed ? 'text-amber-400 bg-amber-950/80 border-amber-800' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
    {
      name: 'Okinawa Yui Rail (ゆいレール)',
      route: 'Naha Airport ⇄ Tedako-Uranishi',
      status: disasterType === 'tsunami' || disasterType === 'typhoon' ? 'TYPHOON/WAVE HALT' : 'NORMAL (平常運転)',
      color: disasterType === 'tsunami' || disasterType === 'typhoon' ? 'text-red-400 bg-red-950/80 border-red-800' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Persona Hub Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>{t.personaActionTitle}</span>
          </h3>
          <p className="text-xs text-slate-400">
            Tailored crisis workflows for Travelers, Workers, and Local Japanese Residents
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('traveler');
              setPersona('traveler');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'traveler'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🧳</span>
            <span>{t.traveler}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('worker');
              setPersona('worker');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'worker'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👷</span>
            <span>{t.worker}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('resident');
              setPersona('resident');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'resident'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏠</span>
            <span>{t.resident}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FOREIGN TRAVELER TOOLKIT */}
      {activeTab === 'traveler' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Transit Status Dashboard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Train className="w-4 h-4" />
                <span>Simulated Shinkansen & Transit Status Monitor:</span>
              </span>
              <span className="text-[10px] text-slate-400">Updated Real-Time</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRANSIT_LINES.map((line, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{line.name}</div>
                    <div className="text-[10px] text-slate-400">{line.route}</div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded border ${line.color}`}
                  >
                    {line.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Tap Embassy Directory */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 text-blue-300">
              <PhoneCall className="w-4 h-4" />
              <span>1-Tap Embassy Emergency Hotlines in Japan:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(EMBASSY_HOTLINES).map(([key, emb]) => (
                <a
                  key={key}
                  href={`tel:${emb.phone.replace(/[^0-9]/g, '')}`}
                  className="bg-slate-950 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>{emb.flag}</span>
                    <span className="truncate">{emb.country}</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" />
                    <span>{emb.phone}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FOREIGN WORKER TOOLKIT */}
      {activeTab === 'worker' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="text-xs text-slate-300 font-medium">
            1-Tap copy pre-translated formal Japanese crisis messages to send to your employer, boss, or apartment landlord via LINE, SMS, or email:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {WORKER_PRESET_MESSAGES.map((msg) => {
              const isCopied = copiedId === msg.id;
              const title = msg.title[language] || msg.title.en;

              return (
                <div
                  key={msg.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-300">
                      {title}
                    </h4>
                    <button
                      onClick={() => handleCopy(msg.id, msg.textJp)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition shadow ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? t.copiedToClipboard : 'Copy Japanese Text'}</span>
                    </button>
                  </div>

                  {/* Japanese Text Area */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs sm:text-sm text-white font-mono whitespace-pre-line leading-relaxed">
                    {msg.textJp}
                  </div>

                  {/* Romaji & English Explanation */}
                  <div className="text-[11px] text-slate-400 italic">
                    <strong>Meaning:</strong> {msg.translationEn}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LOCAL RESIDENT / VOLUNTEER TOOLKIT */}
      {activeTab === 'resident' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Volunteer Translator Toggle Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              volunteerMode
                ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/50'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    volunteerMode
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>{t.becomeVolunteer}</span>
                    {volunteerMode && (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.2 rounded-full uppercase font-black">
                        Active
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {t.volunteerActiveDesc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setVolunteerMode(!volunteerMode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  volunteerMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {volunteerMode ? 'Badge Active (Click to Turn Off)' : 'Opt-In as Volunteer'}
              </button>
            </div>

            {/* If Volunteer Mode is ON, display Official Badge UI */}
            {volunteerMode && (
              <div className="mt-3.5 pt-3 border-t border-emerald-500/30 flex items-center gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    語学ボランティア (Official Bilingual Volunteer Helper)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Show this screen at evacuation centers to identify yourself to tourist shelter coordinators.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Crowdsourced Hazard Reporter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 text-rose-300">
                <AlertOctagon className="w-4 h-4" />
                <span>Crowdsourced Street Hazard Reports (Hyper-Local Community Feed):</span>
              </div>
              <button
                onClick={() => setIsSubmittingReport(!isSubmittingReport)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isSubmittingReport ? 'Cancel' : 'Report Street Hazard'}</span>
              </button>
            </div>

            {/* Submission Form */}
            {isSubmittingReport && (
              <form
                onSubmit={handleAddReport}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 animate-fadeIn"
              >
                <div className="text-xs font-bold text-white">Submit New Street Hazard Report</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newHazardType}
                    onChange={(e) => setNewHazardType(e.target.value as CrowdsourcedReport['hazardType'])}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="downed_wire">⚡ Downed Power Line (電線切断)</option>
                    <option value="flooding">🌊 Road Flooding (冠水・浸水)</option>
                    <option value="road_block">🚧 Road Blocked / Landslide (通行不能)</option>
                    <option value="debris">🏚️ Broken Glass / Fallen Debris (瓦礫飛散)</option>
                  </select>

                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Specific landmark or road (e.g. Route 58 near beach)"
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>

                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the hazard conditions and immediate safety advice for passersby..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white h-20"
                  required
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition"
                >
                  Broadcast Hazard Report
                </button>
              </form>
            )}

            {/* Report List */}
            <div className="space-y-2">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-red-950 text-red-300 border border-red-700">
                        {rep.hazardType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-white">{rep.locationName}</span>
                      <span className="text-[10px] text-slate-400">• {rep.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rep.description}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Reported by: <span className="text-slate-200">{rep.reporterName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpvote(rep.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 shrink-0 active:scale-95 transition"
                    title="Verify this hazard"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-400 mb-0.5" />
                    <span className="text-[10px] font-bold">{rep.verifiedCount}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
