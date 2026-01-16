/**
 * In-memory task store implementation
 */

import type { Task } from '../types/v1';
import type { TaskStore, TaskFilter } from './interfaces';

/**
 * In-memory task store
 * Stores task objects in memory. Data is lost when the server process stops.
 */
export class InMemoryTaskStore implements TaskStore {
  private tasks: Map<string, Task> = new Map();
  private lockPromise: Promise<void> | null = null;
  private lockResolve: (() => void) | null = null;

  /**
   * Creates a new task
   */
  async createTask(task: Task): Promise<Task> {
    await this.acquireLock();
    try {
      this.tasks.set(task.id, task);
      return task;
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Updates an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await this.acquireLock();
    try {
      const existingTask = this.tasks.get(id);

      if (!existingTask) {
        throw new Error(`Task with id ${id} not found`);
      }

      const updatedTask = { ...existingTask, ...updates };
      this.tasks.set(id, updatedTask);
      return updatedTask;
    } finally {
      this.releaseLock();
    }
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
    try {
      this.tasks.delete(id);
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Lists tasks with optional filtering
   */
  async listTasks(filter?: TaskFilter): Promise<Task[]> {
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

    return tasks;
  }

  private async acquireLock(): Promise<void> {
    // Simple mutex implementation
    while (this.lockPromise) {
      await this.lockPromise;
    }

    this.lockPromise = new Promise<void>(resolve => {
      this.lockResolve = resolve;
    });
  }

  private releaseLock(): void {
    const resolve = this.lockResolve;
    this.lockPromise = null;
    this.lockResolve = null;
    if (resolve) {
      resolve();
    }
  }
}
