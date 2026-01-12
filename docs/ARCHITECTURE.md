# LiquidCrypto Architecture Documentation

> Last Updated: January 2026
> Version: 1.0.0

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [AI Integration (Liquid Engine)](#ai-integration-liquid-engine)
6. [A2A Protocol Integration](#a2a-protocol-integration)
7. [Agent Hub UI](#agent-hub-ui)
8. [Data Flow](#data-flow)
9. [Design System](#design-system)
10. [Security Architecture](#security-architecture)
11. [Deployment Architecture](#deployment-architecture)

---

## System Overview

LiquidCrypto is a **comprehensive React component library and cryptocurrency trading platform** that implements Apple's Liquid Glass design language with integrated AI capabilities.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **162+ UI Components** | Complete glassmorphism design system |
| **AI Integration** | Multi-provider AI (Gemini + Claude) |
| **Real-time Data** | WebSocket + SSE streaming |
| **Trading Features** | Charts, portfolio, market analysis |
| **Theme System** | Light/dark with runtime switching |

### Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                    │
│ React 19 · TypeScript 5.7 · Vite 6 · Tailwind 3.4          │
│ Framer Motion 11 · React Router 7 · Chart.js 4             │
├─────────────────────────────────────────────────────────────┤
│ BACKEND                                                     │
│ Bun Runtime · Elysia Framework · Redis · WebSocket         │
├─────────────────────────────────────────────────────────────┤
│ AI SERVICES                                                 │
│ Google Gemini 2.0 · Anthropic Claude Sonnet 4              │
├─────────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE                                              │
│ Vercel (Frontend) · Railway/PM2 (Backend) · Redis Cloud    │
└─────────────────────────────────────────────────────────────┘
```

---

## High-Level Architecture

```
                                   ┌──────────────────┐
                                   │    CDN/Edge      │
                                   │    (Vercel)      │
                                   └────────┬─────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │   Static Assets  │    │   React SPA      │    │   API Gateway    │
         │   (CSS, JS, IMG) │    │   (index.html)   │    │   (Optional)     │
         └──────────────────┘    └────────┬─────────┘    └────────┬─────────┘
                                          │                       │
                                          ▼                       │
                              ┌───────────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────────────────┐
│                             ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        BROWSER CLIENT                                │ │
│  │                                                                      │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │ │
│  │  │   React App    │  │  Liquid Engine │  │    State Management    │ │ │
│  │  │   (Pages)      │◄─┤  (AI Client)   │◄─┤    (Context/Hooks)     │ │ │
│  │  └───────┬────────┘  └───────┬────────┘  └────────────────────────┘ │ │
│  │          │                   │                                       │ │
│  │          ▼                   ▼                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Component Library                            │ │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │ │
│  │  │  │Primitives│ │  Forms   │ │  Charts  │ │ Agentic (AI-UI)  │   │ │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│               HTTP REST │ SSE Stream │ WebSocket                         │
│                         │            │                                   │
└─────────────────────────┼────────────┼───────────────────────────────────┘
                          │            │
                          ▼            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVER                                 │
│                         (Bun + Elysia)                                  │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │   REST API    │  │    GraphQL    │  │        WebSocket          │   │
│  │   /api/v1/*   │  │   /graphql    │  │    Port 3001              │   │
│  └───────┬───────┘  └───────┬───────┘  └─────────────┬─────────────┘   │
│          │                  │                        │                  │
│          └──────────────────┼────────────────────────┘                  │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Middleware Layer                             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐  │   │
│  │  │  CORS    │  │ Rate Limit   │  │  Security  │  │  Logging  │  │   │
│  │  │ Headers  │  │ (Redis/Mem)  │  │  Headers   │  │           │  │   │
│  │  └──────────┘  └──────────────┘  └────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Service Layer                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │   │
│  │  │  AI Service  │  │ Cache Layer  │  │   Market Data Service  │ │   │
│  │  │ (Gemini/     │  │   (Redis)    │  │   (Price Simulation)   │ │   │
│  │  │  Claude)     │  │              │  │                        │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘ │   │
│  └─────────┼─────────────────┼─────────────────────────────────────┘   │
│            │                 │                                          │
└────────────┼─────────────────┼──────────────────────────────────────────┘
             │                 │
             ▼                 ▼
┌────────────────────┐  ┌───────────────────┐
│   AI Providers     │  │      Redis        │
│  ┌──────────────┐  │  │  ┌─────────────┐  │
│  │   Gemini     │  │  │  │ Rate Limits │  │
│  │   2.0 Flash  │  │  │  │   Cache     │  │
│  └──────────────┘  │  │  │ AI Responses│  │
│  ┌──────────────┐  │  │  │   Prices    │  │
│  │   Claude     │  │  │  └─────────────┘  │
│  │   Sonnet 4   │  │  │                   │
│  └──────────────┘  │  └───────────────────┘
└────────────────────┘
```

---

## Frontend Architecture

### Directory Structure

```
src/
├── components/           # UI Component Library
│   ├── primitives/      # Base components (Button, Input, Container)
│   ├── forms/           # Form system (react-hook-form + zod)
│   ├── data-display/    # Cards, Charts, Tables, Metrics
│   ├── layout/          # Grid, Stack, Sidebar, Navigation
│   ├── overlays/        # Modal, Drawer, Tooltip, Popover
│   ├── feedback/        # Toast, Alert, Progress, Skeleton
│   ├── agentic/         # AI-powered components
│   │   ├── GlassAgent.tsx      # Autonomous AI agent UI
│   │   ├── GlassCopilot.tsx    # AI assistant sidebar
│   │   ├── GlassDynamicUI.tsx  # AI-generated interfaces
│   │   └── GlassPrompt.tsx     # AI prompt input
│   ├── features/        # Complex features (Kanban, Editor, etc.)
│   ├── trading/         # Domain-specific trading components
│   ├── compound/        # Composed components
│   └── showcase/        # Demo components
│
├── context/             # React Context Providers
│   ├── ThemeContext.tsx         # Theme switching
│   ├── GlassContext.tsx         # Glass material settings
│   ├── AppearanceContext.tsx    # Visual appearance
│   └── UnifiedThemeProvider.tsx # Combined provider
│
├── hooks/               # Custom React Hooks
│   ├── useTheme.ts              # Theme access
│   ├── useGlassIntensity.ts     # Glass effect control
│   ├── useBinanceStream.ts      # WebSocket data
│   ├── useContrastDetection.ts  # A11y contrast
│   └── useFocusTrap.ts          # Focus management
│
├── liquid-engine/       # AI Integration Layer
│   ├── client.ts        # Main LiquidClient class
│   ├── parser.ts        # Streaming JSON parser
│   ├── types.ts         # TypeScript definitions
│   ├── react.tsx        # React bindings
│   ├── adapters/        # Provider adapters
│   ├── strategies/      # Context strategies
│   └── security/        # Input validation
│
├── LiquidSkills/        # Domain-specific Expertise & Logic
│   ├── _registry.md     # Discovery point for all skills
│   ├── liquid-design/   # Glass UI design patterns & scaffolding
│   ├── liquid-agency/   # Agentic orchestration & 3-layer directives
│   ├── vendor/          # Imported/Wrapped external skills
│   └── .venv/           # Central Python runtime for legacy plugins
│
├── pages/               # Route pages
├── services/            # API service layer
├── styles/              # Global styles & tokens
├── themes/              # Theme definitions
├── types/               # Global TypeScript types
└── utils/               # Utility functions
```

### Component Architecture Patterns

#### 1. Compound Component Pattern

```tsx
// Example: GlassCard with compound structure
<GlassCard>
  <GlassCard.Header>
    <GlassCard.Title>Title</GlassCard.Title>
    <GlassCard.Description>Description</GlassCard.Description>
  </GlassCard.Header>
  <GlassCard.Content>...</GlassCard.Content>
  <GlassCard.Footer>...</GlassCard.Footer>
</GlassCard>
```

#### 2. Polymorphic Component Pattern

```tsx
// Using asChild prop with Radix Slot
<GlassButton asChild>
  <a href="/link">Link styled as button</a>
</GlassButton>
```

#### 3. Render Props for AI Components

```tsx
// Agentic components with render customization
<GlassAgent
  render={({ status, args, result }) => (
    <CustomToolUI status={status} data={args} />
  )}
/>
```

### State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     State Management                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  React Context  │  │  LiquidClient   │                  │
│  │  (UI State)     │  │  (AI State)     │                  │
│  │                 │  │                 │                  │
│  │  • Theme        │  │  • Tool states  │                  │
│  │  • Glass        │  │  • Contexts     │                  │
│  │  • Appearance   │  │  • Actions      │                  │
│  │  • Show Code    │  │  • Strategies   │                  │
│  └─────────────────┘  └─────────────────┘                  │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Custom Hooks Layer                      │   │
│  │  useTheme() · useGlassIntensity() · useLiquidAction()│   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Components                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Server Structure

```
server/
├── src/
│   ├── index.ts         # Main Elysia server
│   ├── cache.ts         # Redis/Memory cache layer
│   ├── security.ts      # Security headers & audit
│   ├── websocket.ts     # WebSocket server
│   ├── sentinel.ts      # Redis Sentinel support
│   ├── types.ts         # TypeScript definitions
│   ├── plugins/
│   │   └── rate-limit.ts    # Rate limiting plugin
│   └── services/
│       ├── claude.ts    # Claude AI service
│       └── gemini.ts    # Gemini AI service
├── redis/
│   └── sentinel.conf    # Sentinel configuration
└── docs/
    ├── API.md           # API documentation
    ├── ERRORS.md        # Error codes
    └── SECURITY.md      # Security documentation
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with Redis status |
| `/stream` | GET | SSE stream for real-time updates |
| `/api/v1` | GET | API information |
| `/api/v1/chat` | POST | AI chat (streaming response) |
| `/api/v1/chat/parallel` | POST | Parallel AI (Gemini + Claude) |
| `/api/v1/cache/stats` | GET | Cache statistics |
| `/api/v1/security/nonce` | GET | Get CSP nonce for scripts |
| `/api/v1/security/audit` | GET | Security audit results |
| `/api/v1/portfolio` | GET | Portfolio data |
| `/api/v1/market` | GET | Market statistics |
| `/api/v1/smart/enhance` | POST | AI-powered content enhancement |
| `/api/v1/smart/summarize`| POST | AI content summarization |
| `/api/v1/smart/patterns` | POST | AI pattern detection |
| `/graphql` | POST | GraphQL endpoint |

### Smart Enhancement Service
The backend provides a specialized service for enhancing UI content with AI:
- **Card Enhancement**: Generates summaries and suggested actions for arbitrary card data.
- **Table Analysis**: Detects patterns and anomalies in dataset rows.
- **Chart Insights**: Identifies trends, correlations, and outliers in time-series data.

### Rate Limiting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Rate Limiting Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Request → Extract IP → Check Store → Allow/Deny           │
│                              │                              │
│               ┌──────────────┼──────────────┐              │
│               ▼              ▼              ▼              │
│         ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│         │  Redis  │    │ Memory  │    │ Headers │         │
│         │  Store  │    │ Fallback│    │ Response│         │
│         │         │    │         │    │         │         │
│         │ INCR    │    │ Map<>   │    │ Limit   │         │
│         │ EXPIRE  │    │         │    │ Remaining│        │
│         └─────────┘    └─────────┘    │ Reset   │         │
│                                       └─────────┘         │
│                                                             │
│  Limits:                                                    │
│  • Global: 100 requests / 15 minutes                       │
│  • Chat:   30 requests / 15 minutes                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Integration (Liquid Engine)

### 1. LiquidSkills Architecture
#### LiquidSkills: Skills vs. Plugins

The project implements a **harmonized parallelism** between these two standards:

| Type | Format | Layer | Purpose |
|------|--------|-------|---------|
| **Skill** | `SKILL.md` | Directive | Expert instructions and domain knowledge |
| **Plugin** | `plugin.json` | Orchestration | Automation, Tools, and Lifecycle Hooks |

1.  **Unified Execution**: Every "Skill" folder can be upgraded to a "Plugin" by adding a manifest without losing its instruction-based strengths.
2.  **Autonomous Governance**: Plugins use `PostToolUse` hooks to enforce the specific patterns defined in the Skills.
3.  **Extensible Vendor Pipeline**: Official Claude Plugins are ingested into `LiquidSkills/vendor` and used in parallel with custom internal Skills.

### 2. Liquid Wire Protocol (ADR-002)

The Liquid Engine implements a streaming protocol for AI tool calls:

```
┌─────────────────────────────────────────────────────────────┐
│                  Liquid Wire Protocol                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Event Types:                                               │
│                                                             │
│  ┌─────────────┐                                           │
│  │ tool_start  │──▶ { id, name, type: 'tool_start' }       │
│  └─────────────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ tool_delta  │──▶ { id, delta, type: 'tool_delta' }      │
│  └─────────────┘    (repeated for streaming args)          │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │tool_complete│──▶ { id, result, type: 'tool_complete' }  │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### LiquidClient Architecture

```typescript
class LiquidClient {
  // Tool State Management
  private toolStates: Record<string, ToolCallState>
  
  // Context Management
  private readableContexts: Map<string, ReadableContext>
  private strategy: ContextStrategy  // Flat or Tree
  
  // Action Registry
  private actions: Map<string, ActionDefinition>
  
  // Core Methods
  ingest(event: LiquidProtocolEvent)  // Process streaming events
  subscribe(listener: Listener)        // State subscriptions
  
  // Context API
  registerReadable(context)            // Register AI-readable data
  setContextStrategy('flat' | 'tree')  // Switch strategies
  buildContextPrompt()                 // Generate system prompt
  
  // Action API
  registerAction(action)               // Register AI-invokable function
  executeAction(name, args)            // Execute action
  buildFunctionDeclarations()          // Generate Gemini schema
}
```

### Context Strategies

```
┌─────────────────────────────────────────────────────────────┐
│                   Context Strategies                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Flat Strategy (Default)                                    │
│  ───────────────────────                                    │
│  • All contexts serialized equally                          │
│  • Simple, no hierarchy                                     │
│  • Best for: Small context sets                             │
│                                                             │
│  [Context A] [Context B] [Context C] [Context D]            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tree Strategy                                              │
│  ─────────────                                              │
│  • Hierarchical context organization                        │
│  • Focus-aware pruning                                      │
│  • Best for: Large context sets, page-based apps           │
│                                                             │
│           [Root]                                            │
│          /   |   \                                          │
│      [Page1][Page2][Page3]  ← Focus: Page2                 │
│         |      |      |                                     │
│     [Widget][Widget][Widget]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## A2A Protocol Integration

LiquidCrypto implements Google's Agent-to-Agent (A2A) protocol for interoperability with external AI agents and supports A2UI rendering for declarative UI generation.

### A2A Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                      A2A Protocol Architecture                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  External Agents                          LiquidCrypto Server          │
│  ──────────────                          ──────────────────            │
│                                                                        │
│  ┌──────────────┐    JSON-RPC 2.0       ┌──────────────────────┐      │
│  │  Restaurant  │◄───────────────────►  │                      │      │
│  │   Finder     │                       │   A2A Handler        │      │
│  └──────────────┘                       │   /a2a (POST)        │      │
│                                         │   /a2a/stream (SSE)  │      │
│  ┌──────────────┐    A2UI Messages      │                      │      │
│  │  RizzCharts  │◄───────────────────►  │   /.well-known/      │      │
│  │   Analytics  │                       │   agent.json         │      │
│  └──────────────┘                       │                      │      │
│                                         └──────────┬───────────┘      │
│  ┌──────────────┐                                  │                  │
│  │   Custom     │                                  ▼                  │
│  │   Agent      │                       ┌──────────────────────┐      │
│  └──────────────┘                       │   A2UI Transformer   │      │
│                                         │   transformA2UI()    │      │
│                                         └──────────┬───────────┘      │
│                                                    │                  │
│                                                    ▼                  │
│                                         ┌──────────────────────┐      │
│                                         │   Glass Components   │      │
│                                         │   GlassA2UIRenderer  │      │
│                                         └──────────────────────┘      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Protocol Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **A2A Client** | Connect to external A2A agents | `src/a2a/client.ts` |
| **A2A Handler** | Handle incoming A2A requests | `server/src/a2a/handler.ts` |
| **A2UI Transformer** | Convert A2UI to Glass UINode | `src/a2a/transformer.ts` |
| **A2UI Renderer** | React component for rendering | `src/components/agentic/GlassA2UIRenderer.tsx` |
| **Agent Card** | Agent metadata discovery | `server/src/a2a/handler.ts` |

### A2A API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/agent.json` | GET | Agent Card discovery |
| `/a2a` | POST | JSON-RPC 2.0 A2A requests |
| `/a2a/stream` | POST | SSE streaming for A2UI updates |

### A2A JSON-RPC Methods

| Method | Description |
|--------|-------------|
| `agent/card` | Get agent metadata |
| `message/send` | Send message to create task |
| `tasks/get` | Get task by ID |
| `tasks/list` | List tasks for context |
| `tasks/cancel` | Cancel running task |

### A2UI Component Mapping

A2UI components are transformed to Glass UINode types:

| A2UI Component | Glass UINode | Notes |
|----------------|--------------|-------|
| `Text` | `text` | Direct mapping |
| `Button` | `button` | Action binding supported |
| `Row` | `stack` (horizontal) | `direction: 'horizontal'` |
| `Column` | `stack` (vertical) | `direction: 'vertical'` |
| `Card` | `card` | Material support |
| `List` | `list` | Ordered/unordered |
| `TextInput` | `input` | Type: text |
| `NumberInput` | `input` | Type: number |
| `SelectInput` | `select` | Options array |
| `Image` | `image` | URL source |
| `Link` | `link` | External/internal |
| `Badge` | `badge` | Variant mapping |
| `Progress` | `progress` | Value 0-100 |
| `Divider` | `divider` | Horizontal rule |
| `Spacer` | `spacer` | Flexible spacing |

### Data Binding

A2UI supports three binding types for dynamic data:

```typescript
// 1. Literal String - static value
{ literalString: "Hello World" }

// 2. Path Reference - from dataModel
{ path: "$.restaurants[0].name" }

// 3. Template Context - combined
{ template: "Welcome, {{user.name}}!" }
```

### Task Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    A2A Task State Machine                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────┐                                                  │
│  │ submitted │ ──► Initial state when task created              │
│  └─────┬─────┘                                                  │
│        │                                                         │
│        ▼                                                         │
│  ┌───────────┐                                                  │
│  │  working  │ ──► Agent processing, may send A2UI updates      │
│  └─────┬─────┘                                                  │
│        │                                                         │
│   ┌────┴────┐                                                   │
│   ▼         ▼                                                   │
│ ┌─────┐  ┌────────┐                                             │
│ │done │  │ failed │                                             │
│ └─────┘  └────────┘                                             │
│                                                                  │
│  Additional states: input_required, cancelled                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Validation

A2UI payloads are validated before transformation:

```typescript
// Component Catalog with limits
const GLASS_COMPONENT_CATALOG = {
    GlassContainer: { maxChildren: 20, requiresAuth: false },
    GlassCard: { maxChildren: 10, requiresAuth: false },
    GlassButton: { maxChildren: 1, requiresAuth: false },
    // ... 25+ validated component types
};

// Validation limits
const MAX_COMPONENTS = 500;  // Prevent DoS
const MAX_DEPTH = 10;        // Prevent deep nesting
```

### Usage Examples

#### Connecting to External Agent

```typescript
import { A2AClient, createA2AClient } from '@/a2a';

// Create client
const client = createA2AClient('https://agent.example.com', {
    timeout: 30000,
    retries: 3
});

// Send message
const task = await client.sendText('Find restaurants near me');

// Stream response with A2UI updates
for await (const event of client.streamText('Show sales dashboard')) {
    if (event.type === 'message' && event.message.parts) {
        const a2uiParts = client.extractA2UIParts(event);
        // Render A2UI updates
    }
}
```

#### Rendering A2UI in React

```tsx
import { GlassA2UIRenderer } from '@/components/agentic';

function AgentUI({ messages }) {
    return (
        <GlassA2UIRenderer
            messages={messages}
            onAction={(actionId, data) => {
                console.log('User action:', actionId, data);
            }}
            streaming={true}
        />
    );
}
```

#### Using Connected Renderer

```tsx
import { ConnectedA2UIRenderer } from '@/components/agentic';

function ChatWithAgent() {
    return (
        <ConnectedA2UIRenderer
            agentUrl="https://agent.example.com"
            initialPrompt="Show me analytics"
            onAction={(actionId, data) => handleAction(actionId, data)}
        />
    );
}
```

### Directory Structure

```
src/a2a/
├── index.ts              # Module exports
├── types.ts              # A2A & A2UI type definitions
├── client.ts             # A2A protocol client
├── transformer.ts        # A2UI → Glass transformer
└── examples/
    ├── index.ts          # Example exports
    ├── restaurant-finder.ts  # Restaurant booking examples
    └── rizzcharts.ts     # Analytics & crypto examples

server/src/a2a/
├── index.ts              # Server exports
├── types.ts              # Server-side types
└── handler.ts            # JSON-RPC handler

src/components/agentic/
├── GlassA2UIRenderer.tsx        # A2UI rendering component
└── GlassA2UIRenderer.stories.tsx # Storybook stories
```

### References

- [A2A Protocol Specification](https://a2a-protocol.org)
- [A2UI Specification](https://a2ui.org)
- [A2UI v0.8 Changelog](https://a2ui.org/changelog)

---

## Agent Hub UI

The Agent Hub provides a beautiful "App Store" experience for discovering, connecting to, and conversing with A2A-compliant AI agents.

### Agent Hub Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Agent Hub Architecture                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  User Interface (Liquid OS)                                                │
│  ─────────────────────────                                                 │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      AgentHub Page                                   │  │
│  │  /os/agents                                                          │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │  │
│  │  │   AgentProbe    │  │   AgentCard     │  │  AgentChatWindow     │ │  │
│  │  │   URL Discovery │  │   3D Cards      │  │  GlassWindow Chat    │ │  │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────┬───────────┘ │  │
│  │           │                    │                      │              │  │
│  │           └────────────────────┼──────────────────────┘              │  │
│  │                                │                                      │  │
│  └────────────────────────────────┼──────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Agent Registry                                  │   │
│  │  src/services/agents/registry.ts                                     │   │
│  │                                                                       │   │
│  │  • getCuratedAgents()    • getAgentsByCategory()                     │   │
│  │  • getFeaturedAgents()   • searchAgents()                            │   │
│  │  • getCategoryInfo()     • getAgentById()                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      A2A Client                                      │   │
│  │  src/a2a/client.ts                                                   │   │
│  │                                                                       │   │
│  │  • getAgentCard()        • streamText()                              │   │
│  │  • sendText()            • extractA2UIParts()                        │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 External A2A Agents                                  │   │
│  │  /.well-known/agent.json                                             │   │
│  │                                                                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │   │
│  │  │Restaurant│  │  Crypto  │  │RizzCharts│  │   Custom Agents      │ │   │
│  │  │ Finder   │  │ Advisor  │  │Analytics │  │   via URL Probe      │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Agent Hub Components

| Component | File | Purpose |
|-----------|------|---------|
| **AgentHub** | `src/pages/agents/AgentHub.tsx` | Main hub page with search, categories, featured agents |
| **AgentCard** | `src/components/agents/AgentCard.tsx` | 3D perspective card with hover effects |
| **AgentCardCompact** | `src/components/agents/AgentCard.tsx` | Compact variant for list views |
| **AgentProbe** | `src/components/agents/AgentProbe.tsx` | URL-based agent discovery |
| **AgentChatWindow** | `src/components/agents/AgentChatWindow.tsx` | Chat interface using GlassWindow |
| **Registry** | `src/services/agents/registry.ts` | Curated agent data and search functions |

### Agent Categories

| Category | Icon | Color | Description |
|----------|------|-------|-------------|
| Finance | 📈 | `#10B981` | Trading, portfolio, and financial analysis |
| Commerce | 🛒 | `#F59E0B` | Shopping, booking, and transactions |
| Analytics | 📊 | `#6366F1` | Data visualization and insights |
| Security | 🔐 | `#EF4444` | Authentication and protection |
| Creative | 🎨 | `#EC4899` | Design, images, and content creation |
| Productivity | ⚡ | `#8B5CF6` | Tasks, notes, and workflows |
| Developer | 💻 | `#06B6D4` | Code, APIs, and technical tools |
| Communication | 💬 | `#14B8A6` | Chat, email, and messaging |

### Agent Card 3D Effects

The AgentCard uses framer-motion for perspective transforms:

```typescript
// Spring physics configuration
const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };

// Mouse-driven rotation
const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

// Applied to card
<motion.div
    style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
    }}
/>
```

### Agent Discovery Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Discovery Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User enters URL in AgentProbe                                │
│     └──▶ Example: "restaurant-agent.example.com"                │
│                                                                  │
│  2. URL normalization                                            │
│     └──▶ Add https:// if missing                                │
│     └──▶ Remove trailing slashes                                │
│                                                                  │
│  3. Probe agent card endpoint                                    │
│     └──▶ GET https://restaurant-agent.example.com/              │
│          .well-known/agent.json                                 │
│                                                                  │
│  4. Validate response                                            │
│     └──▶ Check required fields (name, url)                      │
│     └──▶ Parse capabilities                                     │
│                                                                  │
│  5. Display discovered agent                                     │
│     └──▶ Show agent card with capabilities                      │
│     └──▶ Enable "Connect" button                                │
│                                                                  │
│  6. Connect to agent                                             │
│     └──▶ Open AgentChatWindow                                   │
│     └──▶ Initialize A2A client                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Chat Window Features

The AgentChatWindow provides:

- **GlassWindow Integration**: Draggable windows with macOS-style traffic lights
- **Connection Status**: Real-time connection indicator
- **Streaming Support**: Progressive response rendering
- **A2UI Rendering**: Rich UI responses using GlassA2UIRenderer
- **Error Handling**: Retry mechanism with error display
- **Focus Management**: Multiple concurrent chat windows

### Two Worlds Integration

| World | Route | Experience |
|-------|-------|------------|
| **Liquid OS** | `/os/agents` | Full spatial exploration, floating windows |
| **Rush Hour** | (Future) | Sidebar panel, compact agent list |

**GlassDock Integration:**
```typescript
// Added to LiquidOSLayout.tsx
{
    id: 'agent-hub',
    icon: Compass,
    label: 'Agent Hub',
    onClick: () => navigate('/os/agents')
}
```

### Directory Structure

```
src/
├── components/agents/
│   ├── index.ts              # Barrel exports
│   ├── AgentCard.tsx         # 3D card with hover effects
│   ├── AgentCard.stories.tsx # Storybook stories
│   ├── AgentProbe.tsx        # URL discovery
│   ├── AgentProbe.stories.tsx
│   ├── AgentChatWindow.tsx   # Chat interface
│   └── AgentHub.stories.tsx
│
├── pages/agents/
│   └── AgentHub.tsx          # Main hub page
│
└── services/agents/
    └── registry.ts           # Agent registry & helpers
```

---

## Data Flow

### User Request Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Request Flow                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. User Input                                                         │
│     └──▶ GlassPrompt component captures input                         │
│                                                                        │
│  2. Request Preparation                                                │
│     └──▶ LiquidClient.buildContextPrompt() adds context               │
│     └──▶ LiquidClient.buildFunctionDeclarations() adds tools          │
│                                                                        │
│  3. API Call                                                           │
│     └──▶ POST /api/v1/chat with messages + provider                   │
│                                                                        │
│  4. Server Processing                                                  │
│     └──▶ Rate limit check                                             │
│     └──▶ Cache lookup (SHA-256 hash of prompt)                        │
│     └──▶ AI provider call (or cache hit)                              │
│     └──▶ Response caching                                             │
│                                                                        │
│  5. Streaming Response                                                 │
│     └──▶ SSE format: `data: {...}\n\n`                                │
│                                                                        │
│  6. Client Processing                                                  │
│     └──▶ LiquidClient.ingest() processes events                       │
│     └──▶ Tool states updated (running → completed)                    │
│     └──▶ Subscribers notified                                         │
│                                                                        │
│  7. UI Update                                                          │
│     └──▶ React re-renders with new state                              │
│     └──▶ GlassAgent/GlassDynamicUI displays results                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Real-time Price Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Real-time Price Updates                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Server (Background)                                                   │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │  setInterval(() => {                                     │          │
│  │    const price = generatePrice()                         │          │
│  │    redis.set(`price:${symbol}`, price)  // Cache         │          │
│  │    broadcast({ type: 'price', symbol, price })          │          │
│  │  }, 5000)                                                │          │
│  └─────────────────────────────────────────────────────────┘          │
│                              │                                         │
│                              ▼ SSE                                     │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │  Client                                                  │          │
│  │  const eventSource = new EventSource('/stream')         │          │
│  │  eventSource.onmessage = (e) => {                       │          │
│  │    const data = JSON.parse(e.data)                      │          │
│  │    if (data.type === 'price') updateChart(data)         │          │
│  │  }                                                       │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Design System

### Token Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Design Token Hierarchy                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Level 1: CSS Custom Properties (tokens.css)                           │
│  ─────────────────────────────────────────────                         │
│  :root {                                                               │
│    --font-size-base: 1rem;                                             │
│    --space-4: 1rem;                                                    │
│    --radius-md: 0.5rem;                                                │
│    --duration-base: 200ms;                                             │
│  }                                                                     │
│                                                                        │
│  Level 2: Tailwind Configuration (tailwind.config.js)                  │
│  ─────────────────────────────────────────────────────                 │
│  fontSize: {                                                           │
│    base: ['var(--font-size-base)', { lineHeight: '...' }]             │
│  }                                                                     │
│  spacing: {                                                            │
│    4: 'var(--space-4)'                                                 │
│  }                                                                     │
│                                                                        │
│  Level 3: Component Classes                                            │
│  ──────────────────────────                                            │
│  <div className="text-base p-4 rounded-md" />                         │
│                                                                        │
│  Level 4: Semantic Component Props                                     │
│  ─────────────────────────────────                                     │
│  <GlassButton size="md" variant="primary" />                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```


### Theme Architecture (3-Mode System)

| Theme | ID | Characteristics | Target |
|-------|----|-----------------|--------|
| **Liquid Evolution** | `marketing-evolution` | 25px Blur / 0.60 Opacity / High Saturation | Marketing & Brand |
| **Classic HIG** | `native-hig` | 10px Blur / 0.40 Opacity / Natural Colors | Native-like Utilities |
| **Liquid Web** | `liquid-web` | 10px Blur / 32px Radius / 180% Saturation | Web Applications & 6K |

### Material System

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Glass Material System                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Material Types (GlassContainer):                                      │
│  ────────────────────────────────                                      │
│                                                                        │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐            │
│  │   surface   │   elevated  │    thick    │    ultra    │            │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤            │
│  │ Backdrop:   │ Backdrop:   │ Backdrop:   │ Backdrop:   │            │
│  │   8px       │   16px      │   32px      │   64px      │            │
│  │ Opacity:    │ Opacity:    │ Opacity:    │ Opacity:    │            │
│  │   0.6       │   0.7       │   0.8       │   0.9       │            │
│  └─────────────┴─────────────┴─────────────┴─────────────┘            │
│                                                                        │
│  Surface Types (SurfaceContainer):                                     │
│  ─────────────────────────────────                                     │
│                                                                        │
│  ┌─────────────┬─────────────┬─────────────┐                          │
│  │   base      │   elevated  │   sunken    │                          │
│  ├─────────────┼─────────────┼─────────────┤                          │
│  │ Solid bg    │ With shadow │ Inset style │                          │
│  │ No blur     │ Lifted      │ Recessed    │                          │
│  └─────────────┴─────────────┴─────────────┘                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Security Layers

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Security Architecture                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 1: Network (CDN/Edge)                                           │
│  ────────────────────────────                                          │
│  • DDoS protection (Vercel Edge)                                       │
│  • TLS termination                                                     │
│  • Geographic distribution                                             │
│                                                                        │
│  Layer 2: Application Server                                           │
│  ───────────────────────────                                           │
│  • Security Headers (securityHeaders())                                │
│    - Strict-Transport-Security                                         │
│    - X-Content-Type-Options: nosniff                                   │
│    - X-Frame-Options: DENY                                             │
│    - X-XSS-Protection: 1; mode=block                                   │
│  • CORS configuration                                                  │
│  • Rate limiting (Redis-backed)                                        │
│                                                                        │
│  Layer 3: API Protection                                               │
│  ───────────────────────                                               │
│  • API key proxying (ADR-004)                                          │
│  • Request validation                                                  │
│  • Input sanitization                                                  │
│                                                                        │
│  Layer 4: Data                                                         │
│  ─────────────                                                         │
│  • Redis authentication                                                │
│  • Environment variable secrets                                        │
│  • No client-side API keys                                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### API Key Security (ADR-004)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     API Key Proxy Architecture                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ❌ NEVER: Client → AI Provider (exposes API key)                     │
│                                                                        │
│   ✅ CORRECT:                                                          │
│                                                                        │
│   Client                Server                 AI Provider             │
│   ──────                ──────                 ───────────             │
│      │                    │                        │                   │
│      │  POST /api/v1/chat │                        │                   │
│      │  (no API key)      │                        │                   │
│      │──────────────────▶│                        │                   │
│      │                    │  POST with API_KEY    │                   │
│      │                    │  from .env             │                   │
│      │                    │──────────────────────▶│                   │
│      │                    │                        │                   │
│      │                    │◀──────────────────────│                   │
│      │◀──────────────────│                        │                   │
│      │                    │                        │                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Agentic Development Lifecycle

LiquidCrypto employs a self-improving development lifecycle using specialized AI agents:

### 1. Ralph Autonomous Loop
A long-running iterative process for feature implementation.
- **PRD Breakdown**: Converts markdown PRDs into atomic `prd.json` stories.
- **Iterative Implementation**: Executes one story at a time with automatic verification.
- **Memory Consolidation**: Updates `progress.txt` with discovered patterns.

### 2. Code Simplifier Agent
A post-feature refinement step to ensure codebase health.
- **Complexity Analysis**: Identifies over-engineered or redundant logic.
- **Refactoring**: Applies DRY principles, guard clauses, and modern TypeScript patterns.
- **Verification**: Ensures zero regressions through automated build and test checks.

### 3. Self-Healing System (Healer)
A closed-loop system for autonomous bug fixing.
- **Capture**: `POST /api/v1/security/audit` accepts client error reports.
- **Queue**: `healing_queue.json` persists critical error tasks.
- **Orchestration**: `scripts/healer.ts` monitors queue and generates PRDs.
- **Execution**: Ralph Loop picks up PRD and applies fix.

### 4. Multi-Agent Swarm Orchestration
A pattern for parallelizing large feature development.
- **Decomposition**: Splitting monolithic PRDs into domain-specific stories (UI, API, Data).
- **Specialization**: Context injection for domain specialists (e.g., providing only UI context to UI agent).
- **Merge Logic**: `scripts/merge_master.ts` handles deterministic merging of parallel branches and regression testing.

---

## Deployment Architecture

### CI/CD Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Push to GitHub                                                        │
│       │                                                                │
│       ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │                    GitHub Actions                            │      │
│  │                                                              │      │
│  │  ┌──────────────┐      ┌──────────────┐                     │      │
│  │  │ lint-and-    │      │    test      │                     │      │
│  │  │ typecheck    │      │  (Vitest)    │                     │      │
│  │  └──────┬───────┘      └──────┬───────┘                     │      │
│  │         │                     │                              │      │
│  │         └──────────┬──────────┘                              │      │
│  │                    ▼                                         │      │
│  │              ┌──────────────┐                                │      │
│  │              │    build     │                                │      │
│  │              │ (Client+Srv) │                                │      │
│  │              └──────┬───────┘                                │      │
│  │                     ▼                                        │      │
│  │              ┌──────────────┐                                │      │
│  │              │   e2e-test   │                                │      │
│  │              │ (Playwright) │                                │      │
│  │              └──────┬───────┘                                │      │
│  │                     │                                        │      │
│  │         ┌───────────┴───────────┐                           │      │
│  │         ▼                       ▼                           │      │
│  │  ┌──────────────┐       ┌──────────────┐                    │      │
│  │  │deploy-preview│       │deploy-prod   │                    │      │
│  │  │ (develop)    │       │ (main)       │                    │      │
│  │  └──────┬───────┘       └──────┬───────┘                    │      │
│  │         │                      │                             │      │
│  └─────────┼──────────────────────┼─────────────────────────────┘      │
│            │                      │                                    │
│            ▼                      ▼                                    │
│     ┌────────────┐         ┌────────────┐         ┌────────────┐      │
│     │  Vercel    │         │  Vercel    │         │  Railway/  │      │
│     │  Preview   │         │ Production │         │  PM2       │      │
│     │  (Client)  │         │  (Client)  │         │  (Server)  │      │
│     └────────────┘         └────────────┘         └────────────┘      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Production Infrastructure

```
┌────────────────────────────────────────────────────────────────────────┐
│                    Production Infrastructure                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                        ┌─────────────┐                                 │
│                        │   DNS       │                                 │
│                        │ (Cloudflare)│                                 │
│                        └──────┬──────┘                                 │
│                               │                                        │
│               ┌───────────────┼───────────────┐                       │
│               ▼               ▼               ▼                       │
│        ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│        │  Vercel    │  │  Vercel    │  │  Railway   │                 │
│        │  Edge      │  │  Serverless│  │  (Backend) │                 │
│        │  (CDN)     │  │  Functions │  │            │                 │
│        └──────┬─────┘  └────────────┘  └──────┬─────┘                 │
│               │                               │                        │
│               │        ┌────────────┐         │                        │
│               │        │   Redis    │         │                        │
│               │        │   Cloud    │◀────────┘                        │
│               │        └────────────┘                                  │
│               │                                                        │
│               ▼                                                        │
│        ┌────────────────────────────────────────────────┐             │
│        │               Browser Client                    │             │
│        │  • React SPA served from CDN                   │             │
│        │  • API calls to Backend                        │             │
│        │  • WebSocket connection for real-time          │             │
│        └────────────────────────────────────────────────┘             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [ADR-001: 3-Layer Architecture](./adr/ADR-001-3-layer-architecture.md)
- [ADR-002: Liquid Wire Protocol](./adr/ADR-002-liquid-wire-protocol.md)
- [ADR-003: Glass Design System](./adr/ADR-003-glass-design-system.md)
- [ADR-004: Server-Side Proxy](./adr/ADR-004-server-side-proxy.md)
- [Design Tokens](./DESIGN_TOKENS.md)
- [Accessibility](./ACCESSIBILITY.md)
- [Performance](./PERFORMANCE.md)
- [Server API](../server/docs/API.md)
- [Improvement Roadmap](./IMPROVEMENT_ROADMAP.md)

---

## January 2026 Improvements Summary

All 15 improvements from the improvement roadmap have been completed, raising project health from 8.2/10 to 9.0/10.

### Completed Improvements

| Category | Item | Status |
|----------|------|--------|
| 🔴 High | TypeScript Strict Mode | ✅ Complete |
| 🔴 High | Lighthouse CI Integration | ✅ Complete |
| 🔴 High | Tailwind CSS v4 Upgrade | ✅ Complete |
| 🔴 High | Request Validation (Zod) | ✅ Complete |
| 🟡 Medium | Visual Regression Testing | ✅ Complete |
| 🟡 Medium | CSP Nonces | ✅ Complete |
| 🟡 Medium | PWA Support | ✅ Complete |
| 🟡 Medium | Error Boundary Expansion | ✅ Complete |
| 🟡 Medium | Bundle Size Monitoring | ✅ Complete |
| 🟢 Low | WebGPU Chart Acceleration | ✅ Prototype |
| 🟢 Low | RSC Evaluation | ✅ Complete |
| 🟢 Low | Container Queries | ✅ Enabled |
| 🟢 Low | AI Prompt Versioning | ✅ Implemented |
| 🟢 Low | Micro-Frontend Evaluation | ✅ Complete |

### New Dependencies

| Package | Purpose |
|---------|---------|
| `@tailwindcss/container-queries` | Container queries support |
| `bundlewatch` | Bundle size monitoring |
| `chromatic` | Visual regression testing |
| `vite-plugin-pwa` | PWA support |
| `zod` | Request validation |

### New Components

- `GlassCandlestickChartWebGPU` - GPU-accelerated candlestick chart (~8KB vs Chart.js 400KB)
- Centralized prompt management with versioning (`src/prompts/versions.ts`)

### Updated CI/CD Pipeline

```yaml
jobs:
  lint-and-typecheck    # ESLint + TypeScript
  test                  # Unit tests (Vitest)
  build                 # Client + Server build
  lighthouse            # Lighthouse CI performance audit
  chromatic             # Visual regression testing
  e2e-test              # Playwright E2E tests
  bundle-size           # Bundle size monitoring
  deploy-preview        # Vercel preview
  deploy-production     # Vercel production
  server-deploy         # SSH + PM2 deploy
```

### Security Enhancements

- CSP nonces for script/style tags
- Client error logging to server
- Enhanced error boundaries with component context

### Performance Monitoring

- Lighthouse CI with performance budgets
- Bundlewatch with size budgets (400KB JS, 100KB CSS)
- WebGPU chart prototype for large datasets

---

## SmartGlass - AI-Enhanced Components (Level 2.5)

SmartGlass represents a new architectural layer that enhances user-provided content with AI intelligence using Gemini 3.5 Flash.

### Architecture Position

```
┌────────────────────────────────────────────────────────────────────────┐
│                    Component Architecture Layers                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 1: GLASS (Static UI)                                            │
│  ───────────────────────────────                                       │
│  • GlassButton, GlassCard, GlassInput                                  │
│  • Props-driven, static UI                                             │
│  • Reusable across any context                                         │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 2: GENERATIVE (AI Output Display)                               │
│  ────────────────────────────────────                                  │
│  • GlassSmartCard (listens for 'generate_card' tool output)           │
│  • GlassSmartWeather, GlassSmartList                                  │
│  • Displays content generated by AI tools                              │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 2.5: SMARTGLASS (AI Enhancement) ← NEW                          │
│  ────────────────────────────────────────                              │
│  • SmartGlassCard - Auto-summarizes, suggests actions                 │
│  • SmartGlassTable - Pattern detection, anomaly highlights            │
│  • SmartGlassChart - Auto-insights, visualization suggestions         │
│  • Enhances user-provided content with AI intelligence                 │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 3: AGENTIC (AI Visualization & Interaction)                     │
│  ──────────────────────────────────────────────────                    │
│  • GlassAgent (state: idle, listening, thinking)                      │
│  • GlassCopilot (AI chat interface)                                    │
│  • GlassPrompt, GlassDynamicUI                                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Differences

| Aspect | Generative | SmartGlass |
|--------|------------|------------|
| **Input Source** | AI tool output | User props + AI enhancement |
| **Intelligence** | "What to display" | "How to enhance display" |
| **Example** | `GlassSmartCard` renders AI-generated card | `SmartGlassCard` summarizes user content |
| **Pattern** | AI → Component | User + AI → Enhanced Component |

### SmartGlass Components

#### SmartGlassCard
AI-enhanced card with auto-summarization and smart suggestions:

```tsx
import { SmartGlassCard } from '@/components';

<SmartGlassCard
  content={{
    title: "Bitcoin Analysis",
    body: "BTC shows strong momentum with volume increasing...",
    tags: ["crypto", "analysis"]
  }}
  options={{
    summarize: true,
    suggestions: true,
    patterns: true
  }}
  onEnhance={(result) => {
    console.log(result.summary);     // AI-generated summary
    console.log(result.suggestions); // Smart action suggestions
    console.log(result.patterns);    // Detected patterns
  }}
/>
```

### SmartGlass Hooks

```typescript
// Generic hook for any content type
const { result, loading, error, enhance } = useSmartGlass(
  content,           // Content to enhance
  contentType,       // 'card', 'table', 'chart', 'text'
  options            // Enhancement options
);

// Specialized hooks
const { result, enhance } = useSmartCard(content, options);
const { result, enhance } = useSmartTable(content, options);
const { result, enhance } = useSmartChart(content, options);
```

### SmartGlass API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/smart/enhance` | POST | Full enhancement (summary + suggestions + patterns) |
| `/api/v1/smart/summarize` | POST | Summary-only endpoint |
| `/api/v1/smart/patterns` | POST | Pattern/anomaly detection |
| `/api/v1/smart/health` | GET | Service health check |

### Backend Services

```
server/src/
├── services/
│   └── smart.ts         # Smart enhancement service (Gemini 3.5 Flash)
└── routes/
    └── smart.ts         # API routes with Zod validation
```

### Enhancement Features

| Feature | Description |
|---------|-------------|
| **Auto-summarization** | Generates concise 1-2 sentence summaries |
| **Smart Suggestions** | Suggests actions with confidence scores |
| **Pattern Detection** | Identifies trends, correlations, clusters |
| **Anomaly Detection** | Highlights unusual data points |
| **Chart Insights** | Generates insights for data visualization |

### Processing Metadata

Each enhancement result includes:

```typescript
{
  meta: {
    enhancedAt: Date,          // Timestamp
    modelUsed: string,         // e.g., 'gemini-3.5-flash'
    tokensUsed: number,        // Token consumption
    processingTime: number,    // milliseconds
    cached?: boolean           // Cache hit status
  }
}
```

---

## Generative Components - AI-Generated UI (Layer 2)

Generative Components enable AI agents to generate complex, production-ready UIs by calling specific tools. These components use `LiquidSmartComponent` to listen for tool outputs and render Glass-styled interfaces.

### Architecture Position

```
┌────────────────────────────────────────────────────────────────────────┐
│                    Component Architecture Layers                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 1: GLASS (Static UI)                                            │
│  ───────────────────────────────                                       │
│  • GlassButton, GlassCard, GlassInput                                  │
│  • Props-driven, static UI                                             │
│  • Reusable across any context                                         │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 2: GENERATIVE (AI Output Display) ← NEW                         │
│  ────────────────────────────────────                                  │
│  • GlassSmartBadge - Status indicators                                 │
│  • GlassSmartTabs - Navigation tabs                                    │
│  • GlassSmartChart - Data visualizations                               │
│  • GlassSmartModal - Dialogs & confirmations                           │
│  • GlassSmartDashboard - Analytics panels                              │
│  • GlassSmartKanban - Task boards                                      │
│  • Listens for tool outputs, renders Glass UI                          │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 2.5: SMARTGLASS (AI Enhancement)                                │
│  ────────────────────────────────────────                              │
│  • SmartGlassCard - Auto-summarizes, suggests actions                 │
│  • SmartGlassTable - Pattern detection, anomaly highlights            │
│  • Enhances user-provided content with AI intelligence                 │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 3: AGENTIC (AI Visualization & Interaction)                     │
│  ──────────────────────────────────────────────────                    │
│  • GlassAgent (state: idle, listening, thinking)                      │
│  • GlassCopilot (AI chat interface)                                    │
│  • GlassPrompt, GlassDynamicUI                                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Generative Components

| Component | Tool Name | Purpose | Variations |
|-----------|-----------|---------|------------|
| `GlassSmartBadge` | `generate_badge` | Status indicators | 5 variants (success, warning, error, info, pending) |
| `GlassSmartTabs` | `generate_tabs` | Navigation | 3 styles (pills, underline, enclosed) + vertical |
| `GlassSmartChart` | `generate_chart` | Data visualization | 4 types (line, bar, area, donut) |
| `GlassSmartModal` | `generate_modal` | Dialogs | 5 sizes (sm/md/lg/xl/full) |
| `GlassSmartDashboard` | `generate_dashboard` | Analytics panels | 3 layouts (grid, bento, masonry) |
| `GlassSmartKanban` | `generate_kanban` | Task boards | Drag-enabled columns |

### Directory Structure

```
src/components/generative/
├── index.ts                          # Component exports
├── GlassSmartBadge.tsx              # Status badges
├── GlassSmartTabs.tsx               # Tab navigation
├── GlassSmartChart.tsx              # Data charts
├── GlassSmartModal.tsx              # Dialog modals
├── GlassSmartDashboard.tsx          # Analytics dashboards
├── GlassSmartKanban.tsx             # Task boards
├── GlassSmartCard.tsx               # Card generation (existing)
├── GlassSmartList.tsx               # List generation (existing)
└── GlassSmartWeather.tsx            # Weather display (existing)
```

### How It Works

```
┌────────────────────────────────────────────────────────────────────────┐
│                    Generative Component Flow                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. AI Agent Decision                                                  │
│     └──▶ Determine UI needed based on user request                    │
│                                                                        │
│  2. Tool Call                                                          │
│     └──▶ Call tool with structured arguments                          │
│     └──▶ Example:                                                     │
│          {                                                            │
│            name: "generate_dashboard",                                │
│            args: {                                                    │
│              title: "Sales Overview",                                 │
│              layout: "bento",                                         │
│              widgets: [                                               │
│                { type: "metric", title: "Revenue", data: {...} },    │
│                { type: "chart", title: "Weekly", data: {...} }       │
│              ]                                                        │
│            }                                                          │
│          }                                                            │
│                                                                        │
│  3. Server Processing                                                  │
│     └──▶ Validate arguments (Zod)                                     │
│     └──▶ Cache enhancement (optional)                                 │
│     └──▶ Call AI for content (optional)                               │
│                                                                        │
│  4. Frontend Rendering                                                 │
│     └──▶ LiquidSmartComponent receives tool output                    │
│     └──▶ Renders appropriate Glass component                          │
│     └──▶ Shows loading skeleton during generation                     │
│     └──▶ Displays final Glass-styled UI                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Usage Example

#### AI Tool Definition

```typescript
const generateDashboardTool = {
    name: 'generate_dashboard',
    description: 'Generate a Glass-styled analytics dashboard',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            layout: { type: 'string', enum: ['grid', 'bento', 'masonry'] },
            columns: { type: 'number' },
            widgets: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['metric', 'chart', 'table', 'list'] },
                        title: { type: 'string' },
                        span: { type: 'number' },
                        data: { type: 'object' }
                    }
                }
            },
            refreshInterval: { type: 'number' }
        }
    }
};
```

#### Frontend Usage

```tsx
import { GlassSmartDashboard } from '@/components';

function App() {
    return (
        <GlassSmartDashboard />
        // Automatically renders when AI calls generate_dashboard tool
    );
}
```

### Component Features

#### GlassSmartDashboard
- Supports grid, bento, and masonry layouts
- Widget types: metric, chart, table, list, progress, status
- Auto-refresh capability
- Card count summary
- Trend indicators

#### GlassSmartKanban
- 4 default columns (To Do, In Progress, Review, Done)
- Card priorities (low, medium, high, urgent)
- Tag support
- Assignee avatars
- Due date display
- Drag indicators

#### GlassSmartChart
- Line, bar, area, donut chart types
- Animated data rendering
- Tooltips on hover
- Legend display
- Summary statistics (avg, max, min)

#### GlassSmartTabs
- Pills, underline, enclosed styles
- Horizontal and vertical orientation
- 3 sizes (sm, md, lg)
- Badge support
- Disabled states

#### GlassSmartModal
- 5 sizes (sm, md, lg, xl, full)
- Configurable actions
- Form support
- Loading overlay
- Backdrop blur

#### GlassSmartBadge
- 5 variants (default, secondary, destructive, outline, glass)
- 2 sizes (sm, md)
- Icon support
- Interactive mode

### Loading States

All Generative Components include built-in loading states:

```tsx
{isLoading ? (
    <div className="animate-pulse space-y-3">
        <div className="h-6 w-32 bg-white/10 rounded" />
        <div className="h-48 bg-white/5 rounded" />
    </div>
) : (
    // Actual content
)}
```

### Event Handling

Components emit events for interactions:

```typescript
<GlassSmartModal
    onAction={(actionId) => {
        // Emit event back to AI agent
        liquidEngine.emit({ type: 'modal_action', action: actionId });
    }}
    onClose={() => {
        liquidEngine.emit({ type: 'modal_close' });
    }}
/>
```
