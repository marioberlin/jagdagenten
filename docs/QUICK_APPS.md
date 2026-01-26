# Quick Apps - Zero-Config App Installation for LiquidOS

Quick Apps is a revolutionary feature that allows users to install applications from a single `APP.md` file — no build tools, no manifest.json, no compilation step required. Inspired by Claude Skills, Quick Apps make app distribution as simple as sharing a Markdown file.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [APP.md Format Specification](#appmd-format-specification)
4. [Installation Methods](#installation-methods)
5. [Runtime Environment](#runtime-environment)
6. [Capability Inference](#capability-inference)
7. [Architecture](#architecture)
8. [Creating Quick Apps](#creating-quick-apps)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [API Reference](#api-reference)

---

## Overview

### What is a Quick App?

A Quick App is a self-contained application defined in a single Markdown file (`.app.md`). The file contains:

- **YAML frontmatter** — Minimal configuration (name, icon)
- **Description** — Human-readable documentation
- **React component** — The UI code in a `tsx App` code block
- **Optional extras** — Helpers, store, settings, shortcuts

### Key Benefits

| Feature | Quick Apps | Traditional Apps |
|---------|-----------|------------------|
| Files required | 1 | 5-10+ |
| Build tooling | None | Required |
| Time to create | 5 minutes | 30-60 minutes |
| Distribution | Share a file | Registry upload |
| Installation | Drag & drop | Store → Get → Review |

### Comparison with Claude Skills

Quick Apps are designed to be as simple as Claude Skills:

| Aspect | Claude Skills | Quick Apps |
|--------|--------------|------------|
| Format | `SKILL.md` | `APP.md` |
| Required fields | name, description | name, icon |
| Content | Knowledge/instructions | React UI code |
| Execution | Claude context | Browser sandbox |

---

## Quick Start

### 1. Create an APP.md file

```markdown
---
name: Hello World
icon: Sparkles
---

# Hello World

A simple greeting app.

## UI

```tsx App
export default function App() {
  const [name, setName] = useState('World');

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-white mb-4">
        Hello, {name}!
      </h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-2 bg-white/10 rounded-lg text-white"
        placeholder="Enter name"
      />
    </div>
  );
}
```
```

### 2. Install in LiquidOS

1. Open **App Store** from the dock
2. Click **Quick Apps** in the sidebar
3. Drag your `.app.md` file onto the drop zone
4. Review the preview and click **Install**

### 3. Launch your app

Your app appears in the dock and app launcher immediately after installation.

---

## APP.md Format Specification

### Structure Overview

```markdown
---
# YAML Frontmatter (configuration)
name: My App
icon: Star
---

# App Title

Description paragraph (first text after frontmatter).

## UI

```tsx App
// Your React component
export default function App() { ... }
```

## Optional Sections
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name for the app |
| `icon` | string | Lucide icon name, emoji, or URL |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | `utilities` | App category (productivity, communication, finance, etc.) |
| `tags` | string[] | `[]` | Keywords for search |
| `version` | string | `0.1.0` | Semantic version |
| `author` | string | `Quick App User` | Creator name |
| `license` | string | - | License identifier (MIT, Apache-2.0, etc.) |

### Window Configuration

```yaml
# Simple mode
window: floating  # or: panel, fullscreen

# Detailed mode
window:
  mode: floating
  size: [400, 300]
  resizable: true

# Shorthand
size: [400, 300]
resizable: true
```

| Mode | Description |
|------|-------------|
| `floating` | Draggable window with title bar |
| `panel` | Full-height side panel |
| `fullscreen` | Takes over entire viewport |

### Dock Integration

```yaml
# Add to dock (end position)
dock: true

# Add to dock at specific position
dock: 5

# Show state variable as badge
badge: count
```

### AI Integration

```yaml
ai:
  prompt: "Help users stay focused using the Pomodoro technique"
  agent: pomodoro-coach  # A2A agent ID
```

---

## Code Blocks

### Main App Component (Required)

````markdown
## UI

```tsx App
export default function App() {
  return <div>Hello World</div>;
}
```
````

**Requirements:**
- Language tag must be `tsx App`
- Must have a default export
- Export must be a React function component

### Helper Functions (Optional)

````markdown
## Helpers

```tsx helpers
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```
````

### Zustand Store (Optional)

````markdown
## Store

```tsx store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  count: number;
  increment: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    { name: 'my-app-storage' }
  )
);
```
````

### Settings Panel (Optional)

````markdown
## Settings

```tsx settings
export function Settings() {
  const [darkMode, setDarkMode] = useStorage('darkMode', false);

  return (
    <label>
      <input
        type="checkbox"
        checked={darkMode}
        onChange={(e) => setDarkMode(e.target.checked)}
      />
      Dark Mode
    </label>
  );
}
```
````

### Custom Styles (Optional)

````markdown
## Styles

```css
.timer-display {
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}
```
````

---

## Installation Methods

### 1. Drag & Drop

Drag an `.app.md` file onto the Quick Apps installer drop zone.

### 2. File Picker

Click "browse files" in the Quick Apps installer.

### 3. URL Installation

Enter a URL to an `.app.md` file:
```
https://example.com/apps/pomodoro.app.md
```

### 4. Paste Content

Paste the entire APP.md content directly into the text area.

### 5. Protocol Handler (Coming Soon)

```
liquidOS://install?url=https://example.com/app.md
```

---

## Runtime Environment

### Available Globals

Quick Apps have access to these without imports:

```typescript
// React (no import needed)
useState, useEffect, useCallback, useMemo, useRef, useContext, createContext

// Quick App Hooks
useStorage(key, defaultValue)  // Persistent local storage
useNotification()              // { notify, clearAll }
useTheme()                     // { theme, setTheme }
useClipboard()                 // { copy, paste, copied }

// Utilities
cn(...classes)                 // className merger
formatTime(seconds)            // Time formatting
formatNumber(num, options)     // Number formatting

// Icons (import from lucide-react)
import { Play, Pause, Settings } from 'lucide-react';
```

### useStorage Hook

Persists data to localStorage with automatic serialization:

```tsx
const [count, setCount] = useStorage('count', 0);
const [items, setItems] = useStorage('items', []);
const [settings, setSettings] = useStorage('settings', { sound: true });
```

Data is namespaced per app: `quick-app:{appId}:{key}`

### useNotification Hook

Shows toast notifications:

```tsx
const { notify, clearAll } = useNotification();

// Simple notification
notify('Task completed!');

// With options
notify('Error occurred', {
  title: 'Warning',
  variant: 'destructive'
});

// Clear all notifications
clearAll();
```

### useTheme Hook

Access system theme:

```tsx
const { theme, setTheme } = useTheme();
// theme: 'light' | 'dark'
```

### useClipboard Hook

Clipboard operations:

```tsx
const { copy, paste, copied } = useClipboard();

// Copy text
await copy('Hello World');

// Check if just copied
if (copied) {
  // Show "Copied!" feedback
}

// Paste text
const text = await paste();
```

---

## Capability Inference

Quick Apps automatically detect required capabilities from code patterns:

| Code Pattern | Capability |
|--------------|------------|
| `useStorage()`, `localStorage.` | `storage:local` |
| `fetch()`, `useQuery()` | `network:http` |
| `WebSocket()` | `network:websocket` |
| `useNotification()`, `notify()` | `notification:toast` |
| `useClipboard()`, `navigator.clipboard` | `system:clipboard` |
| `useAgent()`, `useA2A()` | `ai:agent` |
| `navigator.geolocation` | `media:geolocation` |
| `getUserMedia` | `media:camera`, `media:microphone` |

### Explicit Declaration

Override inference with explicit capabilities:

```yaml
---
name: My App
icon: Box
capabilities:
  - storage:local
  - network:http
  - ai:agent
---
```

---

## Architecture

### System Components

```
src/system/quick-apps/
├── parser.ts          # Parses APP.md → structured data
├── compiler.ts        # TypeScript → JavaScript (esbuild-wasm)
├── quickAppStore.ts   # Installation & state management
└── types.ts           # Type definitions

src/applications/_system/app-store/components/
└── QuickAppInstallerView.tsx  # Installation UI
```

### Data Flow

```
APP.md File
    ↓
Parser (YAML + Markdown → ParsedQuickApp)
    ↓
Compiler (TSX → JavaScript via esbuild-wasm)
    ↓
Component Factory (JS → React Component)
    ↓
App Store (Register manifest + component)
    ↓
Dock / App Launcher (Ready to use!)
```

### Compilation Process

1. **Parse** — Extract frontmatter, code blocks, description
2. **Validate** — Check required fields, default export
3. **Wrap** — Inject runtime shims (useStorage, etc.)
4. **Transform** — esbuild-wasm compiles TSX → JS
5. **Bundle** — Create ES module with inline source map
6. **Load** — Dynamic import creates React component
7. **Register** — Add to app store with generated manifest

---

## Creating Quick Apps

### Template: Minimal App

```markdown
---
name: Minimal
icon: Box
---

# Minimal App

The simplest possible Quick App.

## UI

```tsx App
export default function App() {
  return (
    <div className="p-4 text-white">
      <h1>Hello!</h1>
    </div>
  );
}
```
```

### Template: Stateful App

```markdown
---
name: Counter
icon: Plus
category: utilities
dock: true
---

# Counter

A simple counter with persistent state.

## UI

```tsx App
import { Plus, Minus, RotateCcw } from 'lucide-react';

export default function App() {
  const [count, setCount] = useStorage('count', 0);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      <span className="text-6xl font-bold text-white">{count}</span>

      <div className="flex gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
        >
          <Minus size={24} />
        </button>
        <button
          onClick={() => setCount(0)}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
```

## Shortcuts

| Key | Action |
|-----|--------|
| `+` | Increment |
| `-` | Decrement |
| `R` | Reset |
```

### Template: Network App

```markdown
---
name: API Demo
icon: Globe
category: developer
---

# API Demo

Demonstrates network requests.

## UI

```tsx App
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.example.com/data');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={fetchData}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 rounded text-white flex items-center gap-2"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      {data && (
        <pre className="mt-4 p-3 bg-white/10 rounded text-xs text-white/70 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
```
```

---

## Best Practices

### DO

- ✅ Keep apps focused on a single purpose
- ✅ Use `useStorage` for persistence (not `localStorage` directly)
- ✅ Use Tailwind utilities for styling
- ✅ Provide meaningful descriptions
- ✅ Add keyboard shortcuts for common actions
- ✅ Test with different window sizes

### DON'T

- ❌ Import React directly (it's available globally)
- ❌ Use external dependencies (only built-in libraries)
- ❌ Access sensitive APIs without explicit capabilities
- ❌ Create overly complex apps (use Full Apps instead)
- ❌ Hardcode sensitive data in the source

### Size Guidelines

- Ideal: < 5KB of code
- Maximum: < 50KB
- If larger, consider a Full App

### Performance Tips

1. Use `useMemo` for expensive calculations
2. Use `useCallback` for event handlers passed as props
3. Avoid inline object/array literals in JSX
4. Keep component tree shallow

---

## Troubleshooting

### Parse Errors

| Error | Solution |
|-------|----------|
| "Missing YAML frontmatter" | Ensure file starts with `---` |
| "Missing required field: name" | Add `name: Your App` to frontmatter |
| "Missing required field: icon" | Add `icon: IconName` to frontmatter |
| "Missing main component" | Add `## UI` section with `\`\`\`tsx App` block |

### Compilation Errors

| Error | Solution |
|-------|----------|
| "No default export" | Add `export default function App()` |
| "Unexpected token" | Check JSX syntax |
| "Cannot find module" | Use built-in globals instead |

### Runtime Errors

| Issue | Solution |
|-------|----------|
| Component doesn't render | Check console for errors |
| State doesn't persist | Use `useStorage` instead of `useState` |
| Styles don't apply | Use Tailwind classes |

---

## API Reference

### Parser

```typescript
import { parseQuickApp, validateParsedApp } from '@/system/quick-apps/parser';

// Parse APP.md content
const parsed = parseQuickApp(markdownContent, sourceUrl);

// Validate parsed app
const warnings = validateParsedApp(parsed);
```

### Compiler

```typescript
import { initializeCompiler, compileQuickApp, createQuickAppComponent } from '@/system/quick-apps/compiler';

// Initialize esbuild-wasm (call once)
await initializeCompiler();

// Compile parsed app
const compiled = await compileQuickApp(parsed);

// Create React component from compiled code
const Component = await createQuickAppComponent(compiled);
```

### Quick App Store

```typescript
import { useQuickAppStore, initializeQuickApps } from '@/system/quick-apps/quickAppStore';

// Install from markdown
const compiled = await useQuickAppStore.getState().installFromMarkdown(
  markdownContent,
  'file',  // source: 'file' | 'url' | 'paste'
  'app.md' // sourceLocation
);

// Install from URL
const compiled = await useQuickAppStore.getState().installFromUrl(url);

// Uninstall
useQuickAppStore.getState().uninstall(appId);

// Check if app is a Quick App
const isQuick = useQuickAppStore.getState().isQuickApp(appId);

// Get component for rendering
const Component = await useQuickAppStore.getState().getComponent(appId);
```

---

## Migration: Quick App → Full App

When your Quick App outgrows the format:

1. **Export** — Use "Export as Full App" (coming soon)
2. **Manually** — Extract code blocks into separate files:
   - `APP.md` → `manifest.json` + `App.tsx`
   - Helpers → `utils.ts`
   - Store → `store.ts`

---

## Future Roadmap

- [ ] Quick App Gallery in App Store
- [ ] One-click sharing/remix
- [ ] Version management
- [ ] Hot reload during development
- [ ] Export to Full App
- [ ] Quick App CLI (`liquid quick-app create`)
- [ ] VS Code extension with syntax highlighting

---

## Examples

See sample Quick Apps in:
```
src/system/quick-apps/samples/
├── pomodoro-timer.app.md
└── word-counter.app.md
```

---

## Contributing

To add features to the Quick Apps system:

1. Parser: `src/system/quick-apps/parser.ts`
2. Compiler: `src/system/quick-apps/compiler.ts`
3. Runtime hooks: `src/system/quick-apps/compiler.ts` (RUNTIME_SHIMS)
4. Types: `src/system/quick-apps/types.ts`
5. UI: `src/applications/_system/app-store/components/QuickAppInstallerView.tsx`
