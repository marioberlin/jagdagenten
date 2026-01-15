/**
 * React Hook for A2A Client
 *
 * Provides easy integration of the A2A SDK client in React components.
 * Features:
 * - Automatic client lifecycle management
 * - Streaming support with real-time updates
 * - Error handling and loading states
 * - A2UI message extraction
 * - TypeScript type safety
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  A2AClient,
  createA2AClient,
  A2AClientError,
  type A2AClientConfig,
  type StreamEvent,
  v1,
  a2ui,
} from '@liquidcrypto/a2a-sdk';

// ============================================================================
// Types
// ============================================================================

export interface UseA2AClientOptions {
  /** Base URL of the A2A agent */
  agentUrl: string;
  /** Optional auth token */
  authToken?: string;
  /** Enable A2UI support (default: true) */
  enableA2UI?: boolean;
  /** Auto-connect on mount (default: false) */
  autoConnect?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface A2AMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
  artifacts?: v1.Artifact[];
  a2uiMessages?: a2ui.A2UIMessage[];
}

export interface UseA2AClientState {
  /** Whether connected to the agent */
  connected: boolean;
  /** Whether currently loading */
  loading: boolean;
  /** Current error if any */
  error: A2AClientError | null;
  /** Agent card (capabilities, etc.) */
  agentCard: v1.AgentCard | null;
  /** Chat messages */
  messages: A2AMessage[];
  /** Current task (if any) */
  currentTask: v1.Task | null;
  /** Whether currently streaming */
  isStreaming: boolean;
}

export interface UseA2AClientActions {
  /** Connect to the agent */
  connect: () => Promise<void>;
  /** Disconnect from the agent */
  disconnect: () => void;
  /** Send a text message */
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<v1.Task>;
  /** Stream a text message */
  streamMessage: (text: string, options?: SendMessageOptions) => AsyncGenerator<StreamEvent, void, unknown>;
  /** Cancel the current task */
  cancelTask: () => Promise<void>;
  /** Clear messages */
  clearMessages: () => void;
  /** Get task by ID */
  getTask: (taskId: string) => Promise<v1.Task>;
}

export interface SendMessageOptions {
  contextId?: string;
  configuration?: v1.MessageSendConfiguration;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useA2AClient(options: UseA2AClientOptions): [UseA2AClientState, UseA2AClientActions] {
  const clientRef = useRef<A2AClient | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<UseA2AClientState>({
    connected: false,
    loading: false,
    error: null,
    agentCard: null,
    messages: [],
    currentTask: null,
    isStreaming: false,
  });

  // Create client on mount
  useEffect(() => {
    const config: A2AClientConfig = {
      baseUrl: options.agentUrl,
      authToken: options.authToken,
      enableA2UI: options.enableA2UI ?? true,
      headers: options.headers,
      timeout: options.timeout,
    };

    clientRef.current = createA2AClient(config);

    if (options.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.agentUrl, options.authToken]);

  // Connect to agent
  const connect = useCallback(async () => {
    if (!clientRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const agentCard = await clientRef.current.getAgentCard();
      setState(prev => ({
        ...prev,
        connected: true,
        loading: false,
        agentCard,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof A2AClientError ? error : new A2AClientError(
          error instanceof Error ? error.message : 'Connection failed',
          -32000
        ),
      }));
    }
  }, []);

  // Disconnect from agent
  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.close();
    }

    setState(prev => ({
      ...prev,
      connected: false,
      isStreaming: false,
      currentTask: null,
    }));
  }, []);

  // Add user message to state
  const addUserMessage = useCallback((text: string): A2AMessage => {
    const message: A2AMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    return message;
  }, []);

  // Add agent message from task
  const addAgentMessage = useCallback((task: v1.Task) => {
    const statusMessage = task.status.message;
    if (!statusMessage) return;

    // Extract text from message parts
    const text = statusMessage.parts
      .filter(v1.isTextPart)
      .map(p => p.text)
      .join('\n');

    // Extract A2UI messages from artifacts
    let a2uiMessages: a2ui.A2UIMessage[] = [];
    if (task.artifacts) {
      for (const artifact of task.artifacts) {
        if (a2ui.isA2UIArtifact(artifact)) {
          a2uiMessages.push(...a2ui.extractA2UIMessages(artifact));
        }
      }
    }

    const message: A2AMessage = {
      id: task.id,
      role: 'agent',
      text,
      timestamp: new Date(task.status.timestamp ?? Date.now()),
      artifacts: task.artifacts,
      a2uiMessages: a2uiMessages.length > 0 ? a2uiMessages : undefined,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      currentTask: task,
    }));
  }, []);

  // Send a message (non-streaming)
  const sendMessage = useCallback(async (
    text: string,
    options?: SendMessageOptions
  ): Promise<v1.Task> => {
    if (!clientRef.current) {
      throw new A2AClientError('Client not initialized', -32000);
    }

    addUserMessage(text);
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const task = await clientRef.current.sendText(text, {
        contextId: options?.contextId,
        configuration: options?.configuration,
      });

      addAgentMessage(task);
      setState(prev => ({ ...prev, loading: false }));
      return task;
    } catch (error) {
      const clientError = error instanceof A2AClientError ? error : new A2AClientError(
        error instanceof Error ? error.message : 'Send failed',
        -32000
      );
      setState(prev => ({ ...prev, loading: false, error: clientError }));
      throw clientError;
    }
  }, [addUserMessage, addAgentMessage]);

  // Stream a message
  const streamMessage = useCallback(async function* (
    text: string,
    options?: SendMessageOptions
  ): AsyncGenerator<StreamEvent, void, unknown> {
    if (!clientRef.current) {
      throw new A2AClientError('Client not initialized', -32000);
    }

    addUserMessage(text);
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      isStreaming: true,
      error: null,
    }));

    try {
      const generator = clientRef.current.streamText(text, {
        contextId: options?.contextId,
        configuration: options?.configuration,
      }, {
        signal: abortControllerRef.current.signal,
      });

      for await (const event of generator) {
        yield event;

        if (event.type === 'complete') {
          addAgentMessage(event.task);
        } else if (event.type === 'error') {
          setState(prev => ({ ...prev, error: event.error }));
        } else if (event.type === 'status') {
          setState(prev => ({
            ...prev,
            currentTask: prev.currentTask ? {
              ...prev.currentTask,
              status: event.data.status,
            } : null,
          }));
        } else if (event.type === 'artifact') {
          setState(prev => ({
            ...prev,
            currentTask: prev.currentTask ? {
              ...prev.currentTask,
              artifacts: [
                ...(prev.currentTask.artifacts ?? []),
                event.data.artifact,
              ],
            } : null,
          }));
        }
      }
    } finally {
      setState(prev => ({
        ...prev,
        loading: false,
        isStreaming: false,
      }));
      abortControllerRef.current = null;
    }
  }, [addUserMessage, addAgentMessage]);

  // Cancel current task
  const cancelTask = useCallback(async () => {
    if (!clientRef.current || !state.currentTask) return;

    // Abort streaming if active
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    try {
      await clientRef.current.cancelTask(state.currentTask.id);
      setState(prev => ({
        ...prev,
        isStreaming: false,
        loading: false,
      }));
    } catch (error) {
      // Task may already be complete, ignore error
    }
  }, [state.currentTask]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      currentTask: null,
      error: null,
    }));
  }, []);

  // Get task by ID
  const getTask = useCallback(async (taskId: string): Promise<v1.Task> => {
    if (!clientRef.current) {
      throw new A2AClientError('Client not initialized', -32000);
    }
    return clientRef.current.getTask(taskId);
  }, []);

  const actions: UseA2AClientActions = {
    connect,
    disconnect,
    sendMessage,
    streamMessage,
    cancelTask,
    clearMessages,
    getTask,
  };

  return [state, actions];
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for A2UI rendering state
 */
export function useA2UIRenderer(messages: a2ui.A2UIMessage[]) {
  const [surfaces, setSurfaces] = useState<Map<string, {
    rootComponentId: string;
    components: Map<string, a2ui.A2UIComponent>;
    model: Record<string, v1.JSONValue>;
    styling?: a2ui.A2UISurfaceStyling;
  }>>(new Map());

  useEffect(() => {
    const newSurfaces = new Map(surfaces);

    for (const msg of messages) {
      if (a2ui.isBeginRenderingMessage(msg)) {
        newSurfaces.set(msg.surfaceId, {
          rootComponentId: msg.rootComponentId,
          components: new Map(),
          model: {},
          styling: msg.styling,
        });
      } else if (a2ui.isSurfaceUpdateMessage(msg)) {
        const surface = newSurfaces.get(msg.surfaceId);
        if (surface) {
          for (const comp of msg.components) {
            surface.components.set(comp.id, comp);
          }
        }
      } else if (a2ui.isSetModelMessage(msg)) {
        const surface = newSurfaces.get(msg.surfaceId);
        if (surface) {
          surface.model = { ...surface.model, ...msg.model };
        }
      }
    }

    setSurfaces(newSurfaces);
    // Only update when messages change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return surfaces;
}

/**
 * Hook to detect agent capabilities
 */
export function useAgentCapabilities(agentCard: v1.AgentCard | null) {
  return {
    supportsStreaming: agentCard?.capabilities?.streaming ?? false,
    supportsPushNotifications: agentCard?.capabilities?.pushNotifications ?? false,
    supportsA2UI: agentCard?.capabilities?.extensions?.some(
      ext => ext.uri.includes('a2ui')
    ) ?? false,
    skills: agentCard?.skills ?? [],
    defaultInputModes: agentCard?.defaultInputModes ?? ['text/plain'],
    defaultOutputModes: agentCard?.defaultOutputModes ?? ['text/plain'],
  };
}

export default useA2AClient;
