# Agent UX Configuration - Quick Reference

> One-page reference for configuring agent chat experiences

## File Location

```
src/applications/agent-chat/agentUX_{agent-id}.md
```

## Minimal Configuration

```yaml
---
version: "1.0"
displayName: "My Agent"

theme:
  accentColor: "#6366f1"
  messageStyle: glass

quickActions:
  - label: "Help"
    value: "Show me what you can do"
    icon: "HelpCircle"
---
```

## Full Configuration Template

```yaml
---
version: "1.0"
displayName: "Agent Name"

theme:
  accentColor: "#6366f1"
  secondaryColor: "#818cf8"
  messageStyle: glass          # glass | bubble | minimal
  avatarStyle: circle          # circle | rounded | square
  glassEffects: true
  backgroundImage: "agent-id"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark              # dark | light
  mathRendering: false

input:
  placeholder: "Ask me anything..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - image/*
    - application/pdf
  maxFileSize: 10
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic  # semantic | heuristic | agent-defined | none
  maxSuggestions: 4
  suggestionLayout: horizontal  # horizontal | vertical | grid

quickActions:
  - label: "Action"
    value: "Message to send"
    icon: "Sparkles"
    description: "Tooltip"
---
```

## React Hook Usage

```typescript
import { useAgentUXConfig } from '@/applications/agent-chat/ux';

function MyComponent({ agentId }) {
  const { config, isLoading, error } = useAgentUXConfig(agentId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <div style={{ color: config?.theme?.accentColor }}>
      {config?.quickActions?.map(action => (
        <Button key={action.label}>{action.label}</Button>
      ))}
    </div>
  );
}
```

## Suggestion Strategies

| Strategy | Speed | Intelligence | Use Case |
|----------|-------|--------------|----------|
| `semantic` | Slow | High | Complex reasoning |
| `heuristic` | Fast | Medium | Pattern matching |
| `agent-defined` | N/A | Varies | Server-provided |
| `none` | N/A | N/A | Minimal UI |

## Common Icons

| Category | Icons |
|----------|-------|
| Actions | `Play`, `Pause`, `RefreshCw`, `Send`, `Download` |
| Communication | `MessageSquare`, `Mail`, `Bell`, `Phone` |
| Data | `Database`, `BarChart`, `PieChart`, `TrendingUp` |
| Files | `File`, `FileText`, `Folder`, `Image` |
| Navigation | `Home`, `Search`, `Settings`, `Menu` |
| Status | `Check`, `X`, `AlertTriangle`, `Info` |
| Finance | `DollarSign`, `Wallet`, `CreditCard`, `TrendingUp` |

## Color Presets by Category

| Category | Primary | Secondary |
|----------|---------|-----------|
| Finance | `#F7931A` | `#FCD34D` |
| Security | `#DC2626` | `#EF4444` |
| Data | `#10B981` | `#34D399` |
| Creative | `#EC4899` | `#F472B6` |
| Utility | `#6366F1` | `#818CF8` |
| Research | `#3B82F6` | `#60A5FA` |

## File Discovery

Configs are discovered at build time via `import.meta.glob`:

```typescript
// loader.ts
const modules = import.meta.glob('./agentUX_*.md', {
  eager: true,
  as: 'raw'
});
```

## Adding a New Agent

1. Create `src/applications/agent-chat/agentUX_{agent-id}.md`
2. Add YAML frontmatter with at least `version`, `displayName`, `theme.accentColor`
3. Restart dev server (Vite hot reload detects new files)
4. Config auto-loads when agent chat opens

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Config not loading | Check filename matches `agentUX_{agent-id}.md` |
| YAML parse error | Validate YAML syntax, check for tabs vs spaces |
| Icon not showing | Verify icon name exists in Lucide React |
| Colors not applying | Ensure hex format `#RRGGBB` |

## Related Files

| File | Purpose |
|------|---------|
| `ux/schema.ts` | Zod validation |
| `ux/parser.ts` | YAML parser |
| `ux/loader.ts` | Static file loader |
| `ux/index.ts` | React hook |
| `AgentUXConfigEditor.tsx` | Visual editor |

---

**Full Documentation:** [agent-ux-system.md](./agent-ux-system.md)
