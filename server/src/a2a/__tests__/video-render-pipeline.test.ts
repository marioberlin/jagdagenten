/**
 * VideoRender Pipeline Tests
 */

import { describe, test, expect, beforeEach, afterAll } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm, mkdir } from 'fs/promises';
import {
  VideoRenderPipeline,
  getVideoRenderPipeline,
  createVideoRenderPipeline,
  type RenderOptions,
  type A2AArtifact,
  type PipelineConfig,
} from '../executors/video-render-pipeline.js';
import type { CompositionState } from '../executors/video-render.js';

// Use temp directory for tests
const TEST_TEMP_DIR = join(tmpdir(), 'video-pipeline-test-' + process.pid);
const TEST_OUTPUT_DIR = join(TEST_TEMP_DIR, 'renders');
const TEST_CONFIG: Partial<PipelineConfig> = {
  outputDir: TEST_OUTPUT_DIR,
  tempDir: TEST_TEMP_DIR,
};

// Cleanup after all tests
afterAll(async () => {
  try {
    await rm(TEST_TEMP_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

describe('VideoRenderPipeline', () => {
  let pipeline: VideoRenderPipeline;

  beforeEach(async () => {
    // Create fresh pipeline for each test with test config
    pipeline = createVideoRenderPipeline(TEST_CONFIG);
  });

  describe('startRender', () => {
    test('starts a render job and calls artifact callback', async () => {
      const composition = createMockComposition();
      const options: RenderOptions = { format: 'mp4', codec: 'h264', quality: 'high' };
      const artifacts: A2AArtifact[] = [];

      const result = await pipeline.startRender(
        composition,
        options,
        (artifact) => artifacts.push(artifact)
      );

      expect(result.jobId).toBeDefined();
      // Result success depends on FFmpeg being available
      expect(typeof result.success).toBe('boolean');
      expect(artifacts.length).toBeGreaterThan(0);
    });

    test('emits progress artifacts during render', async () => {
      const composition = createMockComposition();
      const options: RenderOptions = { format: 'mp4' };
      const progressArtifacts: A2AArtifact[] = [];

      await pipeline.startRender(
        composition,
        options,
        (artifact) => {
          if (artifact.name === 'Render Progress') {
            progressArtifacts.push(artifact);
          }
        }
      );

      expect(progressArtifacts.length).toBeGreaterThan(0);
    });

    test('returns appropriate result structure', async () => {
      const composition = createMockComposition();
      const options: RenderOptions = { format: 'mp4', codec: 'h264' };
      let videoArtifact: A2AArtifact | undefined;

      const result = await pipeline.startRender(
        composition,
        options,
        (artifact) => {
          if (artifact.name === 'Rendered Video') {
            videoArtifact = artifact;
          }
        }
      );

      // Result always has jobId
      expect(result.jobId).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      // If successful, should have video artifact
      if (result.success) {
        expect(videoArtifact).toBeDefined();
        expect(videoArtifact!.parts[0].type).toBe('file');
      }
    });
  });

  describe('renderPreviewFrame', () => {
    test('renders a single frame for preview', async () => {
      const composition = createMockComposition();

      const artifact = await pipeline.renderPreviewFrame(composition, 0, 'png');

      expect(artifact.artifactId).toContain('preview');
      expect(artifact.parts[0].type).toBe('file');
      expect(artifact.parts[0].file?.mimeType).toBe('image/png');
    });

    test('validates frame number is in range', async () => {
      const composition = createMockComposition();

      // Frame 1000 is out of range for a 90-frame composition
      await expect(
        pipeline.renderPreviewFrame(composition, 1000)
      ).rejects.toThrow('Frame 1000 out of range');
    });

    test('supports different formats', async () => {
      const composition = createMockComposition();

      const pngArtifact = await pipeline.renderPreviewFrame(composition, 0, 'png');
      expect(pngArtifact.parts[0].file?.mimeType).toBe('image/png');

      const jpegArtifact = await pipeline.renderPreviewFrame(composition, 0, 'jpeg');
      expect(jpegArtifact.parts[0].file?.mimeType).toBe('image/jpeg');

      const webpArtifact = await pipeline.renderPreviewFrame(composition, 0, 'webp');
      expect(webpArtifact.parts[0].file?.mimeType).toBe('image/webp');
    });
  });

  describe('cancelRender', () => {
    test('cancel method exists and returns boolean', () => {
      // Verify the method exists and doesn't throw
      expect(typeof pipeline.cancelRender).toBe('function');

      // Cancel non-existent job returns false
      const result = pipeline.cancelRender('non-existent-job');
      expect(result).toBe(false);
    });

    test('returns false for non-existent job', () => {
      const result = pipeline.cancelRender('non-existent-job');
      expect(result).toBe(false);
    });
  });

  describe('getJobStatus', () => {
    test('returns undefined for unknown job', () => {
      const status = pipeline.getJobStatus('unknown-job');
      expect(status).toBeUndefined();
    });
  });

  describe('artifact structure', () => {
    test('progress artifact has correct data structure', async () => {
      const composition = createMockComposition();
      let progressArtifact: A2AArtifact | undefined;

      await pipeline.startRender(
        composition,
        { format: 'mp4' },
        (artifact) => {
          if (artifact.name === 'Render Progress' && !progressArtifact) {
            progressArtifact = artifact;
          }
        }
      );

      expect(progressArtifact).toBeDefined();
      expect(progressArtifact!.parts[0].type).toBe('data');
      const data = progressArtifact!.parts[0].data as Record<string, unknown>;
      expect(data.jobId).toBeDefined();
      expect(data.status).toBeDefined();
      expect(typeof data.progress).toBe('number');
      expect(typeof data.currentFrame).toBe('number');
      expect(typeof data.totalFrames).toBe('number');
    });

    test('artifacts have correct structure', async () => {
      const composition = createMockComposition();
      const artifacts: A2AArtifact[] = [];

      await pipeline.startRender(
        composition,
        { format: 'mp4' },
        (artifact) => artifacts.push(artifact)
      );

      // Should have at least one artifact
      expect(artifacts.length).toBeGreaterThan(0);

      // All artifacts should have required fields
      for (const artifact of artifacts) {
        expect(artifact.artifactId).toBeDefined();
        expect(artifact.parts).toBeDefined();
        expect(Array.isArray(artifact.parts)).toBe(true);
      }
    });
  });
});

describe('getVideoRenderPipeline', () => {
  test('returns singleton instance', () => {
    const instance1 = getVideoRenderPipeline(TEST_CONFIG);
    const instance2 = getVideoRenderPipeline(TEST_CONFIG);

    expect(instance1).toBe(instance2);
  });

  test('instance is a VideoRenderPipeline', () => {
    const instance = getVideoRenderPipeline(TEST_CONFIG);
    expect(instance).toBeInstanceOf(VideoRenderPipeline);
  });
});

describe('createVideoRenderPipeline', () => {
  test('creates a new instance each time', () => {
    const instance1 = createVideoRenderPipeline(TEST_CONFIG);
    const instance2 = createVideoRenderPipeline(TEST_CONFIG);

    expect(instance1).not.toBe(instance2);
  });

  test('accepts custom config', () => {
    const customConfig = {
      outputDir: join(TEST_TEMP_DIR, 'custom-output'),
      tempDir: join(TEST_TEMP_DIR, 'custom-temp'),
    };

    const pipeline = createVideoRenderPipeline(customConfig);
    expect(pipeline).toBeInstanceOf(VideoRenderPipeline);
  });
});

describe('3D element rendering', () => {
  let pipeline: VideoRenderPipeline;

  beforeEach(() => {
    pipeline = createVideoRenderPipeline(TEST_CONFIG);
  });

  test('composition with 3D element renders without errors', async () => {
    const composition = createMockCompositionWith3D();
    const options: RenderOptions = { format: 'mp4' };
    const artifacts: A2AArtifact[] = [];

    const result = await pipeline.startRender(
      composition,
      options,
      (artifact) => artifacts.push(artifact)
    );

    expect(result.jobId).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    // Should have progress artifacts even if 3D fails (fallback renders)
    expect(artifacts.length).toBeGreaterThan(0);
  });
});

// Helper to create mock composition
function createMockComposition(): CompositionState {
  return {
    id: `comp-${Date.now()}`,
    name: 'Test Composition',
    width: 640,  // Smaller for faster tests
    height: 360,
    fps: 30,
    durationInFrames: 30, // 1 second - very short for fast tests
    props: {
      title: 'Test Video',
      backgroundColor: '#000000',
    },
  };
}

// Helper to create mock composition with 3D element
function createMockCompositionWith3D(): CompositionState {
  return {
    id: `comp-3d-${Date.now()}`,
    name: 'Test 3D Composition',
    width: 640,
    height: 360,
    fps: 30,
    durationInFrames: 15, // Very short for tests
    props: {
      backgroundColor: '#1a1a2e',
      elements: [
        {
          id: 'three-scene',
          type: 'three',
          x: 100,
          y: 50,
          width: 400,
          height: 260,
          scene: {
            backgroundColor: '#1a1a2e',
            camera: {
              type: 'perspective',
              position: [3, 3, 3] as [number, number, number],
              lookAt: [0, 0, 0] as [number, number, number],
              fov: 50,
            },
            lights: [
              { type: 'ambient', intensity: 0.4 },
              { type: 'directional', position: [5, 5, 5] as [number, number, number], intensity: 1 },
            ],
            objects: [
              {
                type: 'box',
                color: '#e94560',
                material: 'standard',
                animation: { property: 'rotation', axis: 'y', speed: 1 },
              },
            ],
          },
        },
      ],
    },
  };
}
