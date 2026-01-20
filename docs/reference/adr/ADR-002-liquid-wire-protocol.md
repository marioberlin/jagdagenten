# ADR-002: Liquid Wire Protocol for AI Tool Calls

## Status

Accepted

## Context

When AI models invoke tools/functions, there's a need for:
- Traceable interactions
- Debugging capability
- Streaming support
- Standardized event format

## Decision

We created the **Liquid Wire Protocol**, a standardized event protocol for AI tool calls.

### Event Types

| Event | Description |
|-------|-------------|
| `tool_start` | Tool execution begins |
| `tool_delta` | Streaming progress updates |
| `tool_complete` | Tool execution finished |
| `agent_message` | Agent communication |

### Event Format

```typescript
interface LiquidProtocolEvent {
  type: 'tool_start' | 'tool_delta' | 'tool_complete' | 'agent_message';
  id: string;          // Unique event ID
  name?: string;       // Tool name
  delta?: string;      // Streaming content
  result?: unknown;    // Tool result
}
```

### Client Integration

```typescript
const client = new LiquidClient();

// Register actions AI can invoke
client.registerAction({
  name: 'analyze_trend',
  description: 'Analyze cryptocurrency price trend',
  parameters: [...],
  handler: async (args) => { /* ... */ }
});

// Ingest events from AI stream
client.ingest(event);
```

## Consequences

### Positive

- All AI interactions are traceable
- Easy debugging with event IDs
- Real-time UI updates via subscriptions
- Framework-agnostic protocol

### Negative

- Additional complexity in AI integration
- Requires event parsing logic

## References

- [Liquid Engine Source](../../src/liquid-engine/)
- [Client Implementation](../../src/liquid-engine/client.ts)
