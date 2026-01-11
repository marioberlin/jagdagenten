# LiquidCrypto Comprehensive Implementation Plan

> **Created:** January 2026
> **Status:** Ready for Implementation
> **Estimated Total Effort:** 15-20 implementation sessions
> **Approach:** Sequential, using Ralph Loop for complex items

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Priority Matrix](#priority-matrix)
3. [Phase 1: Critical Security & Stability](#phase-1-critical-security--stability)
4. [Phase 2: Performance & Scalability](#phase-2-performance--scalability)
5. [Phase 3: Developer Experience & Observability](#phase-3-developer-experience--observability)
6. [Phase 4: Advanced Features](#phase-4-advanced-features)
7. [Implementation Checklist](#implementation-checklist)
8. [Risk Register](#risk-register)

---

## Executive Summary

This plan addresses 15 improvements identified during codebase analysis, organized into 4 phases by priority. Each item includes:

- **Problem Statement**: What's wrong and why it matters
- **Solution Design**: Technical approach with code patterns
- **Files to Modify**: Exact locations
- **Verification Steps**: How to confirm success
- **Dependencies**: What must be done first

---

## Priority Matrix

| ID | Item | Priority | Phase | Effort | Risk |
|----|------|----------|-------|--------|------|
| 1.1 | Session-Scoped LiquidClient | P0-Critical | 1 | Medium | High |
| 1.2 | Rate Limit Key Enhancement | P0-Critical | 1 | Low | Medium |
| 1.3 | ErrorBoundary Expansion | P0-Critical | 1 | Low | Low |
| 1.4 | WebSocket Authentication | P0-Critical | 1 | Medium | Medium |
| 2.1 | Request Coalescing for AI | P1-High | 2 | Medium | Medium |
| 2.2 | WebSocket Horizontal Scaling | P1-High | 2 | High | Medium |
| 2.3 | Theme Hydration Race Fix | P1-High | 2 | Low | Low |
| 3.1 | Structured Logging (Pino) | P2-Medium | 3 | Medium | Low |
| 3.2 | OpenTelemetry Integration | P2-Medium | 3 | High | Low |
| 3.3 | GraphQL Schema Completion | P2-Medium | 3 | Medium | Low |
| 3.4 | Directive Version Checksums | P2-Medium | 3 | Low | Low |
| 4.1 | Plugin Sandbox Execution | P3-Low | 4 | High | Medium |
| 4.2 | Self-Healing Production Loop | P3-Low | 4 | High | Medium |
| 4.3 | Multi-Agent Orchestration | P3-Low | 4 | Very High | High |
| 4.4 | Federated Plugin Registry | P3-Low | 4 | Very High | Medium |

---

## Phase 1: Critical Security & Stability

### 1.1 Session-Scoped LiquidClient

**Priority:** P0-Critical
**Effort:** Medium (2-3 hours)
**Risk if not done:** Context leakage between users in SSR/multi-tenant scenarios

#### Problem Statement

The `LiquidClient` class in `src/liquid-engine/client.ts` stores all tool states and readable contexts in a singleton instance. In server-side rendering or multi-user scenarios, this creates:

1. **Data leakage**: User A's context visible to User B
2. **State pollution**: Tool calls from one session affecting another
3. **Security vulnerability**: Sensitive data in shared memory

#### Solution Design

Create a session-scoped factory pattern with automatic cleanup:

```typescript
// New file: src/liquid-engine/clientFactory.ts

interface ClientSession {
    client: LiquidClient;
    createdAt: number;
    lastAccess: number;
}

class LiquidClientFactory {
    private sessions = new Map<string, ClientSession>();
    private cleanupInterval: NodeJS.Timer;
    private readonly SESSION_TTL = 30 * 60 * 1000; // 30 minutes

    constructor() {
        // Cleanup stale sessions every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    getClient(sessionId: string): LiquidClient {
        const existing = this.sessions.get(sessionId);
        if (existing) {
            existing.lastAccess = Date.now();
            return existing.client;
        }

        const client = new LiquidClient();
        this.sessions.set(sessionId, {
            client,
            createdAt: Date.now(),
            lastAccess: Date.now()
        });
        return client;
    }

    destroySession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now - session.lastAccess > this.SESSION_TTL) {
                this.sessions.delete(id);
            }
        }
    }

    shutdown(): void {
        clearInterval(this.cleanupInterval);
        this.sessions.clear();
    }
}

export const liquidClientFactory = new LiquidClientFactory();
```

#### Files to Modify

| File | Change |
|------|--------|
| `src/liquid-engine/clientFactory.ts` | **CREATE** - New factory class |
| `src/liquid-engine/index.ts` | Export factory alongside singleton |
| `src/liquid-engine/client.ts` | Add `reset()` method for cleanup |
| `src/context/AgentConfigContext.tsx` | Use factory with session ID from context |
| `src/hooks/useLiquidClient.ts` | **CREATE** - Hook that uses factory |

#### Implementation Steps

1. Create `clientFactory.ts` with session management
2. Add `reset()` method to `LiquidClient` class
3. Create React hook `useLiquidClient(sessionId)`
4. Update `AgentConfigContext` to use factory
5. Generate session ID in `App.tsx` (use `crypto.randomUUID()`)
6. Add cleanup on window unload

#### Verification Steps

```bash
# Unit test
bun test src/liquid-engine/clientFactory.test.ts

# Manual verification
# 1. Open two browser tabs
# 2. Register different contexts in each
# 3. Verify contexts don't leak between tabs
```

#### Success Criteria

- [ ] Each browser session gets unique client instance
- [ ] Sessions cleaned up after 30 min inactivity
- [ ] No cross-session data leakage
- [ ] Memory usage stable over time

---

### 1.2 Rate Limit Key Enhancement

**Priority:** P0-Critical
**Effort:** Low (1 hour)
**Risk if not done:** Legitimate users blocked behind shared NAT/proxy

#### Problem Statement

Current rate limiting uses IP address only (`ratelimit:${ip}`). Problems:

1. Corporate users behind NAT share one IP
2. Mobile users on carrier NAT affected
3. VPN users unfairly grouped

#### Solution Design

Implement tiered rate limit keys:

```typescript
// In server/src/index.ts - modify checkRateLimit

function getRateLimitKey(request: Request, userId?: string): string {
    // Priority 1: Authenticated user ID
    if (userId) {
        return `ratelimit:user:${userId}`;
    }

    // Priority 2: Session token (for anonymous but tracked users)
    const sessionToken = request.headers.get('X-Session-Token');
    if (sessionToken) {
        return `ratelimit:session:${sessionToken}`;
    }

    // Priority 3: IP address (fallback)
    const ip = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
             || request.headers.get('X-Real-IP')
             || 'unknown';
    return `ratelimit:ip:${ip}`;
}

// Different limits per tier
const RATE_LIMITS = {
    user: { max: 100, window: 15 * 60 * 1000 },    // Authenticated: 100/15min
    session: { max: 50, window: 15 * 60 * 1000 },  // Session: 50/15min
    ip: { max: 30, window: 15 * 60 * 1000 }        // Anonymous: 30/15min
};
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/index.ts` | Add `getRateLimitKey()`, update `checkRateLimit()` |
| `server/src/types.ts` | Add `RateLimitTier` type |

#### Implementation Steps

1. Add `getRateLimitKey()` function
2. Define `RATE_LIMITS` config object
3. Extract tier from key prefix in `checkRateLimit()`
4. Apply tier-specific limits
5. Add `X-RateLimit-Tier` response header for debugging

#### Verification Steps

```bash
# Test with curl
curl -H "X-Session-Token: test123" http://localhost:3000/api/v1/chat -v
# Should show X-RateLimit-Tier: session

# Test authenticated
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/chat -v
# Should show X-RateLimit-Tier: user
```

#### Success Criteria

- [ ] Authenticated users get higher limits
- [ ] Session tokens tracked separately from IP
- [ ] Rate limit tier visible in response headers
- [ ] No breaking changes to existing clients

---

### 1.3 ErrorBoundary Expansion

**Priority:** P0-Critical
**Effort:** Low (1-2 hours)
**Risk if not done:** Single component crash takes down entire page

#### Problem Statement

Only `GlassSankey` and `GlassCandlestickChartWebGPU` have ErrorBoundary wrappers. Other complex components can crash the whole app:

- `GlassFlow` (ReactFlow dependency)
- `GlassEditor` (rich text editing)
- `GlassSpreadsheet` (data grid)
- `GlassKanban` (drag and drop)
- All chart components

#### Solution Design

Use the existing `withErrorBoundary` HOC to wrap exports:

```typescript
// In src/components/data-display/index.ts

import { withErrorBoundary } from '../feedback/ErrorBoundary';
import { GlassFlowRaw } from './GlassFlow';
import { GlassEditorRaw } from './GlassEditor';
// ... etc

// Wrap complex components
export const GlassFlow = withErrorBoundary(GlassFlowRaw);
export const GlassEditor = withErrorBoundary(GlassEditorRaw);
export const GlassSpreadsheet = withErrorBoundary(GlassSpreadsheetRaw);
export const GlassKanban = withErrorBoundary(GlassKanbanRaw);
// ... all chart components
```

#### Files to Modify

| File | Change |
|------|--------|
| `src/components/data-display/GlassFlow.tsx` | Rename export to `GlassFlowRaw`, wrap |
| `src/components/data-display/GlassEditor.tsx` | Rename export to `GlassEditorRaw`, wrap |
| `src/components/features/GlassKanban.tsx` | Rename export to `GlassKanbanRaw`, wrap |
| `src/components/features/GlassSpreadsheet.tsx` | Rename export to `GlassSpreadsheetRaw`, wrap |
| `src/components/data-display/charts/*.tsx` | Wrap all chart exports |
| `src/components/data-display/index.ts` | Update exports |
| `src/components/features/index.ts` | Update exports |

#### Components to Wrap (Complete List)

**data-display (Charts):**
- GlassRadarChart
- GlassPolarAreaChart
- GlassStackedBarChart
- GlassHeatmap
- GlassTreemap
- GlassFunnelChart
- GlassCandlestickChart
- GlassScatterChart
- GlassGauge
- GlassDonutChart
- GlassCompareChart
- GlassSankey ✓ (already wrapped)
- GlassCandlestickChartWebGPU ✓ (already wrapped)

**features:**
- GlassKanban
- GlassSpreadsheet
- GlassFlow
- GlassFileTree
- GlassEditor
- GlassChat
- GlassPayment
- GlassTerminal
- GlassFilePreview
- GlassDataTable

**agentic:**
- GlassAgent
- GlassCopilot
- GlassDynamicUI

#### Implementation Steps

1. Create list of components requiring boundaries
2. For each component:
   a. Rename internal export to `*Raw`
   b. Export wrapped version as default name
   c. Add `componentName` prop for error reporting
3. Update barrel exports in index files
4. Test each wrapped component

#### Verification Steps

```typescript
// Add to existing test file or create new
// tests/unit/ErrorBoundary.test.tsx

it('catches errors in GlassFlow', () => {
    const BrokenFlow = () => { throw new Error('Test'); };
    render(
        <ErrorBoundary>
            <GlassFlow nodes={[]} edges={[]} />
        </ErrorBoundary>
    );
    // Should show error UI, not crash
});
```

#### Success Criteria

- [ ] All 25+ complex components wrapped
- [ ] Each component reports its name in errors
- [ ] Error UI renders correctly for each
- [ ] No regression in normal operation

---

### 1.4 WebSocket Authentication

**Priority:** P0-Critical
**Effort:** Medium (2 hours)
**Risk if not done:** Unauthorized WebSocket connections possible

#### Problem Statement

`WebSocketManager` accepts all connections without authentication:

```typescript
// Current: No auth check
open: (ws: any) => {
    const clientId = this.generateClientId();
    this.clients.set(clientId, ws);
    // ... connection accepted
}
```

This allows:
- Unauthorized access to price streams
- Potential for denial of service
- No audit trail of connections

#### Solution Design

Add token validation on WebSocket upgrade:

```typescript
// server/src/websocket.ts

import { verifyToken } from './auth'; // New auth module

interface WebSocketClient {
    ws: any;
    clientId: string;
    userId?: string;
    permissions: Set<string>;
    connectedAt: number;
}

export class WebSocketManager {
    private clients: Map<string, WebSocketClient> = new Map();

    startWebSocketServer(port: number = 3001) {
        const self = this;

        Bun.serve({
            port,
            fetch(req: Request, server): Response | undefined {
                // Extract token from query string or header
                const url = new URL(req.url);
                const token = url.searchParams.get('token')
                           || req.headers.get('Authorization')?.replace('Bearer ', '');

                // Validate token (async, but we need sync for upgrade)
                const isValid = self.validateTokenSync(token);

                if (!isValid && self.requireAuth) {
                    return new Response('Unauthorized', { status: 401 });
                }

                // Upgrade with metadata
                const upgraded = server.upgrade(req, {
                    data: {
                        token,
                        ip: req.headers.get('X-Forwarded-For') || 'unknown'
                    }
                });

                if (!upgraded) {
                    return new Response('WebSocket upgrade failed', { status: 400 });
                }
            },
            websocket: {
                open: (ws: any) => {
                    const { token, ip } = ws.data;
                    const decoded = self.decodeToken(token);

                    const clientId = self.generateClientId();
                    const client: WebSocketClient = {
                        ws,
                        clientId,
                        userId: decoded?.userId,
                        permissions: new Set(decoded?.permissions || ['read:prices']),
                        connectedAt: Date.now()
                    };

                    self.clients.set(clientId, client);

                    ws.send(JSON.stringify({
                        type: 'connected',
                        clientId,
                        permissions: Array.from(client.permissions),
                        timestamp: new Date().toISOString()
                    }));

                    console.log(`[WS] Client connected: ${clientId} (user: ${decoded?.userId || 'anonymous'})`);
                },
                message: (ws: any, message: string | Buffer) => {
                    const client = self.findClientBySocket(ws);
                    if (!client) return;

                    // Check permissions before processing
                    const data = JSON.parse(message.toString());
                    if (!self.hasPermission(client, data.type)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Permission denied',
                            required: self.getRequiredPermission(data.type)
                        }));
                        return;
                    }

                    self.handleMessage(client.clientId, data);
                }
            }
        });
    }

    private hasPermission(client: WebSocketClient, action: string): boolean {
        const permissionMap: Record<string, string> = {
            'subscribe': 'read:prices',
            'trade': 'write:trades',
            'chat': 'write:chat',
            'ping': 'read:prices' // Always allowed
        };

        const required = permissionMap[action] || 'admin';
        return client.permissions.has(required) || client.permissions.has('admin');
    }
}
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/websocket.ts` | Add auth validation, permission checks |
| `server/src/auth.ts` | **CREATE** - Token verification module |
| `server/src/types.ts` | Add `WebSocketClient` interface |

#### Implementation Steps

1. Create `auth.ts` with JWT verification (use existing patterns)
2. Add `WebSocketClient` interface with permissions
3. Update `startWebSocketServer` to validate on upgrade
4. Add permission checks in message handler
5. Update client connection logic
6. Add connection audit logging

#### Verification Steps

```bash
# Test without token (should fail if requireAuth=true)
wscat -c ws://localhost:3001
# Expected: Connection closed

# Test with valid token
wscat -c "ws://localhost:3001?token=<valid_jwt>"
# Expected: Connected message with permissions

# Test trade without permission
> {"type":"trade","data":{...}}
# Expected: Permission denied error
```

#### Success Criteria

- [ ] Connections require valid token (configurable)
- [ ] Permissions enforced per message type
- [ ] Anonymous users get read-only access
- [ ] Connection audit trail logged

---

## Phase 2: Performance & Scalability

### 2.1 Request Coalescing for AI Calls

**Priority:** P1-High
**Effort:** Medium (2 hours)
**Risk if not done:** API cost spikes during cache cold starts

#### Problem Statement

The cache has `getOrSet()` with stampede protection, but `callAI()` in `server/src/index.ts` doesn't use it:

```typescript
// Current: Direct cache check, no coalescing
async function callAI(provider, messages) {
    const cached = await getCachedResponse(lastMessage);
    if (cached) return cached;
    // Multiple concurrent requests hit API
}
```

#### Solution Design

Wire `callAI` through the cache's `getOrSet`:

```typescript
// server/src/index.ts

async function callAI(
    provider: 'gemini' | 'claude',
    messages: Array<{ role: string; content: string }>
): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const cacheKey = `ai:${provider}:${hashPrompt(lastMessage)}`;

    return cache.getOrSet(cacheKey, 'ai', async () => {
        // This fetcher only runs once per cache miss
        if (provider === 'claude') {
            return callClaudeAPI(messages);
        } else {
            return callGeminiAPI(messages);
        }
    });
}

function hashPrompt(prompt: string): string {
    return Bun.hash(prompt).toString(16);
}
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/index.ts` | Refactor `callAI` to use `cache.getOrSet` |
| `server/src/cache.ts` | Add type export for `getOrSet` |

#### Implementation Steps

1. Extract API calls into `callClaudeAPI()` and `callGeminiAPI()`
2. Create `hashPrompt()` utility
3. Refactor `callAI` to use `cache.getOrSet`
4. Add logging to verify coalescing works

#### Verification Steps

```bash
# Simulate stampede
for i in {1..10}; do
    curl -X POST http://localhost:3000/api/v1/chat \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"test"}]}' &
done
wait

# Check logs - should show only 1 API call
```

#### Success Criteria

- [ ] Multiple simultaneous requests share single API call
- [ ] Cache miss logged once per unique prompt
- [ ] No increase in response latency
- [ ] API costs reduced during traffic spikes

---

### 2.2 WebSocket Horizontal Scaling

**Priority:** P1-High
**Effort:** High (4-5 hours)
**Risk if not done:** Limited to single-server WebSocket deployment

#### Problem Statement

`WebSocketManager` uses in-memory `Map` for client storage. With multiple server instances:

1. Clients on Instance A don't receive broadcasts from Instance B
2. No shared subscription state
3. Can't load balance WebSocket connections

#### Solution Design

Use Redis Pub/Sub as message bus between instances:

```typescript
// server/src/websocket-redis.ts

import Redis from 'ioredis';

export class DistributedWebSocketManager extends WebSocketManager {
    private pubClient: Redis;
    private subClient: Redis;
    private instanceId: string;

    constructor() {
        super();
        this.instanceId = crypto.randomUUID();
    }

    async init(redisUrl: string) {
        this.pubClient = new Redis(redisUrl);
        this.subClient = new Redis(redisUrl);

        // Subscribe to broadcast channel
        await this.subClient.subscribe('ws:broadcast');

        this.subClient.on('message', (channel, message) => {
            if (channel === 'ws:broadcast') {
                const data = JSON.parse(message);
                // Don't re-broadcast our own messages
                if (data.sourceInstance !== this.instanceId) {
                    this.localBroadcast(data.payload);
                }
            }
        });
    }

    // Override broadcast to publish to Redis
    protected broadcast(message: Record<string, unknown>, excludeIds: string[] = []) {
        // Publish to Redis for other instances
        this.pubClient.publish('ws:broadcast', JSON.stringify({
            sourceInstance: this.instanceId,
            payload: message,
            excludeIds
        }));

        // Also broadcast locally
        this.localBroadcast(message, excludeIds);
    }

    private localBroadcast(message: Record<string, unknown>, excludeIds: string[] = []) {
        const data = JSON.stringify(message);
        for (const [clientId, client] of this.clients) {
            if (!excludeIds.includes(clientId)) {
                client.ws.send(data);
            }
        }
    }

    // Store subscriptions in Redis for cross-instance awareness
    async addSubscription(clientId: string, symbol: string) {
        await this.pubClient.sadd(`subs:${symbol}`, `${this.instanceId}:${clientId}`);
        super.addSubscription(clientId, symbol);
    }

    async removeSubscription(clientId: string, symbol: string) {
        await this.pubClient.srem(`subs:${symbol}`, `${this.instanceId}:${clientId}`);
        super.removeSubscription(clientId, symbol);
    }
}
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/websocket-redis.ts` | **CREATE** - Distributed WS manager |
| `server/src/websocket.ts` | Refactor to base class with local broadcast |
| `server/src/index.ts` | Use distributed manager when Redis available |

#### Implementation Steps

1. Refactor `WebSocketManager` to have `localBroadcast` method
2. Create `DistributedWebSocketManager` extending base
3. Add Redis pub/sub for cross-instance messaging
4. Store subscription state in Redis Sets
5. Add instance ID for message deduplication
6. Update `index.ts` to use distributed manager when Redis connected
7. Add graceful fallback when Redis unavailable

#### Verification Steps

```bash
# Start two server instances
PORT=3000 bun run server &
PORT=3001 bun run server &

# Connect clients to different instances
wscat -c ws://localhost:3000 &
wscat -c ws://localhost:3001 &

# Send message - both should receive
# Check Redis: PUBSUB CHANNELS 'ws:*'
```

#### Success Criteria

- [ ] Messages broadcast across all instances
- [ ] Subscriptions persist across instance restarts
- [ ] Graceful degradation when Redis unavailable
- [ ] No duplicate messages received

---

### 2.3 Theme Hydration Race Fix

**Priority:** P1-High
**Effort:** Low (1 hour)
**Risk if not done:** Flash of wrong theme on page load

#### Problem Statement

`initializeCSSVariableSubscriber` runs after store creation. On fast navigation:

1. React mounts with default theme
2. Store hydrates from localStorage
3. CSS variables update (flash!)

#### Solution Design

Synchronously apply CSS variables before React mount:

```typescript
// src/stores/utils/syncHydrate.ts

/**
 * Synchronously hydrate CSS variables from localStorage
 * Must run BEFORE React mounts
 */
export function syncHydrateTheme() {
    try {
        const stored = localStorage.getItem('theme-store');
        if (!stored) return;

        const state = JSON.parse(stored).state;
        const root = document.documentElement;

        // Critical CSS variables that affect initial render
        const criticalVars = {
            '--glass-blur': state.glassBlur || 10,
            '--glass-opacity': state.glassOpacity || 0.4,
            '--glass-radius': state.glassRadius || 16,
            '--bg-primary': state.mode === 'dark' ? '#000000' : '#ffffff',
            '--bg-secondary': state.mode === 'dark' ? '#1a1a1a' : '#f5f5f5'
        };

        for (const [key, value] of Object.entries(criticalVars)) {
            root.style.setProperty(key, String(value) + (key.includes('blur') || key.includes('radius') ? 'px' : ''));
        }

        // Set data-theme attribute for Tailwind
        root.setAttribute('data-theme', state.mode || 'dark');

    } catch (e) {
        // Silently fail - store will hydrate normally
        console.warn('[Theme] Sync hydration failed:', e);
    }
}
```

```typescript
// src/main.tsx
import { syncHydrateTheme } from './stores/utils/syncHydrate';

// Run BEFORE React
syncHydrateTheme();

// Then mount React
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

#### Files to Modify

| File | Change |
|------|--------|
| `src/stores/utils/syncHydrate.ts` | **CREATE** - Sync hydration utility |
| `src/main.tsx` | Call `syncHydrateTheme()` before React mount |

#### Implementation Steps

1. Create `syncHydrate.ts` with localStorage parsing
2. Extract critical CSS variables list from `cssVariableMiddleware.ts`
3. Add call in `main.tsx` before `createRoot`
4. Test with slow network simulation

#### Verification Steps

```bash
# 1. Set theme to light mode
# 2. Hard refresh (Cmd+Shift+R)
# 3. Should NOT flash dark theme
```

#### Success Criteria

- [ ] No theme flash on page load
- [ ] Works with cleared cache
- [ ] Graceful fallback if localStorage corrupt

---

## Phase 3: Developer Experience & Observability

### 3.1 Structured Logging (Pino)

**Priority:** P2-Medium
**Effort:** Medium (2-3 hours)
**Risk if not done:** Difficult to debug production issues

#### Problem Statement

Current logging uses `console.log` with string concatenation:

```typescript
console.log('[Redis] Connected successfully');
console.error('[WebSocket] Invalid message');
```

Issues:
- No log levels in production
- No structured data for log aggregation
- No request correlation
- No performance metrics

#### Solution Design

Implement Pino logger with request context:

```typescript
// server/src/logger.ts

import pino from 'pino';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    base: {
        service: 'liquid-glass-server',
        version: process.env.npm_package_version
    }
});

// Request-scoped child logger
export function createRequestLogger(requestId: string, userId?: string) {
    return logger.child({ requestId, userId });
}

// Usage
// Before: console.log('[Redis] Connected');
// After:  logger.info({ component: 'redis' }, 'Connected successfully');
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/logger.ts` | **CREATE** - Pino logger setup |
| `server/package.json` | Add `pino` and `pino-pretty` dependencies |
| `server/src/index.ts` | Replace `console.log` with logger |
| `server/src/cache.ts` | Replace `console.log` with logger |
| `server/src/websocket.ts` | Replace `console.log` with logger |
| `server/src/security.ts` | Replace `console.log` with logger |

#### Implementation Steps

1. Install `pino` and `pino-pretty` (dev)
2. Create `logger.ts` with base configuration
3. Create `createRequestLogger` for request context
4. Add request ID middleware to Elysia
5. Replace all `console.log/error` calls
6. Add performance logging for AI calls

#### Log Format

```json
{
    "level": "info",
    "time": 1704825600000,
    "service": "liquid-glass-server",
    "requestId": "abc123",
    "userId": "user_456",
    "component": "ai",
    "provider": "claude",
    "duration": 1234,
    "cached": false,
    "msg": "AI response generated"
}
```

#### Success Criteria

- [ ] All logs structured as JSON in production
- [ ] Request IDs correlate across log entries
- [ ] Log levels work (debug hidden in prod)
- [ ] Pretty printing in development

---

### 3.2 OpenTelemetry Integration

**Priority:** P2-Medium
**Effort:** High (4-5 hours)
**Risk if not done:** No distributed tracing, blind to performance issues

#### Problem Statement

No visibility into:
- Request flow through services
- AI API latency breakdown
- Cache hit/miss patterns over time
- Error rates by endpoint

#### Solution Design

```typescript
// server/src/telemetry.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'liquid-glass-server',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version
    }),
    traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
    }),
    metricReader: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics'
    })
});

export function initTelemetry() {
    sdk.start();
    process.on('SIGTERM', () => sdk.shutdown());
}

// Usage in routes
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('liquid-server');

async function callAI(provider, messages) {
    const span = tracer.startSpan('callAI', {
        attributes: { 'ai.provider': provider, 'ai.message_count': messages.length }
    });

    try {
        const result = await actualCallAI(provider, messages);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
    } finally {
        span.end();
    }
}
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/telemetry.ts` | **CREATE** - OTEL SDK setup |
| `server/package.json` | Add OpenTelemetry packages |
| `server/src/index.ts` | Call `initTelemetry()` at startup |
| `server/src/index.ts` | Add spans around AI calls, cache, etc. |

#### Dependencies (package.json)

```json
{
    "@opentelemetry/sdk-node": "^0.48.0",
    "@opentelemetry/api": "^1.7.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.48.0",
    "@opentelemetry/exporter-metrics-otlp-http": "^0.48.0",
    "@opentelemetry/semantic-conventions": "^1.21.0"
}
```

#### Implementation Steps

1. Install OpenTelemetry packages
2. Create `telemetry.ts` with SDK configuration
3. Add spans around:
   - HTTP request handling
   - AI API calls
   - Cache operations
   - Redis operations
   - WebSocket events
4. Add metrics for:
   - Request latency histogram
   - Cache hit rate gauge
   - Active WebSocket connections gauge
5. Configure exporter (Jaeger, Honeycomb, or OTLP collector)

#### Verification Steps

```bash
# Start Jaeger locally
docker run -d --name jaeger \
    -p 16686:16686 \
    -p 4318:4318 \
    jaegertracing/all-in-one:latest

# Make requests
curl http://localhost:3000/api/v1/chat -d '...'

# View traces at http://localhost:16686
```

#### Success Criteria

- [ ] Traces visible in Jaeger/Honeycomb
- [ ] AI call duration measured
- [ ] Cache hit/miss visible in traces
- [ ] Error spans correctly attributed

---

### 3.3 GraphQL Schema Completion

**Priority:** P2-Medium
**Effort:** Medium (3 hours)
**Risk if not done:** Limited API expressiveness for complex clients

#### Problem Statement

Current GraphQL endpoint only supports basic chat query. Missing:
- Portfolio queries
- Market data queries
- Mutations for trades
- Subscriptions for real-time data
- Proper type definitions

#### Solution Design

```graphql
# server/src/schemas/graphql.ts

type Query {
    chat(prompt: String!, provider: Provider): ChatResponse!
    portfolio: Portfolio!
    marketData(symbols: [String!]!): [MarketData!]!
    serverStatus: ServerStatus!
}

type Mutation {
    sendMessage(input: ChatInput!): ChatResponse!
    createTrade(input: TradeInput!): Trade!
    updateWatchlist(symbols: [String!]!): Watchlist!
}

type Subscription {
    priceUpdates(symbols: [String!]!): MarketData!
    chatStream(prompt: String!): ChatStreamEvent!
}

enum Provider {
    GEMINI
    CLAUDE
}

type ChatResponse {
    id: ID!
    content: String!
    provider: Provider!
    cached: Boolean!
    timestamp: DateTime!
}

type MarketData {
    symbol: String!
    price: Float!
    change24h: Float!
    volume: Float!
    timestamp: DateTime!
}

type Portfolio {
    totalValue: Float!
    positions: [Position!]!
    performance24h: Float!
}

type Position {
    symbol: String!
    quantity: Float!
    avgPrice: Float!
    currentPrice: Float!
    pnl: Float!
}

input ChatInput {
    messages: [MessageInput!]!
    provider: Provider
}

input MessageInput {
    role: String!
    content: String!
}

input TradeInput {
    symbol: String!
    side: TradeSide!
    quantity: Float!
    price: Float
}

enum TradeSide {
    BUY
    SELL
}
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/schemas/graphql.ts` | **CREATE** - Full GraphQL schema |
| `server/src/resolvers/index.ts` | **CREATE** - Resolver implementations |
| `server/src/index.ts` | Register GraphQL with Elysia |
| `server/package.json` | Add `graphql`, `graphql-yoga` or similar |

#### Implementation Steps

1. Define complete schema in `graphql.ts`
2. Create resolvers for each query/mutation
3. Implement subscription handlers using SSE or WS
4. Add authentication middleware for mutations
5. Generate TypeScript types from schema
6. Add GraphQL Playground in development

#### Success Criteria

- [ ] Full schema with all types
- [ ] Working subscriptions for price updates
- [ ] Mutations protected by auth
- [ ] TypeScript types generated from schema

---

### 3.4 Directive Version Checksums

**Priority:** P2-Medium
**Effort:** Low (1-2 hours)
**Risk if not done:** Agent executes outdated instructions

#### Problem Statement

Directives reference scripts that may change:

```markdown
## Tools
- `scripts/healer.ts`: Generates fix PRD
```

If `healer.ts` changes behavior, the directive becomes outdated.

#### Solution Design

Add checksums and version metadata:

```markdown
---
name: ralph_node
version: 1.0.0
updated: 2026-01-10
dependencies:
    - path: scripts/ralph_runner.ts
      sha256: abc123...
      version: "^1.0.0"
    - path: scripts/healer.ts
      sha256: def456...
---

# Ralph Iteration Directive
...
```

Verification script:

```typescript
// scripts/verify_directives.ts

import { createHash } from 'crypto';
import { glob } from 'glob';
import { parse as parseYaml } from 'yaml';

async function verifyDirectives() {
    const directives = await glob('directives/*.md');
    const errors: string[] = [];

    for (const file of directives) {
        const content = await Bun.file(file).text();
        const frontmatter = extractFrontmatter(content);

        if (!frontmatter.dependencies) continue;

        for (const dep of frontmatter.dependencies) {
            const scriptContent = await Bun.file(dep.path).text();
            const actualHash = createHash('sha256').update(scriptContent).digest('hex');

            if (actualHash !== dep.sha256) {
                errors.push(`${file}: ${dep.path} hash mismatch (expected ${dep.sha256.slice(0, 8)}..., got ${actualHash.slice(0, 8)}...)`);
            }
        }
    }

    if (errors.length > 0) {
        console.error('Directive verification failed:');
        errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }

    console.log('All directives verified successfully');
}
```

#### Files to Modify

| File | Change |
|------|--------|
| `scripts/verify_directives.ts` | **CREATE** - Verification script |
| `scripts/update_directive_hashes.ts` | **CREATE** - Hash update script |
| `directives/*.md` | Add frontmatter with dependencies |
| `.github/workflows/ci.yml` | Add directive verification step |

#### Implementation Steps

1. Create `verify_directives.ts` script
2. Create `update_directive_hashes.ts` to regenerate hashes
3. Add frontmatter to all directives with dependencies
4. Add CI step to verify on PR
5. Add pre-commit hook to update hashes

#### Success Criteria

- [ ] All directives have checksums
- [ ] CI fails on hash mismatch
- [ ] Update script regenerates hashes

---

## Phase 4: Advanced Features

### 4.1 Plugin Sandbox Execution

**Priority:** P3-Low
**Effort:** High (4-5 hours)
**Risk if not done:** Malicious plugins could compromise system

#### Problem Statement

`LiquidSkills` plugins can execute arbitrary Bun scripts:

```json
// plugin.json
{
    "hooks": {
        "PostToolUse": [{
            "command": "bun run ${CLAUDE_PLUGIN_ROOT}/tools/audit.ts"
        }]
    }
}
```

No sandboxing = plugin can:
- Access filesystem
- Make network requests
- Read environment variables
- Execute system commands

#### Solution Design

Run plugin commands in isolated subprocess with minimal capabilities:

```typescript
// server/src/sandbox.ts

interface SandboxOptions {
    timeout: number;
    maxMemory: number;
    allowedEnv: string[];
    allowedPaths: string[];
}

export async function runInSandbox(
    command: string,
    cwd: string,
    options: Partial<SandboxOptions> = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const defaults: SandboxOptions = {
        timeout: 30000,
        maxMemory: 128 * 1024 * 1024, // 128MB
        allowedEnv: ['PATH', 'HOME', 'NODE_ENV'],
        allowedPaths: [cwd]
    };

    const opts = { ...defaults, ...options };

    // Filter environment
    const safeEnv: Record<string, string> = {};
    for (const key of opts.allowedEnv) {
        if (process.env[key]) {
            safeEnv[key] = process.env[key];
        }
    }

    // Create sandbox directory
    const sandboxDir = `/tmp/liquid-sandbox-${Date.now()}`;
    await Bun.spawn(['mkdir', '-p', sandboxDir]).exited;

    // Copy allowed files
    for (const path of opts.allowedPaths) {
        await Bun.spawn(['cp', '-r', path, sandboxDir]).exited;
    }

    try {
        const proc = Bun.spawn(['bun', 'run', command], {
            cwd: sandboxDir,
            env: safeEnv,
            timeout: opts.timeout
        });

        const [stdout, stderr] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text()
        ]);

        const exitCode = await proc.exited;

        return { stdout, stderr, exitCode };
    } finally {
        // Cleanup sandbox
        await Bun.spawn(['rm', '-rf', sandboxDir]).exited;
    }
}
```

#### Files to Modify

| File | Change |
|------|--------|
| `server/src/sandbox.ts` | **CREATE** - Sandbox execution |
| `server/src/routes/plugins.ts` | Use sandbox for hook execution |
| `LiquidSkills/liquid-design/plugin.json` | Add permission declarations |

#### Success Criteria

- [ ] Plugins run in isolated directory
- [ ] Environment variables filtered
- [ ] Timeouts enforced
- [ ] Cleanup on completion

---

### 4.2 Self-Healing Production Loop

**Priority:** P3-Low
**Effort:** High (5-6 hours)
**Depends on:** 3.1 (Structured Logging), 3.2 (OpenTelemetry)

#### Problem Statement

When client errors occur, they're logged to `/api/v1/security/audit` but not acted upon automatically.

#### Solution Design

Complete the self-healing loop:

```
Client Error → Audit API → Error Analyzer Agent → PRD Generation → Ralph Loop → Fix → Deploy
```

```typescript
// server/src/healer/analyzer.ts

interface ErrorReport {
    type: 'client_error';
    message: string;
    stack: string;
    context: {
        componentName?: string;
        url: string;
        userAgent: string;
    };
}

export async function analyzeError(error: ErrorReport): Promise<HealingPRD | null> {
    // 1. Deduplicate - check if we've seen this error recently
    const errorHash = hashError(error);
    if (await isRecentlyHealed(errorHash)) {
        return null;
    }

    // 2. AI Analysis
    const analysis = await callClaudeAPI([{
        role: 'system',
        content: HEALER_SYSTEM_PROMPT
    }, {
        role: 'user',
        content: `Analyze this client error and suggest a fix:\n\n${JSON.stringify(error, null, 2)}`
    }]);

    // 3. Parse AI response into PRD structure
    const prd = parseHealingPRD(analysis);

    // 4. Validate PRD is actionable
    if (!prd || !prd.stories?.length) {
        return null;
    }

    // 5. Mark as in-progress
    await markHealingStarted(errorHash);

    return prd;
}

// Cron or webhook to process healing queue
export async function processHealingQueue() {
    const pendingPRDs = await getPendingHealingPRDs();

    for (const prd of pendingPRDs) {
        // Run Ralph loop
        const result = await runRalphLoop(prd);

        if (result.success) {
            // Auto-deploy to preview
            await deployPreview(result.branch);

            // Create PR
            await createHealingPR(prd, result);
        } else {
            // Escalate to human
            await notifyMaintainers(prd, result.error);
        }
    }
}
```

#### Files to Create

| File | Purpose |
|------|---------|
| `server/src/healer/analyzer.ts` | Error analysis logic |
| `server/src/healer/prd.ts` | PRD generation |
| `server/src/healer/queue.ts` | Healing job queue |
| `server/src/healer/prompts.ts` | AI prompts for healing |
| `scripts/healer_cron.ts` | Cron job for queue processing |

#### Success Criteria

- [ ] Client errors trigger analysis
- [ ] Valid PRDs generated from errors
- [ ] Ralph loop executes fixes
- [ ] PRs created automatically
- [ ] Maintainers notified on failure

---

### 4.3 Multi-Agent Orchestration

**Priority:** P3-Low
**Effort:** Very High (8+ hours)
**Depends on:** 4.1 (Plugin Sandbox), 4.2 (Self-Healing)

#### Problem Statement

Large features exceed single-agent context. Need parallel specialist agents:
- UI Specialist
- API Specialist
- Security Specialist
- Test Specialist

#### Solution Design

See `directives/orchestrator.md` for base pattern. Expand to:

1. **Orchestrator Agent**: Splits PRD by domain
2. **Specialist Agents**: Work in parallel on sub-PRDs
3. **Merge Agent**: Combines work, resolves conflicts
4. **Verification Agent**: Runs tests, validates integration

This is a substantial architectural project requiring:
- Agent protocol definition
- PRD decomposition logic
- Conflict detection/resolution
- Progress synchronization
- Context sharing between agents

#### Files to Create

| File | Purpose |
|------|---------|
| `server/src/orchestrator/index.ts` | Main orchestration logic |
| `server/src/orchestrator/decompose.ts` | PRD splitting |
| `server/src/orchestrator/merge.ts` | Work merging |
| `server/src/orchestrator/specialists/*.ts` | Specialist definitions |
| `directives/specialists/*.md` | Specialist SOPs |

#### Success Criteria

- [ ] Orchestrator decomposes PRD correctly
- [ ] Specialists work in parallel
- [ ] No file conflicts in merged result
- [ ] End-to-end tests pass after merge

---

### 4.4 Federated Plugin Registry

**Priority:** P3-Low
**Effort:** Very High (10+ hours)
**Depends on:** 4.1 (Plugin Sandbox)

#### Problem Statement

LiquidSkills are local to this repo. For ecosystem growth, need:
- Public registry for sharing plugins
- Version management
- Security scanning
- Dependency resolution

#### Solution Design

This is a substantial project requiring:
- Registry server (npm-like)
- CLI for publish/install
- Signature verification
- Sandbox scanning
- Version resolution algorithm

Out of scope for this implementation plan. Recommend tracking as separate epic.

---

## Implementation Checklist

### Phase 1: Critical (Complete First)

- [ ] 1.1 Session-Scoped LiquidClient
- [ ] 1.2 Rate Limit Key Enhancement
- [ ] 1.3 ErrorBoundary Expansion
- [ ] 1.4 WebSocket Authentication

### Phase 2: Performance (Week 2)

- [ ] 2.1 Request Coalescing for AI
- [ ] 2.2 WebSocket Horizontal Scaling
- [ ] 2.3 Theme Hydration Race Fix

### Phase 3: Developer Experience (Week 3)

- [x] 3.1 Structured Logging (Pino)
- [x] 3.2 OpenTelemetry Integration
- [x] 3.3 GraphQL Schema Completion
- [x] 3.4 Directive Version Checksums

### Phase 4: Advanced (Future)

- [x] 4.1 Plugin Sandbox Execution
- [x] 4.2 Self-Healing Production Loop
- [x] 4.3 Multi-Agent Orchestration
- [x] 4.4 Federated Plugin Registry

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking change in client API | Medium | High | Version API, deprecation period |
| Redis dependency becomes required | Low | Medium | Maintain memory fallback |
| OpenTelemetry overhead | Low | Low | Sampling configuration |
| Sandbox escape | Low | High | Security review, capability list |
| Agent infinite loop | Medium | Medium | Max iteration limits, cost caps |

---

## Appendix: Command Reference

```bash
# Run Phase 1 implementation
bun run scripts/ralph_runner.ts --prd docs/prd/phase1.json

# Verify directives
bun run scripts/verify_directives.ts

# Run full test suite
bun test && bun run test:e2e

# Check bundle size
bun run build && npx bundlewatch

# Start with telemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 bun run server
```

---

*This plan follows the 3-Layer Architecture: Directives define what, Orchestration (you) decides when, Execution (scripts) does the work.*
