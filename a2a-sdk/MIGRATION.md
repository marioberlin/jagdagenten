# Migration Guide: Python SDK to TypeScript SDK

This guide helps you migrate from the [A2A Python SDK](https://github.com/a2aproject/a2a-python) to the A2A TypeScript SDK.

## Table of Contents

- [Overview](#overview)
- [Key Differences](#key-differences)
- [Type System Migration](#type-system-migration)
- [Client Migration](#client-migration)
- [Server Migration](#server-migration)
- [Transports](#transports)
- [Common Patterns](#common-patterns)
- [Examples](#examples)

## Overview

The TypeScript SDK is designed to provide feature parity with the Python SDK while leveraging TypeScript's type system and JavaScript's async/await patterns.

## Key Differences

### 1. Async Programming Model

**Python (asyncio):**
```python
async def send_message(self, request: Message):
    async for event in client.send_message(request):
        process_event(event)
```

**TypeScript (async/await):**
```typescript
async *sendMessage(request: Message): AsyncIterableIterator<ClientEvent> {
  for await (const event of client.sendMessage(request)) {
    processEvent(event);
  }
}
```

### 2. Type Definitions

**Python (Pydantic):**
```python
from pydantic import BaseModel

class Message(BaseModel):
    kind: Literal['message']
    message_id: str
    role: Role
    parts: list[Part]
```

**TypeScript (Interfaces):**
```typescript
interface Message {
  kind: 'message';
  message_id: string;
  role: Role;
  parts: Part[];
}
```

### 3. Error Handling

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
  if (error instanceof TaskNotFoundError) {
    handleError(error);
  }
}
```

### 4. Configuration

**Python (Dataclasses):**
```python
@dataclasses.dataclass
class ClientConfig:
    streaming: bool = True
    polling: bool = False
    httpx_client: httpx.AsyncClient | None = None
```

**TypeScript (Interfaces):**
```typescript
interface ClientConfig {
  streaming?: boolean;
  polling?: boolean;
  httpxClient?: any;
}
```

## Type System Migration

### Base Models

**Python:**
```python
from a2a._base import A2ABaseModel

class Message(A2ABaseModel):
    kind: Literal['message'] = 'message'
    message_id: str
    # ...
```

**TypeScript:**
```typescript
import { Message } from 'a2a-sdk';

// Interfaces are directly used
const message: Message = {
  kind: 'message',
  message_id: 'msg-123',
  // ...
};
```

### Enums

**Python:**
```python
from enum import Enum

class Role(str, Enum):
    USER = 'user'
    AGENT = 'agent'
```

**TypeScript:**
```typescript
enum Role {
  USER = 'user',
  AGENT = 'agent',
}

// Or as const enum for string literals
type Role = 'user' | 'agent';
```

## Client Migration

### Creating a Client

**Python:**
```python
from a2a.client.client import A2AClient
from a2a.client.client_factory import ClientFactory

client = await ClientFactory.create_client(
    agent_card=agent_card,
    config=ClientConfig()
)
```

**TypeScript:**
```typescript
import { ClientFactory, ClientConfig } from 'a2a-sdk';

const client = await ClientFactory.createClient(
  agentCard,
  {
    streaming: true,
    timeout: 30000,
  } as ClientConfig
);
```

### Sending Messages

**Python:**
```python
message = Message(
    kind='message',
    message_id='msg-123',
    role=Role.USER,
    parts=[TextPart(kind='text', text='Hello')]
)

async for event in client.send_message(message):
    if isinstance(event, tuple):
        task, update = event
        print(f"Task update: {task.status.state}")
    else:
        print(f"Message: {event}")
```

**TypeScript:**
```typescript
const message: Message = {
  kind: 'message',
  message_id: 'msg-123',
  role: Role.USER,
  parts: [
    {
      kind: 'text',
      text: 'Hello',
    },
  ],
};

for await (const event of client.sendMessage(message)) {
  if (Array.isArray(event)) {
    const [task, update] = event;
    console.log(`Task update: ${task.status.state}`);
  } else {
    console.log(`Message: ${event}`);
  }
}
```

### Getting Tasks

**Python:**
```python
task = await client.get_task(
    request=TaskQueryParams(id='task-123', history_length=10)
)
print(f"Task state: {task.status.state}")
```

**TypeScript:**
```typescript
const task = await client.getTask({
  id: 'task-123',
  historyLength: 10,
});

console.log(`Task state: ${task.status.state}`);
```

## Server Migration

### Creating an Agent Executor

**Python:**
```python
from a2a.server.agent_execution import AgentExecutor
from a2a.types import Message, AgentExecutionResult

class MyAgentExecutor(AgentExecutor):
    async def execute(
        self,
        message: Message,
        context: AgentExecutionContext
    ) -> AgentExecutionResult:
        response = Message(
            kind='message',
            message_id=str(uuid.uuid4()),
            role=Role.AGENT,
            parts=[TextPart(kind='text', text=f"Echo: {message.parts[0].text}")]
        )
        return AgentExecutionResult(message=response)
```

**TypeScript:**
```typescript
import { AgentExecutor, AgentExecutionResult, Message, AgentExecutionContext } from 'a2a-sdk';

class MyAgentExecutor implements AgentExecutor {
  async execute(
    message: Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const response: Message = {
      kind: 'message',
      message_id: crypto.randomUUID(),
      role: Role.AGENT,
      parts: [
        {
          kind: 'text',
          text: `Echo: ${(message.parts[0] as any).text}`,
        },
      ],
    };

    return {
      message: response,
    };
  }
}
```

### Creating a Server

**Python:**
```python
from a2a.server.apps import A2AServerApp
from a2a.types import AgentCard

server = A2AServerApp(
    agent_card=AgentCard(...),
    executor=MyAgentExecutor(),
)
await server.serve()
```

**TypeScript:**
```typescript
import { A2AServer, ServerConfig } from 'a2a-sdk';

const serverConfig: ServerConfig = {
  agentCard: {
    name: 'My Agent',
    description: 'Echo agent',
    version: '1.0.0',
    url: 'http://localhost:3000/a2a/v1',
    // ... other properties
  },
  executor: new MyAgentExecutor(),
  port: 3000,
};

const server = new A2AServer(serverConfig);
await server.start();
```

## Transports

### JSON-RPC Transport

**Python:**
```python
from a2a.client.transports import JSONRPCTransport

transport = JSONRPCTransport(
    base_url='https://api.example.com/a2a/v1',
    httpx_client=httpx.AsyncClient()
)
```

**TypeScript:**
```typescript
import { JSONRPCTransport } from 'a2a-sdk';

const transport = new JSONRPCTransport(
  'https://api.example.com/a2a/v1',
  {
    'Authorization': 'Bearer token',
  }
);
```

### Custom Middleware

**Python:**
```python
from a2a.client.middleware import ClientCallInterceptor

class LoggingMiddleware(ClientCallInterceptor):
    async def intercept(
        self,
        request: Any,
        context: ClientCallContext,
        call_next: Callable[[], Awaitable[Any]]
    ) -> Any:
        print(f"Request: {request}")
        result = await call_next()
        print(f"Response: {result}")
        return result
```

**TypeScript:**
```typescript
import { ClientCallInterceptor, ClientCallContext } from 'a2a-sdk';

class LoggingMiddleware implements ClientCallInterceptor {
  async intercept(
    request: any,
    context: ClientCallContext,
    next: () => Promise<any>
  ): Promise<any> {
    console.log(`Request: ${JSON.stringify(request)}`);
    const result = await next();
    console.log(`Response: ${JSON.stringify(result)}`);
    return result;
  }
}
```

## Common Patterns

### Task Management

**Python:**
```python
# Create and monitor a task
task = await client.send_message(message)
task_id = task.id

# Get task updates
while True:
    updated_task = await client.get_task(TaskQueryParams(id=task_id))
    if updated_task.status.state in ['completed', 'failed', 'canceled']:
        break
    await asyncio.sleep(1)
```

**TypeScript:**
```typescript
// Create and monitor a task
const result = await client.sendMessage(message);
const task = result[0]; // or result as Task
const taskId = task.id;

// Get task updates
let updatedTask: Task;
do {
  updatedTask = await client.getTask({ id: taskId });
  if (['completed', 'failed', 'canceled'].includes(updatedTask.status.state)) {
    break;
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
} while (true);
```

### Error Handling

**Python:**
```python
from a2a.types import TaskNotFoundError

try:
    task = await client.get_task(TaskQueryParams(id='invalid-id'))
except TaskNotFoundError as e:
    print(f"Task not found: {e.message}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

**TypeScript:**
```typescript
try {
  const task = await client.getTask({ id: 'invalid-id' });
} catch (error) {
  if (error.code === -32001) { // TaskNotFoundError code
    console.log(`Task not found: ${error.message}`);
  } else {
    console.log(`Unexpected error: ${error}`);
  }
}
```

## Examples

### Complete Client Example

See [examples/client-example.ts](./examples/client-example.ts)

### Complete Server Example

See [examples/server-example.ts](./examples/server-example.ts)

## Known Limitations

1. **gRPC Transport**: Not yet implemented (planned)
2. **Database Integrations**: Not yet implemented (planned)
3. **Telemetry**: Basic OpenTelemetry support (planned)
4. **Streaming**: Limited to JSON-RPC for now

## Getting Help

- Check the [README](./README.md) for basic usage
- Review the [examples](./examples/) directory
- Open an [issue](https://github.com/a2aproject/a2a-typescript/issues) on GitHub
- Join the [A2A community](https://a2a-protocol.org/community)

## Status

This SDK is actively being developed. For the latest status, see the [main README](./README.md).
