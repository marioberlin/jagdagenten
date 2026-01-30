

````
# Jagd-Agenten — State-of-the-Art Agentic Smart Companion for DACH Hunters  
**Web app first (React + Tailwind + Bun). Mobile apps next.**  
**No 3D maps.** Focus: offline-first layers + proactive multi-agent assistance + compliance automation + weekly exploration dashboards.

---

## Table of contents
1. Executive Summary  
2. Product Principles  
3. Market Context & Positioning  
4. Core Architecture & Data Model (Hunt Timeline)  
5. The Agent System (Modules)  
6. AI Layer: Agentic Chat + Multi-Agent Orchestration  
7. Dashboards: Daily Cockpit + Waidmann-Feed + Weekly Explore  
8. Privacy, Safety, Moderation, and News/Citations  
9. Monetization  
10. Roadmap  
11. Success Metrics  
12. **Appendix A — AI Agent Spec (Engineering-Ready)**  

---

## 1) Executive Summary
**Jagd-Agenten** is a modern hunting companion built around a **team of proactive AI agents** rather than a passive toolbox. It supports the full hunting lifecycle—**planning → execution → documentation → compliance → community & safety**—with an **AI chat cockpit** that can coordinate specialized agents, call tools, and automate workflows using **stateful model interactions** and **function calling**.  [oai_citation:0‡OpenAI Platform](https://platform.openai.com/docs/api-reference/responses?utm_source=chatgpt.com)

**Core promise:** *“Not just a tool, but a team.”*

**Web-first tech stance:**  
- **React** for UI composition and component-based architecture.  [oai_citation:1‡React](https://react.dev/?utm_source=chatgpt.com)  
- **Tailwind CSS** for utility-first styling and fast iteration.  [oai_citation:2‡tailwindcss.com](https://tailwindcss.com/docs/utility-first?utm_source=chatgpt.com)  
- **Bun** for a fast, all-in-one JS/TS runtime + bundler + tooling.  [oai_citation:3‡bun.sh](https://bun.sh/?utm_source=chatgpt.com)  

---

## 2) Product Principles
1. **Agentic by default:** the app nudges users *before* they forget (gear, deadlines, wind shifts, twilight windows, reporting).  
2. **Offline-first:** hunting happens where signal is unreliable; sync when online.  
3. **Trust & privacy first (Germany-grade):** local-first options, granular sharing, blurred/delayed public insights.  
4. **One “Hunt Timeline” source of truth:** all agents write into one structured model to avoid feature sprawl.  
5. **One-tap field UX:** glove-friendly “Hunt Mode”, red/dark mode, vibration cues.

---

## 3) Market Context & Positioning
### Reference points
- **Revierwelt** is known for high feature density (e.g., “120+ functions”) but can be heavy UX.  [oai_citation:4‡OpenAI Platform](https://platform.openai.com/docs/api-reference/responses?utm_source=chatgpt.com)  
- **MyHunt** emphasizes modern UX and features like scent direction, rings, offline maps and live hunt visibility.  [oai_citation:5‡OpenAI Platform](https://platform.openai.com/docs/guides/agents-sdk?utm_source=chatgpt.com)  

### Jagd-Agenten wedge
**Not a menu of tools** → a **coordinated multi-agent assistant** that:
- recommends “what to do next” (not just displays data),
- automates state-specific admin/reporting,
- offers privacy-safe community insights and weekly exploration dashboards.

---

## 4) Core Architecture & Data Model: The Hunt Timeline
Everything the system does is anchored to a structured **Hunt Timeline**:

- **Session**: Ansitz / Pirsch / Drückjagd, start/end, participants, safety mode  
- **Location**: exact / blurred / none (user-controlled)  
- **Context snapshot**: wind/weather, twilight windows, moon, equipment state  
- **Observations & sightings**: species, confidence, photos, notes  
- **Shots & harvest**: shot notes, after-search notes, recovery  
- **Processing**: wildbret workflow, cooling chain timers, handovers  
- **Compliance**: export packs for Streckenliste/Abschussmeldungen  
- **Publishing**: story card + anonymized insights contribution (opt-in)

Agents are **specialized views + automations** over this one model.

---

## 5) The Agent System (Modules)
### 5.1 Scout Agent — Revier & Strategy (no 3D maps)
**Goal:** recommend *what to do next* based on conditions and history.

- Fast offline map layers: basemap + stands/pins + imported boundaries (GPX/KML/GeoJSON)  
- Wind/scent analyzer: dynamic scent corridor; wind shift warnings; stand + window suggestions  
- Approach planner: “safe approach” based on scent + quiet zones  
- Personal learning: “this stand works best with NW wind” (private unless shared)

### 5.2 Bureaucracy Agent — Legal & Admin (DACH moat)
**Goal:** reduce admin to one-tap exports.

- State/authority reporting engine (templates, deadlines, required fields)  
- One-click export pack: **PDF + CSV + “portal helper”**  
- Encrypted document safe (Jagdschein/WBK/insurance) + expiration alerts  
- Guest permits: Begehungsschein PDFs + sharing

### 5.3 Quartermaster Agent — Equipment & Gear
**Goal:** readiness with minimal friction.

- Digital gun safe inventory (local-first, encrypted sync optional)  
- Ammo tracker: usage + burn rate reminders  
- Maintenance cadence prompts + 1-tap pre-hunt checklist

### 5.4 Journal Agent — Memories, Proof, Wildbret
**Goal:** effortless documentation.

- One-tap “shot/harvest” logs with context snapshots  
- Recaps + story cards from timeline  
- Wildbret Pass + QR labels + handover sheet

### 5.5 Pack Agent — Community & Safety
**Goal:** safer group hunts and coordination.

- Hunt events with roles (Stand/Treiber/Hundeführer/Jagdleiter), check-in/out  
- Opt-in, event-only location sharing  
- Emergency escalation rules (inactivity → contacts)

---

## 6) AI Layer: Agentic Chat + Multi-Agent Orchestration
### 6.1 AI Chat (“Cockpit Chat”)
A persistent chat that can:
- answer questions,
- generate plans,
- execute actions via tools (start hunt, create permit PDF, export report pack),
- summarize and coach (recap + improvements).

### 6.2 Stateful multi-turn interactions + tool calling
- Use **Responses API** for stateful multi-turn flows and function/tool calling.  [oai_citation:6‡OpenAI Platform](https://platform.openai.com/docs/api-reference/responses?utm_source=chatgpt.com)  
- Use **Structured Outputs** so tool calls and UI payloads are strict JSON Schemas.  [oai_citation:7‡OpenAI Platform](https://platform.openai.com/docs/guides/structured-outputs?utm_source=chatgpt.com)  

### 6.3 Multi-agent delegation
- Use **Agents SDK** for handoffs to specialist agents and tracing/observability.  [oai_citation:8‡OpenAI Platform](https://platform.openai.com/docs/guides/agents-sdk?utm_source=chatgpt.com)  
- Built-in tracing captures generations, tool calls, handoffs, guardrails.  [oai_citation:9‡OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/tracing/?utm_source=chatgpt.com)  

---

## 7) Dashboards
### 7.1 Daily Cockpit (30 seconds)
- Huntability score  
- Best windows + wind/scent warnings  
- Twilight planner (civil twilight concept used in astronomy timekeeping)  [oai_citation:10‡OpenAPI Initiative Publications](https://spec.openapis.org/oas/v3.1.1.html?utm_source=chatgpt.com)  
- One-tap: Start Hunt / End Hunt  
- “Do next” suggestions (checklist, safety, logging)

### 7.2 Waidmann-Feed (Signal > Social)
A feed with explicit lanes and labeling:
- **Sighting Radar** (community + anonymized trends)  
- **Strecke & Stories** (publish from journal; “lessons learned”)  
- **Invites** (driven hunts, work days, dog handler requests)  
- **News** (with sources + citations; short summaries only)

### 7.3 Weekly Explore Dashboards (habit + delight)
Weekly-reset, interactive dashboards:
1) Revier Pulse (7-day)  
2) Moon & Twilight Planner (7-day)  
3) Gear Health Report  
4) Huntcraft Challenges (respectful gamification)  
5) Community Highlights (learning-first)

---

## 8) Privacy, Safety, Moderation, News/Citations
### 8.1 Public insight safeguards
- Grid-only public geo; no exact live locations  
- Time delay defaults for sightings/stories  
- k-threshold before showing system stats  
- Opt-out from contributing to aggregated insights

### 8.2 News crawling + citations (two modes)
- **Reader mode:** store metadata + summary + link; avoid full-text reproduction  
- **Trend mode:** treat as controlled TDM with opt-out and retention rules  
(OpenAI tool calling + structured outputs supports “source-cited items” as structured payloads.)  [oai_citation:11‡OpenAI Platform](https://platform.openai.com/docs/guides/function-calling?utm_source=chatgpt.com)  

---

## 9) Monetization
- Freemium (“Beater”): cockpit + basic journal + offline layers  
- Premium (“Pächter”, €49/yr): Scout recommendations, Bureaucracy automation, Pack events, weekly dashboards  
- Enterprise (“Forst”): multi-revier admin, role-based analytics, integrations

---

## 10) Roadmap
1) MVP (Web): Cockpit + Hunt Timeline + Scout basics + Journal basics + AI chat (safe actions)  
2) Bureaucracy Update: export packs + document vault  
3) Feed + Weekly Explore: publish pipeline + anonymized insights + citations  
4) Pack Events + Mobile apps  
5) Integrations: cameras, wearables, enterprise workflows

---

## 11) Success Metrics
- WAU / 7-day return rate (driven by dashboards)  
- % hunts started/ended via app (timeline capture)  
- Admin time saved (export packs)  
- Safety adoption (% events with check-in/out)  
- Trust signals (opt-in telemetry rates, report/appeal resolution times)

---

# 12) Appendix A — AI Agent Spec (Engineering-Ready)

## A1) System Overview
### A1.1 Agents
- **Router Agent (Orchestrator)**: intent classification, delegation, safety gates, final composition  
- **Specialists**: Scout, Bureaucracy, Quartermaster, Journal, Pack  
- **Platform**: Feed Curator, News Curator  
- **Safety**: Moderation Agent, Privacy Guardian

### A1.2 Control plane
- **Responses API** for stateful interactions + tool calls.  [oai_citation:12‡OpenAI Platform](https://platform.openai.com/docs/api-reference/responses?utm_source=chatgpt.com)  
- **Agents SDK** for handoffs and tracing.  [oai_citation:13‡OpenAI Platform](https://platform.openai.com/docs/guides/agents-sdk?utm_source=chatgpt.com)  
- **Structured Outputs** for deterministic JSON schemas.  [oai_citation:14‡OpenAI Platform](https://platform.openai.com/docs/guides/structured-outputs?utm_source=chatgpt.com)  
- **Tools guide** for built-in tools and remote MCP patterns if needed later.  [oai_citation:15‡OpenAI Platform](https://platform.openai.com/docs/guides/tools?utm_source=chatgpt.com)  

---

## A2) Prompt Pack (System Prompts)

### A2.1 Router Agent — System Prompt
```text
You are Jagd-Agenten Router: an orchestrator that delegates to specialist agents and tools.
Goals:
- Understand user intent and context (hunt timeline, privacy settings, region).
- Delegate to the right specialist agent via handoff tools.
- Use tools via function calling only when needed; prefer structured outputs.
- Enforce permission model: do not execute sensitive actions without explicit user confirmation.
- Always preserve privacy defaults: no exact live locations in public content; apply blurring & time-delay rules.
Output:
- Provide (1) a short user-facing answer, (2) optional “Plan/Do/Explain” payload for UI.
````

### **A2.2 Scout Agent — System Prompt**

```
You are the Scout Agent. Optimize hunt decisions (stand/time/approach) using wind/scent, weather snapshots, twilight windows, and stand history.
Rules:
- No 3D maps.
- Always include “why” (wind/scent/timing/history).
Outputs:
- Return structured plan objects for UI and a concise human explanation.
```

### **A2.3 Bureaucracy Agent — System Prompt**

```
You are the Bureaucracy Agent. Automate admin workflows (exports, permits, doc vault reminders).
Rules:
- Never submit/send externally without explicit confirmation.
- Produce export packs (PDF+CSV+helper) and list missing fields.
Outputs:
- Structured export jobs + human summary.
```

### **A2.4 Quartermaster Agent — System Prompt**

```
You are the Quartermaster Agent. Maintain readiness (ammo, maintenance, checklists).
Rules:
- Minimal nudges. Default private storage. Redact weapon details from share flows.
Outputs:
- Structured checklist + reminders.
```

### **A2.5 Journal Agent — System Prompt**

```
You are the Journal Agent. Capture hunts into the Hunt Timeline and create recaps, story drafts, wildbret records.
Rules:
- Default coarse location unless user opts into precise.
- For publishing: remove exact coordinates; apply delay; run moderation.
Outputs:
- Timeline events + story drafts.
```

### **A2.6 Pack Agent — System Prompt**

```
You are the Pack Agent. Coordinate events and safety.
Rules:
- Opt-in, event-only live sharing. Never post live locations publicly.
Outputs:
- Structured event plan + safety checklist suggestions.
```

### **A2.7 News Curator Agent — System Prompt**

```
You are the News Curator. Fetch allowed hunting news sources and summarize with citations.
Rules:
- Reader mode: metadata + summary + link; no full-text reproduction.
- Always attach citations for each item.
Outputs:
- {title, source, date, summary, url, tags, confidence}.
```

### **A2.8 Moderation Agent — System Prompt**

```
You are the Moderation Agent. Enforce platform rules for UGC.
Rules:
- Block doxxing, precise live location sharing, protected-species harm content, weapon marketplace content.
- Actions: warn, redact, reject, shadow-limit, or human review.
Outputs:
- Structured moderation decision objects with reason codes.
```

---

## **A3) Tooling & Schemas (Function Calling)**

Use strict JSON schemas for tools \+ UI payloads. 

### **A3.1 Shared types**

```
{
  "$defs": {
    "GeoScope": {
      "type": "object",
      "properties": {
        "mode": { "type": "string", "enum": ["none", "coarse_grid", "precise"] },
        "grid_id": { "type": "string" },
        "lat": { "type": "number" },
        "lon": { "type": "number" },
        "blur_meters": { "type": "integer", "minimum": 0 }
      },
      "required": ["mode"]
    },
    "ToolEnvelope": {
      "type": "object",
      "properties": {
        "status": { "type": "string", "enum": ["ok", "needs_user_confirm", "blocked", "error"] },
        "result": { "type": "object" },
        "audit": {
          "type": "object",
          "properties": {
            "reason_codes": { "type": "array", "items": { "type": "string" } },
            "redactions": { "type": "array", "items": { "type": "string" } },
            "privacy_applied": { "type": "array", "items": { "type": "string" } }
          }
        }
      },
      "required": ["status"]
    }
  }
}
```

### **A3.2 Core tool list (MVP)**

* timeline.start\_session, timeline.log\_event, timeline.end\_session

* scout.get\_conditions\_snapshot, scout.recommend\_plan

* bureaucracy.generate\_export\_pack, bureaucracy.create\_guest\_permit\_pdf

* gear.generate\_pre\_hunt\_checklist

* pack.create\_event

* feed.publish\_post

* news.ingest\_sources, news.summarize\_with\_citations

* moderation.check\_post

---

## **A4) Permission Model (Action Tiers)**

* **Tier 0 (Read):** fetch conditions, generate plans, summarize

* **Tier 1 (Local write):** timeline edits, checklist generation, draft PDFs

* **Tier 2 (Share/Publish):** publish posts, invites

* **Tier 3 (External effects):** submit to authorities, message guests, enable event-only live location

**Rule:** Tier 2/3 require explicit confirmation modal (tool returns needs\_user\_confirm until confirmed).

---

## **A5) Memory Rules**

* Short-term: last tool calls, current session id

* Long-term: user preferences (species, stands, privacy defaults)

* Domain: Hunt Timeline (structured)

* Community: aggregated insights only (blurred \+ delayed \+ thresholded)

---

## **A6) Moderation Workflow**

Publish pipeline:

1. Draft → moderation.check\_post

2. Privacy Guardian enforces blur/delay/redactions

3. Decision: allow / allow with redactions / reject / escalate

---

## **A7) Chat UI Patterns (“Plan / Do / Explain”)**

Each assistant turn may include a structured UI payload:

```
{
  "ui": {
    "chips": ["Plan", "Do", "Explain"],
    "primary_action": {
      "label": "Start Hunt",
      "tool": "timeline.start_session",
      "tier": 1
    },
    "secondary_actions": [
      { "label": "Open Checklist", "tool": "gear.generate_pre_hunt_checklist", "tier": 1 },
      { "label": "Show Why", "mode": "explain" }
    ],
    "explain": [
      "NW wind stable until 20:15",
      "Scent corridor avoids Wechsel",
      "Two prior successful sits under similar wind"
    ]
  }
}
```

---

## **A8) Observability**

Enable Agents SDK tracing to record:

* generations, tool calls, handoffs, guardrails, custom events. 

   Handoffs are represented as tools to the LLM. 

---

````
---

## B) Concrete folder structure + shared TypeScript interfaces + OpenAPI spec

### B1) Monorepo folder structure (Web-first + shared packages + services)
```txt
jagd-agenten/
  apps/
    web/                        # React web app
      src/
        app/                    # routes/pages (or your preferred router)
        components/
        features/
          cockpit/
          chat/
          feed/
          timeline/
          dashboards/
        lib/
          api/
          auth/
          storage/
          ui-payloads/
        styles/
      public/
      tailwind.config.ts
      package.json
    mobile/                     # React Native / Expo (later)
      src/
        features/
        lib/
      package.json

  packages/
    ui/                         # shared UI primitives (optional)
      src/
    types/                      # shared TypeScript domain models + tool schemas
      src/
        domain/
        tools/
        ui/
        permissions/
        moderation/
      package.json
    api-client/                 # typed client for tool-gateway + orchestrator
      src/
      package.json

  services/
    tool-gateway/               # Bun service: executes tool calls (audited)
      src/
        routes/
        tools/
          timeline/
          scout/
          bureaucracy/
          gear/
          pack/
          feed/
          news/
          moderation/
        guardrails/
        auth/
        audit/
      package.json
    agent-orchestrator/         # Bun service: wraps OpenAI Responses API + handoffs
      src/
        agents/
          router/
          scout/
          bureaucracy/
          quartermaster/
          journal/
          pack/
          feed-curator/
          news-curator/
          moderation/
          privacy-guardian/
        tools/                  # tool definitions exposed to model (schemas)
        memory/
        tracing/
      package.json
    news-ingestor/              # Bun cron/worker: RSS ingest + citations store
      src/
      package.json

  infra/
    openapi/
      tool-gateway.yaml
    migrations/
    terraform/                  # optional
  README.md
````

Why this stack fits:

* Bun positions itself as an all-in-one runtime/toolkit for JS/TS with bundler \+ package manager. 

* React is for web \+ native UI; Tailwind is utility-first styling. 

---

### **B2) Shared TypeScript interfaces (packages/types)**

```
// packages/types/src/domain/geo.ts
export type GeoMode = "none" | "coarse_grid" | "precise";

export interface GeoScope {
  mode: GeoMode;
  gridId?: string;       // required for coarse_grid
  lat?: number;          // required for precise
  lon?: number;          // required for precise
  blurMeters?: number;   // applied by Privacy Guardian
}

// packages/types/src/domain/timeline.ts
export type SessionType = "ansitz" | "pirsch" | "drueckjagd" | "other";
export type TimelineEventType = "sighting" | "shot" | "harvest" | "note" | "processing" | "handover";

export interface HuntSession {
  id: string;
  sessionType: SessionType;
  startTime: string; // ISO
  endTime?: string;  // ISO
  geo: GeoScope;
  participants: string[];
  privacyMode: "private" | "team_event_only" | "public_blurred";
}

export interface TimelineEvent<T = Record<string, unknown>> {
  id: string;
  sessionId: string;
  eventType: TimelineEventType;
  time: string; // ISO
  geo: GeoScope;
  data: T;
}

// packages/types/src/permissions/tiers.ts
export type PermissionTier = 0 | 1 | 2 | 3;

export interface ToolPolicy {
  toolName: string;          // e.g. "timeline.start_session"
  tier: PermissionTier;      // 0..3
  requiresConfirm: boolean;  // tier 2/3 usually true
}

// packages/types/src/tools/envelope.ts
export type ToolStatus = "ok" | "needs_user_confirm" | "blocked" | "error";

export interface ToolAudit {
  reasonCodes?: string[];
  redactions?: string[];
  privacyApplied?: string[];
  traceId?: string;
}

export interface ToolEnvelope<TResult = any> {
  status: ToolStatus;
  result?: TResult;
  audit?: ToolAudit;
  error?: { code: string; message: string };
}

// packages/types/src/ui/chat-ui.ts
export interface ChatAction {
  label: string;
  tool?: string;          // function tool name
  mode?: "explain";
  tier?: PermissionTier;
  argsPreview?: Record<string, unknown>;
}

export interface ChatUiPayload {
  chips?: Array<"Plan" | "Do" | "Explain" | "Save" | "Share">;
  primaryAction?: ChatAction;
  secondaryActions?: ChatAction[];
  explain?: string[];
}

// packages/types/src/moderation/decision.ts
export type ModerationAction = "allow" | "allow_with_redactions" | "reject" | "escalate_to_human";

export interface ModerationDecision {
  action: ModerationAction;
  reasonCodes: string[];
  redactions?: string[];
  suggestedEdits?: string[];
}
```

---

### **B3) First-pass OpenAPI spec (Tool Gateway) — OpenAPI 3.1.1**

This OpenAPI file defines a **single tool invocation endpoint** plus a few convenience endpoints. It follows the OpenAPI 3.1.1 specification. 

```
openapi: 3.1.1
info:
  title: Jagd-Agenten Tool Gateway API
  version: 0.1.0
  description: >
    Executes audited tool calls for Jagd-Agenten agents (timeline, scout, bureaucracy, gear, pack, feed, news, moderation).
    Designed for function calling + structured outputs.
servers:
  - url: https://api.jagd-agenten.example/v1

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer

  schemas:
    GeoScope:
      type: object
      properties:
        mode:
          type: string
          enum: [none, coarse_grid, precise]
        gridId:
          type: string
        lat:
          type: number
        lon:
          type: number
        blurMeters:
          type: integer
          minimum: 0
      required: [mode]

    ToolStatus:
      type: string
      enum: [ok, needs_user_confirm, blocked, error]

    ToolAudit:
      type: object
      properties:
        reasonCodes:
          type: array
          items: { type: string }
        redactions:
          type: array
          items: { type: string }
        privacyApplied:
          type: array
          items: { type: string }
        traceId:
          type: string

    ToolError:
      type: object
      properties:
        code: { type: string }
        message: { type: string }
      required: [code, message]

    ToolEnvelope:
      type: object
      properties:
        status:
          $ref: "#/components/schemas/ToolStatus"
        result:
          type: object
          additionalProperties: true
        audit:
          $ref: "#/components/schemas/ToolAudit"
        error:
          $ref: "#/components/schemas/ToolError"
      required: [status]

    # Generic tool invocation request.
    ToolInvokeRequest:
      type: object
      properties:
        tool:
          type: string
          description: "Tool name, e.g. timeline.start_session"
        args:
          type: object
          additionalProperties: true
        userContext:
          type: object
          description: "Auth-derived user id, region, privacy defaults; server may ignore client-sent fields."
          additionalProperties: true
        confirmation:
          type: object
          description: "Only present when user confirms a Tier 2/3 action."
          properties:
            confirmToken:
              type: string
            confirmed:
              type: boolean
          required: [confirmToken, confirmed]
      required: [tool, args]

    # Minimal examples for typed endpoints (optional convenience)
    TimelineStartSessionArgs:
      type: object
      properties:
        sessionType: { type: string, enum: [ansitz, pirsch, drueckjagd, other] }
        startTime: { type: string, format: date-time }
        geo: { $ref: "#/components/schemas/GeoScope" }
        participants:
          type: array
          items: { type: string }
        privacyMode:
          type: string
          enum: [private, team_event_only, public_blurred]
      required: [sessionType, startTime, geo, privacyMode]

paths:
  /tools:invoke:
    post:
      operationId: invokeTool
      summary: Invoke a tool by name (generic gateway)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ToolInvokeRequest"
      responses:
        "200":
          description: Tool result envelope
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ToolEnvelope"
        "400":
          description: Invalid tool or args
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ToolEnvelope"
        "401":
          description: Unauthorized
        "403":
          description: Forbidden by permission/guardrail
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ToolEnvelope"

  /tools/schema:
    get:
      operationId: listToolSchemas
      summary: Return JSON Schemas for all tools exposed to the model (function calling catalog)
      responses:
        "200":
          description: Tool schema catalog
          content:
            application/json:
              schema:
                type: object
                additionalProperties: true

  # Optional convenience endpoints for direct callers (non-model)
  /timeline/sessions:start:
    post:
      operationId: startSession
      summary: Start hunt session (convenience wrapper around timeline.start_session)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/TimelineStartSessionArgs"
      responses:
        "200":
          description: Tool envelope with created session
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ToolEnvelope"

  /health:
    get:
      operationId: health
      summary: Health check
      responses:
        "200":
          description: ok
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok: { type: boolean }
                required: [ok]
```

