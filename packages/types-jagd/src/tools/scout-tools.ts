import type { ConditionsSnapshot } from '../domain/weather.js';

export interface GetConditionsArgs {
  lat: number;
  lon: number;
  standId?: string;
}

export interface RecommendPlanArgs {
  lat: number;
  lon: number;
  sessionType?: string;
  standIds?: string[];
  preferences?: Record<string, unknown>;
}

export interface ScoutPlan {
  recommendedStandId?: string;
  recommendedWindow: { start: string; end: string };
  conditions: ConditionsSnapshot;
  huntabilityScore: number;
  reasoning: string;
  windWarning?: string;
}
