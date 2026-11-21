import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { AIBriefing, DisasterType, Language, LocationState, Persona } from '@/types';

export const dynamic = 'force-dynamic';

// Fallback generator for zero-network / offline / missing API key testing
function generateFallbackBriefing(
  disasterType: DisasterType,
  location: LocationState,
  persona: Persona,
  language: Language
): AIBriefing {
  const isTsunami = disasterType === 'tsunami';
  const isEarthquake = disasterType === 'earthquake';
  const isTyphoon = disasterType === 'typhoon';
  const isNormal = disasterType === 'normal';

  const elevation = location.elevationMeters ?? 5;
  const isLowElevation = elevation < 15;

  let title = 'Japan Disaster Safety Guidance';
  let alertLevel = 'Advisory';
  let elevationWarning = undefined;
  let summary = 'Current conditions are stable. Maintain general disaster awareness.';

  if (isTsunami) {
    title = 'MAJOR TSUNAMI WARNING (大津波警報) - IMMEDIATE EVACUATION';
    alertLevel = 'CRITICAL / EVACUATE NOW';
    elevationWarning = isLowElevation
      ? `CRITICAL RISK: Current elevation is ${elevation.toFixed(1)}m. You are within coastal tsunami inundation danger. Run to >15m high ground or 4th floor+ concrete building immediately.`
      : `ELEVATION ADVISORY: Current elevation is ${elevation.toFixed(1)}m. Stay above 15m and do not approach beaches or riverbanks.`;
    summary = `A major tsunami warning is active for ${location.placeName}. Tsunami waves can arrive within minutes and surge repeatedly. Move vertically to high ground immediately.`;
  } else if (isEarthquake) {
    title = 'EARTHQUAKE SHINDO 6 STRONG (震度6強) - DROP, COVER, HOLD ON';
    alertLevel = 'SEVERE / PROTECT LIFE';
    summary = `Violent shaking recorded near ${location.placeName}. Major structural hazard and aftershocks expected. Do not rush outside; protect your head.`;
  } else if (isTyphoon) {
    title = 'SUPER TYPHOON APPROACHING (超大型・猛烈な台風)';
    alertLevel = 'WARNING / LEVEL 4 SHELTER';
    summary = `Catastrophic wind gusts and torrential rain approaching ${location.placeName}. Flooding, power outages, and transit cancellations imminent.`;
  }

  // Multilingual localization for headers
  if (language === 'ja') {
    if (isTsunami) {
      title = '大津波警報発令中 - 即時高所避難';
      summary = `${location.placeName}沿岸部に大津波警報が発令されました。津波は繰り返し襲来します。直ちに高台（海抜15m以上）または津波避難ビルへ避難してください。`;
    } else if (isEarthquake) {
      title = '震度6強 大地震発生 - 身の安全を最優先に';
      summary = `${location.placeName}周辺で強い揺れを観測しました。頭部を保護し、落下物に注意してください。余震が連続して発生する恐れがあります。`;
    } else if (isTyphoon) {
      title = '大型猛烈な台風接近中 - 早期避難・暴風対策';
      summary = `${location.placeName}に暴風域が接近中。記録的な暴風雨・低地浸水・土砂災害に厳重警戒し、屋外への移動を中止してください。`;
    }
  }

  const steps = [];

  if (isTsunami) {
    steps.push({
      step: 1,
      action: language === 'ja' ? '海・河川から即座に離れ、高台（15m以上）へ走る' : 'Flee coastlines and riverbanks immediately to high ground (>15m)',
      reason: language === 'ja' ? '津波の第1波は時速数百キロで到達します。車を使わず徒歩で駆け上がってください。' : 'Tsunami waves move as fast as a jetliner. Flee on foot as roads quickly become trapped.',
      priority: 'CRITICAL' as const,
      icon: 'arrow-up' as const,
    });
    steps.push({
      step: 2,
      action: language === 'ja' ? '高台が遠い場合は、鉄筋コンクリート造ビルの3階以上（屋上）へ垂直避難' : 'If high ground is far, perform vertical evacuation into concrete 3F+ or rooftop',
      reason: language === 'ja' ? '外壁の頑丈な指定津波避難ビルが安全です。' : 'Engineered designated tsunami buildings withstand wave impact.',
      priority: 'CRITICAL' as const,
      icon: 'shield' as const,
    });
    steps.push({
      step: 3,
      action: persona === 'traveler' 
        ? (language === 'ja' ? 'ホテルの指示に従い、パスポートとスマホのみ携行' : 'Keep passport and phone in pocket; abandon heavy luggage')
        : (language === 'ja' ? '家族・勤務先へ無事メッセージを送信し、高所待機を継続' : 'Send pre-saved "I am safe on high ground" message to employer/family'),
      reason: language === 'ja' ? '身軽にして迅速に高所を維持してください。' : 'Excess weight slows escape; multiple surge waves will continue for hours.',
      priority: 'HIGH' as const,
      icon: 'phone' as const,
    });
  } else if (isEarthquake) {
    steps.push({
      step: 1,
      action: language === 'ja' ? '「まず低く、頭を守り、動かない（シェイクアウト）」' : 'Drop, Cover, and Hold On under sturdy furniture',
      reason: language === 'ja' ? '家具の転倒やガラス飛散による負傷が最多です。' : 'Falling ceiling tiles, glass, and toppled furniture cause most injuries.',
      priority: 'CRITICAL' as const,
      icon: 'shield' as const,
    });
    steps.push({
      step: 2,
      action: language === 'ja' ? '揺れが収まったら避難経路（ドア）を開放し、ガスの元栓・ブレーカーを切る' : 'Open exit doors and shut off main gas breaker after shaking ceases',
      reason: language === 'ja' ? '建物歪みによる閉じ込めと、通電火災を防ぎます。' : 'Post-earthquake electrical fires are the leading cause of secondary urban destruction.',
      priority: 'HIGH' as const,
      icon: 'plug' as const,
    });
    steps.push({
      step: 3,
      action: persona === 'traveler'
        ? (language === 'ja' ? '駅や繁華街でパニックにならず、看板や電柱から離れた広場へ' : 'Evacuate crowded train stations calmly into designated open plazas (e.g. Miyashita Park)')
        : (language === 'ja' ? '職場の避難プロトコルに従い、点呼確認' : 'Follow workplace muster protocols and confirm co-worker safety'),
      reason: language === 'ja' ? '狭い地下街や駅改札での将棋倒しを防ぎます。' : 'Prevents crowd stampedes in subterranean corridors.',
      priority: 'HIGH' as const,
      icon: 'alert' as const,
    });
  } else if (isTyphoon) {
    steps.push({
      step: 1,
      action: language === 'ja' ? '雨戸・シャッターを閉め、窓ガラスから離れた部屋へ移動' : 'Shutter all windows, draw thick curtains, and stay in interior rooms',
      reason: language === 'ja' ? '飛来物による窓ガラス破損と暴風雨の吹き込みを防ぎます。' : 'Flying debris can penetrate windows at speeds over 180 km/h.',
      priority: 'HIGH' as const,
      icon: 'home' as const,
    });
    steps.push({
      step: 2,
      action: language === 'ja' ? '浴槽に水を張り、モバイルバッテリーを100%充電' : 'Fill bathtubs with emergency water and charge all power banks to 100%',
      reason: language === 'ja' ? '暴風による送電線切断で広域停電・断水が発生する可能性があります。' : 'Typhoons routinely cut grid power and municipal water pumps for 24-72 hours.',
      priority: 'HIGH' as const,
      icon: 'droplet' as const,
    });
    steps.push({
      step: 3,
      action: language === 'ja' ? '低地・地下鉄・アンダーパスへの立ち寄りを厳禁' : 'Avoid underground passages, riverbanks, and basement venues',
      reason: language === 'ja' ? '都市部の内水氾濫は数分で水位が急上昇します。' : 'Urban flash flooding submerges underground corridors with zero warning.',
      priority: 'CRITICAL' as const,
      icon: 'arrow-up' as const,
    });
  } else {
    steps.push({
      step: 1,
      action: language === 'ja' ? '最寄りの指定避難所と標高を確認する' : 'Confirm your nearest emergency shelter and local elevation',
      reason: language === 'ja' ? '平時に避難経路を確認しておくことで、発災時に即行動できます。' : 'Advance route knowledge reduces panic response time by 80%.',
      priority: 'MEDIUM' as const,
      icon: 'shield' as const,
    });
    steps.push({
      step: 2,
      action: language === 'ja' ? '非常用持ち出し品（飲料水、充電器、パスポート）を準備' : 'Prepare an emergency go-bag (water, battery pack, ID/Passport)',
      reason: language === 'ja' ? '発災直後は物資供給が数日間途絶えることがあります。' : 'Ensures 72-hour self-sufficiency during logistics interruptions.',
      priority: 'MEDIUM' as const,
      icon: 'droplet' as const,
    });
  }

  const jargonDecoder = [
    {
      term: 'Shindo (震度)',
      kana: 'しんど',
      romaji: 'Shindo',
      explanation: 'Japan\'s 10-tier seismic intensity scale measuring actual surface shaking at your specific spot, from 0 to 7. Shindo 6 Strong makes it impossible to stand without crawling.',
      practicalImpact: 'Shindo 6+ triggers automatic Shinkansen halts and gas cutoff sensors.',
    },
    {
      term: 'J-Alert (全国瞬時警報システム)',
      kana: 'ジェイアラート',
      romaji: 'J-Arāto',
      explanation: 'Japan\'s satellite-driven nationwide early warning system broadcasting sirens to cellphones, loud municipal speakers, and TV screens within seconds.',
      practicalImpact: 'When J-Alert chimes, take immediate evasive shelter. Do not check social media first.',
    },
    {
      term: 'Tsunami Warning vs Advisory',
      kana: '津波警報 と 津波注意報',
      romaji: 'Tsunami Keihō vs Chūihō',
      explanation: 'Advisory (注意報) = up to 1m waves (deadly currents). Warning (警報) = 1m–3m. Major Warning (大津波警報) = 3m to 10m+ catastrophic inundation.',
      practicalImpact: 'Even a 30cm tsunami can knock an adult off their feet; 1m is 100% lethal in open water.',
    },
  ];

  const typhoonChecklist = isTyphoon ? [
    { id: 'typ-1', category: '72h Out', task: 'Clear balconies of loose planters, chairs, and umbrella racks', urgency: 'High', hoursOut: 72 },
    { id: 'typ-2', category: '48h Out', task: 'Stock 3 liters of drinking water per person per day & non-perishable canned food', urgency: 'High', hoursOut: 48 },
    { id: 'typ-3', category: '24h Out', task: 'Charge power banks, laptops, flashlights, and download offline transit/map packs', urgency: 'Critical', hoursOut: 24 },
    { id: 'typ-4', category: '12h Out', task: 'Fill bathtubs with non-potable sanitation water for emergency toilet flushing', urgency: 'High', hoursOut: 12 },
    { id: 'typ-5', category: '0h (Impact)', task: 'Lock all shutters, stay away from exterior glass, and monitor JMA radar', urgency: 'Critical', hoursOut: 0 },
  ] : undefined;

  const contacts = [
    { label: 'Police Emergency (警察)', number: '110', note: '24/7 National Emergency Line', type: 'police' as const },
    { label: 'Fire & Ambulance (消防・救急)', number: '119', note: 'Medical emergencies & structural fires', type: 'fire' as const },
    { label: 'Japan Coast Guard (海上保安庁)', number: '118', note: 'Maritime & coastal tsunami distress', type: 'coastguard' as const },
    { label: 'JNTO 24/7 Tourist Hotline', number: '050-3816-2720', note: 'English, Chinese, Korean tourist assistance', type: 'tourist' as const },
    { label: 'Disaster Message Dial (災害用伝言ダイヤル)', number: '171', note: 'Audio message board during network congestion', type: 'tourist' as const },
  ];

  return {
    title,
    disasterType,
    alertLevel,
    elevationWarning,
    summary,
    survivalSteps: steps,
    jargonDecoder,
    typhoonChecklist,
    contacts,
    generatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isAiGenerated: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { disasterType, location, persona, language } = body as {
      disasterType: DisasterType;
      location: LocationState;
      persona: Persona;
      language: Language;
    };

    if (!disasterType || !location) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { client: ai, modelName, isVertex } = getGeminiClient();

    // If no API key or Vertex project configured, use high-fidelity curated emergency intelligence immediately
    if (!ai) {
      const fallback = generateFallbackBriefing(disasterType, location, persona || 'traveler', language || 'en');
      return NextResponse.json(fallback);
    }

    // Call real Gemini via official @google/genai SDK (Vertex AI with GCP Credits or AI Studio)
    try {
      const languageNames: Record<Language, string> = {
        en: 'English',
        ja: 'Japanese (日本語)',
        zh: 'Simplified Chinese (简体中文)',
        ko: 'Korean (한국어)',
        vi: 'Vietnamese (Tiếng Việt)',
        tl: 'Tagalog (Filipino)',
      };

      const systemPrompt = `You are "Kizuna Alert AI", Japan's official emergency multilingual AI copilot designed for the "Gen APAC AI: Meet the Builder" event.
You produce calm, authoritatively accurate, life-saving disaster survival briefings tailored to the user's exact elevation, location in Japan, persona, and disaster type.

Respond strictly in the requested target language: ${languageNames[language || 'en']}.
Return valid JSON only matching this exact schema:
{
  "title": string,
  "alertLevel": string,
  "elevationWarning": string (or null if not coastal tsunami),
  "summary": string (calm, direct, 2-3 sentences max),
  "survivalSteps": [
    {
      "step": number,
      "action": string (short imperative action),
      "reason": string (clear physical safety reason),
      "priority": "CRITICAL" | "HIGH" | "MEDIUM",
      "icon": "shield" | "arrow-up" | "alert" | "plug" | "droplet" | "phone" | "home"
    }
  ],
  "jargonDecoder": [
    {
      "term": string (e.g. Shindo 6, J-Alert, Tsunami Warning),
      "kana": string,
      "romaji": string,
      "explanation": string (plain language without bureaucracy),
      "practicalImpact": string (what to do right now)
    }
  ],
  "typhoonChecklist": [ // Only include if disaster is typhoon, otherwise omit or empty array
    {
      "id": string,
      "category": string (e.g. "72h Out", "48h Out", "24h Out", "At Impact"),
      "task": string,
      "urgency": string,
      "hoursOut": number
    }
  ]
}

Persona Context:
- "traveler": Foreign traveler visiting Japan. Prioritize transit halts (Shinkansen, metro), hotel safety, tourist-accessible shelters, passport protection.
- "worker": Foreign worker or trainee in Japan. Prioritize Japanese text templates to contact boss/employer, workplace evacuation, utility shutdown.
- "resident": Local resident / volunteer. Focus on local neighborhood safety, aiding non-Japanese speakers, reporting street hazards.

Disaster Context:
- Disaster: ${disasterType}
- Location: ${location.placeName} (Lat: ${location.lat}, Lng: ${location.lng})
- Elevation: ${location.elevationMeters} meters above sea level
- Coastal: ${location.isCoastal ? 'Yes (High Tsunami Danger)' : 'No'}

CRITICAL TSUNAMI ELEVATION LOGIC:
If disaster is tsunami and elevation < 15m, explicitly issue an urgent vertical evacuation warning to get above 15m or to 4th floor+ of reinforced concrete building immediately.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `Generate an emergency safety briefing for ${disasterType} at ${location.placeName} (Elevation: ${location.elevationMeters}m). User is a ${persona}. Deliver in ${languageNames[language || 'en']}.` }]
          }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);

      const contacts = [
        { label: 'Police Emergency (警察)', number: '110', note: '24/7 National Emergency Line', type: 'police' as const },
        { label: 'Fire & Ambulance (消防・救急)', number: '119', note: 'Medical emergencies & fires', type: 'fire' as const },
        { label: 'Japan Coast Guard (海上保安庁)', number: '118', note: 'Maritime & tsunami distress', type: 'coastguard' as const },
        { label: 'JNTO 24/7 Tourist Hotline', number: '050-3816-2720', note: 'English, Chinese, Korean assistance', type: 'tourist' as const },
        { label: 'Disaster Message Dial', number: '171', note: 'Voice bulletin board during blackouts', type: 'tourist' as const },
      ];

      return NextResponse.json({
        ...parsedData,
        disasterType,
        contacts,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isAiGenerated: true,
      });
    } catch (aiError) {
      console.warn('Gemini 2.5 Flash call failed or rate-limited, falling back to local emergency engine:', aiError);
      const fallback = generateFallbackBriefing(disasterType, location, persona || 'traveler', language || 'en');
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error('Error in /api/briefing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
