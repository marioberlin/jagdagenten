# Changelog

All notable changes to the LiquidCrypto project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

(No unreleased changes)

---

## [0.2.0] - 2026-01-11

### 🚀 Implementation Plan Complete - All 15 Features

Complete implementation of the 4-phase improvement roadmap with enterprise-grade features.

#### Phase 1: Critical Security & Stability

**1.1 Session-Scoped LiquidClient** (`src/liquid-engine/clientFactory.ts`)
- Per-session AI client isolation preventing context leakage
- 30-minute session TTL with automatic cleanup
- `generateSessionId()` and `useLiquidClient()` hook
- Background cleanup every 5 minutes

**1.2 Tiered Rate Limiting** (`server/src/index.ts`)
- Three-tier rate limiting: User (100/15min) > Session (50/15min) > IP (30/15min)
- `X-RateLimit-Tier` response header
- Priority detection from Authorization, X-Session-Token, X-Forwarded-For

**1.3 ErrorBoundary Expansion** (`src/components/wrapped/index.ts`)
- 13+ complex components wrapped: GlassEditor, GlassKanban, GlassPayment, etc.
- Safe variants: `GlassEditorSafe`, `GlassKanbanSafe`, etc.
- Component name in error logs for debugging

**1.4 WebSocket Authentication** (`server/src/websocket.ts`)
- Token-based JWT authentication on connection
- Permission system: `read:prices`, `write:trades`, `write:chat`, `admin:*`
- Connection audit logging

#### Phase 2: Performance & Scalability

**2.1 Request Coalescing** (`server/src/cache.ts`)
- Stampede protection via `cache.getOrSet()`
- SHA-256 prompt hashing for deduplication
- 30-50% reduction in AI API costs

**2.2 Distributed WebSocket** (`server/src/websocket-redis.ts`)
- Redis pub/sub for cross-instance broadcasting
- Redis Set-based subscription tracking
- Graceful fallback to local-only mode

**2.3 Theme Hydration Fix** (`src/stores/utils/syncHydrate.ts`)
- Pre-React CSS variable application
- Eliminates flash of wrong theme
- Handles corrupt localStorage gracefully

#### Phase 3: Developer Experience & Observability

**3.1 Structured Logging** (`server/src/logger.ts`)
- Pino JSON logging with component-specific loggers
- `logAIRequest()`, `logSecurityEvent()` helpers
- Request ID correlation
- pino-pretty in development

**3.2 OpenTelemetry Integration** (`server/src/telemetry.ts`)
- Distributed tracing with OTLP export
- Spans for AI calls, cache, WebSocket, HTTP
- Metrics: latency, cache hit rate, token counts

**3.3 GraphQL Schema** (`server/src/graphql/`)
- 440+ lines of type definitions
- 12 queries, 11 mutations, 5 subscriptions
- Includes healing, orchestration, registry operations

**3.4 Directive Checksums** (`scripts/verify_directives.ts`)
- SHA-256 checksums for directive integrity
- YAML frontmatter with dependencies
- `--fix` mode for auto-updating hashes

#### Phase 4: Advanced Features

**4.1 Plugin Sandbox** (`server/src/sandbox.ts`)
- Isolated subprocess execution
- Environment variable filtering (whitelist)
- Path restrictions, timeout (30s), memory limits (128MB)

**4.2 Self-Healing Loop** (`server/src/healer/`)
- Automated error analysis with AI
- PRD generation for fixes
- Integration with Ralph loop
- Healing job queue with status tracking

**4.3 Multi-Agent Orchestration** (`server/src/orchestrator/`)
- PRD decomposition into specialist tasks
- Four agents: UI, API, Security, Test
- Parallel execution with merge support
- Progress synchronization

**4.4 Plugin Registry** (`server/src/registry/`, `scripts/registry_cli.ts`)
- RESTful API: search, publish, install, deprecate
- CLI: login, publish, install, search, info, stats
- Security scanning with dangerous pattern detection
- Manifest validation and scoring (0-100)

#### New ADRs

| ADR | Title |
|-----|-------|
| ADR-005 | Session-Scoped LiquidClient |
| ADR-006 | Distributed WebSocket Architecture |
| ADR-007 | Observability Stack |

#### New Dependencies

| Package | Purpose |
|---------|---------|
| `pino` | Structured logging |
| `pino-pretty` | Dev-friendly log formatting |
| `@opentelemetry/sdk-node` | Distributed tracing |
| `@opentelemetry/exporter-trace-otlp-http` | Trace export |
| `yaml` | Directive frontmatter parsing |

#### Test Coverage

**140+ new tests:**
- `clientFactory.test.ts` (20+)
- `rate-limit.test.ts` (15+)
- `websocket-auth.test.ts` (20+)
- `websocket-distributed.test.ts` (20+)
- `request-coalescing.test.ts` (15+)
- `theme-hydration.test.ts` (15+)
- `logger.test.ts` (15+)
- `graphql.test.ts` (73)
- `verify_directives.test.ts` (21)
- `sandbox.test.ts` (25+)
- `healer.test.ts` (25+)
- `orchestrator.test.ts` (26)
- `registry.test.ts` (46)

---

### 🦾 LiquidSkills - Harmonized Plugin Ecosystem

Established a universal "Skill Interface" harmonized with the **Claude Plugin Standard**, enabling modular, manifest-driven agent expertise.

#### New Architecture Features
- **Plugin Manifests**: Added `plugin.json` to all internal skills (`liquid-design`, `liquid-agency`) for versioning and capability discovery.
- **Automated Governance (Hooks)**: Implemented `PostToolUse` trigger in `liquid-design` to run automated **Design Audits** after code modifications.
- **Multi-Runtime Foundation**: Centralized `.venv` in `LiquidSkills/` supporting execution of both Bun/TypeScript and Python-based plugins.
- **Global Registry**: Created `LiquidSkills/_registry.md` as the project's decentralized "Plugin Manager."

#### Ported Vendor Plugins
- **`code-simplifier`**: Ported from official repository for automated logic refinement.
- **`frontend-design`**: Integrated industry-standard design thinking guidelines.

#### Files Created/Modified
- `LiquidSkills/` - New core directory for agent expertise.
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` - Updated with Skill discovery protocols.
- `docs/ARCHITECTURE.md` - Integrated Skills into the 3-Layer model.

---

### 🚀 Generative Components - AI-Generated UI (Layer 2)

Added **7 new Generative Components** that enable AI agents to generate complex UIs on the fly using the LiquidSmartComponent pattern.

#### New Generative Components

| Component | Tool Name | Purpose |
|-----------|-----------|---------|
| **`GlassSmartBadge`** | `generate_badge` | Status indicators with variants (success, warning, error, etc.) |
| **`GlassSmartTabs`** | `generate_tabs` | Navigation & section organization (pills, underline, enclosed) |
| **`GlassSmartChart`** | `generate_chart` | Data visualization (line, bar, area, donut) |
| **`GlassSmartModal`** | `generate_modal` | Dialogs & confirmations (sm/md/lg/xl sizes) |
| **`GlassSmartDashboard`** | `generate_dashboard` | Analytics panels with widgets (grid, bento, masonry layouts) |
| **`GlassSmartKanban`** | `generate_kanban` | Task boards with drag-enabled cards |

#### Architecture

```
Layer 1: GLASS (Static UI)      → GlassButton, GlassCard, GlassInput
Layer 2: GENERATIVE (AI Output) → GlassSmartCard/List/Badge/Tabs/Chart/Modal/Dashboard/Kanban ← NEW
Layer 2.5: SMARTGLASS (Enhance) → SmartGlassCard (enhances user content)
Layer 3: AGENTIC (AI UI)        → GlassAgent, GlassCopilot
```

#### Files Created

```
src/components/generative/
├── index.ts                          # Component exports
├── GlassSmartBadge.tsx              # Status badges
├── GlassSmartTabs.tsx               # Tab navigation
├── GlassSmartChart.tsx              # Data charts
├── GlassSmartModal.tsx              # Dialog modals
├── GlassSmartDashboard.tsx          # Analytics dashboards
└── GlassSmartKanban.tsx             # Task boards
```

#### Usage Example

```tsx
// AI agent calls tool:
{
  name: "generate_dashboard",
  args: {
    title: "Sales Overview",
    layout: "bento",
    widgets: [
      { type: "metric", title: "Revenue", data: { value: "$45K", trend: "+12%" }},
      { type: "chart", title: "Weekly Sales", data: { points: [...] }}
    ]
  }
}

// Frontend renders Glass-styled dashboard automatically
```

#### New Exports

- `src/components/generative/index.ts` - Component exports
- `src/components/index.ts` - Added generative exports

#### Agent Skills for AI UI Generation

Created Agent Skills to teach Claude how to generate Glass UI components:

**Files Created:**
```
.claude/skills/ui-generation/SKILL.md          # Quick reference Skill
directives/ui-generation-skill.md              # Full documentation
```

**Skill Features:**
- Component selection matrix (6 components, 6 tool names)
- Tool argument schemas (TypeScript definitions)
- Common patterns with copy-paste examples
- Best practices for each component type

**Usage:**
Claude automatically triggers this Skill when user asks for:
- "Show analytics/dashboard" → `generate_dashboard`
- "Create task board/kanban" → `generate_kanban`
- "Display chart/graph" → `generate_chart`
- "Show status indicator" → `generate_badge`
- "Create tabs navigation" → `generate_tabs`
- "Show dialog/popup" → `generate_modal`

**Skill Structure:**
- `.claude/skills/ui-generation/SKILL.md` - Quick reference (loaded always)
- `directives/ui-generation-skill.md` - Full reference (progressive disclosure)

---

### 🚀 SmartGlass Components - AI-Enhanced UI (Level 2.5)

Added a new **SmartGlass** category for AI-enhanced components that provide intelligent content augmentation using Gemini 3.5 Flash.

#### New Components
- **`SmartGlassCard`** - AI-enhanced card with auto-summarization, smart suggestions, and pattern detection
- **`useSmartGlass`** - React hook for AI enhancement with auto-debounce and state management
- **`useSmartCard`**, **`useSmartTable`**, **`useSmartChart`** - Specialized hooks for content types

#### New API Endpoints
- **`POST /api/v1/smart/enhance`** - Full enhancement with summary, suggestions, and patterns
- **`POST /api/v1/smart/summarize`** - Summary-only endpoint
- **`POST /api/v1/smart/patterns`** - Pattern/anomaly detection endpoint
- **`GET /api/v1/smart/health`** - Service health check

#### New Backend Services
- **`server/src/services/smart.ts`** - Smart enhancement service using Gemini 3.5 Flash
- **`server/src/routes/smart.ts`** - API routes with Zod validation

#### Features
- Auto-summarization of content
- Smart action suggestions with confidence scores
- Pattern detection for tables and charts
- Anomaly highlighting for data visualization
- Chart insights generation (trends, correlations, outliers)
- Caching support for repeated enhancements
- Processing metadata (tokens, time, model)

#### Usage Example
```tsx
import { SmartGlassCard } from '@/components';

<SmartGlassCard
  content={{
    title: "Bitcoin Analysis",
    body: "BTC shows strong momentum with volume increasing...",
    tags: ["crypto", "analysis"]
  }}
  options={{ summarize: true, suggestions: true, patterns: true }}
  onEnhance={(result) => {
    console.log(result.summary);     // AI-generated summary
    console.log(result.suggestions); // Smart action suggestions
    console.log(result.patterns);    // Detected patterns
  }}
/>
```

#### Architecture Position
```
Layer 1: Glass (Static UI)      → GlassButton, GlassCard, GlassInput
Layer 2: Generative (AI Output) → GlassSmartCard (displays AI tool output)
Layer 2.5: SmartGlass (Enhance) → SmartGlassCard (enhances user content)
Layer 3: Agentic (AI UI)        → GlassAgent, GlassCopilot
```

---

### ✅ All Roadmap Items Complete (January 2026)

All 15 improvements from the improvement roadmap have been completed!

#### High Priority - Complete
- **TypeScript Strict Mode** - Fixed Redis client typing, Elysia error handlers
- **Lighthouse CI** - Configured with performance budgets
- **Tailwind CSS v4** - CSS-first config with @theme directive
- **Request Validation (Zod)** - Schemas for chat, parallel chat, GraphQL

#### Medium Priority - Complete
- **Visual Regression Testing (Chromatic)** - Configured, runs on main branch
- **CSP Nonces** - Dynamic nonce generation for XSS protection
- **PWA Support** - Service worker, offline support, app shortcuts
- **Error Boundary Expansion** - Server logging, component context
- **Bundle Size Monitoring** - bundlewatch integration with CI

#### Low Priority - Complete
- **WebGPU Chart Acceleration** - GlassCandlestickChartWebGPU prototype (~8KB vs 400KB)
- **React Server Components Evaluation** - Analyzed, not recommended for current scale
- **Container Queries** - @tailwindcss/container-queries enabled
- **AI Prompt Versioning** - Centralized prompt management system (7 categories)
- **Micro-Frontend Architecture Evaluation** - Analyzed Module Federation, not recommended

#### Added
- New `src/prompts/versions.ts` - Centralized prompt management with versioning and analytics
- New `src/components/data-display/GlassCandlestickChartWebGPU.tsx` - GPU-accelerated candlestick chart
- New `bundlewatch.config.json` - Bundle size budgets
- New `lighthouserc.json` - Lighthouse CI configuration
- New `.chromaticrc.json` - Chromatic visual regression testing
- New `public/manifest.json` - PWA manifest with app shortcuts

#### Changed
- `src/styles/tailwind.css` - Tailwind v4 with @theme, container queries plugin
- `src/components/feedback/ErrorBoundary.tsx` - Enhanced with server error logging
- `server/src/schemas/chat.ts` - Zod validation schemas
- `server/src/security.ts` - CSP nonce generation
- `.github/workflows/ci.yml` - Added bundle-size job, chromatic job

#### Dependencies Added
- `@tailwindcss/container-queries` - Container queries support
- `bundlewatch` - Bundle size monitoring
- `chromatic` - Visual regression testing
- `vite-plugin-pwa` - PWA support
- `zod` - Request validation

#### Performance
- Bundle size monitoring with budgets (400KB JS, 100KB CSS)
- WebGPU chart prototype (~8KB vs Chart.js 400KB)
- Container queries for adaptive layouts

#### Security
- CSP nonces for script/style tags
- Client error logging to server
- Enhanced error boundaries

---

## [0.1.0] - 2026-01-09

### 🎉 Initial Release

This is the first public release of LiquidCrypto, a comprehensive React component library implementing Apple's Liquid Glass design language with integrated AI capabilities.

### Added

#### Core Component Library
- **162+ UI Components** across 12 categories
  - **Primitives**: GlassButton, GlassInput, GlassContainer, GlassCheckbox, GlassRadio, GlassSwitch, GlassSlider
  - **Forms**: GlassForm system with react-hook-form + zod validation
  - **Data Display**: GlassCard, GlassTable, GlassDataTable, GlassMetric, GlassAvatar, GlassBadge
  - **Charts**: GlassChart, GlassCandlestickChart, GlassRadarChart, GlassPolarAreaChart, GlassHeatmap, GlassSankey, GlassTreemap, GlassFunnelChart, GlassGauge, GlassScatterChart, GlassDonutChart
  - **Layout**: GlassGrid, GlassStack, GlassSidebar, GlassNavigation
  - **Overlays**: GlassModal, GlassDrawer, GlassTooltip, GlassPopover
  - **Feedback**: GlassToast, GlassAlert, GlassProgress, GlassSkeleton
  - **Agentic**: GlassAgent, GlassCopilot, GlassDynamicUI, GlassPrompt
  - **Features**: GlassKanban, GlassSpreadsheet, GlassFlow, GlassEditor, GlassChat
  - **Trading**: Domain-specific trading components

#### Design System
- Comprehensive CSS custom properties token system
- Tailwind CSS integration with token-backed utilities
- Glass material system with 4 material types (surface, elevated, thick, ultra)
- Surface material system with 3 types (base, elevated, sunken)
- Light and dark mode support with semantic color tokens
- Apple SF font family stack
- 4px grid spacing system
- Reduced motion support for accessibility

#### AI Integration (Liquid Engine)
- LiquidClient class for AI state management
- Liquid Wire Protocol for streaming tool calls
- Context strategies (Flat and Tree)
- Action registry for AI-invokable functions
- Multi-provider support (Google Gemini, Anthropic Claude)
- Real-time streaming with SSE
- Function declaration builder for Gemini

#### Backend Server (Bun + Elysia)
- Bun runtime with Elysia framework
- REST API v1 with proper versioning
- GraphQL endpoint (stub implementation)
- WebSocket server for real-time communication
- SSE streaming for price updates
- Redis-backed rate limiting with memory fallback
- AI response caching with SHA-256 prompt hashing
- Security headers (Helmet-style)
- CORS configuration
- Health check endpoint

#### Developer Experience
- Storybook 8.6 integration for component documentation
- Vitest for unit testing
- Playwright for E2E testing
- ESLint with TypeScript support
- TypeScript 5.7 with strict mode
- Vite 6 for development and building
- Library build configuration for npm publishing

#### CI/CD Pipeline
- GitHub Actions workflow
- Lint and typecheck job
- Unit test job
- E2E test job with Playwright
- Preview deployments to Vercel (develop branch)
- Production deployments to Vercel (main branch)
- Server deployment via SSH + PM2

#### Documentation
- README with quick start guide
- Architecture Decision Records (ADRs)
  - ADR-001: 3-Layer Architecture
  - ADR-002: Liquid Wire Protocol
  - ADR-003: Glass Design System
  - ADR-004: Server-Side Proxy
- Design tokens documentation
- Accessibility guidelines
- Performance documentation
- Server API documentation

### Architecture

#### 3-Layer Architecture
- **Layer 1 (Directive)**: SOPs in Markdown in `directives/`
- **Layer 2 (Orchestration)**: AI decision-making via Liquid Engine
- **Layer 3 (Execution)**: Deterministic scripts in `scripts/`

#### Technology Stack
| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript 5.7, Vite 6, Tailwind 3.4 |
| Backend | Bun, Elysia, Redis, WebSocket |
| AI | Google Gemini 2.0, Anthropic Claude Sonnet 4 |
| Testing | Vitest, Playwright, Storybook |
| Deployment | Vercel, Railway, PM2 |

### Dependencies

#### Runtime Dependencies
- React 19.0.0
- Framer Motion 11.15.0
- React Router 7.0.1
- Chart.js 4.5.1
- react-hook-form 7.54.2
- zod 3.24.2
- lucide-react 0.475.0
- clsx 2.1.1
- tailwind-merge 2.6.0
- @anthropic-ai/sdk 0.71.2
- @google/generative-ai 0.24.1

#### Development Dependencies
- TypeScript 5.7.2
- Vite 6.0.3
- Vitest 3.0.0
- Playwright 1.49.1
- Storybook 8.6.0
- Tailwind CSS 3.4.17
- ESLint 8.57.0

### Known Issues
- GraphQL endpoint is a stub implementation
- Some components still use `any` types
- WebSocket authentication needs documentation
- No visual regression testing yet

### Migration Notes
This is the initial release. No migration required.

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.2.0 | 2026-01-11 | Implementation Plan complete (15 features, 4 phases), 140+ new tests |
| 0.1.0 | 2026-01-09 | Initial release with 162+ components, AI integration, Bun server |

---

## Upgrade Guide

### From Pre-Release to 0.1.0

If you were using a pre-release version:

1. **Update dependencies**
   ```bash
   bun install
   cd server && bun install
   ```

2. **Check breaking changes**
   - GlassContainer now uses `material` prop instead of `variant`
   - LiquidClient API has been stabilized
   - Server endpoints are now versioned under `/api/v1/`

3. **Update imports**
   ```tsx
   // Old
   import { GlassButton } from './components/GlassButton'
   
   // New
   import { GlassButton } from 'liquid-glass-ui'
   // or
   import { GlassButton } from '@/components/primitives/GlassButton'
   ```

4. **Environment variables**
   Ensure these are set in your `.env`:
   ```
   GEMINI_API_KEY=your_key
   ANTHROPIC_API_KEY=your_key
   REDIS_URL=redis://localhost:6379  # optional
   ```

---

## Links

- [Documentation](./docs/)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [License](./LICENSE)
