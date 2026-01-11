# Testing Strategy for Implementation Plan

> **Purpose:** Define testing requirements for each phase of the implementation plan.
> **Created:** January 2026

---

## Overview

Each implementation item requires specific tests before being marked as complete. This document defines:

1. **Unit Tests** - Isolated component/function tests
2. **Integration Tests** - Cross-component interaction tests
3. **E2E Tests** - Full user journey tests
4. **Performance Tests** - Load and latency verification
5. **Security Tests** - Vulnerability and penetration tests

---

## Phase 1: Critical Security & Stability

### 1.1 Session-Scoped LiquidClient

#### Unit Tests (`tests/unit/clientFactory.test.ts`)

```typescript
describe('LiquidClientFactory', () => {
    it('returns same client for same session ID', () => {
        const factory = new LiquidClientFactory();
        const client1 = factory.getClient('session-123');
        const client2 = factory.getClient('session-123');
        expect(client1).toBe(client2);
    });

    it('returns different clients for different session IDs', () => {
        const factory = new LiquidClientFactory();
        const client1 = factory.getClient('session-123');
        const client2 = factory.getClient('session-456');
        expect(client1).not.toBe(client2);
    });

    it('cleans up stale sessions after TTL', async () => {
        const factory = new LiquidClientFactory({ sessionTTL: 100 }); // 100ms for test
        factory.getClient('session-123');
        await sleep(150);
        factory.cleanup();
        // Internal check that session was removed
        expect(factory.getSessionCount()).toBe(0);
    });

    it('updates lastAccess on getClient', () => {
        const factory = new LiquidClientFactory();
        factory.getClient('session-123');
        const firstAccess = factory.getSession('session-123').lastAccess;
        await sleep(10);
        factory.getClient('session-123');
        const secondAccess = factory.getSession('session-123').lastAccess;
        expect(secondAccess).toBeGreaterThan(firstAccess);
    });

    it('destroySession removes client immediately', () => {
        const factory = new LiquidClientFactory();
        factory.getClient('session-123');
        factory.destroySession('session-123');
        expect(factory.getSessionCount()).toBe(0);
    });
});
```

#### Integration Tests

```typescript
describe('LiquidClient Session Isolation', () => {
    it('contexts registered in one session not visible in another', () => {
        const factory = new LiquidClientFactory();
        const client1 = factory.getClient('session-1');
        const client2 = factory.getClient('session-2');

        client1.registerReadable({ id: 'secret', value: 'user1-data', scope: 'global' });

        expect(client1.getReadableContexts()).toHaveLength(1);
        expect(client2.getReadableContexts()).toHaveLength(0);
    });

    it('tool states isolated between sessions', () => {
        const factory = new LiquidClientFactory();
        const client1 = factory.getClient('session-1');
        const client2 = factory.getClient('session-2');

        client1.ingest({ type: 'tool_start', id: 'tool-1', name: 'test' });

        expect(client1.getToolState('tool-1')).toBeDefined();
        expect(client2.getToolState('tool-1')).toBeUndefined();
    });
});
```

#### Memory Tests

```typescript
describe('LiquidClientFactory Memory', () => {
    it('handles 1000 sessions without memory leak', () => {
        const factory = new LiquidClientFactory();
        const initialMemory = process.memoryUsage().heapUsed;

        for (let i = 0; i < 1000; i++) {
            factory.getClient(`session-${i}`);
        }

        factory.shutdown(); // Cleanup all

        // Force GC if available
        if (global.gc) global.gc();

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        // Should not retain significant memory after cleanup
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
    });
});
```

---

### 1.2 Rate Limit Key Enhancement

#### Unit Tests (`tests/unit/rateLimit.test.ts`)

```typescript
describe('getRateLimitKey', () => {
    it('returns user key when authenticated', () => {
        const request = mockRequest({
            headers: { 'Authorization': 'Bearer valid-token' }
        });
        const key = getRateLimitKey(request, 'user-123');
        expect(key).toBe('ratelimit:user:user-123');
    });

    it('returns session key when session token present', () => {
        const request = mockRequest({
            headers: { 'X-Session-Token': 'session-abc' }
        });
        const key = getRateLimitKey(request, undefined);
        expect(key).toBe('ratelimit:session:session-abc');
    });

    it('returns IP key as fallback', () => {
        const request = mockRequest({
            headers: { 'X-Forwarded-For': '1.2.3.4, 5.6.7.8' }
        });
        const key = getRateLimitKey(request, undefined);
        expect(key).toBe('ratelimit:ip:1.2.3.4');
    });

    it('extracts first IP from X-Forwarded-For', () => {
        const request = mockRequest({
            headers: { 'X-Forwarded-For': '  1.2.3.4  , 5.6.7.8' }
        });
        const key = getRateLimitKey(request, undefined);
        expect(key).toBe('ratelimit:ip:1.2.3.4');
    });

    it('uses X-Real-IP when X-Forwarded-For not present', () => {
        const request = mockRequest({
            headers: { 'X-Real-IP': '9.8.7.6' }
        });
        const key = getRateLimitKey(request, undefined);
        expect(key).toBe('ratelimit:ip:9.8.7.6');
    });
});

describe('Rate Limit Tiers', () => {
    it('applies correct limit for user tier (100/15min)', async () => {
        const result = await checkRateLimit('ratelimit:user:123', 100, 900000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(99);
    });

    it('applies correct limit for session tier (50/15min)', async () => {
        const result = await checkRateLimit('ratelimit:session:abc', 50, 900000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(49);
    });

    it('applies correct limit for ip tier (30/15min)', async () => {
        const result = await checkRateLimit('ratelimit:ip:1.2.3.4', 30, 900000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(29);
    });
});
```

#### Integration Tests

```typescript
describe('Rate Limit API Integration', () => {
    it('returns X-RateLimit-Tier header', async () => {
        const response = await fetch('http://localhost:3000/api/v1/chat', {
            method: 'POST',
            headers: { 'X-Session-Token': 'test-session' },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })
        });

        expect(response.headers.get('X-RateLimit-Tier')).toBe('session');
        expect(response.headers.get('X-RateLimit-Limit')).toBe('50');
    });

    it('blocks after limit exceeded', async () => {
        // Exhaust rate limit
        for (let i = 0; i < 31; i++) {
            await fetch('http://localhost:3000/api/v1/chat', {
                method: 'POST',
                headers: { 'X-Forwarded-For': '99.99.99.99' },
                body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })
            });
        }

        const response = await fetch('http://localhost:3000/api/v1/chat', {
            method: 'POST',
            headers: { 'X-Forwarded-For': '99.99.99.99' },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })
        });

        expect(response.status).toBe(429);
    });
});
```

---

### 1.3 ErrorBoundary Expansion

#### Unit Tests (`tests/unit/ErrorBoundaryComponents.test.tsx`)

```typescript
const WRAPPED_COMPONENTS = [
    { name: 'GlassFlow', Component: GlassFlow, props: { nodes: [], edges: [] } },
    { name: 'GlassKanban', Component: GlassKanban, props: { columns: [] } },
    { name: 'GlassEditor', Component: GlassEditor, props: {} },
    { name: 'GlassRadarChart', Component: GlassRadarChart, props: { data: [] } },
    // ... all 25+ components
];

describe.each(WRAPPED_COMPONENTS)('ErrorBoundary: $name', ({ name, Component, props }) => {
    it('renders normally with valid props', () => {
        const { container } = render(<Component {...props} />);
        expect(container).toBeTruthy();
    });

    it('catches errors and renders fallback', () => {
        // Mock component to throw
        const BrokenComponent = () => {
            throw new Error('Test error');
        };

        const { getByText } = render(
            <ErrorBoundary fallback={<div>Error occurred</div>}>
                <BrokenComponent />
            </ErrorBoundary>
        );

        expect(getByText('Error occurred')).toBeInTheDocument();
    });

    it('reports componentName in error logs', () => {
        const onError = vi.fn();
        const BrokenComponent = () => { throw new Error('Test'); };

        render(
            <ErrorBoundary onError={onError} componentName={name}>
                <BrokenComponent />
            </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                componentStack: expect.stringContaining(name)
            })
        );
    });
});
```

#### Visual Regression Tests

```typescript
// tests/visual/error-states.spec.ts (Playwright)
test.describe('Error Boundary Visual States', () => {
    test('chart error shows compact fallback', async ({ page }) => {
        await page.goto('/test/error-states/chart');
        await page.waitForSelector('[data-testid="error-fallback"]');
        await expect(page).toHaveScreenshot('chart-error-fallback.png');
    });

    test('feature error shows full fallback', async ({ page }) => {
        await page.goto('/test/error-states/feature');
        await page.waitForSelector('[data-testid="error-fallback"]');
        await expect(page).toHaveScreenshot('feature-error-fallback.png');
    });
});
```

---

### 1.4 WebSocket Authentication

#### Unit Tests (`tests/unit/websocket-auth.test.ts`)

```typescript
describe('WebSocket Token Validation', () => {
    it('accepts valid JWT token', () => {
        const token = createTestToken({ userId: 'user-123', permissions: ['read:prices'] });
        const result = validateToken(token);
        expect(result.valid).toBe(true);
        expect(result.userId).toBe('user-123');
    });

    it('rejects expired token', () => {
        const token = createTestToken({ exp: Date.now() / 1000 - 3600 }); // Expired 1 hour ago
        const result = validateToken(token);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token expired');
    });

    it('rejects malformed token', () => {
        const result = validateToken('not-a-valid-jwt');
        expect(result.valid).toBe(false);
    });
});

describe('WebSocket Permission Checks', () => {
    it('allows subscribe with read:prices permission', () => {
        const client = mockWebSocketClient({ permissions: ['read:prices'] });
        expect(hasPermission(client, 'subscribe')).toBe(true);
    });

    it('denies trade without write:trades permission', () => {
        const client = mockWebSocketClient({ permissions: ['read:prices'] });
        expect(hasPermission(client, 'trade')).toBe(false);
    });

    it('admin permission allows all actions', () => {
        const client = mockWebSocketClient({ permissions: ['admin'] });
        expect(hasPermission(client, 'subscribe')).toBe(true);
        expect(hasPermission(client, 'trade')).toBe(true);
        expect(hasPermission(client, 'chat')).toBe(true);
    });
});
```

#### Integration Tests

```typescript
describe('WebSocket Auth Integration', () => {
    it('rejects connection without token when requireAuth=true', async () => {
        const ws = new WebSocket('ws://localhost:3001');

        await expect(new Promise((resolve, reject) => {
            ws.onopen = () => reject(new Error('Should not connect'));
            ws.onerror = resolve;
        })).resolves.toBeTruthy();
    });

    it('accepts connection with valid token', async () => {
        const token = await getTestToken();
        const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

        const message = await new Promise((resolve) => {
            ws.onmessage = (e) => resolve(JSON.parse(e.data));
        });

        expect(message.type).toBe('connected');
        expect(message.permissions).toContain('read:prices');
        ws.close();
    });

    it('denies trade message without permission', async () => {
        const token = await getTestToken({ permissions: ['read:prices'] });
        const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

        await waitForConnection(ws);
        ws.send(JSON.stringify({ type: 'trade', data: { symbol: 'BTC', side: 'buy' } }));

        const response = await waitForMessage(ws);
        expect(response.type).toBe('error');
        expect(response.message).toBe('Permission denied');
        ws.close();
    });
});
```

---

## Phase 2: Performance & Scalability

### 2.1 Request Coalescing

#### Load Tests

```typescript
describe('Request Coalescing', () => {
    it('coalesces 10 simultaneous identical requests into 1 API call', async () => {
        const apiCallCount = { count: 0 };
        mockAIAPI((req) => {
            apiCallCount.count++;
            return { content: 'response' };
        });

        const requests = Array(10).fill(null).map(() =>
            fetch('http://localhost:3000/api/v1/chat', {
                method: 'POST',
                body: JSON.stringify({ messages: [{ role: 'user', content: 'test prompt' }] })
            })
        );

        await Promise.all(requests);

        expect(apiCallCount.count).toBe(1); // Only 1 API call
    });

    it('different prompts make separate API calls', async () => {
        const apiCallCount = { count: 0 };
        mockAIAPI(() => { apiCallCount.count++; return { content: 'response' }; });

        await Promise.all([
            fetch('/api/v1/chat', { body: JSON.stringify({ messages: [{ role: 'user', content: 'prompt 1' }] }) }),
            fetch('/api/v1/chat', { body: JSON.stringify({ messages: [{ role: 'user', content: 'prompt 2' }] }) }),
        ]);

        expect(apiCallCount.count).toBe(2);
    });
});
```

### 2.2 WebSocket Horizontal Scaling

#### Multi-Instance Tests

```typescript
describe('WebSocket Cross-Instance Broadcast', () => {
    let server1: Server;
    let server2: Server;

    beforeAll(async () => {
        server1 = await startServer({ port: 3001, instanceId: 'instance-1' });
        server2 = await startServer({ port: 3002, instanceId: 'instance-2' });
    });

    it('broadcasts from instance 1 to client on instance 2', async () => {
        const client1 = new WebSocket('ws://localhost:3001');
        const client2 = new WebSocket('ws://localhost:3002');

        await waitForConnection(client1);
        await waitForConnection(client2);

        // Subscribe both clients
        client1.send(JSON.stringify({ type: 'subscribe', channel: 'chat' }));
        client2.send(JSON.stringify({ type: 'subscribe', channel: 'chat' }));

        // Send chat from client1
        client1.send(JSON.stringify({ type: 'chat', data: { message: 'hello' } }));

        // Client2 should receive it
        const message = await waitForMessage(client2);
        expect(message.type).toBe('chat');
        expect(message.data.message).toBe('hello');
    });

    it('gracefully degrades when Redis unavailable', async () => {
        await stopRedis();

        const client = new WebSocket('ws://localhost:3001');
        await waitForConnection(client);

        // Should still work locally
        client.send(JSON.stringify({ type: 'ping' }));
        const response = await waitForMessage(client);
        expect(response.type).toBe('pong');

        await startRedis();
    });
});
```

### 2.3 Theme Hydration

#### Visual Tests

```typescript
// tests/e2e/theme-hydration.spec.ts (Playwright)
test.describe('Theme Hydration', () => {
    test('no flash when loading dark theme', async ({ page }) => {
        // Set dark theme in localStorage
        await page.addInitScript(() => {
            localStorage.setItem('theme-store', JSON.stringify({
                state: { mode: 'dark', glassBlur: 10, glassOpacity: 0.4 }
            }));
        });

        // Navigate and capture screenshots at intervals
        const screenshots: Buffer[] = [];
        page.on('framenavigated', async () => {
            screenshots.push(await page.screenshot());
        });

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // All screenshots should show dark theme
        for (const screenshot of screenshots) {
            // Analyze screenshot for dark background
            const isDark = await analyzeScreenshotForDarkTheme(screenshot);
            expect(isDark).toBe(true);
        }
    });

    test('handles corrupt localStorage gracefully', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('theme-store', 'not-valid-json');
        });

        await page.goto('/');

        // Should load with default theme, no crash
        await expect(page.locator('body')).toBeVisible();
    });
});
```

---

## Phase 3: Developer Experience

### 3.1 Structured Logging

#### Unit Tests

```typescript
describe('Logger', () => {
    it('outputs JSON in production', () => {
        process.env.NODE_ENV = 'production';
        const output = captureStdout(() => {
            logger.info({ component: 'test' }, 'Test message');
        });

        const parsed = JSON.parse(output);
        expect(parsed.component).toBe('test');
        expect(parsed.msg).toBe('Test message');
    });

    it('child logger includes requestId', () => {
        const requestLogger = createRequestLogger('req-123', 'user-456');
        const output = captureStdout(() => {
            requestLogger.info('Request started');
        });

        const parsed = JSON.parse(output);
        expect(parsed.requestId).toBe('req-123');
        expect(parsed.userId).toBe('user-456');
    });
});
```

### 3.2 OpenTelemetry

#### Trace Verification

```typescript
describe('OpenTelemetry Traces', () => {
    it('creates span for AI calls', async () => {
        const spans = await captureSpans(async () => {
            await fetch('http://localhost:3000/api/v1/chat', {
                method: 'POST',
                body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
            });
        });

        const aiSpan = spans.find(s => s.name === 'ai.call');
        expect(aiSpan).toBeDefined();
        expect(aiSpan.attributes['ai.provider']).toBeDefined();
        expect(aiSpan.attributes['ai.cached']).toBeDefined();
    });
});
```

---

## Test Execution Commands

```bash
# Run all unit tests
bun test

# Run specific phase tests
bun test tests/unit/clientFactory.test.ts
bun test tests/unit/rateLimit.test.ts
bun test tests/unit/ErrorBoundaryComponents.test.tsx
bun test tests/unit/websocket-auth.test.ts

# Run integration tests
bun test tests/integration/

# Run E2E tests
bun run test:e2e

# Run with coverage
bun test --coverage

# Run visual regression tests
npx playwright test tests/visual/

# Run load tests
bun run test:load
```

---

## Coverage Requirements

| Phase | Minimum Coverage | Target Coverage |
|-------|------------------|-----------------|
| Phase 1 | 80% | 90% |
| Phase 2 | 75% | 85% |
| Phase 3 | 70% | 80% |
| Phase 4 | 60% | 75% |

---

## CI Integration

All tests must pass before merging. Add to `.github/workflows/ci.yml`:

```yaml
- name: Run Phase Tests
  run: |
    bun test --coverage
    bun run test:e2e
  env:
    NODE_ENV: test
    REDIS_URL: redis://localhost:6379
```
