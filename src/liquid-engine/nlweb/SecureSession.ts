/**
 * SecureSession.ts
 * 
 * Persistent session storage for the Secure NLWeb pipeline.
 * Combines Guard Dog language preference with user memory preferences.
 */

import type { SecureSession } from './NLWebOrchestrator';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SESSION_STORAGE_KEY = 'liquid-glass-nlweb-session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new session with default values.
 */
export function createSession(): SecureSession {
    return {
        sessionId: `nlweb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        preferredLanguage: null,
        userPreferences: {},
        blockedAttempts: 0,
        lastActive: Date.now(),
    };
}

/**
 * Load session from localStorage, creating a new one if needed.
 */
export function loadSession(): SecureSession {
    try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) {
            return createSession();
        }

        const session = JSON.parse(stored) as SecureSession;

        // Check if session has expired
        if (Date.now() - session.lastActive > SESSION_TTL_MS) {
            console.log('[SecureSession] Session expired, creating new one');
            return createSession();
        }

        return session;
    } catch (error) {
        console.warn('[SecureSession] Failed to load session:', error);
        return createSession();
    }
}

/**
 * Save session to localStorage.
 */
export function saveSession(session: SecureSession): void {
    try {
        session.lastActive = Date.now();
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
        console.warn('[SecureSession] Failed to save session:', error);
    }
}

/**
 * Clear the session from localStorage.
 */
export function clearSession(): void {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
        console.warn('[SecureSession] Failed to clear session:', error);
    }
}

// ============================================================================
// PREFERENCE HELPERS
// ============================================================================

/**
 * Get a user preference from the session.
 */
export function getPreference(session: SecureSession, key: string): string | undefined {
    return session.userPreferences[key];
}

/**
 * Set a user preference in the session.
 * Returns a new session object (immutable update).
 */
export function setPreference(session: SecureSession, key: string, value: string): SecureSession {
    return {
        ...session,
        userPreferences: {
            ...session.userPreferences,
            [key]: value,
        },
        lastActive: Date.now(),
    };
}

/**
 * Remove a user preference from the session.
 * Returns a new session object (immutable update).
 */
export function removePreference(session: SecureSession, key: string): SecureSession {
    const { [key]: _, ...rest } = session.userPreferences;
    return {
        ...session,
        userPreferences: rest,
        lastActive: Date.now(),
    };
}

// ============================================================================
// MEMORY DETECTION UTILITIES
// ============================================================================

/**
 * Check if a user message contains a preference-saving request.
 * Examples: "remember I'm vegetarian", "I prefer dark mode"
 */
export function detectMemoryRequest(message: string): {
    isMemoryRequest: boolean;
    key?: string;
    value?: string;
} {
    const patterns = [
        // "remember I'm X" or "remember that I am X"
        /remember\s+(?:that\s+)?i(?:'m|\s+am)\s+(.+)/i,
        // "I prefer X"
        /i\s+prefer\s+(.+)/i,
        // "save that I X"
        /save\s+(?:that\s+)?i\s+(.+)/i,
        // "note that I X"
        /note\s+(?:that\s+)?i\s+(.+)/i,
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            const rawValue = match[1].trim();
            // Try to extract key-value (e.g., "vegetarian" -> key: "diet", value: "vegetarian")
            const { key, value } = inferPreferenceKeyValue(rawValue);
            return { isMemoryRequest: true, key, value };
        }
    }

    return { isMemoryRequest: false };
}

/**
 * Attempt to infer a preference key from a value.
 */
function inferPreferenceKeyValue(rawValue: string): { key: string; value: string } {
    const valueLower = rawValue.toLowerCase();

    // Diet-related
    if (/vegetarian|vegan|pescatarian|gluten.?free|dairy.?free/.test(valueLower)) {
        return { key: 'diet', value: rawValue };
    }

    // Theme-related
    if (/dark\s*mode|light\s*mode|dark\s*theme|light\s*theme/.test(valueLower)) {
        return { key: 'theme_preference', value: valueLower.includes('dark') ? 'dark' : 'light' };
    }

    // Language-related
    if (/speak\s+(\w+)|prefer\s+(\w+)\s+language/.test(valueLower)) {
        return { key: 'language', value: rawValue };
    }

    // Generic fallback
    return { key: 'preference', value: rawValue };
}
