'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DisasterSimulatorBar } from '@/components/DisasterSimulatorBar';
import { LocationSelectorBar } from '@/components/LocationSelectorBar';
import { AIBriefingCard } from '@/components/AIBriefingCard';
import { ElevationMapRadar } from '@/components/ElevationMapRadar';
import { MultimodalScannerModal } from '@/components/MultimodalScannerModal';
import { VoicePanicAssistant } from '@/components/VoicePanicAssistant';
import { PersonaActionHub } from '@/components/PersonaActionHub';
import { OfflineSurvivalPack } from '@/components/OfflineSurvivalPack';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Sparkles, Shield, Heart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a12] text-slate-100">
      {/* 2-Second Onboarding Overlay */}
      <OnboardingModal />

      {/* Top Fixed Header */}
      <Header />

      {/* Disaster Simulator Bar (Hackathon Evaluation) */}
      <DisasterSimulatorBar />

      {/* Location Selector Bar with Elevation API */}
      <LocationSelectorBar />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Context-Aware AI Safety Copilot & Alert Briefing */}
        <AIBriefingCard />

        {/* Dynamic Dual-Column Tactical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice Assistant, Multimodal Camera Scanner, Offline SOS Pack */}
          <div className="lg:col-span-6 space-y-6">
            {/* Voice-First Panic Assistant */}
            <VoicePanicAssistant />

            {/* Multimodal Camera Sign & Hazard Scanner */}
            <MultimodalScannerModal />

            {/* Offline Survival Pack & SOS Audio Cards */}
            <OfflineSurvivalPack />
          </div>

          {/* Right Column: Elevation-Aware Map & Shelter Radar, Persona Hub */}
          <div className="lg:col-span-6 space-y-6">
            {/* Elevation-Aware Map & Shelter Finder */}
            <ElevationMapRadar />

            {/* Persona Action Hub (Traveler, Worker, Local Resident) */}
            <PersonaActionHub />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 mt-12 text-slate-400 text-xs text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="font-extrabold text-white">Kizuna Alert AI (絆・防災AI)</span>
            <span>• Gen APAC AI: Meet the Builder</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              Powered by Google Gemini 2.5 Flash & Google Maps Platform
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Built with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
            <span>for Foreign Travelers, Workers & Local Residents in Japan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
