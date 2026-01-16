/**
 * Proto Utilities for A2A SDK
 *
 * Provides dynamic proto loading and conversion utilities for gRPC support.
 * Uses protobufjs for runtime proto parsing without requiring code generation.
 */

import type {
  Message,
  Task,
  TaskState,
  TaskStatus,
  Artifact,
  Part,
  AgentCard,
  JSONValue,
} from '../types/v1';

// Proto package definition loaded at runtime
let protoRoot: unknown = null;

/**
 * Load the A2A proto definition
 * Uses dynamic import to avoid bundling issues
 */
export async function loadProtoDefinition(protoPath?: string): Promise<unknown> {
  if (protoRoot) {
    return protoRoot;
  }

  try {
    const protobuf = await import('protobufjs');
    const path = await import('path');

    // Default to the proto file in the package
    const resolvedPath = protoPath || path.join(__dirname, '../../proto/a2a.proto');

    protoRoot = await protobuf.load(resolvedPath);
    return protoRoot;
  } catch (error) {
    console.warn('Failed to load proto definition:', error);
    return null;
  }
}

/**
 * Get the proto root (must call loadProtoDefinition first)
 */
export function getProtoRoot(): unknown {
  return protoRoot;
}

/**
 * Task state mapping from TypeScript to proto enum values
 * Note: v1 spec uses kebab-case for some states
 */
const TASK_STATE_TO_PROTO: Record<TaskState, number> = {
  'submitted': 1,
  'working': 2,
  'completed': 3,
  'cancelled': 4,
  'failed': 5,
  'input-required': 6,
  'auth-required': 7,
  'rejected': 0, // Map rejected to unspecified (not in proto)
};

/**
 * Task state mapping from proto enum values to TypeScript
 */
const PROTO_TO_TASK_STATE: Record<number, TaskState> = {
  0: 'rejected',
  1: 'submitted',
  2: 'working',
  3: 'completed',
  4: 'cancelled',
  5: 'failed',
  6: 'input-required',
  7: 'auth-required',
};

/**
 * Role mapping
 */
const ROLE_TO_PROTO: Record<string, number> = {
  user: 1,
  agent: 2,
};

const PROTO_TO_ROLE: Record<number, string> = {
  0: 'agent',
  1: 'user',
  2: 'agent',
};

/**
 * Convert a TypeScript Message to proto format
 */
export function messageToProto(message: Message): Record<string, unknown> {
  return {
    messageId: message.messageId,
    content: message.parts?.map(partToProto) || [],
    contextId: message.contextId || '',
    taskId: message.taskId || '',
    role: ROLE_TO_PROTO[message.role] || 0,
    metadata: message.metadata ? { fields: objectToProtoStruct(message.metadata as Record<string, unknown>) } : null,
    extensions: message.extensions || [],
  };
}

/**
 * Convert a proto Message to TypeScript format
 */
export function messageFromProto(proto: Record<string, unknown>): Message {
  return {
    messageId: (proto.messageId as string) || '',
    parts: Array.isArray(proto.content)
      ? (proto.content as Record<string, unknown>[]).map(partFromProto)
      : [],
    contextId: proto.contextId as string | undefined,
    taskId: proto.taskId as string | undefined,
    role: PROTO_TO_ROLE[(proto.role as number) || 0] as 'user' | 'agent',
    metadata: proto.metadata ? protoStructToObject(proto.metadata as Record<string, unknown>) as Record<string, JSONValue> : undefined,
    extensions: proto.extensions as string[] | undefined,
  };
}

/**
 * Convert a Part to proto format
 * Part uses optional fields: text, file, data (mutually exclusive)
 */
export function partToProto(part: Part): Record<string, unknown> {
  const result: Record<string, unknown> = {
    metadata: part.metadata ? { fields: objectToProtoStruct(part.metadata as Record<string, unknown>) } : null,
  };

  if (part.text !== undefined) {
    result.text = part.text;
  } else if (part.file) {
    result.file = {
      fileWithUri: part.file.fileWithUri,
      fileWithBytes: part.file.fileWithBytes,
      mimeType: part.file.mediaType || '',
      name: part.file.name || '',
    };
  } else if (part.data) {
    result.data = {
      data: { fields: objectToProtoStruct(part.data.data as Record<string, unknown>) },
    };
  }

  return result;
}

/**
 * Convert a proto Part to TypeScript format
 */
export function partFromProto(proto: Record<string, unknown>): Part {
  const metadata = proto.metadata
    ? protoStructToObject(proto.metadata as Record<string, unknown>) as Record<string, JSONValue>
    : undefined;

  if (proto.text !== undefined) {
    return {
      text: proto.text as string,
      metadata,
    };
  }

  if (proto.file) {
    const file = proto.file as Record<string, unknown>;
    return {
      file: {
        fileWithUri: file.fileWithUri as string | undefined,
        fileWithBytes: file.fileWithBytes as string | undefined,
        mediaType: file.mimeType as string | undefined,
        name: file.name as string | undefined,
      },
      metadata,
    };
  }

  if (proto.data) {
    const data = proto.data as Record<string, unknown>;
    return {
      data: {
        data: data.data ? protoStructToObject(data.data as Record<string, unknown>) as JSONValue : null,
      },
      metadata,
    };
  }

  // Default to empty text part
  return { text: '', metadata };
}

/**
 * Convert a Task to proto format
 */
export function taskToProto(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    contextId: task.contextId,
    status: task.status ? taskStatusToProto(task.status) : null,
    artifacts: task.artifacts?.map(artifactToProto) || [],
    history: task.history?.map(messageToProto) || [],
    metadata: task.metadata ? { fields: objectToProtoStruct(task.metadata as Record<string, unknown>) } : null,
  };
}

/**
 * Convert a proto Task to TypeScript format
 */
export function taskFromProto(proto: Record<string, unknown>): Task {
  const status = proto.status
    ? taskStatusFromProto(proto.status as Record<string, unknown>)
    : { state: 'submitted' as TaskState };

  return {
    id: (proto.id as string) || '',
    contextId: (proto.contextId as string) || '',
    status,
    artifacts: Array.isArray(proto.artifacts)
      ? (proto.artifacts as Record<string, unknown>[]).map(artifactFromProto)
      : undefined,
    history: Array.isArray(proto.history)
      ? (proto.history as Record<string, unknown>[]).map(messageFromProto)
      : undefined,
    metadata: proto.metadata
      ? protoStructToObject(proto.metadata as Record<string, unknown>) as Record<string, JSONValue>
      : undefined,
  };
}

/**
 * Convert a TaskStatus to proto format
 */
export function taskStatusToProto(status: TaskStatus): Record<string, unknown> {
  return {
    state: TASK_STATE_TO_PROTO[status.state] || 0,
    timestamp: status.timestamp,
    message: status.message ? messageToProto(status.message) : null,
  };
}

/**
 * Convert a proto TaskStatus to TypeScript format
 */
export function taskStatusFromProto(proto: Record<string, unknown>): TaskStatus {
  return {
    state: PROTO_TO_TASK_STATE[(proto.state as number) || 0] || 'submitted',
    timestamp: proto.timestamp as string | undefined,
    message: proto.message
      ? messageFromProto(proto.message as Record<string, unknown>)
      : undefined,
  };
}

/**
 * Convert an Artifact to proto format
 */
export function artifactToProto(artifact: Artifact): Record<string, unknown> {
  return {
    artifactId: artifact.artifactId,
    name: artifact.name || '',
    description: artifact.description || '',
    parts: artifact.parts?.map(partToProto) || [],
    metadata: artifact.metadata ? { fields: objectToProtoStruct(artifact.metadata as Record<string, unknown>) } : null,
    extensions: artifact.extensions || [],
  };
}

/**
 * Convert a proto Artifact to TypeScript format
 */
export function artifactFromProto(proto: Record<string, unknown>): Artifact {
  return {
    artifactId: (proto.artifactId as string) || '',
    name: proto.name as string | undefined,
    description: proto.description as string | undefined,
    parts: Array.isArray(proto.parts)
      ? (proto.parts as Record<string, unknown>[]).map(partFromProto)
      : [],
    metadata: proto.metadata
      ? protoStructToObject(proto.metadata as Record<string, unknown>) as Record<string, JSONValue>
      : undefined,
    extensions: proto.extensions as string[] | undefined,
  };
}

/**
 * Convert an AgentCard to proto format
 */
export function agentCardToProto(card: AgentCard): Record<string, unknown> {
  return {
    name: card.name,
    description: card.description || '',
    version: card.version || '',
    documentationUrl: card.documentationUrl || '',
    provider: card.provider
      ? {
          organization: card.provider.organization,
          url: card.provider.url || '',
        }
      : null,
    capabilities: card.capabilities
      ? {
          streaming: card.capabilities.streaming || false,
          pushNotifications: card.capabilities.pushNotifications || false,
          extensions: card.capabilities.extensions?.map((ext) => ({
            uri: ext.uri,
            description: ext.description || '',
            params: ext.params ? { fields: objectToProtoStruct(ext.params as Record<string, unknown>) } : null,
            required: ext.required || false,
          })) || [],
        }
      : null,
    defaultInputModes: card.defaultInputModes || [],
    defaultOutputModes: card.defaultOutputModes || [],
    skills: card.skills?.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description || '',
      tags: skill.tags || [],
      examples: skill.examples || [],
      inputModes: skill.inputModes || [],
      outputModes: skill.outputModes || [],
    })) || [],
    protocolVersions: card.protocolVersions || [],
  };
}

/**
 * Convert a JavaScript object to proto Struct fields
 */
export function objectToProtoStruct(obj: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    fields[key] = valueToProtoValue(value);
  }

  return fields;
}

/**
 * Convert a single value to proto Value format
 */
function valueToProtoValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { nullValue: 0 };
  }

  if (typeof value === 'boolean') {
    return { boolValue: value };
  }

  if (typeof value === 'number') {
    return { numberValue: value };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (Array.isArray(value)) {
    return {
      listValue: {
        values: value.map(valueToProtoValue),
      },
    };
  }

  if (typeof value === 'object') {
    return {
      structValue: {
        fields: objectToProtoStruct(value as Record<string, unknown>),
      },
    };
  }

  return { stringValue: String(value) };
}

/**
 * Convert a proto Struct to JavaScript object
 */
export function protoStructToObject(struct: Record<string, unknown>): Record<string, unknown> {
  const fields = struct.fields as Record<string, unknown> | undefined;
  if (!fields) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, protoValue] of Object.entries(fields)) {
    result[key] = protoValueToValue(protoValue as Record<string, unknown>);
  }

  return result;
}

/**
 * Convert a proto Value to JavaScript value
 */
function protoValueToValue(protoValue: Record<string, unknown>): unknown {
  if ('nullValue' in protoValue) {
    return null;
  }

  if ('boolValue' in protoValue) {
    return protoValue.boolValue;
  }

  if ('numberValue' in protoValue) {
    return protoValue.numberValue;
  }

  if ('stringValue' in protoValue) {
    return protoValue.stringValue;
  }

  if ('listValue' in protoValue) {
    const listValue = protoValue.listValue as Record<string, unknown>;
    const values = listValue.values as Record<string, unknown>[];
    return values?.map(protoValueToValue) || [];
  }

  if ('structValue' in protoValue) {
    return protoStructToObject(protoValue.structValue as Record<string, unknown>);
  }

  return null;
}

/**
 * Create a gRPC service definition from the proto
 * This is useful for creating gRPC servers and clients
 */
export async function getServiceDefinition(): Promise<unknown> {
  const root = await loadProtoDefinition();
  if (!root) {
    return null;
  }

  try {
    // Type assertion for protobufjs Root
    const pbRoot = root as { lookupService: (name: string) => unknown };
    return pbRoot.lookupService('a2a.A2AService');
  } catch (error) {
    console.warn('Failed to get A2A service definition:', error);
    return null;
  }
}

/**
 * Proto utilities export object for convenient access
 */
export const ProtoUtils = {
  loadProtoDefinition,
  getProtoRoot,
  getServiceDefinition,

  // Message conversions
  messageToProto,
  messageFromProto,

  // Part conversions
  partToProto,
  partFromProto,

  // Task conversions
  taskToProto,
  taskFromProto,
  taskStatusToProto,
  taskStatusFromProto,

  // Artifact conversions
  artifactToProto,
  artifactFromProto,

  // Agent card conversions
  agentCardToProto,

  // Struct conversions
  objectToProtoStruct,
  protoStructToObject,
};

export default ProtoUtils;
