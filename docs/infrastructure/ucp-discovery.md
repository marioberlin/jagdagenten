# UCP Merchant Discovery Service

> **Version:** January 2026
> **Status:** Production Ready

The UCP Merchant Discovery Service is a comprehensive system for discovering, crawling, validating, and monitoring merchants that implement the Universal Commerce Protocol (UCP). It provides a central registry of UCP-enabled merchants with real-time health monitoring, scoring, and A2A (Agent-to-Agent) capability detection.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Core Components](#core-components)
5. [API Reference](#api-reference)
6. [WebSocket Events](#websocket-events)
7. [Scoring System](#scoring-system)
8. [Health Monitoring](#health-monitoring)
9. [Seed Providers](#seed-providers)
10. [Notifications](#notifications)
11. [Frontend UI](#frontend-ui)
12. [Configuration](#configuration)
13. [Usage Examples](#usage-examples)

---

## Overview

### What is UCP Discovery?

UCP Discovery is a merchant discovery and monitoring service that:

- **Discovers** UCP-enabled merchants from multiple seed sources
- **Validates** UCP profiles and Agent Cards against the specification
- **Monitors** merchant health with adaptive scheduling
- **Scores** merchants based on profile completeness, A2A capabilities, and region proximity
- **Notifies** on tier changes and new A2A-capable merchants

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Source Discovery** | Crawls awesome-ucp, ucptools.com, ucp-checker, and manual entries |
| **Concurrent Crawling** | Parallel domain processing with per-domain rate limiting |
| **PostgreSQL Persistence** | Full data persistence with JSONB profiles and validation results |
| **Real-time Progress** | WebSocket streaming of crawler progress to connected clients |
| **Health Tier System** | A/B/C tier classification with adaptive check intervals |
| **A2A Detection** | Automatic detection of Agent Card and A2A capabilities |
| **Export/Import** | Full registry export and bulk import for backups |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UCP Discovery Architecture                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │   Seed Providers  │  │    Crawler       │  │     Scheduler        │  │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────────┐  │  │
│  │  │ Awesome UCP│  │  │  │ Full Crawl │  │  │  │ Background Loop│  │  │
│  │  │ UCPTools   │  │──▶│  │ Incremental│  │  │  │ Interval-based│  │  │
│  │  │ UCP-Checker│  │  │  │ Add Domain │  │  │  │ Health Checks  │  │  │
│  │  │ Manual     │  │  │  └────────────┘  │  │  └────────────────┘  │  │
│  │  └────────────┘  │  └────────┬─────────┘  └──────────────────────┘  │
│  └──────────────────┘           │                                       │
│                                 ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Processing Pipeline                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │ Fetch    │  │ Validate │  │ Score    │  │ Persist          │  │  │
│  │  │ Profile  │──▶│ Schema   │──▶│ Merchant │──▶│ to PostgreSQL   │  │  │
│  │  │ & Agent  │  │ & Agent  │  │ Health   │  │                  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                 │                                       │
│                                 ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Storage Layer                                 │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                    PostgreSQL                               │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │  │  │
│  │  │  │ Merchants   │  │ Profiles    │  │ Validation Results  │ │  │  │
│  │  │  │ Sources     │  │ Agent Cards │  │ Crawl State/History │ │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                    ▼                         ▼                          │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐   │
│  │      REST API            │  │      WebSocket                    │   │
│  │  /api/ucp-discovery/*    │  │  /api/ucp-discovery/crawl/progress│   │
│  └──────────────────────────┘  └──────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

The UCP Discovery service uses 8 PostgreSQL tables:

```sql
-- Main merchant registry
CREATE TABLE ucp_merchants (
    id VARCHAR(255) PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    region VARCHAR(50),
    score INTEGER DEFAULT 0,
    health_tier VARCHAR(1) DEFAULT 'C',
    has_a2a BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discovery sources tracking
CREATE TABLE ucp_merchant_sources (
    id VARCHAR(255) PRIMARY KEY,
    merchant_id VARCHAR(255) REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- UCP Profile snapshots (JSONB storage)
CREATE TABLE ucp_profiles (
    merchant_id VARCHAR(255) PRIMARY KEY REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    profile JSONB NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Card snapshots for A2A-capable merchants
CREATE TABLE ucp_agent_cards (
    merchant_id VARCHAR(255) PRIMARY KEY REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    agent_card JSONB NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema validation results
CREATE TABLE ucp_validation_results (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(255) REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    validator VARCHAR(100) NOT NULL,
    field VARCHAR(255),
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-merchant crawl state
CREATE TABLE ucp_crawl_state (
    merchant_id VARCHAR(255) PRIMARY KEY REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    last_check_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    last_error TEXT,
    last_latency_ms INTEGER
);

-- Fetch history for latency tracking
CREATE TABLE ucp_fetch_history (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(255) REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    status_code INTEGER,
    latency_ms INTEGER,
    error TEXT
);

-- Crawler run tracking
CREATE TABLE ucp_crawler_runs (
    id SERIAL PRIMARY KEY,
    run_type VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    domains_discovered INTEGER,
    domains_processed INTEGER,
    new_merchants INTEGER,
    updated_merchants INTEGER,
    errors JSONB
);
```

### Indexes

```sql
CREATE INDEX idx_ucp_merchants_domain ON ucp_merchants(domain);
CREATE INDEX idx_ucp_merchants_region ON ucp_merchants(region);
CREATE INDEX idx_ucp_merchants_health ON ucp_merchants(health_tier);
CREATE INDEX idx_ucp_merchants_active ON ucp_merchants(is_active);
CREATE INDEX idx_ucp_crawl_next ON ucp_crawl_state(next_check_at);
```

---

## Core Components

### Storage Layer

**File:** `server/src/services/ucp-discovery/store.ts`

Unified storage interface wrapping PostgreSQL operations:

```typescript
import { store } from '../services/ucp-discovery/index.js';

// Merchant operations
await store.getMerchantById(id);
await store.getMerchantByDomain(domain);
await store.getAllMerchants();
await store.upsertMerchant(merchant);
await store.deleteMerchant(id);

// Filtering
await store.getMerchantsFiltered({
  region: 'EU',
  healthTier: 'A',
  hasA2A: true,
  isActive: true,
  minScore: 50,
  page: 1,
  pageSize: 20,
});

// Profiles & Agent Cards
await store.setProfile(profile);
await store.getProfile(merchantId);
await store.setAgentCard(agentCard);
await store.getAgentCard(merchantId);

// Validation
await store.addValidationResults(results);
await store.getValidationResults(merchantId);
await store.clearValidationResults(merchantId);

// Crawl State
await store.getCrawlState(merchantId);
await store.updateCrawlState(merchantId, updates);
await store.getMerchantsDueForCheck(limit);

// Statistics
await store.getStats();
```

### Crawler

**File:** `server/src/services/ucp-discovery/crawler.ts`

The crawler supports two modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Full Crawl** | Fetches all seeds and processes every domain | Initial population, daily refresh |
| **Incremental** | Only processes merchants due for health check | Continuous monitoring |

```typescript
import { runFullCrawl, runIncrementalCrawl, addDomain } from '../services/ucp-discovery/index.js';

// Full crawl from all seed providers
const result = await runFullCrawl();
// { domainsDiscovered: 150, processed: 150, newMerchants: 45, errors: [] }

// Incremental crawl for due merchants only
const result = await runIncrementalCrawl();
// { processed: 12, newMerchants: 0, updatedMerchants: 12, errors: [] }

// Manually add a domain
const result = await addDomain('example.com', 'EU');
// { merchantId: 'xxx', isNew: true, isValid: true, hasA2A: false, score: 65 }
```

### Validators

**File:** `server/src/services/ucp-discovery/validators.ts`

Schema validation for UCP profiles and Agent Cards:

```typescript
import { validateUCPProfile, validateAgentCard } from '../services/ucp-discovery/index.js';

const profileResults = validateUCPProfile(profile);
// [{ validator: 'schema', field: 'name', severity: 'error', message: 'Required field missing' }]

const agentResults = validateAgentCard(agentCard);
// [{ validator: 'schema', field: 'capabilities', severity: 'warning', message: 'Empty array' }]
```

### Fetchers

**File:** `server/src/services/ucp-discovery/fetchers.ts`

HTTP fetching with timeouts and error handling:

```typescript
import { fetchUCPProfile, fetchAgentCard } from '../services/ucp-discovery/index.js';

const profileResult = await fetchUCPProfile('example.com');
// { success: true, profile: {...}, latencyMs: 245 }

const agentResult = await fetchAgentCard('example.com');
// { success: true, agentCard: {...}, latencyMs: 180 }
```

---

## API Reference

### Base URL

```
/api/ucp-discovery
```

### Merchant Endpoints

#### List Merchants

```http
GET /merchants?region=EU&minScore=50&hasA2A=true&isActive=true&healthTier=A&page=1&pageSize=20
```

**Response:**
```json
{
  "merchants": [...],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

#### Get Merchant Details

```http
GET /merchants/:id
```

**Response:**
```json
{
  "merchant": { "id": "...", "domain": "example.com", ... },
  "sources": [...],
  "profile": { ... },
  "agentCard": { ... },
  "validationResults": [...],
  "crawlState": { ... },
  "latestFetch": { "fetchedAt": "...", "statusCode": 200, "latencyMs": 180 }
}
```

#### Add Merchant

```http
POST /merchants
Content-Type: application/json

{ "domain": "example.com", "region": "EU" }
```

#### Remove Merchant

```http
DELETE /merchants/:domain
```

### Crawler Endpoints

#### Run Full Crawl

```http
POST /crawl/full
```

#### Run Incremental Crawl

```http
POST /crawl/incremental
```

#### Get Crawler Status

```http
GET /crawl/status
```

**Response:**
```json
{
  "isRunning": false,
  "lastRunAt": "2026-01-27T10:00:00Z",
  "lastRunDuration": 45000,
  "lastRunType": "full",
  "config": {
    "concurrency": 10,
    "perDomainConcurrency": 2,
    "connectTimeout": 5000,
    "requestTimeout": 10000,
    "maxRedirects": 3,
    "selectedRegion": "EU"
  }
}
```

#### Update Crawler Config

```http
PATCH /crawl/config
Content-Type: application/json

{
  "concurrency": 20,
  "selectedRegion": "US"
}
```

### Scheduler Endpoints

#### Start Scheduler

```http
POST /scheduler/start
Content-Type: application/json

{ "intervalMs": 3600000 }
```

#### Stop Scheduler

```http
POST /scheduler/stop
```

#### Get Scheduler Status

```http
GET /scheduler/status
```

### Statistics Endpoints

#### Get Registry Stats

```http
GET /stats
```

**Response:**
```json
{
  "totalMerchants": 150,
  "activeMerchants": 142,
  "withA2A": 45,
  "byRegion": { "EU": 80, "US": 50, "CA": 12, "OTHER": 8 },
  "byHealthTier": { "A": 100, "B": 30, "C": 12 },
  "lastCrawlAt": "2026-01-27T10:00:00Z",
  "lastCrawlDuration": 45000
}
```

#### Get Health Summary

```http
GET /health
```

### Notification Endpoints

#### Get Notifications

```http
GET /notifications?limit=20
```

#### Clear Notifications

```http
DELETE /notifications
```

### Export/Import Endpoints

#### Export Registry

```http
GET /export
```

#### Import Registry

```http
POST /import
Content-Type: application/json

{
  "data": [...],
  "merge": true
}
```

---

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket('wss://example.com/api/ucp-discovery/crawl/progress');

ws.onopen = () => {
  console.log('Connected to crawler progress stream');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleCrawlerEvent(data);
};
```

### Event Types

| Type | Payload | Description |
|------|---------|-------------|
| `connected` | `{ message: string }` | WebSocket connection established |
| `started` | `{ runType: 'full' \| 'incremental' }` | Crawl started |
| `progress` | `{ phase, current, total, domain }` | Per-domain progress |
| `completed` | `{ stats: { newMerchants, updatedMerchants, errors } }` | Crawl finished |
| `error` | `{ message: string }` | Crawl error |
| `pong` | `{}` | Response to `ping` keepalive |

### Example Event Stream

```json
{"type": "connected", "message": "Connected to crawler progress stream"}
{"type": "started", "runType": "full"}
{"type": "progress", "phase": "fetching", "current": 1, "total": 150, "domain": "example.com"}
{"type": "progress", "phase": "fetching", "current": 2, "total": 150, "domain": "shop.io"}
...
{"type": "completed", "stats": {"newMerchants": 45, "updatedMerchants": 105, "errors": 0}}
```

---

## Scoring System

### Score Calculation

**File:** `server/src/services/ucp-discovery/scoring.ts`

Merchants are scored from 0-100 based on multiple factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Profile Completeness** | 40 | Required fields, descriptions, policies |
| **A2A Capability** | 25 | Has valid Agent Card |
| **Region Match** | 15 | Matches selected region preference |
| **Validation Status** | 10 | No errors in schema validation |
| **Response Latency** | 10 | Fast response times |

```typescript
import { calculateMerchantScore } from '../services/ucp-discovery/index.js';

const score = calculateMerchantScore({
  merchantId: 'xxx',
  domain: 'example.com',
  region: 'EU',
  profile: { ... },
  validationResults: [],
  crawlState: { consecutiveFailures: 0 },
  lastFetchLatencyMs: 200,
  selectedRegion: 'EU',
});
// Returns: 85
```

### Health Tiers

| Tier | Score Range | Check Interval | Description |
|------|-------------|----------------|-------------|
| **A** | 70-100 | 6-24 hours | Healthy, frequent checks |
| **B** | 40-69 | 2-7 days | Degraded, moderate checks |
| **C** | 0-39 | 7-30 days | Failing, infrequent checks |

---

## Health Monitoring

### Adaptive Scheduling

The scheduler uses an adaptive algorithm that adjusts check frequency based on health tier and consecutive failures:

```typescript
import { calculateNextCheckTime, assignHealthTier } from '../services/ucp-discovery/index.js';

const healthTier = assignHealthTier(score, consecutiveFailures);
// 'A', 'B', or 'C'

const nextCheck = calculateNextCheckTime(healthTier, consecutiveFailures);
// Date object for next check time
```

### Failure Backoff

| Failures | Backoff |
|----------|---------|
| 0 | Base interval |
| 1 | 2x base interval |
| 2 | 4x base interval |
| 3+ | 8x base interval (capped) |

---

## Seed Providers

### Available Providers

| Provider | Source | Description |
|----------|--------|-------------|
| **AwesomeUCP** | GitHub awesome-ucp repo | Curated list of UCP merchants |
| **UCPTools** | ucptools.com/api | UCP validator service registry |
| **UCPChecker** | ucp-checker.com | Community validation service |
| **Manual** | In-memory | User-submitted domains |

### Adding Seeds

```typescript
import { fetchAllSeeds, ManualProvider } from '../services/ucp-discovery/index.js';

// Fetch from all providers
const seeds = await fetchAllSeeds();
// [{ domain: 'example.com', source: 'awesome-ucp', region: 'EU' }, ...]

// Add manual seed
ManualProvider.addDomain('new-merchant.com', 'US');
```

---

## Notifications

### Notification Types

| Type | Trigger | Description |
|------|---------|-------------|
| `tier_change` | Health tier changes | "merchant.com: B → A" |
| `new_a2a` | A2A capability discovered | "merchant.com now supports A2A" |

### Subscribing to Notifications

```typescript
import { onNotification, getRecentNotifications } from '../services/ucp-discovery/index.js';

// Subscribe to real-time notifications
const unsubscribe = onNotification((notification) => {
  console.log(notification.type, notification.domain, notification.message);
});

// Get recent notifications
const recent = getRecentNotifications(20);
```

---

## Frontend UI

### Application Location

```
src/applications/ucp-discovery/UCPDiscoveryApp.tsx
```

### Features

| Feature | Description |
|---------|-------------|
| **Merchant Table** | Sortable, filterable merchant list |
| **Region Filter** | Filter by EU, US, CA, OTHER |
| **Health Filter** | Filter by A, B, C tier |
| **A2A Toggle** | Show only A2A-capable merchants |
| **Add Domain** | Manually add new domains |
| **Crawl Controls** | Trigger full/incremental crawls |
| **Scheduler Toggle** | Start/stop background scheduler |
| **Progress Stream** | Real-time WebSocket progress display |
| **Stats Dashboard** | Registry statistics overview |
| **Notifications** | Recent notification feed |
| **Export/Import** | Backup and restore registry |

### WebSocket Integration

The frontend connects to the WebSocket endpoint for real-time crawler progress:

```tsx
useEffect(() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/ucp-discovery/crawl/progress`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setCrawlerProgress(data);

    if (data.type === 'completed') {
      fetchMerchants();
      fetchStats();
    }
  };

  return () => ws.close();
}, []);
```

---

## Configuration

### Crawler Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `concurrency` | 10 | Max parallel domain fetches |
| `perDomainConcurrency` | 2 | Max parallel requests per domain |
| `connectTimeout` | 5000 | Connection timeout (ms) |
| `requestTimeout` | 10000 | Request timeout (ms) |
| `maxRedirects` | 3 | Max HTTP redirects |
| `userAgent` | Custom | User agent string |
| `selectedRegion` | 'EU' | Preferred region for scoring |

### Scheduler Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `intervalMs` | 3600000 | Check interval (1 hour) |

---

## Usage Examples

### Basic Setup

```typescript
// Start scheduler on server startup
import { startScheduler, startNotificationTracking } from '../services/ucp-discovery/index.js';

startScheduler(3600000); // 1 hour interval
startNotificationTracking();
```

### Run Initial Crawl

```bash
# Via API
curl -X POST http://localhost:3000/api/ucp-discovery/crawl/full
```

### Monitor Crawler Progress

```javascript
const ws = new WebSocket('ws://localhost:3000/api/ucp-discovery/crawl/progress');

ws.onmessage = (event) => {
  const { type, current, total, domain } = JSON.parse(event.data);
  if (type === 'progress') {
    console.log(`[${current}/${total}] Processing ${domain}`);
  }
};
```

### Export for Backup

```bash
curl http://localhost:3000/api/ucp-discovery/export > ucp-registry-backup.json
```

### Import from Backup

```bash
curl -X POST http://localhost:3000/api/ucp-discovery/import \
  -H "Content-Type: application/json" \
  -d @ucp-registry-backup.json
```

---

## File Structure

```
server/src/services/ucp-discovery/
├── index.ts              # Main exports
├── types.ts              # TypeScript interfaces
├── store.ts              # Unified storage interface
├── pg-storage.ts         # PostgreSQL implementation
├── storage.ts            # Legacy in-memory storage
├── crawler.ts            # Crawl orchestration
├── fetchers.ts           # HTTP fetching
├── validators.ts         # Schema validation
├── scoring.ts            # Merchant scoring
├── seed-providers.ts     # Seed source providers
└── notifications.ts      # Notification system

server/src/routes/
└── ucp-discovery-api.ts  # REST + WebSocket API

server/sql/
└── 013_ucp_discovery.sql # Database migration

src/applications/ucp-discovery/
└── UCPDiscoveryApp.tsx   # Frontend UI
```

---

## Related Documentation

- [A2A Protocol](../reference/api/a2a-spec.md) - Agent-to-Agent protocol specification
- [NATS Messaging](./nats.md) - A2A messaging infrastructure
- [System Documentation](./SYSTEM_DOCUMENTATION.md) - Full system overview
