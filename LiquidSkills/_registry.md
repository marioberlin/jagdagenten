---
name: liquid-skills-registry
description: Central index for all available agent skills in the LiquidCrypto project.
---

# LiquidSkills Registry

Welcome, Agent. This is the central repository of specialized capabilities for the LiquidCrypto project. Use these skills to maintain high design quality, follow architectural patterns, and automate workflows.

---

## 🤝 Parallel Harmony: Skills & Plugins
LiquidSkills supports both **Claude Skills** (instructions) and **Claude Plugins** (manifests/hooks) in parallel.
- **Skills (Knowledge)**: Pure markdown instructions in `SKILL.md`.
- **Plugins (Automation)**: Manifest-driven modules with `plugin.json` for automated **Hooks**.
- **Hybrid Execution**: Agents use Skills for reasoning while Plugins enforce standards automatically via `PostToolUse` triggers.

---

## Core Skills

| Skill | Description | Language | Path |
| :--- | :--- | :--- | :--- |
| **liquid-design** | [Plugin] Unified Source of Truth (Constants, Materials, Patterns) | Bun/TS | `liquid-design/` |
| **liquid-agency** | [Plugin] Agent Orchestration & Protocol | Bun/TS | `liquid-agency/` |

## Vendor & Imported Skills

| Skill | Description | Language | Path |
| :--- | :--- | :--- | :--- |
| **code-simplifier** | [Vendor] Automated Logic Refinement | Bun/TS | `vendor/code-simplifier/` |
| **frontend-design**| [Vendor] Design Philosophy & Guidelines | Doc | `vendor/frontend-design/` |

## Architecture Standard
LiquidSkills follows the **Claude Plugin Standard**:
- **Manifest**: Every skill has a `plugin.json` (or `skill.json`) in its root or `.claude-plugin/` folder.
- **Tools**: Executables live in `commands/` or `tools/`.
- **Registry**: This file provides the high-level map for discovery.

## Usage
To learn a skill, read its `SKILL.md`. To execute capabilities, check the `tools/` directory within each skill.
