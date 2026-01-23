# Remote App Provider Guide

> Complete technical reference for third-party developers publishing apps to the LiquidOS App Store.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Manifest Schema](#manifest-schema)
4. [Bundle Requirements](#bundle-requirements)
5. [Capability Declarations](#capability-declarations)
6. [Trust Levels & Sandboxing](#trust-levels--sandboxing)
7. [Window Configuration](#window-configuration)
8. [Integration Hooks](#integration-hooks)
9. [Submission Process](#submission-process)
10. [Integrity Verification](#integrity-verification)
11. [Versioning & Updates](#versioning--updates)
12. [Review & Verification](#review--verification)
13. [Testing Your App](#testing-your-app)
14. [Security Requirements](#security-requirements)
15. [Complete Examples](#complete-examples)

---

## Overview

LiquidOS apps are self-contained bundles that run within the spatial desktop environment. Remote apps are fetched from the registry, integrity-verified, and loaded either as trusted dynamic imports or sandboxed iframes depending on their verification status.

**App lifecycle:**

```
Developer builds app → Submits to registry → Review & verification
    → User discovers in App Store → Installs → Permission grant
    → Bundle downloaded & verified → App runs (trusted or sandboxed)
```

---

## Prerequisites

- A JavaScript/TypeScript application compiled to a single ES module bundle
- Familiarity with React (apps render as React components)
- A valid manifest conforming to the `ServerAppManifest` schema
- SHA-256 hash of your bundle for integrity verification

---

## Manifest Schema

Every app requires a complete manifest. The manifest is submitted as JSON when publishing.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique kebab-case identifier (e.g., `my-cool-app`) |
| `name` | `string` | Human-readable display name |
| `version` | `string` | Semantic version (e.g., `1.0.0`) |
| `description` | `string` | Short description (max 200 chars recommended) |
| `author` | `string` | Developer or organization name |
| `category` | `AppCategory` | One of the defined categories (see below) |
| `keywords` | `string[]` | Search keywords (3-10 recommended) |
| `icon` | `string` | Lucide icon name (e.g., `Zap`) or relative asset path |
| `entry` | `string` | Relative path to app component (e.g., `./App.tsx`) |
| `window` | `WindowConfig` | Window display configuration |
| `integrations` | `AppIntegrations` | Integration declarations (can be `{}`) |
| `capabilities` | `AppCapability[]` | Required system capabilities |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `longDescription` | `string` | Extended description for detail view |
| `license` | `string` | SPDX license identifier (e.g., `MIT`) |
| `homepage` | `string` | Project homepage URL |
| `repository` | `string` | Source code repository URL |
| `screenshots` | `string[]` | Screenshot URLs for store listing |
| `store` | `string` | Relative path to Zustand store module |
| `dependencies` | `Record<string, string>` | Other app IDs → version ranges |
| `peerDependencies` | `Record<string, string>` | Peer app dependencies |
| `activationEvents` | `string[]` | Events that activate the app |
| `backgroundServices` | `string[]` | Background service entry points |
| `remote` | `RemoteAppConfig` | Remote loading configuration |

### Categories

```typescript
type AppCategory =
  | 'productivity'
  | 'communication'
  | 'finance'
  | 'weather'
  | 'travel'
  | 'developer'
  | 'utilities'
  | 'entertainment'
  | 'system';
```

### Remote App Config

For apps distributed via the registry, include the `remote` field:

```typescript
interface RemoteAppConfig {
  sourceUrl: string;       // Registry URL where bundle is hosted
  integrity?: string;      // SHA-256 hash of the bundle (hex string)
  sandbox?: boolean;       // Whether to run in iframe isolation (default: true for unverified)
}
```

---

## Bundle Requirements

### Format

Your app must compile to a **single ES module** (`.js` file) that exports a default React component.

```javascript
// Your bundle must have a default export that is a React component
export default function MyApp() {
  return <div>Hello LiquidOS</div>;
}
```

### Compilation

Use your preferred bundler (Vite, Rollup, esbuild, webpack) configured for:

- **Output format**: ESM (`format: 'es'`)
- **Single file**: All code bundled into one `.js` file
- **External React**: React and ReactDOM are provided by LiquidOS — do NOT bundle them

#### Vite Example

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/App.tsx',
      formats: ['es'],
      fileName: 'bundle',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

#### Rollup Example

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/App.tsx',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
  },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  plugins: [resolve(), typescript()],
};
```

### Bundle Size Limits

| Tier | Max Size | Use Case |
|------|----------|----------|
| Standard | 5 MB | Most apps |
| Extended | 25 MB | Apps with large assets |
| Enterprise | 100 MB | Requires special approval |

### What NOT to Include

- **React/ReactDOM** — provided by the host environment
- **Sensitive credentials** — use capability system instead
- **Node.js APIs** — apps run in the browser
- **eval() or Function()** — blocked by CSP in sandboxed mode

---

## Capability Declarations

Apps declare required system capabilities in the manifest. Users are prompted to grant permissions during installation.

### Available Capabilities

| Capability | Risk Level | Description | Auto-Granted |
|-----------|------------|-------------|--------------|
| `network:http` | Medium | Make HTTP requests to external servers | No |
| `network:websocket` | Medium | Maintain real-time WebSocket connections | No |
| `storage:local` | Low | Store data in browser localStorage | **Yes** |
| `storage:indexeddb` | Low | Store structured data in IndexedDB | **Yes** |
| `ai:llm` | Medium | Access AI language model for text generation | No |
| `ai:agent` | High | Run autonomous AI agent tasks | No |
| `a2a:connect` | High | Connect to remote AI agents via A2A protocol | No |
| `notification:push` | Low | Send push notifications | No |
| `notification:toast` | Low | Display in-app toast notifications | **Yes** |
| `media:camera` | High | Access device camera | No |
| `media:microphone` | High | Access device microphone | No |
| `media:geolocation` | High | Access device location | No |
| `system:clipboard` | Medium | Read/write clipboard | No |
| `system:fullscreen` | Low | Enter fullscreen mode | **Yes** |

### Risk Levels

- **Low**: Auto-granted or minimal user impact. No prompt shown.
- **Medium**: Requires user approval. Dialog shows capability description.
- **High**: Requires explicit user consent with enhanced warning. Dialog highlights risk.

### Permission Dialog

When a user installs your app, they see a permission dialog listing all non-auto-granted capabilities. Each capability shows:

1. The capability label (e.g., "Network Access (HTTP)")
2. The description (e.g., "Make HTTP requests to external servers")
3. Risk indicator (color-coded badge)

Users can grant all or deny. If denied, the app installs but affected features won't function.

### Best Practices

- **Request minimal capabilities** — only declare what you actually need
- **Degrade gracefully** — handle permission denial without crashing
- **Explain in longDescription** — tell users why you need each capability
- **Prefer low-risk alternatives** — use `storage:local` over `storage:indexeddb` if sufficient

---

## Trust Levels & Sandboxing

### Verified Apps (Trusted)

Verified apps are loaded via dynamic `import()` with full access to declared capabilities.

**Requirements for verification:**
- Publisher identity confirmed
- Source code audit passed
- No obfuscated code
- Bundle integrity hash matches
- Manifest accurately describes app behavior
- Security scan passes (no known vulnerabilities)

**Benefits:**
- Full DOM access within app panel
- Direct access to LiquidOS APIs
- Lower latency (no iframe overhead)
- Full integration hooks support

### Unverified Apps (Sandboxed)

Unverified apps run inside an `<iframe>` with restricted permissions.

**Sandbox attributes:**
```html
<iframe
  sandbox="allow-scripts"
  style="width: 100%; height: 100%; border: none;"
  src="blob:..."
/>
```

**Restrictions in sandbox mode:**
- No access to parent DOM
- No access to parent window APIs
- No form submission
- No popups or new windows
- No pointer lock
- No top-level navigation
- Limited to `allow-scripts` only

**How it works:**
1. Bundle is fetched and integrity-verified
2. A wrapper HTML document is created with the bundle inlined
3. The HTML is loaded as a blob URL inside the iframe
4. The app renders within the isolated context

**Communication:**
- Sandboxed apps communicate via `postMessage` API
- LiquidOS provides a message bridge for permitted capabilities
- Only declared capabilities are bridged

### Requesting Verification

To move from sandboxed to verified:

1. Submit your source code repository URL
2. Pass automated security scanning
3. Undergo manual code review
4. Maintain a clean publishing history
5. Respond to security reports within 48 hours

---

## Window Configuration

Every app must declare its window configuration:

```typescript
interface WindowConfig {
  mode: 'panel' | 'fullscreen' | 'floating';
  title: string;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  resizable?: boolean;
  minimizable?: boolean;
}
```

### Window Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `panel` | Standard app panel (slides in from right) | Most apps |
| `fullscreen` | Covers entire desktop | Immersive experiences, games |
| `floating` | Movable, resizable window | Utility apps, calculators |

### Example

```json
{
  "window": {
    "mode": "panel",
    "title": "My App",
    "defaultSize": { "width": 400, "height": 600 },
    "resizable": true,
    "minimizable": true
  }
}
```

---

## Integration Hooks

Apps can integrate with various LiquidOS subsystems by declaring hooks in the manifest.

### Dock Integration

```json
{
  "integrations": {
    "dock": {
      "enabled": true,
      "position": 5,
      "badge": "unreadCount"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | `boolean` | Show in dock after install |
| `position` | `number` | Preferred dock position (0-based) |
| `badge` | `string` | Store selector path for badge count |

### Menu Bar Integration

```json
{
  "integrations": {
    "menuBar": {
      "hookPath": "./hooks/useMenuBar.ts"
    }
  }
}
```

Your menu bar hook should export a function that registers menus when the app is active:

```typescript
// hooks/useMenuBar.ts
import { useEffect } from 'react';
import { useMenuBar } from '@/contexts/MenuBarContext';

export function useAppMenuBar() {
  const { setAppIdentity, registerMenu } = useMenuBar();

  useEffect(() => {
    setAppIdentity({ name: 'My App', icon: 'Zap' });
    registerMenu('File', [
      { label: 'New', shortcut: '⌘N', action: () => { /* ... */ } },
      { label: 'Save', shortcut: '⌘S', action: () => { /* ... */ } },
    ]);
  }, []);
}
```

### AI Context Integration

```json
{
  "integrations": {
    "aiContext": {
      "systemPrompt": "You are an assistant for My App...",
      "knowledge": ["./docs/usage.md"],
      "agentId": "my-a2a-agent-id"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `systemPrompt` | `string` | System prompt injected when app is active |
| `knowledge` | `string[]` | Knowledge base file paths |
| `agentId` | `string` | A2A agent ID for remote AI binding |

### Command Palette Integration

```json
{
  "integrations": {
    "commandPalette": {
      "commands": [
        {
          "id": "my-app.new-item",
          "label": "New Item",
          "shortcut": "⌘N",
          "category": "My App"
        }
      ]
    }
  }
}
```

### Shortcuts Integration

```json
{
  "integrations": {
    "shortcuts": {
      "hookPath": "./hooks/useShortcuts.ts"
    }
  }
}
```

### Notifications Integration

```json
{
  "integrations": {
    "notifications": {
      "channels": ["updates", "alerts"]
    }
  }
}
```

---

## Submission Process

### API Endpoint

```
POST /api/v1/apps
Content-Type: application/json
```

### Request Format

```typescript
interface PublishAppRequest {
  manifest: ServerAppManifest;  // Complete app manifest
  bundle?: string;              // Base64-encoded JS bundle (optional)
}
```

### Step-by-Step

1. **Build your bundle**
   ```bash
   bun run build  # or npm run build
   ```

2. **Generate integrity hash**
   ```bash
   shasum -a 256 dist/bundle.js | awk '{print $1}'
   # Example output: a1b2c3d4e5f6...
   ```

3. **Set the hash in your manifest**
   ```json
   {
     "remote": {
       "sourceUrl": "https://registry.liquidcrypto.app/api/v1/apps/my-app/bundle",
       "integrity": "a1b2c3d4e5f6...",
       "sandbox": false
     }
   }
   ```

4. **Encode your bundle**
   ```bash
   base64 -i dist/bundle.js -o bundle.b64
   ```

5. **Submit to registry**
   ```bash
   curl -X POST https://registry.liquidcrypto.app/api/v1/apps \
     -H "Content-Type: application/json" \
     -d '{
       "manifest": { ... },
       "bundle": "<base64-encoded-bundle>"
     }'
   ```

### Response

**Success (201):**
```json
{
  "success": true,
  "app": {
    "manifest": { ... },
    "source": "remote",
    "publishedAt": "2026-01-20T12:00:00Z",
    "verified": false,
    "downloads": 0
  }
}
```

**Error (400):**
```json
{
  "error": "Missing required manifest fields: name, version"
}
```

### Without Bundle

If you host your bundle externally, omit the `bundle` field and set `remote.sourceUrl` to your CDN URL. The registry will verify the bundle is accessible and matches the declared integrity hash.

---

## Integrity Verification

Bundle integrity is enforced at multiple stages:

### 1. Publish Time (Server)

When you submit a bundle, the server:
- Computes SHA-256 hash of the bundle content
- Stores the hash in `manifest.remote.integrity`
- Writes a `.meta.json` file alongside the bundle:

```json
{
  "hash": "sha256-a1b2c3d4...",
  "size": 125430,
  "publishedAt": "2026-01-20T12:00:00Z",
  "appId": "my-app",
  "version": "1.0.0"
}
```

### 2. Download Time (Client)

When a user installs your app, the client:
1. Fetches the bundle from `remote.sourceUrl`
2. Computes SHA-256 of the received content
3. Compares against `remote.integrity`
4. **Rejects the bundle if hashes don't match**

```typescript
// Client-side verification (simplified)
const response = await fetch(sourceUrl);
const bundleText = await response.text();

const hashBuffer = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(bundleText)
);
const computedHash = Array.from(new Uint8Array(hashBuffer))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

if (computedHash !== manifest.remote.integrity) {
  throw new Error('Bundle integrity check failed');
}
```

### 3. Generating Your Hash

```bash
# macOS/Linux
shasum -a 256 dist/bundle.js | awk '{print $1}'

# Node.js
node -e "
  const crypto = require('crypto');
  const fs = require('fs');
  const hash = crypto.createHash('sha256')
    .update(fs.readFileSync('dist/bundle.js'))
    .digest('hex');
  console.log(hash);
"

# Bun
bun -e "
  const file = Bun.file('dist/bundle.js');
  const hash = new Bun.CryptoHasher('sha256')
    .update(await file.arrayBuffer())
    .digest('hex');
  console.log(hash);
"
```

### Important

- The integrity hash **must** be updated every time you publish a new bundle
- Bundle modifications after publishing will cause installation failures
- CDN caching must serve the exact bytes that were hashed

---

## Versioning & Updates

### Semantic Versioning

All apps must use [semver](https://semver.org/):

- `MAJOR.MINOR.PATCH` (e.g., `2.1.3`)
- **MAJOR**: Breaking changes to user-facing behavior
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes

### Publishing Updates

To update an existing app, submit a new manifest with an incremented version:

```bash
curl -X POST https://registry.liquidcrypto.app/api/v1/apps \
  -H "Content-Type: application/json" \
  -d '{
    "manifest": {
      "id": "my-app",
      "version": "1.1.0",
      ...
    },
    "bundle": "<new-base64-bundle>"
  }'
```

The registry uses `id` for app identity — same ID with higher version creates an update.

### Update Discovery

- LiquidOS periodically checks `GET /api/v1/apps/:id` for version changes
- Users see available updates in the App Store "Updates" tab
- Users choose when to install updates (no forced updates)

### Rollback

- Previous versions are retained in bundle storage
- Users can revert via App Store settings (future feature)
- Keep your old bundles accessible if self-hosting

---

## Review & Verification

### Automated Checks (All Submissions)

Every submission undergoes automated scanning:

1. **Manifest validation** — All required fields present and correctly typed
2. **Bundle size check** — Within tier limits
3. **Integrity match** — SHA-256 hash validates
4. **Capability audit** — Declared capabilities match detected API usage
5. **Security scan** — No known vulnerability patterns:
   - No `eval()` or `new Function()`
   - No credential harvesting patterns
   - No unauthorized network requests
   - No DOM manipulation outside app boundary

### Manual Review (Verification Requests)

For apps requesting verified (non-sandboxed) status:

1. **Source code review** — Full codebase inspection
2. **Behavior analysis** — Runtime behavior matches manifest declarations
3. **Privacy audit** — Data handling matches description
4. **Performance check** — No excessive resource usage
5. **UX review** — Follows LiquidOS design guidelines

### Rejection Reasons

Common reasons for rejection:

| Reason | Resolution |
|--------|------------|
| Missing required manifest fields | Add all required fields |
| Undeclared capabilities used | Add capabilities to manifest |
| Bundle integrity mismatch | Regenerate hash after final build |
| Obfuscated code | Submit unminified source for review |
| Excessive permissions | Remove unnecessary capability declarations |
| Privacy violations | Remove data collection or add disclosure |
| Security vulnerabilities | Fix detected issues and resubmit |

---

## Testing Your App

### Local Testing

1. **Create a manifest.json** in your app directory
2. **Place your app** in `src/applications/<your-app-id>/`
3. **Run the dev server**: `bun run dev`
4. **Verify** your app appears in the App Store and functions correctly

### Testing as Remote App

1. **Build your bundle** to a single ES module file
2. **Serve it locally** (e.g., `bunx serve dist/`)
3. **Set `remote.sourceUrl`** to `http://localhost:3000/bundle.js`
4. **Compute integrity hash** and set in manifest
5. **Register via API** against local registry
6. **Install from App Store** and verify loading/sandboxing

### Test Checklist

- [ ] App renders without errors in panel mode
- [ ] Window title displays correctly
- [ ] Icon renders in dock and App Store
- [ ] All declared capabilities function when granted
- [ ] App degrades gracefully when permissions denied
- [ ] Menu bar integrations register/unregister on activate/deactivate
- [ ] Command palette entries appear when app is installed
- [ ] App state persists across open/close cycles
- [ ] Bundle loads correctly from remote URL
- [ ] Integrity verification passes
- [ ] App functions in sandbox mode (if applicable)
- [ ] No console errors during normal operation
- [ ] Responsive layout within panel dimensions

---

## Security Requirements

### Mandatory

1. **No credential storage** — Never store user credentials in your bundle
2. **No eval/Function** — Dynamic code execution is blocked
3. **Declare all network access** — Every external request requires `network:http` or `network:websocket`
4. **Respect sandbox boundaries** — Don't attempt to escape iframe isolation
5. **Handle errors gracefully** — Unhandled exceptions degrade user experience

### Recommended

1. **Content Security Policy** compliance — Avoid inline scripts/styles
2. **Input sanitization** — Prevent XSS in user-generated content
3. **HTTPS only** — All network requests should use HTTPS
4. **Minimal data collection** — Only collect what your app needs
5. **Transparent data usage** — Describe in `longDescription` what data you process

### Prohibited

- Cryptocurrency mining
- User tracking without disclosure
- Accessing other apps' storage
- Modifying LiquidOS system state
- Attempting to bypass permission checks
- Bundling malware or exploit code
- Phishing or impersonating system UI

---

## Complete Examples

### Minimal App (Utility)

```json
{
  "id": "quick-notes",
  "name": "Quick Notes",
  "version": "1.0.0",
  "description": "A simple notepad for quick thoughts",
  "author": "Dev Studio",
  "category": "productivity",
  "keywords": ["notes", "text", "editor"],
  "icon": "StickyNote",
  "entry": "./App.tsx",
  "window": {
    "mode": "panel",
    "title": "Quick Notes",
    "defaultSize": { "width": 360, "height": 500 },
    "resizable": true
  },
  "integrations": {
    "dock": { "enabled": true, "position": 8 }
  },
  "capabilities": ["storage:local"],
  "remote": {
    "sourceUrl": "https://registry.liquidcrypto.app/api/v1/apps/quick-notes/bundle",
    "integrity": "e3b0c44298fc1c149afbf4c8996fb924..."
  }
}
```

### Full-Featured App (AI + Network)

```json
{
  "id": "smart-research",
  "name": "Smart Research",
  "version": "2.1.0",
  "description": "AI-powered research assistant with web access",
  "longDescription": "Smart Research uses AI to help you find, summarize, and organize research from across the web. It requires network access to fetch web pages and AI capabilities to process content.",
  "author": "AI Labs Inc.",
  "license": "MIT",
  "homepage": "https://smartresearch.dev",
  "repository": "https://github.com/ailabs/smart-research",
  "category": "productivity",
  "keywords": ["research", "ai", "web", "summary", "knowledge"],
  "icon": "BrainCircuit",
  "screenshots": [
    "https://smartresearch.dev/screenshots/main.png",
    "https://smartresearch.dev/screenshots/summary.png"
  ],
  "entry": "./App.tsx",
  "store": "./store.ts",
  "window": {
    "mode": "panel",
    "title": "Smart Research",
    "defaultSize": { "width": 480, "height": 700 },
    "resizable": true,
    "minimizable": true
  },
  "integrations": {
    "dock": { "enabled": true, "position": 4, "badge": "pendingCount" },
    "menuBar": { "hookPath": "./hooks/useMenuBar.ts" },
    "shortcuts": { "hookPath": "./hooks/useShortcuts.ts" },
    "aiContext": {
      "systemPrompt": "You are a research assistant. Help the user find and summarize information.",
      "knowledge": ["./docs/capabilities.md"]
    },
    "commandPalette": {
      "commands": [
        { "id": "smart-research.new", "label": "New Research", "shortcut": "⌘⇧R", "category": "Smart Research" },
        { "id": "smart-research.summarize", "label": "Summarize Page", "category": "Smart Research" }
      ]
    },
    "notifications": { "channels": ["research-complete"] }
  },
  "capabilities": [
    "network:http",
    "storage:indexeddb",
    "ai:llm",
    "notification:push",
    "system:clipboard"
  ],
  "remote": {
    "sourceUrl": "https://registry.liquidcrypto.app/api/v1/apps/smart-research/bundle",
    "integrity": "7d865e959b2466918c9863afca942d0f...",
    "sandbox": false
  }
}
```

### Complete Submission Request

```bash
# 1. Build
bun run build

# 2. Hash
HASH=$(shasum -a 256 dist/bundle.js | awk '{print $1}')
echo "Bundle hash: $HASH"

# 3. Encode
BUNDLE=$(base64 -i dist/bundle.js)

# 4. Submit
curl -X POST https://registry.liquidcrypto.app/api/v1/apps \
  -H "Content-Type: application/json" \
  -d "{
    \"manifest\": {
      \"id\": \"quick-notes\",
      \"name\": \"Quick Notes\",
      \"version\": \"1.0.0\",
      \"description\": \"A simple notepad\",
      \"author\": \"Dev Studio\",
      \"category\": \"productivity\",
      \"keywords\": [\"notes\"],
      \"icon\": \"StickyNote\",
      \"entry\": \"./App.tsx\",
      \"window\": {
        \"mode\": \"panel\",
        \"title\": \"Quick Notes\"
      },
      \"integrations\": {},
      \"capabilities\": [\"storage:local\"],
      \"remote\": {
        \"sourceUrl\": \"https://registry.liquidcrypto.app/api/v1/apps/quick-notes/bundle\",
        \"integrity\": \"$HASH\"
      }
    },
    \"bundle\": \"$BUNDLE\"
  }"
```

### App Component (React)

```tsx
// App.tsx — The default export is loaded by LiquidOS
import { useState } from 'react';

export default function QuickNotes() {
  const [notes, setNotes] = useState<string[]>(() => {
    const saved = localStorage.getItem('quick-notes-data');
    return saved ? JSON.parse(saved) : [];
  });

  const [draft, setDraft] = useState('');

  const addNote = () => {
    if (!draft.trim()) return;
    const updated = [...notes, draft.trim()];
    setNotes(updated);
    localStorage.setItem('quick-notes-data', JSON.stringify(updated));
    setDraft('');
  };

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h2>Quick Notes</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()}
          placeholder="Type a note..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button onClick={addNote} style={{ padding: '8px 16px', borderRadius: 8 }}>
          Add
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notes.map((note, i) => (
          <li key={i} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## API Reference (Quick)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/apps` | List all apps (supports `?category=`, `?search=`, `?limit=`, `?offset=`) |
| `GET` | `/api/v1/apps/featured` | Featured/curated apps |
| `GET` | `/api/v1/apps/search?q=` | Search apps by name, description, keywords |
| `GET` | `/api/v1/apps/categories` | Category list with app counts |
| `GET` | `/api/v1/apps/:id` | Get specific app manifest and metadata |
| `GET` | `/api/v1/apps/:id/bundle` | Download app bundle (JS) |
| `POST` | `/api/v1/apps` | Publish or update an app |
| `DELETE` | `/api/v1/apps/:id` | Remove an app from registry |

For full API documentation, see [Server API Reference](../../server/docs/API.md#app-store-registry-api).

---

## Support & Resources

- **App Store Architecture**: [`docs/app-store/README.md`](./README.md)
- **Server API Docs**: [`server/docs/API.md`](../../server/docs/API.md)
- **Design Guidelines**: [`docs/design/hig-principles.md`](../design/hig-principles.md)
- **Type Definitions**: [`src/system/app-store/types.ts`](../../src/system/app-store/types.ts)
- **Permission System**: [`src/system/app-store/permissions.ts`](../../src/system/app-store/permissions.ts)
- **Remote Loader Source**: [`src/system/app-store/remoteAppLoader.ts`](../../src/system/app-store/remoteAppLoader.ts)
