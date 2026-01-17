import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import Redis from 'ioredis';
import type { Redis as RedisType } from 'ioredis';
import { callAI, callParallelAI } from './ai/index.js';
import { cache } from './cache.js';
import { securityHeaders, runSecurityAudit, generateCSPNonce } from './security.js';
import { wsManager } from './websocket.js';
import { getSentinelStatus } from './sentinel.js';
import { ChatRequestSchema, ParallelChatRequestSchema, GraphQLRequestSchema } from './schemas/chat.js';
import { validateQueryWithMetrics, MAX_QUERY_DEPTH, MAX_QUERY_COMPLEXITY } from './graphql/validation.js';
import { smartRoutes } from './routes/smart.js';
import { pluginRoutes } from './routes/plugins.js';
import { skillsRoutes } from './routes/skills.js';
import { containerRoutes } from './routes/container.js';
import { authRoutes } from './routes/auth.js';
import { createArtifactRoutes } from './artifacts/index.js';
import { createAgentsRoutes } from './routes/agents.js';
import { getAgentCard, createA2AGrpcServer, createA2APlugin } from './a2a/index.js';
import { getRestaurantAgentCard, handleRestaurantRequest } from './agents/restaurant.js';
import { getRizzChartsAgentCard, handleRizzChartsRequest } from './agents/rizzcharts.js';
import { getCryptoAdvisorAgentCard, handleCryptoAdvisorRequest } from './agents/crypto-advisor.js';
import { getNanoBananaAgentCard, handleNanoBananaRequest } from './agents/nanobanana.js';
import { getDocuMindAgentCard, handleDocuMindRequest } from './agents/documind.js';
import { getTravelPlannerAgentCard, handleTravelPlannerRequest } from './agents/travel.js';
import { getDashboardBuilderAgentCard, handleDashboardBuilderRequest } from './agents/dashboard-builder.js';
import { getResearchCanvasAgentCard, handleResearchCanvasRequest } from './agents/research-canvas.js';
import { getAIResearcherCard, handleAIResearcherRequest } from './agents/ai-researcher.js';
import { getQAAgentCard, handleQAAgentRequest } from './agents/qa-agent.js';
import { getStateMachineAgentCard, handleStateMachineRequest } from './agents/state-machine.js';
import { getCopilotFormAgentCard, handleCopilotFormRequest } from './agents/copilot-form.js';
import { templateService } from './services/google/TemplateService.js';
import type { RateLimitTier, RateLimitResult, TieredRateLimitConfig } from './types.js';
import {
    logger,
    componentLoggers,
    createRequestLogger,
    generateRequestId,
    logAIRequest,
    logSecurityEvent
} from './logger.js';

type RateLimitStore = {
    type: 'redis';
    client: RedisType;
} | {
    type: 'memory';
    store: Map<string, { count: number; resetTime: number }>;
};

let redis: RedisType | null = null;
let useRedis = false;
let rateLimitStore: RateLimitStore;

async function initRedis() {
    try {
        const redisClient = new Redis.default(process.env.REDIS_URL || 'redis://localhost:6379');
        await redisClient.ping();
        redis = redisClient;
        useRedis = true;
        rateLimitStore = { type: 'redis', client: redisClient };
        componentLoggers.redis.info({ url: process.env.REDIS_URL || 'redis://localhost:6379' }, 'Connected successfully');
    } catch (err) {
        componentLoggers.redis.warn({ error: (err as Error).message }, 'Not available, using memory cache');
        useRedis = false;
        rateLimitStore = { type: 'memory', store: new Map() };
    }
}

// Tiered Rate Limit Configuration
const RATE_LIMITS: TieredRateLimitConfig = {
    user: { max: 100, windowMs: 15 * 60 * 1000 },    // Authenticated: 100/15min
    session: { max: 50, windowMs: 15 * 60 * 1000 },  // Session token: 50/15min
    ip: { max: 30, windowMs: 15 * 60 * 1000 }        // Anonymous: 30/15min
};

/**
 * Extract rate limit key and tier from request
 * Priority: User ID > Session Token > IP Address
 */
function getRateLimitKeyAndTier(request: Request): { key: string; tier: RateLimitTier } {
    // Priority 1: Authenticated user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        // In production, you would validate and decode the JWT to get userId
        // For now, we use the token itself as the key (hashed in production)
        const token = authHeader.substring(7);
        // Simple hash for demo - use proper JWT validation in production
        const userId = token.length > 10 ? token.substring(0, 10) : token;
        return { key: `ratelimit:user:${userId}`, tier: 'user' };
    }

    // Priority 2: Session token for tracked anonymous users
    const sessionToken = request.headers.get('X-Session-Token');
    if (sessionToken) {
        return { key: `ratelimit:session:${sessionToken}`, tier: 'session' };
    }

    // Priority 3: IP address fallback
    const forwardedFor = request.headers.get('X-Forwarded-For');
    const ip = forwardedFor?.split(',')[0]?.trim()
        || request.headers.get('X-Real-IP')
        || 'unknown';
    return { key: `ratelimit:ip:${ip}`, tier: 'ip' };
}

const sseClients = new Set<ReadableStreamDefaultController>();

function broadcast(message: object) {
    const data = 'data: ' + JSON.stringify(message) + '\n\n';
    for (const controller of sseClients) {
        try {
            controller.enqueue(new TextEncoder().encode(data));
        } catch (e) {
            sseClients.delete(controller);
        }
    }
}

// Background Price Simulation
setInterval(() => {
    const symbols = ['BTC', 'ETH', 'SOL', 'ADA'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const price = (Math.random() * 1000 + 100).toFixed(2);
    const update = { type: 'price', symbol, price: parseFloat(price), timestamp: new Date().toISOString() };
    if (useRedis && redis) redis.set(`price:${symbol}`, JSON.stringify(update));
    broadcast(update);
}, 5000);

// Note: getCachedResponse and setCacheResponse are deprecated
// The callAI function now uses cache.getOrSet for stampede protection
// @see Item 2.1 Request Coalescing in IMPLEMENTATION_PLAN.md

/**
 * Check rate limit using tiered approach
 * Returns rate limit result with tier information
 */
async function checkRateLimit(request: Request): Promise<RateLimitResult> {
    const { key, tier } = getRateLimitKeyAndTier(request);
    const config = RATE_LIMITS[tier];
    const { max, windowMs } = config;
    const now = Date.now();

    if (rateLimitStore.type === 'redis' && rateLimitStore.client) {
        const pipeline = rateLimitStore.client.pipeline();
        pipeline.incr(key);
        pipeline.ttl(key);
        const results = await pipeline.exec();
        const count = (results?.[0]?.[1] as number) || 0;
        let ttl = (results?.[1]?.[1] as number);

        // If TTL is -1 (no expiry set) or -2 (key doesn't exist), set it
        if (ttl < 0) {
            ttl = Math.ceil(windowMs / 1000);
            await rateLimitStore.client.expire(key, ttl);
        }

        if (count > max) {
            return { allowed: false, remaining: 0, resetTime: now + ttl * 1000, tier, limit: max };
        }
        return { allowed: true, remaining: max - count, resetTime: now + ttl * 1000, tier, limit: max };
    }

    // Memory store fallback
    const memStore = rateLimitStore as { type: 'memory'; store: Map<string, { count: number; resetTime: number }> };
    const existing = memStore.store.get(key);

    if (!existing || existing.resetTime < now) {
        memStore.store.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: max - 1, resetTime: now + windowMs, tier, limit: max };
    }

    if (existing.count >= max) {
        return { allowed: false, remaining: 0, resetTime: existing.resetTime, tier, limit: max };
    }

    existing.count++;
    return { allowed: true, remaining: max - existing.count, resetTime: existing.resetTime, tier, limit: max };
}

/**
 * Legacy rate limit check for backward compatibility
 * @deprecated Use checkRateLimit(request) instead
 */
async function checkRateLimitLegacy(ip: string, max: number, windowMs: number) {
    const now = Date.now();
    const key = 'ratelimit:' + ip;

    if (rateLimitStore.type === 'redis' && rateLimitStore.client) {
        const pipeline = rateLimitStore.client.pipeline();
        pipeline.incr(key);
        pipeline.ttl(key);
        const results = await pipeline.exec();
        const count = (results?.[0]?.[1] as number) || 0;
        const ttl = (results?.[1]?.[1] as number) || Math.ceil(windowMs / 1000);
        if (count > max) return { allowed: false, remaining: 0, resetTime: now + ttl * 1000 };
        await rateLimitStore.client.expire(key, ttl);
        return { allowed: true, remaining: max - count, resetTime: now + windowMs };
    }

    const memStore = rateLimitStore as { type: 'memory'; store: Map<string, { count: number; resetTime: number }> };
    const existing = memStore.store.get(key);
    if (!existing || existing.resetTime < now) {
        memStore.store.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: max - 1, resetTime: now + windowMs };
    }
    if (existing.count >= max) return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    existing.count++;
    return { allowed: true, remaining: max - existing.count, resetTime: existing.resetTime };
}

// AI functions are now imported from ./ai/index.js
// - callAI: Cached AI calls with request coalescing
// - callParallelAI: Call both providers in parallel

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    await initRedis();

    // Start WebSocket server on port 3001

    // wsManager is maintained as a separate implementation for now to minimize refactor risk
    wsManager.startWebSocketServer(3001);

    const app = new Elysia()
        .use(cors())
        .use(pluginRoutes)
        .use(skillsRoutes)
        .use(authRoutes)
        .use(createArtifactRoutes())
        .use(createAgentsRoutes())
        // Global Middleware: Security & CORS
        // Global Middleware: Security & CORS
        .onRequest(({ set, request }) => {
            const start = Date.now();

            // Security Headers
            const sec = securityHeaders();
            Object.entries(sec).forEach(([key, value]) => {
                set.headers[key] = value;
            });
        })

        // Health Check
        .get('/health', ({ set }) => {
            return {
                status: 'ok',
                runtime: 'bun',
                framework: 'elysia',
                timestamp: new Date().toISOString(),
                redis: useRedis,
                sseClients: sseClients.size
            };
        })

        // SSE Stream
        .get('/stream', ({ set }) => {
            set.headers['Content-Type'] = 'text/event-stream';
            set.headers['Cache-Control'] = 'no-cache';
            set.headers['Connection'] = 'keep-alive';

            return new ReadableStream({
                start(ctrl) {
                    sseClients.add(ctrl);
                    ctrl.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ type: 'connected', clients: sseClients.size }) + '\n\n'));
                },
                cancel() {
                    sseClients.delete(this as any);
                    componentLoggers.http.debug({ clients: sseClients.size }, 'SSE client disconnected');
                }
            });
        })

        // API V1 Info
        .get('/api/v1', () => ({
            name: 'LiquidCrypto API',
            version: '1.0.0',
            runtime: 'bun',
            framework: 'elysia',
            realtime: 'GET /stream (SSE)',
            endpoints: {
                chat: 'POST /api/v1/chat',
                chatParallel: 'POST /api/v1/chat/parallel',
                health: 'GET /health',
                graphql: 'POST /graphql',
                stream: 'GET /stream',
                cacheStats: 'GET /api/v1/cache/stats',
                securityAudit: 'GET /api/v1/security/audit',
                a2a: 'POST /a2a (A2A Protocol)',
                a2aStream: 'POST /a2a/stream (A2A SSE)',
                agentCard: 'GET /.well-known/agent-card.json'
            }
        }))

        // Cache Stats
        .get('/api/v1/cache/stats', () => cache.getStats())

        // Security Audit
        .get('/api/v1/security/audit', async () => await runSecurityAudit())
        .post('/api/v1/security/audit', async ({ body }) => await runSecurityAudit(body))

        // CSP Nonce for dynamic scripts
        .get('/api/v1/security/nonce', ({ set }) => {
            const nonce = generateCSPNonce();
            set.headers['Content-Type'] = 'application/json';
            return { nonce };
        })

        // Redis Sentinel
        .get('/api/v1/redis/sentinel', async () => await getSentinelStatus())

        // Chat endpoint with Tiered Rate Limiting & Zod validation
        .post('/api/v1/chat', async ({ request, body, set }) => {
            const limit = await checkRateLimit(request);

            // Set rate limit headers for all responses
            set.headers['X-RateLimit-Limit'] = String(limit.limit);
            set.headers['X-RateLimit-Remaining'] = String(limit.remaining);
            set.headers['X-RateLimit-Reset'] = String(Math.floor(limit.resetTime / 1000));
            set.headers['X-RateLimit-Tier'] = limit.tier;

            if (!limit.allowed) {
                set.status = 429;
                set.headers['Retry-After'] = String(Math.ceil((limit.resetTime - Date.now()) / 1000));
                return { error: 'Rate limit exceeded', tier: limit.tier, retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000) };
            }

            // Validate request with Zod
            const parsed = ChatRequestSchema.safeParse(body);
            if (!parsed.success) {
                set.status = 400;
                return { error: 'Invalid request', details: parsed.error.flatten() };
            }

            const { provider, messages } = parsed.data;
            const response = await callAI(provider, messages);
            broadcast({ type: 'chat', message: response, timestamp: new Date().toISOString() });

            set.headers['Content-Type'] = 'text/event-stream';
            set.headers['Cache-Control'] = 'no-cache';
            set.headers['Connection'] = 'keep-alive';
            return 'data: ' + JSON.stringify({ response }) + '\n\n';
        })

        // Parallel Chat with Tiered Rate Limiting & Zod validation
        .post('/api/v1/chat/parallel', async ({ request, body, set }) => {
            const limit = await checkRateLimit(request);

            // Set rate limit headers for all responses
            set.headers['X-RateLimit-Limit'] = String(limit.limit);
            set.headers['X-RateLimit-Remaining'] = String(limit.remaining);
            set.headers['X-RateLimit-Reset'] = String(Math.floor(limit.resetTime / 1000));
            set.headers['X-RateLimit-Tier'] = limit.tier;

            if (!limit.allowed) {
                set.status = 429;
                set.headers['Retry-After'] = String(Math.ceil((limit.resetTime - Date.now()) / 1000));
                return { error: 'Rate limit exceeded', tier: limit.tier, retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000) };
            }

            // Validate request with Zod
            const parsed = ParallelChatRequestSchema.safeParse(body);
            if (!parsed.success) {
                set.status = 400;
                return { error: 'Invalid request', details: parsed.error.flatten() };
            }

            const { messages } = parsed.data;
            const responses = await callParallelAI(messages);
            return { responses, timestamp: new Date().toISOString() };
        })

        // GraphQL Stub with Depth/Complexity Validation
        .post('/graphql', async ({ body, set }) => {
            const payload = body as { query?: string; variables?: Record<string, unknown> };
            const query = payload.query;
            const variables = payload.variables;

            // Validate query depth and complexity
            if (query) {
                const validation = validateQueryWithMetrics(query);
                if (!validation.valid) {
                    set.status = 400;
                    return {
                        errors: [{
                            message: validation.error,
                            extensions: {
                                code: 'QUERY_TOO_COMPLEX',
                                depth: validation.depth,
                                complexity: validation.complexity,
                                limits: {
                                    maxDepth: MAX_QUERY_DEPTH,
                                    maxComplexity: MAX_QUERY_COMPLEXITY
                                }
                            }
                        }]
                    };
                }
            }

            if (query?.includes('price')) {
                return { data: { price: { symbol: variables?.symbol || 'BTC', price: parseFloat((Math.random() * 1000 + 100).toFixed(2)), timestamp: new Date().toISOString() } } };
            }
            if (query?.includes('portfolio')) {
                return { data: { portfolio: { totalValue: 125000.50, holdings: [{ symbol: 'BTC', amount: 1.5, value: 67500 }, { symbol: 'ETH', amount: 10, value: 35000 }, { symbol: 'SOL', amount: 50, value: 22500.50 }] } } };
            }
            if (query?.includes('marketStats')) {
                return { data: { marketStats: { totalMarketCap: 2500000000000, volume24h: 95000000000, btcDominance: 52.5, FearGreedIndex: 65 } } };
            }
            if (query?.includes('chat')) {
                const chatResponse = await callAI('gemini', [{ role: 'user', content: (variables?.prompt as string) || 'Hello' }]);
                return { data: { chat: chatResponse } };
            }

            return { data: { chat: 'Use chat(prompt: String!)', price: 'Use price(symbol: String!)', portfolio: 'Get portfolio data', marketStats: 'Get market statistics' } };
        })

        // Portfolio Data
        .get('/api/v1/portfolio', () => ({
            data: { portfolio: { totalValue: 125000.50, holdings: [{ symbol: 'BTC', amount: 1.5, value: 67500, avgBuyPrice: 42000 }, { symbol: 'ETH', amount: 10, value: 35000, avgBuyPrice: 3200 }, { symbol: 'SOL', amount: 50, value: 22500.50, avgBuyPrice: 420 }] } }
        }))

        // Market Data
        .get('/api/v1/market', () => ({
            data: { marketStats: { totalMarketCap: 2500000000000, volume24h: 95000000000, btcDominance: 52.5, FearGreedIndex: 65, topGainers: [{ symbol: 'SOL', change: 5.2 }, { symbol: 'ADA', change: 3.8 }], topLosers: [{ symbol: 'XRP', change: -2.3 }] } }
        }))

        // Smart Sheets Creation (Platinum Workflow)
        .post('/api/v1/sheets/create', async ({ body, set }) => {
            const { email, title } = body as { email: string; title?: string };
            if (!email) {
                set.status = 400;
                return { error: 'Email is required' };
            }
            try {
                const result = await templateService.createSmartSheet(email, title);
                return { success: true, data: result };
            } catch (error) {
                logger.error({ error }, 'Failed to create smart sheet');
                set.status = 500;
                return { error: 'Failed to create smart sheet' };
            }
        })

        // Share Master Template (for client-side copy)
        .post('/api/v1/sheets/share-template', async ({ body, set }) => {
            const { email } = body as { email: string };
            if (!email) {
                set.status = 400;
                return { error: 'Email is required' };
            }
            try {
                const result = await templateService.shareMasterTemplate(email);
                return { success: true, data: result };
            } catch (error) {
                logger.error({ error }, 'Failed to share template');
                set.status = 500;
                return { error: 'Failed to share template' };
            }
        })

        // Smart Enhancement Routes
        .use(smartRoutes)

        // Container Configuration Routes
        .use(containerRoutes)

        // Artifact Management Routes
        .use(createArtifactRoutes())

        // A2A Protocol Endpoints
        // Agent Card (well-known endpoint for discovery)
        .get('/.well-known/agent-card.json', () => {
            const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
            return getAgentCard(baseUrl);
        })

        // ===========================================
        // Agent Routes (Real Implementation)
        // ===========================================

        // Restaurant Finder
        .group('/agents/restaurant', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                // Handle agent card methods (v0.x and v1.0)
                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getRestaurantAgentCard(baseUrl) };
                }

                // Handle message send methods (v1.0: SendMessage, v0.x: message/send)
                if (method === 'SendMessage') {
                    const result = await handleRestaurantRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return {
                        jsonrpc: '2.0',
                        id: (body as any).id,
                        result
                    };
                }

                // Method not found
                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found', data: { method } }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getRestaurantAgentCard(baseUrl);
                })
                .get('/', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getRestaurantAgentCard(baseUrl);
                })
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // RizzCharts
        .group('/agents/rizzcharts', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getRizzChartsAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleRizzChartsRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return {
                        jsonrpc: '2.0',
                        id: (body as any).id,
                        result
                    };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found', data: { method } }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getRizzChartsAgentCard(baseUrl);
                })
                .get('/', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getRizzChartsAgentCard(baseUrl);
                })
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // Crypto Advisor
        .group('/agents/crypto-advisor', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getCryptoAdvisorAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleCryptoAdvisorRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return {
                        jsonrpc: '2.0',
                        id: (body as any).id,
                        result
                    };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found', data: { method } }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getCryptoAdvisorAgentCard(baseUrl);
                })
                .get('/', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getCryptoAdvisorAgentCard(baseUrl);
                })
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // NanoBanana Pro (AI Image Generation)
        .group('/agents/nanobanana', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getNanoBananaAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleNanoBananaRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return {
                        jsonrpc: '2.0',
                        id: (body as any).id,
                        result
                    };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found', data: { method } }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getNanoBananaAgentCard(baseUrl);
                })
                .get('/', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getNanoBananaAgentCard(baseUrl);
                })
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // DocuMind (Document Analysis)
        .group('/agents/documind', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getDocuMindAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleDocuMindRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return {
                        jsonrpc: '2.0',
                        id: (body as any).id,
                        result
                    };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found', data: { method } }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getDocuMindAgentCard(baseUrl);
                })
                .get('/', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getDocuMindAgentCard(baseUrl);
                })
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // Travel Planner
        .group('/agents/travel', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getTravelPlannerAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleTravelPlannerRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return {
                        jsonrpc: '2.0',
                        id: (body as any).id,
                        result
                    };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found', data: { method } }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getTravelPlannerAgentCard(baseUrl);
                })
                .get('/', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getTravelPlannerAgentCard(baseUrl);
                })
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // Dashboard Builder
        .group('/agents/dashboard-builder', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getDashboardBuilderAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleDashboardBuilderRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return {
                        jsonrpc: '2.0',
                        id: (body as any).id,
                        result
                    };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found', data: { method } }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getDashboardBuilderAgentCard(baseUrl);
                })
                .get('/', () => {
                    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                    return getDashboardBuilderAgentCard(baseUrl);
                })
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // Research Canvas
        .group('/agents/research-canvas', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getResearchCanvasAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleResearchCanvasRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return { jsonrpc: '2.0', id: (body as any).id, result };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found' }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => getResearchCanvasAgentCard(process.env.BASE_URL || `http://localhost:${PORT}`))
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // AI Researcher
        .group('/agents/ai-researcher', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getAIResearcherCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleAIResearcherRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return { jsonrpc: '2.0', id: (body as any).id, result };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found' }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => getAIResearcherCard(process.env.BASE_URL || `http://localhost:${PORT}`))
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // QA Agent
        .group('/agents/qa', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getQAAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleQAAgentRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return { jsonrpc: '2.0', id: (body as any).id, result };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found' }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => getQAAgentCard(process.env.BASE_URL || `http://localhost:${PORT}`))
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // State Machine Agent
        .group('/agents/state-machine', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getStateMachineAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleStateMachineRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return { jsonrpc: '2.0', id: (body as any).id, result };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found' }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => getStateMachineAgentCard(process.env.BASE_URL || `http://localhost:${PORT}`))
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // Copilot Form Agent
        .group('/agents/copilot-form', app => {
            const handleRpc = async ({ request, body, set }: any) => {
                const method = (body as any).method;
                const params = (body as any).params;
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

                if (method === 'GetAgentCard') {
                    return { jsonrpc: '2.0', id: (body as any).id, result: getCopilotFormAgentCard(baseUrl) };
                }

                if (method === 'SendMessage') {
                    const result = await handleCopilotFormRequest(params);
                    set.headers['Content-Type'] = 'application/json';
                    set.headers['A2A-Protocol-Version'] = '1.0';
                    return { jsonrpc: '2.0', id: (body as any).id, result };
                }

                set.status = 400;
                return {
                    jsonrpc: '2.0',
                    id: (body as any).id,
                    error: { code: -32601, message: 'Method not found' }
                };
            };

            return app
                .get('/.well-known/agent-card.json', () => getCopilotFormAgentCard(process.env.BASE_URL || `http://localhost:${PORT}`))
                .post('/a2a', handleRpc)
                .post('/', handleRpc);
        })

        // A2A Protocol Plugin (with PostgreSQL persistence if DATABASE_URL is set)
        .use(createA2APlugin({
            baseUrl: process.env.BASE_URL || `http://localhost:${PORT}`,
            enableTelemetry: process.env.OTEL_ENABLED === 'true',
        }))

        // 404 Handler - Elysia handles this by default but we can customize if needed
        .onError(({ code, error, set }) => {
            if (code === 'NOT_FOUND') {
                set.status = 404;
                return { error: 'Not found' };
            }
            set.status = 500;
            const err = error as { message?: string };
            return { error: err.message || 'Unknown error' };
        })

        .listen(PORT);

    // Start gRPC server if enabled
    const GRPC_PORT = Number(process.env.GRPC_PORT) || 50051;
    const enableGrpc = process.env.ENABLE_GRPC === 'true';
    let grpcStarted = false;

    if (enableGrpc) {
        try {
            const grpcServer = createA2AGrpcServer({
                port: GRPC_PORT,
                host: '0.0.0.0',
                baseUrl: `http://localhost:${PORT}`,
                enableTelemetry: process.env.OTEL_ENABLED === 'true',
            });
            await grpcServer.start();
            grpcStarted = true;
            componentLoggers.http.info({ port: GRPC_PORT }, 'gRPC server started');
        } catch (err) {
            componentLoggers.http.warn({ error: (err as Error).message }, 'gRPC server failed to start');
        }
    }

    logger.info({
        port: PORT,
        grpcPort: enableGrpc ? GRPC_PORT : null,
        redis: useRedis,
        runtime: 'bun',
        framework: 'elysia',
        endpoints: {
            http: `http://localhost:${PORT}`,
            websocket: 'ws://localhost:3001',
            stream: `http://localhost:${PORT}/stream`,
            grpc: enableGrpc && grpcStarted ? `localhost:${GRPC_PORT}` : null
        }
    }, 'LiquidCrypto Server started');

    // Pretty ASCII banner for development
    if (process.env.NODE_ENV === 'development') {
        console.log(`\n╔═══════════════════════════════════════════════════════╗\n║  LiquidCrypto Server                                  ║\n║  ─────────────────────────────────────────────────    ║\n║  Runtime: Bun (Native)                                ║\n║  Framework: Elysia (v1.0)                             ║\n║  Redis: ${useRedis ? '✓ Connected' : '○ Not configured'}                            ║\n║  gRPC:  ${grpcStarted ? `✓ Port ${GRPC_PORT}` : '○ Disabled (ENABLE_GRPC=true)'}                      ║\n║  SSE Stream: http://localhost:${PORT}/stream               ║\n║  Parallel AI: POST /api/v1/chat/parallel               ║\n║  Port: ${PORT}                                               ║\n╚═══════════════════════════════════════════════════════╝`);
    }
}

startServer();
