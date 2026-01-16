/**
 * Server interfaces and types for the A2A TypeScript SDK
 */

import type {
  AgentCard,
  Message,
  PushNotificationConfig,
  Task,
  TaskPushNotificationConfig,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from '../types/v1';

// Event type union
export type TaskEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

/**
 * Task ID parameters
 */
export interface TaskIdParams {
  id: string;
  metadata?: Record<string, unknown>;
}

/**
 * Task query parameters
 */
export interface TaskQueryParams extends TaskIdParams {
  historyLength?: number;
}

/**
 * Push notification config request
 */
export interface TaskPushNotificationConfigRequest {
  taskId: string;
  pushNotificationConfig: PushNotificationConfig;
}

/**
 * Agent executor interface for implementing agent logic
 */
export interface AgentExecutor {
  /**
   * Executes a task with the given message
   */
  execute(
    message: Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult>;

  /**
   * Executes a task with streaming responses
   */
  executeStream?(
    message: Message,
    context: AgentExecutionContext
  ): AsyncIterable<TaskEvent>;
}

/**
 * Result of agent execution
 */
export interface AgentExecutionResult {
  /** The response message */
  message?: Message;

  /** The task (if a new task was created or existing task was updated) */
  task?: Task;

  /** Events emitted during execution */
  events?: TaskEvent[];
}

/**
 * Context for agent execution
 */
export interface AgentExecutionContext {
  /** Request ID */
  requestId: string;

  /** User information */
  user?: User;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Cancellation signal */
  signal?: AbortSignal;
}

/**
 * User information
 */
export interface User {
  /** User ID */
  id: string;

  /** User type */
  type?: string;

  /** User metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Database configuration for task persistence
 */
export interface DatabaseConfig {
  /** Database type */
  type: 'postgres' | 'mysql' | 'sqlite';

  /** Connection string or configuration object */
  connection: string | object;

  /** Database table name (default: 'a2a_tasks') */
  tableName?: string;

  /** Connection timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum number of connections in pool (default: 10) */
  maxConnections?: number;

  /** Enable SSL for connections (default: false) */
  ssl?: boolean;

  /** Connection retry attempts (default: 3) */
  retryAttempts?: number;

  /** Delay between retry attempts in ms (default: 1000) */
  retryDelay?: number;

  /** Enable WAL mode for SQLite (default: true) */
  walMode?: boolean;

  /** Enable foreign key constraints for SQLite (default: true) */
  foreignKeys?: boolean;

  /** Cache size for SQLite (default: 2000 pages) */
  cacheSize?: number;
}

/** Telemetry configuration for server */
export interface TelemetryConfig {
  /** Service name for telemetry */
  serviceName?: string;

  /** Enable telemetry */
  enabled?: boolean;

  /** OpenTelemetry exporter configuration */
  openTelemetry?: {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    traceExporterUrl?: string;
    metricsExporterUrl?: string;
    metricsInterval?: number;
  };
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Agent card describing this agent */
  agentCard: AgentCard;

  /** Agent executor implementation */
  executor: AgentExecutor;

  /** Port to listen on */
  port?: number;

  /** Host to bind to */
  host?: string;

  /** SSL configuration */
  ssl?: SSLConfig;

  /** CORS configuration */
  cors?: CORSConfig;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Maximum concurrent requests */
  maxConcurrency?: number;

  /** Database configuration for task persistence */
  database?: DatabaseConfig;

  /** Telemetry configuration */
  telemetry?: TelemetryConfig;
}

/**
 * SSL configuration
 */
export interface SSLConfig {
  /** Path to SSL certificate file */
  cert: string;

  /** Path to SSL private key file */
  key: string;
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  /** Allowed origins */
  origins?: string[];

  /** Allowed methods */
  methods?: string[];

  /** Allowed headers */
  headers?: string[];

  /** Whether to allow credentials */
  credentials?: boolean;
}

/**
 * Task store interface for persisting tasks
 */
export interface TaskStore {
  /** Initialize the store */
  initialize?(): Promise<void>;

  /** Creates a new task */
  createTask(task: Task): Promise<Task>;

  /** Updates an existing task */
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;

  /** Gets a task by ID */
  getTask(id: string): Promise<Task | null>;

  /** Deletes a task */
  deleteTask(id: string): Promise<void>;

  /** Lists tasks with optional filtering */
  listTasks(filter?: TaskFilter): Promise<Task[]>;

  /** Closes the store */
  close?(): Promise<void>;
}

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
 * Push notification sender interface
 */
export interface PushNotificationSender {
  /** Sends a push notification */
  send(
    config: PushNotificationConfig,
    event: TaskEvent
  ): Promise<void>;
}

/**
 * A2A Server interface
 */
export interface A2AServer {
  /** Starts the server */
  start(): Promise<void>;

  /** Stops the server */
  stop(): Promise<void>;

  /** Gets the server status */
  getStatus(): ServerStatus;
}

/**
 * Server status
 */
export interface ServerStatus {
  /** Whether the server is running */
  running: boolean;

  /** Server uptime in milliseconds */
  uptime: number;

  /** Number of active connections */
  activeConnections: number;

  /** Number of processed requests */
  processedRequests: number;
}

/**
 * Server call context
 */
export interface ServerCallContext {
  /** User information */
  user?: User;

  /** Additional state */
  state?: Record<string, unknown>;

  /** Requested extensions */
  requested_extensions?: string[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Cancellation signal */
  signal?: AbortSignal;
}
