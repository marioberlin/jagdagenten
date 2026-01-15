/**
 * Elysia Rate Limiting Plugin
 */
import { Elysia } from 'elysia';

const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

export const rateLimitPlugin = (config: { max: number; windowMs: number } = { max: 100, windowMs: 15 * 60 * 1000 }) => {
    return new Elysia({ name: 'rate-limit' })
        .state('rateLimitConfig', config)
        .derive(({ store, request: req }) => {
            const ip = req.headers.get('x-forwarded-for') || 'unknown';

            const checkRateLimit = async () => {
                const now = Date.now();
                const key = 'ratelimit:' + ip;
                const cfg = store.rateLimitConfig as { max: number; windowMs: number };
                const existing = rateLimitStore.get(key);

                if (!existing || existing.resetTime < now) {
                    rateLimitStore.set(key, { count: 1, resetTime: now + cfg.windowMs });
                    return { allowed: true, remaining: cfg.max - 1, resetTime: now + cfg.windowMs };
                }

                if (existing.count >= cfg.max) {
                    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
                }

                existing.count++;
                return { allowed: true, remaining: cfg.max - existing.count, resetTime: existing.resetTime };
            };

            return { checkRateLimit };
        });
};

export const chatRateLimit = (config: { max: number; windowMs: number } = { max: 30, windowMs: 15 * 60 * 1000 }) => {
    return new Elysia({ name: 'chat-rate-limit' })
        .state('chatRateLimitConfig', config)
        .derive(({ store, request: req }) => {
            const ip = req.headers.get('x-forwarded-for') || 'unknown';

            const checkChatRateLimit = async () => {
                const now = Date.now();
                const key = 'chat-ratelimit:' + ip;
                const cfg = store.chatRateLimitConfig as { max: number; windowMs: number };
                const existing = rateLimitStore.get(key);

                if (!existing || existing.resetTime < now) {
                    rateLimitStore.set(key, { count: 1, resetTime: now + cfg.windowMs });
                    return { allowed: true, remaining: cfg.max - 1, resetTime: now + cfg.windowMs };
                }

                if (existing.count >= cfg.max) {
                    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
                }

                existing.count++;
                return { allowed: true, remaining: cfg.max - existing.count, resetTime: existing.resetTime };
            };

            return { checkChatRateLimit };
        });
};

export default rateLimitPlugin;
