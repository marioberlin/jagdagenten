import type { SessionType, TimelineEventType } from '../domain/timeline.js';
import type { GeoScope } from '../domain/geo.js';

export interface StartSessionArgs {
  sessionType: SessionType;
  geo?: GeoScope;
  participants?: string[];
  privacyMode?: 'private' | 'team_event_only' | 'public_blurred';
}

export interface LogEventArgs {
  sessionId: string;
  eventType: TimelineEventType;
  data: Record<string, unknown>;
  geo?: GeoScope;
  photos?: string[];
}

export interface EndSessionArgs {
  sessionId: string;
  notes?: string;
  autoRecap?: boolean;
}
