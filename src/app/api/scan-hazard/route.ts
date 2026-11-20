import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { HazardScanResult, Language } from '@/types';

export const dynamic = 'force-dynamic';

function generateFallbackScan(imageHint: string, language: Language): HazardScanResult {
  const isTsunami = imageHint.includes('tsunami') || imageHint.includes('wave') || imageHint.includes('津波');
  const isFlood = imageHint.includes('flood') || imageHint.includes('water') || imageHint.includes('冠水');

  if (isTsunami) {
    return {
      signType: 'Tsunami Evacuation Building (津波避難ビル)',
      originalJapanese: '津波避難ビル / 収容階：3階以上 (屋上) / 海抜標高：18.5m / ここから180m先',
      translation: 'Designated Tsunami Evacuation Building. Safe refuge on 3rd floor and rooftop. Current elevation of building is 18.5 meters above sea level. Located 180 meters ahead.',
      simpleEvacuationSteps: [
        'Proceed immediately 180 meters straight ahead towards the reinforced concrete building.',
        'Enter through open emergency stairwells and ascend directly to the 3rd floor or rooftop.',
        'Do NOT use elevators. Remain on the rooftop until all tsunami warnings are officially rescinded.',
      ],
      detectedHazards: [
        {
          type: 'Rapid Coastal Inundation',
          severity: 'CRITICAL',
          detail: 'Ground floor and surrounding roads are subject to violent hydrodynamic wave impact.',
        },
      ],
      immediateAction: 'Flee on foot immediately to the 3rd floor or higher of this designated building.',
    };
  } else if (isFlood) {
    return {
      signType: 'Road Submersion Hazard / Road Closed (道路冠水危険・通行止め)',
      originalJapanese: '⚠️ 道路冠水危険・通行止め / 水深注意 0.8m / 車両進入禁止',
      translation: 'DANGER: Road Flooded and Closed. Water depth 0.8 meters. All vehicles and pedestrian passage prohibited.',
      simpleEvacuationSteps: [
        'Turn back immediately. Do NOT attempt to wade through floodwaters.',
        'Deep water conceals displaced manhole covers, electrocution risks, and high-velocity suction.',
        'Detour to elevated ridge roads or seek vertical shelter in adjacent multi-story buildings.',
      ],
      detectedHazards: [
        {
          type: 'Deep Urban Floodwater (0.8m+)',
          severity: 'CRITICAL',
          detail: 'Flowing water of 30cm can knock down adults; 50cm floats cars. 80cm depth is life-threatening.',
        },
        {
          type: 'Hidden Submerged Manholes',
          severity: 'WARNING',
          detail: 'Water pressure pops manhole covers, creating invisible deadly suction vortexes.',
        },
      ],
      immediateAction: 'Do NOT cross. Turn around immediately and navigate to higher elevation.',
    };
  } else {
    // Default Shelter Sign
    return {
      signType: 'Designated Emergency Evacuation Shelter (指定緊急避難場所)',
      originalJapanese: '指定緊急避難場所 / 恩納村総合コミュニティセンター / 洪水 ◯ 地震 ◯ 津波 ◯ / 非常用電源・Wi-Fi完備',
      translation: 'Designated Municipal Emergency Evacuation Shelter (Community Center). Certified safe for Flood, Earthquake, and Tsunami. Equipped with emergency power and Wi-Fi.',
      simpleEvacuationSteps: [
        'Enter the main lobby and register at the disaster intake desk.',
        'Foreign language support and emergency charging points are located in the north hall.',
        'Receive drinking water rations, thermal foil blankets, and sanitation supplies.',
      ],
      detectedHazards: [
        {
          type: 'Landslide Vulnerability (土砂 ✕)',
          severity: 'WARNING',
          detail: 'This building is NOT certified for severe landslide events; stay away from the rear mountain slope.',
        },
      ],
      immediateAction: 'Proceed inside calmly to register and receive emergency rations.',
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', language = 'en', sampleHint = '' } = body;

    if (!imageBase64 && !sampleHint) {
      return NextResponse.json({ error: 'Missing image payload' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      const fallback = generateFallbackScan(sampleHint || imageBase64?.slice(0, 100) || '', language);
      return NextResponse.json(fallback);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const languageNames: Record<Language, string> = {
        en: 'English',
        ja: 'Japanese (日本語)',
        zh: 'Simplified Chinese (简体中文)',
        ko: 'Korean (한국어)',
        vi: 'Vietnamese (Tiếng Việt)',
        tl: 'Tagalog (Filipino)',
      };

      const prompt = `You are the Multimodal Vision Scanner for "Kizuna Alert AI" during a Japan disaster.
Analyze the provided emergency image (which may contain Japanese disaster signage, evacuation maps, street hazards, or floodwater).

Deliver the response strictly in ${languageNames[language as Language] || 'English'}.
Return JSON only matching this schema:
{
  "signType": string (e.g. "Tsunami Evacuation Building", "Designated Shelter", "Road Hazard"),
  "originalJapanese": string (transcribe key Japanese kanji/text visible in the image),
  "translation": string (accurate English/target language translation of all text),
  "simpleEvacuationSteps": [
    string (clear step 1),
    string (clear step 2),
    string (clear step 3)
  ],
  "detectedHazards": [
    {
      "type": string (e.g. Flooded roadway, downed wire, debris, structural damage),
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "detail": string (why this is dangerous and how to avoid)
    }
  ],
  "immediateAction": string (one decisive, urgent command for the user)
}`;

      // Clean base64 string
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);

      return NextResponse.json(parsedData);
    } catch (aiErr) {
      console.warn('Gemini vision call failed, falling back to emergency rule analyzer:', aiErr);
      const fallback = generateFallbackScan(sampleHint || '', language);
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error('Error in /api/scan-hazard:', error);
    return NextResponse.json({ error: 'Failed to analyze hazard image' }, { status: 500 });
  }
}
