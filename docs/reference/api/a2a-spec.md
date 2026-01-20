# A2A Protocol v1.0 Specification Reference

**Source**: [A2A Protocol v1.0 Draft Specification](https://a2a-protocol.org/latest/specification/)  
**Last Updated**: 2026-01-17

This document provides a reference implementation guide for A2A Protocol v1.0 as implemented in LiquidCrypto.

---

## Overview

The Agent-to-Agent (A2A) Protocol defines a standard for communication between AI agents. It uses JSON-RPC 2.0 over HTTP with optional SSE streaming support.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Agent** | An AI service that can process messages and produce artifacts |
| **Task** | A unit of work with status tracking and optional artifacts |
| **Context** | Groups related tasks for multi-turn conversations |
| **Artifact** | Output produced by an agent (text, files, data) |
| **Message** | Communication unit with parts and metadata |

---

## Agent Card

The Agent Card is a JSON document describing an agent's capabilities, published at `/.well-known/agent-card.json`.

### Required Fields

```typescript
interface AgentCard {
  // Protocol versions supported
  protocolVersions: string[];  // e.g., ['1.0']
  
  // Agent identification
  name: string;
  description: string;
  version: string;
  
  // Endpoints
  supportedInterfaces: SupportedInterface[];
  
  // Capabilities
  capabilities: AgentCapabilities;
  
  // Input/output modes
  defaultInputModes: string[];   // e.g., ['text', 'file']
  defaultOutputModes: string[];  // e.g., ['text', 'file']
  
  // Skills
  skills: Skill[];
}

interface SupportedInterface {
  url: string;              // e.g., 'https://agent.example.com/a2a'
  protocolBinding: string;  // 'JSONRPC' | 'gRPC'
}

interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  extendedAgentCard?: boolean;
  extensions?: Extension[];
}

interface Extension {
  uri: string;          // Extension URI
  required?: boolean;   // Whether client MUST enable
  description?: string;
}
```

---

## JSON-RPC Methods

### Core Operations

| Method | Description |
|--------|-------------|
| `SendMessage` | Send message and wait for completion |
| `SendStreamingMessage` | Send message with SSE streaming response |
| `GetTask` | Retrieve task by ID |
| `ListTasks` | List tasks with optional filtering |
| `CancelTask` | Request task cancellation |
| `SubscribeToTask` | Subscribe to task updates via SSE |
| `GetExtendedAgentCard` | Get extended card with auth context |

### Push Notification Operations

| Method | Description |
|--------|-------------|
| `SetTaskPushNotificationConfig` | Configure push notifications for task |
| `GetTaskPushNotificationConfig` | Get push notification config |
| `ListTaskPushNotificationConfigs` | List all configs |
| `DeleteTaskPushNotificationConfig` | Remove push notification config |

---

## Data Types

### Message

```typescript
interface Message {
  messageId: string;
  role: 'user' | 'agent';
  parts: Part[];
  contextId?: string;
  taskId?: string;
  referenceTaskIds?: string[];  // For multi-turn
  metadata?: Record<string, unknown>;
  extensions?: string[];
}
```

### Part Types

A2A v1.0 uses **mutually exclusive fields** (not discriminated unions):

```typescript
interface Part {
  // Only ONE of these should be set:
  text?: string;
  file?: FilePart;
  data?: DataPart;
  
  // Optional metadata
  metadata?: Record<string, unknown>;
}

interface FilePart {
  fileWithUri?: {
    uri: string;
    mimeType?: string;
  };
  fileWithBytes?: {
    bytes: string;  // Base64 encoded
    mimeType?: string;
  };
  mediaType?: string;
}

interface DataPart {
  data: unknown;  // Any JSON value
}
```

### Task

```typescript
interface Task {
  id: string;
  contextId: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  metadata?: Record<string, unknown>;
}

interface TaskStatus {
  state: TaskState;
  message?: Message;
  timestamp: string;  // ISO 8601
}

type TaskState =
  | 'submitted'       // Initial state
  | 'working'         // Processing
  | 'completed'       // Success
  | 'failed'          // Error
  | 'cancelled'       // User cancelled
  | 'input-required'  // Needs user input (kebab-case!)
  | 'auth-required'   // Needs authentication (kebab-case!)
  | 'rejected';       // Refused to process
```

### Artifact

```typescript
interface Artifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: Record<string, unknown>;
  extensions?: string[];
}
```

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| -32001 | TaskNotFoundError | Task ID not found |
| -32002 | TaskNotCancelableError | Task cannot be cancelled |
| -32003 | PushNotificationNotSupportedError | Push notifications not available |
| -32004 | UnsupportedOperationError | Operation not supported |
| -32005 | ContentTypeNotSupportedError | Content type not accepted |
| -32006 | InvalidAgentResponseError | Agent produced invalid response |
| -32007 | ExtendedAgentCardNotConfiguredError | Extended card not available |
| -32008 | ExtensionSupportRequiredError | Required extension not enabled |
| -32009 | VersionNotSupportedError | Protocol version not supported |

---

## Headers

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `A2A-Version` | No | Preferred protocol version (e.g., `1.0`) |
| `A2A-Extensions` | No | Comma-separated extension URIs to enable |
| `Authorization` | No | Bearer token for authenticated endpoints |

### Response Headers

| Header | Description |
|--------|-------------|
| `A2A-Protocol-Version` | Protocol version used for response |
| `Content-Type` | `application/json` or `text/event-stream` |

---

## Streaming (SSE)

### Endpoint

```
POST /a2a/stream
Content-Type: application/json
Accept: text/event-stream
```

### Supported Methods

| Method | Description |
|--------|-------------|
| `SendMessage` | Create task + stream response |
| `StreamMessage` | Alias for SendMessage |
| `SendStreamingMessage` | Alias for SendMessage |
| `Resubscribe` | Subscribe to existing task updates |
| `SubscribeToTask` | Alias for Resubscribe |

### Request Example

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-1",
      "role": "user",
      "parts": [{"text": "Hello, agent!"}]
    }
  }
}
```

### SSE Response Events

```
data: {"jsonrpc":"2.0","id":"1","result":{"taskId":"abc","status":{"state":"submitted"}}}

data: {"jsonrpc":"2.0","id":"1","result":{"type":"status","taskId":"abc","status":{"state":"working"}}}

data: {"jsonrpc":"2.0","id":"1","result":{"type":"artifact","taskId":"abc","artifact":{...}}}

data: {"jsonrpc":"2.0","id":"1","result":{"type":"status","taskId":"abc","status":{"state":"completed"},"final":true}}
```

### Event Types

| Type | Fields |
|------|--------|
| Initial | `taskId`, `contextId`, `status` |
| `status` | `taskId`, `status`, `final` |
| `artifact` | `taskId`, `artifact` |

### LiquidCrypto Implementation

✅ **Fully v1.0 compliant** - implemented in `elysia-adapter.ts`:
- Creates new task from message
- Persists to database
- Streams status and artifact updates
- Handles errors gracefully

---

## Multi-Turn Conversations

### ContextId Rules

1. If client provides `contextId`, agent MUST use it
2. If client doesn't provide `contextId`, agent MUST generate one
3. All tasks in a conversation share the same `contextId`
4. `referenceTaskIds` MUST reference tasks in the same `contextId`

### Validation

```typescript
// Before processing SendMessage with referenceTaskIds:
for (const refTaskId of message.referenceTaskIds) {
  const refTask = await taskStore.get(refTaskId);
  if (refTask && refTask.contextId !== message.contextId) {
    throw new Error('Referenced task does not belong to this context');
  }
}
```

---

## Discovery

Agents publish their card at the canonical v1.0 endpoint:

| Path | Status |
|------|--------|
| `/.well-known/agent-card.json` | ✅ Canonical (v1.0) |
| `/.well-known/agent.json` | ❌ Removed (strict v1.0 mode) |

> **Note**: As of January 2026, LiquidCrypto operates in strict v1.0 mode with the legacy `/.well-known/agent.json` endpoint removed.

---

## Pagination

ListTasks uses **cursor-based pagination**:

### Request

```typescript
interface ListTasksParams {
  contextId?: string;
  state?: TaskState[];
  cursor?: string;   // Opaque cursor from previous response
  limit?: number;    // Max results (1-100, default 20)
}
```

### Response

```typescript
interface ListTasksResult {
  tasks: Task[];
  nextCursor?: string;  // Present if more results exist
}
```

### Cursor Format (Implementation)

LiquidCrypto uses `base64(timestamp:taskId)` format:

```typescript
// Generate cursor
const cursor = Buffer.from(`${timestamp}:${taskId}`).toString('base64');

// Parse cursor
const [timestamp, taskId] = Buffer.from(cursor, 'base64').toString().split(':');
```

---

## Extensions

### Declaring Extensions

In Agent Card:

```json
{
  "capabilities": {
    "extensions": [
      {
        "uri": "https://a2a.io/extensions/streaming-artifacts",
        "required": false,
        "description": "Progressive artifact streaming"
      }
    ]
  }
}
```

### Enabling Extensions

Client sends `A2A-Extensions` header:

```
A2A-Extensions: https://a2a.io/extensions/streaming-artifacts, https://example.com/my-ext
```

### Validation

If agent requires an extension that client didn't enable:

```json
{
  "error": {
    "code": -32008,
    "message": "Extension support required",
    "data": {
      "required": ["https://a2a.io/extensions/required-ext"],
      "provided": []
    }
  }
}
```

---

## Push Notifications

### Configuration

```typescript
interface PushNotificationConfig {
  url: string;          // Webhook URL
  id?: string;          // Config identifier
  token?: string;       // Auth token for webhook
  authentication?: {
    schemes: string[];  // e.g., ['bearer', 'basic']
    credentials?: string;
  };
}

interface TaskPushNotificationConfig {
  taskId: string;
  pushNotificationConfig: PushNotificationConfig;
}
```

### Webhook Payload

```json
{
  "taskId": "abc-123",
  "status": {
    "state": "completed",
    "timestamp": "2026-01-17T12:00:00Z"
  },
  "artifact": { ... }
}
```

---

## Implementation Checklist

### Required

- [ ] AgentCard at `/.well-known/agent-card.json`
- [ ] `protocolVersions` in AgentCard
- [ ] `supportedInterfaces` in AgentCard
- [ ] `SendMessage` method
- [ ] `GetTask` method
- [ ] TaskState kebab-case (`input-required`, `auth-required`)
- [ ] Part types with mutually exclusive fields

### Recommended

- [ ] `A2A-Version` header validation
- [ ] Streaming support (SSE)
- [ ] Cursor-based pagination for `ListTasks`
- [ ] Push notifications
- [ ] Extensions mechanism

### LiquidCrypto Status

✅ **100% Complete** - All items implemented and tested.

| Category | Status |
|----------|--------|
| Agent Card | ✅ |
| Core Methods | ✅ |
| TaskState Enums | ✅ |
| Part Types | ✅ |
| Version Headers | ✅ |
| Streaming (SSE) | ✅ |
| Cursor Pagination | ✅ |
| Push Notifications | ✅ |
| Extensions | ✅ |
| Database Persistence | ✅ |
| Integration Tests | ✅ (27 tests) |

See the [implementation walkthrough](../walkthrough.md) for details.

---

## References

- [A2A Protocol Official Site](https://a2a-protocol.org/)
- [A2A Protocol Specification v1.0](https://a2a-protocol.org/latest/specification/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
