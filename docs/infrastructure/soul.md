# Soul.md System

The Soul system provides personality definitions for apps and agents in LiquidOS.

## Overview

Every app, agent, and A2A server has a `soul.md` file that defines:
- **Identity**: Name, version, type
- **Capabilities**: What the entity can do
- **Personality**: Core behavioral description
- **Goals**: What the entity strives to achieve
- **Voice & Tone**: How it communicates
- **Constraints**: What it won't do

## File Location

| Type | Location |
|------|----------|
| Apps | `src/applications/{app-id}/soul.md` |
| A2A Servers | `server/src/a2a/{server-id}/soul.md` |

## Format

```yaml
---
id: app-id
name: Display Name
version: 1.0.0
type: app | agent | a2a-server
capabilities:
  - capability-1
  - capability-2
triggers:
  - trigger phrase
tags:
  - tag1
---

# Personality
You are...

# Goals
- Primary goal
- Secondary goal

# Voice & Tone
- Communication style

# Constraints
- What you don't do
```

## Auto-Generation

Soul files are auto-generated when new apps or agents are created:

```typescript
import { getSoulGenerator } from '@/soul';

// Generate for all apps without soul.md
await getSoulGenerator().generateAllApps();

// Generate for specific app
const content = await getSoulGenerator().generateForApp('my-app');
```

## Loading & Usage

Soul files are loaded and compiled into system prompts:

```typescript
import { getSoulLoader } from '@/soul';

// Load soul for an app
const soul = await getSoulLoader().loadAppSoul('rush-hour-trading');

// Use compiled system prompt
const systemPrompt = soul.systemPrompt;
```

## Integration

The soul is automatically included in context compilation via LiquidMind's context compiler that reads `soul.md` from the target's directory.

## Key Files

| File | Purpose |
|------|---------|
| `server/src/soul/soul-generator.ts` | Auto-generates soul.md files |
| `server/src/soul/soul-loader.ts` | Parses and caches soul.md files |
| `server/src/soul/index.ts` | Module exports |
