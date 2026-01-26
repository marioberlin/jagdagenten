# LiquidOS Quick Apps - VS Code Extension

Syntax highlighting and snippets for LiquidOS Quick Apps (.app.md files).

## Features

### Syntax Highlighting

Full syntax highlighting for Quick App files:

- YAML frontmatter with Quick App-specific fields
- Embedded TSX/TypeScript code blocks
- Embedded CSS code blocks
- Markdown documentation

### Snippets

Quickly scaffold Quick Apps and components:

| Prefix | Description |
|--------|-------------|
| `quickapp` | Complete Quick App template |
| `frontmatter` | Quick App frontmatter block |
| `appblock` | Main App component block |
| `helpersblock` | Helpers code block |
| `storeblock` | Zustand store block |
| `settingsblock` | Settings panel block |
| `cssblock` | CSS styles block |
| `usestorage` | useStorage hook |
| `usenotification` | useNotification hook |
| `glassbutton` | Liquid Glass button |
| `glasscard` | Liquid Glass card |
| `glassinput` | Liquid Glass input |
| `shortcuts` | Keyboard shortcuts table |
| `commands` | Commands table |

### Commands

- **Quick Apps: New Quick App** - Create a new Quick App from template
- **Quick Apps: Preview** - Preview the current Quick App

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "LiquidOS Quick Apps"
4. Click Install

### From VSIX

1. Download the `.vsix` file from releases
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded file

### Development

```bash
cd packages/vscode-quick-apps
npm install
npm run compile
```

To test the extension:
1. Open this folder in VS Code
2. Press F5 to launch the Extension Development Host
3. Create or open a `.app.md` file

## Quick App Format

Quick Apps use the `.app.md` extension and follow this structure:

```markdown
---
name: My App
icon: Zap
category: utilities
tags: [tag1, tag2]
window: floating
size: [400, 300]
---

# My App

App description here.

## UI

\`\`\`tsx App
export default function App() {
  return <div>Hello World</div>;
}
\`\`\`
```

## License

MIT
