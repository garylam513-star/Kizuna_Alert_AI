import { LocationState, ShelterPoint, DisasterType, CrowdsourcedReport } from '@/types';

// Helper to extract clean city / area label from placeName
export function extractCityName(placeName: string): string {
  if (!placeName) return 'Local Area';
  const parts = placeName.split(',').map((p) => p.trim());
  // Pick the most recognizable city/area name
  return parts[0].replace(/\(.*?\)/g, '').trim() || 'Local Area';
}

/**
 * Dynamically generates 4 realistic, clustered emergency POIs
 * mathematically offset from the user's EXACT lat/lng coordinates (within 120m to 900m).
 * Ensures coordinates always center accurately on Google Maps and the Tactical Radar!
 */
export function getSheltersForLocation(location: LocationState): ShelterPoint[] {
  const { lat, lng, placeName, elevationMeters = 3 } = location;
  const cityName = extractCityName(placeName);
  const userElev = elevationMeters ?? 3;

  // Safe elevation guaranteed > 15m above sea level for tsunami refuge
  const safeElevation = Math.max(22.5, Math.round((userElev + 16.5) * 10) / 10);
  const generalElev = Math.max(16.0, Math.round((userElev + 11.2) * 10) / 10);
  const hospitalElev = Math.max(18.0, Math.round((userElev + 13.0) * 10) / 10);

  return [
    {
      id: `shelter-${lat.toFixed(3)}-tower`,
      name: `${cityName} Certified High Ground Evacuation Tower & Refuge`,
      nameJp: `${cityName} 指定高台避難施設・津波避難ビル`,
      type: 'tsunami_tower',
      lat: lat + 0.0024,
      lng: lng + 0.0028,
      elevationMeters: safeElevation,
      distanceMeters: 280,
      address: `${cityName} Inland District 2-chome`,
      capacity: 1200,
      features: ['High Ground (>20m)', 'Emergency Satellite Wi-Fi', 'Bilingual Support Desk', 'Independent Generator'],
      isOpen: true,
    },
    {
      id: `shelter-${lat.toFixed(3)}-general`,
      name: `${cityName} Central Ward / Municipal Disaster Shelter`,
      nameJp: `${cityName} 防災コミュニティセンター (指定避難所)`,
      type: 'general_shelter',
      lat: lat - 0.0019,
      lng: lng + 0.0021,
      elevationMeters: generalElev,
      distanceMeters: 390,
      address: `${cityName} Civic Plaza 1-1`,
      capacity: 2500,
      features: ['Food & Potable Water Distribution', 'Blankets & First Aid', 'Infant & Elderly Care Area'],
      isOpen: true,
    },
    {
      id: `shelter-${lat.toFixed(3)}-hospital`,
      name: `${cityName} Red Cross Disaster Base Hospital`,
      nameJp: `${cityName} 災害拠点病院 (救命救急センター)`,
      type: 'hospital',
      lat: lat + 0.0055,
      lng: lng - 0.0042,
      elevationMeters: hospitalElev,
      distanceMeters: 850,
      address: `${cityName} Medical Center Boulevard`,
      capacity: 400,
      features: ['24/7 Trauma Emergency Room', 'Multilingual Medical Intake', 'Emergency Surgical Ward'],
      isOpen: true,
    },
    {
      id: `shelter-${lat.toFixed(3)}-store`,
      name: `7-Eleven ${cityName} Station Hub (Disaster Support Station)`,
      nameJp: `セブン-イレブン ${cityName}駅前店 (災害時帰宅支援ステーション)`,
      type: 'convenience_store',
      lat: lat - 0.0009,
      lng: lng - 0.0010,
      elevationMeters: Math.round(userElev * 10) / 10,
      distanceMeters: 120,
      address: `${cityName} Ekimae Shopping Street`,
      features: ['Potable Water Tap', 'Mobile Phone Power Station', 'Emergency Restrooms', 'Emergency Rations'],
      isOpen: true,
    },
  ];
}

/**
 * Returns unambiguous "Where Should I Go?" evacuation routing directive
 */
export function getEvacuationDirective(
  disasterType: DisasterType,
  location: LocationState,
  nearestSafeShelter: ShelterPoint
) {
  const cityName = extractCityName(location.placeName);
  const elev = location.elevationMeters ?? 3;
  const isTsunami = disasterType === 'tsunami';
  const isDangerElev = isTsunami && elev < 15;

  let title = 'Recommended Emergency Destination:';
  let actionText = '';
  let urgency: 'CRITICAL' | 'HIGH' | 'INFO' = 'HIGH';

  if (isDangerElev) {
    urgency = 'CRITICAL';
    title = '🚨 CRITICAL VERTICAL EVACUATION (LOW ELEVATION DETECTED):';
    actionText = `You are at only ${elev.toFixed(1)}m elevation. RUN ON FOOT IMMEDIATELY inland to "${nearestSafeShelter.name}" (${nearestSafeShelter.elevationMeters}m high ground, ${nearestSafeShelter.distanceMeters}m away). If blocked, climb to 3F/4F rooftop of nearest reinforced concrete building immediately.`;
  } else if (isTsunami) {
    urgency = 'HIGH';
    title = '🌊 Tsunami Advisory Evacuation Zone:';
    actionText = `Maintain elevation above 15m. Stay inland and away from ${cityName} harbors, beaches, and river mouths. Gather at "${nearestSafeShelter.name}".`;
  } else if (disasterType === 'earthquake') {
    urgency = 'HIGH';
    title = '🏚️ Post-Earthquake Safe Assembly Area:';
    actionText = `Avoid narrow alleys, brick walls, and glass skyscrapers. Proceed to open refuge plaza at "${nearestSafeShelter.name}" (${nearestSafeShelter.distanceMeters}m away).`;
  } else if (disasterType === 'typhoon') {
    urgency = 'HIGH';
    title = '🌀 Typhoon High-Wind & Flood Refuge:';
    actionText = `Stay off low-lying roadways and underpasses. Relocate to 2nd floor or higher inside "${nearestSafeShelter.name}". Do not venture outdoors.`;
  } else {
    urgency = 'INFO';
    title = '📍 Nearest Designated Disaster Shelter:';
    actionText = `Conditions are normal. For your awareness, the nearest primary disaster shelter is "${nearestSafeShelter.name}" (${nearestSafeShelter.distanceMeters}m from here).`;
  }

  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${nearestSafeShelter.lat},${nearestSafeShelter.lng}`;

  return {
    title,
    actionText,
    destinationName: nearestSafeShelter.name,
    distanceMeters: nearestSafeShelter.distanceMeters,
    elevationMeters: nearestSafeShelter.elevationMeters,
    urgency,
    mapUrl,
  };
}

/**
 * Returns region-adaptive public transit lines based on active location
 */
export function getTransitForLocation(location: LocationState, disasterType: DisasterType) {
  const place = (location.placeName || '').toLowerCase();
  const isSuspended = disasterType === 'earthquake' || disasterType === 'tsunami';
  const isDelayed = disasterType === 'typhoon';

  const suspStyle = 'text-red-400 bg-red-950/80 border-red-800';
  const delayStyle = 'text-amber-400 bg-amber-950/80 border-amber-800';
  const normStyle = 'text-emerald-400 bg-emerald-950/80 border-emerald-800';

  if (place.includes('okinawa') || place.includes('naha') || place.includes('onna')) {
    return [
      {
        name: 'Okinawa Yui Rail (ゆいレール)',
        route: 'Naha Airport ⇄ Tedako-Uranishi',
        status: isSuspended ? 'SUSPENDED (全線運休)' : isDelayed ? 'WIND ADVISORY' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Route 58 Coastal Transit Bus (58号線)',
        route: 'Naha ⇄ Chatan ⇄ Onna Coast',
        status: isSuspended ? 'COASTAL HIGHWAY CLOSED' : isDelayed ? 'FLOOD DELAYS' : 'NORMAL (平常運行)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Naha Port & Island Ferry Lines (那覇港)',
        route: 'Okinawa Main Island ⇄ Kerama / Miyako',
        status: isSuspended ? 'ALL SAILINGS CANCELLED' : isDelayed ? 'ROUGH SEAS ALERT' : 'NORMAL (平常運航)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Naha Airport Express Shuttles',
        route: 'Airport ⇄ Resort Express Highway',
        status: isSuspended ? 'GROUND STOPPED' : isDelayed ? 'WEATHER WARNING' : 'NORMAL (平常運行)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
    ];
  }

  if (place.includes('kyoto') || place.includes('京都')) {
    return [
      {
        name: 'Tokaido Shinkansen (東海道新幹線)',
        route: 'Kyoto ⇄ Shin-Osaka ⇄ Tokyo',
        status: isSuspended ? 'SUSPENDED (運転見合わせ)' : isDelayed ? 'REDUCED SPEED' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'JR Kyoto & Sagano Lines (JR京都線)',
        route: 'Kyoto ⇄ Osaka / Arashiyama',
        status: isSuspended ? 'TRACK INSPECTION HALT' : isDelayed ? 'MAJOR DELAYS' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Kyoto Municipal Subway (烏丸線・東西線)',
        route: 'Karasuma Line ⇄ Tozai Line',
        status: isSuspended ? 'EMERGENCY STOP' : isDelayed ? 'CAUTION' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Keihan Main Line (京阪本線)',
        route: 'Kyoto Sanjo ⇄ Osaka Yodoyabashi',
        status: isSuspended ? 'SUSPENDED' : isDelayed ? 'RIVER FLOOD ADVISORY' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
    ];
  }

  if (place.includes('osaka') || place.includes('umeda') || place.includes('kobe') || place.includes('namba') || place.includes('大阪')) {
    return [
      {
        name: 'Tokaido-Sanyo Shinkansen (山陽・東海道新幹線)',
        route: 'Shin-Osaka ⇄ Hakata ⇄ Tokyo',
        status: isSuspended ? 'SUSPENDED (全線運休)' : isDelayed ? 'STORM DELAYS' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Osaka Loop Line (大阪環状線)',
        route: 'Osaka City Urban Orbital Rail',
        status: isSuspended ? 'EMERGENCY HALT' : isDelayed ? 'HIGH WATER ALERT' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Osaka Metro Midosuji Line (御堂筋線)',
        route: 'Umeda ⇄ Shinsaibashi ⇄ Namba',
        status: isSuspended ? 'SUSPENDED' : isDelayed ? 'REDUCED FREQUENCY' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Hankyu & Hanshin Main Lines',
        route: 'Osaka-Umeda ⇄ Kobe-Sannomiya',
        status: isSuspended ? 'SUSPENDED' : isDelayed ? 'WIND SPEED RESTRICTION' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
    ];
  }

  if (place.includes('hokkaido') || place.includes('sapporo') || place.includes('hakodate') || place.includes('札幌')) {
    return [
      {
        name: 'Hokkaido Shinkansen (北海道新幹線)',
        route: 'Shin-Hakodate-Hokuto ⇄ Shin-Aomori',
        status: isSuspended ? 'SEIKAN TUNNEL HALT' : isDelayed ? 'BLIZZARD/GALE DELAYS' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'JR Hokkaido Rapid Airport Express',
        route: 'New Chitose Airport ⇄ Sapporo',
        status: isSuspended ? 'SUSPENDED' : isDelayed ? 'SPEED RESTRICTION' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Sapporo Municipal Subway (南北・東西・東豊線)',
        route: 'Sapporo City Transit Grid',
        status: isSuspended ? 'SEISMIC CUTOFF STOP' : isDelayed ? 'OPERATIONAL' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
      {
        name: 'Hakodate City Tram & Regional Bus',
        route: 'Hakodate Station ⇄ Goryokaku',
        status: isSuspended ? 'SUSPENDED' : isDelayed ? 'SLIPPERY/FLOOD CAUTION' : 'NORMAL (平常運転)',
        color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
      },
    ];
  }

  // Default: Tokyo / Greater Kanto & National Lines
  return [
    {
      name: 'Tokaido & Tohoku Shinkansen (新幹線)',
      route: 'Tokyo ⇄ Shin-Osaka / Sendai',
      status: isSuspended ? 'SUSPENDED (全線運転見合わせ)' : isDelayed ? 'MAJOR DELAYS' : 'NORMAL (平常運転)',
      color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
    },
    {
      name: 'JR Yamanote & Chuo Lines (山手線・中央線)',
      route: 'Greater Tokyo Metropolitan Loop',
      status: isSuspended ? 'SAFETY INSPECTION HALT' : isDelayed ? 'REDUCED SPEED' : 'NORMAL (平常運転)',
      color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
    },
    {
      name: 'Tokyo Metro & Toei Subway Lines (地下鉄)',
      route: 'All 13 Tokyo Subway Lines',
      status: isSuspended ? 'POWER SAFETY CUT' : isDelayed ? 'MINOR DELAYS' : 'NORMAL (平常運転)',
      color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
    },
    {
      name: 'Narita & Haneda Airport Express Trains',
      route: 'Tokyo ⇄ Narita Skyliner / Haneda Monorail',
      status: isSuspended ? 'SUSPENDED' : isDelayed ? 'HIGH WIND RESTRICTION' : 'NORMAL (平常運転)',
      color: isSuspended ? suspStyle : isDelayed ? delayStyle : normStyle,
    },
  ];
}

/**
 * Returns location-adaptive crowdsourced reports
 */
export function getReportsForLocation(location: LocationState): CrowdsourcedReport[] {
  const cityName = extractCityName(location.placeName);
  const { lat, lng } = location;

  return [
    {
      id: `rep-${lat.toFixed(3)}-1`,
      timestamp: '4 mins ago',
      hazardType: 'downed_wire',
      description: `Downed power line sparking near ${cityName} main station crossing. Extreme electrocution hazard! Avoid walking near power poles.`,
      locationName: `${cityName} Station North Crossing`,
      lat: lat + 0.0012,
      lng: lng + 0.0015,
      reporterName: 'Kenji S. (Local Volunteer)',
      severity: 'high',
      verifiedCount: 12,
    },
    {
      id: `rep-${lat.toFixed(3)}-2`,
      timestamp: '11 mins ago',
      hazardType: 'flooding',
      description: `Road underpass rapidly filling with floodwater (depth approx 45cm). Vehicles stalling, pedestrian access blocked.`,
      locationName: `${cityName} Railway Underpass`,
      lat: lat - 0.0015,
      lng: lng - 0.0018,
      reporterName: 'Maria C. (Traveler)',
      severity: 'high',
      verifiedCount: 19,
    },
    {
      id: `rep-${lat.toFixed(3)}-3`,
      timestamp: '22 mins ago',
      hazardType: 'debris',
      description: `Shattered storefront glass and fallen commercial signage blocking sidewalk. Wear thick-soled shoes.`,
      locationName: `${cityName} Central Shopping Promenade`,
      lat: lat + 0.0022,
      lng: lng - 0.0025,
      reporterName: 'Nguyen V. (Hotel Worker)',
      severity: 'medium',
      verifiedCount: 7,
    },
  ];
}
