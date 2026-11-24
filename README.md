# Kizuna Alert AI (絆・防災AI)
**Gen APAC AI: Meet the Builder Event**

> **Mobile-First Multilingual Disaster Copilot for Japan (Earthquake, Tsunami, Typhoon)**  
> Specially engineered for **Foreign Travelers**, **Foreign Workers (Trainees/OFWs)**, and **Local Japanese Residents / Bilingual Volunteers**.

[![Built with Google Cloud](https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![AI Engine](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75C2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Next.js 14 App Router](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable_Offline_Ready-green?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---
![App Screenshot](Pic1.png)
![App Screenshot](Pic2.png)
![App Screenshot](Pic3.png)
![App Screenshot](Pic4.png)


## 🌟 Key Highlights & Architecture

1. **AI Engine (Server-Side)**:
   - Powered by **Google Gemini 2.5 Flash (`gemini-2.5-flash`)** via the official `@google/genai` SDK.
   - API routes:
     - `/api/briefing`: Situational safety copilot considering live disaster type, coordinates, elevation in meters, persona, and target language.
     - `/api/scan-hazard`: Multimodal camera sign & street hazard scanner (translates Japanese kanji, identifies risks like submerged roads & downed wires).
     - `/api/voice-assist`: Web Speech API bidirectional panic mode voice assistant.
   - **`GEMINI_API_KEY` is kept strictly server-side** with built-in emergency resilience fallback if network or key is unavailable.

2. **Google Maps Platform (Client-Side)**:
   - Integrated with **Maps JavaScript API**, **Places Autocomplete** (restricted to Japan: `componentRestrictions: { country: 'jp' }`), **Geocoding API**, and **Elevation API**.
   - Automatic elevation lookup for every location change.
   - Dynamic elevation warning badge during Tsunami Warnings (flagging points `< 15m` above sea level for immediate vertical evacuation).
   - High-fidelity tactical radar fallback when offline or before API key setup.

3. **2-Second Onboarding & Persona State**:
   - **6 Languages**: English, 日本語, 简体中文, 한국어, Tiếng Việt, Tagalog.
   - **3 User Personas**:
     - **Foreign Traveler**: Transit halts (Shinkansen, metro), hotel safety, tourist-accessible shelters, 1-tap embassy hotline directory.
     - **Foreign Worker**: 1-tap copy/share pre-translated formal Japanese messages for employers & landlords ("I am safe, trains stopped"), workplace evacuation, utility alerts.
     - **Local Japanese Resident**: Crowdsourced street-hazard reporting feed & opt-in "Volunteer Translator (語学ボランティア)" status badge.
   - State persisted in `localStorage`.

4. **Interactive Location Selector Bar**:
   - **Search**: Google Places autocomplete restricted to Japan.
   - **Live GPS**: `navigator.geolocation` with reverse-geocoding.
   - **Hackathon Demo Presets (1-Tap Selection)**:
     - **Onna Coast, Okinawa** (Default coastal scenario: 26.4950° N, 127.8540° E, 3.2m elevation — Tsunami/Typhoon demo).
     - **Shibuya, Tokyo** (Dense urban earthquake scenario: 35.6595° N, 139.7005° E, 22.0m elevation).
     - **Umeda, Osaka** (Lowland urban flood/typhoon scenario: 34.7024° N, 135.4959° E, 1.8m elevation).

5. **Multimodal Sign & Street Hazard Scanner**:
   - Live mobile camera capture (`capture="environment"` / `accept="image/*"`).
   - Instant sample testing gallery with realistic Japanese emergency signs (Tsunami Evacuation Building, Designated Municipal Shelter, Road Submersion Hazard).
   - Multimodal Gemini 2.5 Flash extracts kanji, translates, breaks down evacuation steps, and flags life-threatening physical hazards.

6. **Voice-First Panic Mode**:
   - Browser Web Speech API (`SpeechRecognition` & `speechSynthesis`) paired with Gemini.
   - Natural spoken interaction in user's native language with immediate spoken voice guidance.

7. **Zero-Signal Offline SOS Pack**:
   - PWA `manifest.json` and service worker (`sw.js`) caching core assets and `offline.html`.
   - Clickable Japanese SOS phrases with synthesized speech playback ("Tasukete kudasai!", "Where is tsunami shelter?", "I need a doctor").
   - 1-tap "I'm Safe" broadcast generating GPS coordinates and Google Maps pin to WhatsApp, SMS, Line, or Clipboard.

8. **Google Cloud Run Ready**:
   - Multi-stage `Dockerfile` with `output: 'standalone'` Next.js output.
   - Configured for `PORT=8080` and `HOST=0.0.0.0`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- npm or yarn

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Google Gemini API Key (Server-Side)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps Platform API Key (Client-Side)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```
*(Note: Kizuna Alert AI includes built-in offline emergency knowledge bases, so judges can test all simulator scenarios, elevation warnings, multimodal signs, and voice queries even without API keys!)*

### 3. Local Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser or mobile viewport emulator.

### 4. Production Build & Validation
```bash
npm run build
npm start
```

---

## 🐳 Google Cloud Run Deployment

Build and deploy directly using Google Cloud SDK:

```bash
# 1. Build and push image to Google Artifact Registry / Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/kizuna-alert-ai:latest

# 2. Deploy to Google Cloud Run
gcloud run deploy kizuna-alert-ai \
  --image gcr.io/YOUR_PROJECT_ID/kizuna-alert-ai:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
```

---

## 📱 PWA Verification (Offline & Installable)

- **Installable**: Open in Chrome on Android / iOS Safari, click "Add to Home Screen" or the browser install pill.
- **Offline Mode**: Toggle airplane mode or use Chrome DevTools `Network -> Offline`. Kizuna Alert AI switches to zero-signal mode, serving cached SOS audio cards, survival rules, and emergency contacts.
