/**
 * Task Store Instrumentation
 *
 * Wraps database task store operations with tracing and metrics.
 * Automatically instruments createTask, getTask, updateTask, deleteTask,
 * and listTasks operations.
 */

import type { Span } from '@opentelemetry/api';
import type { DatabaseTaskStore } from '../database/task-store';
import type { Task } from '../../types/v1';
import type { A2ATelemetryWrapper } from './telemetry-wrapper';
import type { TaskFilter } from '../interfaces';

export interface TaskStoreInstrumentationOptions {
  /** Enable instrumentation */
  enabled?: boolean;

  /** Table name for database operations */
  tableName?: string;
}

export class InstrumentedTaskStore implements DatabaseTaskStore {
  private taskStore: DatabaseTaskStore;
  private telemetry: A2ATelemetryWrapper;
  private tableName: string;

  constructor(
    taskStore: DatabaseTaskStore,
    telemetry: A2ATelemetryWrapper,
    options: TaskStoreInstrumentationOptions = {}
  ) {
    this.taskStore = taskStore;
    this.telemetry = telemetry;
    this.tableName = options.tableName ?? 'a2a_tasks';
  }

  /**
   * Initialize the task store
   */
  async initialize(): Promise<void> {
    const span = this.telemetry.traceDbOperation('initialize', this.tableName);
    try {
      await this.taskStore.initialize();
      this.telemetry.setSuccess(span, true);
      this.telemetry.recordDbOperation('initialize', this.tableName, 0, true);
    } catch (error) {
      this.telemetry.setSuccess(span, false);
      this.telemetry.recordException(span, error as Error);
      this.telemetry.recordDbOperation('initialize', this.tableName, 0, false);
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Create a task with tracing
   */
  async createTask(task: Task): Promise<Task> {
    const startTime = Date.now();
    const span = this.telemetry.traceDbOperation('create', this.tableName);
    span?.setAttribute('a2a.task.id', task.id);
    span?.setAttribute('a2a.context.id', task.contextId);

    try {
      const result = await this.taskStore.createTask(task);
      const duration = Date.now() - startTime;

      this.telemetry.setSuccess(span, true);
      this.telemetry.setTaskState(span, result.status?.state ?? 'unknown');
      this.telemetry.addAttributes(span, {
        'a2a.task.id': result.id,
      });

      this.telemetry.recordDbOperation('create', this.tableName, duration, true);
      this.telemetry.recordTaskExecution(duration, result.status?.state ?? 'unknown');

      span?.end();
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.telemetry.setSuccess(span, false);
      this.telemetry.recordException(span, error as Error);
      this.telemetry.recordDbOperation('create', this.tableName, duration, false);
      this.telemetry.recordTaskError((error as Error).constructor.name);

      span?.end();
      throw error;
    }
  }

  /**
   * Get a task with tracing
   */
  async getTask(id: string): Promise<Task | null> {
    const startTime = Date.now();
    const span = this.telemetry.traceDbOperation('read', this.tableName);
    span?.setAttribute('a2a.task.id', id);

    try {
      const result = await this.taskStore.getTask(id);
      const duration = Date.now() - startTime;

      this.telemetry.setSuccess(span, true);
      if (result) {
        this.telemetry.addAttributes(span, {
          'a2a.task.id': result.id,
          'a2a.context.id': result.contextId,
        });
      }

      this.telemetry.recordDbOperation('read', this.tableName, duration, true);

      span?.end();
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.telemetry.setSuccess(span, false);
      this.telemetry.recordException(span, error as Error);
      this.telemetry.recordDbOperation('read', this.tableName, duration, false);

      span?.end();
      throw error;
    }
  }

  /**
   * Update a task with tracing
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const startTime = Date.now();
    const span = this.telemetry.traceDbOperation('update', this.tableName);
    span?.setAttribute('a2a.task.id', id);

    const oldState = updates.status?.state;

    try {
      const result = await this.taskStore.updateTask(id, updates);
      const duration = Date.now() - startTime;

      this.telemetry.setSuccess(span, true);
      this.telemetry.setTaskState(span, result.status?.state ?? 'unknown');
      this.telemetry.addAttributes(span, {
        'a2a.task.id': result.id,
        'a2a.context.id': result.contextId,
        ...(oldState && { 'a2a.task.previous_state': oldState }),
      });

      this.telemetry.recordDbOperation('update', this.tableName, duration, true);
      this.telemetry.recordTaskExecution(duration, result.status?.state ?? 'unknown');

      span?.end();
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.telemetry.setSuccess(span, false);
      this.telemetry.recordException(span, error as Error);
      this.telemetry.recordDbOperation('update', this.tableName, duration, false);
      this.telemetry.recordTaskError((error as Error).constructor.name);

      span?.end();
      throw error;
    }
  }

  /**
   * Delete a task with tracing
   */
  async deleteTask(id: string): Promise<void> {
    const startTime = Date.now();
    const span = this.telemetry.traceDbOperation('delete', this.tableName);
    span?.setAttribute('a2a.task.id', id);

    try {
      await this.taskStore.deleteTask(id);
      const duration = Date.now() - startTime;

      this.telemetry.setSuccess(span, true);
      this.telemetry.recordDbOperation('delete', this.tableName, duration, true);

      span?.end();
    } catch (error) {
      const duration = Date.now() - startTime;
      this.telemetry.setSuccess(span, false);
      this.telemetry.recordException(span, error as Error);
      this.telemetry.recordDbOperation('delete', this.tableName, duration, false);

      span?.end();
      throw error;
    }
  }

  /**
   * List tasks with tracing
   */
  async listTasks(filter?: TaskFilter): Promise<Task[]> {
    const startTime = Date.now();
    const span = this.telemetry.traceDbOperation('list', this.tableName);

    try {
      const result = await this.taskStore.listTasks(filter);
      const duration = Date.now() - startTime;

      this.telemetry.setSuccess(span, true);
      this.telemetry.addAttributes(span, {
        'a2a.task.count': result.length,
      });

      if (filter?.contextId) {
        span?.setAttribute('a2a.context.id', filter.contextId);
      }

      if (filter?.status) {
        span?.setAttribute('a2a.task.filter.status', filter.status);
      }

      this.telemetry.recordDbOperation('list', this.tableName, duration, true);

      span?.end();
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.telemetry.setSuccess(span, false);
      this.telemetry.recordException(span, error as Error);
      this.telemetry.recordDbOperation('list', this.tableName, duration, false);

      span?.end();
      throw error;
    }
  }

  /**
   * Close the task store
   */
  async close(): Promise<void> {
    const span = this.telemetry.traceDbOperation('close', this.tableName);
    try {
      await this.taskStore.close();
      this.telemetry.setSuccess(span, true);
    } catch (error) {
      this.telemetry.setSuccess(span, false);
      this.telemetry.recordException(span, error as Error);
      throw error;
    } finally {
      span?.end();
    }
  }
}

/**
 * Wrap a task store with instrumentation
 */
export function instrumentTaskStore(
  taskStore: DatabaseTaskStore,
  telemetry: A2ATelemetryWrapper,
  options: TaskStoreInstrumentationOptions = {}
): InstrumentedTaskStore {
  return new InstrumentedTaskStore(taskStore, telemetry, options);
}
