// Audio synthesizer using Web Audio API (Zero external MP3 dependencies)
class EmergencyAudioEngine {
  private ctx: AudioContext | null = null;
  private isSirenActive = false;
  private sirenInterval: NodeJS.Timeout | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play standard Japanese Emergency Alert Chime (NHK style 2-tone chime)
  playChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // First tone (1046 Hz - C6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second tone (1318 Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.3);
      gain2.gain.setValueAtTime(0.25, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('AudioContext playback blocked by browser:', e);
    }
  }

  // Play continuous emergency siren pulse
  toggleSiren(enable?: boolean) {
    if (enable === false || (enable === undefined && this.isSirenActive)) {
      this.isSirenActive = false;
      if (this.sirenInterval) {
        clearInterval(this.sirenInterval);
        this.sirenInterval = null;
      }
      return false;
    }

    this.isSirenActive = true;
    this.playChime();
    this.sirenInterval = setInterval(() => {
      if (this.isSirenActive) {
        this.playChime();
      }
    }, 2000);
    return true;
  }

  // Speak text in target language using Web Speech API
  speak(text: string, languageCode: string = 'en-US') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Web Speech Synthesis is not supported in this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = languageCode.split('-')[0];
      const matchingVoice = voices.find((v) => v.lang.startsWith(langPrefix));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new EmergencyAudioEngine();
