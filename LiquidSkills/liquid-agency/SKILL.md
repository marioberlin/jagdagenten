---
name: liquid-agency
description: Master instructions for agent orchestration, the 3-layer architecture, and skill management. Use this to maintain project integrity and agent reliability.
---

# Liquid Agency Skill

This skill defines how agents operate within the LiquidCrypto ecosystem to ensure deterministic execution and high reliability.

## 1. The 3-Layer Architecture
*   **Layer 1: Directive**: Every major task starts with an SOP in `directives/`.
*   **Layer 2: Orchestration**: The agent makes decisions based on directives and current state.
*   **Layer 3: Execution**: Use deterministic scripts in `scripts/` or `tools/`. Avoid "raw" terminal commands for complex operations.

## 2. Skill Management Protocol
### Python to Bun/TS Conversion
When adding or importing a Python-based skill (e.g. from ClaudeSkills):
1.  **Analyze**: Understand the Python logic.
2.  **Propose**: Ask the user: *"I've detected new Python tools. Would you like me to convert these to Bun/TypeScript for better performance and integration with our primary stack?"*
3.  **Rewrite**: If approved, port the logic to Bun/TS using the `tools/bun` target.

### Skill Discovery
Always check `LiquidSkills/_registry.md` at the start of a session to see available capabilities.

## 3. Ralph Autonomous Loop
For complex features:
1.  **PRD**: Create a `prd.json`.
2.  **Story**: Break down into atomic stories.
3.  **Iterate**: One story per context window.
4.  **Persist**: Update `GEMINI.md` and `progress.txt`.

## 4. Self-Healing
If a tool fails:
1.  Read the error.
2.  Fix the execution script.
3.  Update the directive/skill to prevent recurrence.
