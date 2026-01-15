/**
 * In-memory event queue implementation
 */

import { TaskEvent } from '../types';

/**
 * Event queue for streaming responses
 */
export interface EventQueue {
  /** Enqueues an event */
  enqueue(event: TaskEvent): Promise<void>;

  /** Dequeues an event */
  dequeue(taskId: string): Promise<TaskEvent | null>;

  /** Subscribes to events for a task */
  subscribe(
    taskId: string,
    callback: (event: TaskEvent) => void
  ): () => void;
}

/**
 * In-memory event queue
 * Stores events in memory and provides subscription functionality
 */
export class InMemoryEventQueue implements EventQueue {
  private events: Map<string, TaskEvent[]> = new Map();
  private subscriptions: Map<string, Set<(event: TaskEvent) => void>> = new Map();

  /**
   * Enqueues an event
   */
  async enqueue(event: TaskEvent): Promise<void> {
    const taskId = (event as any).task_id;
    if (!taskId) {
      throw new Error('Event must have a task_id');
    }

    if (!this.events.has(taskId)) {
      this.events.set(taskId, []);
    }

    const taskEvents = this.events.get(taskId)!;
    taskEvents.push(event);

    // Notify subscribers
    const subs = this.subscriptions.get(taskId);
    if (subs) {
      for (const callback of subs) {
        callback(event);
      }
    }
  }

  /**
   * Dequeues an event
   */
  async dequeue(taskId: string): Promise<TaskEvent | null> {
    const taskEvents = this.events.get(taskId);
    if (!taskEvents || taskEvents.length === 0) {
      return null;
    }

    return taskEvents.shift() || null;
  }

  /**
   * Subscribes to events for a task
   */
  subscribe(
    taskId: string,
    callback: (event: TaskEvent) => void
  ): () => void {
    if (!this.subscriptions.has(taskId)) {
      this.subscriptions.set(taskId, new Set());
    }

    const subs = this.subscriptions.get(taskId)!;
    subs.add(callback);

    // Return unsubscribe function
    return () => {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscriptions.delete(taskId);
      }
    };
  }

  /**
   * Clears all events for a task
   */
  async clear(taskId: string): Promise<void> {
    this.events.delete(taskId);
    this.subscriptions.delete(taskId);
  }

  /**
   * Gets all events for a task
   */
  async getEvents(taskId: string): Promise<TaskEvent[]> {
    return this.events.get(taskId) || [];
  }
}
