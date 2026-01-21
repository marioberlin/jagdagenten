/**
 * Push Service for iCloud real-time notifications
 */

import { BaseService } from './BaseService';
import type {
  PushNotification,
  PushCommand,
  PushConnection,
  PushHandler,
  PushServiceConfig,
} from '../types/push';
import { DEFAULT_PUSH_CONFIG } from '../types/push';
import { ICloudError } from '../errors/ICloudError';
import { generateUUID } from '../utils/ids';

type PushEventHandler = (notification: PushNotification) => void;
type ConnectionEventHandler = () => void;
type ErrorEventHandler = (error: Error) => void;
type ReconnectEventHandler = (attempt: number) => void;

export class PushService extends BaseService {
  private connection: PushConnection | null = null;
  private handlers: Map<string, Set<PushHandler>> = new Map();
  private eventHandlers: {
    notification: Set<PushEventHandler>;
    connected: Set<ConnectionEventHandler>;
    disconnected: Set<ConnectionEventHandler>;
    error: Set<ErrorEventHandler>;
    reconnecting: Set<ReconnectEventHandler>;
  } = {
    notification: new Set(),
    connected: new Set(),
    disconnected: new Set(),
    error: new Set(),
    reconnecting: new Set(),
  };
  private config: Required<PushServiceConfig>;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastSequenceNumber = 0;
  private isPolling = false;

  constructor(client: InstanceType<typeof import('../ICloud').ICloud>) {
    super(client);
    this.config = { ...DEFAULT_PUSH_CONFIG } as Required<PushServiceConfig>;
  }

  protected getServiceConfig() {
    return this.client.account?.webservices.push;
  }

  /**
   * Configure the push service
   */
  configure(config: Partial<PushServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start receiving push notifications
   */
  async connect(): Promise<void> {
    if (this.connection?.connected) {
      return;
    }

    this.connection = {
      connected: false,
      connectionId: generateUUID(),
      topics: this.config.topics.map(topic => ({
        topic,
        enabled: true,
      })),
      reconnectAttempts: 0,
    };

    await this.startPolling();

    this.connection.connected = true;
    this.connection.lastConnectedAt = Date.now();
    this.emit('connected');
  }

  /**
   * Stop receiving push notifications
   */
  disconnect(): void {
    this.stopPolling();

    if (this.connection) {
      this.connection.connected = false;
    }

    this.emit('disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.connected ?? false;
  }

  /**
   * Subscribe to specific notification types
   */
  subscribe(command: PushCommand | PushCommand[], handler: (notification: PushNotification) => void): () => void {
    const commands = Array.isArray(command) ? command : [command];
    const handlerObj: PushHandler = { command: commands, handler };

    for (const cmd of commands) {
      if (!this.handlers.has(cmd)) {
        this.handlers.set(cmd, new Set());
      }
      this.handlers.get(cmd)!.add(handlerObj);
    }

    // Return unsubscribe function
    return () => {
      for (const cmd of commands) {
        this.handlers.get(cmd)?.delete(handlerObj);
      }
    };
  }

  /**
   * Subscribe to all notifications
   */
  onNotification(handler: PushEventHandler): () => void {
    this.eventHandlers.notification.add(handler);
    return () => this.eventHandlers.notification.delete(handler);
  }

  /**
   * Subscribe to connection events
   */
  onConnected(handler: ConnectionEventHandler): () => void {
    this.eventHandlers.connected.add(handler);
    return () => this.eventHandlers.connected.delete(handler);
  }

  /**
   * Subscribe to disconnection events
   */
  onDisconnected(handler: ConnectionEventHandler): () => void {
    this.eventHandlers.disconnected.add(handler);
    return () => this.eventHandlers.disconnected.delete(handler);
  }

  /**
   * Subscribe to error events
   */
  onError(handler: ErrorEventHandler): () => void {
    this.eventHandlers.error.add(handler);
    return () => this.eventHandlers.error.delete(handler);
  }

  /**
   * Subscribe to reconnection events
   */
  onReconnecting(handler: ReconnectEventHandler): () => void {
    this.eventHandlers.reconnecting.add(handler);
    return () => this.eventHandlers.reconnecting.delete(handler);
  }

  /**
   * Manually poll for new notifications
   */
  async poll(): Promise<PushNotification[]> {
    try {
      const response = await this.post<{
        notifications: unknown[];
        sequenceNumber: number;
      }>(
        'push',
        '/push/poll',
        {
          clientId: this.connection?.connectionId,
          lastSequenceNumber: this.lastSequenceNumber,
          topics: this.config.topics,
        }
      );

      this.lastSequenceNumber = response.sequenceNumber;

      const notifications = (response.notifications || []).map(n =>
        this.parseNotification(n)
      );

      // Process notifications
      for (const notification of notifications) {
        this.processNotification(notification);
      }

      if (this.connection) {
        this.connection.lastMessageAt = Date.now();
      }

      return notifications;
    } catch (error) {
      const icloudError = error instanceof ICloudError
        ? error
        : new ICloudError(
            error instanceof Error ? error.message : 'Poll failed',
            'NETWORK_ERROR'
          );

      this.emit('error', icloudError);
      throw icloudError;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): PushConnection | null {
    return this.connection;
  }

  // Private methods

  private async startPolling(): Promise<void> {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollInterval = setInterval(async () => {
      if (!this.connection?.connected) {
        this.stopPolling();
        return;
      }

      try {
        await this.poll();
      } catch (error) {
        // Handle reconnection
        await this.handleReconnection();
      }
    }, this.config.reconnectIntervalMs);

    // Initial poll
    try {
      await this.poll();
    } catch (error) {
      // Ignore initial poll errors
    }
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  private async handleReconnection(): Promise<void> {
    if (!this.connection) return;

    this.connection.reconnectAttempts++;

    if (this.connection.reconnectAttempts > this.config.maxReconnectAttempts) {
      this.disconnect();
      this.emit('error', new Error('Max reconnection attempts exceeded'));
      return;
    }

    this.emit('reconnecting', this.connection.reconnectAttempts);

    // Exponential backoff
    const delay = Math.min(
      this.config.reconnectIntervalMs * Math.pow(2, this.connection.reconnectAttempts - 1),
      30000
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.poll();
      this.connection.reconnectAttempts = 0;
      this.emit('connected');
    } catch (error) {
      // Will retry on next interval
    }
  }

  private parseNotification(raw: unknown): PushNotification {
    const data = raw as Record<string, unknown>;

    return {
      cmd: (data.cmd as PushCommand) || 'UNKNOWN',
      userInfo: data.userInfo as Record<string, unknown> | undefined,
      payload: data.payload as PushNotification['payload'],
      messageId: (data.messageId as string) || generateUUID(),
      receivedAt: Date.now(),
    };
  }

  private processNotification(notification: PushNotification): void {
    // Emit to general listeners
    this.emit('notification', notification);

    // Emit to specific command handlers
    const handlers = this.handlers.get(notification.cmd);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler.handler(notification);
        } catch (error) {
          console.error('Error in notification handler:', error);
        }
      }
    }
  }

  private emit(event: 'notification', notification: PushNotification): void;
  private emit(event: 'connected' | 'disconnected'): void;
  private emit(event: 'error', error: Error): void;
  private emit(event: 'reconnecting', attempt: number): void;
  private emit(
    event: 'notification' | 'connected' | 'disconnected' | 'error' | 'reconnecting',
    data?: PushNotification | Error | number
  ): void {
    switch (event) {
      case 'notification':
        for (const handler of this.eventHandlers.notification) {
          handler(data as PushNotification);
        }
        break;
      case 'connected':
        for (const handler of this.eventHandlers.connected) {
          handler();
        }
        break;
      case 'disconnected':
        for (const handler of this.eventHandlers.disconnected) {
          handler();
        }
        break;
      case 'error':
        for (const handler of this.eventHandlers.error) {
          handler(data as Error);
        }
        break;
      case 'reconnecting':
        for (const handler of this.eventHandlers.reconnecting) {
          handler(data as number);
        }
        break;
    }
  }
}

// Re-export DEFAULT_PUSH_CONFIG
export { DEFAULT_PUSH_CONFIG } from '../types/push';
