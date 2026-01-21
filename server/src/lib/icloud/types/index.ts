/**
 * iCloud API Type Definitions
 *
 * Comprehensive type definitions for all iCloud services.
 */

// Session & Authentication
export * from './session';
export * from './auth';

// iCloud Services
export * from './contacts';
export * from './calendar';
export * from './mail';
export * from './drive';
export * from './notes';
export * from './reminders';
export * from './photos';
export * from './findmy';
export * from './push';

// Common callback type for backward compatibility
export type Callback<T> = (error: Error | null, result?: T) => void;

// Generic response wrapper
export interface ICloudResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

// Error codes
export type ICloudErrorCode =
  | 'AUTH_REQUIRED'
  | 'TWO_FACTOR_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_2FA_CODE'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'CONFLICT'
  | 'INVALID_REQUEST'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'
  | 'NOT_INITIALIZED';

// Service status
export interface ServiceStatus {
  name: string;
  available: boolean;
  url?: string;
  lastCheck?: Date;
  error?: string;
}

// Progress tracking
export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}

// Generic list options
export interface ListOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Generic search options
export interface SearchOptions extends ListOptions {
  query: string;
  fields?: string[];
}

// Sync state
export interface SyncState {
  lastSyncTime: Date;
  syncToken?: string;
  changeToken?: string;
  hasChanges: boolean;
}
