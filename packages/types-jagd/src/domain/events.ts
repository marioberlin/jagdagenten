export type EventType = 'drueckjagd' | 'ansitz_group' | 'work_day' | 'dog_training' | 'other';
export type EventRole = 'stand' | 'treiber' | 'hundefuehrer' | 'jagdleiter' | 'guest';

export interface PackEvent {
  id: string;
  organizerId: string;
  name: string;
  eventType: EventType;
  startTime: string;
  endTime?: string;
  locationName?: string;
  geoLat?: number;
  geoLon?: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  safetyRules: Record<string, unknown>;
  createdAt: string;
}

export interface SafetyCheckin {
  participantId: string;
  eventId: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  lastActivity?: string;
}

export interface EmergencyRule {
  inactivityTimeoutMinutes: number;
  escalationChain: EscalationStep[];
}

export interface EscalationStep {
  type: 'push_notification' | 'sms' | 'organizer_alert';
  delayMinutes: number;
  target?: string;
}
