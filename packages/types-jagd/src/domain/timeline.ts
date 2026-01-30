import type { GeoScope } from './geo.js';

export type SessionType = 'ansitz' | 'pirsch' | 'drueckjagd' | 'other';
export type TimelineEventType = 'sighting' | 'shot' | 'harvest' | 'note' | 'processing' | 'handover';
export type PrivacyMode = 'private' | 'team_event_only' | 'public_blurred';

export interface HuntSession {
  id: string;
  userId: string;
  sessionType: SessionType;
  startTime: string;
  endTime?: string;
  geo: GeoScope;
  participants: string[];
  privacyMode: PrivacyMode;
  weatherSnapshot?: Record<string, unknown>;
  equipmentSnapshot?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent<T = Record<string, unknown>> {
  id: string;
  sessionId: string;
  eventType: TimelineEventType;
  time: string;
  geo: GeoScope;
  data: T;
  photos: string[];
  createdAt: string;
}
