export interface WindSnapshot {
  direction: number; // degrees 0-360
  speed: number; // km/h
  gusts?: number;
  timestamp: string;
}

export interface TwilightWindow {
  civilDawn: string;
  sunrise: string;
  sunset: string;
  civilDusk: string;
  date: string;
}

export type MoonPhase = 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export interface ConditionsSnapshot {
  wind: WindSnapshot;
  twilight: TwilightWindow;
  moonPhase: MoonPhase;
  moonIllumination: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  cloudCover: number;
  pressure: number;
  visibility: number;
  timestamp: string;
}
