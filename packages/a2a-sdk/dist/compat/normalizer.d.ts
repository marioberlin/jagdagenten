/**
 * A2A Protocol Compatibility Normalizer
 *
 * Provides bidirectional conversion between v0.x and v1.0 formats.
 * Allows the SDK to accept both formats and respond in the matching version.
 */
import type { Part as PartV0, Message as MessageV0, Artifact as ArtifactV0, Task as TaskV0, TaskStatus as TaskStatusV0, TaskEvent as TaskEventV0, AgentCard as AgentCardV0 } from '../types/index.js';
import type { Part as PartV1, Message as MessageV1, Artifact as ArtifactV1, Task as TaskV1, TaskStatus as TaskStatusV1, TaskEvent as TaskEventV1, AgentCard as AgentCardV1 } from '../types/v1.js';
/**
 * Normalize v0.x Part to v1.0 format
 * v0.x uses 'kind' field, v1.0 uses member presence
 */
export declare function normalizePartToV1(part: PartV0): PartV1;
/**
 * Normalize v1.0 Part to v0.x format
 * v1.0 uses member presence, v0.x uses 'kind' field
 */
export declare function normalizePartToV0(part: PartV1): PartV0;
export declare function normalizeMessageToV1(message: MessageV0): MessageV1;
export declare function normalizeMessageToV0(message: MessageV1): MessageV0;
export declare function normalizeArtifactToV1(artifact: ArtifactV0): ArtifactV1;
export declare function normalizeArtifactToV0(artifact: ArtifactV1): ArtifactV0;
export declare function normalizeStatusToV1(status: TaskStatusV0): TaskStatusV1;
export declare function normalizeStatusToV0(status: TaskStatusV1): TaskStatusV0;
export declare function normalizeTaskToV1(task: TaskV0): TaskV1;
export declare function normalizeTaskToV0(task: TaskV1): TaskV0;
export declare function normalizeEventToV1(event: TaskEventV0): TaskEventV1;
export declare function normalizeEventToV0(event: TaskEventV1): TaskEventV0;
export declare function normalizeAgentCardToV1(card: AgentCardV0): AgentCardV1;
export declare function normalizeAgentCardToV0(card: AgentCardV1): AgentCardV0;
export declare function normalizeMethodNameToV1(method: string): string;
export declare function normalizeMethodNameToV0(method: string): string;
export declare function normalizeRequestToV1(request: any): any;
export declare function normalizeResponseToV0(response: any): any;
