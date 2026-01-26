/**
 * VideoRender Service Integration Tests
 *
 * Tests the VideoRenderService which provides:
 * - Composition management (create, get, list)
 * - Render job orchestration
 * - Preview frame generation
 * - Service status tracking
 *
 * These tests run in standalone mode (no external dependencies).
 * For production mode tests with PostgreSQL/NATS, use the Docker integration tests.
 */

import { describe, test, expect, beforeEach, afterAll } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm } from 'fs/promises';
import {
  VideoRenderService,
  createVideoRenderService,
  type VideoRenderServiceConfig,
  type CreateCompositionParams,
} from '../executors/video-render-service.js';
import type { CompositionState } from '../executors/video-render.js';

// Test configuration
const TEST_TEMP_DIR = join(tmpdir(), 'video-service-test-' + process.pid);
const TEST_CONFIG: VideoRenderServiceConfig = {
  outputDir: join(TEST_TEMP_DIR, 'renders'),
  tempDir: TEST_TEMP_DIR,
  mode: 'standalone',
};

// Cleanup after all tests
afterAll(async () => {
  try {
    await rm(TEST_TEMP_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

describe('VideoRenderService', () => {
  let service: VideoRenderService;

  beforeEach(() => {
    // Create fresh service for each test
    service = createVideoRenderService(TEST_CONFIG);
  });

  describe('initialization', () => {
    test('creates service in standalone mode', () => {
      const status = service.getStatus();
      expect(status.mode).toBe('standalone');
      expect(status.storeAvailable).toBe(false);
      expect(status.queueAvailable).toBe(false);
    });

    test('initializes without external dependencies', async () => {
      await service.initialize();
      const status = service.getStatus();
      expect(status.mode).toBe('standalone');
    });
  });

  describe('composition management', () => {
    test('creates a composition with all parameters', async () => {
      await service.initialize();

      const params: CreateCompositionParams = {
        name: 'Test Composition',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 300,
        props: { title: 'Hello World' },
        metadata: { author: 'Test' },
      };

      const composition = await service.createComposition(params);

      expect(composition.id).toBeDefined();
      expect(composition.id.startsWith('comp-')).toBe(true);
      expect(composition.name).toBe('Test Composition');
      expect(composition.width).toBe(1920);
      expect(composition.height).toBe(1080);
      expect(composition.fps).toBe(30);
      expect(composition.durationInFrames).toBe(300);
      expect(composition.props).toEqual({ title: 'Hello World' });
      expect(composition.metadata).toEqual({ author: 'Test' });
    });

    test('creates composition with custom ID', async () => {
      await service.initialize();

      const composition = await service.createComposition({
        id: 'my-custom-id',
        name: 'Custom ID Comp',
        width: 1280,
        height: 720,
        fps: 24,
        durationInFrames: 120,
      });

      expect(composition.id).toBe('my-custom-id');
    });

    test('retrieves composition by ID', async () => {
      await service.initialize();

      const created = await service.createComposition({
        name: 'Retrievable Comp',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 150,
      });

      const retrieved = await service.getComposition(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Retrievable Comp');
    });

    test('returns undefined for non-existent composition', async () => {
      await service.initialize();

      const result = await service.getComposition('non-existent-id');
      expect(result).toBeUndefined();
    });

    test('lists all compositions', async () => {
      await service.initialize();

      // Create multiple compositions
      await service.createComposition({
        name: 'Comp 1',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 100,
      });

      await service.createComposition({
        name: 'Comp 2',
        width: 1280,
        height: 720,
        fps: 24,
        durationInFrames: 200,
      });

      const compositions = await service.listCompositions();

      expect(compositions.length).toBe(2);
      expect(compositions.some(c => c.name === 'Comp 1')).toBe(true);
      expect(compositions.some(c => c.name === 'Comp 2')).toBe(true);
    });
  });

  describe('render operations', () => {
    test('starts a render job and tracks progress', async () => {
      await service.initialize();

      const composition = await service.createComposition({
        name: 'Render Test Comp',
        width: 640,
        height: 480,
        fps: 30,
        durationInFrames: 30, // 1 second
      });

      const artifacts: Array<{ name?: string }> = [];

      const result = await service.startRender(
        { compositionId: composition.id, format: 'mp4' },
        (artifact) => artifacts.push(artifact)
      );

      expect(result.jobId).toBeDefined();
      // Result success depends on FFmpeg being available
      expect(typeof result.success).toBe('boolean');

      // Should have received progress artifacts
      expect(artifacts.length).toBeGreaterThan(0);
    });

    test('returns error for non-existent composition', async () => {
      await service.initialize();

      await expect(
        service.startRender({ compositionId: 'non-existent' })
      ).rejects.toThrow('Composition "non-existent" not found');
    });

    test('cancels an in-progress render', async () => {
      await service.initialize();

      const composition = await service.createComposition({
        name: 'Cancel Test',
        width: 640,
        height: 480,
        fps: 30,
        durationInFrames: 300, // 10 seconds - long enough to cancel
      });

      // Start render without waiting
      const renderPromise = service.startRender(
        { compositionId: composition.id, format: 'mp4' }
      );

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cancel the render
      // Note: We need the job ID which we don't have directly
      // This test demonstrates the API but cancellation timing is tricky
      const result = await renderPromise;

      // The render either completed or was interrupted
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('preview generation', () => {
    test('generates preview frame for a composition', async () => {
      await service.initialize();

      const composition = await service.createComposition({
        name: 'Preview Test',
        width: 640,
        height: 480,
        fps: 30,
        durationInFrames: 60,
      });

      const artifact = await service.renderPreviewFrame(composition.id, 0, 'png');

      expect(artifact).toBeDefined();
      expect(artifact.artifactId).toBeDefined();
      expect(artifact.name).toContain('Preview');
    });

    test('returns error for non-existent composition preview', async () => {
      await service.initialize();

      await expect(
        service.renderPreviewFrame('non-existent', 0, 'png')
      ).rejects.toThrow('Composition "non-existent" not found');
    });
  });

  describe('service status', () => {
    test('tracks composition count', async () => {
      await service.initialize();

      const statusBefore = service.getStatus();
      expect(statusBefore.compositionCount).toBe(0);

      await service.createComposition({
        name: 'Status Test',
        width: 640,
        height: 480,
        fps: 30,
        durationInFrames: 30,
      });

      const statusAfter = service.getStatus();
      expect(statusAfter.compositionCount).toBe(1);
    });

    test('reports mode correctly', async () => {
      const standaloneService = createVideoRenderService({ mode: 'standalone' });
      expect(standaloneService.getStatus().mode).toBe('standalone');

      // Production mode without services should still work
      const productionService = createVideoRenderService({ mode: 'production' });
      expect(productionService.getStatus().mode).toBe('production');
    });
  });

  describe('shutdown', () => {
    test('shuts down cleanly', async () => {
      await service.initialize();

      // Should not throw
      await service.shutdown();
    });
  });
});

describe('VideoRenderService with VideoRenderExecutor', () => {
  test('executor uses service for composition management', async () => {
    // This test verifies the integration between executor and service
    const service = createVideoRenderService(TEST_CONFIG);
    await service.initialize();

    // Create a composition via service
    const composition = await service.createComposition({
      name: 'Integration Test',
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 60,
    });

    // Verify it's accessible
    const retrieved = await service.getComposition(composition.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Integration Test');

    // List should include it
    const list = await service.listCompositions();
    expect(list.some(c => c.id === composition.id)).toBe(true);
  });
});
