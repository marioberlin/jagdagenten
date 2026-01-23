# LiquidCrypto API Documentation

## Overview

LiquidCrypto provides a secure API for cryptocurrency trading operations with AI-powered chat capabilities using Google Gemini and Anthropic Claude.

## Base URL

```
http://localhost:3000
```

## Version

**Current Version:** v1.0

API versioning follows the pattern `/api/v1/` for all endpoints.

## Endpoints

### Health Check

**GET** `/health`

Check if the server is running.

**Response (200 OK):**
```json
{
  "status": "ok",
  "runtime": "production",
  "timestamp": "2026-01-09T17:00:00.000Z"
}
```

---

### API Info

**GET** `/api/v1`

Get API information and available endpoints.

**Response (200 OK):**
```json
{
  "name": "LiquidCrypto API",
  "version": "1.0.0",
  "runtime": "bun",
  "realtime": "GET /stream (SSE)",
  "endpoints": {
    "chat": "POST /api/v1/chat",
    "chatParallel": "POST /api/v1/chat/parallel",
    "health": "GET /health",
    "graphql": "POST /graphql",
    "stream": "GET /stream",
    "websocket": "WS /ws",
    "cacheStats": "GET /api/v1/cache/stats",
    "securityAudit": "GET /api/v1/security/audit",
    "redisSentinel": "GET /api/v1/redis/sentinel"
  }
}
```

---

### Chat API

**POST** `/api/v1/chat`

Send a chat message to the AI model (Gemini or Claude).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-api-key> (optional)
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| provider | string | No | AI provider: `"gemini"` or `"claude"` (default: `"gemini"`) |
| messages | array | No | Array of message objects |

**Message Format:**
```json
{
  "role": "user" | "model" | "system",
  "content": "Your message here"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "messages": [
      {"role": "user", "content": "What is Bitcoin?"}
    ]
  }'
```

**Response (Streaming SSE):**

The endpoint returns Server-Sent Events for streaming responses.

```
data: {"chunk": "Bitcoin is a..."}
data: {"chunk": " decentralized..."}
event: complete
data: {"result": "Final response"}
```

**Event Types:**

| Event | Description |
|-------|-------------|
| `chunk` | Streaming text chunk |
| `tool_start` | AI tool execution started |
| `tool_delta` | Tool execution progress |
| `tool_complete` | Tool execution finished |
| `agent_message` | Agent message |
| `error` | Error occurred |
| `complete` | Response complete |

---

### Parallel AI Chat API

**POST** `/api/v1/chat/parallel`

Send a chat message to both Gemini and Claude simultaneously and receive responses from both providers.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messages | array | Yes | Array of message objects |

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/chat/parallel \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Compare Bitcoin and Ethereum"}
    ]
  }'
```

**Response (200 OK):**
```json
{
  "responses": {
    "gemini": "Bitcoin is a store of value...",
    "claude": "Ethereum enables smart contracts..."
  },
  "timestamp": "2026-01-09T17:00:00.000Z"
}
```

---

### Cache Statistics

**GET** `/api/v1/cache/stats`

Get cache performance metrics.

**Response (200 OK):**
```json
{
  "hits": 156,
  "misses": 42,
  "hitRate": 78.5,
  "memorySize": 1024,
  "redisConnected": true
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| hits | number | Total cache hits |
| misses | number | Total cache misses |
| hitRate | number | Percentage of cache hits |
| memorySize | number | Items in memory cache |
| redisConnected | boolean | Whether Redis is connected |

---


---

### Security Audit

**GET** `/api/v1/security/audit`

Run a security audit of the server configuration.

**Response (200 OK):**
```json
{
  "score": 90,
  "checks": {
    "headers": "PASS",
    "cors": "PASS",
    "rateLimit": "PASS",
    "validation": "PASS",
    "apiKeys": "PASS"
  },
  "recommendations": [
    "Consider enabling Redis for production rate limiting"
  ]
}
```

**POST** `/api/v1/security/audit`

Report a client-side security error or anomaly to trigger the self-healing system.

**Request Body:**
```json
{
  "type": "client_error",
  "message": "Error description",
  "context": {
    "component": "ComponentName",
    "url": "/page/url"
  }
}
```

---

### Security Nonce

**GET** `/api/v1/security/nonce`

Get a single-use CSP nonce for dynamic script injection.

**Response (200 OK):**
```json
{
  "nonce": "a2b3c4d5e6f7g8h9i0j1"
}
```

---

### Smart Enhancement

**POST** `/api/v1/smart/enhance`

Enhance content (cards, tables, charts) using the Smart Enhancement Service.

**Request Body:**
```json
{
  "content": { ... },
  "contentType": "card" | "table" | "chart" | "text",
  "options": {
    "summarize": true,
    "patterns": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "result": {
    "summary": "...",
    "suggestions": [...],
    "patterns": [...],
    "meta": { "modelUsed": "gemini-3.5-flash", "processingTime": 1250 }
  }
}
```

---

### Portfolio Data

**GET** `/api/v1/portfolio`

Get the user's current portfolio holdings and total value.

---

### Market Data

**GET** `/api/v1/market`

Get global market statistics and top gainers/losers.

---

### SSE Real-time Stream

**GET** `/stream`

Subscribe to real-time price updates via Server-Sent Events.

**Response:**

```
data: {"type": "price", "symbol": "BTC", "price": 67500.00, "timestamp": "2026-01-09T17:00:00.000Z"}
data: {"type": "price", "symbol": "ETH", "price": 3500.00, "timestamp": "2026-01-09T17:00:05.000Z"}
```

**Event Types:**

| Event | Description |
|-------|-------------|
| price | Real-time price update |
| connected | Initial connection confirmation |
| chat | Chat message broadcast |

---

### GraphQL Endpoint

**POST** `/graphql`

Execute GraphQL queries.

**Supported Queries:**
```graphql
# Price query
query { price(symbol: "BTC") }

# Portfolio query
query { portfolio { totalValue holdings } }

# Market stats query
query { marketStats { totalMarketCap volume24h } }

# AI chat query
query { chat(prompt: "Hello") }
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { price(symbol: \"BTC\") { symbol price } }",
    "variables": {}
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "price": {
      "symbol": "BTC",
      "price": 67500.00
    }
  }
}
```

---

### WebSocket Bidirectional Communication

**WS** `/ws`

Connect to WebSocket for bidirectional real-time communication.

**Connection Example:**
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
    console.log('Connected to WebSocket');
    
    // Subscribe to price updates
    ws.send(JSON.stringify({ type: 'subscribe', symbol: 'BTC' }));
    ws.send(JSON.stringify({ type: 'subscribe', symbol: 'ETH' }));
    
    // Subscribe to chat channel
    ws.send(JSON.stringify({ type: 'subscribe', channel: 'chat' }));
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
};

// Send trade request
ws.send(JSON.stringify({
    type: 'trade',
    data: { symbol: 'BTC', side: 'buy', amount: 0.1 }
}));

// Ping to keep connection alive
setInterval(() => {
    ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

**Message Types:**

| Type | Direction | Description |
|------|-----------|-------------|
| `subscribe` | Client→Server | Subscribe to symbol or channel |
| `unsubscribe` | Client→Server | Unsubscribe from symbol or channel |
| `ping` | Client→Server | Heartbeat (response: `pong`) |
| `trade` | Client→Server | Execute trade |
| `chat` | Bidirectional | Chat message broadcast |
| `price` | Server→Client | Real-time price update |
| `connected` | Server→Client | Connection confirmation |
| `trade_confirm` | Server→Client | Trade execution confirmation |

**Response Examples:**

Subscribe:
```json
{ "type": "connected", "clientId": "ws_123456", "timestamp": "2026-01-09T17:00:00.000Z" }
```

Price Update:
```json
{
  "type": "price",
  "data": [
    { "symbol": "BTC", "price": 67500.00, "timestamp": "2026-01-09T17:00:00.000Z" },
    { "symbol": "ETH", "price": 3500.00, "timestamp": "2026-01-09T17:00:00.000Z" }
  ],
  "timestamp": "2026-01-09T17:00:00.000Z"
}
```

---

### Redis Sentinel Health Check

**GET** `/api/v1/redis/sentinel`

Get Redis Sentinel topology and health status.

**Example Request:**
```bash
curl http://localhost:3000/api/v1/redis/sentinel
```

**Response (200 OK):**
```json
{
  "connected": true,
  "masters": [
    {
      "name": "mymaster",
      "ip": "127.0.0.1",
      "port": 6379,
      "status": "ok",
      "slaves": 2,
      "flags": ["master"],
      "lastFailover": "2026-01-09T17:00:00.000Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| connected | boolean | Whether Sentinel is reachable |
| masters | array | Array of master nodes |
| masters[].name | string | Master name (e.g., "mymaster") |
| masters[].ip | string | Master IP address |
| masters[].port | number | Master port |
| masters[].status | string | Master status (ok, down, sdown, odown) |
| masters[].slaves | number | Number of slaves |
| masters[].flags | array | Node flags |
| masters[].lastFailover | string | Last failover timestamp |
| error | string | Error message if not connected |

**Status Values:**

| Status | Meaning |
|--------|---------|
| `ok` | Master is healthy |
| `down` | Master is down |
| `sdown` | Master is subjective down (detected by Sentinel) |
| `odown` | Master is objective down (confirmed by quorum) |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 100 requests | 15 minutes |
| Chat API | 30 requests | 15 minutes |

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Reset time (Unix timestamp)

---

## Security

### CORS

Allowed origins can be configured via environment variable:
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Default allowed origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Server)

### Security Headers

All responses include security headers via Helmet:
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`

### Request Size

Maximum JSON body size: 10KB

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `ALLOWED_ORIGINS` | CORS origins | See CORS section |
| `NODE_ENV` | Environment | `development` |
| `GEMINI_API_KEY` | Google Gemini API key | Required for Gemini |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Required for Claude |

---

## Error Handling

See [ERRORS.md](./ERRORS.md) for detailed error codes and recovery suggestions.

---

## Examples

### Python Example

```python
import requests

url = "http://localhost:3000/api/v1/chat"
payload = {
    "provider": "gemini",
    "messages": [
        {"role": "user", "content": "Analyze BTC trend"}
    ]
}

response = requests.post(url, json=payload, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode())
```

### JavaScript Example

```javascript
const response = await fetch('http://localhost:3000/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        provider: 'gemini',
        messages: [{ role: 'user', content: 'Hello!' }]
    })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
}
```

---

---

## App Store Registry API

The App Store Registry provides REST endpoints for browsing, searching, installing, and publishing LiquidOS applications.

**Base Path:** `/api/v1/apps`

### List Apps

**GET** `/api/v1/apps`

List and filter available apps with pagination.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (matches name, description, keywords) |
| `category` | string | Filter by category |
| `author` | string | Filter by author |
| `featured` | boolean | Only featured apps |
| `limit` | number | Page size (default: 50) |
| `offset` | number | Pagination offset |

**Response (200 OK):**
```json
{
  "apps": [
    {
      "id": "pomodoro-timer",
      "manifest": {
        "id": "pomodoro-timer",
        "name": "Pomodoro Timer",
        "version": "1.2.0",
        "description": "Focus timer with work/break intervals",
        "author": "Liquid Labs",
        "category": "productivity",
        "keywords": ["timer", "focus"],
        "icon": "Timer",
        "window": { "mode": "floating", "title": "Pomodoro Timer" },
        "integrations": { "dock": { "enabled": true } },
        "capabilities": ["notification:push", "storage:local"]
      },
      "publishedAt": "2025-11-01T00:00:00Z",
      "updatedAt": "2025-12-15T00:00:00Z",
      "publishedBy": "liquid-labs",
      "downloads": 1240,
      "rating": 4.7,
      "reviewCount": 89,
      "featured": true,
      "verified": true,
      "bundleUrl": "/api/v1/apps/pomodoro-timer/bundle",
      "bundleHash": "a1b2c3d4...",
      "bundleSize": 45000
    }
  ],
  "total": 6,
  "limit": 50,
  "offset": 0
}
```

---

### Get App

**GET** `/api/v1/apps/:id`

Get a single app by ID.

**Response (200 OK):** Single `AppRegistryEntry` object (same shape as list items).

**Response (404):**
```json
{ "error": "App not found" }
```

---

### Search Apps

**GET** `/api/v1/apps/search`

Search apps by name, description, or keywords.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query |
| `limit` | number | Max results (default: 20) |

**Response (200 OK):**
```json
{
  "apps": [...],
  "total": 3
}
```

---

### Featured Apps

**GET** `/api/v1/apps/featured`

Get apps marked as featured.

**Response (200 OK):**
```json
{
  "apps": [...]
}
```

---

### Categories

**GET** `/api/v1/apps/categories`

Get category names with app counts.

**Response (200 OK):**
```json
[
  { "name": "productivity", "count": 3 },
  { "name": "developer", "count": 2 },
  { "name": "finance", "count": 1 }
]
```

---

### Registry Stats

**GET** `/api/v1/apps/stats`

Get aggregate registry statistics.

**Response (200 OK):**
```json
{
  "totalApps": 6,
  "totalDownloads": 17450,
  "categories": 5,
  "featuredCount": 4
}
```

---

### Publish App

**POST** `/api/v1/apps`

Publish or update an app in the registry.

**Request Body:**
```json
{
  "manifest": {
    "id": "my-app",
    "name": "My App",
    "version": "1.0.0",
    "description": "Description",
    "author": "Author",
    "category": "productivity",
    "keywords": ["keyword"],
    "icon": "Box",
    "window": { "mode": "panel", "title": "My App", "resizable": true },
    "integrations": { "dock": { "enabled": true } },
    "capabilities": ["storage:local"]
  },
  "bundleData": "<optional base64-encoded JS bundle>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "app": { ... }
}
```

**Response (400):**
```json
{ "error": "Invalid manifest: missing required fields" }
```

---

### Download Bundle

**GET** `/api/v1/apps/:id/bundle`

Download the compiled JS bundle for an app.

**Response (200 OK):**
```
Content-Type: application/javascript
Content-Length: 45000
X-Bundle-Hash: a1b2c3d4e5f6...
Cache-Control: public, max-age=31536000, immutable

<bundle content>
```

**Response (404):**
```json
{ "error": "Bundle not found" }
```

---

### Delete App

**DELETE** `/api/v1/apps/:id`

Remove an app from the registry.

**Response (200 OK):**
```json
{ "success": true }
```

**Response (404):**
```json
{ "error": "App not found" }
```

---

### Storage Backend

The App Registry uses PostgreSQL when available, falling back to an in-memory store. On startup:
1. Attempts database migration (CREATE TABLE IF NOT EXISTS)
2. If successful, all operations use PostgreSQL
3. If unavailable, uses in-memory Map with sample seed data

---

## LiquidMind Resource API

The LiquidMind Resource API provides unified management for AI resources (prompts, memory, context, knowledge, artifacts, skills, MCP servers) with full-text search, versioning, sharing, and context compilation.

**Base Path:** `/api/resources`

> For comprehensive documentation including database schema, compilation details, and usage guides, see [LiquidMind Documentation](../../docs/infrastructure/liquidmind.md).

### List Resources

**GET** `/api/resources`

List resources with filtering and pagination.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by resource_type (prompt, memory, context, knowledge, artifact, skill, mcp) |
| `ownerType` | string | Filter by owner_type (app, agent, system, user) |
| `ownerId` | string | Filter by owner_id |
| `tags` | string | Comma-separated tag filter |
| `active` | boolean | Filter active resources (default: true) |
| `search` | string | Full-text search query |
| `limit` | number | Page size (default: 50) |
| `offset` | number | Pagination offset |

**Response (200 OK):**
```json
{
  "resources": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "resourceType": "prompt",
      "ownerType": "app",
      "ownerId": "crypto-advisor",
      "name": "Market Analysis Prompt",
      "content": "You are a crypto analyst...",
      "typeMetadata": { "type": "prompt", "template": "...", "variables": [] },
      "version": 2,
      "isActive": true,
      "isPinned": false,
      "tags": ["trading"],
      "provenance": "user_input",
      "usageFrequency": 12,
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-23T08:30:00Z"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

---

### Get Resource

**GET** `/api/resources/:id`

Get a single resource with its shares.

**Response (200 OK):**
```json
{
  "id": "...",
  "resourceType": "memory",
  "name": "User prefers technical analysis",
  "content": "...",
  "shares": [
    { "targetType": "agent", "targetId": "trade-bot", "permission": "read" }
  ]
}
```

---

### Create Resource

**POST** `/api/resources`

**Request Body:**
```json
{
  "resourceType": "prompt",
  "ownerType": "app",
  "ownerId": "crypto-advisor",
  "name": "System Prompt",
  "content": "You are a helpful crypto advisor...",
  "typeMetadata": { "type": "prompt", "template": "...", "variables": [] },
  "tags": ["system"],
  "provenance": "user_input"
}
```

**Response (201 Created):** The created resource object.

---

### Update Resource

**PATCH** `/api/resources/:id`

Updates trigger automatic versioning when content or metadata changes.

**Request Body:**
```json
{
  "content": "Updated content...",
  "typeMetadata": { "type": "prompt", "template": "new template" }
}
```

---

### Delete Resource

**DELETE** `/api/resources/:id`

Soft delete (sets `is_active = false`). Resource remains in database for rollback.

---

### Search Resources

**GET** `/api/resources/search?q=trading+analysis`

Full-text search with PostgreSQL `ts_rank` ranking.

---

### Share Resource

**POST** `/api/resources/:id/share`

```json
{
  "targetType": "agent",
  "targetId": "crypto-advisor",
  "permission": "read"
}
```

**Permissions:** `read` (include in context), `write` (can modify), `copy` (duplicate)

---

### Remove Share

**DELETE** `/api/resources/:id/share/:targetType/:targetId`

---

### Version History

**GET** `/api/resources/:id/versions`

Returns all versions of a resource.

---

### Revert to Version

**POST** `/api/resources/:id/revert/:version`

Reverts resource content/metadata to a specific version.

---

### Compile Context

**POST** `/api/resources/compile/:ownerType/:ownerId`

Compile all resources for a target into a structured context.

**Request Body:**
```json
{
  "currentQuery": "What is the BTC trend?",
  "tokenBudget": 8000
}
```

**Response (200 OK):**
```json
{
  "systemPrompt": "...",
  "tools": [{ "name": "analyze_chart", "description": "...", "parameters": {} }],
  "ragStoreIds": ["store-123"],
  "tokenCount": 6420,
  "budgetRemaining": 1580,
  "deferredResources": ["resource-id-1"]
}
```

---

### Migrate from localStorage

**POST** `/api/resources/migrate-localStorage`

Bulk migrate legacy resources from localStorage format.

**Request Body:**
```json
{
  "resources": [
    {
      "resourceType": "prompt",
      "ownerType": "app",
      "ownerId": "global",
      "name": "Migrated Prompt",
      "content": "...",
      "tags": ["migrated"]
    }
  ]
}
```

---

## Support

For issues and feature requests, please open an issue on GitHub.
