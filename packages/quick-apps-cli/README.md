# @liquidcrypto/quick-apps-cli

CLI tool for creating, testing, and publishing LiquidOS Quick Apps.

## Installation

```bash
# Install globally
bun install -g @liquidcrypto/quick-apps-cli

# Or use npx
npx @liquidcrypto/quick-apps-cli <command>
```

## Commands

### Create a new Quick App

```bash
quick-app new "My App Name"

# With options
quick-app new "Timer App" --template with-store --category productivity
```

Templates:
- `basic` - Simple counter app (default)
- `with-store` - App with persistent storage
- `with-settings` - App with settings panel

### Development Server

Start a development server with hot reload:

```bash
quick-app dev

# With options
quick-app dev --file my-app.app.md --port 5050
```

### Build & Validate

Compile and validate your Quick App:

```bash
quick-app build

# With output
quick-app build --file my-app.app.md --output dist/app.js
```

### Preview

Preview your app in a browser:

```bash
quick-app preview

# With options
quick-app preview --file my-app.app.md --port 5051
```

### Export to Full App

Export your Quick App to a full application structure:

```bash
quick-app export

# With options
quick-app export --file my-app.app.md --output ./my-full-app
```

## Quick App Format

Quick Apps use the APP.md format:

```markdown
---
name: My App
icon: Star
category: utilities
window: floating
size: [400, 300]
---

# My App

A brief description of your app.

## UI

\`\`\`tsx App
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`
```

## Available Hooks

Quick Apps have access to these runtime hooks:

- `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef` - React hooks
- `useStorage(key, default)` - Persistent localStorage storage
- `useNotification()` - System notifications (`{ notify }`)
- `useTheme()` - Theme access (`{ theme, setTheme }`)
- `useClipboard()` - Clipboard access (`{ copy, paste }`)

## Code Blocks

- `\`\`\`tsx App` - Main app component (required)
- `\`\`\`tsx helpers` - Helper functions
- `\`\`\`tsx store` - Zustand store definition
- `\`\`\`tsx settings` - Settings panel component
- `\`\`\`css` - Custom CSS styles

## License

MIT
