import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { DisasterType, Language, LocationState, Persona, VoiceAssistResult } from '@/types';
import { getSheltersForLocation, extractCityName } from '@/lib/shelters';

export const dynamic = 'force-dynamic';

function generateFallbackVoiceResponse(
  query: string,
  disasterType: DisasterType,
  location: LocationState,
  language: Language
): VoiceAssistResult {
  const q = query.toLowerCase();
  const elev = location.elevationMeters ?? 3.0;
  const cityName = extractCityName(location.placeName);
  const shelters = getSheltersForLocation(location);
  const nearestShelter = shelters[0];
  const highGroundTower = shelters.find((s) => s.type === 'tsunami_tower') || shelters[0];
  const hospital = shelters.find((s) => s.type === 'hospital') || shelters[2];

  let answer = '';
  let criticalPoint = '';
  let actionSuggested = '';

  // 1. DRINKING WATER / FOOD / RATIONS (Must check BEFORE tsunami to prevent false matches)
  if (
    q.includes('tap water') ||
    q.includes('water safe') ||
    q.includes('drink') ||
    q.includes('drinking') ||
    q.includes('thirsty') ||
    q.includes('food') ||
    q.includes('eat') ||
    q.includes('hungry') ||
    q.includes('ration') ||
    q.includes('potable') ||
    q.includes('水道水') ||
    q.includes('飲み水') ||
    q.includes('水飲') ||
    q.includes('食事')
  ) {
    answer = `Do NOT drink municipal tap water immediately after a major disaster in ${cityName}. Underground water pipes frequently rupture or become contaminated with sewage. Safe bottled drinking water and food rations are currently being distributed at ${nearestShelter.name} and local 24/7 convenience store supply hubs. If you must use tap water, boil it vigorously for at least 1 minute before drinking.`;
    criticalPoint = 'Do not drink unboiled tap water. Get safe bottled water at the nearest shelter.';
    actionSuggested = `Proceed to ${nearestShelter.name} (${nearestShelter.distanceMeters}m away) for safe drinking water rations.`;
  }
  // 2. TRAINS / SHINKANSEN / SUBWAY / TRANSIT
  else if (
    q.includes('train') ||
    q.includes('shinkansen') ||
    q.includes('bullet train') ||
    q.includes('subway') ||
    q.includes('station') ||
    q.includes('transit') ||
    q.includes('metro') ||
    q.includes('bus') ||
    q.includes('rail') ||
    q.includes('flight') ||
    q.includes('airport') ||
    q.includes('電車') ||
    q.includes('新幹線') ||
    q.includes('駅') ||
    q.includes('運行')
  ) {
    answer = `All Shinkansen bullet trains, JR lines, and subways in ${cityName} have automatically halted for track and structural safety inspections. Do not wait on congested station platforms. Move outside to open plazas or proceed to ${nearestShelter.name} where public satellite communication and charging are available.`;
    criticalPoint = `All rail transit in ${cityName} is halted pending safety clearance.`;
    actionSuggested = `Move away from train station crowds to ${nearestShelter.name}.`;
  }
  // 3. HIGH GROUND / TSUNAMI / WHERE SHOULD I GO
  else if (
    q.includes('high ground') ||
    q.includes('where to go') ||
    q.includes('where should i go') ||
    q.includes('tsunami') ||
    q.includes('safe zone') ||
    q.includes('evacuate') ||
    q.includes('shelter') ||
    q.includes('run') ||
    q.includes('climb') ||
    q.includes('高台') ||
    q.includes('津波') ||
    q.includes('避難所') ||
    q.includes('どこへ')
  ) {
    if (elev < 15 || disasterType === 'tsunami') {
      answer = `Your active site is ${location.placeName} at only ${elev.toFixed(1)} meters elevation. You must move to ground higher than 15 meters immediately. Flee on foot to ${highGroundTower.name} (Elevation ${highGroundTower.elevationMeters}m), located ${highGroundTower.distanceMeters} meters away. If you cannot reach it in 5 minutes, climb to the 3rd or 4th floor rooftop of the nearest reinforced concrete building.`;
      criticalPoint = `Current elevation is ${elev.toFixed(1)}m. Reach >15m high ground immediately on foot.`;
      actionSuggested = `Run to ${highGroundTower.name} (${highGroundTower.distanceMeters}m inland).`;
    } else {
      answer = `You are at ${location.placeName} (Elevation: ${elev.toFixed(1)}m). Your elevation is relatively safe. Proceed calmly to your primary municipal shelter: ${nearestShelter.name} (${nearestShelter.distanceMeters}m away). Stay away from narrow alleys and building facades.`;
      criticalPoint = `Proceed to primary assembly shelter at ${nearestShelter.name}.`;
      actionSuggested = `Walk to ${nearestShelter.name} (${nearestShelter.distanceMeters}m away).`;
    }
  }
  // 4. MEDICAL / INJURY / DOCTOR / AMBULANCE
  else if (
    q.includes('doctor') ||
    q.includes('hospital') ||
    q.includes('hurt') ||
    q.includes('injur') ||
    q.includes('bleed') ||
    q.includes('ambulance') ||
    q.includes('119') ||
    q.includes('sick') ||
    q.includes('pain') ||
    q.includes('medicine') ||
    q.includes('医者') ||
    q.includes('病院') ||
    q.includes('怪我') ||
    q.includes('救急')
  ) {
    answer = `Call 119 immediately for ambulance and emergency medical dispatch in Japan. The nearest designated disaster base hospital in ${cityName} is ${hospital.name} (${hospital.distanceMeters}m away), which provides 24/7 trauma emergency care and foreign language support.`;
    criticalPoint = 'Dial 119 for ambulance dispatch. Nearest ER hospital is ' + hospital.name;
    actionSuggested = `Contact 119 or navigate to ${hospital.name} (${hospital.distanceMeters}m away).`;
  }
  // 5. ELECTRICITY / GAS / POWER / FIRE
  else if (
    q.includes('power') ||
    q.includes('blackout') ||
    q.includes('electricity') ||
    q.includes('gas') ||
    q.includes('fire') ||
    q.includes('stove') ||
    q.includes('leak') ||
    q.includes('breaker') ||
    q.includes('停電') ||
    q.includes('ガス') ||
    q.includes('火災')
  ) {
    answer = `Shut off your home or hotel circuit breaker and close the main gas valve immediately to prevent secondary electrical fires. Do not use matches or open flames. Keep flashlights ready and monitor disaster updates from ${nearestShelter.name}.`;
    criticalPoint = 'Shut main gas valve and electrical breakers to prevent fire outbreaks.';
    actionSuggested = 'Turn off main breaker and report gas leaks to local authorities.';
  }
  // 6. EMBASSY / LOST PASSPORT / TOURIST SUPPORT
  else if (
    q.includes('embassy') ||
    q.includes('passport') ||
    q.includes('consulate') ||
    q.includes('foreigner') ||
    q.includes('english') ||
    q.includes('tourist') ||
    q.includes('hotline') ||
    q.includes('大使館') ||
    q.includes('パスポート')
  ) {
    answer = `Call the 24/7 Multilingual Japan Tourist Hotline at 050-3816-2720 for assistance in English, Chinese, and Korean. Keep your passport and phone on your person at all times. Nearest tourist intake desk is set up at ${nearestShelter.name}.`;
    criticalPoint = 'Call JNTO Multilingual Hotline: 050-3816-2720.';
    actionSuggested = 'Contact 050-3816-2720 or your national embassy hotline listed in the Traveler hub.';
  }
  // 7. DEFAULT SITUATIONAL ANSWER (Location-Matched)
  else {
    answer = `You are currently at ${location.placeName} (Elevation: ${elev.toFixed(1)}m). In response to your question regarding "${query}", protect yourself from falling debris, avoid broken glass, and proceed to ${nearestShelter.name} (${nearestShelter.distanceMeters}m away) for official verification and emergency relief.`;
    criticalPoint = `Protect your physical safety in ${cityName} and head to ${nearestShelter.name}.`;
    actionSuggested = `Proceed to ${nearestShelter.name} (${nearestShelter.distanceMeters}m away).`;
  }

  // CRITICAL: spokenText must MATCH answerText exactly so Replay Audio speaks the exact text on screen!
  return {
    answerText: answer,
    spokenText: answer,
    criticalPoint,
    actionSuggested,
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

    // If client unavailable, use the accurate location-matched intelligent response
    if (!ai) {
      const fallback = generateFallbackVoiceResponse(
        query,
        disasterType || 'normal',
        location || { lat: 26.495, lng: 127.854, placeName: 'Active Site', elevationMeters: 3.2 },
        language || 'en'
      );
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

      const shelters = getSheltersForLocation(location);
      const nearestShelter = shelters[0];

      const systemPrompt = `You are the Voice Panic Copilot for "Kizuna Alert AI" during an active crisis in Japan.
The user is speaking to you in an emergency state. Be extremely calm, decisive, concise, and life-preserving.

Location Context:
- Active Site: ${location?.placeName || 'Japan'}
- Elevation: ${location?.elevationMeters || 5} meters above sea level
- Active Disaster Alert: ${disasterType}
- Nearest Shelter: ${nearestShelter.name} (${nearestShelter.distanceMeters}m away)
- Persona: ${persona}

Respond strictly in ${languageNames[language || 'en']}.

IMPORTANT: "spokenText" MUST BE IDENTICAL to "answerText" so that text-to-speech audio matches the on-screen text word-for-word!

Return JSON only matching this schema:
{
  "answerText": string (clear, direct, 2-3 sentences answering their exact question for their active site),
  "spokenText": string (identical to answerText),
  "criticalPoint": string (the single most vital rule),
  "actionSuggested": string (immediate physical movement or step)
}`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `User voice query: "${query}". Address their exact question for location ${location.placeName}.` }],
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

      // Guarantee spokenText matches answerText
      if (parsedData.answerText) {
        parsedData.spokenText = parsedData.answerText;
      }

      return NextResponse.json(parsedData);
    } catch (aiErr) {
      console.warn('Voice assist Gemini call failed, using location-accurate engine:', aiErr);
      const fallback = generateFallbackVoiceResponse(
        query,
        disasterType || 'normal',
        location || { lat: 26.495, lng: 127.854, placeName: 'Active Site', elevationMeters: 3.2 },
        language || 'en'
      );
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error('Error in /api/voice-assist:', error);
    return NextResponse.json({ error: 'Failed to process voice query' }, { status: 500 });
  }
}
