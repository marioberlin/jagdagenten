# Canvas System

The Canvas provides a rich output surface for AI agents to display interactive content, HTML/Mermaid diagrams, code artifacts, and more.

## Overview

Canvas extends the chat paradigm by giving agents a persistent, visual workspace where they can:
- Render HTML, Markdown, Mermaid diagrams
- Run JavaScript in a sandboxed browser
- Take screenshots of rendered content
- Write and manage files in a session-scoped filesystem

## Modes

| Mode | Description |
|------|-------------|
| `embedded` | Split-pane with chat on left, canvas on right |
| `overlay` | Canvas overlays the chat interface |
| `popup` | Canvas opens in a separate window |
| `hidden` | Canvas runs in background (for automation) |

## Canvas Operations

### Navigate

Load a file or URL into the canvas:

```typescript
await canvas.navigate(sessionId, 'file://./chart.html');
await canvas.navigate(sessionId, 'https://example.com');
```

### Render

Render content directly:

```typescript
await canvas.render(sessionId, '<h1>Hello</h1>', 'html');
await canvas.render(sessionId, '# Title\n\nMarkdown content', 'markdown');
await canvas.render(sessionId, 'graph TD; A-->B', 'mermaid');
```

### Evaluate

Run JavaScript in the canvas context:

```typescript
const result = await canvas.eval(sessionId, `
  document.querySelector('#data').textContent
`);
```

### Snapshot

Capture the canvas as an image:

```typescript
const { url } = await canvas.snapshot(sessionId, {
  format: 'png',
  selector: '#chart', // Optional: capture specific element
});
```

### File Operations

Manage session-scoped files:

```typescript
// Write a file
await canvas.write(sessionId, 'data.json', JSON.stringify(data));

// Read a file
const { content } = await canvas.read(sessionId, 'data.json');

// List files
const files = await canvas.list(sessionId);
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/canvas/navigate` | Navigate to URL/file |
| POST | `/api/v1/canvas/render` | Render content directly |
| POST | `/api/v1/canvas/eval` | Execute JavaScript |
| POST | `/api/v1/canvas/snapshot` | Take screenshot |
| POST | `/api/v1/canvas/write` | Write file |
| GET | `/api/v1/canvas/read/:session/:file` | Read file |
| GET | `/api/v1/canvas/list/:session` | List files |
| GET/POST | `/api/v1/canvas/mode/:session` | Get/set display mode |

## Session Tools

AI agents can control the canvas via natural language with these session tools:

| Tool | Description |
|------|-------------|
| `canvas_show(content, type)` | Render content |
| `canvas_navigate(url)` | Navigate to URL |
| `canvas_eval(code)` | Run JavaScript |
| `canvas_screenshot()` | Take snapshot |
| `canvas_mode(mode)` | Change display mode |

## Key Files

| File | Purpose |
|------|---------|
| `server/src/canvas/canvas-service.ts` | Canvas service implementation |
| `server/src/routes/canvas.ts` | REST API routes |
| `server/src/agents/session-tools.ts` | AI-invokable canvas tools |
