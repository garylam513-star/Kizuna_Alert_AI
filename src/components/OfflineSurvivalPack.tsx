'use client';

import React, { useState } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { SOS_AUDIO_PHRASES, UI_TRANSLATIONS } from '@/lib/constants';
import { audioEngine } from '@/lib/audio';
import {
  Volume2,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Mountain,
  HeartHandshake,
  AlertOctagon,
} from 'lucide-react';

export const OfflineSurvivalPack: React.FC = () => {
  const { language, locationState, persona, disasterType } = useDisaster();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  // Play audio phrase aloud using Japanese voice synthesis
  const handlePlayAudio = (id: string, jpText: string) => {
    setPlayingId(id);
    audioEngine.speak(jpText, 'ja-JP');
    setTimeout(() => setPlayingId(null), 3000);
  };

  // Generate shareable "I'm Safe" broadcast text
  const generateSafeMessage = () => {
    const time = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const mapUrl = `https://maps.google.com/?q=${locationState.lat},${locationState.lng}`;

    return `[KIZUNA ALERT AI - I AM SAFE / 無事連絡]
Status: Safe & Evacuated
Location: ${locationState.placeName}
Coordinates: ${locationState.lat.toFixed(4)}, ${locationState.lng.toFixed(4)}
Elevation: ${locationState.elevationMeters ?? 0}m above sea level
Disaster Alert: ${disasterType.toUpperCase()}
Timestamp: ${time}
Google Maps Pin: ${mapUrl}
#JapanDisaster #SafetyReport`;
  };

  const handleShareSafe = async () => {
    const text = generateSafeMessage();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I Am Safe (Kizuna Alert AI)',
          text: text,
        });
        return;
      } catch {
        // Fallback to clipboard if share cancelled
      }
    }

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header & 1-Tap "I'm Safe" Broadcast Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-400" />
            <span>{t.offlinePackTitle}</span>
          </h3>
          <p className="text-xs text-slate-400">
            Works in zero-signal environments. Point screen or tap speaker to communicate with Japanese rescuers.
          </p>
        </div>

        {/* 1-Tap "I'm Safe" Broadcast Button */}
        <button
          onClick={handleShareSafe}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/60"
        >
          {isCopied ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
          <span>{isCopied ? t.copiedToClipboard : t.imSafeBtn}</span>
        </button>
      </div>

      {/* SOS Phrases Card List */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Clickable Japanese SOS Phrases (Audio + Large Display for Rescuers):
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {SOS_AUDIO_PHRASES.map((item) => {
            const isPlaying = playingId === item.id;
            const meaning = item.meaning[language] || item.meaning.en;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  item.urgency === 'critical'
                    ? 'bg-red-950/30 border-red-500/40 hover:border-red-400'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {item.urgency}
                    </span>
                    <button
                      onClick={() => handlePlayAudio(item.id, item.audioText)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow ${
                        isPlaying
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
                    </button>
                  </div>

                  {/* Japanese Big Text for Rescuers */}
                  <div className="text-base sm:text-lg font-black text-amber-300 leading-snug">
                    {item.jp}
                  </div>
                  {/* Romaji */}
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {item.romaji}
                  </div>
                </div>

                {/* Meaning in User's selected language */}
                <div className="text-xs text-slate-200 border-t border-slate-800/80 pt-1.5 font-medium">
                  {meaning}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
