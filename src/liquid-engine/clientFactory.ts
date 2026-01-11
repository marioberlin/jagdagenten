/**
 * LiquidClientFactory
 *
 * Session-scoped factory for LiquidClient instances.
 * Prevents context leakage between users in multi-tenant scenarios.
 *
 * @see ADR-005: Session-Scoped LiquidClient
 */

import { LiquidClient } from './client';

interface ClientSession {
    client: LiquidClient;
    createdAt: number;
    lastAccess: number;
}

interface FactoryConfig {
    /** Session timeout in milliseconds (default: 30 minutes) */
    sessionTTL: number;
    /** Cleanup interval in milliseconds (default: 5 minutes) */
    cleanupInterval: number;
}

const DEFAULT_CONFIG: FactoryConfig = {
    sessionTTL: 30 * 60 * 1000,      // 30 minutes
    cleanupInterval: 5 * 60 * 1000,  // 5 minutes
};

export class LiquidClientFactory {
    private sessions = new Map<string, ClientSession>();
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;
    private config: FactoryConfig;

    constructor(config: Partial<FactoryConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.startCleanupTimer();
    }

    /**
     * Get or create a LiquidClient for the given session ID
     */
    getClient(sessionId: string): LiquidClient {
        const existing = this.sessions.get(sessionId);

        if (existing) {
            existing.lastAccess = Date.now();
            return existing.client;
        }

        const client = new LiquidClient();
        const session: ClientSession = {
            client,
            createdAt: Date.now(),
            lastAccess: Date.now(),
        };

        this.sessions.set(sessionId, session);
        return client;
    }

    /**
     * Check if a session exists
     */
    hasSession(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }

    /**
     * Get session metadata (for debugging/monitoring)
     */
    getSession(sessionId: string): ClientSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Destroy a specific session
     */
    destroySession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.client.reset();
            this.sessions.delete(sessionId);
            return true;
        }
        return false;
    }

    /**
     * Get the number of active sessions
     */
    getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Get all session IDs (for debugging/monitoring)
     */
    getSessionIds(): string[] {
        return Array.from(this.sessions.keys());
    }

    /**
     * Clean up stale sessions that haven't been accessed within TTL
     */
    cleanup(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastAccess > this.config.sessionTTL) {
                session.client.reset();
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[LiquidClientFactory] Cleaned up ${cleaned} stale sessions`);
        }

        return cleaned;
    }

    /**
     * Shutdown the factory and clean up all sessions
     */
    shutdown(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        for (const session of this.sessions.values()) {
            session.client.reset();
        }
        this.sessions.clear();

        console.log('[LiquidClientFactory] Shutdown complete');
    }

    private startCleanupTimer(): void {
        // Only start timer in browser environment
        if (typeof window !== 'undefined') {
            this.cleanupTimer = setInterval(() => {
                this.cleanup();
            }, this.config.cleanupInterval);
        }
    }
}

// Default factory instance
export const liquidClientFactory = new LiquidClientFactory();

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older environments
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
