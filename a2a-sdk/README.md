# A2A TypeScript SDK

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

A TypeScript library for building agentic applications that follow the [Agent2Agent (A2A) Protocol](https://a2a-protocol.org).

This is a TypeScript/JavaScript port of the [A2A Python SDK](https://github.com/a2aproject/a2a-python).

## ✨ Features

- **A2A Protocol Compliant**: Build agentic applications that adhere to the Agent2Agent (A2A) Protocol
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Transport Agnostic**: Support for multiple transport protocols (JSON-RPC, gRPC, HTTP+JSON)
- **Async/Await**: Modern asynchronous JavaScript patterns
- **Extensible**: Easy to extend with custom transports, middleware, and integrations

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- TypeScript 5.0.0 or higher

### Installation

```bash
npm install a2a-sdk
# or
yarn add a2a-sdk
# or
pnpm add a2a-sdk
```

### Basic Usage

#### Creating a Client

```typescript
import { ClientFactory, ClientConfig } from 'a2a-sdk';

// Create a client from an agent URL
const config: ClientConfig = {
  streaming: true,
  timeout: 30000,
};

const client = await ClientFactory.createClientFromUrl(
  'https://api.example.com/a2a/v1',
  config
);

// Send a message
const message = {
  kind: 'message',
  message_id: 'msg-123',
  role: 'user',
  parts: [
    {
      kind: 'text',
      text: 'Hello, agent!',
    },
  ],
};

for await (const event of client.sendMessage(message)) {
  if ('message' in event) {
    console.log('Received message:', event.message);
  } else if (event && event[0]) {
    console.log('Task update:', event[0]);
  }
}
```

#### Creating a Simple Agent

```typescript
import { A2AServer, AgentExecutor, ServerConfig } from 'a2a-sdk';

class MyAgentExecutor implements AgentExecutor {
  async execute(
    message: Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Implement your agent logic here
    const response: Message = {
      kind: 'message',
      message_id: 'resp-456',
      role: 'agent',
      parts: [
        {
          kind: 'text',
          text: `Hello! You said: ${message.parts[0]?.text}`,
        },
      ],
    };

    return {
      message: response,
    };
  }
}

const serverConfig: ServerConfig = {
  agentCard: {
    name: 'My Agent',
    description: 'A simple greeting agent',
    version: '1.0.0',
    url: 'https://api.example.com/a2a/v1',
    capabilities: {
      streaming: true,
      push_notifications: false,
      state_transition_history: true,
    },
    skills: [],
    default_input_modes: ['text/plain'],
    default_output_modes: ['text/plain'],
  },
  executor: new MyAgentExecutor(),
  port: 3000,
};

const server = new A2AServer(serverConfig);
await server.start();
```

## 📚 API Reference

### Client API

#### `ClientFactory`

- `createClient(agentCard, config)`: Creates a client from an AgentCard
- `createClientFromUrl(agentUrl, config)`: Creates a client from a URL
- `fetchAgentCard(agentUrl)`: Fetches the AgentCard from a URL

#### `Client`

The `Client` interface provides methods for:

- `sendMessage()`: Send a message to an agent
- `getTask()`: Retrieve task status
- `cancelTask()`: Cancel a running task
- `setTaskCallback()`: Configure push notifications
- `getCard()`: Get agent card
- `resubscribe()`: Resubscribe to task updates

### Transport Protocols

#### JSON-RPC (Default)

The JSON-RPC transport uses standard HTTP POST requests with JSON payloads.

```typescript
import { JSONRPCTransport } from 'a2a-sdk';

const transport = new JSONRPCTransport('https://api.example.com/a2a/v1', {
  'Authorization': 'Bearer YOUR_TOKEN',
});
```

#### gRPC

gRPC provides high-performance bidirectional streaming communication for A2A agents.

**Installation:**
```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

**Generate Protocol Buffer Types:**
```bash
npm run build:grpc
```

**Client Example:**
```typescript
import { Client, GrpcTransport } from 'a2a-sdk';

const grpcChannelFactory = (url: string) => {
  const { ChannelCredentials } = require('@grpc/grpc-js');
  return new require('@grpc/grpc-js').Client(
    url,
    ChannelCredentials.createInsecure()
  );
};

const transport = GrpcTransport.create(agentCard, 'localhost:50051', {
  grpcChannelFactory,
});

const client = new Client(transport);
```

**Server Example:**
```typescript
import { GrpcA2AServer } from 'a2a-sdk';

const server = new GrpcA2AServer({
  agentCard: {...},
  executor: new MyAgentExecutor(),
  port: 50051,
});

await server.start();
```

See [GRPC.md](./GRPC.md) for complete documentation.

#### HTTP+JSON (Coming Soon)

HTTP+JSON transport support is planned for a future release.

### Server API

#### `A2AServer`

The `A2AServer` class provides a unified interface for creating A2A protocol servers:

- `start(framework)`: Starts the server using Fastify or Express
- `stop()`: Stops the server
- `getStatus()`: Gets the current server status
- `instance`: Gets the underlying server instance

#### `AgentExecutor`

Interface for implementing agent logic:

```typescript
interface AgentExecutor {
  execute(
    message: Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult>;

  executeStream?(
    message: Message,
    context: AgentExecutionContext
  ): AsyncIterableIterator<TaskEvent>;
}
```

#### Server Adapters

##### Fastify Adapter

```typescript
import { FastifyA2AServer, FastifyA2AConfig } from 'a2a-sdk';

const config: FastifyA2AConfig = {
  agentCard: { ... },
  executor: new MyAgentExecutor(),
  port: 3000,
};

const server = new FastifyA2AServer(config);
await server.start();
```

##### Express Adapter

```typescript
import { ExpressA2AServer, ExpressA2AConfig } from 'a2a-sdk';

const config: ExpressA2AConfig = {
  agentCard: { ... },
  executor: new MyAgentExecutor(),
  port: 3001,
};

const server = new ExpressA2AServer(config);
await server.start();
```

#### Task Management

The SDK provides in-memory implementations for task management:

- `InMemoryTaskStore`: Stores tasks in memory
- `InMemoryEventQueue`: Manages event streaming

## 🔧 Configuration

### Client Configuration

```typescript
interface ClientConfig {
  streaming?: boolean;              // Enable streaming (default: true)
  polling?: boolean;                // Use polling instead of streaming (default: false)
  acceptedOutputModes?: string[];   // Accepted output MIME types
  pushNotificationConfigs?: PushNotificationConfig[];
  extensions?: string[];            // Supported extension URIs
  preferredTransport?: string;       // Preferred transport protocol
  useClientPreference?: boolean;    // Use client preferences over server
  timeout?: number;                 // Request timeout in ms (default: 30000)
  headers?: Record<string, string>; // Default headers
}
```

### Server Configuration

```typescript
interface ServerConfig {
  agentCard: AgentCard;             // Agent description
  executor: AgentExecutor;          // Agent logic implementation
  port?: number;                    // Server port (default: 3000)
  host?: string;                    // Server host (default: 'localhost')
  ssl?: SSLConfig;                  // SSL configuration
  cors?: CORSConfig;                // CORS configuration
  timeout?: number;                 // Request timeout in ms
  maxConcurrency?: number;          // Maximum concurrent requests
}
```

## 📦 Project Structure

```
src/
├── types/              # Core type definitions
├── client/             # Client interfaces and implementations
├── server/             # Server interfaces and implementations
├── transports/         # Transport implementations
├── utils/              # Utility functions
└── index.ts           # Main entry point
```

## 🧪 Testing

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## 📝 Building

```bash
npm run build
```

Build with watch mode:

```bash
npm run build:watch
```

Generate documentation:

```bash
npm run build:docs
```

## 🤝 Migration from Python SDK

For detailed migration guidance, see [MIGRATION.md](./MIGRATION.md).

### Key Differences

1. **Async/Await**: TypeScript uses async/await instead of asyncio
2. **Type System**: Uses TypeScript's static type system instead of Pydantic
3. **Transports**: JSON-RPC transport uses fetch API instead of httpx
4. **Error Handling**: Uses try/catch instead of exception handling
5. **Event Streams**: Uses AsyncIterableIterator instead of AsyncIterator

## 🆚 Python SDK Compatibility

This SDK aims to provide feature parity with the [A2A Python SDK](https://github.com/a2aproject/a2a-python). The core types and protocol implementations are designed to be compatible.

## 📄 License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for more details.

## 🙏 Acknowledgments

- [A2A Protocol](https://a2a-protocol.org) - The Agent2Agent Protocol specification
- [A2A Python SDK](https://github.com/a2aproject/a2a-python) - Original Python implementation
- [TypeScript](https://www.typescriptlang.org/) - Type safety for JavaScript

## 📚 Resources

- [A2A Protocol Documentation](https://a2a-protocol.org)
- [A2A Python SDK](https://github.com/a2aproject/a2a-python)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📢 Status

This SDK is in active development. The core types, client, and server implementations are now functional:

- ✅ Core types and interfaces
- ✅ JSON-RPC transport (basic implementation)
- ✅ Server implementations (Fastify & Express adapters)
- ✅ Task management (in-memory store)
- ✅ Event queue (in-memory)
- ✅ Request handlers
- 🔄 gRPC transport
- 🔄 Database integrations
- 🔄 Telemetry/OpenTelemetry integration
- 🔄 Comprehensive test suite
- 🔄 Documentation and examples

For the latest updates, see [CHANGELOG.md](./CHANGELOG.md).
