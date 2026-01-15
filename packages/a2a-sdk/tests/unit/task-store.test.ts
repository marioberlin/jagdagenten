/**
 * Unit tests for InMemoryTaskStore
 */

import { InMemoryTaskStore } from '../../src/server/task-store';
import { Task, Role } from '../../src/types';

describe('InMemoryTaskStore', () => {
  let store: InMemoryTaskStore;

  beforeEach(() => {
    store = new InMemoryTaskStore();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const task: Task = {
        id: 'task-123',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await store.createTask(task);
      expect(result.id).toBe('task-123');
      expect(result.status.state).toBe('running');
    });
  });

  describe('getTask', () => {
    it('should retrieve an existing task', async () => {
      const task: Task = {
        id: 'task-456',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };

      await store.createTask(task);
      const result = await store.getTask('task-456');

      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('task-456');
        expect(result.status.state).toBe('running');
      }
    });

    it('should return null for non-existent task', async () => {
      const result = await store.getTask('non-existent-task');
      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const task: Task = {
        id: 'task-789',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };

      await store.createTask(task);

      const updatedTask: Task = {
        ...task,
        status: {
          ...task.status,
          state: 'completed',
        },
      };

      const result = await store.updateTask('task-789', updatedTask);
      expect(result.status.state).toBe('completed');
    });

    it('should throw error for non-existent task', async () => {
      await expect(
        store.updateTask('non-existent-task', { id: 'non-existent-task' } as Task)
      ).rejects.toThrow('Task with id non-existent-task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      const task: Task = {
        id: 'task-delete',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };

      await store.createTask(task);
      await store.deleteTask('task-delete');

      const result = await store.getTask('task-delete');
      expect(result).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('should list all tasks', async () => {
      const task1: Task = {
        id: 'task-1',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };

      const task2: Task = {
        id: 'task-2',
        kind: 'task',
        status: {
          state: 'completed',
          timestamp: new Date().toISOString(),
        },
      };

      await store.createTask(task1);
      await store.createTask(task2);

      const tasks = await store.listTasks();
      expect(tasks).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      const runningTask: Task = {
        id: 'running-task',
        kind: 'task',
        status: {
          state: 'running',
          timestamp: new Date().toISOString(),
        },
      };

      const completedTask: Task = {
        id: 'completed-task',
        kind: 'task',
        status: {
          state: 'completed',
          timestamp: new Date().toISOString(),
        },
      };

      await store.createTask(runningTask);
      await store.createTask(completedTask);

      const runningTasks = await store.listTasks({ status: 'running' });
      expect(runningTasks).toHaveLength(1);
      expect(runningTasks[0].status.state).toBe('running');
    });
  });
});
