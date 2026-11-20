export type Language = 'en' | 'ja' | 'zh' | 'ko' | 'vi' | 'tl';

export type Persona = 'traveler' | 'worker' | 'resident';

export type DisasterType = 'normal' | 'earthquake' | 'tsunami' | 'typhoon';

export interface LocationState {
  lat: number;
  lng: number;
  placeName: string;
  elevationMeters: number;
  prefecture?: string;
  isCoastal?: boolean;
}

export interface SurvivalStep {
  step: number;
  action: string;
  reason: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  icon: 'shield' | 'arrow-up' | 'alert' | 'plug' | 'droplet' | 'phone' | 'home';
}

export interface JargonTerm {
  term: string;
  kana?: string;
  romaji?: string;
  explanation: string;
  practicalImpact: string;
}

export interface TyphoonTask {
  id: string;
  category: string;
  task: string;
  urgency: string;
  hoursOut: number;
}

export interface EmergencyContact {
  label: string;
  number: string;
  note: string;
  type: 'police' | 'fire' | 'coastguard' | 'tourist' | 'embassy';
}

export interface AIBriefing {
  title: string;
  disasterType: DisasterType;
  alertLevel: string;
  elevationWarning?: string;
  summary: string;
  survivalSteps: SurvivalStep[];
  jargonDecoder: JargonTerm[];
  typhoonChecklist?: TyphoonTask[];
  contacts: EmergencyContact[];
  generatedAt: string;
  isAiGenerated: boolean;
}

export interface HazardScanResult {
  signType: string;
  originalJapanese: string;
  translation: string;
  simpleEvacuationSteps: string[];
  detectedHazards: {
    type: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    detail: string;
  }[];
  immediateAction: string;
}

export interface VoiceAssistResult {
  answerText: string;
  spokenText: string;
  criticalPoint: string;
  actionSuggested: string;
}

export interface ShelterPoint {
  id: string;
  name: string;
  nameJp: string;
  type: 'tsunami_tower' | 'general_shelter' | 'hospital' | 'convenience_store';
  lat: number;
  lng: number;
  elevationMeters: number;
  distanceMeters: number;
  address: string;
  capacity?: number;
  features: string[];
  isOpen: boolean;
}

export interface CrowdsourcedReport {
  id: string;
  timestamp: string;
  hazardType: 'flooding' | 'road_block' | 'debris' | 'downed_wire' | 'structural';
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  reporterName: string;
  severity: 'high' | 'medium' | 'low';
  verifiedCount: number;
}
