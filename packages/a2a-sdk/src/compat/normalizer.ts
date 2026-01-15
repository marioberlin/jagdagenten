/**
 * A2A Protocol Compatibility Normalizer
 *
 * Provides bidirectional conversion between v0.x and v1.0 formats.
 * Allows the SDK to accept both formats and respond in the matching version.
 */

import type {
  Part as PartV0,
  TextPart as TextPartV0,
  FilePart as FilePartV0,
  DataPart as DataPartV0,
  Message as MessageV0,
  Artifact as ArtifactV0,
  Task as TaskV0,
  TaskStatus as TaskStatusV0,
  TaskStatusUpdateEvent as TaskStatusUpdateEventV0,
  TaskArtifactUpdateEvent as TaskArtifactUpdateEventV0,
  TaskEvent as TaskEventV0,
  AgentCard as AgentCardV0,
  AgentCapabilities as AgentCapabilitiesV0,
  AgentSkill as AgentSkillV0,
  FileWithBytes as FileWithBytesV0,
  FileWithUri as FileWithUriV0,
} from '../types/index.js';

import type {
  Part as PartV1,
  TextPart as TextPartV1,
  FilePart as FilePartV1,
  DataPart as DataPartV1,
  Message as MessageV1,
  Artifact as ArtifactV1,
  Task as TaskV1,
  TaskStatus as TaskStatusV1,
  TaskStatusUpdateEvent as TaskStatusUpdateEventV1,
  TaskArtifactUpdateEvent as TaskArtifactUpdateEventV1,
  TaskEvent as TaskEventV1,
  AgentCard as AgentCardV1,
  AgentCapabilities as AgentCapabilitiesV1,
  AgentSkill as AgentSkillV1,
  FileWithBytes as FileWithBytesV1,
  FileWithUri as FileWithUriV1,
} from '../types/v1.js';

// ============================================================================
// Part Normalization
// ============================================================================

/**
 * Normalize v0.x Part to v1.0 format
 * v0.x uses 'kind' field, v1.0 uses member presence
 */
export function normalizePartToV1(part: PartV0): PartV1 {
  switch (part.kind) {
    case 'text':
      return {
        text: part.text,
        ...(part.metadata && { metadata: part.metadata }),
      } as TextPartV1;

    case 'file': {
      const file = part.file as FileWithBytesV0 | FileWithUriV0;
      const normalizedFile: FileWithBytesV1 | FileWithUriV1 = 'bytes' in file
        ? {
            bytes: file.bytes,
            ...(file.mime_type && { mimeType: file.mime_type }),
            ...(file.name && { name: file.name }),
          }
        : {
            uri: file.uri,
            ...(file.mime_type && { mimeType: file.mime_type }),
            ...(file.name && { name: file.name }),
          };
      return {
        file: normalizedFile,
        ...(part.metadata && { metadata: part.metadata }),
      } as FilePartV1;
    }

    case 'data':
      return {
        data: part.data,
        ...(part.metadata && { metadata: part.metadata }),
      } as DataPartV1;

    default:
      // Handle unknown part types (like A2UI extensions)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyPart = part as any;
      if (anyPart.kind && anyPart[anyPart.kind]) {
        // Extension part - pass through
        const { kind, metadata, ...rest } = anyPart;
        return { ...rest, metadata } as PartV1;
      }
      throw new Error(`Unknown part kind: ${(part as { kind?: string }).kind}`);
  }
}

/**
 * Normalize v1.0 Part to v0.x format
 * v1.0 uses member presence, v0.x uses 'kind' field
 */
export function normalizePartToV0(part: PartV1): PartV0 {
  if ('text' in part && typeof (part as TextPartV1).text === 'string') {
    return {
      kind: 'text',
      text: (part as TextPartV1).text,
      ...(part.metadata && { metadata: part.metadata }),
    } as TextPartV0;
  }

  if ('file' in part) {
    const file = (part as FilePartV1).file;
    const normalizedFile: FileWithBytesV0 | FileWithUriV0 = 'bytes' in file
      ? {
          bytes: file.bytes,
          ...(file.mimeType && { mime_type: file.mimeType }),
          ...(file.name && { name: file.name }),
        }
      : {
          uri: file.uri,
          ...(file.mimeType && { mime_type: file.mimeType }),
          ...(file.name && { name: file.name }),
        };
    return {
      kind: 'file',
      file: normalizedFile,
      ...(part.metadata && { metadata: part.metadata }),
    } as FilePartV0;
  }

  if ('data' in part) {
    return {
      kind: 'data',
      data: (part as DataPartV1).data,
      ...(part.metadata && { metadata: part.metadata }),
    } as DataPartV0;
  }

  // Unknown part type - pass through with best effort
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return part as any;
}

// ============================================================================
// Message Normalization
// ============================================================================

export function normalizeMessageToV1(message: MessageV0): MessageV1 {
  return {
    messageId: message.message_id,
    role: message.role,
    parts: message.parts.map(normalizePartToV1),
    ...(message.context_id && { contextId: message.context_id }),
    ...(message.task_id && { taskId: message.task_id }),
    ...(message.reference_task_ids && { referenceTaskIds: message.reference_task_ids }),
    ...(message.extensions && { extensions: message.extensions }),
    ...(message.metadata && { metadata: message.metadata }),
  };
}

export function normalizeMessageToV0(message: MessageV1): MessageV0 {
  return {
    kind: 'message',
    message_id: message.messageId,
    role: message.role,
    parts: message.parts.map(normalizePartToV0),
    ...(message.contextId && { context_id: message.contextId }),
    ...(message.taskId && { task_id: message.taskId }),
    ...(message.referenceTaskIds && { reference_task_ids: message.referenceTaskIds }),
    ...(message.extensions && { extensions: message.extensions }),
    ...(message.metadata && { metadata: message.metadata }),
  };
}

// ============================================================================
// Artifact Normalization
// ============================================================================

export function normalizeArtifactToV1(artifact: ArtifactV0): ArtifactV1 {
  return {
    artifactId: artifact.artifact_id,
    parts: artifact.parts.map(normalizePartToV1),
    ...(artifact.name && { name: artifact.name }),
    ...(artifact.description && { description: artifact.description }),
    ...(artifact.extensions && { extensions: artifact.extensions }),
    ...(artifact.metadata && { metadata: artifact.metadata }),
  };
}

export function normalizeArtifactToV0(artifact: ArtifactV1): ArtifactV0 {
  return {
    artifact_id: artifact.artifactId,
    parts: artifact.parts.map(normalizePartToV0),
    ...(artifact.name && { name: artifact.name }),
    ...(artifact.description && { description: artifact.description }),
    ...(artifact.extensions && { extensions: artifact.extensions }),
    ...(artifact.metadata && { metadata: artifact.metadata }),
  };
}

// ============================================================================
// Task Status Normalization
// ============================================================================

export function normalizeStatusToV1(status: TaskStatusV0): TaskStatusV1 {
  return {
    state: status.state,
    ...(status.message && { message: normalizeMessageToV1(status.message) }),
    ...(status.timestamp && { timestamp: status.timestamp }),
  };
}

export function normalizeStatusToV0(status: TaskStatusV1): TaskStatusV0 {
  return {
    state: status.state,
    ...(status.message && { message: normalizeMessageToV0(status.message) }),
    ...(status.timestamp && { timestamp: status.timestamp }),
  };
}

// ============================================================================
// Task Normalization
// ============================================================================

export function normalizeTaskToV1(task: TaskV0): TaskV1 {
  return {
    id: task.id,
    contextId: task.context_id,
    status: normalizeStatusToV1(task.status),
    ...(task.artifacts && { artifacts: task.artifacts.map(normalizeArtifactToV1) }),
    ...(task.history && { history: task.history.map(normalizeMessageToV1) }),
    ...(task.metadata && { metadata: task.metadata }),
  };
}

export function normalizeTaskToV0(task: TaskV1): TaskV0 {
  return {
    kind: 'task',
    id: task.id,
    context_id: task.contextId,
    status: normalizeStatusToV0(task.status),
    ...(task.artifacts && { artifacts: task.artifacts.map(normalizeArtifactToV0) }),
    ...(task.history && { history: task.history.map(normalizeMessageToV0) }),
    ...(task.metadata && { metadata: task.metadata }),
  };
}

// ============================================================================
// Event Normalization
// ============================================================================

export function normalizeEventToV1(event: TaskEventV0): TaskEventV1 {
  if (event.kind === 'status-update') {
    return {
      taskId: event.task_id,
      contextId: event.context_id,
      status: normalizeStatusToV1(event.status),
      final: event.final,
      ...(event.metadata && { metadata: event.metadata }),
    } as TaskStatusUpdateEventV1;
  }

  if (event.kind === 'artifact-update') {
    const artifact = normalizeArtifactToV1(event.artifact);
    // Move append/lastChunk from event to artifact in v1.0
    if (event.append !== undefined) artifact.append = event.append;
    if (event.last_chunk !== undefined) artifact.lastChunk = event.last_chunk;

    return {
      taskId: event.task_id,
      contextId: event.context_id,
      artifact,
      ...(event.metadata && { metadata: event.metadata }),
    } as TaskArtifactUpdateEventV1;
  }

  throw new Error(`Unknown event kind: ${(event as { kind?: string }).kind}`);
}

export function normalizeEventToV0(event: TaskEventV1): TaskEventV0 {
  if ('status' in event) {
    return {
      kind: 'status-update',
      task_id: event.taskId,
      context_id: event.contextId,
      status: normalizeStatusToV0(event.status),
      final: event.final,
      ...(event.metadata && { metadata: event.metadata }),
    } as TaskStatusUpdateEventV0;
  }

  if ('artifact' in event) {
    const artifact = normalizeArtifactToV0(event.artifact);
    // Extract append/lastChunk from artifact back to event in v0.x
    const v1Artifact = event.artifact;

    return {
      kind: 'artifact-update',
      task_id: event.taskId,
      context_id: event.contextId,
      artifact,
      ...(v1Artifact.append !== undefined && { append: v1Artifact.append }),
      ...(v1Artifact.lastChunk !== undefined && { last_chunk: v1Artifact.lastChunk }),
      ...(event.metadata && { metadata: event.metadata }),
    } as TaskArtifactUpdateEventV0;
  }

  throw new Error('Unknown event type');
}

// ============================================================================
// Agent Card Normalization
// ============================================================================

function normalizeSkillToV1(skill: AgentSkillV0): AgentSkillV1 {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    ...(skill.tags && { tags: skill.tags }),
    ...(skill.examples && { examples: skill.examples }),
    ...(skill.input_modes && { inputModes: skill.input_modes }),
    ...(skill.output_modes && { outputModes: skill.output_modes }),
    ...(skill.security && { security: skill.security }),
  };
}

function normalizeSkillToV0(skill: AgentSkillV1): AgentSkillV0 {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    tags: skill.tags ?? [],
    ...(skill.examples && { examples: skill.examples }),
    ...(skill.inputModes && { input_modes: skill.inputModes }),
    ...(skill.outputModes && { output_modes: skill.outputModes }),
    ...(skill.security && { security: skill.security }),
  };
}

function normalizeCapabilitiesToV1(caps: AgentCapabilitiesV0): AgentCapabilitiesV1 {
  return {
    ...(caps.streaming !== undefined && { streaming: caps.streaming }),
    ...(caps.push_notifications !== undefined && { pushNotifications: caps.push_notifications }),
    ...(caps.state_transition_history !== undefined && { stateTransitionHistory: caps.state_transition_history }),
    ...(caps.extensions && { extensions: caps.extensions }),
  };
}

function normalizeCapabilitiesToV0(caps: AgentCapabilitiesV1): AgentCapabilitiesV0 {
  return {
    ...(caps.streaming !== undefined && { streaming: caps.streaming }),
    ...(caps.pushNotifications !== undefined && { push_notifications: caps.pushNotifications }),
    ...(caps.stateTransitionHistory !== undefined && { state_transition_history: caps.stateTransitionHistory }),
    ...(caps.extensions && { extensions: caps.extensions }),
  };
}

export function normalizeAgentCardToV1(card: AgentCardV0): AgentCardV1 {
  // Security schemes need careful handling due to naming differences
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const securitySchemes = card.security_schemes as any;

  return {
    name: card.name,
    url: card.url,
    version: card.version,
    protocolVersions: card.protocol_version ? [card.protocol_version] : ['1.0'],
    description: card.description,
    ...(card.icon_url && { iconUrl: card.icon_url }),
    ...(card.documentation_url && { documentationUrl: card.documentation_url }),
    ...(card.provider && { provider: { organization: card.provider.organization, url: card.provider.url } }),
    ...(card.capabilities && { capabilities: normalizeCapabilitiesToV1(card.capabilities) }),
    ...(card.skills && { skills: card.skills.map(normalizeSkillToV1) }),
    ...(card.default_input_modes && { defaultInputModes: card.default_input_modes }),
    ...(card.default_output_modes && { defaultOutputModes: card.default_output_modes }),
    ...(securitySchemes && { securitySchemes }),
    ...(card.security && { security: card.security }),
    ...(card.preferred_transport && { preferredTransport: card.preferred_transport }),
    ...(card.additional_interfaces && { additionalInterfaces: card.additional_interfaces }),
    ...(card.supports_authenticated_extended_card !== undefined && {
      supportsAuthenticatedExtendedCard: card.supports_authenticated_extended_card,
    }),
    // Note: signatures have different structures between v0.x and v1.0
    // v0.x: { header?, protected, signature }
    // v1.0: { signature, publicKey, algorithm, timestamp }
    // Pass through as-is since both are optional and can coexist
    // Note: signatures are omitted during conversion since structures differ significantly
    // v0.x: { header?, protected, signature } - JWS format
    // v1.0: { signature, publicKey, algorithm, timestamp } - explicit key format
  } as unknown as AgentCardV1;
}

export function normalizeAgentCardToV0(card: AgentCardV1): AgentCardV0 {
  // Security schemes need careful handling due to naming differences
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const securitySchemes = card.securitySchemes as any;

  return {
    name: card.name,
    url: card.url,
    version: card.version,
    description: card.description ?? '',
    ...(card.protocolVersions?.[0] && { protocol_version: card.protocolVersions[0] }),
    ...(card.iconUrl && { icon_url: card.iconUrl }),
    ...(card.documentationUrl && { documentation_url: card.documentationUrl }),
    ...(card.provider && { provider: { organization: card.provider.organization, url: card.provider.url ?? '' } }),
    capabilities: card.capabilities ? normalizeCapabilitiesToV0(card.capabilities) : {},
    skills: card.skills?.map(normalizeSkillToV0) ?? [],
    default_input_modes: card.defaultInputModes ?? [],
    default_output_modes: card.defaultOutputModes ?? [],
    ...(securitySchemes && { security_schemes: securitySchemes }),
    ...(card.security && { security: card.security }),
    ...(card.preferredTransport && { preferred_transport: card.preferredTransport }),
    ...(card.additionalInterfaces && { additional_interfaces: card.additionalInterfaces }),
    ...(card.supportsAuthenticatedExtendedCard !== undefined && {
      supports_authenticated_extended_card: card.supportsAuthenticatedExtendedCard,
    }),
    // Note: signatures are omitted during conversion since structures differ significantly
  } as unknown as AgentCardV0;
}

// ============================================================================
// Method Name Normalization
// ============================================================================

const V0_TO_V1_METHODS: Record<string, string> = {
  'message/send': 'SendMessage',
  'message/stream': 'SendMessage', // Streaming is determined by transport, not method
  'tasks/get': 'GetTask',
  'tasks/cancel': 'CancelTask',
  'tasks/resubscribe': 'Resubscribe',
  'tasks/pushNotificationConfig/set': 'SetTaskPushNotificationConfig',
  'tasks/pushNotificationConfig/get': 'GetTaskPushNotificationConfig',
  'tasks/pushNotificationConfig/list': 'ListTaskPushNotificationConfigs',
  'tasks/pushNotificationConfig/delete': 'DeleteTaskPushNotificationConfig',
  'agent/getAuthenticatedExtendedCard': 'GetAuthenticatedExtendedCard',
};

const V1_TO_V0_METHODS: Record<string, string> = Object.fromEntries(
  Object.entries(V0_TO_V1_METHODS).map(([k, v]) => [v, k])
);

export function normalizeMethodNameToV1(method: string): string {
  return V0_TO_V1_METHODS[method] ?? method;
}

export function normalizeMethodNameToV0(method: string): string {
  return V1_TO_V0_METHODS[method] ?? method;
}

// ============================================================================
// Full Request/Response Normalization
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeRequestToV1(request: any): any {
  if (!request || typeof request !== 'object') return request;

  const normalized = {
    ...request,
    method: normalizeMethodNameToV1(request.method),
  };

  // Normalize params based on method
  if (normalized.params) {
    const params = normalized.params;

    // MessageSendParams normalization
    if (params.message) {
      params.message = normalizeMessageToV1(params.message);
      if (params.configuration) {
        const config = params.configuration;
        params.configuration = {
          ...(config.accepted_output_modes && { acceptedOutputModes: config.accepted_output_modes }),
          ...(config.blocking !== undefined && { blocking: config.blocking }),
          ...(config.history_length !== undefined && { historyLength: config.history_length }),
          ...(config.push_notification_config && {
            pushNotificationConfig: config.push_notification_config,
          }),
        };
      }
    }

    // TaskIdParams normalization
    if (params.task_id) {
      params.id = params.task_id;
      delete params.task_id;
    }

    // TaskQueryParams normalization
    if (params.history_length !== undefined) {
      params.historyLength = params.history_length;
      delete params.history_length;
    }
  }

  return normalized;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeResponseToV0(response: any): any {
  if (!response || typeof response !== 'object') return response;

  const normalized = { ...response };

  // Normalize result
  if (normalized.result) {
    const result = normalized.result;

    // Task result
    if (result.contextId !== undefined) {
      normalized.result = normalizeTaskToV0(result);
    }
    // Message result
    else if (result.messageId !== undefined) {
      normalized.result = normalizeMessageToV0(result);
    }
    // Event result
    else if (result.taskId !== undefined && (result.status !== undefined || result.artifact !== undefined)) {
      normalized.result = normalizeEventToV0(result);
    }
    // AgentCard result
    else if (result.protocolVersions !== undefined) {
      normalized.result = normalizeAgentCardToV0(result);
    }
  }

  return normalized;
}
