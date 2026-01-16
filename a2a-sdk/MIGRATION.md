# Migration Guide

This guide covers migrations for the A2A TypeScript SDK:

1. [Python SDK to TypeScript SDK](#python-sdk-to-typescript-sdk)
2. [Legacy Types to v1.0 Types](#legacy-types-to-v10-types)

---

## Legacy Types to v1.0 Types

The A2A SDK v1.0 introduces significant naming convention changes to align with the official A2A Protocol v1.0 Draft Specification.

### Summary of Changes

| Category | Legacy Format | v1.0 Format |
|----------|--------------|-------------|
| Field names | `snake_case` | `camelCase` |
| Task states | `input_required` | `input-required` (kebab-case) |
| JSON-RPC methods | `message/send` | `SendMessage` (PascalCase) |
| Type exports | `types/index.ts` | `types/v1.ts` |

### Type Field Name Changes

```typescript
// Legacy (snake_case)
interface Message {
  message_id: string;
  context_id?: string;
  task_id?: string;
}

// v1.0 (camelCase)
interface Message {
  messageId: string;
  contextId?: string;
  taskId?: string;
}
```

Complete field mapping:

| Legacy Field | v1.0 Field |
|--------------|------------|
| `message_id` | `messageId` |
| `context_id` | `contextId` |
| `task_id` | `taskId` |
| `artifact_id` | `artifactId` |
| `push_notifications` | `pushNotifications` |
| `state_transition_history` | `stateTransitionHistory` |
| `default_input_modes` | `defaultInputModes` |
| `default_output_modes` | `defaultOutputModes` |
| `protocol_versions` | `protocolVersions` |
| `documentation_url` | `documentationUrl` |
| `history_length` | `historyLength` |

### Task State Changes

```typescript
// Legacy (snake_case)
type TaskState = 'submitted' | 'working' | 'completed' | 'failed' | 'input_required' | 'cancelled';

// v1.0 (kebab-case for multi-word states)
type TaskState =
  | 'submitted'
  | 'working'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'input-required'  // Changed from input_required
  | 'auth-required'   // New state
  | 'rejected';       // New state
```

### JSON-RPC Method Changes

```typescript
// Legacy method names (slash notation)
const LEGACY_METHODS = {
  'message/send': 'Send a message',
  'message/stream': 'Stream a message',
  'tasks/get': 'Get task by ID',
  'tasks/cancel': 'Cancel a task',
  'tasks/resubscribe': 'Resubscribe to task',
  'agent/card': 'Get agent card',
};

// v1.0 method names (PascalCase)
const V1_METHODS = {
  'SendMessage': 'Send a message',
  'StreamMessage': 'Stream a message',
  'GetTask': 'Get task by ID',
  'CancelTask': 'Cancel a task',
  'SubscribeToTask': 'Subscribe to task updates',
  'SetTaskPushNotificationConfig': 'Configure push notifications',
  'GetTaskPushNotificationConfig': 'Get push notification config',
  'GetExtendedAgentCard': 'Get extended agent card',
};
```

### Import Path Changes

```typescript
// Legacy
import { Message, Task, AgentCard } from 'a2a-sdk/types';
import { Role, TaskState } from 'a2a-sdk/types/base';

// v1.0
import { Message, Task, AgentCard, Role, TaskState } from '@liquidcrypto/a2a-sdk';
// Or import from types/v1 directly
import type { Message, Task } from '@liquidcrypto/a2a-sdk/types/v1';
```

### Client API Changes

```typescript
// Legacy client creation
import { ClientFactory } from 'a2a-sdk';
const client = await ClientFactory.createClientFromUrl(url, config);

// v1.0 client creation
import { createA2AClient } from '@liquidcrypto/a2a-sdk';
const client = createA2AClient({
  baseUrl: url,
  authToken: 'optional-token',
  timeout: 30000,
});

// Legacy sending
const message = { kind: 'message', message_id: 'msg-1', ... };
const result = await client.sendMessage(message);

// v1.0 sending (simplified)
const task = await client.sendText('Hello!');
// Or with options
const task = await client.sendText('Hello!', {
  contextId: 'ctx-1',
  blocking: true,
});
```

### Agent Card Changes

```typescript
// Legacy AgentCard
const agentCard = {
  name: 'My Agent',
  url: 'https://...',
  capabilities: {
    streaming: true,
    push_notifications: false,
    state_transition_history: true,
  },
  default_input_modes: ['text/plain'],
  default_output_modes: ['text/plain'],
  skills: [],
};

// v1.0 AgentCard
const agentCard: AgentCard = {
  name: 'My Agent',
  url: 'https://...',
  protocolVersions: ['1.0'],  // New required field
  capabilities: {
    streaming: true,
    pushNotifications: false,     // camelCase
    stateTransitionHistory: true, // camelCase
  },
  defaultInputModes: ['text/plain'],   // camelCase
  defaultOutputModes: ['text/plain'],  // camelCase
  skills: [],
};
```

### Utility Function Changes

```typescript
// Legacy helper functions
import { createTextPart, createUserMessage } from 'a2a-sdk';

const part = createTextPart('Hello');
const message = createUserMessage([part], { context_id: 'ctx-1' });

// v1.0 helper functions
import { textPart, userMessage } from '@liquidcrypto/a2a-sdk';

const part = textPart('Hello');
const message = userMessage([part], { contextId: 'ctx-1' });
```

### A2UI Integration (New in v1.0)

```typescript
// A2UI is new in v1.0
import { a2ui } from '@liquidcrypto/a2a-sdk';

// Create UI components
const card = a2ui.card('card-1', [
  a2ui.text('title', 'Welcome!'),
  a2ui.button('btn-1', 'Click', a2ui.callback('clicked')),
]);

// Create A2UI messages for streaming
const messages = [
  a2ui.beginRendering('surface-1', 'root'),
  a2ui.surfaceUpdate('surface-1', [card]),
];

// Check artifacts for A2UI content
if (a2ui.isA2UIArtifact(artifact)) {
  const a2uiMessages = a2ui.extractA2UIMessages(artifact);
}
```

### Migration Checklist

- [ ] Update imports to use `@liquidcrypto/a2a-sdk`
- [ ] Change all `snake_case` fields to `camelCase`
- [ ] Update task state checks for kebab-case (`input-required`, `auth-required`)
- [ ] Replace `createTextPart`/`createUserMessage` with `textPart`/`userMessage`
- [ ] Add `protocolVersions: ['1.0']` to agent cards
- [ ] Update JSON-RPC method names if using low-level API

### Backward Compatibility

The SDK server adapters support both legacy and v1.0 method names:

```typescript
// Both work on the server
'message/send'  // Legacy - still supported
'SendMessage'   // v1.0 - preferred
```

---

## Python SDK to TypeScript SDK

This section helps you migrate from the [A2A Python SDK](https://github.com/a2aproject/a2a-python) to the A2A TypeScript SDK.

### Key Differences

#### 1. Async Programming Model

**Python (asyncio):**
```python
async def send_message(self, request: Message):
    async for event in client.send_message(request):
        process_event(event)
```

**TypeScript (async/await):**
```typescript
async function sendMessage(request: Message) {
  for await (const event of client.streamText(request.text)) {
    processEvent(event);
  }
}
```

#### 2. Type Definitions

**Python (Pydantic):**
```python
from pydantic import BaseModel

class Message(BaseModel):
    message_id: str
    role: Role
    parts: list[Part]
```

**TypeScript (Interfaces):**
```typescript
interface Message {
  messageId: string;  // v1.0 camelCase
  role: Role;
  parts: Part[];
}
```

#### 3. Error Handling

**Python:**
```python
try:
    result = await client.get_task(task_id)
except TaskNotFoundError as e:
    handle_error(e)
```

**TypeScript:**
```typescript
try {
  const result = await client.getTask(taskId);
} catch (error) {
  if (error instanceof A2AClientError && error.code === -32001) {
    handleTaskNotFound(error);
  }
}
```

### Creating a Client

**Python:**
```python
from a2a.client.client_factory import ClientFactory

client = await ClientFactory.create_client(
    agent_card=agent_card,
    config=ClientConfig()
)
```

**TypeScript:**
```typescript
import { createA2AClient } from '@liquidcrypto/a2a-sdk';

const client = createA2AClient({
  baseUrl: 'https://agent.example.com/a2a/v1',
  timeout: 30000,
});
```

### Sending Messages

**Python:**
```python
message = Message(
    message_id='msg-123',
    role=Role.USER,
    parts=[TextPart(text='Hello')]
)

async for event in client.send_message(message):
    print(f"Event: {event}")
```

**TypeScript:**
```typescript
// Simple text sending
const task = await client.sendText('Hello');

// Streaming
for await (const event of client.streamText('Hello')) {
  console.log('Event:', event);
}
```

### Creating a Server

**Python:**
```python
from a2a.server.apps import A2AServerApp

class MyExecutor(AgentExecutor):
    async def execute(self, message, context):
        return AgentExecutionResult(
            message=Message(...)
        )

server = A2AServerApp(
    agent_card=AgentCard(...),
    executor=MyExecutor(),
)
await server.serve()
```

**TypeScript:**
```typescript
import { ExpressA2AServer } from '@liquidcrypto/a2a-sdk';

const executor: AgentExecutor = {
  async execute(message, context) {
    return {
      message: agentMessage([textPart('Response')]),
    };
  }
};

const server = new ExpressA2AServer({
  agentCard: { ... },
  executor,
  port: 3000,
});

await server.start();
```

### Known Differences

1. **Package name**: Python uses `a2a-sdk`, TypeScript uses `@liquidcrypto/a2a-sdk`
2. **Naming**: Python uses `snake_case`, TypeScript v1.0 uses `camelCase`
3. **Streaming**: TypeScript uses `AsyncIterableIterator`, Python uses `async for`
4. **Server frameworks**: TypeScript supports Express, Fastify, Elysia; Python uses ASGI

## Getting Help

- Review the [README](./README.md) for current API documentation
- Check the [examples](./examples/) directory
- Open an issue on GitHub
