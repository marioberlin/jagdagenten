/**
 * Database Task Store Exports
 *
 * Unified exports for all database-backed task store implementations.
 */

export * from './task-store';
export * from './postgres-task-store';
export * from './mysql-task-store';
export * from './sqlite-task-store';

/**
 * Task Store Factory
 *
 * Factory for creating appropriate task store based on database configuration
 */
export class TaskStoreFactory {
  /**
   * Create a task store instance
   */
  static create(config: {
    type: 'postgres' | 'mysql' | 'sqlite';
    connection: string | object;
    tableName?: string;
    timeout?: number;
    maxConnections?: number;
    ssl?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
    walMode?: boolean;
    foreignKeys?: boolean;
    cacheSize?: number;
  }): import('./task-store').DatabaseTaskStore {
    switch (config.type) {
      case 'postgres':
        const { PostgresTaskStore } = require('./postgres-task-store');
        return new PostgresTaskStore(config);

      case 'mysql':
        const { MysqlTaskStore } = require('./mysql-task-store');
        return new MysqlTaskStore(config);

      case 'sqlite':
        const { SQLiteTaskStore } = require('./sqlite-task-store');
        return new SQLiteTaskStore(config);

      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
}
