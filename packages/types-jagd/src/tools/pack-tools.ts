import type { EventType, EventRole } from '../domain/events.js';

export interface CreateEventArgs {
  name: string;
  eventType: EventType;
  startTime: string;
  endTime?: string;
  locationName?: string;
  geoLat?: number;
  geoLon?: number;
  safetyRules?: Record<string, unknown>;
}

export interface AssignRoleArgs {
  eventId: string;
  userId: string;
  role: EventRole;
}
