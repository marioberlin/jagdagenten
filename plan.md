# Jagd-Agenten — Comprehensive Implementation Plan
 
## Context
 
This project is a **fork of the LiquidCrypto/Liquid Glass platform**. We keep the platform infrastructure (design system, A2A protocol, LiquidMind resources, Elysia backend, Zustand stores, component library, offline capabilities) and **strip all crypto/trading/travel/retail domain code**, then build the Jagd-Agenten hunting companion on top.
 
**Key decisions:**
- **Architecture:** Build inside the existing monorepo (not a standalone repo)
- **AI Backend:** Gemini Flash as primary model (existing `callGemini()` infrastructure)
- **Design System:** Keep "Glass" components, rename branding from "LiquidCrypto" to "Jagd-Agenten"
- **Home/Landing:** New Jagd-Agenten home experience (not the old LiquidOS desktop)
 
---
 
## Phase 0: Rename + Strip + Scaffold
 
This phase transforms the LiquidCrypto fork into a clean Jagd-Agenten codebase.
 
### 0.1 — Global Rename (LiquidCrypto → Jagd-Agenten) ✅ DONE
 
**Package names:**
 
| File | Old | New |
|------|-----|-----|
| `package.json` | `"name": "liquid-glass-ui"` | `"name": "jagd-agenten"` |
| `package.json` exports | `liquid-glass.js`, `liquid-glass.umd.cjs` | `jagd-agenten.js`, `jagd-agenten.umd.cjs` |
| `server/package.json` | `"name": "liquid-glass-server"` | `"name": "jagd-agenten-server"` |
| `packages/a2a-sdk/package.json` | `"@jagdagenten/a2a-sdk"` | `"@jagdagenten/a2a-sdk"` |
 
**Docker & infra:**
 
| File | Change |
|------|--------|
| `docker-compose.yml` | All container names: `liquidcrypto-*` → `jagdagenten-*` |
| `docker-compose.yml` | Postgres user/db: `liquidcrypto` → `jagdagenten` |
| `docker-compose.yml` | Network: `liquid-network` → `jagd-network` |
| `.env.example` | All `liquidcrypto` refs → `jagdagenten` |
| `DATABASE_URL` | `liquidcrypto:liquidcrypto_dev@.../liquidcrypto` → `jagdagenten:jagdagenten_dev@.../jagdagenten` |
 
**Import paths (project-wide):**
- `@jagdagenten/a2a-sdk` → `@jagdagenten/a2a-sdk` (all files that import the SDK)
 
**Documentation:**
- `README.md` — rewrite for Jagd-Agenten product
- `CLAUDE.md` — update project description, keep 3-layer architecture
- `docs/` — update all references, remove crypto-specific docs
 
**Vite config:**
- Update `vite.config.ts` library output names
 
### 0.2 — Strip Domain-Specific Code ✅ DONE
 
**Applications DELETED (13 apps) — COMPLETE:**
 
```
src/applications/rush-hour-trading/     # Crypto trading
src/applications/neon-tokyo/            # Travel demo
src/applications/aurora-travel/         # Travel planning
src/applications/aurora-weather/        # Weather demo
src/applications/merchant-console/      # Retail/UCP
src/applications/shopping-assistant/    # Retail/UCP
src/applications/ucp-discovery/         # Retail/UCP
src/applications/alexa/                 # Smart home demo
src/applications/ibird/                 # Email/Calendar demo
src/applications/icloud/                # Apple demo
src/applications/demos/                 # Demo showcases
src/applications/design-guide/          # Design guide (rebuild as Jagd version)
src/applications/liquid-motion/         # Video editor demo
```
 
**Applications to KEEP (10 platform apps):**
 
```
src/applications/_system/finder/        # File/app discovery
src/applications/_system/app-store/     # App marketplace
src/applications/_system/settings/      # System settings
src/applications/_system/showcase/      # Component showcase (dev tool)
src/applications/ai-explorer/           # LiquidMind resource browser
src/applications/agent-chat/            # Agent chat interface
src/applications/agent-hub/             # Agent discovery
src/applications/a2a-console/           # A2A debugging (dev tool)
src/applications/artifacts/             # Generated artifacts
src/applications/builder/               # App builder
src/applications/cowork/                # Collaborative workspace
src/applications/sheets/                # Smart spreadsheets
```
 
**Agents DELETED (15 agents) — COMPLETE:**
 
```
server/src/agents/crypto-advisor.ts
server/src/agents/trading/              # Entire directory (8 sub-agents)
server/src/agents/travel.ts
server/src/agents/aurora-weather.ts
server/src/agents/neon-tokyo.ts
server/src/agents/restaurant.ts
server/src/agents/rizzcharts.ts
server/src/agents/nanobanana.ts
server/src/agents/documind.ts
server/src/agents/dashboard-builder.ts
server/src/agents/media-imagegen.ts
server/src/agents/media-videogen.ts
server/src/agents/research-canvas.ts
server/src/agents/ai-researcher.ts
```
 
**Agents to KEEP (10 platform agents):**
 
```
server/src/agents/state-machine.ts
server/src/agents/session-tools.ts
server/src/agents/compaction-service.ts
server/src/agents/importance-classifier.ts
server/src/agents/memory-decontextualizer.ts
server/src/agents/topic-clusterer.ts
server/src/agents/qa-agent.ts
server/src/agents/chat-commands.ts
server/src/agents/copilot-form.ts
server/src/agents/project-assistant.ts
```
 
**A2A Executors DELETED — COMPLETE:**
 
```
server/src/a2a/executors/liquidcrypto.ts
server/src/a2a/executors/trading-components.ts
server/src/a2a/executors/commerce.ts
server/src/a2a/executors/alexa.ts
```
 
**Routes DELETED — COMPLETE:**
 
```
server/src/routes/ucp-discovery.ts
server/src/routes/ucp-api.ts
server/src/routes/ucp-discovery-api.ts
server/src/routes/gmail.ts
server/src/routes/icloud.ts
server/src/routes/ibird/
```
 
**After stripping:**
- Update `server/src/index.ts` — remove all deleted route/agent imports
- Update `server/src/a2a/elysia-plugin.ts` — remove deleted executor registrations
- Update `src/services/agents/registry.ts` — remove deleted agent entries
- Run `bun install` to verify no broken imports ✅
- Run `bun run build` to verify clean compile ✅
 
### 0.3 — New Home Experience ✅ DONE
 
Replace the old LiquidOS desktop with a Jagd-Agenten home:
 
**File:** `src/pages/Home.tsx` — rewrite as `JagdHome.tsx`
 
The new home is the **Daily Cockpit** (see Phase 1.2). It shows:
- Huntability score
- Best windows + wind/scent
- One-tap Start Hunt / End Hunt
- Cockpit Chat sidebar
- Quick navigation to all Jagd features
 
**File:** `src/Router.tsx` — update routes:
- `/` → Jagd-Agenten cockpit (new home)
- `/scout` → Scout map & conditions
- `/timeline` → Hunt Timeline
- `/journal` → Journal & harvest logs
- `/bureaucracy` → Export packs & document vault
- `/gear` → Quartermaster inventory
- `/pack` → Group events & safety
- `/feed` → Waidmann-Feed
- `/explore` → Weekly dashboards
- `/chat` → Full-screen Cockpit Chat
- `/settings` → System settings (kept)
 
### 0.4 — New Database Migration
 
**File:** `server/sql/020_jagd_agenten.sql` ✅ DONE
 
### 0.5 — Shared Types Package
 
**File:** `packages/types-jagd/package.json` ✅ DONE
 
### 0.6 — JSON Schemas for Function Calling
 
**File:** `server/src/schemas/*.ts` ✅ DONE
 
### 0.7 — New Dependencies ✅ DONE
 
| Package | Purpose |
|---------|---------|
| `suncalc` | Twilight/sunrise/sunset/moon calculations |
| `@tmcw/togeojson` | GPX/KML → GeoJSON boundary import |
| `rss-parser` | News feed ingestion |
| `i18next` + `react-i18next` | Internationalization (DE primary, EN secondary) |
| `idb` | IndexedDB wrapper for offline storage |
| `@react-pdf/renderer` | PDF export pack generation |
| `qrcode` | QR code generation for Wildbret Pass labels |
| `pigeon-maps` | Lightweight OSM map (no API key) |
 
### 0.8 — i18n Setup ✅ DONE
 
German-first internationalization configured in `src/lib/i18n.ts` with locales in `src/locales/de/` and `src/locales/en/`.
 
---
 
## Phase 1: MVP — Cockpit + Hunt Timeline + Scout + Journal + AI Chat
 
### 1.1 — Hunt Timeline (Core Data Model) ✅ PARTIALLY DONE
 
Backend routes and stores created. Frontend components exist.
 
### 1.2 — Daily Cockpit (Home) ✅ PARTIALLY DONE
 
Component created at `src/applications/jagd-agenten/components/DailyCockpit.tsx`.
 
### 1.3 — Scout Agent (No 3D Maps) ✅ PARTIALLY DONE
 
Backend route and frontend component exist.
 
### 1.4 — Journal Agent (Basic) ✅ PARTIALLY DONE
 
Backend route and frontend component exist.
 
### 1.5 — AI Chat ("Cockpit Chat")
 
Backend route exists. Needs Gemini Flash router agent integration.
 
### 1.6 — Offline-First Engine
 
TODO: Service Worker, IndexedDB stores, sync queue.
 
### 1.7 — Hunt Mode (Field UX)
 
TODO: Field mode, night vision theme, vibration cues.
 
---
 
## Phase 2: Bureaucracy Update
 
### 2.1 — Bureaucracy Agent
### 2.2 — Document Vault
### 2.3 — Quartermaster Agent (Full)
 
---
 
## Phase 3: Feed + Weekly Explore
 
### 3.1 — Waidmann-Feed
### 3.2 — News Curator Agent
### 3.3 — Moderation Agent + Privacy Guardian
### 3.4 — Weekly Explore Dashboards
 
---
 
## Phase 4: Pack Events + Safety
 
### 4.1 — Pack Agent
### 4.2 — Pack Event UI
 
---
 
## Phase 5: Integrations & Mobile (Future)
 
### 5.1 — Camera trap integration
### 5.2 — Wearable integration
### 5.3 — React Native / Expo mobile apps
### 5.4 — Enterprise multi-revier admin with role-based analytics
 
---
 
## Implementation Sequence
 
```
Phase 0: Rename + Strip + Scaffold
├── 0.1 Global rename (LiquidCrypto → Jagd-Agenten) ✅
├── 0.2 Strip domain-specific code (delete 13 apps, 15 agents, executors, routes)
├── 0.3 New home experience (JagdHome → cockpit) ✅
├── 0.4 Database migration ✅
├── 0.5 Shared types package ✅
├── 0.6 JSON Schemas ✅
├── 0.7 New dependencies ✅
├── 0.8 i18n setup ✅
└── 0.9 Verify clean build ✅

Phase 1: MVP
├── 1.1 Hunt Timeline ✅ partial
├── 1.2 Daily Cockpit ✅ partial
├── 1.3 Scout Agent ✅ partial
├── 1.4 Journal Agent ✅ partial
├── 1.5 AI Chat (router + specialists)
├── 1.6 Offline-first engine
└── 1.7 Hunt Mode

Phase 2–5: See above
```
