/**
 * Unit tests for PostgreSQL task store
 */

import { PostgresTaskStore } from '../../../src/server/database/postgres-task-store';
import type { Task } from '../../../src/types';

// Mock the pg module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  })),
}));

describe('PostgresTaskStore', () => {
  let taskStore: PostgresTaskStore;
  let mockPool: any;

  beforeEach(() => {
    const { Pool } = require('pg');
    mockPool = new Pool({
      connectionString: 'postgresql://test:test@localhost:5432/test',
    });

    taskStore = new PostgresTaskStore({
      type: 'postgres',
      connection: 'postgresql://test:test@localhost:5432/test',
      tableName: 'test_tasks',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create table and indexes', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await taskStore.initialize();

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE')
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX')
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const task: Task = {
        id: 'task-123',
        contextId: 'ctx-123',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
        artifacts: [],
        history: [],
        metadata: {},
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await taskStore.createTask(task);

      expect(result).toEqual(task);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.any(Array)
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      const task: Task = {
        id: 'task-123',
        contextId: 'ctx-123',
        status: { state: 'running', timestamp: new Date().toISOString() },
        artifacts: [],
        history: [],
        metadata: {},
      };

      const mockClient = {
        query: jest.fn()
          .mockRejectedValueOnce(new Error('Connection error'))
          .mockResolvedValueOnce({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await taskStore.createTask(task);

      expect(result).toEqual(task);
      expect(mockClient.query).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('getTask', () => {
    it('should return task when found', async () => {
      const mockRow = {
        id: 'task-123',
        context_id: 'ctx-123',
        status_state: 'running',
        status_message: null,
        status_timestamp: new Date().toISOString(),
        artifacts: '[]',
        history: '[]',
        metadata: '{}',
      };

      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await taskStore.getTask('task-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('task-123');
    });

    it('should return null when task not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await taskStore.getTask('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const existingTask: Task = {
        id: 'task-123',
        contextId: 'ctx-123',
        status: { state: 'running', timestamp: new Date().toISOString() },
        artifacts: [],
        history: [],
        metadata: {},
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [existingTask] }) // getTask call
        .mockResolvedValueOnce({ rows: [] }); // update call

      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const updates = { status: { state: 'completed', timestamp: new Date().toISOString() } };
      const result = await taskStore.updateTask('task-123', updates);

      expect(result.status?.state).toBe('completed');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when task not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(
        taskStore.updateTask('nonexistent', { status: { state: 'completed' } })
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await taskStore.deleteTask('task-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        ['task-123']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('listTasks', () => {
    it('should list tasks with filter', async () => {
      const mockRows = [
        {
          id: 'task-1',
          context_id: 'ctx-123',
          status_state: 'completed',
          artifacts: '[]',
          history: '[]',
          metadata: '{}',
        },
        {
          id: 'task-2',
          context_id: 'ctx-123',
          status_state: 'running',
          artifacts: '[]',
          history: '[]',
          metadata: '{}',
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRows });

      const result = await taskStore.listTasks({
        contextId: 'ctx-123',
        status: 'completed',
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0].status?.state).toBe('completed');
    });

    it('should return empty array when no tasks match', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await taskStore.listTasks({
        contextId: 'nonexistent',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('close', () => {
    it('should close pool connections', async () => {
      await taskStore.close();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
