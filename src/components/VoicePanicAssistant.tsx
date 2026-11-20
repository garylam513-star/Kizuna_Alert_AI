'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDisaster } from '@/context/DisasterContext';
import { UI_TRANSLATIONS } from '@/lib/constants';
import { VoiceAssistResult, Language } from '@/types';
import { audioEngine } from '@/lib/audio';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const VoicePanicAssistant: React.FC = () => {
  const { language, disasterType, locationState, persona } = useDisaster();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [voiceResult, setVoiceResult] = useState<VoiceAssistResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const recognitionRef = useRef<unknown>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  // Language codes for Web Speech API
  const SPEECH_LANG_CODES: Record<Language, string> = {
    en: 'en-US',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ko: 'ko-KR',
    vi: 'vi-VN',
    tl: 'fil-PH',
  };

  // Quick panic questions tailored to each language
  const QUICK_QUESTIONS: Record<Language, string[]> = {
    en: [
      'Where is the nearest high ground?',
      'Are bullet trains (Shinkansen) running?',
      'Is tap water safe to drink?',
    ],
    ja: [
      '一番近い高台・津波避難ビルはどこ？',
      '新幹線や電車は動いていますか？',
      '水道水は飲んでも大丈夫？',
    ],
    zh: [
      '最近的高地或海啸避难大楼在哪？',
      '新干线和电车还在运行吗？',
      '自来水现在可以喝吗？',
    ],
    ko: [
      '가장 가까운 고지대나 쓰나미 대피 빌딩은 어디인가요?',
      '신칸센이나 전철이 운행 중인가요?',
      '수돗물을 마셔도 안전한가요?',
    ],
    vi: [
      'Nơi đất cao hoặc tòa nhà tránh sóng thần gần nhất ở đâu?',
      'Tàu Shinkansen có đang chạy không?',
      'Nước máy có an toàn để uống không?',
    ],
    tl: [
      'Saan ang pinakamalapit na mataas na lugar para sa tsunami?',
      'Tumatakbo ba ang mga tren o Shinkansen?',
      'Ligtas bang inumin ang tubig sa gripo?',
    ],
  };

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec =
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

      if (SpeechRec) {
        try {
          const rec = new (SpeechRec as new () => {
            continuous: boolean;
            interimResults: boolean;
            lang: string;
            onstart: () => void;
            onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
            onerror: (e: unknown) => void;
            onend: () => void;
            start: () => void;
            stop: () => void;
          })();

          rec.continuous = false;
          rec.interimResults = false;
          rec.lang = SPEECH_LANG_CODES[language] || 'en-US';

          rec.onstart = () => setIsListening(true);
          rec.onresult = (event) => {
            const spoken = event.results[0][0].transcript;
            setTranscript(spoken);
            handleSendQuery(spoken);
          };
          rec.onerror = (err) => {
            console.warn('Speech recognition error:', err);
            setIsListening(false);
          };
          rec.onend = () => setIsListening(false);

          recognitionRef.current = rec;
        } catch (e) {
          console.warn('SpeechRecognition init error:', e);
        }
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback: prompt user for text if speech recognition not supported in browser
      const input = prompt('Web Speech mic not supported in this browser. Please type your emergency question:');
      if (input) {
        setTranscript(input);
        handleSendQuery(input);
      }
      return;
    }

    const rec = recognitionRef.current as { start: () => void; stop: () => void };
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        rec.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setVoiceResult(null);

    try {
      const res = await fetch('/api/voice-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          disasterType,
          location: locationState,
          persona,
          language,
        }),
      });
      const data = await res.json();
      setVoiceResult(data);

      // Speak response aloud automatically
      if (data.spokenText) {
        setIsSpeaking(true);
        audioEngine.speak(data.spokenText, SPEECH_LANG_CODES[language] || 'en-US');
      }
    } catch (err) {
      console.error('Voice assist error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSpeaking = () => {
    audioEngine.stopSpeech();
    setIsSpeaking(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white">
              {t.voicePanicTitle}
            </h3>
            <p className="text-xs text-slate-400">
              {t.voicePanicDesc}
            </p>
          </div>
        </div>

        {isSpeaking && (
          <button
            onClick={handleStopSpeaking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold animate-pulse"
          >
            <VolumeX className="w-4 h-4" />
            <span>Stop Audio</span>
          </button>
        )}
      </div>

      {/* Main Mic Button & Quick Questions */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Pulsing Mic Button */}
        <div className="relative shrink-0 flex items-center justify-center">
          {isListening && (
            <div className="absolute w-24 h-24 rounded-full bg-red-600/30 animate-beacon" />
          )}
          <button
            onClick={toggleListening}
            className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${
              isListening
                ? 'bg-red-600 text-white ring-4 ring-red-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-red-400 border-2 border-red-500/60'
            }`}
            title="Tap to speak your question"
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-red-400" />
            )}
            <span className="text-[10px] font-black uppercase mt-1 tracking-wider text-white">
              {isListening ? 'Listening' : 'Talk'}
            </span>
          </button>
        </div>

        {/* Query Input & Quick Questions */}
        <div className="flex-1 w-full space-y-2">
          {/* Text input alternative */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery(transcript);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={isListening ? t.listening : 'Speak into mic or type panic question here...'}
              className="flex-1 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={isLoading || !transcript.trim()}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Panic Question Chips */}
          <div className="flex flex-wrap gap-1.5">
            {(QUICK_QUESTIONS[language] || QUICK_QUESTIONS.en).map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(q);
                  handleSendQuery(q);
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition text-left"
              >
                💬 {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Result Display Card */}
      {voiceResult && (
        <div className="bg-slate-950/90 border-2 border-red-500/60 rounded-xl p-4 space-y-2.5 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between text-xs text-red-300 font-bold border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-400" />
              <span>Voice Copilot Spoken Guidance:</span>
            </span>
            <button
              onClick={() => audioEngine.speak(voiceResult.spokenText, SPEECH_LANG_CODES[language] || 'en-US')}
              className="flex items-center gap-1 text-[11px] text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              Replay Audio
            </button>
          </div>

          <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
            {voiceResult.answerText}
          </p>

          <div className="bg-red-950/80 border border-red-500/50 p-2.5 rounded-lg flex items-center gap-2 text-xs text-red-100 font-bold">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>⚡ Key Action: {voiceResult.actionSuggested}</span>
          </div>
        </div>
      )}
    </div>
  );
};
