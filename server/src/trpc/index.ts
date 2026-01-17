/**
 * tRPC Setup for Liquid Glass Server
 * 
 * Provides type-safe API layer with end-to-end type inference.
 * Works alongside existing Elysia routes for incremental adoption.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

// ============================================================================
// Context
// ============================================================================

export interface TRPCContext {
    // Request metadata
    requestId: string;
    ip: string;

    // User info (if authenticated)
    userId?: string;
    sessionId?: string;

    // Rate limiting
    rateLimitTier: 'user' | 'session' | 'ip';
}

export type CreateContextOptions = {
    request: Request;
};

/**
 * Create tRPC context from an incoming request
 */
export function createContext(opts: CreateContextOptions): TRPCContext {
    const { request } = opts;

    // Extract request ID or generate new one
    const requestId = request.headers.get('x-request-id') ||
        crypto.randomUUID();

    // Extract IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';

    // Extract user/session from headers
    const userId = request.headers.get('x-user-id') || undefined;
    const sessionId = request.headers.get('x-session-id') || undefined;

    // Determine rate limit tier
    const rateLimitTier = userId ? 'user' : sessionId ? 'session' : 'ip';

    return {
        requestId,
        ip,
        userId,
        sessionId,
        rateLimitTier,
    };
}

// ============================================================================
// tRPC Instance
// ============================================================================

const t = initTRPC.context<TRPCContext>().create({
    errorFormatter: ({ shape, error }) => {
        return {
            ...shape,
            data: {
                ...shape.data,
                // Add custom error data here if needed
                httpStatus: error.code === 'INTERNAL_SERVER_ERROR' ? 500 :
                    error.code === 'BAD_REQUEST' ? 400 :
                        error.code === 'UNAUTHORIZED' ? 401 :
                            error.code === 'FORBIDDEN' ? 403 :
                                error.code === 'NOT_FOUND' ? 404 : 500,
            },
        };
    },
});

// ============================================================================
// Middleware
// ============================================================================

/**
 * Logging middleware - logs all requests
 */
const loggerMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;

    console.log(`[tRPC] ${type} ${path} - ${duration}ms - ${ctx.requestId}`);

    return result;
});

/**
 * Auth middleware - requires user authentication
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
    if (!ctx.userId) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
        });
    }

    return next({
        ctx: {
            ...ctx,
            userId: ctx.userId, // Now guaranteed to exist
        },
    });
});

// ============================================================================
// Procedures
// ============================================================================

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure.use(loggerMiddleware);

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure
    .use(loggerMiddleware)
    .use(authMiddleware);

// ============================================================================
// Router Factory
// ============================================================================

export const router = t.router;
export const mergeRouters = t.mergeRouters;

// ============================================================================
// Input Schemas (shared with client)
// ============================================================================

export const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

export const ChatInputSchema = z.object({
    provider: z.enum(['gemini', 'claude']).default('gemini'),
    messages: z.array(MessageSchema),
    stream: z.boolean().default(false),
});

export const AgentQuerySchema = z.object({
    agentId: z.string(),
    message: z.string(),
    sessionId: z.string().optional(),
});
