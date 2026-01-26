# NATS Messaging Infrastructure

> High-performance messaging for A2A agent communication, Orchestrator work queues, and WebSocket distribution with back-pressure support.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Components](#components)
6. [Usage Examples](#usage-examples)
7. [Subject Patterns](#subject-patterns)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Overview

LiquidCrypto uses [NATS](https://nats.io) for real-time messaging alongside Redis (caching) and PostgreSQL (persistence).

### Why NATS?

| Feature | NATS | Redis Pub/Sub |
|---------|------|---------------|
| **Wildcards** | ✅ `agents.*.tasks.>` | ❌ Exact channels only |
| **Work Queue** | ✅ Queue groups | ❌ Broadcast only |
| **Back-Pressure** | ✅ JetStream flow control | ❌ None |
| **Persistence** | ✅ JetStream streams | ❌ Fire-and-forget |
| **Latency** | ~0.5ms p50 | ~0.9ms p50 |

### Components

| Module | File | Purpose |
|--------|------|---------|
| **Client** | `server/src/nats/client.ts` | Connection, JetStream, health checks |
| **A2A Bus** | `server/src/nats/a2a-bus.ts` | Agent task/event messaging |
| **Work Queue** | `server/src/nats/work-queue.ts` | Orchestrator task distribution |
| **WebSocket** | `server/src/websocket-nats.ts` | Cross-instance broadcasting |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LiquidCrypto                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   A2A        │    │ Orchestrator │    │  WebSocket   │       │
│  │   Handler    │    │              │    │   Manager    │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                    ┌────────▼────────┐                           │
│                    │   NATS Client   │                           │
│                    │   (nats/*)      │                           │
│                    └────────┬────────┘                           │
└─────────────────────────────┼────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
      ┌───────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
      │     NATS      │ │   Redis   │ │  PostgreSQL   │
      │  (JetStream)  │ │  (Cache)  │ │    (Data)     │
      │               │ │           │ │               │
      │ • A2A Topics  │ │ • L2 Cache│ │ • Sessions    │
      │ • Work Queue  │ │ • Rate    │ │ • Tasks       │
      │ • Trade Events│ │   Limits  │ │ • Agents      │
      └───────────────┘ └───────────┘ └───────────────┘
```

### JetStream Streams

| Stream | Subjects | Retention | Purpose |
|--------|----------|-----------|---------|
| `A2A_TASKS` | `agents.>`, `system.>` | 1 hour | Agent messaging |
| `ORCHESTRATOR_TASKS` | `orchestrator.tasks.>`, `orchestrator.results.>` | Work Queue | Task distribution |
| `TRADE_EVENTS` | `trades.>`, `ws.broadcast` | 5 minutes | Trade data |

---

## Quick Start

### Development

```bash
# Start NATS with JetStream
docker compose up -d nats

# Verify
docker compose ps nats
# STATUS: healthy

# Start server (auto-connects to NATS)
bun run server:dev
```

### Verify Connection

```bash
# Health check endpoint
curl http://localhost:3000/api/v1/nats/health

# Expected response:
{
  "connected": true,
  "server": "NC6FJN27MQCKILS2SX23UC5E5CN4V5E4ESQWSZ2EDXQPE5F5UE7K3FFZ",
  "rtt": 1,
  "jetstream": {
    "enabled": true,
    "streams": 3
  }
}
```

### Production

Add to `docker-compose.prod.yml`:

```yaml
nats:
  image: nats:2.10-alpine
  container_name: liquidcrypto-nats
  command: ["--js", "--sd", "/data", "-m", "8222"]
  restart: unless-stopped
  ports:
    - "4222:4222"   # Client
    - "8222:8222"   # Monitoring (internal only in prod)
  volumes:
    - nats_data:/data
  networks:
    - liquid-network
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:8222/healthz"]
    interval: 5s
    timeout: 3s
    retries: 3
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NATS_URL` | `nats://localhost:4222` | NATS server URL |
| `WS_BACKEND` | `redis` | Set to `nats` for NATS WebSocket |

### Docker Compose Ports

| Port | Service | Description |
|------|---------|-------------|
| 4222 | NATS Client | Application connections |
| 8222 | NATS HTTP | Monitoring dashboard |
| 6222 | NATS Cluster | Node clustering (internal) |

---

## Components

### NATS Client (`nats/client.ts`)

Core connection manager with auto-reconnect and JetStream support.

```typescript
import { initNats, closeNats, isNatsConnected, publish, subscribe } from './nats/index.js';

// Initialize (called at server startup)
await initNats();

// Check connection
if (isNatsConnected()) {
  // Publish message
  publish('my.subject', { data: 'hello' });
  
  // Subscribe
  const sub = await subscribe('my.subject', (data) => {
    console.log('Received:', data);
  });
}

// Graceful shutdown
await closeNats();
```

### A2A Bus (`nats/a2a-bus.ts`)

Agent-to-Agent messaging with wildcards and queue groups.

```typescript
import { publishTask, publishEvent, subscribeToTasks, subscribeToEvents } from './nats/index.js';

// Publish task to agent
publishTask('trading-agent', 'execute', {
  id: 'task-123',
  payload: { symbol: 'BTCUSDT', action: 'buy' }
});

// Publish event
publishEvent('trading-agent', 'order_filled', { orderId: '456' });

// Subscribe with wildcard (all agents)
await subscribeToEvents('*.events.>', (event) => {
  console.log(`${event.agentId}: ${event.type}`);
});

// Subscribe with queue group (load balanced)
await subscribeToTasks('trading-agent.tasks.*', handler, { queue: 'trading-workers' });
```

### Work Queue (`nats/work-queue.ts`)

JetStream-based task queue with exactly-once delivery.

```typescript
import { enqueueOrchestratorTask, startOrchestratorWorker, collectResults } from './nats/index.js';

// Enqueue task
await enqueueOrchestratorTask({
  sessionId: 'session-123',
  subPrdId: 'ui-component',
  specialist: 'ui-agent',
  payload: { story: 'Build login page' },
  createdAt: Date.now(),
});

// Start worker (only one receives each task)
const stop = await startOrchestratorWorker(async (task) => {
  const result = await processTask(task);
  return {
    sessionId: task.sessionId,
    subPrdId: task.subPrdId,
    success: true,
    result,
    completedAt: Date.now(),
  };
});

// Collect results
const results = await collectResults('session-123', expectedCount, timeoutMs);
```

### WebSocket Manager (`websocket-nats.ts`)

Cross-instance WebSocket with back-pressure for trade events.

```typescript
import { NatsWebSocketManager } from './websocket-nats.js';

const wsManager = new NatsWebSocketManager();
await wsManager.init();

// Publish trade with back-pressure
await wsManager.publishTradeEvent('BTCUSDT', { price: 95000, volume: 1.5 });

// Subscribe to trades
const unsub = await wsManager.subscribeToTradeEvents(['BTCUSDT', 'ETHUSDT'], (data) => {
  console.log('Trade:', data);
});
```

---

## Subject Patterns

NATS uses dot-separated subject hierarchies with wildcards:

| Pattern | Description | Example |
|---------|-------------|---------|
| `agents.{agentId}.tasks.{type}` | Task to specific agent | `agents.trading.tasks.execute` |
| `agents.{agentId}.events.{event}` | Event from agent | `agents.trading.events.complete` |
| `agents.*.heartbeat` | All agent heartbeats | Matches any agent |
| `agents.>` | All agent messages | Matches any depth |
| `system.events.{type}` | System-wide events | `system.events.task_state_changed` |
| `orchestrator.tasks.{session}.{subprd}` | Work queue task | `orchestrator.tasks.s123.ui-1` |
| `orchestrator.results.{session}.>` | Task results | `orchestrator.results.s123.ui-1` |
| `trades.{symbol}` | Trade events | `trades.BTCUSDT` |
| `ws.broadcast` | WebSocket broadcast | Cross-instance messages |

### Wildcards

- `*` — Matches exactly one token: `agents.*.tasks` matches `agents.trading.tasks`
- `>` — Matches one or more tokens at end: `agents.>` matches `agents.trading.tasks.execute`

---

## Monitoring

### NATS Dashboard

Access the built-in monitoring UI:

```bash
# Development
open http://localhost:8222

# Key endpoints:
# /varz    - Server variables
# /connz   - Connections
# /subsz   - Subscriptions
# /jsz     - JetStream status
```

### Health Endpoint

```bash
curl http://localhost:3000/api/v1/nats/health
```

### NATS CLI (Optional)

Install the NATS CLI for advanced debugging:

```bash
# macOS
brew install nats-io/nats-tools/nats

# Commands
nats stream ls                    # List streams
nats consumer ls ORCHESTRATOR_TASKS  # List consumers
nats sub "agents.>"               # Subscribe to all agents
nats pub agents.test.tasks '{"data":"test"}'  # Publish test
```

---

## Troubleshooting

### NATS Not Connecting

```bash
# Check if NATS is running
docker compose ps nats

# Check logs
docker compose logs nats

# Verify port
nc -zv localhost 4222
```

### Health Check Returns `connected: false`

1. Verify NATS container is healthy:
   ```bash
   docker inspect liquidcrypto-nats --format='{{.State.Health.Status}}'
   ```

2. Check server logs for connection errors:
   ```bash
   docker compose logs backend-blue | grep NATS
   ```

3. Verify `NATS_URL` environment variable.

### JetStream Stream Issues

```bash
# Recreate stream (data loss!)
nats stream delete A2A_TASKS
# Stream will be recreated on next connection
```

### Messages Not Received

1. Check subscription is active:
   ```bash
   nats sub "agents.>" --count 1
   ```

2. Verify subject pattern matches exactly.

3. For queue groups, ensure only one consumer gets each message (expected behavior).

### Server Running Without NATS

The server starts in **degraded mode** if NATS is unavailable:

```
[Server] NATS not available - running in degraded mode
```

Features that require NATS (A2A events, work queue) will log warnings but won't crash.

---

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `initNats()` | Initialize connection |
| `closeNats()` | Graceful shutdown |
| `isNatsConnected()` | Check connection status |
| `getNatsHealth()` | Health check with RTT |
| `publish(subject, data)` | Publish message |
| `subscribe(subject, handler, opts?)` | Subscribe to subject |
| `request(subject, data, timeout?)` | Request-reply pattern |

### A2A Functions

| Function | Description |
|----------|-------------|
| `publishTask(agentId, type, task)` | Send task to agent |
| `publishEvent(agentId, type, data?)` | Emit agent event |
| `publishSystemEvent(type, data?)` | Emit system event |
| `subscribeToTasks(pattern, handler, opts?)` | Subscribe to tasks |
| `subscribeToEvents(pattern, handler)` | Subscribe to events |

### Work Queue Functions

| Function | Description |
|----------|-------------|
| `enqueueOrchestratorTask(task)` | Add task to queue |
| `startOrchestratorWorker(handler)` | Process queue tasks |
| `collectResults(sessionId, count, timeout?)` | Collect task results |
| `subscribeToResults(sessionId, handler)` | Stream results |

---

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production deployment guide
- [orchestrator.md](./orchestrator.md) — Multi-agent orchestration
- [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md) — System overview
