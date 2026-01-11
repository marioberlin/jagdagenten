import { describe, it, expect, beforeEach } from 'vitest';

// Mock types for testing
type RateLimitTier = 'user' | 'session' | 'ip';

interface TieredRateLimitConfig {
    user: { max: number; windowMs: number };
    session: { max: number; windowMs: number };
    ip: { max: number; windowMs: number };
}

// Tiered Rate Limit Configuration (matches server/src/index.ts)
const RATE_LIMITS: TieredRateLimitConfig = {
    user: { max: 100, windowMs: 15 * 60 * 1000 },    // Authenticated: 100/15min
    session: { max: 50, windowMs: 15 * 60 * 1000 },  // Session token: 50/15min
    ip: { max: 30, windowMs: 15 * 60 * 1000 }        // Anonymous: 30/15min
};

/**
 * Extract rate limit key and tier from request headers
 * This mirrors the logic in server/src/index.ts
 */
function getRateLimitKeyAndTier(headers: Record<string, string | undefined>): { key: string; tier: RateLimitTier } {
    // Priority 1: Authenticated user ID from Authorization header
    const authHeader = headers['Authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const userId = token.length > 10 ? token.substring(0, 10) : token;
        return { key: `ratelimit:user:${userId}`, tier: 'user' };
    }

    // Priority 2: Session token for tracked anonymous users
    const sessionToken = headers['X-Session-Token'];
    if (sessionToken) {
        return { key: `ratelimit:session:${sessionToken}`, tier: 'session' };
    }

    // Priority 3: IP address fallback
    const forwardedFor = headers['X-Forwarded-For'];
    const ip = forwardedFor?.split(',')[0]?.trim()
             || headers['X-Real-IP']
             || 'unknown';
    return { key: `ratelimit:ip:${ip}`, tier: 'ip' };
}

describe('Tiered Rate Limiting', () => {
    describe('getRateLimitKeyAndTier', () => {
        it('returns user tier for Bearer token', () => {
            const headers = { 'Authorization': 'Bearer user-token-12345' };
            const result = getRateLimitKeyAndTier(headers);

            expect(result.tier).toBe('user');
            expect(result.key).toBe('ratelimit:user:user-token');
        });

        it('returns session tier for X-Session-Token', () => {
            const headers = { 'X-Session-Token': 'session-abc123' };
            const result = getRateLimitKeyAndTier(headers);

            expect(result.tier).toBe('session');
            expect(result.key).toBe('ratelimit:session:session-abc123');
        });

        it('returns ip tier for X-Forwarded-For', () => {
            const headers = { 'X-Forwarded-For': '192.168.1.1, 10.0.0.1' };
            const result = getRateLimitKeyAndTier(headers);

            expect(result.tier).toBe('ip');
            expect(result.key).toBe('ratelimit:ip:192.168.1.1');
        });

        it('returns ip tier for X-Real-IP', () => {
            const headers = { 'X-Real-IP': '10.0.0.5' };
            const result = getRateLimitKeyAndTier(headers);

            expect(result.tier).toBe('ip');
            expect(result.key).toBe('ratelimit:ip:10.0.0.5');
        });

        it('returns ip tier with unknown for no headers', () => {
            const headers = {};
            const result = getRateLimitKeyAndTier(headers);

            expect(result.tier).toBe('ip');
            expect(result.key).toBe('ratelimit:ip:unknown');
        });

        it('prioritizes user over session', () => {
            const headers = {
                'Authorization': 'Bearer user-token-12345',
                'X-Session-Token': 'session-abc123'
            };
            const result = getRateLimitKeyAndTier(headers);

            expect(result.tier).toBe('user');
        });

        it('prioritizes session over ip', () => {
            const headers = {
                'X-Session-Token': 'session-abc123',
                'X-Forwarded-For': '192.168.1.1'
            };
            const result = getRateLimitKeyAndTier(headers);

            expect(result.tier).toBe('session');
        });
    });

    describe('Rate Limit Configuration', () => {
        it('user tier has highest limit', () => {
            expect(RATE_LIMITS.user.max).toBe(100);
            expect(RATE_LIMITS.user.max).toBeGreaterThan(RATE_LIMITS.session.max);
            expect(RATE_LIMITS.user.max).toBeGreaterThan(RATE_LIMITS.ip.max);
        });

        it('session tier has medium limit', () => {
            expect(RATE_LIMITS.session.max).toBe(50);
            expect(RATE_LIMITS.session.max).toBeGreaterThan(RATE_LIMITS.ip.max);
        });

        it('ip tier has lowest limit', () => {
            expect(RATE_LIMITS.ip.max).toBe(30);
        });

        it('all tiers use same time window', () => {
            const window = 15 * 60 * 1000; // 15 minutes
            expect(RATE_LIMITS.user.windowMs).toBe(window);
            expect(RATE_LIMITS.session.windowMs).toBe(window);
            expect(RATE_LIMITS.ip.windowMs).toBe(window);
        });
    });

    describe('Memory Rate Limit Store', () => {
        let store: Map<string, { count: number; resetTime: number }>;

        beforeEach(() => {
            store = new Map();
        });

        function checkRateLimit(key: string, tier: RateLimitTier) {
            const config = RATE_LIMITS[tier];
            const { max, windowMs } = config;
            const now = Date.now();
            const existing = store.get(key);

            if (!existing || existing.resetTime < now) {
                store.set(key, { count: 1, resetTime: now + windowMs });
                return { allowed: true, remaining: max - 1, tier, limit: max };
            }

            if (existing.count >= max) {
                return { allowed: false, remaining: 0, tier, limit: max };
            }

            existing.count++;
            return { allowed: true, remaining: max - existing.count, tier, limit: max };
        }

        it('allows requests within limit', () => {
            const result = checkRateLimit('ratelimit:ip:test', 'ip');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(29); // 30 - 1
            expect(result.tier).toBe('ip');
        });

        it('blocks requests over limit', () => {
            // Exhaust the limit
            for (let i = 0; i < 30; i++) {
                checkRateLimit('ratelimit:ip:test2', 'ip');
            }

            const result = checkRateLimit('ratelimit:ip:test2', 'ip');
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('different tiers have different limits', () => {
            // Use up 35 requests on user tier (should still be allowed)
            for (let i = 0; i < 35; i++) {
                const result = checkRateLimit('ratelimit:user:testuser', 'user');
                expect(result.allowed).toBe(true);
            }

            // Use up 35 requests on ip tier (should be blocked after 30)
            for (let i = 0; i < 30; i++) {
                const result = checkRateLimit('ratelimit:ip:testip', 'ip');
                expect(result.allowed).toBe(true);
            }
            const blocked = checkRateLimit('ratelimit:ip:testip', 'ip');
            expect(blocked.allowed).toBe(false);
        });

        it('tracks remaining requests correctly', () => {
            const result1 = checkRateLimit('ratelimit:session:test', 'session');
            expect(result1.remaining).toBe(49); // 50 - 1

            const result2 = checkRateLimit('ratelimit:session:test', 'session');
            expect(result2.remaining).toBe(48); // 50 - 2

            const result3 = checkRateLimit('ratelimit:session:test', 'session');
            expect(result3.remaining).toBe(47); // 50 - 3
        });
    });
});
