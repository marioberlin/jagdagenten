/**
 * Token Storage Service for Sparkles Email Client
 *
 * Provides secure storage for Gmail OAuth tokens using:
 * - Redis as the primary store (distributed, persistent)
 * - In-memory fallback when Redis is unavailable
 * - AES-256-GCM encryption for token data
 *
 * Token lifecycle:
 * - Store: After OAuth callback, encrypt and store tokens
 * - Retrieve: Get decrypted tokens for API calls
 * - Refresh: Update tokens after refresh
 * - Revoke: Delete tokens on logout
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { cache } from '../cache.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// ============ TYPES ============

export interface StoredCredentials {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    email: string;
    name?: string;
    avatar?: string;
}

interface EncryptedData {
    iv: string;
    data: string;
    tag: string;
}

// ============ CONFIGURATION ============

// Session TTL: 30 days (tokens can be refreshed)
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

// Encryption key derived from environment or random (for dev)
const getEncryptionKey = (): Buffer => {
    const secret = process.env.TOKEN_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'sparkles-dev-key-change-in-production';
    // Derive a 32-byte key using SHA-256
    return createHash('sha256').update(secret).digest();
};

// ============ IN-MEMORY FALLBACK ============

// In-memory store for when Redis is unavailable
const memoryStore = new Map<string, { data: EncryptedData; expiresAt: number }>();

// ============ ENCRYPTION ============

function encrypt(data: string): EncryptedData {
    const key = getEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return {
        iv: iv.toString('base64'),
        data: encrypted,
        tag: cipher.getAuthTag().toString('base64'),
    };
}

function decrypt(encrypted: EncryptedData): string {
    const key = getEncryptionKey();
    const iv = Buffer.from(encrypted.iv, 'base64');
    const tag = Buffer.from(encrypted.tag, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// ============ STORAGE KEYS ============

const getTokenKey = (sessionId: string) => `sparkles:token:${sessionId}`;
const getSessionIndexKey = (email: string) => `sparkles:sessions:${email.toLowerCase()}`;

// ============ TOKEN STORAGE SERVICE ============

export const tokenStorage = {
    /**
     * Store credentials for a session
     */
    async store(sessionId: string, credentials: StoredCredentials): Promise<void> {
        const key = getTokenKey(sessionId);
        const encrypted = encrypt(JSON.stringify(credentials));

        try {
            // Try to store in cache (Redis or memory)
            await cache.set(key, encrypted, 'ai'); // Using 'ai' type for long TTL

            // Also store a reference by email for session lookup
            const indexKey = getSessionIndexKey(credentials.email);
            const existingSessions = await cache.get<string[]>(indexKey, 'ai') || [];
            if (!existingSessions.includes(sessionId)) {
                existingSessions.push(sessionId);
                await cache.set(indexKey, existingSessions, 'ai');
            }

            logger.info({ sessionId, email: credentials.email }, 'Token stored securely');
        } catch (error) {
            // Fallback to memory store
            memoryStore.set(sessionId, {
                data: encrypted,
                expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
            });
            logger.warn({ sessionId }, 'Token stored in memory (Redis unavailable)');
        }
    },

    /**
     * Retrieve credentials for a session
     */
    async retrieve(sessionId: string): Promise<StoredCredentials | null> {
        const key = getTokenKey(sessionId);

        try {
            // Try cache first
            const encrypted = await cache.get<EncryptedData>(key, 'ai');
            if (encrypted) {
                const decrypted = decrypt(encrypted);
                return JSON.parse(decrypted);
            }
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to retrieve token from cache');
        }

        // Fallback to memory store
        const memEntry = memoryStore.get(sessionId);
        if (memEntry && memEntry.expiresAt > Date.now()) {
            try {
                const decrypted = decrypt(memEntry.data);
                return JSON.parse(decrypted);
            } catch {
                memoryStore.delete(sessionId);
            }
        }

        return null;
    },

    /**
     * Update credentials (e.g., after token refresh)
     */
    async update(sessionId: string, updates: Partial<StoredCredentials>): Promise<boolean> {
        const existing = await this.retrieve(sessionId);
        if (!existing) {
            return false;
        }

        const updated = { ...existing, ...updates };
        await this.store(sessionId, updated);
        return true;
    },

    /**
     * Revoke and delete credentials
     */
    async revoke(sessionId: string): Promise<void> {
        const key = getTokenKey(sessionId);

        try {
            // Get credentials to update session index
            const credentials = await this.retrieve(sessionId);
            if (credentials) {
                const indexKey = getSessionIndexKey(credentials.email);
                const sessions = await cache.get<string[]>(indexKey, 'ai') || [];
                const updated = sessions.filter((s) => s !== sessionId);
                if (updated.length > 0) {
                    await cache.set(indexKey, updated, 'ai');
                } else {
                    await cache.delete(indexKey);
                }
            }

            // Delete the token
            await cache.delete(key);
            logger.info({ sessionId }, 'Token revoked');
        } catch (error) {
            logger.error({ sessionId, error }, 'Failed to revoke token from cache');
        }

        // Also remove from memory store
        memoryStore.delete(sessionId);
    },

    /**
     * Check if a session exists
     */
    async exists(sessionId: string): Promise<boolean> {
        return (await this.retrieve(sessionId)) !== null;
    },

    /**
     * Get all sessions for an email (for multi-account management)
     */
    async getSessionsForEmail(email: string): Promise<string[]> {
        const indexKey = getSessionIndexKey(email);
        try {
            return await cache.get<string[]>(indexKey, 'ai') || [];
        } catch {
            return [];
        }
    },

    /**
     * Clean up expired tokens from memory store
     */
    cleanup(): void {
        const now = Date.now();
        for (const [sessionId, entry] of memoryStore) {
            if (entry.expiresAt <= now) {
                memoryStore.delete(sessionId);
                logger.debug({ sessionId }, 'Expired token cleaned up from memory');
            }
        }
    },
};

// Run cleanup every hour
setInterval(() => tokenStorage.cleanup(), 60 * 60 * 1000);

export default tokenStorage;
