import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import Redis from 'ioredis';
import type { Redis as RedisType } from 'ioredis';
import { cache } from './cache.js';
import { securityHeaders, runSecurityAudit, generateCSPNonce } from './security.js';
import { wsManager } from './websocket.js';
import { getSentinelStatus } from './sentinel.js';
import { ChatRequestSchema, ParallelChatRequestSchema, GraphQLRequestSchema } from './schemas/chat.js';
import { smartRoutes } from './routes/smart.js';
import { pluginRoutes } from './routes/plugins.js';

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
        console.log('[Redis] Connected successfully');
    } catch {
        console.log('[Redis] Not available, using memory cache');
        useRedis = false;
        rateLimitStore = { type: 'memory', store: new Map() };
    }
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

async function getCachedResponse(prompt: string): Promise<string | null> {
    return cache.get(prompt, 'ai');
}

async function setCacheResponse(prompt: string, response: string): Promise<void> {
    await cache.set(prompt, response, 'ai');
}

async function checkRateLimit(ip: string, max: number, windowMs: number) {
    const now = Date.now();
    if (rateLimitStore.type === 'redis' && rateLimitStore.client) {
        const key = 'ratelimit:' + ip;
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
    const memKey = 'ratelimit:' + ip;
    const memStore = rateLimitStore as { type: 'memory'; store: Map<string, { count: number; resetTime: number }> };
    const existing = memStore.store.get(memKey);
    if (!existing || existing.resetTime < now) {
        memStore.store.set(memKey, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: max - 1, resetTime: now + windowMs };
    }
    if (existing.count >= max) return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    existing.count++;
    return { allowed: true, remaining: max - existing.count, resetTime: existing.resetTime };
}

async function callAI(provider: 'gemini' | 'claude', messages: Array<{ role: string; content: string }>) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const cached = await getCachedResponse(lastMessage);
    if (cached) return cached;

    let response: string;
    if (provider === 'claude') {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
        const result = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, messages })
        });
        const data = await result.json() as { content?: Array<{ text: string }> };
        response = data.content?.[0]?.text || 'No response';
    } else {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
        const result = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: lastMessage }] }] })
        });
        const data = await result.json() as { candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }> };
        response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    }
    await setCacheResponse(lastMessage, response);
    return response;
}

async function callParallelAI(messages: Array<{ role: string; content: string }>) {
    const [gemini, claude] = await Promise.allSettled([callAI('gemini', messages), callAI('claude', messages)]);
    return {
        gemini: gemini.status === 'fulfilled' ? gemini.value : 'Error',
        claude: claude.status === 'fulfilled' ? claude.value : 'Error'
    };
}

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    await initRedis();

    // Start WebSocket server on port 3001

    // wsManager is maintained as a separate implementation for now to minimize refactor risk
    wsManager.startWebSocketServer(3001);

    const app = new Elysia()
        .use(cors())
        .use(pluginRoutes)
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
                    console.log('[SSE] Client disconnected');
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
                securityAudit: 'GET /api/v1/security/audit'
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

        // Chat endpoint with Rate Limiting & Zod validation
        .post('/api/v1/chat', async ({ request, body, set }) => {
            const ip = request.headers.get('x-forwarded-for') || 'unknown';
            const limit = await checkRateLimit(ip, 30, 15 * 60 * 1000);

            if (!limit.allowed) {
                set.status = 429;
                return { error: 'Rate limit exceeded' };
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

        // Parallel Chat with Zod validation
        .post('/api/v1/chat/parallel', async ({ request, body, set }) => {
            const ip = request.headers.get('x-forwarded-for') || 'unknown';
            const limit = await checkRateLimit(ip, 30, 15 * 60 * 1000);

            if (!limit.allowed) {
                set.status = 429;
                return { error: 'Rate limit exceeded' };
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

        // GraphQL Stub
        .post('/graphql', async ({ body, set }) => {
            const payload = body as { query?: string; variables?: Record<string, unknown> };
            const query = payload.query;
            const variables = payload.variables;

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

        // Smart Enhancement Routes
        .use(smartRoutes)

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

    console.log(`\n╔═══════════════════════════════════════════════════════╗\n║  LiquidCrypto Server                                  ║\n║  ─────────────────────────────────────────────────    ║\n║  Runtime: Bun (Native)                                ║\n║  Framework: Elysia (v1.0)                             ║\n║  Redis: ${useRedis ? '✓ Connected' : '○ Not configured'}                            ║\n║  SSE Stream: http://localhost:${PORT}/stream               ║\n║  Parallel AI: POST /api/v1/chat/parallel               ║\n║  Port: ${PORT}                                               ║\n╚═══════════════════════════════════════════════════════╝`);
    console.log(`[Elysia] Server running at http://${app.server?.hostname}:${app.server?.port}`);
}

startServer();
