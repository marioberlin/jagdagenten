/**
 * VideoRender Executor Tests
 */

import { describe, test, expect, beforeEach, mock, afterAll } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm } from 'fs/promises';
import { v1 } from '@jagdagenten/a2a-sdk';
import { VideoRenderExecutor, getVideoRenderAgentCard } from '../executors/video-render.js';
import type { VideoRenderServiceConfig } from '../executors/video-render-service.js';

// Test temp directory
const TEST_TEMP_DIR = join(tmpdir(), 'video-executor-test-' + process.pid);

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

// Mock the intent parser (now under a2a/video/)
mock.module('../video/intent/router.js', () => ({
  parseNaturalLanguage: (text: string) => ({
    method: text.toLowerCase().includes('render') ? 'render' : 'unknown',
    params: {
      compositionId: undefined,
      outputFormat: 'mp4',
      codec: 'h264',
      fps: 30,
      resolution: { width: 1920, height: 1080 },
    },
    confidence: 0.8,
  }),
}));

describe('VideoRenderExecutor', () => {
  let executor: VideoRenderExecutor;

  beforeEach(() => {
    executor = new VideoRenderExecutor(TEST_CONFIG);
  });

  describe('getVideoRenderAgentCard', () => {
    test('returns valid agent card', () => {
      const card = getVideoRenderAgentCard('http://localhost:3000');

      expect(card.name).toBe('Liquid Motion Renderer');
      expect(card.description).toContain('video rendering');
      expect(card.url).toBe('http://localhost:3000/a2a');
      expect(card.version).toBe('1.0.0');
      expect(card.protocolVersions).toContain('1.0');
    });

    test('includes render skill', () => {
      const card = getVideoRenderAgentCard('http://localhost:3000');

      const renderSkill = card.skills?.find((s) => s.id === 'render_video');
      expect(renderSkill).toBeDefined();
      expect(renderSkill?.name).toBe('Render Video');
      expect(renderSkill?.tags).toContain('render');
      expect(renderSkill?.tags).toContain('video');
    });

    test('includes preview skill', () => {
      const card = getVideoRenderAgentCard('http://localhost:3000');

      const previewSkill = card.skills?.find((s) => s.id === 'preview_frame');
      expect(previewSkill).toBeDefined();
      expect(previewSkill?.name).toBe('Preview Frame');
    });

    test('includes parse intent skill', () => {
      const card = getVideoRenderAgentCard('http://localhost:3000');

      const intentSkill = card.skills?.find((s) => s.id === 'parse_intent');
      expect(intentSkill).toBeDefined();
      expect(intentSkill?.name).toBe('Parse Intent');
    });

    test('includes apply effect skill', () => {
      const card = getVideoRenderAgentCard('http://localhost:3000');

      const effectSkill = card.skills?.find((s) => s.id === 'apply_effect');
      expect(effectSkill).toBeDefined();
      expect(effectSkill?.name).toBe('Apply Effect');
    });

    test('includes render status skill', () => {
      const card = getVideoRenderAgentCard('http://localhost:3000');

      const statusSkill = card.skills?.find((s) => s.id === 'render_status');
      expect(statusSkill).toBeDefined();
      expect(statusSkill?.name).toBe('Render Status');
    });
  });

  describe('execute', () => {
    test('handles render intent', async () => {
      const message = createMessage('Render a 10-second video with spinning logo');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
    });

    test('handles preview intent', async () => {
      // First create a composition
      const createMsg = createMessage('Create a 5-second composition at 1080p');
      await executor.execute(createMsg, createContext());

      // Then preview
      const message = createMessage('Preview frame 30');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
    });

    test('handles status intent', async () => {
      const message = createMessage('Check render status');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
      expect(result.message).toBeDefined();
    });

    test('handles cancel intent', async () => {
      const message = createMessage('Cancel the render');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
    });

    test('handles effect intent', async () => {
      const message = createMessage('Add fade effect to the video');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
      expect(result.message).toBeDefined();
    });

    test('handles composition creation', async () => {
      const message = createMessage('Create a new 10-second composition at 30fps 1080p');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
    });

    test('handles list compositions intent', async () => {
      const message = createMessage('List all compositions');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
    });

    test('handles help/unknown intent', async () => {
      const message = createMessage('What can you do?');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('composition management', () => {
    test('creates composition from natural language', async () => {
      const message = createMessage('Create a 5-second intro at 720p with 24fps');
      const context = createContext();

      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
    });

    test('extracts parameters from description', async () => {
      // Create composition
      const createMsg = createMessage('Create a 15-second composition called my-video at 4K 60fps');
      await executor.execute(createMsg, createContext());

      // List to verify
      const listMsg = createMessage('List compositions');
      const result = await executor.execute(listMsg, createContext());

      expect(result.message).toBeDefined();
    });
  });

  describe('render workflow', () => {
    test('complete render workflow', async () => {
      const context = createContext();

      // 1. Create composition
      const createMsg = createMessage('Create a 3-second composition');
      const createResult = await executor.execute(createMsg, context);
      expect(createResult.status).toBeDefined();

      // 2. Start render
      const renderMsg = createMessage('Render the video as mp4');
      const renderResult = await executor.execute(renderMsg, context);
      expect(renderResult.status).toBeDefined();
      expect(renderResult.artifacts).toBeDefined();

      // 3. Check status
      const statusMsg = createMessage('Check status');
      const statusResult = await executor.execute(statusMsg, context);
      expect(statusResult.status).toBeDefined();
    });
  });

  describe('data part handling', () => {
    test('handles JSON composition upload', async () => {
      const message = createDataMessage({
        id: 'uploaded-comp',
        name: 'Uploaded Composition',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 150,
      });

      const context = createContext();
      const result = await executor.execute(message, context);

      expect(result.status).toBeDefined();
    });
  });
});

describe('Agent Card Structure', () => {
  test('has correct URL structure', () => {
    const card = getVideoRenderAgentCard('http://localhost:3000');

    expect(card.url).toBe('http://localhost:3000/a2a');
    expect(card.version).toBe('1.0.0');
    expect(card.protocolVersions).toContain('1.0');
  });

  test('all skills have required fields', () => {
    const card = getVideoRenderAgentCard('http://localhost:3000');

    for (const skill of card.skills || []) {
      expect(skill.id).toBeDefined();
      expect(skill.name).toBeDefined();
      expect(skill.description).toBeDefined();
      expect(skill.tags).toBeDefined();
      expect(skill.tags?.length).toBeGreaterThan(0);
    }
  });

  test('skills have examples', () => {
    const card = getVideoRenderAgentCard('http://localhost:3000');

    for (const skill of card.skills || []) {
      expect(skill.examples).toBeDefined();
      expect(skill.examples!.length).toBeGreaterThan(0);
    }
  });
});

// Helper functions
function createMessage(text: string): v1.Message {
  return {
    messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role: 'user' as v1.Role,
    parts: [{ text }],
  };
}

function createDataMessage(data: Record<string, v1.JSONValue>): v1.Message {
  return {
    messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role: 'user' as v1.Role,
    parts: [{ data }],
  };
}

function createContext() {
  const contextId = `ctx-${Date.now()}`;
  return {
    contextId,
    taskId: `task-${Date.now()}`,
    sessionId: `session-${Date.now()}`,
    metadata: {
      contextId,
    },
  };
}
