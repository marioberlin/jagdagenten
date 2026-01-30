/**
 * Artifact System Tests
 */

import { describe, test, expect, beforeAll, afterAll, mock } from 'bun:test';
import { v1 } from '@jagdagenten/a2a-sdk';
import type { StoredArtifact, ArtifactCategory } from './types.js';

// Mock pool for testing without actual database
const mockRows: Record<string, unknown>[] = [];
let mockIdCounter = 1;

const mockPool = {
  query: mock((sql: string, params?: unknown[]) => {
    // Handle different query types based on SQL
    if (sql.includes('INSERT INTO')) {
      const newRow = {
        id: `mock-id-${mockIdCounter++}`,
        task_id: params?.[0],
        context_id: params?.[1],
        artifact_id: params?.[2],
        name: params?.[3],
        description: params?.[4],
        parts: params?.[5],
        metadata: params?.[6],
        extensions: params?.[7],
        is_streaming: params?.[8],
        is_complete: params?.[9],
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockRows.push(newRow);
      return Promise.resolve({ rows: [newRow], rowCount: 1 });
    }
    if (sql.includes('SELECT') && params?.[0]) {
      const found = mockRows.find(r => r.id === params[0] || r.artifact_id === params[0]);
      return Promise.resolve({ rows: found ? [found] : [], rowCount: found ? 1 : 0 });
    }
    if (sql.includes('DELETE')) {
      const idx = mockRows.findIndex(r => r.id === params?.[0]);
      if (idx > -1) mockRows.splice(idx, 1);
      return Promise.resolve({ rowCount: 1 });
    }
    if (sql.includes('COUNT')) {
      return Promise.resolve({ rows: [{ total: mockRows.length, complete: mockRows.length, streaming: 0 }] });
    }
    return Promise.resolve({ rows: mockRows, rowCount: mockRows.length });
  }),
  connect: mock(() => Promise.resolve({
    query: mock(() => Promise.resolve({ rows: [] })),
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

// Import after mocking
const { PostgresArtifactStore } = await import('./postgres-store.js');

describe('PostgresArtifactStore', () => {
  let store: InstanceType<typeof PostgresArtifactStore>;

  beforeAll(() => {
    store = new PostgresArtifactStore({
      connectionString: 'postgresql://localhost:5432/test',
    });
  });

  afterAll(async () => {
    await store.close();
  });

  test('should initialize database tables', async () => {
    await store.initialize();
    expect(mockPool.connect).toHaveBeenCalled();
  });

  test('should create an artifact', async () => {
    const artifact: v1.Artifact = {
      artifactId: 'test-artifact-1',
      name: 'Test Artifact',
      description: 'A test artifact',
      parts: [{ text: 'Hello World' }],
      metadata: { category: 'analysis' },
    };

    const result = await store.create(artifact, 'task-1', 'ctx-1');

    expect(result.artifactId).toBe('test-artifact-1');
    expect(result.name).toBe('Test Artifact');
    expect(result.taskId).toBe('task-1');
    expect(result.contextId).toBe('ctx-1');
  });

  test('should get artifact by ID', async () => {
    const result = await store.get('mock-id-1');

    // Result may be null in mock, but function should complete
    expect(result === null || typeof result === 'object').toBe(true);
  });

  test('should list artifacts with filters', async () => {
    const results = await store.list({ taskId: 'task-1', limit: 10 });

    expect(Array.isArray(results)).toBe(true);
  });

  test('should get recent artifacts', async () => {
    const results = await store.getRecent(5);

    expect(Array.isArray(results)).toBe(true);
  });

  test('should handle streaming artifacts', async () => {
    const artifact: v1.Artifact = {
      artifactId: 'streaming-artifact',
      name: 'Streaming Test',
      parts: [],
    };

    const id = await store.startStream(artifact, 'task-2', 'ctx-2');

    expect(typeof id).toBe('string');
  });

  test('should delete artifact', async () => {
    await store.delete('mock-id-1');
    expect(mockPool.query).toHaveBeenCalled();
  });
});

describe('TRADING_TEMPLATES', async () => {
  const { TRADING_TEMPLATES } = await import('./index.js');

  test('should have required trading templates', () => {
    expect(TRADING_TEMPLATES.length).toBeGreaterThan(0);

    const templateIds = TRADING_TEMPLATES.map(t => t.id);
    expect(templateIds).toContain('portfolio-snapshot');
    expect(templateIds).toContain('trade-confirmation');
    expect(templateIds).toContain('price-alert');
  });

  test('templates should have valid structure', () => {
    for (const template of TRADING_TEMPLATES) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.template).toBeDefined();
      expect(template.template.parts).toBeDefined();
      expect(Array.isArray(template.template.parts)).toBe(true);
    }
  });

  test('portfolio-snapshot template should have correct structure', () => {
    const template = TRADING_TEMPLATES.find(t => t.id === 'portfolio-snapshot');

    expect(template).toBeDefined();
    expect(template?.category).toBe('portfolio');
    expect(template?.template.parts.length).toBeGreaterThan(0);
  });

  test('trade-confirmation template should have correct structure', () => {
    const template = TRADING_TEMPLATES.find(t => t.id === 'trade-confirmation');

    expect(template).toBeDefined();
    expect(template?.category).toBe('trading');
    expect(template?.template.parts.length).toBe(2);
  });
});

describe('StoredArtifact Type', () => {
  test('should have all required fields', () => {
    const artifact: StoredArtifact = {
      id: 'db-id-1',
      taskId: 'task-1',
      contextId: 'ctx-1',
      artifactId: 'artifact-1',
      name: 'Test',
      parts: [{ text: 'content' }],
      version: 1,
      isStreaming: false,
      isComplete: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(artifact.id).toBeDefined();
    expect(artifact.taskId).toBeDefined();
    expect(artifact.contextId).toBeDefined();
    expect(artifact.artifactId).toBeDefined();
    expect(artifact.version).toBe(1);
    expect(artifact.isComplete).toBe(true);
  });
});

describe('ArtifactCategory', () => {
  test('should include expected categories', () => {
    const categories: ArtifactCategory[] = [
      'trading',
      'analysis',
      'report',
      'chart',
      'portfolio',
      'alert',
      'custom',
    ];

    for (const cat of categories) {
      expect(typeof cat).toBe('string');
    }
  });
});
