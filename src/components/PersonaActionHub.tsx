'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { Persona, CrowdsourcedReport } from '@/types';
import { EMBASSY_HOTLINES, UI_TRANSLATIONS } from '@/lib/constants';
import {
  getTransitForLocation,
  getReportsForLocation,
  getSheltersForLocation,
  extractCityName,
} from '@/lib/shelters';
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
  Navigation,
  Compass,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export const PersonaActionHub: React.FC = () => {
  const { persona, setPersona, disasterType, locationState, language, volunteerMode, setVolunteerMode } = useDisaster();
  const [activeTab, setActiveTab] = useState<Persona>(persona);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Keep activeTab in sync if persona changes externally
  useEffect(() => {
    setActiveTab(persona);
  }, [persona]);

  const cityName = useMemo(() => extractCityName(locationState.placeName), [locationState.placeName]);

  // Dynamically compute shelters for the active site
  const shelters = useMemo(() => getSheltersForLocation(locationState), [locationState]);
  const nearestShelter = shelters[0];
  const highGroundTower = shelters.find((s) => s.type === 'tsunami_tower') || shelters[0];

  // Dynamic transit lines based on active location and disaster
  const transitLines = useMemo(() => {
    return getTransitForLocation(locationState, disasterType);
  }, [locationState, disasterType]);

  // Crowdsourced reports state initialized per active location
  const [reports, setReports] = useState<CrowdsourcedReport[]>([]);
  useEffect(() => {
    setReports(getReportsForLocation(locationState));
  }, [locationState]);

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
    if (!newDesc.trim()) return;

    const locTag = newLocation.trim() || `${cityName} Active Area`;

    const newRep: CrowdsourcedReport = {
      id: `rep-${Date.now()}`,
      timestamp: 'Just now',
      hazardType: newHazardType,
      description: newDesc,
      locationName: locTag,
      lat: locationState.lat,
      lng: locationState.lng,
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

  // Location-personalized worker message templates
  const dynamicWorkerMessages = [
    {
      id: 'worker-safe-transit',
      title: 'I Am Safe, Transit Halted (To Employer / Boss)',
      textJp: `お疲れ様です。【名前】です。\n大きな災害が発生しましたが、私自身に怪我はなく、現在【${locationState.placeName}】の安全な場所（最寄りの避難所: ${highGroundTower.nameJp}）に退避しています。\n現在、周辺の交通機関が全線ストップしており、出勤・移動が困難な状況です。\n安全が確保され次第、改めて状況をご連絡いたします。`,
      translation: `Hello, this is [Name]. A major disaster occurred, but I am safe and have evacuated near ${locationState.placeName} (nearest shelter: ${highGroundTower.name}). Public transit is suspended so commuting is impossible. I will contact you once safe.`,
    },
    {
      id: 'worker-shelter-report',
      title: 'Evacuated to Shelter (To Landlord / Boss)',
      textJp: `お世話になっております。【名前】です。\n避難指示に従い、指定避難所【${nearestShelter.nameJp}（標高: ${nearestShelter.elevationMeters}m）】へ無事避難いたしました。\n怪我はありません。通信環境が混雑しているため、緊急のご連絡はこちらのメッセージでお知らせください。`,
      translation: `Hello, this is [Name]. Following evacuation directives, I have safely evacuated to ${nearestShelter.name} (Elevation: ${nearestShelter.elevationMeters}m). I am unharmed. Please reach me via text as lines are congested.`,
    },
    {
      id: 'worker-apartment-check',
      title: 'Apartment Safety & Utility Check (To Landlord / Real Estate)',
      textJp: `管理会社様 / 大家様\n【${cityName}の部屋番号】号室の【名前】です。\n現在無事です。室内の家具転倒、窓ガラス破損、ガス漏れ・漏水の有無を確認しています。\n万が一ガスや水道に破損や漏れが疑われる場合、元栓を閉めて【${highGroundTower.nameJp}】へ退避いたします。`,
      translation: `Dear Landlord: This is [Name] in ${cityName}. I am unharmed. Checking for broken glass, gas leaks, and water leaks. If leaks occur, I will shut main valves and evacuate to ${highGroundTower.name}.`,
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
            Localized guidance tailored for <span className="text-white font-semibold">{cityName}</span>
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
          {/* "WHERE SHOULD I GO AS A TRAVELER?" DIRECTIVE CARD */}
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-950 to-amber-950/40 p-4 rounded-xl border border-amber-500/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wide">
              <Compass className="w-4 h-4" />
              <span>Where to Go Right Now in {cityName}:</span>
            </div>
            <div className="text-xs sm:text-sm text-white font-medium">
              If stranded or ordered to evacuate in <strong>{cityName}</strong>, proceed immediately to{' '}
              <strong className="text-amber-300">{highGroundTower.name}</strong> ({highGroundTower.distanceMeters}m away, Elevation {highGroundTower.elevationMeters}m).
              It has bilingual staff, emergency power, and tourist intake.
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${highGroundTower.lat},${highGroundTower.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Navigate to {cityName} Tourist Refuge</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
              <span className="text-[11px] text-slate-400">
                JNTO 24/7 Hotline: <a href="tel:05038162720" className="text-blue-400 font-bold underline">050-3816-2720</a>
              </span>
            </div>
          </div>

          {/* Regional Transit Status Dashboard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Train className="w-4 h-4" />
                <span>Transit Status for {cityName} & Vicinity:</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Region-Matched
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {transitLines.map((line, idx) => (
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
          <div className="space-y-2 pt-1">
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
          {/* Worker Evacuation Directive */}
          <div className="bg-emerald-950/40 border border-emerald-500/50 p-3.5 rounded-xl space-y-1">
            <div className="text-xs font-bold text-emerald-300 uppercase flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Workplace & Housing Action Protocol ({cityName}):</span>
            </div>
            <p className="text-xs text-slate-200">
              1. Shut main gas valves and circuit breakers before departing. <br />
              2. Proceed immediately to designated municipal shelter: <strong className="text-white">{nearestShelter.name}</strong> ({nearestShelter.distanceMeters}m away). <br />
              3. Send the pre-translated Japanese status message below to your boss and landlord:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {dynamicWorkerMessages.map((msg) => {
              const isCopied = copiedId === msg.id;

              return (
                <div
                  key={msg.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-300">
                      {msg.title}
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
                      <span>{isCopied ? t.copiedToClipboard : 'Copy Japanese Message'}</span>
                    </button>
                  </div>

                  {/* Japanese Text Area with real dynamic city & shelter injected */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs sm:text-sm text-white font-mono whitespace-pre-line leading-relaxed">
                    {msg.textJp}
                  </div>

                  {/* English Meaning */}
                  <div className="text-[11px] text-slate-400 italic">
                    <strong>Meaning:</strong> {msg.translation}
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
                        Active in {cityName}
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
                    語学ボランティア (Official Bilingual Volunteer Helper - {cityName})
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Assisting foreign tourists & workers at {nearestShelter.nameJp}.
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
                <span>Hyper-Local Street Hazards ({cityName} Feed):</span>
              </div>
              <button
                onClick={() => setIsSubmittingReport(!isSubmittingReport)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isSubmittingReport ? 'Cancel' : 'Report Hazard'}</span>
              </button>
            </div>

            {/* Submission Form */}
            {isSubmittingReport && (
              <form
                onSubmit={handleAddReport}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 animate-fadeIn"
              >
                <div className="text-xs font-bold text-white">
                  Submit Hazard Report in {cityName}
                </div>
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
                    placeholder={`Specific street or landmark in ${cityName}...`}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the hazard conditions for passersby..."
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
