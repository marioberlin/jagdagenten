# Liquid Glass Design System - Agent Skills Implementation Plan

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Planning Complete - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [What Are Agent Skills?](#what-are-agent-skills)
3. [Liquid Glass Skills Ecosystem](#liquid-glass-skills-ecosystem)
4. [Skill Implementation Plans](#skill-implementation-plans)
5. [General Skill Guidelines](#general-skill-guidelines)
6. [Progressive Disclosure Strategy](#progressive-disclosure-strategy)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This document defines a comprehensive set of **Agent Skills** for the Liquid Glass Design System. Agent Skills teach Claude specialized knowledge about the design system, enabling intelligent, context-aware assistance for common tasks.

### Goals

- **Faster Onboarding** - New developers learn design system patterns quickly
- **Consistency** - Claude enforces best practices across contributions
- **Knowledge Preservation** - Expert knowledge encoded in reusable Skills
- **Reduced Errors** - Claude avoids common mistakes with guided patterns

---

## 🤝 Parallel Harmony: Skills & Plugins

LiquidSkills is not a replacement for Claude Plugins; it is a **harmonized implementation**.

### The Parallel Model
- **Skills provide the "Think"**: Expert reasoning via `SKILL.md`.
- **Plugins provide the "Do"**: Automated hooks and tools via `plugin.json`.

**Example Workflow:**
1.  Agent reads `liquid-design/SKILL.md` to learn about Glass materials.
2.  Agent modifies a component.
3.  Plugin Hook `PostToolUse` automatically runs `audit.ts` to verify the work against the Skill's rules.

---

## What Are Agent Skills?

Agent Skills are markdown files that teach Claude how to perform specific tasks. When you ask Claude something that matches a Skill's purpose, Claude automatically applies it.

### How Skills Work

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Skill Lifecycle                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DISCOVERY (Startup)                                                 │
│     └──▶ Claude loads only name + description of each Skill            │
│     └──▶ Fast startup, enough context to match requests                │
│                                                                         │
│  2. ACTIVATION (Request Match)                                          │
│     └──▶ User request matches Skill description                        │
│     └──▶ Claude asks to use the Skill                                  │
│     └──▶ User confirms (or auto-approve in some cases)                 │
│                                                                         │
│  3. EXECUTION (Apply Knowledge)                                         │
│     └──▶ Claude loads full Skill content                               │
│     └──▶ Follows Skill instructions                                    │
│     └──▶ Loads referenced files as needed                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Skill File Structure

```
skill-name/
├── SKILL.md              # Required: Name, description, essential instructions
├── reference.md          # Optional: Detailed API docs
├── examples.md           # Optional: Usage examples
├── patterns.md           # Optional: Advanced patterns
└── scripts/
    └── helper.*          # Optional: Utility scripts (zero-context execution)
```

### SKILL.md Frontmatter

```yaml
---
name: skill-name              # Required: lowercase, hyphens only, max 64 chars
description: "What this does and when to use it. Include trigger keywords."
allowed-tools:                # Optional: Restrict tools for this skill
  - Read
  - write_to_file
  - execute_command
model:                        # Optional: Specific model to use
context: fork                 # Optional: Run in isolated sub-agent
user-invocable: true          # Optional: Show in slash menu (default: true)
---
```

### Where Skills Live

| Location | Path | Applies To |
|----------|------|------------|
| **Project** | `LiquidSkills/` | Anyone working in this repository |
| **Personal** | `~/.claude/plugins/` | You, across all projects |
| **Enterprise** | Managed settings | All users in organization |

**Project Skills** are used for this design system, stored in `.claude/skills/`.

---

## Liquid Glass Skills Ecosystem

```
LiquidSkills/
├── _registry.md                      # ROOT INDEX
├── liquid-design/                    # ✅ DONE - UI generation & Audit Hooks
├── liquid-agency/                    # ✅ DONE - Meta-orchestration
├── vendor/                           # ✅ DONE - code-simplifier, etc.
├── design-system-usage/              # Design patterns & component selection
├── glass-theming/                    # CSS variables & Tailwind config
├── glass-accessibility/              # A11y patterns & focus management
├── glass-animation/                  # Motion design & easings
├── glass-responsive/                 # Mobile-first & breakpoints
├── glass-testing/                    # Vitest & Chromatic patterns
├── glass-authoring/                  # Creating new components
├── glass-migration/                  # Upgrading between versions
├── trading-components/               # Domain-specific trading UI
├── glass-troubleshooting/            # Debugging common issues
├── glass-ai/                         # AI integration patterns
└── glass-storybook/                  # Documentation patterns
```

### Skill Priority Matrix

| Skill | Impact | Effort | Priority |
|-------|--------|--------|----------|
| UI Generation | High | Low | ✅ **Done** |
| Design System Usage | High | Low | 🔴 High |
| Component Authoring | High | Medium | 🔴 High |
| Accessibility | High | Low | 🔴 High |
| Theming | Medium | Low | 🟡 Medium |
| Troubleshooting | High | Low | 🟡 Medium |
| Animation | Low | Low | 🟢 Low |
| Testing | Medium | Medium | 🟢 Low |
| Migration | Low | Low | 🟢 Low |
| Trading Components | Low | Medium | 🟢 Low |
| AI Integration | Medium | Medium | 🟢 Low |
| Storybook | Medium | Low | 🟢 Low |

---

## Skill Implementation Plans

### 1. UI Generation Skill ✅ DONE

**Location:** `.claude/skills/ui-generation/SKILL.md`

**Purpose:** Generate production-ready Glass UI components

**Triggers:**
- "Show analytics/dashboard"
- "Create task board/kanban"
- "Display chart/graph"
- "Show status indicator"
- "Create tabs navigation"
- "Show dialog/popup"

**Content:**
- Component selection matrix (6 components → 6 tool names)
- Tool argument schemas
- Copy-paste examples
- Best practices

**Reference:** `directives/ui-generation-skill.md`

---

### 2. Design System Usage Skill

**Location:** `.claude/skills/design-system-usage/SKILL.md`

**Purpose:** Teach when and how to use Glass components correctly

**Triggers:**
- "How do I use the design system?"
- "Which component should I use?"
- "Glass best practices"
- "Material type"
- "Surface vs elevated"

**Content:**

```markdown
# Glass Design System Usage

## Component Selection Guide

| Need | Use This | Not This |
|------|----------|----------|
| Card container | GlassCard | GlassContainer (unless simple) |
| Data display | GlassMetric | Text component |
| Status indicator | GlassBadge | Custom span |
| Navigation tabs | GlassTabs | Custom buttons |

## Material Types

| Type | Use When | Example |
|------|----------|---------|
| surface | Simple containers | Login form |
| elevated | Featured content | Hero card |
| thick | Modal dialogs | Full-screen overlays |
| ultra | Focus areas | Code editor |

## Common Patterns

### Card with header
```tsx
<GlassCard>
  <GlassCard.Header>
    <GlassCard.Title>Title</GlassCard.Title>
  </GlassCard.Header>
  <GlassCard.Content>...</GlassCard.Content>
</GlassCard>
```

### Interactive button
```tsx
<GlassButton variant="primary" size="lg">
  Submit
</GlassButton>
```

## Best Practices

1. **Keep it simple** - Don't overcomplicate
2. **Use variants** - Match component to context
3. **Test on mobile** - Touch targets ≥44px
4. **Consider contrast** - Glass overlays need legible text
```

---

### 3. Theming Skill

**Location:** `.claude/skills/glass-theming/SKILL.md`

**Purpose:** Customize Glass appearance (colors, fonts, spacing)

**Triggers:**
- "Customize colors"
- "Create custom theme"
- "Tailwind config"
- "CSS variables"

**Content:**
- CSS custom properties hierarchy
- Tailwind config structure
- Dark/light mode switching
- Custom palette creation
- Font stack configuration

**Reference File:** `docs/GLASS_THEMING.md`

---

### 4. Accessibility Skill

**Location:** `.claude/skills/glass-accessibility/SKILL.md`

**Purpose:** Ensure Glass components are accessible

**Triggers:**
- "Make this accessible"
- "A11y"
- "Keyboard navigation"
- "Screen reader"
- "Focus management"

**Content:**
- Focus-visible patterns (already implemented in GlassContainer)
- Color contrast for glass overlays (4.5:1 minimum)
- ARIA attributes for interactive components
- Keyboard navigation patterns
- Reduced motion support
- Touch target sizes (44px minimum)

**Reference File:** `docs/ACCESSIBILITY.md`

---

### 5. Animation Skill

**Location:** `.claude/skills/glass-animation/SKILL.md`

**Purpose:** Apply appropriate motion to Glass components

**Triggers:**
- "Add animation"
- "Motion design"
- "Transition effects"
- "How to animate"

**Content:**
- Animation philosophy (glass should feel "heavy")
- Duration guidelines:
  - Micro-interactions: 150-200ms
  - Transitions: 250-400ms
  - Page changes: 400-600ms
- Easing curves:
  - Ease-out for entrances
  - Ease-in for exits
  - Ease-in-out for state changes
- Reduced motion support (respect `prefers-reduced-motion`)
- Framer Motion patterns

---

### 6. Responsive Design Skill

**Location:** `.claude/skills/glass-responsive/SKILL.md`

**Purpose:** Build responsive Glass interfaces

**Triggers:**
- "Make this responsive"
- "Mobile support"
- "Breakpoints"
- "Container queries"

**Content:**
- Breakpoint usage (`sm`, `md`, `lg`, `xl`, `2xl`)
- Container queries (`@tailwindcss/container-queries`)
- Mobile-first approach
- Touch-friendly sizes (44px minimum)
- Responsive typography
- Adaptive layouts

---

### 7. Testing Skill

**Location:** `.claude/skills/glass-testing/SKILL.md`

**Purpose:** Test Glass components effectively

**Triggers:**
- "Write tests"
- "Component testing"
- "Visual regression"
- "How to test"

**Content:**
- Vitest setup for Glass components
- Testing accessibility with jest-axe
- Visual regression testing with Chromatic
- Snapshot testing considerations
- Mocking patterns
- Test coverage guidelines

---

### 8. Component Authoring Skill

**Location:** `.claude/skills/glass-authoring/SKILL.md`

**Purpose:** Create new Glass components

**Triggers:**
- "Create a new component"
- "Add new button"
- "Component structure"
- "New Glass component"

**Content:**
- Required files structure:
  ```
  src/components/NewComponent/
  ├── NewComponent.tsx         # Main component
  ├── NewComponent.stories.tsx # Storybook
  ├── NewComponent.test.tsx    # Tests
  ├── index.ts                 # Exports
  └── NewComponent.md          # Documentation
  ```
- Prop naming conventions
- Storybook CSF3 patterns
- Export patterns
- TypeScript generics usage
- Documentation templates

---

### 9. Migration Skill

**Location:** `.claude/skills/glass-migration/SKILL.md`

**Purpose:** Upgrade between design system versions

**Triggers:**
- "Migrate to v2"
- "Breaking changes"
- "Upgrade guide"
- "Deprecated"

**Content:**
- Version-by-version breaking changes
- Migration scripts
- Deprecation warnings handling
- Compatibility modes
- Update patterns

---

### 10. Trading Components Skill

**Location:** `.claude/skills/trading-components/SKILL.md`

**Purpose:** Use domain-specific trading UI components

**Triggers:**
- "Trading chart"
- "Show portfolio"
- "Order book"
- "Position tracking"
- "Price ticker"

**Content:**
- GlassCandlestickChart usage
- Real-time data integration patterns
- Performance optimization for high-frequency updates
- Trading-specific components:
  - Ticker display
  - Order book
  - Position tracker
  - Trade history
  - Portfolio summary

---

### 11. Troubleshooting Skill

**Location:** `.claude/skills/glass-troubleshooting/SKILL.md`

**Purpose:** Debug common Glass issues

**Triggers:**
- "Glass not rendering"
- "Blur not working"
- "Performance issues"
- "Debug Glass"
- "Why is this slow?"

**Content:**
- Backdrop blur not showing (check browser support)
- Z-index layering issues
- Performance problems (large blur radii)
- SSR hydration mismatches
- TypeScript errors
- Common fix patterns

---

### 12. AI Integration Skill

**Location:** `.claude/skills/glass-ai/SKILL.md`

**Purpose:** Integrate AI with Glass components

**Triggers:**
- "Add AI feature"
- "Smart component"
- "AI enhancement"
- "Liquid Engine"

**Content:**
- When to use Generative vs SmartGlass vs Agentic
- Liquid Engine patterns
- Tool call best practices
- Caching strategies
- Multi-provider support (Gemini, Claude)

---

### 13. Storybook Documentation Skill

**Location:** `.claude/skills/glass-storybook/SKILL.md`

**Purpose:** Document Glass components effectively

**Triggers:**
- "Document component"
- "Add Storybook"
- "Component stories"
- "Storybook patterns"

**Content:**
- Storybook CSF3 patterns
- Args/argTypes configuration
- Auto-generated docs
- Story parameters
- Documentation templates

---

## General Skill Guidelines

### Writing Effective Descriptions

The `description` field is critical. It determines when Claude activates the Skill.

**Good Description:**
```yaml
description: "Generate production-ready Liquid Glass UI components including dashboards, charts, modals, badges, tabs, and kanban boards. Use when user asks for analytics views, data visualization, or interactive UI elements."
```

**Bad Description:**
```yaml
description: "Helps with UI components."
```

**Description Formula:**
1. **What** does this Skill do?
2. **When** should Claude use it?
3. **Include** trigger keywords users would naturally say

### Progressive Disclosure Pattern

Keep `SKILL.md` under 500 lines. Put detailed reference material in separate files:

```
skill-name/
├── SKILL.md              # 50-100 lines: Quick reference
├── reference.md          # 200+ lines: Full API docs
├── examples.md           # 150+ lines: Usage examples
└── patterns.md           # 200+ lines: Advanced patterns
```

Claude loads supporting files only when the task requires them.

### Tool Restrictions

Use `allowed-tools` for security-sensitive or scope-limited Skills:

```yaml
---
name: read-only-analysis
description: Analyze files without making changes. Use for code review and analysis tasks.
allowed-tools:
  - Read
  - Grep
  - Glob
  - search_files
---
```

### Skill Conflict Resolution

If multiple Skills could apply, Claude uses the most specific description. Avoid overlapping trigger terms.

---

## Progressive Disclosure Strategy

Progressive disclosure keeps context focused by revealing complexity on demand.

### Where to Apply

| Area | Quick Reference | Full Documentation |
|------|-----------------|-------------------|
| **Skills** | `SKILL.md` (100 lines) | `reference.md`, `examples.md` |
| **Component Docs** | Storybook intro | Full API docs |
| **API Docs** | Endpoint table | Per-endpoint docs |
| **Design Tokens** | Core tokens (50) | Complete reference |
| **Directives** | Quick start | Troubleshooting |

### Pattern Examples

**Quick → Detailed:**
```markdown
# GlassCard

**Quick:** Use for content containers with optional header/footer.

**Details:** See [GlassCard Guide](../../components/GlassCard.md)
```

**Links to References:**
```markdown
For complete API details, see [reference.md](reference.md).
For usage examples, see [examples.md](examples.md).
For advanced patterns, see [patterns.md](patterns.md).
```

---

## Implementation Roadmap

### Phase 1: Core Skills (Week 1)

| Skill | Files | Owner |
|-------|-------|-------|
| UI Generation ✅ | SKILL.md, directives/ | Done |
| Design System Usage | SKILL.md, guide.md | Create |
| Accessibility | SKILL.md, guide.md | Create |

### Phase 2: Development Skills (Week 2)

| Skill | Files | Owner |
|-------|-------|-------|
| Component Authoring | SKILL.md, template.md | Create |
| Theming | SKILL.md, guide.md | Create |
| Testing | SKILL.md, guide.md | Create |

### Phase 3: Advanced Skills (Week 3)

| Skill | Files | Owner |
|-------|-------|-------|
| Animation | SKILL.md, guide.md | Create |
| Responsive | SKILL.md, guide.md | Create |
| Troubleshooting | SKILL.md, guide.md | Create |

### Phase 4: Domain & Integration (Week 4)

| Skill ||-------|-------| Files | Owner |
-------|
| Trading Components | SKILL.md, guide.md | Create |
| AI Integration | SKILL.md, guide.md | Create |
| Migration | SKILL.md, guide.md | Create |

---

## Best Practices

### 1. Keep Skills Focused

Each Skill should do one thing well. Don't try to cover everything in one Skill.

### 2. Use Real Examples

Include copy-pasteable code examples that work out of the box.

### 3. Update Regularly

When patterns change, update the Skill. Include a "Last Updated" date.

### 4. Test Triggering

Ask Claude to perform tasks and verify the correct Skill activates.

### 5. Document Edge Cases

Cover "gotchas" and common mistakes in each Skill.

---

## Troubleshooting

### Skill Not Triggering

1. **Check description keywords** - Use terms users would naturally say
2. **Verify file path** - Must be `.claude/skills/skill-name/SKILL.md`
3. **Check YAML syntax** - Frontmatter must be valid
4. **Restart Claude** - New Skills may need a restart

### Skill Loading Errors

1. **YAML validation** - Use spaces, not tabs
2. **File encoding** - Use UTF-8
3. **File naming** - Must be exactly `SKILL.md`

### Multiple Skills Activating

1. **Make descriptions distinct** - Avoid overlapping keywords
2. **Prioritize by specificity** - More specific descriptions win
3. **Remove duplicates** - Delete unused Skills

---

## Related Documentation

- [Architecture](../ARCHITECTURE.md) - System architecture
- [Design Tokens](../DESIGN_TOKENS.md) - Token reference
- [Accessibility](../
