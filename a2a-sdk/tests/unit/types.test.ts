/**
 * Unit tests for A2A types
 */

import { Message, Task, AgentCard, Role } from '../../src/types';

describe('Types', () => {
  describe('Message', () => {
    it('should create a valid message', () => {
      const message: Message = {
        kind: 'message',
        message_id: 'msg-123',
        role: Role.USER,
        parts: [
          {
            kind: 'text',
            text: 'Hello, World!',
          },
        ],
      };

      expect(message.kind).toBe('message');
      expect(message.message_id).toBe('msg-123');
      expect(message.role).toBe(Role.USER);
      expect(message.parts).toHaveLength(1);
      expect(message.parts[0].kind).toBe('text');
    });

    it('should handle multiple parts', () => {
      const message: Message = {
        kind: 'message',
        message_id: 'msg-456',
        role: Role.USER,
        parts: [
          {
            kind: 'text',
            text: 'Hello',
          },
          {
            kind: 'text',
            text: 'World',
          },
        ],
      };

      expect(message.parts).toHaveLength(2);
    });
  });

  describe('Task', () => {
    it('should create a valid task', () => {
      const task: Task = {
        id: 'task-123',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };

      expect(task.kind).toBe('task');
      expect(task.status.state).toBe('running');
    });

    it('should handle completed state', () => {
      const task: Task = {
        id: 'task-456',
        kind: 'task',
        status: {
          state: 'completed',
          timestamp: new Date().toISOString(),
        },
      };

      expect(task.status.state).toBe('completed');
    });
  });

  describe('AgentCard', () => {
    it('should create a valid agent card', () => {
      const agentCard: AgentCard = {
        name: 'Test Agent',
        description: 'A test agent',
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
      };

      expect(agentCard.name).toBe('Test Agent');
      expect(agentCard.capabilities.streaming).toBe(true);
      expect(agentCard.default_input_modes).toContain('text/plain');
    });
  });

  describe('Role', () => {
    it('should have correct enum values', () => {
      expect(Role.USER).toBe('user');
      expect(Role.AGENT).toBe('agent');
    });
  });
});
