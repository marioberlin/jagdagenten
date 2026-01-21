/**
 * ID generation utilities for iCloud API
 */

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers and Node.js 19+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short ID (like Apple's internal IDs)
 */
export function generateShortId(length: number = 22): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a client ID in Apple's format
 */
export function generateClientId(): string {
  return generateUUID().toUpperCase();
}

/**
 * Generate a device ID
 */
export function generateDeviceId(): string {
  return generateUUID();
}

/**
 * Generate a contact ID
 */
export function generateContactId(): string {
  return generateUUID().toUpperCase();
}

/**
 * Generate a calendar event GUID
 */
export function generateEventGuid(): string {
  return generateUUID().toUpperCase();
}

/**
 * Generate a reminder GUID
 */
export function generateReminderGuid(): string {
  return generateUUID().toUpperCase();
}

/**
 * Generate a Drive item ID
 */
export function generateDriveItemId(): string {
  // Drive IDs use a specific format
  return `FOLDER::${generateShortId(24)}`;
}

/**
 * Generate a CloudKit record name
 */
export function generateRecordName(): string {
  return generateUUID().toUpperCase();
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return generateShortId(32);
}

/**
 * Generate an etag (entity tag for versioning)
 */
export function generateEtag(): string {
  return `C=${Date.now()}`;
}

/**
 * Parse a compound ID (like FOLDER::ABC123)
 */
export function parseCompoundId(compoundId: string): {
  type: string;
  id: string;
} {
  const parts = compoundId.split('::');
  if (parts.length === 2) {
    return { type: parts[0], id: parts[1] };
  }
  return { type: 'UNKNOWN', id: compoundId };
}

/**
 * Create a compound ID
 */
export function createCompoundId(type: string, id: string): string {
  return `${type}::${id}`;
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Normalize a UUID (uppercase, with dashes)
 */
export function normalizeUUID(id: string): string {
  // Remove any dashes and convert to uppercase
  const clean = id.replace(/-/g, '').toUpperCase();

  // Insert dashes at correct positions
  return [
    clean.slice(0, 8),
    clean.slice(8, 12),
    clean.slice(12, 16),
    clean.slice(16, 20),
    clean.slice(20),
  ].join('-');
}

/**
 * Generate a correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${generateShortId(8)}`;
}

/**
 * Generate an idempotency key for safe retries
 */
export function generateIdempotencyKey(): string {
  return `${generateUUID()}-${Date.now()}`;
}
