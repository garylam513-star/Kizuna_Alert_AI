'use client';

import React, { useState, useRef } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { UI_TRANSLATIONS } from '@/lib/constants';
import { HazardScanResult, Language } from '@/types';
import { audioEngine } from '@/lib/audio';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  FileImage,
  Loader2,
  ArrowRight,
  Volume2,
  Zap,
  Waves,
  Building,
  AlertOctagon,
  Footprints,
  Train,
} from 'lucide-react';

export const MultimodalScannerModal: React.FC = () => {
  const { language, locationState } = useDisaster();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<HazardScanResult | null>(null);
  const [activeSampleTitle, setActiveSampleTitle] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('auto');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [cachedBase64, setCachedBase64] = useState<string>('');
  const [cachedMime, setCachedMime] = useState<string>('image/jpeg');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  // Curated demo sign presets for instant evaluation
  const DEMO_SIGNS = [
    {
      id: 'tsunami',
      title: t.sampleTsunami || '🌊 Tsunami Sign',
      path: '/demo-images/tsunami-sign.svg',
      hint: 'tsunami wave elevation 18.5m',
      category: 'tsunami',
    },
    {
      id: 'shelter',
      title: t.sampleShelter || '🏛️ Shelter Sign',
      path: '/demo-images/shelter-sign.svg',
      hint: 'designated shelter earthquake fire',
      category: 'shelter',
    },
    {
      id: 'flood',
      title: t.sampleHazard || '⚠️ Flood Hazard',
      path: '/demo-images/hazard-flood.svg',
      hint: 'road flood closed hazard 0.8m',
      category: 'flood',
    },
    {
      id: 'wire',
      title: '⚡ Downed Wire',
      path: '/demo-images/hazard-wire.svg',
      hint: 'downed wire electric spark 6600v',
      category: 'wire',
    },
  ];

  // Manual or AI-assisted hazard categories
  const HAZARD_CATEGORIES = [
    { id: 'auto', label: '🔍 Smart Auto-Detect', icon: Sparkles },
    { id: 'tsunami', label: '🌊 Tsunami Sign', icon: Waves },
    { id: 'shelter', label: '🏛️ Evac Shelter', icon: Building },
    { id: 'flood', label: '⚠️ Road Flood', icon: AlertTriangle },
    { id: 'wire', label: '⚡ Downed Wire', icon: Zap },
    { id: 'debris', label: '🧱 Debris / Hazard', icon: AlertOctagon },
    { id: 'transit', label: '🚆 Station Notice', icon: Train },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fn = file.name.toLowerCase();
    setUploadedFileName(file.name);

    // Auto-detect category from filename if applicable
    let detectedCategory = selectedCategory;
    if (fn.includes('tsunami') || fn.includes('wave') || fn.includes('津波')) {
      detectedCategory = 'tsunami';
    } else if (fn.includes('flood') || fn.includes('water') || fn.includes('冠水')) {
      detectedCategory = 'flood';
    } else if (fn.includes('wire') || fn.includes('electric') || fn.includes('power') || fn.includes('電線')) {
      detectedCategory = 'wire';
    } else if (fn.includes('shelter') || fn.includes('避難')) {
      detectedCategory = 'shelter';
    } else if (fn.includes('debris') || fn.includes('damage') || fn.includes('倒壊')) {
      detectedCategory = 'debris';
    } else if (fn.includes('train') || fn.includes('station') || fn.includes('駅')) {
      detectedCategory = 'transit';
    }
    setSelectedCategory(detectedCategory);

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setPreviewImage(b64);
      setCachedBase64(b64);
      setCachedMime(file.type || 'image/jpeg');
      setActiveSampleTitle(file.name);
      executeScan(b64, file.type || 'image/jpeg', detectedCategory, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectDemoSign = async (demo: typeof DEMO_SIGNS[0]) => {
    setPreviewImage(demo.path);
    setActiveSampleTitle(demo.title);
    setSelectedCategory(demo.category);
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch(demo.path);
      const svgText = await res.text();
      const base64Data = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(svgText))) : '';
      setCachedBase64(base64Data);
      setCachedMime('image/svg+xml');

      await executeScan(base64Data, 'image/svg+xml', demo.category, demo.hint);
    } catch (err) {
      console.error('Scan error:', err);
      setIsScanning(false);
    }
  };

  const handleCategorySwitch = (catId: string) => {
    setSelectedCategory(catId);
    if (previewImage) {
      executeScan(cachedBase64, cachedMime, catId, uploadedFileName || activeSampleTitle);
    }
  };

  const executeScan = async (
    base64: string,
    mime: string,
    category: string,
    hintText: string
  ) => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/scan-hazard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mime || 'image/jpeg',
          language,
          hazardCategory: category === 'auto' ? '' : category,
          sampleHint: hintText,
          fileName: uploadedFileName,
          location: locationState,
        }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error('Failed to scan image:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSpeakTranslation = (text: string) => {
    const langCodes: Record<Language, string> = {
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ko: 'ko-KR',
      vi: 'vi-VN',
      tl: 'fil-PH',
    };
    audioEngine.speak(text, langCodes[language] || 'en-US');
  };

  return (
    <>
      {/* Trigger Button Card on Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {t.cameraScannerTitle}
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                  Multimodal Vision
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl mt-0.5">
                {t.cameraScannerDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setIsOpen(true);
                if (!previewImage) {
                  handleSelectDemoSign(DEMO_SIGNS[0]);
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50"
            >
              <Camera className="w-4 h-4" />
              <span>Launch AI Camera Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multimodal Scanner Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-white text-base sm:text-lg">
                  {t.cameraScannerTitle}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 hidden sm:inline-block">
                  📍 {locationState.placeName}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Camera & Upload Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition border border-indigo-400/50 shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.takePhoto}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t.uploadPhoto}</span>
                </button>
              </div>

              {/* Category Focus Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Sign & Hazard Target Focus:</span>
                  <span className="text-indigo-400 text-[10px] normal-case">
                    Tap a category to guide AI analysis
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HAZARD_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySwitch(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-300'
                            : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Demo Sign Presets */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t.testWithSample}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEMO_SIGNS.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => handleSelectDemoSign(demo)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                        previewImage === demo.path
                          ? 'bg-indigo-950/80 border-indigo-500 text-white ring-1 ring-indigo-400'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <FileImage className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-xs font-bold truncate">
                        {demo.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview & Analysis Result Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Left: Image Preview Frame */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[260px] p-2 relative">
                  {previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImage}
                      alt="Hazard or Sign Preview"
                      className="max-h-72 w-auto object-contain rounded-lg shadow"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs text-center p-6 space-y-2">
                      <Camera className="w-8 h-8 mx-auto opacity-50" />
                      <div>Take a photo or choose a sample sign above</div>
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                      <span className="text-xs font-bold text-white">
                        Multimodal Vision Scanner Analyzing...
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Transcribing kanji, evaluating hazard perimeter & translating
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: AI Vision Analysis Result */}
                <div className="space-y-3">
                  {scanResult ? (
                    <div className="space-y-3 animate-fadeIn">
                      {/* Sign Type Badge */}
                      <div className="p-3 bg-indigo-950/60 border border-indigo-500/50 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                            Identified Sign / Hazard
                          </div>
                          <div className="text-sm font-extrabold text-white mt-0.5">
                            {scanResult.signType}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSpeakTranslation(scanResult.translation)}
                          className="flex items-center gap-1 text-[11px] bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-700 shrink-0"
                          title="Speak translation aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Listen</span>
                        </button>
                      </div>

                      {/* Transcribed Japanese & Translation */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          Original Japanese Kanji:
                        </div>
                        <div className="text-xs text-amber-300 font-medium font-mono bg-slate-900/60 p-2 rounded border border-amber-900/30">
                          {scanResult.originalJapanese}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold pt-1 border-t border-slate-800/80">
                          Translation:
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed font-medium">
                          {scanResult.translation}
                        </div>
                      </div>

                      {/* Evacuation Steps */}
                      {scanResult.simpleEvacuationSteps && scanResult.simpleEvacuationSteps.length > 0 && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                          <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                            <Footprints className="w-3.5 h-3.5" />
                            <span>Step-by-Step Evacuation Directives</span>
                          </div>
                          <div className="space-y-1.5">
                            {scanResult.simpleEvacuationSteps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60"
                              >
                                <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detected Hazards with Badges */}
                      {scanResult.detectedHazards && scanResult.detectedHazards.length > 0 && (
                        <div className="space-y-1.5">
                          {scanResult.detectedHazards.map((haz, idx) => {
                            const isCrit = haz.severity === 'CRITICAL';
                            const isWarn = haz.severity === 'WARNING';
                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                                  isCrit
                                    ? 'bg-rose-950/60 border-rose-600/50 text-rose-200'
                                    : isWarn
                                    ? 'bg-amber-950/60 border-amber-600/50 text-amber-200'
                                    : 'bg-blue-950/60 border-blue-600/50 text-blue-200'
                                }`}
                              >
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-extrabold flex items-center gap-2">
                                    <span>{haz.type}</span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black border">
                                      {haz.severity}
                                    </span>
                                  </div>
                                  <p className="text-[11px] mt-0.5 opacity-90 leading-tight">
                                    {haz.detail}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Immediate Action Callout */}
                      <div className="bg-red-950/90 border-2 border-red-500/80 p-3 rounded-xl flex items-start gap-2 text-xs text-red-100 font-bold shadow-lg">
                        <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-black text-red-300">
                            Immediate Action Required:
                          </div>
                          <div className="text-xs text-white font-extrabold mt-0.5">
                            {scanResult.immediateAction}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-slate-800 rounded-xl space-y-2">
                      <Sparkles className="w-8 h-8 opacity-40 text-indigo-400" />
                      <p className="text-xs">
                        Select a sample above or upload a photo of Japanese disaster signage or hazard.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
