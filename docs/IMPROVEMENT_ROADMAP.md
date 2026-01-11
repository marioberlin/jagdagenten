# LiquidCrypto Improvement Roadmap v3

> Last Updated: January 2026
> Status: AI-Driven Autonomous Development
> **Implementation Plan:** See [`docs/IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for detailed execution steps

This document outlines the prioritized improvements for LiquidCrypto. **This roadmap is designed for autonomous AI implementation via the Ralph Loop and Code Simplifier Agent.**

---

## Executive Summary

| Phase | Priority | Items | Status | PRD |
|-------|----------|-------|--------|-----|
| **Phase 1** | 🔴 P0-Critical | 4 | 🔲 Pending | [`prd/phase1.json`](./prd/phase1.json) |
| **Phase 2** | 🟠 P1-High | 3 | 🔲 Pending | [`prd/phase2.json`](./prd/phase2.json) |
| **Phase 3** | 🟡 P2-Medium | 4 | 🔲 Pending | [`prd/phase3.json`](./prd/phase3.json) |
| **Phase 4** | 🟢 P3-Low | 4 | 🔲 Pending | [`prd/phase4.json`](./prd/phase4.json) |

**Overall Project Health: 9/10 (Production Ready, Scaling Improvements Needed)**

---

## 🔴 Phase 1: Critical Security & Stability

### 1.1 Session-Scoped LiquidClient
**Status:** 🔲 Pending | **ADR:** [ADR-005](./adr/ADR-005-session-scoped-liquid-client.md)

Isolate LiquidClient state per user session to prevent context leakage in multi-tenant scenarios.

- [ ] Create `clientFactory.ts` with session management
- [ ] Add `useLiquidClient()` React hook
- [ ] Update `AgentConfigContext` to use factory
- [ ] Add session cleanup on timeout

### 1.2 Rate Limit Key Enhancement
**Status:** 🔲 Pending

Implement tiered rate limiting (user > session > IP) for fairness behind NAT/proxies.

- [ ] Add `getRateLimitKey()` function with tier detection
- [ ] Implement tier-specific limits (100/50/30 per 15min)
- [ ] Add `X-RateLimit-Tier` response header

### 1.3 ErrorBoundary Expansion
**Status:** 🔲 Pending

Wrap 25+ complex components with ErrorBoundary to prevent full-page crashes.

- [ ] Wrap all chart components
- [ ] Wrap all feature components (Kanban, Editor, etc.)
- [ ] Wrap agentic components
- [ ] Add componentName to error logs

### 1.4 WebSocket Authentication
**Status:** 🔲 Pending

Add token validation and permission checks to WebSocket connections.

- [ ] Create `auth.ts` module for token verification
- [ ] Validate tokens on WebSocket upgrade
- [ ] Implement permission checks per message type
- [ ] Add connection audit logging

---

## 🟠 Phase 2: Performance & Scalability

### 2.1 Request Coalescing for AI Calls
**Status:** 🔲 Pending

Wire AI calls through `cache.getOrSet()` to prevent stampede on cache miss.

- [ ] Refactor `callAI` to use `cache.getOrSet`
- [ ] Add prompt hashing with `Bun.hash()`
- [ ] Verify coalescing with load test

### 2.2 WebSocket Horizontal Scaling
**Status:** 🔲 Pending | **ADR:** [ADR-006](./adr/ADR-006-distributed-websocket-architecture.md)

Enable WebSocket broadcasting across multiple server instances using Redis pub/sub.

- [ ] Create `DistributedWebSocketManager`
- [ ] Implement Redis pub/sub for cross-instance messages
- [ ] Store subscriptions in Redis Sets
- [ ] Add graceful degradation without Redis

### 2.3 Theme Hydration Race Fix
**Status:** 🔲 Pending

Eliminate flash of wrong theme on page load.

- [ ] Create `syncHydrate.ts` utility
- [ ] Apply CSS variables before React mount
- [ ] Handle corrupt localStorage gracefully

---

## 🟡 Phase 3: Developer Experience & Observability

### 3.1 Structured Logging (Pino)
**Status:** 🔲 Pending | **ADR:** [ADR-007](./adr/ADR-007-observability-stack.md)

Replace console.log with structured JSON logging.

- [ ] Add Pino logger with request context
- [ ] Replace all console.log/error calls
- [ ] Add request ID correlation
- [ ] Enable pino-pretty in development

### 3.2 OpenTelemetry Integration
**Status:** 🔲 Pending | **ADR:** [ADR-007](./adr/ADR-007-observability-stack.md)

Add distributed tracing and metrics export.

- [ ] Initialize OpenTelemetry SDK
- [ ] Add spans for AI calls, cache, WebSocket
- [ ] Export metrics (latency, cache hit rate)
- [ ] Configure OTLP exporter

### 3.3 GraphQL Schema Completion
**Status:** 🔲 Pending

Expand GraphQL with full schema, mutations, and subscriptions.

- [ ] Define complete type schema
- [ ] Implement portfolio and market queries
- [ ] Add trade mutations with auth
- [ ] Implement price subscriptions via SSE

### 3.4 Directive Version Checksums
**Status:** 🔲 Pending

Add SHA-256 checksums to directives for script verification.

- [ ] Create `verify_directives.ts` script
- [ ] Add frontmatter with dependencies to directives
- [ ] Add CI verification step
- [ ] Create hash update script

---

## 🟢 Phase 4: Advanced Features

### 4.1 Plugin Sandbox Execution
**Status:** 🔲 Pending

Run plugin commands in isolated subprocess with minimal capabilities.

- [ ] Create `sandbox.ts` execution module
- [ ] Filter environment variables
- [ ] Enforce timeout and memory limits
- [ ] Add plugin manifest permissions

### 4.2 Self-Healing Production Loop
**Status:** 🔲 Pending

Automatically analyze client errors and generate fix PRDs.

- [ ] Create error analyzer with AI
- [ ] Implement healing job queue
- [ ] Integrate with Ralph loop
- [ ] Add PR creation and notification

### 4.3 Multi-Agent Orchestration
**Status:** 🔲 Pending

Enable parallel development with specialist agents.

- [ ] Create orchestrator decomposition logic
- [ ] Define specialist agents (UI, API, Security, Test)
- [ ] Implement merge conflict resolution
- [ ] Add progress synchronization

### 4.4 Federated Plugin Registry
**Status:** 🔲 Pending

Create public registry for sharing LiquidSkills plugins.

- [ ] Design registry API
- [ ] Implement CLI commands (publish, install)
- [ ] Add signature verification
- [ ] Create security scanning

---

## 🤖 Agentic Resources

| Role | Provider | Primary Tool |
|------|----------|--------------|
| **Principal Orchestrator** | Claude Opus 4.5 / Gemini 2.0 | `directives/orchestrator.md` |
| **Atomic Developer** | Gemini 2.0 Flash / Claude Sonnet | `scripts/ralph_runner.ts` |
| **Optimization Engine** | Claude Sonnet 4 | `directives/code_simplifier.md` |
| **Verification Engine** | Vitest / Playwright / Bun | `bun test` |

---

## Documentation Structure

| Document | Purpose |
|----------|---------|
| [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) | Detailed execution steps for all phases |
| [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md) | Test requirements per phase |
| [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) | Breaking changes and migration paths |
| [`prd/phase1.json`](./prd/phase1.json) | PRD for Phase 1 (Ralph-compatible) |
| [`prd/phase2.json`](./prd/phase2.json) | PRD for Phase 2 (Ralph-compatible) |
| [`prd/phase3.json`](./prd/phase3.json) | PRD for Phase 3 (Ralph-compatible) |
| [`prd/phase4.json`](./prd/phase4.json) | PRD for Phase 4 (Ralph-compatible) |

---

## Success Metrics (2026 Targets)

### Performance
| Metric | Current | Target | Phase |
|--------|---------|--------|-------|
| Lighthouse Performance | 98 | 98+ | ✅ |
| First Contentful Paint | 0.8s | <1.0s | ✅ |
| Bundle Size (JS) | <500KB | <500KB | ✅ |
| Cold Start (Server) | ~100ms | <100ms | ✅ |
| Cache Hit Rate | 78% | 85%+ | Phase 2 |

### Security
| Metric | Current | Target | Phase |
|--------|---------|--------|-------|
| Session Isolation | ❌ None | ✅ Complete | Phase 1 |
| WebSocket Auth | ❌ None | ✅ Token-based | Phase 1 |
| Rate Limit Tiers | ❌ IP only | ✅ User/Session/IP | Phase 1 |
| Plugin Sandboxing | ❌ None | ✅ Isolated | Phase 4 |

### Quality
| Metric | Current | Target | Phase |
|--------|---------|--------|-------|
| Type Coverage | 100% | 100% | ✅ |
| Error Boundaries | 2 components | 25+ components | Phase 1 |
| Structured Logging | ❌ None | ✅ Pino JSON | Phase 3 |
| Distributed Tracing | ❌ None | ✅ OpenTelemetry | Phase 3 |

### Agentic
| Metric | Current | Target | Phase |
|--------|---------|--------|-------|
| Self-Healing | ❌ Manual | ✅ Automated | Phase 4 |
| Multi-Agent | ❌ Single | ✅ Parallel | Phase 4 |
| Plugin Registry | ❌ Local | ✅ Federated | Phase 4 |

---

## Execution Commands

```bash
# Run Phase 1 via Ralph Loop
bun run scripts/ralph_runner.ts --prd docs/prd/phase1.json

# Verify implementation
bun test
bun run test:e2e

# Run Code Simplifier after each phase
bun run scripts/code_simplifier.ts

# Update directive checksums
bun run scripts/update_directive_hashes.ts
```

---

## Conclusion

The LiquidCrypto project has moved beyond traditional human-led development. The roadmap is now structured in **4 phases with Ralph-compatible PRDs**, comprehensive testing strategies, and migration guides.

**Implementation Order:**
1. ✅ Review `IMPLEMENTATION_PLAN.md` for detailed steps
2. ✅ Execute Phase 1 (Critical Security) first
3. ✅ Run Code Simplifier after each phase
4. ✅ Update this roadmap as items complete

All work should be initiated via the `run_ralph` workflow with the appropriate phase PRD.
