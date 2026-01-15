# gRPC Transport for A2A TypeScript SDK

## Overview

The A2A TypeScript SDK includes comprehensive support for gRPC as a transport protocol. gRPC provides high-performance, bidirectional streaming communication between A2A agents, making it ideal for real-time agent interactions and efficient data transfer.

## Features

- **High Performance**: gRPC uses HTTP/2 for efficient, low-latency communication
- **Bidirectional Streaming**: Full support for streaming requests and responses
- **Protocol Buffers**: Efficient binary serialization with automatic code generation
- **Type Safety**: Generated TypeScript types for compile-time checking
- **Async/Await Support**: Modern JavaScript/TypeScript patterns throughout

## Architecture

The gRPC implementation consists of several key components:

### 1. Protocol Buffer Definitions (`proto/a2a.proto`)

The complete A2A protocol specification defined in Protocol Buffers format, including:
- Message, Task, and Artifact structures
- Streaming event types
- AgentCard and capabilities
- All JSON-RPC methods mapped to gRPC services

### 2. Type Conversion Utilities (`src/utils/proto-utils.ts`)

Bi-directional conversion between:
- TypeScript native types ↔ Protocol Buffer messages
- Handles complex nested structures
- Metadata and extension support

### 3. Client Transport (`src/transports/grpc-transport.ts`)

Full gRPC client implementation:
- Non-blocking asynchronous operations
- Streaming support for message streams
- Connection management
- Extension header support

### 4. Server Components

#### gRPC Handler (`src/server/grpc-handler.ts`)
- Maps gRPC service methods to RequestHandler interface
- Handles streaming operations
- Error mapping and context propagation

#### Server Adapter (`src/server/grpc-adapter.ts`)
- Server bootstrap and lifecycle management
- Service registration
- Graceful shutdown handling

## Installation

### Required Dependencies

```bash
npm install @grpc/grpc-js @grpc/proto-loader google-protobuf
```

### Development Dependencies

```bash
npm install --save-dev protoc protoc-gen-ts
```

### Build gRPC Files

After installing dependencies, generate TypeScript types from protocol buffers:

```bash
npm run build:grpc
```

This generates:
- `proto/a2a_pb.js` - Protocol buffer JavaScript code
- `proto/a2a_grpc_pb.js` - gRPC service definitions

## Usage

### Creating a gRPC Client

#### Basic Client

```typescript
import { Client, GrpcTransport } from 'a2a-sdk';
import type { AgentCard, Message } from 'a2a-sdk';

const agentCard: AgentCard = {
  // ... agent card configuration
};

const grpcChannelFactory = (url: string) => {
  const { ChannelCredentials } = require('@grpc/grpc-js');
  return new require('@grpc/grpc-js').Client(
    url,
    ChannelCredentials.createInsecure()
  );
};

const config = {
  grpcChannelFactory,
};

const transport = GrpcTransport.create(
  agentCard,
  'localhost:50051',
  config
);

const client = new Client(transport);
```

#### Client with Secure Connection

```typescript
const fs = require('fs');

const grpcChannelFactory = (url: string) => {
  const { ChannelCredentials } = require('@grpc/grpc-js');
  const cert = fs.readFileSync('path/to/server-cert.pem');
  const key = fs.readFileSync('path/to/server-key.pem');
  const ca = fs.readFileSync('path/to/ca-cert.pem');

  return new require('@grpc/grpc-js').Client(
    url,
    ChannelCredentials.createSsl(ca, key, cert)
  );
};
```

### Sending Messages

#### Non-Streaming Message

```typescript
const message: Message = {
  message_id: 'msg-123',
  role: 'user',
  parts: [
    {
      root: {
        text: 'Hello, agent!',
      },
    },
  ],
};

const response = await client.sendMessage({
  message,
});

console.log('Response:', response);
```

#### Streaming Message

```typescript
const stream = client.sendMessageStreaming({
  message,
});

for await (const event of stream) {
  console.log('Event:', event);

  if ('message_id' in event) {
    console.log('Message:', event);
  } else if ('id' in event && 'status' in event) {
    console.log('Task:', event);
  } else if ('task_id' in event) {
    console.log('Update:', event);
  }
}
```

### Creating a gRPC Server

#### Basic Server

```typescript
import { GrpcA2AServer, AgentExecutor } from 'a2a-sdk';
import { v4 as uuidv4 } from 'uuid';

class EchoAgent implements AgentExecutor {
  async execute(message: Message): Promise<AgentExecutionResult> {
    return {
      message: {
        message_id: uuidv4(),
        role: 'agent',
        parts: message.parts,
        context_id: message.context_id,
      },
    };
  }
}

const server = new GrpcA2AServer({
  agentCard: {
    name: 'My gRPC Agent',
    version: '1.0.0',
    capabilities: {
      streaming: true,
      push_notifications: false,
      extensions: [],
    },
    // ... other agent card fields
  },
  executor: new EchoAgent(),
  port: 50051,
  host: '0.0.0.0',
});

await server.start();
```

#### Streaming Server

```typescript
class StreamingAgent implements AgentExecutor {
  async *executeStream(
    message: Message
  ): AsyncGenerator<any, AgentExecutionResult, unknown> {
    // Send status update
    yield {
      task_id: message.task_id,
      status: {
        state: 'working',
        message: {
          message_id: uuidv4(),
          role: 'agent',
          parts: [{ root: { text: 'Processing...' } }],
        },
      },
      final: false,
    };

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send result
    const result: Message = {
      message_id: uuidv4(),
      role: 'agent',
      parts: message.parts,
      context_id: message.context_id,
    };

    yield result;

    return { message: result };
  }
}
```

## Protocol Buffer Schema

The complete A2A protocol is defined in `proto/a2a.proto`:

```protobuf
service A2AService {
  rpc SendMessage(SendMessageRequest) returns (SendMessageResponse);
  rpc SendStreamingMessage(SendMessageRequest) returns (stream StreamResponse);
  rpc GetTask(GetTaskRequest) returns (Task);
  rpc CancelTask(CancelTaskRequest) returns (Task);
  rpc TaskSubscription(TaskSubscriptionRequest) returns (stream StreamResponse);
  rpc GetAgentCard(GetAgentCardRequest) returns (AgentCard);
  // ... additional methods
}
```

### Key Message Types

#### SendMessageRequest
```protobuf
message SendMessageRequest {
  Message request = 1;
  SendMessageConfiguration configuration = 2;
  google.protobuf.Struct metadata = 3;
}
```

#### StreamResponse
```protobuf
message StreamResponse {
  oneof event {
    Message msg = 1;
    Task task = 2;
    TaskStatusUpdateEvent status_update = 3;
    TaskArtifactUpdateEvent artifact_update = 4;
  }
}
```

## Error Handling

### Client-Side Errors

```typescript
try {
  const response = await client.sendMessage({ message });
} catch (error) {
  if (error.code === 2) { // INTERNAL
    console.error('Internal error:', error.details);
  } else if (error.code === 3) { // INVALID_ARGUMENT
    console.error('Invalid request:', error.details);
  }
}
```

### Server-Side Errors

```typescript
class MyAgent implements AgentExecutor {
  async execute(message: Message): Promise<AgentExecutionResult> {
    try {
      // ... business logic
    } catch (error) {
      // Errors are automatically mapped to gRPC status codes
      throw new Error('Task failed: ' + error.message);
    }
  }
}
```

## Best Practices

### 1. Connection Management

```typescript
// Always close connections when done
const transport = GrpcTransport.create(...);
const client = new Client(transport);

try {
  await client.sendMessage(...);
} finally {
  await transport.close();
}
```

### 2. Streaming Cleanup

```typescript
const stream = client.sendMessageStreaming({ message });

for await (const event of stream) {
  // Process events
}

// Stream automatically closed when iteration completes
```

### 3. Server Shutdown

```typescript
const server = new GrpcA2AServer({...});

const shutdown = async () => {
  console.log('Shutting down...');
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

### 4. Type Safety

```typescript
// Always use proper TypeScript types
import type { Message, Task } from 'a2a-sdk';

const event = await stream.next();
if ('message_id' in event.value) {
  const message: Message = event.value;
  // TypeScript knows this is a Message
}
```

## Examples

See the `examples/` directory for complete implementations:

- `grpc-server-example.ts` - Full server implementation
- `grpc-client-example.ts` - Client usage examples

## Limitations and Notes

### 1. Binary Dependencies

gRPC requires native modules, which may not work in all environments:
- Some cloud platforms restrict native module compilation
- Docker containers may need additional build tools
- Consider using pre-built binaries for production

### 2. Browser Support

gRPC-js is primarily designed for Node.js. For browser applications:
- Use gRPC-Web with a proxy
- Consider WebSocket alternatives
- Check browser compatibility

### 3. TLS Configuration

For production deployments:
- Always use TLS in production
- Configure proper certificates
- Use ChannelCredentials for secure connections

### 4. Performance Considerations

- gRPC is more efficient than HTTP/JSON for high-throughput scenarios
- Streaming reduces latency for real-time applications
- Protocol buffers are more compact than JSON

## Migration from JSON-RPC

The gRPC transport is a drop-in replacement for JSON-RPC:

```typescript
// JSON-RPC (HTTP)
const client = await ClientFactory.createClientFromUrl(
  'http://localhost:3000/a2a/v1'
);

// gRPC
const client = new Client(
  GrpcTransport.create(agentCard, 'localhost:50051', config)
);

// Both use the same interface
await client.sendMessage({ message });
```

## Troubleshooting

### Connection Refused
- Verify server is running: `telnet localhost 50051`
- Check firewall settings
- Ensure host and port are correct

### TLS Errors
- Verify certificate paths
- Check certificate validity
- Ensure client and server TLS settings match

### Streaming Issues
- Ensure agent capabilities include streaming
- Check for proper async/await usage
- Verify stream cleanup

## Comparison: gRPC vs HTTP/JSON-RPC

| Feature | gRPC | HTTP/JSON-RPC |
|---------|------|---------------|
| Performance | High | Medium |
| Streaming | Native | SSE/WebSocket |
| Type Safety | Strong | Weak |
| Browser Support | Limited | Excellent |
| Setup Complexity | Medium | Low |
| Binary Data | Native | Base64 |
| HTTP/2 | Yes | No |
| HTTP/1.1 | No | Yes |

## Further Reading

- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)
- [A2A Protocol Specification](https://a2a-protocol.org)
