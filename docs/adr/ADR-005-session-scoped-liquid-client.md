# ADR-005: Session-Scoped LiquidClient

## Status
**Proposed** - January 2026

## Context

The `LiquidClient` class is the core of the Liquid Wire Protocol implementation, managing:
- Tool call states from AI responses
- Readable contexts registered by UI components
- Action registry for AI-invokable functions
- Context strategies (flat/tree) for prompt building

Currently, `LiquidClient` is exported as a singleton:

```typescript
// Current: Single global instance
export const liquidClient = new LiquidClient();
```

This creates problems in multi-tenant scenarios:

1. **Server-Side Rendering (SSR)**: All requests share the same client instance, leaking context between users
2. **Multi-Tab Browsing**: Different browser tabs share state unexpectedly
3. **Testing**: Tests pollute each other's state
4. **Security**: Sensitive context from one session could be accessed by another

## Decision

Implement a **session-scoped factory pattern** for `LiquidClient`:

```typescript
class LiquidClientFactory {
    private sessions = new Map<string, { client: LiquidClient; lastAccess: number }>();

    getClient(sessionId: string): LiquidClient {
        // Returns existing or creates new client for session
    }

    destroySession(sessionId: string): void {
        // Removes client when session ends
    }
}

export const liquidClientFactory = new LiquidClientFactory();
```

### React Integration

Provide a hook for easy access:

```typescript
function useLiquidClient(): LiquidClient {
    const sessionId = useContext(SessionContext);
    return useMemo(() => liquidClientFactory.getClient(sessionId), [sessionId]);
}
```

### Session ID Generation

- Browser: `crypto.randomUUID()` stored in React context
- SSR: Extract from request (cookie, header, or generate per-request)
- Tests: Explicit session ID per test

## Consequences

### Positive

1. **Security**: Complete isolation between user sessions
2. **Testability**: Each test gets clean state
3. **SSR Compatibility**: Safe for server-side rendering
4. **Multi-Tab Support**: Each tab can have independent context

### Negative

1. **Memory Overhead**: One client instance per session (~10KB each)
2. **Migration Required**: Existing code using singleton must update
3. **Complexity**: Additional abstraction layer

### Mitigations

- **Memory**: Auto-cleanup stale sessions after 30 minutes
- **Migration**: Singleton export remains with deprecation warning
- **Complexity**: Hook abstraction hides factory from most code

## Alternatives Considered

### 1. Keep Singleton, Clear Between Requests (SSR Only)

```typescript
// Before each SSR request
liquidClient.reset();
```

**Rejected**: Doesn't solve multi-tab browser scenario.

### 2. Use React Context Only

```typescript
const LiquidClientContext = createContext(new LiquidClient());
```

**Rejected**: Creates new instance on every render without memoization, doesn't work outside React.

### 3. WeakMap Keyed by Request Object

```typescript
const clients = new WeakMap<Request, LiquidClient>();
```

**Rejected**: Only works in server context, not browser.

## Implementation Notes

### File Structure

```
src/liquid-engine/
├── client.ts              # Core LiquidClient class (unchanged)
├── clientFactory.ts       # NEW: Factory with session management
├── index.ts               # Updated exports
└── ...
```

### Cleanup Strategy

```typescript
class LiquidClientFactory {
    private readonly SESSION_TTL = 30 * 60 * 1000; // 30 minutes

    constructor() {
        // Cleanup every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    private cleanup() {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now - session.lastAccess > this.SESSION_TTL) {
                this.sessions.delete(id);
            }
        }
    }
}
```

### Backward Compatibility

```typescript
// Deprecated singleton (for gradual migration)
let _legacyClient: LiquidClient | null = null;

export const liquidClient = new Proxy({} as LiquidClient, {
    get(_, prop) {
        if (!_legacyClient) {
            console.warn('[DEPRECATED] Direct liquidClient import. Use useLiquidClient() hook.');
            _legacyClient = new LiquidClient();
        }
        return _legacyClient[prop as keyof LiquidClient];
    }
});
```

## Related Decisions

- ADR-002: Liquid Wire Protocol (defines LiquidClient behavior)
- ADR-004: Server-Side Proxy (API key protection, related to session handling)

## References

- React Server Components: https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023
- Session Management Best Practices: OWASP Guidelines
