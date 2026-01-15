/**
 * Unit tests for JSONRPCHandler
 */

import { JSONRPCHandler } from '../../src/server/jsonrpc-handler';
import { RequestHandler } from '../../src/server/request-handler';
import { ServerCallContext } from '../../src/server/context';
import {
  SendMessageRequest,
  GetTaskRequest,
  Message,
  Task,
  Role,
  TaskQueryParams,
} from '../../src/types';
import { AgentExecutionResult } from '../../src/server/interfaces';

// Mock RequestHandler for testing
class MockRequestHandler implements RequestHandler {
  async onGetTask(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<Task | null> {
    if (params.id === 'existing-task') {
      return {
        id: 'existing-task',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };
    }
    return null;
  }

  async onCancelTask(
    params: any,
    context?: ServerCallContext
  ): Promise<Task | null> {
    if (params.id === 'existing-task') {
      return {
        id: 'existing-task',
        kind: 'task',
        status: {
          state: 'canceled',
          timestamp: new Date().toISOString(),
        },
      };
    }
    return null;
  }

  async onMessageSend(
    params: any,
    context?: ServerCallContext
  ): Promise<Task | Message> {
    return {
      kind: 'message',
      message_id: 'response-123',
      role: Role.AGENT,
      parts: [
        {
          kind: 'text',
          text: 'Response',
        },
      ],
    };
  }

  async *onMessageSendStream(
    params: any,
    context?: ServerCallContext
  ): AsyncIterableIterator<any> {
    yield {
      kind: 'message',
      message_id: 'chunk-1',
      role: Role.AGENT,
      parts: [
        {
          kind: 'text',
          text: 'Chunk 1',
        },
      ],
    };

    yield {
      kind: 'message',
      message_id: 'chunk-2',
      role: Role.AGENT,
      parts: [
        {
          kind: 'text',
          text: 'Chunk 2',
        },
      ],
    };
  }

  async *onResubscribeToTask(
    params: any,
    context?: ServerCallContext
  ): AsyncIterableIterator<any> {
    yield {
      kind: 'task.status',
      task_id: params.id,
      task: {
        id: params.id,
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async onGetTaskPushNotificationConfig(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<any> {
    return null;
  }

  async onSetTaskPushNotificationConfig(
    params: any,
    context?: ServerCallContext
  ): Promise<any> {
    return params.pushNotificationConfig;
  }

  async onListTaskPushNotificationConfig(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<any[]> {
    return [];
  }

  async onDeleteTaskPushNotificationConfig(
    params: any,
    context?: ServerCallContext
  ): Promise<void> {
    return;
  }
}

describe('JSONRPCHandler', () => {
  let handler: JSONRPCHandler;
  let mockRequestHandler: MockRequestHandler;

  beforeEach(() => {
    mockRequestHandler = new MockRequestHandler();
    handler = new JSONRPCHandler(
      {
        name: 'Test Agent',
        version: '1.0.0',
        url: 'http://localhost:3000/a2a/v1',
        capabilities: {
          streaming: true,
          push_notifications: false,
          state_transition_history: true,
        },
        skills: [],
        default_input_modes: ['text/plain'],
        default_output_modes: ['text/plain'],
      },
      mockRequestHandler
    );
  });

  describe('onMessageSend', () => {
    it('should handle message send request', async () => {
      const request: SendMessageRequest = {
        jsonrpc: '2.0',
        id: 'req-123',
        method: 'message/send',
        params: {
          message: {
            kind: 'message',
            message_id: 'msg-123',
            role: Role.USER,
            parts: [
              {
                kind: 'text',
                text: 'Hello',
              },
            ],
          },
        },
      };

      const response = await handler.onMessageSend(request);
      expect(response.root.id).toBe('req-123');
      expect(response.root.result).toBeDefined();
      expect(response.root.result.kind).toBe('message');
    });
  });

  describe('onGetTask', () => {
    it('should handle get task request for existing task', async () => {
      const request: GetTaskRequest = {
        jsonrpc: '2.0',
        id: 'req-456',
        method: 'tasks/get',
        params: {
          id: 'existing-task',
        },
      };

      const response = await handler.onGetTask(request);
      expect(response.root.id).toBe('req-456');
      expect(response.root.result.id).toBe('existing-task');
    });

    it('should return error for non-existent task', async () => {
      const request: GetTaskRequest = {
        jsonrpc: '2.0',
        id: 'req-789',
        method: 'tasks/get',
        params: {
          id: 'non-existent-task',
        },
      };

      const response = await handler.onGetTask(request);
      expect(response.root.id).toBe('req-789');
      expect(response.root.error).toBeDefined();
      expect(response.root.error.code).toBe(-32001);
    });
  });

  describe('onCancelTask', () => {
    it('should handle cancel task request for existing task', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 'req-cancel',
        method: 'tasks/cancel',
        params: {
          id: 'existing-task',
        },
      };

      const response = await handler.onCancelTask(request);
      expect(response.root.id).toBe('req-cancel');
      expect(response.root.result.status.state).toBe('canceled');
    });

    it('should return error for non-existent task', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 'req-cancel-error',
        method: 'tasks/cancel',
        params: {
          id: 'non-existent-task',
        },
      };

      const response = await handler.onCancelTask(request);
      expect(response.root.id).toBe('req-cancel-error');
      expect(response.root.error).toBeDefined();
      expect(response.root.error.code).toBe(-32001);
    });
  });

  describe('onMessageSendStream', () => {
    it('should handle streaming message request', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 'req-stream',
        method: 'message/stream',
        params: {
          message: {
            kind: 'message',
            message_id: 'msg-stream',
            role: Role.USER,
            parts: [
              {
                kind: 'text',
                text: 'Stream',
              },
            ],
          },
        },
      };

      const events: any[] = [];
      for await (const event of handler.onMessageSendStream(request)) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0].root.result.message_id).toBe('chunk-1');
      expect(events[1].root.result.message_id).toBe('chunk-2');
    });
  });

  describe('onResubscribeToTask', () => {
    it('should handle resubscribe request', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 'req-resub',
        method: 'tasks/resubscribe',
        params: {
          id: 'existing-task',
        },
      };

      const events: any[] = [];
      for await (const event of handler.onResubscribeToTask(request)) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0].root.result.task_id).toBe('existing-task');
    });
  });
});
