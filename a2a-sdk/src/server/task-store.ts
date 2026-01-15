/**
 * In-memory task store implementation
 */

import { Task } from '../types';
import { ServerCallContext } from './context';

/**
 * Task filter for listing tasks
 */
export interface TaskFilter {
  /** Filter by status */
  status?: string;

  /** Filter by context ID */
  contextId?: string;

  /** Maximum number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * In-memory task store
 * Stores task objects in memory. Data is lost when the server process stops.
 */
export class InMemoryTaskStore {
  private tasks: Map<string, Task> = new Map();
  private lock: Promise<Mutex> | null = null;

  /**
   * Creates a new task
   */
  async createTask(task: Task): Promise<Task> {
    await this.acquireLock();
    this.tasks.set(task.id, task);
    this.releaseLock();
    return task;
  }

  /**
   * Updates an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await this.acquireLock();
    const existingTask = this.tasks.get(id);

    if (!existingTask) {
      this.releaseLock();
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask = { ...existingTask, ...updates };
    this.tasks.set(id, updatedTask);
    this.releaseLock();
    return updatedTask;
  }

  /**
   * Gets a task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  /**
   * Deletes a task
   */
  async deleteTask(id: string): Promise<void> {
    await this.acquireLock();
    this.tasks.delete(id);
    this.releaseLock();
  }

  /**
   * Lists tasks with optional filtering
   */
  async listTasks(filter?: TaskFilter): Promise<Task[]> {
    await this.acquireLock();
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) {
      tasks = tasks.filter(task => task.status?.state === filter.status);
    }

    if (filter?.contextId) {
      tasks = tasks.filter(task => task.contextId === filter.contextId);
    }

    if (filter?.offset) {
      tasks = tasks.slice(filter.offset);
    }

    if (filter?.limit) {
      tasks = tasks.slice(0, filter.limit);
    }

    this.releaseLock();
    return tasks;
  }

  private async acquireLock(): Promise<void> {
    // Simple mutex implementation for demonstration
    // In production, consider using a proper async mutex library
    while (this.lock) {
      await this.lock;
    }

    let resolveLock: (() => void) | null = null;
    this.lock = new Promise<Mutex>(resolve => {
      resolveLock = resolve;
    });

    // Store the mutex with its release function
    (this.lock as any).release = () => {
      this.lock = null;
      resolveLock!();
    };
  }

  private releaseLock(): void {
    if (this.lock && (this.lock as any).release) {
      (this.lock as any).release();
    }
  }
}

interface Mutex {
  release(): void;
}
