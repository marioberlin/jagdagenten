# Liquid Glass Generative UI Patterns

> **Status**: Extension of [liquid-design/SKILL.md](file:///Users/mario/projects/LiquidCrypto/LiquidSkills/liquid-design/SKILL.md)
> **Goal**: Provide deterministic schemas and patterns for AI-generated UI.

This document teaches agents how to generate high-level Glass-styled components.

## 1. Component selection Matrix

Use this matrix to select the right generative component:

| User Request | Component | Tool Name | Args Shape |
|-------------|-----------|-----------|------------|
| "Show analytics/dashboard" | GlassSmartDashboard | `generate_dashboard` | `{ title, layout, widgets }` |
| "Create task board/sprint" | GlassSmartKanban | `generate_kanban` | `{ title, columns, cards }` |
| "Display chart/graph/data" | GlassSmartChart | `generate_chart` | `{ type, title, data }` |
| "Show status indicator" | GlassSmartBadge | `generate_badge` | `{ type, text, variant }` |
| "Create tabs navigation" | GlassSmartTabs | `generate_tabs` | `{ title, tabs, variant }` |
| "Show dialog/popup" | GlassSmartModal | `generate_modal` | `{ title, body, actions }` |

---

## 2. Tool Definitions & Schemas

### generate_dashboard
```typescript
{
  name: "generate_dashboard",
  description: "Create a Glass-styled analytics dashboard with widgets",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      subtitle: { type: "string" },
      layout: { type: "string", enum: ["grid", "bento", "masonry"] },
      widgets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { enum: ["metric", "chart", "table", "list", "progress", "status"] },
            title: { type: "string" },
            span: { type: "number", default: 1 },
            data: { type: "object" }
          }
        }
      }
    }
  }
}
```

### generate_kanban
```typescript
{
  name: "generate_kanban",
  description: "Create a Glass-styled kanban/task board",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      columns: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            cards: { type: "array" }
          }
        }
      }
    }
  }
}
```

## 3. Implementation Workflow
1.  **Selection**: Pick the component from the matrix.
2.  **Schema Compliance**: Ensure the `args` strictly match the inputSchema above.
3.  **Visual Harmony**: Always use the **Technical Constants** (Blur/Spacing) defined in the parent skill.
