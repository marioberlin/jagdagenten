/**
 * PostgreSQL Store Tests
 *
 * These tests verify the PostgreSQL store implementation.
 * Run with: bun test server/src/a2a/adapter/postgres-store.test.ts
 */

import { describe, test, expect, beforeAll, afterAll, mock } from 'bun:test';
import {
  PostgresTaskStoreV1,
  PostgresPushNotificationStore,
  createPostgresStores,
  createPostgresStoresFromEnv,
  type PostgresTaskStoreConfig,
} from './postgres-store.js';
import { v1 } from '@liquidcrypto/a2a-sdk';

// Mock Pool for unit tests (no actual DB connection)
const mockPool = {
  query: mock(() => Promise.resolve({ rows: [] })),
  connect: mock(() => Promise.resolve({
    query: mock(() => Promise.resolve()),
    release: mock(),
  })),
  end: mock(() => Promise.resolve()),
  on: mock(),
};

// Mock pg module
mock.module('pg', () => ({
  Pool: class MockPool {
    constructor() {
      return mockPool;
    }
  },
}));

describe('PostgresTaskStoreV1', () => {
  const config: PostgresTaskStoreConfig = {
    connectionString: 'postgresql://localhost:5432/test',
    tableName: 'test_tasks',
    useInlineArtifacts: true, // Use inline storage for mocked tests
  };

  let store: PostgresTaskStoreV1;

  beforeAll(() => {
    store = new PostgresTaskStoreV1(config);
  });

  afterAll(async () => {
    await store.close();
  });

  test('should initialize table on first use', async () => {
    await store.get('non-existent');
    expect(mockPool.connect).toHaveBeenCalled();
  });

  test('should return null for non-existent task', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await store.get('non-existent-id');
    expect(result).toBeNull();
  });

  test('should deserialize task correctly', async () => {
    const mockRow = {
      id: 'task-123',
      context_id: 'ctx-456',
      status_state: 'completed',
      status_message: { role: 'agent', messageId: 'msg-1', parts: [{ text: 'Done' }] },
      status_timestamp: '2024-01-15T10:00:00Z',
      artifacts: [{ artifactId: 'art-1', name: 'result', parts: [{ text: 'Data' }] }],
      history: [],
      metadata: { custom: 'value' },
    };

    mockPool.query.mockResolvedValueOnce({ rows: [mockRow] });

    const result = await store.get('task-123');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('task-123');
    expect(result?.contextId).toBe('ctx-456');
    expect(result?.status.state).toBe('completed');
    expect(result?.artifacts).toHaveLength(1);
  });

  test('should serialize task correctly for insert', async () => {
    const task: v1.Task = {
      id: 'task-789',
      contextId: 'ctx-abc',
      status: {
        state: v1.TaskState.WORKING,
        timestamp: '2024-01-15T12:00:00Z',
      },
      artifacts: [],
      history: [],
    };

    await store.set(task);

    expect(mockPool.query).toHaveBeenCalled();
    const lastCall = mockPool.query.mock.calls[mockPool.query.mock.calls.length - 1];
    expect(lastCall[1]).toContain('task-789');
    expect(lastCall[1]).toContain('ctx-abc');
  });

  test('should list tasks by context', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id: 't1', context_id: 'ctx-1', status_state: 'completed', artifacts: '[]', history: '[]' },
        { id: 't2', context_id: 'ctx-1', status_state: 'working', artifacts: '[]', history: '[]' },
      ],
    });

    const results = await store.listByContext('ctx-1');

    expect(results).toHaveLength(2);
    expect(results[0].contextId).toBe('ctx-1');
  });

  test('should delete task', async () => {
    await store.delete('task-to-delete');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM'),
      ['task-to-delete']
    );
  });
});

describe('PostgresPushNotificationStore', () => {
  const config: PostgresTaskStoreConfig = {
    connectionString: 'postgresql://localhost:5432/test',
    pushNotificationsTableName: 'test_push',
  };

  let store: PostgresPushNotificationStore;

  beforeAll(() => {
    store = new PostgresPushNotificationStore(config);
  });

  afterAll(async () => {
    await store.close();
  });

  test('should store push notification config', async () => {
    const pushConfig: v1.PushNotificationConfig = {
      url: 'https://webhook.example.com/notify',
      token: 'secret-token',
    };

    await store.set('task-123', pushConfig);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO'),
      expect.arrayContaining(['task-123'])
    );
  });

  test('should retrieve push notification config', async () => {
    const mockConfig = {
      url: 'https://webhook.example.com/notify',
      token: 'secret-token',
    };

    mockPool.query.mockResolvedValueOnce({
      rows: [{ config: mockConfig }],
    });

    const result = await store.get('task-123');

    expect(result).not.toBeNull();
    expect(result?.url).toBe('https://webhook.example.com/notify');
    expect(result?.token).toBe('secret-token');
  });

  test('should delete push notification config', async () => {
    await store.delete('task-456');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM'),
      ['task-456']
    );
  });
});

describe('Factory functions', () => {
  test('createPostgresStores should create both stores', () => {
    const stores = createPostgresStores('postgresql://localhost:5432/test');

    expect(stores.taskStore).toBeInstanceOf(PostgresTaskStoreV1);
    expect(stores.pushNotificationStore).toBeInstanceOf(PostgresPushNotificationStore);
  });

  test('createPostgresStoresFromEnv should return null without DATABASE_URL', () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const stores = createPostgresStoresFromEnv();

    expect(stores).toBeNull();

    // Restore
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv;
    }
  });

  test('createPostgresStoresFromEnv should create stores with DATABASE_URL', () => {
    const originalEnv = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    const stores = createPostgresStoresFromEnv();

    expect(stores).not.toBeNull();
    expect(stores?.taskStore).toBeInstanceOf(PostgresTaskStoreV1);

    // Restore
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });
});
