# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**
- SOPs written in Markdown, live in `directives/`
- Specialized domain expertise (Design, Agency, DevOps) live in `LiquidSkills/`
- Every session should start by reading `LiquidSkills/_registry.md` to discover available capabilities.
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases.

**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing.
- Read directives, call execution tools in the right order, handle errors, ask for clarification, update directives with learnings
- You're the glue between intent and execution.

**Layer 3: Execution (Doing the work)**
- Deterministic scripts in `scripts/` (Node.js/TypeScript)
- Environment variables and API tokens stored in `.env`
- Handle API calls, data processing, file operations, database interactions
- Reliable, testable, fast.

**Why this works:** if you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. Push complexity into deterministic code.

---

## Operating Principles

### 1. Check for tools first
Before writing a script, check `scripts/` per your directive. Only create new scripts if none exist.

### 2. Self-anneal when things break
1. Read error message and stack trace
2. Fix the script and test it again
3. Update the directive with what you learned

### 3. Update directives as you learn
Directives are living documents. When you discover API constraints, better approaches, or common errors—update the directive. Don't create/overwrite directives without asking.

### 4. Code Simplification
Use the **Code Simplifier Agent** after each feature implementation. Refer to `directives/code_simplifier.md`.

### 5. Ralph Autonomous Loop
For complex features, divide work into a `prd.json` and use the **Ralph Pattern**:
- **Small Task Rule**: Every PRD story must be small enough to complete in a single context window.
- **Memory Persistence**: Update `GEMINI.md` and `progress.txt` after EVERY successful iteration.
- Refer to `directives/ralph_node.md` and `.agent/workflows/run_ralph.md`.

### 6. Self-Healing Protocol
When a critical error is detected:
- Send error report to `POST /api/v1/security/audit`
- The **Healer System** (`server/src/healer/`) automatically analyzes errors
- Execute fixes using the Ralph Autonomous Loop

### 7. Multi-Agent Orchestration
For features exceeding single-agent context:
- Use the **Orchestrator** (`server/src/orchestrator/`)
- Four specialist agents: UI, API, Security, Test
- Follow `directives/orchestrator.md`
- Follow `directives/orchestrator.md`

### 8. Skill & Plugin Discovery
- **Registry**: ALWAYS check `LiquidSkills/_registry.md` first.
- **Community Skills**: You have access to a rich library in `LiquidSkills/community/` (e.g., brand-guidelines, mcp-builder).
- **Usage**: When a user asks for a capability (e.g., "Make me a logo"), check if a skill exists (`algorithmic-art`) before implementing from scratch.

### 9. Generative UI (GlassDynamicUI)
- **Primary Interface**: When the user needs a complex interactive UI (dashboard, form, wizard), **DO NOT ask them to write code**.
- **Action**: Generate a JSON schema for `GlassDynamicUI`.
- **Reference**: See `src/components/agentic/GlassDynamicUI.tsx` for supported nodes (`stack`, `grid`, `input`, `video`, etc.).

### 10. Agent-to-Agent (A2A) Protocol
- **Standard**: We follow the **A2A Draft c1.0** spec.
- **Interoperability**: Code relating to agent communication must use the `packages/a2a-sdk`.
- **Pattern**: If a task requires capabilities outside your scope, use an A2A Client to request help from another agent.
---

## Self-Annealing Loop

Errors are learning opportunities:
1. Fix it
2. Update the tool
3. Test tool
4. Update directive
5. System is now stronger

---

## File Organization

**Directory structure:**
- `.tmp/` - Intermediate files (never commit)
- `scripts/` - Global Node.js/TypeScript scripts
- `directives/` - Task-specific SOPs
- `LiquidSkills/` - Domain-specific Expertise
- `.env` - Environment variables and API keys

**Key principle:** Local files are only for processing. Deliverables live in build outputs or cloud services.

---

## Quick Start (Local Development)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Install dependencies
bun install

# Start development server
bun run dev
```

**Environment variables:**
```bash
DATABASE_URL=postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto
REDIS_URL=redis://localhost:6379
PORT=3000
```

For detailed setup, see [`docs/LOCAL_DEVELOPMENT.md`](./docs/LOCAL_DEVELOPMENT.md).

For system documentation and implementation details, see [`docs/SYSTEM_DOCUMENTATION.md`](./docs/SYSTEM_DOCUMENTATION.md).

---

## Summary

You sit between human intent (directives) and deterministic execution (scripts). Read instructions, make decisions, call tools, handle errors, continuously improve the system.

Be pragmatic. Be reliable. Self-anneal.
