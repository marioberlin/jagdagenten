# Local Development Setup Guide

This guide explains how to set up the LiquidCrypto development environment with all services running locally.

## Prerequisites

- **Bun** v1.0+ (JavaScript runtime)
- **Docker** with one of:
  - Docker Desktop
  - Colima (recommended for macOS)
  - OrbStack
- **Git**

## Quick Start

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd LiquidCrypto
bun install

# 2. Start infrastructure services
docker-compose up -d

# 3. Copy environment configuration
cp .env.example .env

# 4. Start the development server
bun run dev
```

## Infrastructure Services

### Docker Compose Services

The `docker-compose.yml` file provides the following services:

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | A2A task persistence, artifacts |
| Redis | 6379 | Caching, WebSocket pub/sub |

### Starting Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### macOS: Starting Docker Runtime

If you use Colima (recommended):

```bash
# Start Colima with recommended resources
colima start --cpu 2 --memory 4

# Verify Docker is running
docker ps
```

## Environment Configuration

### Required Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Key environment variables:

```bash
# Database (required for A2A persistence)
DATABASE_URL=postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto

# Server
PORT=3000
WEBSOCKET_PORT=3001

# Redis (optional, falls back to local)
REDIS_URL=redis://localhost:6379

# AI APIs (at least one required for AI features)
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key

# Google OAuth (for user authentication)
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# Google APIs (optional, for specific agents)
GOOGLE_PLACES_API_KEY=your-key           # Restaurant Finder agent
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email  # Smart Sheets
GOOGLE_PRIVATE_KEY="-----BEGIN..."       # Smart Sheets
GOOGLE_MASTER_TEMPLATE_ID=sheet-id       # Smart Sheets template
```

### Feature Flags

```bash
# Enable PostgreSQL stores (auto-detected if DATABASE_URL is set)
USE_POSTGRES=true

# Enable telemetry
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Require WebSocket authentication
REQUIRE_WS_AUTH=true
```

## Database Setup

### Automatic Schema Creation

The database schema is automatically created on first run via Docker's init scripts in `server/sql/`.

### Manual Schema Creation

If needed, you can manually apply the schema:

```bash
# Connect to PostgreSQL
docker exec -it liquidcrypto-postgres psql -U liquidcrypto -d liquidcrypto

# Or run migrations
bun run db:migrate
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `a2a_tasks` | A2A task state, history, status |
| `a2a_push_notifications` | Push notification configurations |
| `a2a_artifacts` | Agent-generated artifacts |
| `a2a_artifact_versions` | Artifact version history |
| `a2a_pinned_artifacts` | User-pinned artifacts |

### Checking Database Content

```bash
# List tasks
docker exec liquidcrypto-postgres psql -U liquidcrypto -d liquidcrypto \
  -c "SELECT id, status_state, created_at FROM a2a_tasks ORDER BY created_at DESC LIMIT 10;"

# List artifacts
docker exec liquidcrypto-postgres psql -U liquidcrypto -d liquidcrypto \
  -c "SELECT id, task_id, name, created_at FROM a2a_artifacts ORDER BY created_at DESC LIMIT 10;"
```

## Running the Server

### Development Mode

```bash
# Frontend + Backend with hot reload
bun run dev

# Backend only
bun run server

# Frontend only
bun run client
```

### Production Mode

```bash
# Build
bun run build

# Start
bun run start
```

### Server Endpoints

| Endpoint | Description |
|----------|-------------|
| `http://localhost:3000` | HTTP API |
| `ws://localhost:3001` | WebSocket |
| `http://localhost:3000/.well-known/agent-card.json` | A2A Agent Card (v1.0) |
| `http://localhost:3000/a2a` | A2A JSON-RPC 2.0 endpoint |
| `http://localhost:3000/a2a/stream` | A2A Streaming (SSE) |

## Testing the A2A Endpoint

### Test Agent Discovery (v1.0)

```bash
curl http://localhost:3000/.well-known/agent-card.json | jq
```

### Test SendMessage (v1.0 format)

```bash
curl -X POST http://localhost:3000/a2a \
  -H "Content-Type: application/json" \
  -H "A2A-Protocol-Version: 1.0" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-1",
    "method": "SendMessage",
    "params": {
      "message": {
        "messageId": "msg-123",
        "role": "user",
        "parts": [{ "text": "Show my portfolio" }]
      }
    }
  }'
```

### Note on v0.x Methods

> **Deprecated**: As of January 2026, LiquidCrypto operates in strict v1.0 mode. Legacy method names (`message/send`, `tasks/get`) are no longer supported. Use PascalCase methods (`SendMessage`, `GetTask`) exclusively.

### Test GetTask

```bash
curl -X POST http://localhost:3000/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-3",
    "method": "GetTask",
    "params": { "id": "<task-id-from-previous-response>" }
  }'
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Find and kill process on port 3001
lsof -ti :3001 | xargs kill -9
```

### Docker Not Running

```bash
# macOS with Colima
colima start

# Check Docker status
docker info
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker exec liquidcrypto-postgres pg_isready -U liquidcrypto

# View PostgreSQL logs
docker-compose logs postgres
```

### Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker exec liquidcrypto-redis redis-cli ping
```

### TypeBox Version Error

If you see `SyntaxError: export 'TypeSystemPolicy' not found`:

```bash
bun add @sinclair/typebox@^0.34.0
```

## Development Workflow

### 1. Start Services

```bash
docker-compose up -d
```

### 2. Start Dev Server

```bash
bun run dev
```

### 3. Make Changes

- Frontend code in `src/`
- Backend code in `server/src/`
- A2A SDK in `packages/a2a-sdk/`

### 4. Run Tests

```bash
# All tests
bun test

# Specific test file
bun test tests/unit/a2a.test.ts

# Watch mode
bun test --watch
```

### 5. Clean Up

```bash
# Stop services
docker-compose down

# Full cleanup (removes data)
docker-compose down -v
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Local Development Stack                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Browser (localhost:5173)                                        │
│       │                                                          │
│       ▼                                                          │
│  Vite Dev Server ─────────────► React Frontend                  │
│       │                                                          │
│       ▼                                                          │
│  Elysia Server (localhost:3000)                                 │
│       │                                                          │
│       ├── A2A Plugin ─────────► Agent Executors                 │
│       │       │                                                  │
│       │       ▼                                                  │
│       │   PostgreSQL (localhost:5432)                           │
│       │                                                          │
│       ├── WebSocket ─────────► Redis Pub/Sub                    │
│       │                         (localhost:6379)                │
│       │                                                          │
│       └── REST API                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Related Documentation

- [A2A SDK Integration Plan](./A2A_SDK_INTEGRATION_PLAN.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Container Deployment Guide](./CONTAINER_DEPLOYMENT_GUIDE.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
