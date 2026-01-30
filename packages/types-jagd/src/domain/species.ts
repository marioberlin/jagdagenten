export type WildSpecies =
  | 'rehwild' | 'rotwild' | 'damwild' | 'schwarzwild' | 'gamswild' | 'muffelwild'
  | 'feldhase' | 'wildkaninchen' | 'fuchs' | 'dachs' | 'marder' | 'waschbaer'
  | 'fasan' | 'rebhuhn' | 'stockente' | 'wildgans' | 'ringeltaube' | 'kraehe'
  | 'other';

export interface SightingData {
  species: WildSpecies;
  count: number;
  confidence: 'sicher' | 'wahrscheinlich' | 'unsicher';
  behavior?: string;
  notes?: string;
}

export interface HarvestData {
  species: WildSpecies;
  sex?: 'male' | 'female' | 'unknown';
  estimatedAge?: string;
  weight?: number;
  antlerPoints?: number;
  shotDistance?: number;
  caliber?: string;
  notes?: string;
}

export interface WildbretRecord {
  harvestEventId: string;
  species: WildSpecies;
  weight: number;
  coolingStarted: string;
  processingSteps: ProcessingStep[];
  handover?: HandoverInfo;
  qrCode?: string;
}

export interface ProcessingStep {
  step: string;
  completedAt: string;
  notes?: string;
}

export interface HandoverInfo {
  recipientName: string;
  recipientType: 'eigenverbrauch' | 'direktvermarktung' | 'wildhaendler' | 'other';
  handoverTime: string;
  temperature?: number;
  documentUrl?: string;
}
