---
title: LiquidCrypto Documentation
status: current
updated: 2026-01-20
---

# LiquidCrypto Documentation

> **Progressive disclosure**: Start with Overview, dive deeper into Guides and Reference as needed.

## Quick Start

| Guide | Description |
|-------|-------------|
| [Getting Started](guides/getting-started.md) | Local development setup |
| [Architecture](overview/architecture.md) | System design principles |
| [Unified Architecture](UNIFIED_ARCHITECTURE.md) | LiquidOS spatial desktop paradigm |
| [Design Tokens](design/tokens.md) | CSS variables reference |

---

## Overview

High-level conceptual understanding of the system.

| Document | Description |
|----------|-------------|
| [Architecture](overview/architecture.md) | System layers and data flow |
| [Technology Stack](overview/technology-stack.md) | Framework choices and rationale |
| [Roadmap](overview/roadmap.md) | Improvement roadmap |

---

## Design (Human Interface Guidelines)

Liquid Glass design system principles and implementation.

| Document | Description |
|----------|-------------|
| [HIG Principles](design/hig-principles.md) | Apple-inspired design principles |
| [Materials](design/materials.md) | Glass material system |
| [Design Tokens](design/tokens.md) | CSS variables and tokens |
| [Accessibility](design/accessibility.md) | A11y guidelines |
| [UX Patterns](design/ux-patterns.md) | Interaction patterns and audit |
| [Decision Tree](design/decision-tree.md) | Material selection guide |

---

## Skills & Plugins

Agent skill system for AI-assisted development.

| Document | Description |
|----------|-------------|
| [Liquid Design](skills/liquid-design.md) | Design system skill |
| [Registry](../LiquidSkills/_registry.md) | All available skills |

---

## Guides

Practical how-to documentation.

| Document | Description |
|----------|-------------|
| [Getting Started](guides/getting-started.md) | Local development setup |
| [Testing](guides/testing.md) | Test strategy and commands |
| [Deployment](guides/deployment.md) | Container and Netlify deployment |
| [Migration](guides/migration.md) | Version upgrade guide |
| [Performance](guides/PERFORMANCE.md) | Performance optimization |

---

## LiquidMind (AI Resource Management)

Unified persistent intelligence layer for all apps and agents.

| Document | Description |
|----------|-------------|
| [LiquidMind](infrastructure/liquidmind.md) | Architecture, API, database schema, usage guide |

**Resource Types:** Prompts, Memory, Context, Knowledge, Artifacts, Skills, MCP Servers
**Key Features:** Versioning, sharing, memory decay, consolidation, hybrid context compilation, markdown sync

---

## Infrastructure

Backend systems, deployment, and autonomous development.

| Document | Description |
|----------|-------------|
| [**Deployment Guide**](infrastructure/DEPLOYMENT.md) | **Production deployment, CI/CD, server migration** |
| [Messaging Gateway](infrastructure/messaging-gateway.md) | Multi-platform messaging (Telegram, Slack, Discord, etc.) |
| [Skill Marketplace](infrastructure/marketplace.md) | Discover, publish, share AI skills |
| [Canvas](infrastructure/canvas.md) | Rich visual output for AI agents |
| [Soul.md System](infrastructure/soul.md) | Personality definitions for apps/agents |
| [Healer](infrastructure/healer.md) | Self-healing error system |
| [Orchestrator](infrastructure/orchestrator.md) | Multi-agent coordination |
| [Containers](infrastructure/containers.md) | Runtime container architecture |
| [LiquidMind](infrastructure/liquidmind.md) | AI resource management system |
| [NATS](infrastructure/nats.md) | A2A messaging and work queues |
| [UCP Discovery](infrastructure/ucp-discovery.md) | UCP merchant discovery and registry |
| [System Docs](infrastructure/SYSTEM_DOCUMENTATION.md) | Full system documentation |

---

## Sparkles Mail

Email client integrated into LiquidOS with Gmail and Calendar support.

| Document | Description |
|----------|-------------|
| [Implementation Status](sparkles-implementation-status.md) | ✅ All P0-P3 Complete |
| [Implementation Plan](sparkles-implementation-plan.md) | Comprehensive dev guide |
| [UX Concept](plans/sparkles-ux-concept.md) | Design philosophy |
| [Email Client Plan](plans/sparkles-email-client.md) | Original feature spec |

---

## App Store (LiquidOS)

Manifest-driven app lifecycle system with marketplace UI.

| Document | Description |
|----------|-------------|
| [App Store Overview](app-store/README.md) | Architecture, manifest schema, lifecycle, permissions |
| [Remote App Provider Guide](app-store/REMOTE_APP_PROVIDER_GUIDE.md) | Requirements for third-party app publishers |
| [API Reference](app-store/README.md#api-reference) | REST endpoints for app registry |
| [Bundle Storage](app-store/README.md#bundle-storage) | App bundle storage and integrity verification |
| [Permission System](app-store/README.md#permission-system) | Capability-based security model |
| [Testing](app-store/README.md#testing) | 49 unit tests for store + permissions |

---

## Trading

Crypto trading bot and dashboard.

| Document | Description |
|----------|-------------|
| [Overview](trading/overview.md) | Trading strategy and bot |

---

## Reference

Deep technical specifications.

| Document | Description |
|----------|-------------|
| [A2A Protocol](reference/api/a2a-spec.md) | Agent-to-Agent protocol spec |
| [Liquid Glass API](reference/api/liquid-glass-api.md) | Component API reference |
| [iCloud Integration](reference/icloud-integration.md) | iCloud GlassApp documentation |
| [ADRs](reference/adr/) | Architecture Decision Records |
| [PRDs](reference/prd/) | Product Requirements Documents |

---

## Directives

Agent SOPs for automated workflows.

| Directive | Description |
|-----------|-------------|
| [Add Glass Component](../directives/add_glass_component.md) | New component workflow |
| [Fix Theme Colors](../directives/fix_theme_colors.md) | Theme correction SOP |
| [Run Tests](../directives/run_full_test_suite.md) | Test execution SOP |
| [Update Showcase](../directives/update_showcase.md) | Showcase update SOP |
| [All Directives](../directives/) | Full directive list |

---

## Archive

Historical documents preserved for reference.

| Archive | Contents |
|---------|----------|
| [2025 Archive](archive/2025/) | Superseded implementation plans |
| [iCloud Standalone](archived/icloud-standalone/) | Original iCloud AI Agent docs (migrated to LiquidOS GlassApp) |
