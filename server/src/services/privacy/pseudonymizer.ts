/**
 * Pseudonymizer Service
 *
 * Separates user identity from analytics data using analytics keys.
 * Implements EDPB-compliant pseudonymization for user privacy.
 *
 * Key Principles:
 * - Analytics keys are separate from user IDs
 * - Keys can be rotated without losing aggregates
 * - No way to reverse-engineer user identity from analytics
 *
 * Reference: EDPB Guidelines 4/2019 on Article 25 GDPR
 */

import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsKey {
    userId: string;
    analyticsKey: string;
    createdAt: Date;
    rotatedAt: Date;
}

export interface PseudonymizedData {
    analyticsKey: string;
    data: Record<string, unknown>;
    timestamp: string;
}

// ---------------------------------------------------------------------------
// Key Generation
// ---------------------------------------------------------------------------

/**
 * Generate a new analytics key
 * Uses UUID v4 for cryptographic randomness
 */
export function generateAnalyticsKey(): string {
    return randomUUID();
}

/**
 * Create an analytics key record for a user
 */
export function createAnalyticsKeyRecord(userId: string): AnalyticsKey {
    const now = new Date();
    return {
        userId,
        analyticsKey: generateAnalyticsKey(),
        createdAt: now,
        rotatedAt: now,
    };
}

/**
 * Rotate an analytics key (e.g., monthly for extra privacy)
 */
export function rotateAnalyticsKey(existing: AnalyticsKey): AnalyticsKey {
    return {
        ...existing,
        analyticsKey: generateAnalyticsKey(),
        rotatedAt: new Date(),
    };
}

// ---------------------------------------------------------------------------
// Data Pseudonymization
// ---------------------------------------------------------------------------

/**
 * Pseudonymize data by replacing userId with analyticsKey
 *
 * @param data - Original data with userId
 * @param analyticsKey - Analytics key to use
 * @returns Pseudonymized data
 */
export function pseudonymize<T extends { userId: string }>(
    data: T,
    analyticsKey: string
): Omit<T, 'userId'> & { analyticsKey: string } {
    const { userId: _userId, ...rest } = data;
    return {
        ...rest,
        analyticsKey,
    } as Omit<T, 'userId'> & { analyticsKey: string };
}

/**
 * Pseudonymize an array of data items
 */
export function pseudonymizeMany<T extends { userId: string }>(
    items: T[],
    keyMap: Map<string, string>
): Array<Omit<T, 'userId'> & { analyticsKey: string }> {
    return items.map(item => {
        const analyticsKey = keyMap.get(item.userId);
        if (!analyticsKey) {
            throw new Error(`No analytics key found for user: ${item.userId}`);
        }
        return pseudonymize(item, analyticsKey);
    });
}

// ---------------------------------------------------------------------------
// Key Lookup (In-Memory Cache)
// ---------------------------------------------------------------------------

// Note: In production, this would be backed by the database
const keyCache = new Map<string, AnalyticsKey>();

/**
 * Get or create analytics key for a user
 */
export function getOrCreateAnalyticsKey(userId: string): string {
    let record = keyCache.get(userId);

    if (!record) {
        record = createAnalyticsKeyRecord(userId);
        keyCache.set(userId, record);
    }

    return record.analyticsKey;
}

/**
 * Get analytics key only (returns undefined if not exists)
 */
export function getAnalyticsKey(userId: string): string | undefined {
    return keyCache.get(userId)?.analyticsKey;
}

/**
 * Check if key rotation is due (e.g., after 30 days)
 */
export function isKeyRotationDue(
    record: AnalyticsKey,
    rotationIntervalDays: number = 30
): boolean {
    const daysSinceRotation =
        (Date.now() - record.rotatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRotation >= rotationIntervalDays;
}

/**
 * Perform key rotation if due
 */
export function rotateKeyIfDue(userId: string): boolean {
    const record = keyCache.get(userId);
    if (!record) return false;

    if (isKeyRotationDue(record)) {
        const rotated = rotateAnalyticsKey(record);
        keyCache.set(userId, rotated);
        return true;
    }

    return false;
}

// ---------------------------------------------------------------------------
// Data Sanitization
// ---------------------------------------------------------------------------

/**
 * Fields that should never appear in analytics data
 */
const SENSITIVE_FIELDS = [
    'userId',
    'email',
    'name',
    'phone',
    'address',
    'ipAddress',
    'deviceId',
    'raw_lat',
    'raw_lng',
    'exactLocation',
    'password',
    'token',
];

/**
 * Remove sensitive fields from data before analytics
 */
export function sanitizeForAnalytics<T extends Record<string, unknown>>(
    data: T
): Partial<T> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        if (!SENSITIVE_FIELDS.includes(key)) {
            sanitized[key] = value;
        }
    }

    return sanitized as Partial<T>;
}

/**
 * Check if data contains any sensitive fields
 */
export function hasSensitiveFields(data: Record<string, unknown>): boolean {
    return Object.keys(data).some(key => SENSITIVE_FIELDS.includes(key));
}

// ---------------------------------------------------------------------------
// Hash Functions (For Irreversible Anonymization)
// ---------------------------------------------------------------------------

/**
 * Create a hash that cannot be reversed to original value
 * Used for completely anonymous statistics
 */
export async function createAnonymousHash(
    value: string,
    salt: string = 'jagd-agenten-anonymous'
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default {
    generateAnalyticsKey,
    createAnalyticsKeyRecord,
    rotateAnalyticsKey,
    pseudonymize,
    pseudonymizeMany,
    getOrCreateAnalyticsKey,
    getAnalyticsKey,
    isKeyRotationDue,
    rotateKeyIfDue,
    sanitizeForAnalytics,
    hasSensitiveFields,
    createAnonymousHash,
};
