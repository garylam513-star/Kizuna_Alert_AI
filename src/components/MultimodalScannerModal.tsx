'use client';

import React, { useState, useRef } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { UI_TRANSLATIONS } from '@/lib/constants';
import { HazardScanResult } from '@/types';
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
  Maximize2,
} from 'lucide-react';

export const MultimodalScannerModal: React.FC = () => {
  const { language } = useDisaster();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<HazardScanResult | null>(null);
  const [activeSampleTitle, setActiveSampleTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  // Curated demo sign presets for instant hackathon evaluation
  const DEMO_SIGNS = [
    {
      id: 'tsunami',
      title: t.sampleTsunami,
      path: '/demo-images/tsunami-sign.svg',
      hint: 'tsunami wave elevation',
    },
    {
      id: 'shelter',
      title: t.sampleShelter,
      path: '/demo-images/shelter-sign.svg',
      hint: 'designated shelter earthquake fire',
    },
    {
      id: 'hazard',
      title: t.sampleHazard,
      path: '/demo-images/hazard-flood.svg',
      hint: 'road flood closed hazard 0.8m',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setPreviewImage(b64);
      processImageWithGemini(b64, file.type, '');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectDemoSign = async (demo: typeof DEMO_SIGNS[0]) => {
    setPreviewImage(demo.path);
    setActiveSampleTitle(demo.title);
    setIsScanning(true);
    setScanResult(null);

    try {
      // Fetch SVG content and convert to base64 or pass hint
      const res = await fetch(demo.path);
      const svgText = await res.text();
      const base64Data = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(svgText))) : '';

      const scanRes = await fetch('/api/scan-hazard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/svg+xml',
          language,
          sampleHint: demo.hint,
        }),
      });

      const data = await scanRes.json();
      setScanResult(data);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const processImageWithGemini = async (base64: string, mime: string, sampleHint: string) => {
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
          sampleHint,
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
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-white text-base sm:text-lg">
                  {t.cameraScannerTitle}
                </h3>
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
              {/* Quick Camera & Upload Action Row */}
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

              {/* Demo Sign Presets */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t.testWithSample}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_SIGNS.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => handleSelectDemoSign(demo)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center sm:items-start gap-1 ${
                        previewImage === demo.path
                          ? 'bg-indigo-950/80 border-indigo-500 text-white ring-1 ring-indigo-400'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <FileImage className="w-4 h-4 text-indigo-400" />
                      <span className="text-[11px] font-bold truncate w-full text-center sm:text-left">
                        {demo.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview & Analysis Result Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Left: Image Preview Frame */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[220px] p-2 relative">
                  {previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImage}
                      alt="Hazard or Sign Preview"
                      className="max-h-60 w-auto object-contain rounded-lg shadow"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs text-center p-6 space-y-2">
                      <Camera className="w-8 h-8 mx-auto opacity-50" />
                      <div>Take a photo or choose a sample sign above</div>
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                      <span className="text-xs font-bold text-white">
                        Gemini 2.5 Flash Multimodal Vision Processing...
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Transcribing kanji, verifying hazards & translating
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: AI Vision Analysis Result */}
                <div className="space-y-3">
                  {scanResult ? (
                    <div className="space-y-3 animate-fadeIn">
                      {/* Sign Type Badge */}
                      <div className="p-3 bg-indigo-950/50 border border-indigo-500/50 rounded-xl">
                        <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                          Identified Sign / Hazard
                        </div>
                        <div className="text-sm font-extrabold text-white mt-0.5">
                          {scanResult.signType}
                        </div>
                      </div>

                      {/* Transcribed Japanese & English Translation */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          Original Japanese Kanji:
                        </div>
                        <div className="text-xs text-amber-300 font-medium font-mono">
                          {scanResult.originalJapanese}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold pt-1 border-t border-slate-800/80">
                          Translation:
                        </div>
                        <div className="text-xs text-slate-200">
                          {scanResult.translation}
                        </div>
                      </div>

                      {/* Evacuation Steps */}
                      {scanResult.simpleEvacuationSteps && scanResult.simpleEvacuationSteps.length > 0 && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Actionable Steps:</span>
                          </div>
                          {scanResult.simpleEvacuationSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                              <span className="text-indigo-400 font-bold shrink-0">{idx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Detected Street Hazards */}
                      {scanResult.detectedHazards && scanResult.detectedHazards.length > 0 && (
                        <div className="space-y-1.5">
                          {scanResult.detectedHazards.map((hz, hIdx) => (
                            <div
                              key={hIdx}
                              className="p-2.5 bg-red-950/40 border border-red-500/50 rounded-xl flex items-start gap-2 text-xs text-red-100"
                            >
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-red-300">{hz.type}: </span>
                                <span>{hz.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Decisive Action */}
                      <div className="p-3 bg-gradient-to-r from-red-600 to-rose-700 rounded-xl text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg">
                        <ArrowRight className="w-4 h-4 shrink-0" />
                        <span>{scanResult.immediateAction}</span>
                      </div>
                    </div>
                  ) : !isScanning ? (
                    <div className="h-full flex items-center justify-center p-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                      Select or upload an image to view AI vision translation
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
