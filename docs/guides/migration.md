# Migration Guide for Implementation Plan

> **Purpose:** Document breaking changes, migration steps, and backward compatibility considerations.
> **Created:** January 2026

---

## Table of Contents

1. [Phase 1 Migrations](#phase-1-migrations)
2. [Phase 2 Migrations](#phase-2-migrations)
3. [Phase 3 Migrations](#phase-3-migrations)
4. [Phase 4 Migrations](#phase-4-migrations)
5. [Phase 5 Migrations: A2A Agent Conversion](#phase-5-migrations-a2a-agent-conversion)
6. [Phase 6 Migrations: Remote A2A Agents](#phase-6-migrations-remote-a2a-agents)
7. [Phase 7 Migrations: Skill Migration to Antigravity](#phase-7-migrations-skill-migration-to-antigravity)
8. [Deprecation Timeline](#deprecation-timeline)
9. [Rollback Procedures](#rollback-procedures)

---

## Phase 1 Migrations

### 1.1 Session-Scoped LiquidClient

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| Singleton `liquidClient` deprecated | Medium | Use `useLiquidClient()` hook or factory |

#### Before (Current Code)

```typescript
// Direct singleton import
import { liquidClient } from '@/liquid-engine';

function MyComponent() {
    useEffect(() => {
        liquidClient.registerReadable({ id: 'my-context', value: data });
    }, [data]);
}
```

#### After (New Pattern)

```typescript
// Hook-based access with session scope
import { useLiquidClient } from '@/hooks/useLiquidClient';

function MyComponent() {
    const liquidClient = useLiquidClient();

    useEffect(() => {
        liquidClient.registerReadable({ id: 'my-context', value: data });
    }, [data, liquidClient]);
}
```

#### Backward Compatibility

The singleton export remains available but logs a deprecation warning:

```typescript
// liquid-engine/index.ts
export const liquidClient = (() => {
    console.warn(
        '[DEPRECATED] Direct liquidClient import is deprecated. ' +
        'Use useLiquidClient() hook for session-scoped access. ' +
        'Will be removed in v2.0.0.'
    );
    return legacySingletonClient;
})();

// New recommended export
export { liquidClientFactory } from './clientFactory';
```

#### Migration Steps

1. **Search for direct imports:**
   ```bash
   grep -r "import.*liquidClient" src/
   ```

2. **Replace each occurrence:**
   - In React components: Use `useLiquidClient()` hook
   - In services: Pass client instance as parameter
   - In tests: Use `liquidClientFactory.getClient('test-session')`

3. **Update context providers:**
   ```typescript
   // App.tsx
   import { LiquidClientProvider } from '@/context/LiquidClientContext';

   function App() {
       return (
           <LiquidClientProvider>
               <Router />
           </LiquidClientProvider>
       );
   }
   ```

4. **Verify no cross-session leakage:**
   ```bash
   bun test tests/unit/clientFactory.test.ts
   ```

---

### 1.2 Rate Limit Key Enhancement

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| New rate limit headers | None (additive) | Update clients to read new headers |
| Different limits per tier | Low | Inform users of tier-based limits |

#### New Response Headers

```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704825600
X-RateLimit-Tier: session    # NEW
```

#### Client Migration

Update client code to handle tier information:

```typescript
// Before
const remaining = response.headers.get('X-RateLimit-Remaining');

// After
const remaining = response.headers.get('X-RateLimit-Remaining');
const tier = response.headers.get('X-RateLimit-Tier');
const limit = response.headers.get('X-RateLimit-Limit');

// Adjust behavior based on tier
if (tier === 'ip' && remaining < 5) {
    showLoginPrompt(); // Encourage auth for higher limits
}
```

#### API Documentation Update

```markdown
## Rate Limits

| Tier | Limit | Window | How to Qualify |
|------|-------|--------|----------------|
| User | 100 req | 15 min | Send `Authorization: Bearer <token>` |
| Session | 50 req | 15 min | Send `X-Session-Token: <id>` |
| IP | 30 req | 15 min | No authentication |
```

---

### 1.3 ErrorBoundary Expansion

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| Component exports renamed internally | None (API unchanged) | No action required |

#### No Migration Required

This change is purely internal. The public API remains identical:

```typescript
// Still works exactly the same
import { GlassFlow, GlassKanban } from '@/components';

<GlassFlow nodes={[]} edges={[]} />
<GlassKanban columns={[]} />
```

#### For Library Consumers

If you're importing raw components (not recommended), update imports:

```typescript
// Before (internal, undocumented)
import { GlassFlow } from '@/components/data-display/GlassFlow';

// After (if you need unwrapped version)
import { GlassFlowRaw } from '@/components/data-display/GlassFlow';
```

---

### 1.4 WebSocket Authentication

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| Auth required when `REQUIRE_WS_AUTH=true` | Medium | Add token to WS connection |
| Permission checks on messages | Low | Ensure correct permissions in token |

#### Before (Anonymous Connection)

```typescript
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', symbol: 'BTC' }));
};
```

#### After (Authenticated Connection)

```typescript
// Get token from your auth system
const token = await getWebSocketToken();

// Connect with token
const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

ws.onopen = () => {
    // Check granted permissions
    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'connected') {
            console.log('Permissions:', msg.permissions);
        }
    };

    ws.send(JSON.stringify({ type: 'subscribe', symbol: 'BTC' }));
};
```

#### Token Requirements

```typescript
interface WebSocketTokenPayload {
    userId: string;
    permissions: string[];
    exp: number; // Expiry timestamp
    iat: number; // Issued at
}

// Example token creation (server-side)
function createWebSocketToken(userId: string, permissions: string[]): string {
    return jwt.sign(
        { userId, permissions },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
}
```

#### Permission Matrix

| Action | Required Permission |
|--------|---------------------|
| subscribe | `read:prices` |
| unsubscribe | `read:prices` |
| ping | (none) |
| trade | `write:trades` |
| chat | `write:chat` |

#### Backward Compatibility

When `REQUIRE_WS_AUTH` is not set or `false`:
- Anonymous connections allowed
- Anonymous users get `read:prices` permission only
- Trade/chat actions still require authentication

---

## Phase 2 Migrations

### 2.1 Request Coalescing

#### No Breaking Changes

This is a performance optimization with no API changes. Requests return the same response format.

#### Observable Behavior Changes

- First request in a batch may take slightly longer (fetching)
- Subsequent identical requests return faster (coalesced)
- Cache hit rate in stats will increase

---

### 2.2 WebSocket Horizontal Scaling

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| Client IDs may include instance prefix | Low | Update if parsing client IDs |

#### Client ID Format Change

```
Before: ws_1704825600_abc123
After:  ws_instance1_1704825600_abc123
```

If you're parsing client IDs (not recommended), update regex:

```typescript
// Before
const match = clientId.match(/ws_(\d+)_(\w+)/);

// After
const match = clientId.match(/ws_([^_]+)_(\d+)_(\w+)/);
const [, instance, timestamp, random] = match;
```

#### Environment Variables

New optional configuration:

```bash
# Redis URL for cross-instance communication
REDIS_URL=redis://localhost:6379

# Unique instance identifier (auto-generated if not set)
INSTANCE_ID=server-1
```

---

### 2.3 Theme Hydration

#### No Breaking Changes

This fix runs before React mounts and has no API changes.

#### Verification

After deployment, verify no theme flash:

1. Set theme to light mode
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Page should load with light theme immediately

---

## Phase 3 Migrations

### 3.1 Structured Logging

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| Log output format changes | Medium | Update log parsers |
| No more `console.log` | None | Internal change |

#### Log Format Change

```
Before (console.log):
[Redis] Connected successfully
[WebSocket] Client connected: ws_123

After (Pino JSON):
{"level":30,"time":1704825600000,"service":"liquid-glass-server","component":"redis","msg":"Connected successfully"}
{"level":30,"time":1704825600001,"service":"liquid-glass-server","component":"websocket","clientId":"ws_123","msg":"Client connected"}
```

#### Log Parser Updates

If you're aggregating logs (ELK, Datadog, etc.), update parsers:

```json
// Elasticsearch index mapping update
{
    "mappings": {
        "properties": {
            "level": { "type": "integer" },
            "time": { "type": "date", "format": "epoch_millis" },
            "service": { "type": "keyword" },
            "component": { "type": "keyword" },
            "requestId": { "type": "keyword" },
            "userId": { "type": "keyword" },
            "msg": { "type": "text" }
        }
    }
}
```

#### Log Level Mapping

| Pino Level | Value | Meaning |
|------------|-------|---------|
| trace | 10 | Verbose debugging |
| debug | 20 | Debug information |
| info | 30 | Normal operation |
| warn | 40 | Warning conditions |
| error | 50 | Error conditions |
| fatal | 60 | System unusable |

---

### 3.2 OpenTelemetry

#### No Breaking Changes

OpenTelemetry adds observability without changing APIs.

#### Environment Configuration

```bash
# Enable telemetry (disabled by default)
OTEL_ENABLED=true

# Exporter endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Sampling rate (0.0 to 1.0)
OTEL_SAMPLING_RATE=1.0

# Service name (for trace identification)
OTEL_SERVICE_NAME=liquid-glass-server
```

---

### 3.3 GraphQL Schema

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| Schema types added | None (additive) | Start using new types |
| Introspection disabled in prod | Low | Use dev environment for schema exploration |

#### New Capabilities

```graphql
# New queries
query {
    portfolio {
        totalValue
        positions {
            symbol
            pnl
        }
    }
}

# New subscriptions
subscription {
    priceUpdates(symbols: ["BTC", "ETH"]) {
        symbol
        price
        change24h
    }
}

# New mutations (require auth)
mutation {
    createTrade(input: { symbol: "BTC", side: BUY, quantity: 0.1 }) {
        id
        status
    }
}
```

---

### 3.4 Directive Checksums

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| CI fails on checksum mismatch | Medium | Run hash update script before committing |

#### Workflow Update

```bash
# Before committing script changes
bun run scripts/update_directive_hashes.ts

# Or add pre-commit hook
# .husky/pre-commit
bun run scripts/update_directive_hashes.ts
git add directives/*.md
```

#### CI Error Format

```
❌ Directive verification failed:
  - directives/ralph_node.md: scripts/ralph_runner.ts hash mismatch
    (expected abc123..., got def456...)

Run 'bun run scripts/update_directive_hashes.ts' to update checksums.
```

---

## Phase 4 Migrations

### 4.1 Plugin Sandbox

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| Plugins run in sandbox | High | Declare required permissions |

#### Plugin Manifest Update

```json
// Before
{
    "name": "my-plugin",
    "hooks": {
        "PostToolUse": [{
            "command": "bun run tool.ts"
        }]
    }
}

// After
{
    "name": "my-plugin",
    "permissions": {
        "env": ["PATH", "HOME"],
        "paths": ["./tools"],
        "network": false,
        "maxMemory": "128MB",
        "timeout": "30s"
    },
    "hooks": {
        "PostToolUse": [{
            "command": "bun run tool.ts"
        }]
    }
}
```

#### Permission Types

| Permission | Default | Description |
|------------|---------|-------------|
| `env` | `["PATH", "HOME"]` | Allowed environment variables |
| `paths` | `["./"]` | Allowed filesystem paths (relative to plugin) |
| `network` | `false` | Allow network access |
| `maxMemory` | `"128MB"` | Maximum memory usage |
| `timeout` | `"30s"` | Maximum execution time |

---

## Deprecation Timeline

| Item | Deprecated | Removed | Replacement |
|------|------------|---------|-------------|
| `liquidClient` singleton | v1.1.0 | v2.0.0 | `useLiquidClient()` hook |
| Anonymous WebSocket (when auth enabled) | v1.2.0 | v2.0.0 | Token-based auth |
| Console.log in server | v1.3.0 | v1.3.0 | Pino logger |
| Unsandboxed plugins | v1.4.0 | v2.0.0 | Sandboxed execution |

---

## Rollback Procedures

### Quick Rollback (Git)

```bash
# Rollback to previous version
git revert HEAD

# Or rollback specific phase
git revert <phase-merge-commit>
```

### Feature Flags

Each phase can be disabled via environment variables:

```bash
# Phase 1
USE_SESSION_SCOPED_CLIENT=false
USE_TIERED_RATE_LIMITS=false
REQUIRE_WS_AUTH=false

# Phase 2
USE_REQUEST_COALESCING=false
USE_DISTRIBUTED_WEBSOCKET=false

# Phase 3
USE_STRUCTURED_LOGGING=false
OTEL_ENABLED=false

# Phase 4
USE_PLUGIN_SANDBOX=false
```

### Database Rollback

No database migrations in this plan. All changes are code-only.

### Redis Data Cleanup

If rolling back WebSocket scaling:

```bash
redis-cli KEYS "ws:*" | xargs redis-cli DEL
redis-cli KEYS "subs:*" | xargs redis-cli DEL
```

---

## Support

If you encounter migration issues:

1. Check this guide for your specific scenario
2. Search existing issues: `gh issue list --label migration`
3. Open new issue with `migration` label

---


*This migration guide follows the 3-Layer Architecture principle: document changes in directives so future agents understand the evolution.*

---

## Phase 5 Migrations: A2A Agent Conversion

### 5.1 ILiquidLLMService Interface

#### Breaking Changes

| Change | Impact | Migration Path |
|--------|--------|----------------|
| `sendMessage` returns `Promise<string>` | High | Update all service implementations |

#### Interface Update

```typescript
// Before
interface ILiquidLLMService {
    sendMessage(prompt: string): Promise<void>;
}

// After
interface ILiquidLLMService {
    sendMessage(prompt: string): Promise<string>;
}
```

The UI (`AgSidebar`) expects the service to return the textual response from the LLM to display in the chat bubble. Returning `void` or an object will cause the UI to break or display empty bubbles.

#### Service Implementation Pattern

```typescript
async sendMessage(prompt: string): Promise<string> {
    // 1. Accumulate stream
    let fullText = '';
    
    // ... streaming logic ...
    
    // 2. Return final text
    return fullText;
}
```

---

### 5.2 AgSidebar Integration

#### Side-Channel Data

**Problem**: You often need to return *both* the chat text (for the bubble) AND complex data (for dashboard widgets, charts, etc.).

**Anti-Pattern (Do NOT do this)**:
```typescript
// ERROR: Will crash generic UI
async sendMessage(text: string) {
    return { text: "Done", data: { ... } }; 
}
```

**Recommended Pattern**:
Use a callback pattern in your service to handle side-channel data updates, while returning simple text to the chat interface.

```typescript
class MyAgentService extends LLMServiceBase {
    constructor(private onDataUpdate: (data: any) => void) { super(); }

    async sendMessage(text: string): Promise<string> {
        // 1. Process LLM response
        const { responseText, widgetUpdates } = await this.callLLM(text);
        
        // 2. Send side-channel data via callback
        if (widgetUpdates) {
            this.onDataUpdate(widgetUpdates);
        }

        // 3. Return text for UI
        return responseText;
    }
}
```

---

### 5.3 Proxy Service Consistency

#### Requirement

Proxy services (`src/services/proxy/`) must match the behavior of direct services. If direct services accumulate and return text, proxies must do the same.

**Migration Step**:
Ensure your `ProxyService.sendMessage` implementation listens for `chunk` events, accumulates them, and resolves the promise with the full string.

```typescript
// src/services/proxy/gemini.ts
if (event.type === 'chunk') {
    fullResponse += event.delta;
    // ...
}
return fullResponse; // At end of stream
```

---

### 5.4 Prompt Engineering for Tools

#### Lessons Learned

1.  **Defaults**: Relax tool schema requirements. If a user says "Add order widget", they likely mean `type: "metric"`. Don't make `type` required; default it in the agent logic.
2.  **Arithmetic**: LLMs often delete items when asked to "add 5" if not explicitly instructed.
    *   **Bad Prompt**: "Manage widgets."
    *   **Good Prompt**: "If user says 'add 5 orders', calculate the new value and UPDATE. Do NOT create or delete."

### 5.5 Interactive Research Agents

#### Proactive Content Generation
**Problem**: Agents can be too passive, asking the user to provide content instead of generating it (e.g., "What text should I add?").

**Solution**: Explicitly instruct the model in the system prompt to be a **content generator**.
```typescript
// System Prompt
RULES:
1. **BE PROACTIVE**: When the user asks to add notes, **YOU MUST GENERATE THE CONTENT YOURSELF**.
2. Do not ask the user for the text.
```

#### Context-Aware Service Injection
**Problem**: The global `AgSidebar` needs to connect to a specific agent session (with its own history/state) rather than a generic chat.

**Solution**:
1.  Update `AgSidebar` to accept an `initialService` prop.
2.  Instantiate the specific agent service (e.g., `ResearchAgentService`) in the page component.
3.  Pass it down to the sidebar.

```tsx
// Page Component
const agentService = useMemo(() => new ResearchAgentService(sessionId), []);
return (
    <LiquidProvider>
        <MainContent />
        <AgSidebar initialService={agentService} /> {/* Injects specific context */}
    </LiquidProvider>
);
```

#### Server-Side State Truth
**Pattern**: Move state from React `useState` to the Server Agent.
-   **Client**: Becomes a specific renderer. It subscribes to data stream updates.
-   **Server**: Holds the `ResearchContext` (topic, blocks).
-   **Benefit**: State persists across reloads and is directly manipulatable by the LLM without complex client-side tool mapping.

---

## Phase 6 Migrations: Remote A2A Agents

### 6.1 Remote Agent Service

#### New Capability

The `RemoteAgentService` enables connecting to external A2A-compliant agents over the network.

```typescript
import { RemoteAgentService } from '@/services/a2a/RemoteAgentService';

const service = new RemoteAgentService(
    '/remote-a2a/',           // URL (use proxy for CORS)
    'Bearer your-token-here', // Auth token
    'session-id'              // Context ID
);
```

#### CORS Proxy Configuration

When connecting to remote A2A servers from the browser, CORS blocks direct requests. Configure a Vite proxy in `vite.config.ts`:

```typescript
proxy: {
    '/remote-a2a': {
        target: 'https://remote-server.example.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/remote-a2a/, '/api/v1/a2a/agent-id'),
    },
}
```

#### A2A Protocol Version Compatibility

| Feature | **Old A2A Draft** | **A2A v1.0 (Current)** |
|---------|-------------------|------------------------|
| Method Names | `message/send` | `SendMessage` (PascalCase) |
| Field Names | `snake_case` | `camelCase` |
| Message ID | `id` | `messageId` |
| Task States | `inputRequired` | `input-required` |

> **Note**: If a remote server returns "Method not found", it likely uses the old spec. Our SDK strictly follows A2A v1.0.

---

## Phase 7 Migrations: Skill Migration to Antigravity

### 7.1 LiquidSkills → .agent/skills

#### Purpose

The Antigravity agent framework expects a **flat** `.agent/skills/` directory structure, while `LiquidSkills/` uses a **nested** hierarchy. The migration script creates symlinks to bridge this.

#### Running the Migration

```bash
# Preview changes
bun scripts/migrate-skills-to-agent-folder.ts --dry-run

# Apply changes
bun scripts/migrate-skills-to-agent-folder.ts

# Force overwrite existing symlinks
bun scripts/migrate-skills-to-agent-folder.ts --force
```

#### What It Does

1. Scans `LiquidSkills/` recursively for `SKILL.md` files
2. Creates symlinks in `.agent/skills/` with slugified names
3. Resolves naming conflicts by prefixing with category (e.g., `frontend-design` → `vendor-frontend-design`)
4. Links `_registry.md` for skill discovery

#### Directory Mapping

```
LiquidSkills/                        →  .agent/skills/
├── liquid-design/                   →  liquid-design (symlink)
├── community/
│   ├── pdf/                         →  pdf (symlink)
│   └── plugins/
│       └── plugin-dev/
│           └── skills/
│               └── mcp-integration/ →  mcp-integration (symlink)
└── vendor/
    └── frontend-design/             →  vendor-frontend-design (symlink)
```

#### Maintenance

- Run migration after adding new skills to `LiquidSkills/`
- The `.agent/skills/` directory should be in `.gitignore`
- Source of truth remains `LiquidSkills/`

---

*This migration guide follows the 3-Layer Architecture principle: document changes in directives so future agents understand the evolution.*
