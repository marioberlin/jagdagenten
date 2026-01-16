# A2A TypeScript SDK v1.0

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![A2A Protocol](https://img.shields.io/badge/A2A_Protocol-v1.0-purple.svg)](https://a2a-protocol.org)

A TypeScript library for building agentic applications that follow the [Agent2Agent (A2A) Protocol v1.0](https://a2a-protocol.org/latest/specification/).

## ✨ Features

- **A2A Protocol v1.0 Compliant**: Full compliance with the A2A Protocol v1.0 Draft Specification
- **A2UI Support**: Built-in support for [Agent-to-User Interface (A2UI)](https://github.com/google/a2ui) declarative UI generation
- **Type-Safe**: Full TypeScript support with comprehensive type definitions using camelCase naming
- **Transport Agnostic**: Support for multiple transport protocols (JSON-RPC, gRPC, HTTP+SSE)
- **Async/Await**: Modern asynchronous JavaScript patterns with streaming support
- **Extensible**: Easy to extend with custom transports, middleware, and integrations

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- TypeScript 5.0.0 or higher

### Installation

```bash
npm install @liquidcrypto/a2a-sdk
# or
bun add @liquidcrypto/a2a-sdk
```

### Basic Usage

#### Creating a Client (v1.0)

```typescript
import { createA2AClient, type A2AClientConfig } from '@liquidcrypto/a2a-sdk';

// Create a v1.0 client
const config: A2AClientConfig = {
  baseUrl: 'https://api.example.com/a2a/v1',
  authToken: 'your-auth-token', // Optional
  timeout: 30000,
};

const client = createA2AClient(config);

// Send a simple text message
const task = await client.sendText('Hello, agent!');
console.log('Task ID:', task.id);
console.log('Status:', task.status.state);

// Or stream responses
for await (const event of client.streamText('Tell me a story')) {
  switch (event.type) {
    case 'status':
      console.log('Status update:', event.data.status.state);
      break;
    case 'artifact':
      console.log('Artifact:', event.data.artifact);
      break;
    case 'complete':
      console.log('Task completed:', event.task);
      break;
  }
}
```

#### Creating a Simple Agent Server

```typescript
import { ExpressA2AServer, type AgentExecutor, type AgentCard } from '@liquidcrypto/a2a-sdk';
import { textPart, userMessage, agentMessage } from '@liquidcrypto/a2a-sdk';

// Define your agent executor
const executor: AgentExecutor = {
  async execute(message, context) {
    const userText = message.parts.find(p => p.text)?.text || '';

    return {
      message: agentMessage([
        textPart(`Hello! You said: ${userText}`)
      ]),
    };
  }
};

// Define your agent card (v1.0 format)
const agentCard: AgentCard = {
  name: 'My Agent',
  description: 'A simple greeting agent',
  version: '1.0.0',
  url: 'https://api.example.com',
  protocolVersions: ['1.0'],
  capabilities: {
    streaming: true,
    pushNotifications: false,
  },
  skills: [{
    id: 'greeting',
    name: 'Greeting',
    description: 'Responds to greetings',
    tags: ['greeting', 'hello'],
  }],
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
};

// Start the server
const server = new ExpressA2AServer({
  agentCard,
  executor,
  port: 3000,
});

await server.start();
console.log('Agent running at http://localhost:3000');
```

## 📐 A2A Protocol v1.0

This SDK implements the A2A Protocol v1.0 Draft Specification with:

### Type System

All types use **camelCase** naming convention per v1.0 spec:

```typescript
import type {
  Task,           // Task with id, contextId, status, artifacts, history
  TaskStatus,     // Status with state, timestamp, message
  TaskState,      // 'submitted' | 'working' | 'completed' | 'failed' | etc.
  Message,        // Message with messageId, role, parts
  Part,           // TextPart | FilePart | DataPart
  Artifact,       // Output artifacts with artifactId, name, parts
  AgentCard,      // Agent metadata and capabilities
} from '@liquidcrypto/a2a-sdk';
```

### JSON-RPC 2.0 Methods

v1.0 uses PascalCase method names:

| Method | Description |
|--------|-------------|
| `SendMessage` | Send a message to an agent |
| `StreamMessage` | Stream a message with SSE events |
| `GetTask` | Retrieve task by ID |
| `CancelTask` | Cancel a running task |
| `SubscribeToTask` | Subscribe to task updates |
| `SetTaskPushNotificationConfig` | Configure push notifications |
| `GetTaskPushNotificationConfig` | Get push notification config |

### Task States

```typescript
type TaskState =
  | 'submitted'      // Task submitted, waiting to be processed
  | 'working'        // Agent is processing the task
  | 'completed'      // Task completed successfully
  | 'failed'         // Task failed
  | 'cancelled'      // Task was cancelled
  | 'input-required' // Agent needs more input
  | 'auth-required'  // Authentication required
  | 'rejected';      // Task was rejected
```

## 🎨 A2UI Support

The SDK includes full support for [A2UI (Agent-to-User Interface)](https://github.com/google/a2ui), enabling agents to generate rich, interactive user interfaces through declarative JSON.

### A2UI Components

```typescript
import { a2ui } from '@liquidcrypto/a2a-sdk';

// Create UI components
const card = a2ui.card('card-1', [
  a2ui.text('title', 'Welcome!'),
  a2ui.button('btn-1', 'Click Me', a2ui.callback('button-clicked')),
]);

// Create A2UI messages
const messages = [
  a2ui.beginRendering('surface-1', 'root'),
  a2ui.surfaceUpdate('surface-1', [card]),
];

// Create an A2UI artifact part
const uiPart = a2ui.createA2UIPart(messages);
```

### Available A2UI Components

The SDK supports 50+ A2UI component types:

- **Layout**: `container`, `row`, `column`, `grid`, `stack`
- **Text**: `text`, `heading`, `paragraph`, `markdown`, `code-block`
- **Input**: `text-field`, `text-area`, `select`, `checkbox`, `radio`, `switch`, `slider`
- **Display**: `card`, `list`, `table`, `image`, `icon`, `badge`, `avatar`
- **Data**: `chart`, `map`, `progress`
- **Interactive**: `button`, `link`, `tabs`, `accordion`, `carousel`
- **Feedback**: `alert`, `dialog`, `tooltip`, `spinner`
- **Media**: `video`, `audio`, `iframe`

### A2UI Type Guards

```typescript
import { a2ui } from '@liquidcrypto/a2a-sdk';

// Check if an artifact contains A2UI content
if (a2ui.isA2UIArtifact(artifact)) {
  const messages = a2ui.extractA2UIMessages(artifact);

  for (const msg of messages) {
    if (a2ui.isBeginRenderingMessage(msg)) {
      console.log('Begin rendering surface:', msg.surfaceId);
    } else if (a2ui.isSurfaceUpdateMessage(msg)) {
      console.log('Components:', msg.components);
    }
  }
}
```

## 🔌 Server Adapters

### Express Adapter

```typescript
import { ExpressA2AServer } from '@liquidcrypto/a2a-sdk';

const server = new ExpressA2AServer({
  agentCard,
  executor,
  port: 3000,
});

await server.start();
```

### Fastify Adapter

```typescript
import { FastifyA2AServer } from '@liquidcrypto/a2a-sdk';

const server = new FastifyA2AServer({
  agentCard,
  executor,
  port: 3000,
  logLevel: 'info',
});

await server.start();
```

### gRPC Adapter

```typescript
import { GrpcA2AServer } from '@liquidcrypto/a2a-sdk';

const server = new GrpcA2AServer({
  agentCard,
  executor,
  port: 50051,
});

await server.start();
```

See [GRPC.md](./GRPC.md) for complete gRPC documentation.

## 💾 Database Support

The SDK includes database adapters for task persistence:

```typescript
import { PostgresTaskStore, MySQLTaskStore, SQLiteTaskStore } from '@liquidcrypto/a2a-sdk';

// PostgreSQL
const pgStore = new PostgresTaskStore({
  connectionString: 'postgresql://user:pass@localhost/db',
  tableName: 'a2a_tasks',
});

// MySQL
const mysqlStore = new MySQLTaskStore({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'a2a',
});

// SQLite
const sqliteStore = new SQLiteTaskStore({
  filename: './tasks.db',
});

await pgStore.initialize();
```

See [DATABASE.md](./DATABASE.md) for complete database documentation.

## 📊 Telemetry

OpenTelemetry integration for observability:

```typescript
import { A2AServer } from '@liquidcrypto/a2a-sdk';

const server = new A2AServer({
  agentCard,
  executor,
  telemetry: {
    serviceName: 'my-agent',
    enabled: true,
    openTelemetry: {
      serviceName: 'my-agent',
      serviceVersion: '1.0.0',
      traceExporterUrl: 'http://localhost:4318/v1/traces',
      metricsExporterUrl: 'http://localhost:4318/v1/metrics',
    },
  },
});
```

See [TELEMETRY.md](./TELEMETRY.md) for complete telemetry documentation.

## 🔧 Configuration

### Client Configuration

```typescript
interface A2AClientConfig {
  baseUrl: string;                    // Agent endpoint URL
  authToken?: string;                 // Bearer token for authentication
  headers?: Record<string, string>;   // Additional headers
  timeout?: number;                   // Request timeout in ms (default: 30000)
}
```

### Server Configuration

```typescript
interface ServerConfig {
  agentCard: AgentCard;               // Agent description (v1.0 format)
  executor: AgentExecutor;            // Agent logic implementation
  port?: number;                      // Server port (default: 3000)
  host?: string;                      // Server host (default: '0.0.0.0')
  ssl?: SSLConfig;                    // SSL configuration
  cors?: CORSConfig;                  // CORS configuration
  timeout?: number;                   // Request timeout in ms
  database?: DatabaseConfig;          // Database for task persistence
  telemetry?: TelemetryConfig;        // OpenTelemetry configuration
}
```

## 📦 Project Structure

```
src/
├── types/
│   ├── v1.ts           # A2A Protocol v1.0 types (camelCase)
│   └── a2ui.ts         # A2UI component types
├── server/
│   ├── express-adapter.ts
│   ├── fastify-adapter.ts
│   ├── grpc-adapter.ts
│   ├── jsonrpc-handler.ts
│   ├── request-handler.ts
│   └── database/       # Database adapters
├── shim.ts             # Main client and exports
└── index.ts            # Entry point
```

## 🧪 Testing

```bash
npm test
npm run test:coverage
```

## 📝 Building

```bash
npm run build
npm run build:watch
npm run build:docs
```

## 🔄 Migration from Legacy Format

See [MIGRATION.md](./MIGRATION.md) for migrating from snake_case to v1.0 camelCase types.

### Key Changes in v1.0

1. **Type naming**: All types use camelCase (`messageId` not `message_id`)
2. **Task states**: Use kebab-case (`input-required` not `input_required`)
3. **Method names**: PascalCase (`SendMessage` not `message/send`)
4. **Agent card**: `protocolVersions` array, `capabilities` object with camelCase

## 📚 Resources

- [A2A Protocol v1.0 Specification](https://a2a-protocol.org/latest/specification/)
- [A2UI Specification](https://github.com/google/a2ui)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

Apache 2.0 License. See [LICENSE](LICENSE) for details.

## 📢 Status

- ✅ A2A Protocol v1.0 types (camelCase)
- ✅ JSON-RPC 2.0 client and server
- ✅ A2UI declarative UI support
- ✅ Server adapters (Express, Fastify)
- ✅ Database adapters (PostgreSQL, MySQL, SQLite)
- ✅ OpenTelemetry integration
- ✅ gRPC transport
- ✅ SSE streaming support
- 🔄 Comprehensive test suite
- 🔄 Additional examples
