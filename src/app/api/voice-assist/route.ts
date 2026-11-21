import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { DisasterType, Language, LocationState, Persona, VoiceAssistResult } from '@/types';

export const dynamic = 'force-dynamic';

function generateFallbackVoiceResponse(
  query: string,
  disasterType: DisasterType,
  location: LocationState,
  language: Language
): VoiceAssistResult {
  const q = query.toLowerCase();
  const elev = location.elevationMeters || 3;

  if (q.includes('high ground') || q.includes('tsunami') || q.includes('water') || q.includes('flood') || disasterType === 'tsunami') {
    return {
      answerText: `Your current elevation is only ${elev.toFixed(1)} meters. You must move to ground higher than 15 meters immediately. The nearest high ground shelter is Onna Community Center (Elevation 24.5m), located approximately 280 meters inland. If you cannot reach it in 5 minutes, enter the nearest 3-story concrete building and climb to the roof.`,
      spokenText: `You are at ${elev.toFixed(0)} meters elevation. Run inland immediately to ground above 15 meters or climb to the roof of a 3-story concrete building. Do not use a car.`,
      criticalPoint: 'Reach >15m elevation or 3F+ concrete rooftop immediately on foot.',
      actionSuggested: 'Evacuate to Onna Community Center (280m inland) or climb 3F+ roof.',
    };
  }

  if (q.includes('train') || q.includes('station') || q.includes('subway') || q.includes('shinkansen')) {
    return {
      answerText: `During a major earthquake or tsunami warning, all Shinkansen bullet trains, JR lines, and local subways in the impact zone automatically stop for safety inspections. Do not wait on station platforms. Move to designated waiting areas such as city plazas or community shelters.`,
      spokenText: `All trains and subways have automatically halted for track safety inspections. Do not wait on platforms. Move to open station plazas.`,
      criticalPoint: 'All rail transit is suspended pending infrastructure checks.',
      actionSuggested: 'Proceed to an open outdoor emergency plaza or municipal shelter.',
    };
  }

  if (q.includes('water') || q.includes('food') || q.includes('eat') || q.includes('drink')) {
    return {
      answerText: `Designated emergency shelters and disaster-affiliated convenience stores (7-Eleven, Lawson, FamilyMart) provide potable water and rations. Municipal water distribution points are established within 2-4 hours at local community centers and ward offices.`,
      spokenText: `Emergency drinking water is distributed at municipal shelters and convenience stores. Do not drink discolored tap water.`,
      criticalPoint: 'Rations available at municipal shelters and convenience store hubs.',
      actionSuggested: 'Visit the nearest shelter or Lawson emergency supply station.',
    };
  }

  // Default calm response
  return {
    answerText: `Stay calm. You are in ${location.placeName}. We are monitoring the ${disasterType} alert. Protect yourself from falling debris, keep your phone charged, and check the shelter map on your screen for the nearest safe zone.`,
    spokenText: `Stay calm. Protect your head, keep away from glass, and follow the shelter radar shown on your screen.`,
    criticalPoint: 'Protect your physical safety first, then verify shelter coordinates.',
    actionSuggested: 'Check the live map below for the nearest verified shelter.',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, disasterType, location, persona, language } = body as {
      query: string;
      disasterType: DisasterType;
      location: LocationState;
      persona: Persona;
      language: Language;
    };

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const { client: ai, modelName } = getGeminiClient();

    if (!ai) {
      const fallback = generateFallbackVoiceResponse(query, disasterType || 'normal', location || { lat: 26.495, lng: 127.854, placeName: 'Onna Coast', elevationMeters: 3.2 }, language || 'en');
      return NextResponse.json(fallback);
    }

    try {
      const languageNames: Record<Language, string> = {
        en: 'English',
        ja: 'Japanese (日本語)',
        zh: 'Simplified Chinese (简体中文)',
        ko: 'Korean (한국어)',
        vi: 'Vietnamese (Tiếng Việt)',
        tl: 'Tagalog (Filipino)',
      };

      const systemPrompt = `You are the Voice Panic Copilot for "Kizuna Alert AI" during an active crisis in Japan.
The user is speaking to you in an emergency state. Be extremely calm, decisive, concise, and life-preserving.

Location: ${location?.placeName || 'Japan'} (Elevation: ${location?.elevationMeters || 5}m, Disaster: ${disasterType}, Persona: ${persona}).
Respond strictly in ${languageNames[language || 'en']}.

Return JSON only matching this schema:
{
  "answerText": string (clear visual response, 2-3 sentences max),
  "spokenText": string (ultra-concise speech for text-to-speech engine, 1-2 sentences max, calm tone),
  "criticalPoint": string (the single most vital rule),
  "actionSuggested": string (immediate physical movement or step)
}`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `User voice query: "${query}". Provide immediate survival guidance.` }],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);

      return NextResponse.json(parsedData);
    } catch (aiErr) {
      console.warn('Voice assist Gemini call failed, using emergency engine:', aiErr);
      const fallback = generateFallbackVoiceResponse(query, disasterType || 'normal', location || { lat: 26.495, lng: 127.854, placeName: 'Onna Coast', elevationMeters: 3.2 }, language || 'en');
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error('Error in /api/voice-assist:', error);
    return NextResponse.json({ error: 'Failed to process voice query' }, { status: 500 });
  }
}
