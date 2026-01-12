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
7. [Phase 5: A2A Protocol Integration](#phase-5-a2a-protocol-integration)
8. [Phase 6: Agent Hub UI](#phase-6-agent-hub-ui)
9. [Implementation Checklist](#implementation-checklist)
10. [Risk Register](#risk-register)

---

## Executive Summary

This plan addresses 24 improvements identified during codebase analysis, organized into 6 phases by priority. Each item includes:

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
| 5.1 | A2A Protocol Types | P2-Medium | 5 | Medium | Low |
| 5.2 | A2UI Transformer | P2-Medium | 5 | Medium | Low |
| 5.3 | A2A Client | P2-Medium | 5 | Medium | Low |
| 5.4 | A2A Server Handler | P2-Medium | 5 | Medium | Low |
| 6.1 | Agent Hub Page | P2-Medium | 6 | Medium | Low |
| 6.2 | Agent Card Components | P2-Medium | 6 | Medium | Low |
| 6.3 | Agent Probe Discovery | P2-Medium | 6 | Medium | Low |
| 6.4 | Agent Chat Window | P2-Medium | 6 | Medium | Low |
| 6.5 | Curated Agent Registry | P2-Medium | 6 | Low | Low |
| 6.6 | Two Worlds Integration | P2-Medium | 6 | Low | Low |

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

## Phase 5: A2A Protocol Integration

### 5.1 A2A Protocol Types

**Priority:** P2-Medium
**Effort:** Medium (2-3 hours)
**Status:** ✅ Complete

#### Problem Statement

LiquidCrypto lacks interoperability with external AI agents. Google's A2A (Agent-to-Agent) protocol provides a standard for agent communication, but requires comprehensive type definitions.

#### Solution Design

Complete TypeScript type definitions for A2A and A2UI v0.8 specifications:

```typescript
// src/a2a/types.ts

// Task states
export type TaskState =
    | 'submitted'
    | 'working'
    | 'input_required'
    | 'completed'
    | 'failed'
    | 'cancelled';

// A2UI message types
export type A2UIMessageType =
    | 'beginRendering'
    | 'surfaceUpdate'
    | 'dataModelUpdate'
    | 'deleteSurface';

// Data binding types
export type A2UIBindingValue =
    | { literalString: string }
    | { path: string }
    | { template: string };

// Agent Card for discovery
export interface AgentCard {
    name: string;
    description: string;
    url: string;
    version: string;
    capabilities: AgentCapability[];
    authentication: AgentAuthentication;
}
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/a2a/types.ts` | Complete A2A & A2UI type definitions (500+ lines) |
| `server/src/a2a/types.ts` | Server-side types |

#### Success Criteria

- [x] All A2A protocol types defined
- [x] A2UI v0.8 message types complete
- [x] Component type definitions
- [x] Glass component catalog for validation

---

### 5.2 A2UI Transformer

**Priority:** P2-Medium
**Effort:** Medium (3-4 hours)
**Status:** ✅ Complete

#### Problem Statement

A2UI JSON payloads need transformation to LiquidCrypto's Glass UINode format for rendering with existing components.

#### Solution Design

Transformer that converts A2UI components to Glass UINode tree:

```typescript
// src/a2a/transformer.ts

export function transformA2UI(
    messages: A2UIMessage[],
    onAction?: (actionId: string, data?: unknown) => void
): UINode | null {
    const state = createTransformerState();

    for (const message of messages) {
        processA2UIMessage(message, state);
    }

    return state.surfaces.get(state.primarySurfaceId) || null;
}

// Component mapping
function transformComponent(component: A2UIComponent): UINode {
    switch (component.type) {
        case 'Text':
            return { type: 'text', props: { children: resolveBinding(component.content) } };
        case 'Button':
            return { type: 'button', props: { children: resolveBinding(component.label) } };
        case 'Row':
            return { type: 'stack', props: { direction: 'horizontal' } };
        case 'Column':
            return { type: 'stack', props: { direction: 'vertical' } };
        // ... 15+ component types
    }
}
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/a2a/transformer.ts` | A2UI → Glass transformer (500+ lines) |

#### Key Features

- Data binding resolution (`literalString`, `path`, `template`)
- Surface state management for progressive updates
- Action binding for interactive components
- Validation with component count limits (500 max)
- Depth limit enforcement (10 max)

#### Success Criteria

- [x] All A2UI component types mapped
- [x] Data binding resolution working
- [x] Progressive rendering supported
- [x] Validation prevents DoS

---

### 5.3 A2A Client

**Priority:** P2-Medium
**Effort:** Medium (3-4 hours)
**Status:** ✅ Complete

#### Problem Statement

Need a client to connect to external A2A-compliant agents with streaming support for real-time UI updates.

#### Solution Design

A2A client with JSON-RPC 2.0 and SSE streaming:

```typescript
// src/a2a/client.ts

export class A2AClient {
    private baseUrl: string;

    constructor(baseUrl: string, config?: A2AClientConfig) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async getAgentCard(): Promise<AgentCard> {
        const response = await fetch(`${this.baseUrl}/.well-known/agent.json`);
        return response.json();
    }

    async sendText(text: string): Promise<Task> {
        return this.sendMessage([{ parts: [{ kind: 'text', text }] }]);
    }

    async *streamText(text: string): AsyncGenerator<TaskStreamEvent> {
        // SSE streaming implementation
        const response = await fetch(`${this.baseUrl}/a2a/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'message/send', params: { message: { parts: [{ kind: 'text', text }] } } })
        });

        const reader = response.body?.getReader();
        // ... yield events as they arrive
    }

    extractA2UIParts(task: Task): A2UIPart[] {
        // Extract A2UI parts from task history
    }
}

// React hook
export function useA2AClient(baseUrl: string): A2AClient {
    return useMemo(() => new A2AClient(baseUrl), [baseUrl]);
}
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/a2a/client.ts` | A2A protocol client (400+ lines) |

#### Key Features

- JSON-RPC 2.0 request handling
- SSE streaming for real-time updates
- Agent Card discovery
- Task lifecycle management
- A2UI part extraction
- React hook `useA2AClient`

#### Success Criteria

- [x] Connect to A2A agents
- [x] Stream task updates
- [x] Extract A2UI messages
- [x] React hook available

---

### 5.4 A2A Server Handler

**Priority:** P2-Medium
**Effort:** Medium (2-3 hours)
**Status:** ✅ Complete

#### Problem Statement

LiquidCrypto should be able to act as an A2A agent, accepting requests from other agents and returning A2UI payloads.

#### Solution Design

JSON-RPC handler for A2A protocol:

```typescript
// server/src/a2a/handler.ts

export class A2AHandler {
    private tasks: Map<string, Task> = new Map();
    private contextIndex: Map<string, string[]> = new Map();

    async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
        switch (request.method) {
            case 'agent/card':
                return this.getAgentCard();
            case 'message/send':
                return this.handleMessageSend(request.params);
            case 'tasks/get':
                return this.getTask(request.params.taskId);
            case 'tasks/list':
                return this.listTasks(request.params.contextId);
            case 'tasks/cancel':
                return this.cancelTask(request.params.taskId);
            default:
                return { error: { code: -32601, message: 'Method not found' } };
        }
    }
}

// Server endpoints added to server/src/index.ts:
// GET  /.well-known/agent.json - Agent Card discovery
// POST /a2a                    - JSON-RPC 2.0 endpoint
// POST /a2a/stream             - SSE streaming endpoint
```

#### Files Created

| File | Purpose |
|------|---------|
| `server/src/a2a/handler.ts` | JSON-RPC handler |
| `server/src/a2a/types.ts` | Server-side types |
| `server/src/a2a/index.ts` | Module exports |

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/agent.json` | GET | Agent Card discovery |
| `/a2a` | POST | JSON-RPC 2.0 A2A requests |
| `/a2a/stream` | POST | SSE streaming |

#### Success Criteria

- [x] Agent Card served at well-known URL
- [x] JSON-RPC 2.0 compliant
- [x] Task lifecycle management
- [x] Context-based task indexing

---

### 5.5 A2UI Renderer Component

**Priority:** P2-Medium
**Effort:** Medium (2-3 hours)
**Status:** ✅ Complete

#### Problem Statement

Need a React component to render A2UI payloads using Glass components with support for streaming updates.

#### Solution Design

```tsx
// src/components/agentic/GlassA2UIRenderer.tsx

export interface GlassA2UIRendererProps {
    messages: A2UIMessage[];
    onAction?: (actionId: string, data?: unknown) => void;
    streaming?: boolean;
    loading?: boolean;
    validate?: boolean;
    surfaceId?: string;
}

export const GlassA2UIRenderer = React.forwardRef<HTMLDivElement, GlassA2UIRendererProps>(
    ({ messages, onAction, streaming, loading, validate = true, surfaceId, ...props }, ref) => {
        const uiTree = useMemo(() => {
            if (validate) {
                const validation = validateA2UIPayload(messages);
                if (!validation.valid) {
                    console.warn('A2UI validation failed:', validation.errors);
                }
            }
            return transformA2UI(messages, onAction);
        }, [messages, onAction, validate]);

        return (
            <GlassContainer ref={ref} {...props}>
                <GlassDynamicUI
                    tree={uiTree}
                    streaming={streaming}
                />
            </GlassContainer>
        );
    }
);

// Connected renderer with agent
export const ConnectedA2UIRenderer: React.FC<{
    agentUrl: string;
    initialPrompt?: string;
    onAction?: (actionId: string, data?: unknown) => void;
}> = ({ agentUrl, initialPrompt, onAction }) => {
    const { messages, loading, send } = useA2UIStream(agentUrl);
    // ... render with streaming support
};
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/components/agentic/GlassA2UIRenderer.tsx` | React rendering component |
| `src/components/agentic/GlassA2UIRenderer.stories.tsx` | Storybook stories |

#### Storybook Stories

- Restaurant List
- Booking Form
- Booking Confirmation
- Sales Dashboard
- Location Map
- Crypto Portfolio
- Trading Interface
- Loading State
- Empty State
- Streaming Mode
- Interactive Demo

#### Success Criteria

- [x] Renders A2UI payloads correctly
- [x] Streaming mode supported
- [x] Action callbacks work
- [x] Storybook documentation

---

### 5.6 A2UI Examples

**Priority:** P2-Medium
**Effort:** Low (1-2 hours)
**Status:** ✅ Complete

#### Problem Statement

Need example A2UI payloads to demonstrate capabilities and for testing.

#### Solution Design

Transform Google's reference examples plus create crypto-specific ones:

```typescript
// src/a2a/examples/restaurant-finder.ts
export const restaurantFinderExamples = {
    singleColumnList: [...],    // Restaurant listing
    bookingForm: [...],         // Reservation form
    confirmation: [...]         // Booking confirmation
};

// src/a2a/examples/rizzcharts.ts
export const rizzchartsExamples = {
    salesDashboard: [...],      // Analytics dashboard
    locationMap: [...],         // Store locations
    cryptoPortfolio: [...],     // Portfolio holdings
    tradingInterface: [...]     // Trade execution
};
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/a2a/examples/index.ts` | Example exports |
| `src/a2a/examples/restaurant-finder.ts` | Restaurant booking examples |
| `src/a2a/examples/rizzcharts.ts` | Analytics & crypto examples |

#### Success Criteria

- [x] Google examples transformed
- [x] Crypto-specific examples added
- [x] All examples render correctly
- [x] Used in Storybook stories

---

### Phase 5 Test Coverage

**File:** `tests/unit/a2a.test.ts`
**Tests:** 30+

| Test Group | Tests |
|------------|-------|
| Data Binding | 3 tests |
| Transformer State | 3 tests |
| Component Transformation | 15+ tests |
| Validation | 4 tests |
| Examples | 5+ tests |

```bash
# Run A2A tests
bun test tests/unit/a2a.test.ts
```

---

## Phase 6: Agent Hub UI

### 6.1 Agent Hub Page

**Priority:** P2-Medium
**Effort:** Medium (3-4 hours)
**Status:** ✅ Complete

#### Problem Statement

Users need a centralized place to discover, browse, and connect to A2A-compliant agents—an "App Store" for AI agents.

#### Solution Design

```tsx
// src/pages/AgentHub.tsx

export const AgentHub: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    const agents = getCuratedAgents(selectedCategory || undefined);
    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <GlassContainer className="min-h-screen p-8">
            {/* Category Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {AGENT_CATEGORIES.map(cat => (
                    <CategoryCard key={cat.id} category={cat} />
                ))}
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-3 gap-6">
                {filteredAgents.map(agent => (
                    <AgentCard
                        key={agent.id}
                        agent={agent}
                        onClick={() => setSelectedAgent(agent)}
                    />
                ))}
            </div>

            {/* Chat Window (when agent selected) */}
            {selectedAgent && (
                <AgentChatWindow
                    agent={selectedAgent}
                    onClose={() => setSelectedAgent(null)}
                />
            )}
        </GlassContainer>
    );
};
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/pages/AgentHub.tsx` | Main Agent Hub page |
| `src/Router.tsx` | Route added at `/hub` |
| `src/components/navigation/GlassDock.tsx` | Compass icon added |

#### Success Criteria

- [x] Agent Hub page accessible at `/hub`
- [x] Category filtering works
- [x] Search functionality
- [x] Agent selection opens chat

---

### 6.2 Agent Card Components

**Priority:** P2-Medium
**Effort:** Medium (2-3 hours)
**Status:** ✅ Complete

#### Problem Statement

Need visually appealing cards to showcase agents with their capabilities, with 3D perspective hover effects matching the Glass design system.

#### Solution Design

```tsx
// src/components/agents/AgentCard.tsx

export const AgentCard: React.FC<AgentCardProps> = ({ agent, size = 'md', onClick }) => {
    const [ref, bounds] = useMeasure();

    // 3D perspective tracking
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring physics for smooth animation
    const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

    return (
        <motion.div
            ref={ref}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={cn(sizeClasses[size], 'perspective-1000')}
            onClick={() => onClick?.(agent)}
        >
            <GlassContainer className="h-full">
                {/* Category gradient header */}
                <div className={cn('h-2 rounded-t-xl', categoryGradients[agent.category])} />

                {/* Agent icon */}
                <div className="text-5xl mb-4">{agent.icon}</div>

                {/* Info */}
                <h3>{agent.name}</h3>
                <p>{agent.description}</p>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map(cap => (
                        <GlassBadge key={cap}>{cap}</GlassBadge>
                    ))}
                </div>
            </GlassContainer>
        </motion.div>
    );
};

// Compact variant for lists
export const AgentCardCompact: React.FC<AgentCardCompactProps> = ({ agent, onClick }) => (
    <GlassContainer className="flex items-center gap-4 p-3">
        <span className="text-2xl">{agent.icon}</span>
        <div>
            <h4>{agent.name}</h4>
            <p className="text-sm text-white/60">{agent.description}</p>
        </div>
    </GlassContainer>
);
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/components/agents/AgentCard.tsx` | Card component with 3D effects |
| `src/components/agents/AgentCard.stories.tsx` | Storybook documentation |
| `src/components/agents/index.ts` | Component exports |

#### Storybook Stories

- Default, Small, Large sizes
- WithClick handler
- GridOfAgents layout
- CompactVariant
- AllSizes comparison
- DifferentCategories showcase

#### Success Criteria

- [x] 3D perspective hover effects
- [x] Multiple size variants (sm, md, lg)
- [x] Compact variant for lists
- [x] Category color gradients
- [x] Storybook documentation

---

### 6.3 Agent Probe Discovery

**Priority:** P2-Medium
**Effort:** Medium (2-3 hours)
**Status:** ✅ Complete

#### Problem Statement

Users need to connect to external A2A agents by URL, with visual feedback about agent discovery and capabilities.

#### Solution Design

```tsx
// src/components/agents/AgentProbe.tsx

export const AgentProbe: React.FC<AgentProbeProps> = ({ onAgentFound }) => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<ProbeStatus>('idle');
    const [agentCard, setAgentCard] = useState<AgentCard | null>(null);

    const handleProbe = async () => {
        setStatus('probing');
        try {
            const client = new A2AClient(url);
            const card = await client.getAgentCard();
            setAgentCard(card);
            setStatus('success');
            onAgentFound?.(card);
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <GlassContainer className="p-6">
            <GlassInput
                value={url}
                onChange={setUrl}
                placeholder="https://agent.example.com"
                suffix={<ProbeButton onClick={handleProbe} status={status} />}
            />

            {/* Status indicators */}
            {status === 'probing' && <GlassLoader />}
            {status === 'success' && <AgentCardPreview card={agentCard} />}
            {status === 'error' && <ErrorMessage />}
        </GlassContainer>
    );
};
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/components/agents/AgentProbe.tsx` | URL probe component |

#### Key Features

- URL input with probe button
- Status indicators (idle, probing, success, error)
- Agent Card preview on success
- Capability validation
- Error handling with retry

#### Success Criteria

- [x] Probe `/.well-known/agent.json` endpoint
- [x] Visual status feedback
- [x] Agent Card preview
- [x] Error handling

---

### 6.4 Agent Chat Window

**Priority:** P2-Medium
**Effort:** Medium (3-4 hours)
**Status:** ✅ Complete

#### Problem Statement

Users need an interactive chat interface to communicate with agents, with A2UI rendering for rich responses.

#### Solution Design

```tsx
// src/components/agents/AgentChatWindow.tsx

export const AgentChatWindow: React.FC<AgentChatWindowProps> = ({
    agent,
    onClose,
    initialMessage
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [a2uiMessages, setA2UIMessages] = useState<A2UIMessage[]>([]);

    const client = useMemo(() =>
        agent.url ? new A2AClient(agent.url) : null
    , [agent.url]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');

        if (client) {
            // Stream response from A2A agent
            for await (const event of client.streamText(input)) {
                if (event.type === 'artifact') {
                    const a2ui = event.artifact.parts.find(p => p.kind === 'a2ui');
                    if (a2ui) setA2UIMessages(a2ui.messages);
                }
            }
        }
    };

    return (
        <GlassWindow
            title={`Chat with ${agent.name}`}
            onClose={onClose}
            initialSize={{ width: 600, height: 500 }}
        >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                ))}

                {/* A2UI Rendering */}
                {a2uiMessages.length > 0 && (
                    <GlassA2UIRenderer messages={a2uiMessages} />
                )}
            </div>

            {/* Input */}
            <div className="flex gap-2 p-4 border-t border-white/10">
                <GlassInput
                    value={input}
                    onChange={setInput}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                />
                <GlassButton onClick={sendMessage}>Send</GlassButton>
            </div>
        </GlassWindow>
    );
};
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/components/agents/AgentChatWindow.tsx` | Chat window component |

#### Key Features

- GlassWindow-based modal
- Message history
- A2UI rendering for rich responses
- Streaming support
- Curated agent quick responses

#### Success Criteria

- [x] Chat interface works
- [x] A2UI responses render correctly
- [x] Streaming updates display
- [x] Window draggable/resizable

---

### 6.5 Curated Agent Registry

**Priority:** P2-Medium
**Effort:** Low (1-2 hours)
**Status:** ✅ Complete

#### Problem Statement

Need a registry of curated agents for discovery, organized by categories.

#### Solution Design

```typescript
// src/services/agents/registry.ts

export interface Agent {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: AgentCategory;
    url?: string;
    capabilities: string[];
    samplePrompts: string[];
}

export type AgentCategory =
    | 'finance' | 'commerce' | 'analytics' | 'security'
    | 'creative' | 'productivity' | 'developer' | 'communication';

export const AGENT_CATEGORIES = [
    { id: 'finance', name: 'Finance', icon: '💰', gradient: 'from-green-500 to-emerald-600' },
    { id: 'commerce', name: 'Commerce', icon: '🛒', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'analytics', name: 'Analytics', icon: '📊', gradient: 'from-purple-500 to-violet-600' },
    { id: 'security', name: 'Security', icon: '🔒', gradient: 'from-red-500 to-rose-600' },
    { id: 'creative', name: 'Creative', icon: '🎨', gradient: 'from-pink-500 to-fuchsia-600' },
    { id: 'productivity', name: 'Productivity', icon: '⚡', gradient: 'from-yellow-500 to-amber-600' },
    { id: 'developer', name: 'Developer', icon: '💻', gradient: 'from-cyan-500 to-teal-600' },
    { id: 'communication', name: 'Communication', icon: '💬', gradient: 'from-orange-500 to-red-600' },
];

export const CURATED_AGENTS: Agent[] = [
    // Finance
    { id: 'restaurant-finder', name: 'Restaurant Finder', category: 'commerce', ... },
    { id: 'portfolio-analyzer', name: 'Portfolio Analyzer', category: 'finance', ... },
    // ... 8+ curated agents
];

export function getCuratedAgents(category?: AgentCategory): Agent[] {
    if (!category) return CURATED_AGENTS;
    return CURATED_AGENTS.filter(a => a.category === category);
}
```

#### Files Created

| File | Purpose |
|------|---------|
| `src/services/agents/registry.ts` | Agent registry |
| `src/services/agents/index.ts` | Service exports |

#### Curated Agents

| Agent | Category | Description |
|-------|----------|-------------|
| Restaurant Finder | Commerce | Find and book restaurants |
| Portfolio Analyzer | Finance | Analyze crypto portfolios |
| Sales Dashboard | Analytics | Visualize sales metrics |
| Code Assistant | Developer | Help with coding tasks |
| Security Auditor | Security | Security analysis |
| Content Creator | Creative | Generate content |
| Task Manager | Productivity | Manage tasks |
| Team Chat | Communication | Team messaging |

#### Success Criteria

- [x] 8 categories defined
- [x] 8+ curated agents
- [x] Filter by category
- [x] Sample prompts provided

---

### 6.6 Two Worlds Integration

**Priority:** P2-Medium
**Effort:** Low (1 hour)
**Status:** ✅ Complete

#### Problem Statement

Agent Hub needs to integrate with both "Two Worlds" paradigms—the spatial Liquid OS and the focused Rush Hour terminal.

#### Solution Design

| Feature | Liquid OS | Rush Hour |
|---------|-----------|-----------|
| Access | Dock → Compass icon | `/hub` command |
| Layout | Floating windows | Full-screen modal |
| Chat | GlassWindow | Inline terminal |
| Navigation | Spatial positioning | Keyboard shortcuts |

#### Files Modified

| File | Change |
|------|--------|
| `src/components/navigation/GlassDock.tsx` | Added Compass icon for Agent Hub |
| `src/Router.tsx` | Added `/hub` route |

#### Success Criteria

- [x] Dock icon navigates to Agent Hub
- [x] Route works at `/hub`
- [x] Consistent with Two Worlds paradigm

---

### Phase 6 Test Coverage

**Component Tests:** AgentCard, AgentProbe, AgentChatWindow
**Integration Tests:** Registry service, Agent discovery flow

```bash
# Run Agent Hub tests
bun test tests/unit/agents.test.ts
```

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

### Phase 5: A2A Protocol Integration (Complete)

- [x] 5.1 A2A Protocol Types
- [x] 5.2 A2UI Transformer
- [x] 5.3 A2A Client
- [x] 5.4 A2A Server Handler
- [x] 5.5 A2UI Renderer Component
- [x] 5.6 A2UI Examples

### Phase 6: Agent Hub UI (Complete)

- [x] 6.1 Agent Hub Page
- [x] 6.2 Agent Card Components
- [x] 6.3 Agent Probe Discovery
- [x] 6.4 Agent Chat Window
- [x] 6.5 Curated Agent Registry
- [x] 6.6 Two Worlds Integration

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
