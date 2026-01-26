/**
 * LiquidCrypto Server - Elysia Framework Implementation
 * 
 * This file demonstrates proper Elysia framework usage.
 * Run: bun run src/index-elysia.ts
 */
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { cache } from './cache.js';
import { runSecurityAudit, securityHeaders } from './security.js';
import { wsManager } from './websocket.js';
import { getSentinelStatus } from './sentinel.js';
import { createA2APlugin } from './a2a/index.js';
import { coworkRoutes, sandboxRoutes, initCoworkEventForwarding } from './cowork/index.js';
import { systemFilesRoutes } from './system/index.js';
import consoleRoutes from './routes/console.js';
import { initNats, closeNats, getNatsHealth, isNatsConnected } from './nats/index.js';

// CORS plugin
const corsPlugin = cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization']
});

// Security plugin
const securityPlugin = new Elysia({ name: 'security' })
    .derive(({ set }) => {
        const headers = securityHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            set.headers[key] = value;
        });
        return { securityHeaders: headers };
    });

// Health check plugin
const healthPlugin = new Elysia({ name: 'health' })
    .get('/health', () => ({
        status: 'ok',
        runtime: 'bun',
        timestamp: new Date().toISOString()
    }));

// API info plugin
const apiInfoPlugin = new Elysia({ name: 'api-info' })
    .get('/api/v1', () => ({
        name: 'LiquidCrypto API',
        version: '1.0.0',
        runtime: 'bun',
        realtime: 'GET /stream (SSE)',
        endpoints: {
            chat: 'POST /api/v1/chat',
            chatParallel: 'POST /api/v1/chat/parallel',
            health: 'GET /health',
            graphql: 'POST /graphql',
            stream: 'GET /stream',
            websocket: 'WS /ws',
            cacheStats: 'GET /api/v1/cache/stats',
            securityAudit: 'GET /api/v1/security/audit',
            redisSentinel: 'GET /api/v1/redis/sentinel',
            // A2A Protocol (SDK-based)
            a2aDiscovery: 'GET /.well-known/agent-card.json',
            a2aRpc: 'POST /a2a',
            a2aStream: 'GET /a2a/stream',
        }
    }));

// Cache stats plugin
const cacheStatsPlugin = new Elysia({ name: 'cache-stats' })
    .get('/api/v1/cache/stats', () => cache.getStats());

// Security audit plugin  
const securityAuditPlugin = new Elysia({ name: 'security-audit' })
    .get('/api/v1/security/audit', async () => await runSecurityAudit());

// Redis Sentinel plugin
const sentinelPlugin = new Elysia({ name: 'sentinel' })
    .get('/api/v1/redis/sentinel', async () => await getSentinelStatus());

// NATS health plugin
const natsHealthPlugin = new Elysia({ name: 'nats-health' })
    .get('/api/v1/nats/health', async () => await getNatsHealth());

// Chat request validation schema
const chatSchema = t.Object({
    provider: t.Optional(t.Union([t.Literal('gemini'), t.Literal('claude')])),
    messages: t.Array(t.Object({
        role: t.Union([t.Literal('user'), t.Literal('model'), t.Literal('system')]),
        content: t.String()
    }))
});

// Parallel chat schema
const parallelChatSchema = t.Object({
    messages: t.Array(t.Object({
        role: t.Union([t.Literal('user'), t.Literal('model'), t.Literal('system')]),
        content: t.String()
    }))
});

// AI call helper
async function callAI(provider: 'gemini' | 'claude', messages: Array<{ role: string; content: string }>) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const cached = await cache.get(lastMessage, 'ai');
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
    await cache.set(lastMessage, response, 'ai');
    return response;
}

// Chat plugin
const chatPlugin = new Elysia({ name: 'chat' })
    .post('/api/v1/chat', async ({ body, set }) => {
        const provider = body.provider || 'gemini';
        const messages = body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            set.status = 400;
            return { error: 'Messages array required' };
        }

        try {
            const response = await callAI(provider as 'gemini' | 'claude', messages);
            return { response };
        } catch (error) {
            set.status = 500;
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }, { body: chatSchema });

// Parallel chat plugin
const parallelChatPlugin = new Elysia({ name: 'parallel-chat' })
    .post('/api/v1/chat/parallel', async ({ body, set }) => {
        const messages = body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            set.status = 400;
            return { error: 'Messages array required' };
        }

        try {
            const [gemini, claude] = await Promise.allSettled([
                callAI('gemini', messages),
                callAI('claude', messages)
            ]);
            return {
                responses: {
                    gemini: gemini.status === 'fulfilled' ? gemini.value : 'Error',
                    claude: claude.status === 'fulfilled' ? claude.value : 'Error'
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            set.status = 500;
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }, { body: parallelChatSchema });

// GraphQL plugin
const graphqlPlugin = new Elysia({ name: 'graphql' })
    .post('/graphql', async ({ body, set }) => {
        const query = (body as { query?: string }).query;
        const variables = (body as { variables?: Record<string, unknown> }).variables;

        if (query?.includes('price')) {
            return {
                data: {
                    price: {
                        symbol: variables?.symbol || 'BTC',
                        price: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
                        timestamp: new Date().toISOString()
                    }
                }
            };
        }

        if (query?.includes('portfolio')) {
            return {
                data: {
                    portfolio: {
                        totalValue: 125000.50,
                        holdings: [
                            { symbol: 'BTC', amount: 1.5, value: 67500 },
                            { symbol: 'ETH', amount: 10, value: 35000 },
                            { symbol: 'SOL', amount: 50, value: 22500.50 }
                        ]
                    }
                }
            };
        }

        if (query?.includes('marketStats')) {
            return {
                data: {
                    marketStats: {
                        totalMarketCap: 2500000000000,
                        volume24h: 95000000000,
                        btcDominance: 52.5,
                        FearGreedIndex: 65
                    }
                }
            };
        }

        if (query?.includes('chat')) {
            const prompt = (variables?.prompt as string) || 'Hello';
            const response = await callAI('gemini', [{ role: 'user', content: prompt }]);
            return { data: { chat: response } };
        }

        return {
            data: {
                chat: 'Use chat(prompt: String!)',
                price: 'Use price(symbol: String!)',
                portfolio: 'Get portfolio data',
                marketStats: 'Get market statistics'
            }
        };
    });

// Portfolio plugin
const portfolioPlugin = new Elysia({ name: 'portfolio' })
    .get('/api/v1/portfolio', () => ({
        data: {
            portfolio: {
                totalValue: 125000.50,
                holdings: [
                    { symbol: 'BTC', amount: 1.5, value: 67500, avgBuyPrice: 42000 },
                    { symbol: 'ETH', amount: 10, value: 35000, avgBuyPrice: 3200 },
                    { symbol: 'SOL', amount: 50, value: 22500.50, avgBuyPrice: 420 }
                ]
            }
        }
    }));

// Market plugin
const marketPlugin = new Elysia({ name: 'market' })
    .get('/api/v1/market', () => ({
        data: {
            marketStats: {
                totalMarketCap: 2500000000000,
                volume24h: 95000000000,
                btcDominance: 52.5,
                FearGreedIndex: 65,
                topGainers: [
                    { symbol: 'SOL', change: 5.2 },
                    { symbol: 'ADA', change: 3.8 }
                ],
                topLosers: [
                    { symbol: 'XRP', change: -2.3 }
                ]
            }
        }
    }));

// A2A Plugin - SDK-based agent protocol
const a2aPlugin = createA2APlugin({
    baseUrl: `http://localhost:${process.env.PORT || 3000}`,
});

// Build the Elysia app
const app = new Elysia({ prefix: '' })
    .use(corsPlugin)
    .use(securityPlugin)
    .use(healthPlugin)
    .use(apiInfoPlugin)
    .use(cacheStatsPlugin)
    .use(securityAuditPlugin)
    .use(sentinelPlugin)
    .use(chatPlugin)
    .use(parallelChatPlugin)
    .use(graphqlPlugin)
    .use(portfolioPlugin)
    .use(marketPlugin)
    .use(a2aPlugin)
    .use(coworkRoutes)
    .use(sandboxRoutes)
    .use(systemFilesRoutes)
    .use(consoleRoutes)
    .use(natsHealthPlugin);

// Start server
const PORT = Number(process.env.PORT) || 3000;

// Initialize services and start server
async function startServer() {
    // Initialize NATS (non-blocking, server works without it)
    const natsConnected = await initNats();
    if (!natsConnected) {
        console.warn('[Server] NATS not available - running in degraded mode');
    }

    app.listen(PORT, () => {
        console.log(`\n╔═══════════════════════════════════════════════════════╗`);
        console.log(`║  LiquidCrypto Server (Elysia)                         ║`);
        console.log(`║  ─────────────────────────────────────────────────    ║`);
        console.log(`║  Runtime: Bun + Elysia                                ║`);
        console.log(`║  Port: ${PORT}                                         ║`);
        console.log(`║  URL: http://localhost:${PORT}                          ║`);
        console.log(`║  NATS: ${natsConnected ? 'Connected' : 'Not available'}                              ║`);
        console.log(`╚═══════════════════════════════════════════════════════╝`);

        // Start WebSocket server on port 3001
        wsManager.startWebSocketServer(3001);

        // Initialize Cowork event forwarding
        initCoworkEventForwarding();
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('[Server] SIGTERM received, shutting down...');
        await closeNats();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('[Server] SIGINT received, shutting down...');
        await closeNats();
        process.exit(0);
    });
}

startServer();

export default app;
