# Agent UX Configuration System

> Per-agent customization for chat windows, themes, and user interaction patterns.

## Overview

The Agent UX Configuration System provides a declarative way to customize the look, feel, and behavior of individual agent chat windows. Each agent can have its own theme colors, background images, input configurations, contextual UI behaviors, and quick action buttons.

## Architecture

```
src/applications/agent-chat/
├── ux/
│   ├── index.ts          # Public exports
│   ├── schema.ts         # TypeScript types and defaults
│   ├── parser.ts         # YAML frontmatter parser
│   └── loader.ts         # Config loading and React hook
├── agentUX_default.md    # Default configuration
├── agentUX_{agent-id}.md # Per-agent configurations (24 files)
└── ...

src/components/agents/
├── AgentChatWindow.tsx       # Main chat component (uses UX config)
├── AgentUXConfigEditor.tsx   # Visual config editor
└── contextualUIGenerator.ts  # Smart suggestion generation
```

## Quick Start

### Using UX Config in Components

```tsx
import { useAgentUXConfig } from '@/applications/agent-chat/ux';

function MyComponent({ agentId }) {
    const { config, isLoading, error } = useAgentUXConfig(agentId);

    if (isLoading) return <Loading />;

    // Access configuration
    const accentColor = config?.theme?.accentColor || '#6366F1';
    const placeholder = config?.input?.placeholder || 'Type a message...';
    const quickActions = config?.quickActions || [];

    return (
        <div style={{ borderColor: accentColor }}>
            <input placeholder={placeholder} />
            {quickActions.map(action => (
                <button key={action.label}>{action.label}</button>
            ))}
        </div>
    );
}
```

### Creating an Agent UX Config

Create a file at `src/applications/agent-chat/agentUX_{agent-id}.md`:

```markdown
---
version: "1.0"
displayName: "My Agent"

theme:
  accentColor: "#6366F1"
  secondaryColor: "#8B5CF6"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "my-agent"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark

input:
  placeholder: "Ask me anything..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Help"
    value: "I need help"
    icon: "HelpCircle"
    description: "Get assistance"
  - label: "Examples"
    value: "Show me examples"
    icon: "BookOpen"
    description: "See example queries"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# My Agent UX Configuration

Additional markdown documentation about this agent's UX can go here.
```

## Configuration Reference

### Theme Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `accentColor` | `string` | `#6366F1` | Primary accent color (hex) |
| `secondaryColor` | `string` | `#8B5CF6` | Secondary color for gradients |
| `messageStyle` | `'glass' \| 'solid' \| 'minimal' \| 'retro'` | `glass` | Message bubble styling |
| `avatarStyle` | `'rounded' \| 'square' \| 'circle'` | `rounded` | Avatar shape |
| `glassEffects` | `boolean` | `true` | Enable glassmorphism |
| `backgroundImage` | `string \| null` | `null` | Background image name (without path/extension) |

**Message Styles:**
- `glass`: Translucent with blur effect (default)
- `solid`: Opaque background
- `minimal`: Borderless, subtle styling
- `retro`: 80s/synthwave aesthetic

**Background Images:**
- Images are loaded from `/images/backgrounds/{name}.png`
- If the image doesn't exist, it gracefully hides
- An accent color tint overlay is applied automatically

### Formatting Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `markdown` | `boolean` | `true` | Enable markdown parsing |
| `emojiToIcons` | `boolean` | `true` | Replace emojis with Lucide icons |
| `codeHighlighting` | `boolean` | `true` | Syntax highlighting for code blocks |
| `codeTheme` | `'dark' \| 'light' \| 'auto'` | `dark` | Code block theme |
| `mathRendering` | `boolean` | `false` | Enable LaTeX/math rendering |
| `maxMessageLength` | `number` | `10000` | Max characters before truncation |

### Input Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | `string` | `'Type a message...'` | Input placeholder text |
| `voiceEnabled` | `boolean` | `true` | Show voice input button |
| `fileUpload` | `boolean` | `false` | Enable file attachments |
| `allowedFileTypes` | `string[]` | `[]` | MIME types allowed for upload |
| `maxFileSize` | `number` | `10` | Max file size in MB |
| `multiline` | `boolean` | `false` | Allow multiline input |
| `showCharCount` | `boolean` | `false` | Show character counter |
| `maxLength` | `number` | `4000` | Maximum input length |

### Contextual UI Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `suggestionsEnabled` | `boolean` | `true` | Enable suggestion buttons |
| `suggestionStrategy` | `SuggestionStrategy` | `'semantic'` | How to generate suggestions |
| `maxSuggestions` | `number` | `4` | Max suggestion buttons |
| `suggestionLayout` | `'horizontal' \| 'vertical' \| 'grid'` | `'horizontal'` | Button layout |

**Suggestion Strategies:**
- `semantic`: AI-powered smart suggestions based on message content analysis
- `heuristic`: Rule-based quick suggestions (faster, less context-aware)
- `agent-defined`: Only show suggestions provided by the agent via A2UI
- `none`: Disable all client-side suggestions

### Quick Actions

Quick action buttons appear above the input field for common operations.

```yaml
quickActions:
  - label: "Search"           # Button text
    value: "Search for..."    # Message sent when clicked
    icon: "Search"            # Lucide icon name
    description: "Search"     # Tooltip text
```

**Available Icons:**
All Lucide icons are supported. Common ones:
- Navigation: `Search`, `Home`, `Settings`, `Menu`
- Actions: `Play`, `Pause`, `Plus`, `Trash2`, `Download`
- Communication: `Bell`, `MessageSquare`, `Mail`
- Data: `BarChart`, `PieChart`, `TrendingUp`, `Activity`
- Finance: `Wallet`, `CreditCard`, `DollarSign`, `Bitcoin`
- See full list at: https://lucide.dev/icons/

### Response Parsing Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `parseFormat` | `'markdown' \| 'json' \| 'plain' \| 'auto'` | `'auto'` | How to parse agent responses |
| `extractStructuredData` | `boolean` | `true` | Extract structured data |
| `enableA2UI` | `boolean` | `true` | Enable A2UI component rendering |

## API Reference

### `useAgentUXConfig(agentId: string | null)`

React hook to load an agent's UX configuration.

```typescript
const { config, isLoading, error } = useAgentUXConfig('my-agent');
```

**Returns:**
- `config: AgentUXConfig | null` - The loaded configuration
- `isLoading: boolean` - Loading state
- `error: Error | null` - Any loading error

### `loadAgentUXConfig(agentId: string): Promise<AgentUXConfig>`

Async function to load configuration programmatically.

```typescript
const config = await loadAgentUXConfig('my-agent');
```

### `hasAgentUXConfig(agentId: string): boolean`

Check if an agent has a custom UX config file.

```typescript
if (hasAgentUXConfig('my-agent')) {
    // Agent has custom config
}
```

### `getAvailableAgentUXConfigs(): string[]`

Get all agent IDs that have custom UX config files.

```typescript
const agentIds = getAvailableAgentUXConfigs();
// ['restaurant-finder', 'crypto-advisor', ...]
```

### `clearUXConfigCache(agentId?: string)`

Clear cached configurations to force reload.

```typescript
clearUXConfigCache('my-agent'); // Clear specific agent
clearUXConfigCache();           // Clear all
```

## AgentChatWindow Integration

The `AgentChatWindow` component automatically uses the UX configuration system:

```tsx
<AgentChatWindow
    agent={agent}
    position={{ x: 200, y: 100 }}
    onClose={() => {}}
/>
```

**What the config affects:**
1. **Background**: Custom image with accent color tint
2. **Message bubbles**: Style based on `messageStyle`
3. **Input field**: Custom placeholder text
4. **Quick actions**: Configurable buttons above input
5. **Suggestions**: Strategy-based contextual buttons
6. **File upload**: Enabled/disabled based on config

## UX Config Editor

A visual editor component is available for runtime configuration:

```tsx
import { AgentUXConfigEditor } from '@/components/agents/AgentUXConfigEditor';

<AgentUXConfigEditor
    agentId="my-agent"
    agentName="My Agent"
    agentColor="#6366F1"
    onSave={(config) => console.log('Saved:', config)}
    onClose={() => {}}
/>
```

**Features:**
- Theme color picker with presets
- Message style selector
- Input options toggles
- Suggestion strategy configuration
- Quick action editor (add/edit/remove)

## Background Generation

A script is provided to generate unique backgrounds for agents:

```bash
# Generate for all agents
bun run scripts/generate-agent-backgrounds.ts

# Generate for specific agent
bun run scripts/generate-agent-backgrounds.ts crypto-advisor
```

The script uses NanoBanana to create contextually appropriate backgrounds based on each agent's purpose and aesthetic.

## File Loading Mechanism

The system uses Vite's `import.meta.glob` for static file discovery:

```typescript
// Automatically discovers all agentUX_*.md files at build time
const uxModules = import.meta.glob('/src/applications/agent-chat/agentUX_*.md', {
    query: '?raw',
    import: 'default',
});
```

**Benefits:**
- No runtime file system access needed
- Works in browser environment
- Tree-shaking removes unused configs
- Type-safe loading

## Caching

Configurations are cached in memory after first load:

```typescript
// First call: loads and parses file
const config1 = await loadAgentUXConfig('my-agent');

// Second call: returns cached version
const config2 = await loadAgentUXConfig('my-agent');
```

Clear cache when needed:
```typescript
clearUXConfigCache('my-agent');
```

## Default Configuration

If an agent doesn't have a custom config file, the system falls back to:

1. `agentUX_default.md` (if exists)
2. `DEFAULT_AGENT_UX_CONFIG` (hardcoded)

```typescript
export const DEFAULT_AGENT_UX_CONFIG: AgentUXConfig = {
    version: '1.0',
    agent: 'default',
    theme: {
        accentColor: '#6366f1',
        messageStyle: 'glass',
        avatarStyle: 'rounded',
        glassEffects: true,
    },
    formatting: {
        markdown: true,
        emojiToIcons: true,
        codeHighlighting: true,
        codeTheme: 'dark',
    },
    input: {
        voiceEnabled: true,
        fileUpload: false,
        multiline: false,
    },
    contextualUI: {
        suggestionsEnabled: true,
        suggestionStrategy: 'heuristic',
        maxSuggestions: 4,
        suggestionLayout: 'horizontal',
    },
    quickActions: [],
    responseParsing: {
        parseFormat: 'auto',
        enableA2UI: true,
    },
};
```

## Best Practices

### 1. Use Semantic Colors

Choose accent colors that reflect the agent's purpose:
- Finance: Gold, green, blue
- Security: Red, orange
- Creative: Purple, pink
- Technical: Cyan, indigo

### 2. Appropriate Suggestions

Match suggestion strategy to agent type:
- Complex agents: `semantic`
- Simple utilities: `heuristic`
- Structured workflows: `agent-defined`
- Minimal UI: `none`

### 3. Quick Actions for Common Tasks

Add quick actions for the top 3-4 operations users perform:

```yaml
quickActions:
  - label: "Search"
    value: "Search for"
    icon: "Search"
  - label: "Help"
    value: "How do I use this?"
    icon: "HelpCircle"
```

### 4. Enable File Upload Only When Needed

Only enable `fileUpload` if the agent actually processes files:

```yaml
input:
  fileUpload: true
  allowedFileTypes:
    - image/jpeg
    - image/png
    - application/pdf
  maxFileSize: 10
```

### 5. Custom Backgrounds

Create backgrounds that:
- Are subtle (opacity is reduced to 50%)
- Have good contrast with text
- Reflect the agent's domain
- Are 1920x1080 PNG files

## Troubleshooting

### Config not loading

1. Check file name: `agentUX_{exact-agent-id}.md`
2. Verify YAML syntax (no tabs, proper indentation)
3. Clear cache: `clearUXConfigCache()`

### Background not showing

1. Check file exists: `/public/images/backgrounds/{name}.png`
2. Verify `backgroundImage` matches filename (without extension)
3. Check browser console for 404 errors

### Quick actions not appearing

1. Verify `quickActions` array syntax
2. Check icon names are valid Lucide icons
3. Ensure agent is connected (`isConnected: true`)

### TypeScript errors

Import types explicitly:
```typescript
import type {
    AgentUXConfig,
    ThemeConfig,
    SuggestionStrategy
} from '@/applications/agent-chat/ux';
```

## Related Documentation

- [A2UI Protocol](./a2ui.md) - Agent-to-UI communication
- [Agent Registry](../services/agents/registry.md) - Agent discovery
- [Glass Components](../components/glass.md) - UI component library
