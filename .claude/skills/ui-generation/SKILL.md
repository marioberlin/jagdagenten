---
name: liquid-glass-ui-generation
description: Generate production-ready Liquid Glass UI components. Use when user asks for dashboards, charts, modals, badges, tabs, kanban boards, or any analytics/data visualization UI.
---

# Liquid Glass UI Generation

## Quick Reference

| User Request | Component | Tool Name |
|-------------|-----------|-----------|
| "Show analytics/dashboard" | GlassSmartDashboard | `generate_dashboard` |
| "Create task board/sprint" | GlassSmartKanban | `generate_kanban` |
| "Display chart/graph/data" | GlassSmartChart | `generate_chart` |
| "Show status indicator" | GlassSmartBadge | `generate_badge` |
| "Create tabs navigation" | GlassSmartTabs | `generate_tabs` |
| "Show dialog/popup" | GlassSmartModal | `generate_modal` |

## Tool Args Reference

### generate_dashboard
- `title`: string
- `layout`: "grid" | "bento" | "masonry" (default: bento)
- `widgets`: Array of { type, title, span, data }
- Widget types: metric, chart, table, list, progress, status

### generate_kanban
- `title`: string
- `columns`: Array of { id, title, color, cards }
- Card fields: id, title, description, tags, priority, assignee, dueDate

### generate_chart
- `type`: "line" | "bar" | "area" | "donut"
- `title`: string
- `data`: Array of { x, y, label }

### generate_badge
- `type`: "success" | "warning" | "error" | "info" | "pending" | "neutral"
- `text`: string
- `size`: "sm" | "md"

### generate_tabs
- `title`: string
- `tabs`: Array of { id, label, icon, disabled, badge }
- `variant`: "pills" | "underline" | "enclosed"

### generate_modal
- `title`: string
- `body`: string
- `size`: "sm" | "md" | "lg" | "xl" | "full"
- `actions`: Array of { id, label, variant }

## Common Patterns

### Dashboard (4 metrics + chart)
```typescript
{
  name: "generate_dashboard",
  args: {
    title: "Overview",
    layout: "bento",
    widgets: [
      { type: "metric", title: "Revenue", span: 1, data: { value: "$45K", trend: "+12%" }},
      { type: "metric", title: "Users", span: 1, data: { value: "1.2K", trend: "+5%" }},
      { type: "metric", title: "Conversion", span: 1, data: { value: "3.42%" }},
      { type: "metric", title: "Active", span: 1, data: { value: "892" }},
      { type: "chart", title: "Weekly", span: 2, data: { type: "bar", points: [...] }}
    ]
  }
}
```

### Kanban (4 columns)
```typescript
{
  name: "generate_kanban",
  args: {
    title: "Sprint Board",
    columns: [
      { id: "todo", title: "To Do", color: "#8b5cf6", cards: [...] },
      { id: "progress", title: "In Progress", color: "#f59e0b", cards: [...] },
      { id: "review", title: "Review", color: "#06b6d4", cards: [...] },
      { id: "done", title: "Done", color: "#10b981", cards: [...] }
    ]
  }
}
```

### Chart (7 data points)
```typescript
{
  name: "generate_chart",
  args: {
    type: "bar",
    title: "Weekly Data",
    data: [
      { x: "Mon", y: 45 }, { x: "Tue", y: 52 }, { x: "Wed", y: 38 },
      { x: "Thu", y: 65 }, { x: "Fri", y: 72 }, { x: "Sat", y: 58 }, { x: "Sun", y: 41 }
    ]
  }
}
```

## Best Practices

1. **Dashboard**: Use 4-8 widgets, bento layout for mixed content
2. **Kanban**: 4 standard columns (To Do, In Progress, Review, Done)
3. **Chart**: 7 data points for weekly, 12 for monthly
4. **Badge**: Use success/green for positive trends, error/red for negative
5. **Tabs**: Pills for main nav, underline for secondary
6. **Modal**: sm for confirmations, lg for forms, full for full-page

For detailed examples and advanced patterns, see [ui-generation-skill.md](../../directives/ui-generation-skill.md)
