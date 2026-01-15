/**
 * Request handler interface for A2A server
 */

import { AsyncIterableIterator } from 'typescript';
import {
  MessageSendParams,
  TaskQueryParams,
  TaskIdParams,
  TaskPushNotificationConfig,
  TaskPushNotificationConfigRequest,
  Message,
  Task,
  TaskEvent,
} from '../types';
import { ServerCallContext } from './context';

/**
 * A2A request handler interface
 * Defines the methods that an A2A server implementation must provide
 */
export interface RequestHandler {
  /**
   * Handles the 'tasks/get' method
   * Retrieves the state and history of a specific task
   */
  onGetTask(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<Task | null>;

  /**
   * Handles the 'tasks/cancel' method
   * Requests the agent to cancel an ongoing task
   */
  onCancelTask(
    params: TaskIdParams,
    context?: ServerCallContext
  ): Promise<Task | null>;

  /**
   * Handles the 'message/send' method (non-streaming)
   * Sends a message to the agent to create, continue, or restart a task,
   * and waits for the final result
   */
  onMessageSend(
    params: MessageSendParams,
    context?: ServerCallContext
  ): Promise<Task | Message>;

  /**
   * Handles the 'message/stream' method (streaming)
   * Sends a message to the agent and yields stream events as they are produced
   */
  onMessageSendStream(
    params: MessageSendParams,
    context?: ServerCallContext
  ): AsyncIterableIterator<TaskEvent>;

  /**
   * Handles the 'tasks/resubscribe' method
   * Re-subscribes to updates for a previously created task
   */
  onResubscribeToTask(
    params: TaskIdParams,
    context?: ServerCallContext
  ): AsyncIterableIterator<TaskEvent>;

  /**
   * Handles the 'tasks/pushNotificationConfig/get' method
   * Gets push notification configuration for a task
   */
  onGetTaskPushNotificationConfig(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig | null>;

  /**
   * Handles the 'tasks/pushNotificationConfig/set' method
   * Sets push notification configuration for a task
   */
  onSetTaskPushNotificationConfig(
    params: TaskPushNotificationConfigRequest,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig>;

  /**
   * Handles the 'tasks/pushNotificationConfig/list' method
   * Lists push notification configurations
   */
  onListTaskPushNotificationConfig(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig[]>;

  /**
   * Handles the 'tasks/pushNotificationConfig/delete' method
   * Deletes push notification configuration
   */
  onDeleteTaskPushNotificationConfig(
    params: TaskIdParams,
    context?: ServerCallContext
  ): Promise<void>;
}

/**
 * Default request handler implementation
 * Provides basic task management and delegation to agent executor
 */
export class DefaultRequestHandler implements RequestHandler {
  private agentExecutor: any; // AgentExecutor type - circular import avoided
  private taskStore: any; // TaskStore type
  private eventQueue: any; // EventQueue type

  constructor(
    agentExecutor: any,
    taskStore: any,
    eventQueue: any
  ) {
    this.agentExecutor = agentExecutor;
    this.taskStore = taskStore;
    this.eventQueue = eventQueue;
  }

  async onGetTask(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<Task | null> {
    return await this.taskStore.getTask(params.id);
  }

  async onCancelTask(
    params: TaskIdParams,
    context?: ServerCallContext
  ): Promise<Task | null> {
    const task = await this.taskStore.getTask(params.id);
    if (!task) {
      return null;
    }

    // Update task status to canceled
    task.status.state = 'canceled';
    await this.taskStore.updateTask(params.id, task);
    return task;
  }

  async onMessageSend(
    params: MessageSendParams,
    context?: ServerCallContext
  ): Promise<Task | Message> {
    // Create execution context
    const executionContext = {
      requestId: crypto.randomUUID(),
      user: context?.user,
      metadata: context?.metadata,
      signal: context?.signal,
    };

    // Execute the message through the agent executor
    const result = await this.agentExecutor.execute(
      params.message,
      executionContext
    );

    // If a task was created, save it
    if (result.task) {
      await this.taskStore.createTask(result.task);

      // Emit events if any
      if (result.events) {
        for (const event of result.events) {
          await this.eventQueue.enqueue(event);
        }
      }
    }

    return result.message || result.task!;
  }

  async *onMessageSendStream(
    params: MessageSendParams,
    context?: ServerCallContext
  ): AsyncIterableIterator<TaskEvent> {
    // Create execution context
    const executionContext = {
      requestId: crypto.randomUUID(),
      user: context?.user,
      metadata: context?.metadata,
      signal: context?.signal,
    };

    // Create a new task
    const task: Task = {
      id: crypto.randomUUID(),
      status: {
        state: 'running',
        timestamp: new Date().toISOString(),
      },
      kind: 'task',
      messages: [params.message],
    };

    await this.taskStore.createTask(task);

    // Emit initial task event
    await this.eventQueue.enqueue({
      kind: 'task.status',
      task_id: task.id,
      task: task,
      timestamp: task.status.timestamp,
    } as any);

    // Stream events as the agent executes
    for await (const event of this.agentExecutor.executeStream(
      params.message,
      executionContext
    )) {
      await this.eventQueue.enqueue(event);
      yield event;
    }

    // Update task status to completed
    task.status.state = 'completed';
    await this.taskStore.updateTask(task.id, task);
  }

  async *onResubscribeToTask(
    params: TaskIdParams,
    context?: ServerCallContext
  ): AsyncIterableIterator<TaskEvent> {
    const task = await this.taskStore.getTask(params.id);
    if (!task) {
      return;
    }

    // Stream all events from the event queue for this task
    while (true) {
      const event = await this.eventQueue.dequeue(params.id);
      if (event) {
        yield event;
      } else {
        // No more events, break after a short delay
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
      }
    }
  }

  async onGetTaskPushNotificationConfig(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig | null> {
    // Implementation would depend on push notification config store
    // For now, return null (not implemented)
    return null;
  }

  async onSetTaskPushNotificationConfig(
    params: TaskPushNotificationConfigRequest,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig> {
    // Implementation would save to push notification config store
    // For now, just return the config
    return params.pushNotificationConfig as TaskPushNotificationConfig;
  }

  async onListTaskPushNotificationConfig(
    params: TaskQueryParams,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig[]> {
    // Implementation would list from push notification config store
    return [];
  }

  async onDeleteTaskPushNotificationConfig(
    params: TaskIdParams,
    context?: ServerCallContext
  ): Promise<void> {
    // Implementation would delete from push notification config store
    return;
  }
}
