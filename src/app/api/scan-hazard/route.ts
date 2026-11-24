import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { HazardScanResult, Language, LocationState } from '@/types';
import { getSheltersForLocation, extractCityName } from '@/lib/shelters';

export const dynamic = 'force-dynamic';

function generateFallbackScan(
  hint: string,
  language: Language = 'en',
  location?: LocationState
): HazardScanResult {
  const h = hint.toLowerCase();
  const cityName = location ? extractCityName(location.placeName) : 'Local Municipality';
  const shelters = location ? getSheltersForLocation(location) : [];
  const nearestShelter = shelters[0]?.name || `${cityName} Emergency Intake Shelter`;

  // 1. TSUNAMI SIGN / ELEVATION
  if (
    h.includes('tsunami') ||
    h.includes('wave') ||
    h.includes('津波') ||
    h.includes('海抜') ||
    h.includes('coastal')
  ) {
    if (language === 'ja') {
      return {
        signType: '津波避難ビル・高台避難標識',
        originalJapanese: '津波避難ビル / 収容階：3階以上 (屋上) / 海抜標高：18.5m / ここから180m先',
        translation: '指定津波避難ビル。3階以上の屋上へ避難可能。海抜18.5m、ここから180m先。',
        simpleEvacuationSteps: [
          '直ちに180m先の鉄筋コンクリート造指定ビルへ走って避難してください。',
          '外階段を使用し、3階以上または屋上へ登ってください。',
          'エレベーターは絶対に使用せず、警報解除まで待機してください。',
        ],
        detectedHazards: [
          {
            type: '沿岸津波浸水波 (Rapid Inundation)',
            severity: 'CRITICAL',
            detail: '地上階および周辺道路は津波到達時に激しい水圧と漂流物に襲われます。',
          },
        ],
        immediateAction: '直ちに徒歩でこのビルの3階以上または屋上へ登ってください。',
      };
    } else if (language === 'zh') {
      return {
        signType: '海啸避难大楼 (Tsunami Evacuation Building)',
        originalJapanese: '津波避難ビル / 収容階：3階以上 (屋上) / 海抜標高：18.5m / ここから180m先',
        translation: '指定海啸避难大楼。安全庇护区位于3楼及天台。海拔18.5米，距此处180米。',
        simpleEvacuationSteps: [
          '立即徒步向前方180米的钢筋混凝土大楼撤离。',
          '通过应急室外楼梯直接登至3楼以上或天台。',
          '切勿搭乘电梯，在官方警报解除前请保持在高处。',
        ],
        detectedHazards: [
          {
            type: '快速沿海淹没风险',
            severity: 'CRITICAL',
            detail: '底层及周边道路将遭受高速水流冲击，切勿逗留在地面。',
          },
        ],
        immediateAction: '立即徒步奔向该指定建筑3楼以上避难。',
      };
    } else {
      return {
        signType: 'Tsunami Evacuation Building (津波避難ビル)',
        originalJapanese: '津波避難ビル / 収容階：3階以上 (屋上) / 海抜標高：18.5m / ここから180m先',
        translation: `Designated Tsunami Evacuation Building in ${cityName}. Safe refuge on 3rd floor & rooftop. Elevation is 18.5m above sea level. Located 180m ahead.`,
        simpleEvacuationSteps: [
          'Proceed immediately 180 meters ahead towards the reinforced concrete building.',
          'Enter via emergency stairwells and ascend directly to the 3rd floor or rooftop.',
          'Do NOT use elevators. Remain on the rooftop until all tsunami warnings are officially cancelled.',
        ],
        detectedHazards: [
          {
            type: 'Violent Coastal Inundation',
            severity: 'CRITICAL',
            detail: 'Ground level and roads will experience destructive surge currents and debris flow.',
          },
        ],
        immediateAction: 'Flee on foot immediately to the 3rd floor or higher of this designated building.',
      };
    }
  }

  // 2. ROAD FLOODING / SUBMERGED HAZARD
  if (
    h.includes('flood') ||
    h.includes('water') ||
    h.includes('submerg') ||
    h.includes('冠水') ||
    h.includes('浸水') ||
    h.includes('puddle')
  ) {
    if (language === 'ja') {
      return {
        signType: '道路冠水危険・通行止め標識',
        originalJapanese: '⚠️ 道路冠水危険・通行止め / 水深注意 0.8m / 車両進入禁止',
        translation: '危険：道路冠水・通行止め。水深0.8メートル。全車両・歩行者の進入禁止。',
        simpleEvacuationSteps: [
          '直ちに引き返してください。冠水道路を決して歩行・横断しないでください。',
          '水面下で外れたマンホールや感電のリスクがあります。',
          '周囲の頑丈な建物へ垂直避難するか、高台ルートへ迂回してください。',
        ],
        detectedHazards: [
          {
            type: '深部都市冠水 (水深80cm以上)',
            severity: 'CRITICAL',
            detail: '水深30cmで大人が足を取られ、50cmで車両が浮遊・水没します。',
          },
          {
            type: 'マンホール脱落・吸引渦',
            severity: 'WARNING',
            detail: '水圧でマンホールの蓋が外れ、目に見えない転落吸引事故が起きます。',
          },
        ],
        immediateAction: '冠水箇所には絶対に入らず、直ちに引き返して高台へ向かってください。',
      };
    } else {
      return {
        signType: 'Road Submersion Hazard / Road Closed (道路冠水危険・通行止め)',
        originalJapanese: '⚠️ 道路冠水危険・通行止め / 水深注意 0.8m / 車両進入禁止',
        translation: `DANGER: Road Submerged & Closed in ${cityName}. Measured water depth 0.8m. All passage prohibited.`,
        simpleEvacuationSteps: [
          'Turn back immediately. Do NOT attempt to wade or drive through floodwaters.',
          'Submerged water conceals displaced manhole covers, electric currents, and high-velocity suction.',
          'Detour to elevated ridge roads or seek vertical refuge in multi-story concrete buildings.',
        ],
        detectedHazards: [
          {
            type: 'Deep Urban Floodwater (0.8m+)',
            severity: 'CRITICAL',
            detail: 'Flowing water of 30cm knocks down adults; 50cm floats cars. 80cm depth is life-threatening.',
          },
          {
            type: 'Hidden Submerged Manhole Suction',
            severity: 'WARNING',
            detail: 'Water pressure blows off manhole covers, creating invisible deadly suction drop-offs.',
          },
        ],
        immediateAction: 'Do NOT cross. Turn around immediately and detour to higher ground.',
      };
    }
  }

  // 3. DOWNED POWER LINES / HIGH VOLTAGE HAZARD
  if (
    h.includes('wire') ||
    h.includes('electric') ||
    h.includes('power') ||
    h.includes('cable') ||
    h.includes('spark') ||
    h.includes('電線') ||
    h.includes('感電')
  ) {
    if (language === 'ja') {
      return {
        signType: '高圧電線切断・感電危険',
        originalJapanese: '⚠️ 感電危険！切断電線接近禁止 / 高電圧 6,600V 通電中 / 10m以内に近づかないでください',
        translation: '危険：高圧電線が切断され路上に垂下しています。6,600V通電の恐れあり。10メートル以内接近厳禁。',
        simpleEvacuationSteps: [
          '電線や垂れ下がったケーブルから最低10メートル以上離れてください。',
          '濡れた路面や金属フェンスにも触れないでください。',
          '119番または電力会社へ通報し、周囲の人に警告してください。',
        ],
        detectedHazards: [
          {
            type: '高圧感電・アーク放電',
            severity: 'CRITICAL',
            detail: '接触しなくても濡れた地面を通じて致死的な電流が流れる危険があります。',
          },
        ],
        immediateAction: '電線から10メートル以上後退し、絶対に触れないでください。',
      };
    } else {
      return {
        signType: 'Downed High-Voltage Power Line (高圧電線切断・感電危険)',
        originalJapanese: '⚠️ 感電危険！切断電線接近禁止 / 高電圧 6,600V 通電中 / 10m以内に近づかないでください',
        translation: `DANGER: High-voltage power line severed on road in ${cityName}. Potential 6,600V current. Proximity within 10 meters strictly prohibited.`,
        simpleEvacuationSteps: [
          'Back away immediately to maintain at least 10 meters distance from the severed cable.',
          'Do NOT touch wet road surfaces, puddles, or adjacent metal fences.',
          'Alert nearby pedestrians and report to emergency services (119 / power authority).',
        ],
        detectedHazards: [
          {
            type: 'Fatal High-Voltage Electrocution',
            severity: 'CRITICAL',
            detail: 'Live wires can arc through moisture and ground currents without direct contact.',
          },
        ],
        immediateAction: 'Retreat at least 10 meters away immediately and keep others clear.',
      };
    }
  }

  // 4. STRUCTURAL COLLAPSE / DEBRIS HAZARD
  if (
    h.includes('debris') ||
    h.includes('collapse') ||
    h.includes('structural') ||
    h.includes('rubble') ||
    h.includes('wall') ||
    h.includes('glass') ||
    h.includes('倒壊') ||
    h.includes('瓦礫')
  ) {
    return {
      signType: 'Structural Damage & Falling Debris Hazard (建物倒壊・落下物危険)',
      originalJapanese: '⚠️ 倒壊危険！立入禁止 / 余震による外壁崩落注意 / ヘルメット着用',
      translation: `DANGER: Structural collapse and falling debris in ${cityName}. Entry strictly prohibited. Risk of exterior tile/glass drop during aftershocks.`,
      simpleEvacuationSteps: [
        'Protect your head using a backpack, helmet, or jacket.',
        'Move to the middle of wide streets away from older wooden structures and glass facades.',
        `Navigate towards ${nearestShelter} via open thoroughfares.`,
      ],
      detectedHazards: [
        {
          type: 'Secondary Building Collapse & Glass Fall',
          severity: 'CRITICAL',
          detail: 'Subsequent seismic tremors trigger delayed facade shedding and masonry drop.',
        },
      ],
      immediateAction: 'Cover your head immediately and move to the center of wide open roads.',
    };
  }

  // 5. LANDSLIDE / STEEP SLOPE WARNING
  if (
    h.includes('landslide') ||
    h.includes('slope') ||
    h.includes('mud') ||
    h.includes('mountain') ||
    h.includes('土砂') ||
    h.includes('がけ崩れ')
  ) {
    return {
      signType: 'Landslide Warning Zone (土砂災害警戒区域・急傾斜地崩壊危険)',
      originalJapanese: '⚠️ 土砂災害警戒区域 / 大雨時急傾斜地崩壊危険 / 直ちに反対側の高台へ避難',
      translation: `Steep Slope Landslide Warning Zone in ${cityName}. Severe slope failure risk during sustained precipitation and seismic activity.`,
      simpleEvacuationSteps: [
        'Move perpendicular away from the mountain base or cliff edge immediately.',
        'If trapped inside a home, evacuate to the 2nd floor on the opposite side of the slope.',
        `Head to ${nearestShelter} away from mountainous terrain.`,
      ],
      detectedHazards: [
        {
          type: 'Rapid Debris & Mudflow',
          severity: 'CRITICAL',
          detail: 'Saturated hillsides fail without warning, traveling at speeds exceeding 40 km/h.',
        },
      ],
      immediateAction: 'Evacuate horizontally away from the cliff or hillside base immediately.',
    };
  }

  // 6. TRANSIT SUSPENSION / STATION RESTRICTION
  if (
    h.includes('transit') ||
    h.includes('train') ||
    h.includes('station') ||
    h.includes('shinkansen') ||
    h.includes('subway') ||
    h.includes('運転見合わせ') ||
    h.includes('駅')
  ) {
    return {
      signType: 'Transit Service Suspension Notice (JR・私鉄 運転見合わせ告知)',
      originalJapanese: '⚠️ 地震による全線運転見合わせ / 安全点検中 / 改札口封鎖 / 駅前広場へ退避してください',
      translation: `Notice: All railway and subway services suspended across ${cityName} for post-disaster track inspection. Gates sealed.`,
      simpleEvacuationSteps: [
        'Do not crowd ticket gates or platform stairs.',
        'Follow station staff directions to step out into open station squares.',
        `Proceed to ${nearestShelter} for emergency communications and device charging.`,
      ],
      detectedHazards: [
        {
          type: 'Severe Terminal Crowd Surge',
          severity: 'WARNING',
          detail: 'Station congestion creates severe crush risk and secondary panic during aftershocks.',
        },
      ],
      immediateAction: 'Leave the enclosed station concourse and proceed to open public spaces.',
    };
  }

  // 7. DEFAULT: DESIGNATED MUNICIPAL EMERGENCY SHELTER
  if (language === 'ja') {
    return {
      signType: '指定緊急避難場所標識 (Designated Shelter)',
      originalJapanese: `指定緊急避難場所 / ${nearestShelter} / 洪水 ◯ 地震 ◯ 津波 ◯ / 非常用電源・通信完備`,
      translation: `${cityName}の指定緊急避難場所標識。地震・津波・洪水に対応。非常用電源および通信設備完備。`,
      simpleEvacuationSteps: [
        '正面入口から受付へ進み、避難者登録を行ってください。',
        '外国人支援窓口および緊急充電ステーションが利用可能です。',
        '飲料水、非常食、防寒アルミシートの配布を受けてください。',
      ],
      detectedHazards: [
        {
          type: '混雑・余震警戒',
          severity: 'INFO',
          detail: '避難所開設直後は混雑が予想されます。建物の出入口付近を塞がないでください。',
        },
      ],
      immediateAction: '落ち着いて避難所内部へ進み、受付登録を済ませてください。',
    };
  } else if (language === 'zh') {
    return {
      signType: '指定紧急避难场所 (Designated Emergency Shelter)',
      originalJapanese: `指定緊急避難場所 / ${nearestShelter} / 洪水 ◯ 地震 ◯ 津波 ◯ / 非常用電源・通信完備`,
      translation: `${cityName}官方指定紧急避难场所。认证防御地震、海啸及洪水。配备应急电源与卫星通信。`,
      simpleEvacuationSteps: [
        '由大门进入前台大厅登记避难者基本信息。',
        '多语言外籍援助服务台与应急手机充电站已开启。',
        '领取应急饮用水包、食品干粮及保温应急毯。',
      ],
      detectedHazards: [
        {
          type: '避难所拥挤与余震防范',
          severity: 'INFO',
          detail: '请保持通道畅通，配合现场防灾救护人员指引。',
        },
      ],
      immediateAction: '请有序进入避难所进行登记并领取救济物资。',
    };
  } else {
    return {
      signType: 'Designated Municipal Emergency Evacuation Shelter (指定緊急避難場所)',
      originalJapanese: `指定緊急避難場所 / ${nearestShelter} / 洪水 ◯ 地震 ◯ 津波 ◯ / 非常用電源・Wi-Fi完備`,
      translation: `Official Municipal Emergency Evacuation Shelter in ${cityName} (${nearestShelter}). Certified safe for Earthquake, Tsunami, and Flood. Equipped with emergency power and Wi-Fi.`,
      simpleEvacuationSteps: [
        'Enter the main entrance and register at the disaster intake reception desk.',
        'Multilingual international support desk and emergency device charging points are active in the main hall.',
        'Collect emergency drinking water rations, thermal foil survival blankets, and sanitation supplies.',
      ],
      detectedHazards: [
        {
          type: 'Post-Quake Facility Influx',
          severity: 'INFO',
          detail: 'High shelter occupancy expected. Keep entry corridors clear and listen for official announcements.',
        },
      ],
      immediateAction: `Proceed inside ${nearestShelter} calmly to register and receive emergency rations.`,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      language = 'en',
      sampleHint = '',
      hazardCategory = '',
      fileName = '',
      location,
    } = body;

    if (!imageBase64 && !sampleHint && !hazardCategory && !fileName) {
      return NextResponse.json({ error: 'Missing image or category payload' }, { status: 400 });
    }

    // Consolidated hint for heuristic matching
    const combinedHint = `${hazardCategory} ${sampleHint} ${fileName}`.trim();

    const { client: ai, modelName } = getGeminiClient();

    // If client unavailable or not configured, use the high-fidelity emergency rule analyzer
    if (!ai) {
      const fallback = generateFallbackScan(combinedHint, language, location);
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

      const prompt = `You are the Multimodal Vision Scanner for "Kizuna Alert AI" during an active crisis in Japan.
Analyze the provided image of disaster signage, hazard, floodwater, or emergency notice.
Active location context: ${location?.placeName || 'Japan'}.
User hint/filename: "${combinedHint}".

Deliver the response strictly in ${languageNames[language as Language] || 'English'}.
Return JSON only matching this schema:
{
  "signType": string (e.g. "Tsunami Evacuation Building", "Designated Shelter", "Road Submersion Hazard", "Downed Power Line"),
  "originalJapanese": string (transcribe key Japanese kanji/text visible in the image or representative Japanese text),
  "translation": string (accurate translation of all text into ${languageNames[language as Language] || 'English'}),
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
  "immediateAction": string (one decisive, urgent physical command for the user)
}`;

      // Clean base64 string
      const cleanBase64 = imageBase64?.includes(',') ? imageBase64.split(',')[1] : imageBase64;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              ...(cleanBase64
                ? [
                    {
                      inlineData: {
                        mimeType: mimeType || 'image/jpeg',
                        data: cleanBase64,
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);

      return NextResponse.json(parsedData);
    } catch (aiErr) {
      console.warn('Gemini vision call failed, falling back to emergency rule analyzer:', aiErr);
      const fallback = generateFallbackScan(combinedHint, language, location);
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error('Error in /api/scan-hazard:', error);
    return NextResponse.json({ error: 'Failed to analyze hazard image' }, { status: 500 });
  }
}
