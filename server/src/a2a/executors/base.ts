/**
 * Base A2UI Executor
 *
 * Abstract base class for agent executors that support A2UI (Agent-to-UI) rendering.
 * Provides helper methods for creating A2UI artifacts and responses.
 */

import { randomUUID } from 'crypto';
import { v1 } from '@liquidcrypto/a2a-sdk';
import type { AgentExecutor, AgentExecutionContext, AgentExecutionResult } from '../adapter/index.js';

// ============================================================================
// A2UI Types (SDK-specific, different from server/src/a2a/types.ts)
// ============================================================================

/**
 * A2UI component definition for executors
 */
export interface ExecutorA2UIComponent {
  id: string;
  component: Record<string, unknown>;
}

/**
 * A2UI surface styling
 */
export interface ExecutorA2UIStyling {
  primaryColor?: string;
  fontFamily?: string;
  [key: string]: unknown;
}

/**
 * A2UI begin rendering message
 */
export interface ExecutorA2UIBeginRendering {
  type: 'beginRendering';
  surfaceId: string;
  rootComponentId: string;
  styling?: ExecutorA2UIStyling;
}

/**
 * A2UI surface update message
 */
export interface ExecutorA2UISurfaceUpdate {
  type: 'surfaceUpdate';
  surfaceId: string;
  components: ExecutorA2UIComponent[];
}

/**
 * A2UI set model message
 */
export interface ExecutorA2UISetModel {
  type: 'setModel';
  surfaceId: string;
  model: Record<string, v1.JSONValue>;
}

/**
 * A2UI action response
 */
export interface ExecutorA2UIActionResponse {
  type: 'actionResponse';
  surfaceId: string;
  actionId: string;
  response?: v1.JSONValue;
}

/**
 * Union of all A2UI message types for executors
 */
export type ExecutorA2UIMessage = ExecutorA2UIBeginRendering | ExecutorA2UISurfaceUpdate | ExecutorA2UISetModel | ExecutorA2UIActionResponse;

// ============================================================================
// Base Executor
// ============================================================================

/**
 * Abstract base class for A2UI-enabled executors
 */
export abstract class BaseA2UIExecutor implements AgentExecutor {
  /**
   * Execute a message and return a result
   * Must be implemented by subclasses
   */
  abstract execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult>;

  /**
   * Create an A2UI artifact from messages
   */
  protected createA2UIArtifact(
    messages: ExecutorA2UIMessage[],
    name: string = 'ui'
  ): v1.Artifact {
    return {
      artifactId: randomUUID(),
      name,
      parts: [{
        data: {
          type: 'a2ui',
          a2ui: messages as unknown as v1.JSONValue[],
        },
      }],
    };
  }

  /**
   * Create a text artifact
   */
  protected createTextArtifact(
    text: string,
    name: string = 'response'
  ): v1.Artifact {
    return {
      artifactId: randomUUID(),
      name,
      parts: [{ text }],
    };
  }

  /**
   * Create an agent message
   */
  protected createAgentMessage(
    parts: v1.Part[],
    contextId?: string,
    taskId?: string
  ): v1.Message {
    return {
      messageId: randomUUID(),
      role: v1.Role.AGENT,
      parts,
      contextId,
      taskId,
    };
  }

  /**
   * Create a text-only response
   */
  protected createTextResponse(
    text: string,
    contextId?: string,
    taskId?: string
  ): AgentExecutionResult {
    return {
      message: this.createAgentMessage([{ text }], contextId, taskId),
      artifacts: [this.createTextArtifact(text)],
      status: v1.TaskState.COMPLETED,
    };
  }

  /**
   * Create a response with A2UI
   */
  protected createA2UIResponse(
    text: string,
    a2ui: ExecutorA2UIMessage[],
    contextId?: string,
    taskId?: string
  ): AgentExecutionResult {
    return {
      message: this.createAgentMessage([{ text }], contextId, taskId),
      artifacts: [
        this.createTextArtifact(text),
        this.createA2UIArtifact(a2ui),
      ],
      status: v1.TaskState.COMPLETED,
    };
  }

  /**
   * Create an error response
   */
  protected createErrorResponse(
    code: number,
    message: string,
    data?: v1.JSONValue
  ): AgentExecutionResult {
    return {
      status: v1.TaskState.FAILED,
      error: { code, message, data },
    };
  }

  /**
   * Extract text from message parts
   */
  protected extractText(message: v1.Message): string {
    return message.parts
      .filter((p): p is v1.TextPart => v1.isTextPart(p))
      .map(p => p.text)
      .join('\n');
  }

  /**
   * Check if the client wants A2UI
   */
  protected wantsA2UI(context: AgentExecutionContext): boolean {
    const metadata = context.metadata;
    if (!metadata) return false;

    // Check for A2UI extension header
    const extensions = metadata['X-A2A-Extensions'] as string | undefined;
    if (extensions?.includes('a2ui')) return true;

    // Check for accepted output modes
    const acceptedModes = metadata['acceptedOutputModes'] as string[] | undefined;
    if (acceptedModes?.includes('a2ui')) return true;

    return false;
  }

  // ==========================================================================
  // A2UI Component Builders
  // ==========================================================================

  /**
   * Create a Card component
   */
  protected Card(children: string[], props?: Record<string, unknown>): Record<string, unknown> {
    return { Card: { children, ...props } };
  }

  /**
   * Create a Column layout
   */
  protected Column(children: string[], props?: Record<string, unknown>): Record<string, unknown> {
    return { Column: { children, ...props } };
  }

  /**
   * Create a Row layout
   */
  protected Row(children: string[], props?: Record<string, unknown>): Record<string, unknown> {
    return { Row: { children, ...props } };
  }

  /**
   * Create a Text component
   */
  protected Text(
    text: string | { path: string } | { literalString: string },
    semantic?: string
  ): Record<string, unknown> {
    const textValue = typeof text === 'string' ? { literalString: text } : text;
    return { Text: { text: textValue, ...(semantic && { semantic }) } };
  }

  /**
   * Create a Button component
   */
  protected Button(
    label: string,
    actionId: string,
    variant?: 'primary' | 'secondary' | 'ghost'
  ): Record<string, unknown> {
    return {
      Button: {
        label: { literalString: label },
        actionId,
        ...(variant && { variant }),
      },
    };
  }

  /**
   * Create a TextField component
   */
  protected TextField(
    id: string,
    label: string,
    placeholder?: string
  ): Record<string, unknown> {
    return {
      TextField: {
        id,
        label: { literalString: label },
        ...(placeholder && { placeholder: { literalString: placeholder } }),
      },
    };
  }

  /**
   * Create a Divider component
   */
  protected Divider(): Record<string, unknown> {
    return { Divider: {} };
  }

  /**
   * Create a List component
   */
  protected List(
    items: string,
    template: string[],
    props?: Record<string, unknown>
  ): Record<string, unknown> {
    return { List: { items: { path: items }, template, ...props } };
  }
}

export type { AgentExecutor, AgentExecutionContext, AgentExecutionResult };
