/**
 * Push notification types for iCloud Push API
 */

export interface PushNotification {
  cmd: PushCommand;
  userInfo?: Record<string, unknown>;
  payload?: PushPayload;
  messageId: string;
  receivedAt: number;
}

export type PushCommand =
  | 'REMINDER_ADDED'
  | 'REMINDER_MODIFIED'
  | 'REMINDER_DELETED'
  | 'REMINDER_COMPLETED'
  | 'CALENDAR_EVENT_ADDED'
  | 'CALENDAR_EVENT_MODIFIED'
  | 'CALENDAR_EVENT_DELETED'
  | 'CALENDAR_INVITE_RECEIVED'
  | 'CALENDAR_INVITE_REPLY'
  | 'CONTACT_ADDED'
  | 'CONTACT_MODIFIED'
  | 'CONTACT_DELETED'
  | 'MAIL_RECEIVED'
  | 'MAIL_READ'
  | 'MAIL_FLAGGED'
  | 'MAIL_DELETED'
  | 'NOTE_ADDED'
  | 'NOTE_MODIFIED'
  | 'NOTE_DELETED'
  | 'DRIVE_FILE_ADDED'
  | 'DRIVE_FILE_MODIFIED'
  | 'DRIVE_FILE_DELETED'
  | 'DRIVE_FILE_SHARED'
  | 'PHOTO_ADDED'
  | 'PHOTO_DELETED'
  | 'ALBUM_CREATED'
  | 'ALBUM_SHARED'
  | 'DEVICE_LOCATION_UPDATED'
  | 'DEVICE_BATTERY_LOW'
  | 'DEVICE_FOUND'
  | 'DEVICE_LOST'
  | 'FRIEND_LOCATION_UPDATED'
  | 'FRIEND_ARRIVED'
  | 'FRIEND_LEFT'
  | 'SYNC_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export interface PushPayload {
  aps?: {
    alert?: string | APSAlert;
    badge?: number;
    sound?: string;
    'content-available'?: number;
    'mutable-content'?: number;
  };
  data?: Record<string, unknown>;
  serviceId?: string;
  zoneId?: string;
  subscriptionId?: string;
  recordType?: string;
  recordName?: string;
}

export interface APSAlert {
  title?: string;
  body?: string;
  'title-loc-key'?: string;
  'title-loc-args'?: string[];
  'loc-key'?: string;
  'loc-args'?: string[];
}

export interface PushTopicSubscription {
  topic: string;
  enabled: boolean;
  subscriptionId?: string;
}

export type PushTopic =
  | 'com.apple.calendar'
  | 'com.apple.reminders'
  | 'com.apple.contacts'
  | 'com.apple.mail'
  | 'com.apple.notes'
  | 'com.apple.clouddocs'
  | 'com.apple.photos'
  | 'com.apple.findmy'
  | 'com.apple.fmf';

export interface PushConnection {
  connected: boolean;
  connectionId: string;
  topics: PushTopicSubscription[];
  reconnectAttempts: number;
  lastConnectedAt?: number;
  lastMessageAt?: number;
}

export interface PushRegistrationRequest {
  pushToken: string;
  appVersion: string;
  deviceId: string;
  topics: PushTopic[];
}

export interface PushRegistrationResponse {
  success: boolean;
  subscriptionId: string;
  topics: PushTopicSubscription[];
}

export interface PushTokenRefreshRequest {
  oldToken: string;
  newToken: string;
  subscriptionId: string;
}

export interface PushHandler {
  command: PushCommand | PushCommand[];
  handler: (notification: PushNotification) => void | Promise<void>;
}

export interface PushEventEmitterEvents {
  notification: (notification: PushNotification) => void;
  connected: () => void;
  disconnected: (reason?: string) => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
}

export interface PushServiceConfig {
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  topics?: PushTopic[];
}

export const DEFAULT_PUSH_CONFIG: Required<PushServiceConfig> = {
  reconnectIntervalMs: 5000,
  maxReconnectAttempts: 10,
  heartbeatIntervalMs: 30000,
  topics: [
    'com.apple.calendar',
    'com.apple.reminders',
    'com.apple.contacts',
    'com.apple.mail',
    'com.apple.notes',
    'com.apple.clouddocs',
    'com.apple.photos',
    'com.apple.findmy',
  ],
};

// CloudKit notification types
export interface CloudKitNotification {
  notificationID: string;
  containerIdentifier: string;
  notificationType: 'query' | 'recordZone' | 'database';
  isPruned: boolean;
  queryNotificationReason?: 'recordCreated' | 'recordUpdated' | 'recordDeleted';
  recordFields?: Record<string, unknown>;
  subscriptionID?: string;
  zoneID?: {
    zoneName: string;
    ownerRecordName: string;
  };
}

export interface CloudKitSubscription {
  subscriptionID: string;
  subscriptionType: 'query' | 'zone' | 'database';
  zoneID?: {
    zoneName: string;
    ownerRecordName: string;
  };
  firesOn?: ('create' | 'update' | 'delete')[];
  query?: {
    recordType: string;
    filterBy?: unknown[];
    sortBy?: unknown[];
  };
}

// Long polling types
export interface LongPollRequest {
  clientId: string;
  lastSequenceNumber?: number;
  timeout?: number;
}

export interface LongPollResponse {
  notifications: PushNotification[];
  sequenceNumber: number;
  hasMore: boolean;
}
