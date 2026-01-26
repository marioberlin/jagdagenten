/**
 * Intent Router Tests
 */

import { describe, test, expect } from 'bun:test';
import {
  detectIntent,
  routeByIntent,
  parseNaturalLanguage,
  getExamples,
} from '../intent/router.js';

describe('detectIntent', () => {
  describe('render intent', () => {
    test('detects video rendering requests', () => {
      const cases = [
        'render a video',
        'create video',
        'generate a video',
        'export to mp4',
        'render composition my-video',
      ];

      for (const input of cases) {
        const result = detectIntent(input);
        expect(result.intent).toBe('render');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    test('extracts parameters from render requests', () => {
      const result = detectIntent('Render composition "my-video" to mp4 at 1080p');
      expect(result.params.compositionId).toBe('my-video');
      expect(result.params.outputFormat).toBe('mp4');
      expect(result.params.resolution).toEqual({ height: 1080, width: 1920 });
    });

    test('extracts codec', () => {
      const result = detectIntent('render video with h265 codec');
      expect(result.params.codec).toBe('h265');
    });

    test('extracts fps', () => {
      const result = detectIntent('create a 60fps video');
      expect(result.params.fps).toBe(60);
    });
  });

  describe('render-still intent', () => {
    test('detects still rendering requests', () => {
      const cases = [
        'render a still',
        'capture frame 30',
        'create thumbnail',
        'export frame as png',
        'get a screenshot',
      ];

      for (const input of cases) {
        const result = detectIntent(input);
        expect(result.intent).toBe('render-still');
      }
    });

    test('extracts frame number', () => {
      const result = detectIntent('capture frame 45');
      expect(result.params.frame).toBe(45);
    });

    test('extracts image format', () => {
      const result = detectIntent('export frame as jpeg');
      expect(result.params.imageFormat).toBe('jpeg');
    });
  });

  describe('extract-frames intent', () => {
    test('detects frame extraction requests', () => {
      const cases = [
        'extract frames',
        'get frames from video',
        'split into frames',
        'convert to frames',
      ];

      for (const input of cases) {
        const result = detectIntent(input);
        expect(result.intent).toBe('extract-frames');
      }
    });

    test('extracts fps', () => {
      const result = detectIntent('extract frames at 1 fps');
      expect(result.params.fps).toBe(1);
    });

    test('extracts frame range', () => {
      const result = detectIntent('get frames 0 to 60');
      expect(result.params.startFrame).toBe(0);
      expect(result.params.endFrame).toBe(60);
    });
  });

  describe('media-info intent', () => {
    test('detects media info requests', () => {
      const cases = [
        'get video info',
        'what is the duration of this video',
        'show video metadata',
        'how long is this video',
      ];

      for (const input of cases) {
        const result = detectIntent(input);
        expect(result.intent).toBe('media-info');
      }
    });
  });

  describe('composition-register intent', () => {
    test('detects composition registration', () => {
      const cases = [
        'register a composition',
        'create composition',
        'add new composition',
        'define composition',
      ];

      for (const input of cases) {
        const result = detectIntent(input);
        expect(result.intent).toBe('composition-register');
      }
    });

    test('extracts composition parameters', () => {
      const result = detectIntent('create composition named intro 1920x1080 at 30fps for 10 seconds');
      expect(result.params.name).toBe('intro');
      expect(result.params.width).toBe(1920);
      expect(result.params.height).toBe(1080);
      expect(result.params.fps).toBe(30);
      expect(result.params.durationInFrames).toBe(300); // 10 * 30
    });
  });

  describe('unknown intent', () => {
    test('returns unknown for unrecognized requests', () => {
      const result = detectIntent('hello world');
      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
  });
});

describe('routeByIntent', () => {
  test('maps intents to methods', () => {
    expect(routeByIntent('render')).toBe('render');
    expect(routeByIntent('render-still')).toBe('render.still');
    expect(routeByIntent('extract-frames')).toBe('render.extractFrames');
    expect(routeByIntent('media-info')).toBe('media.info');
    expect(routeByIntent('composition-register')).toBe('composition.register');
    expect(routeByIntent('unknown')).toBe('help');
  });
});

describe('parseNaturalLanguage', () => {
  test('parses valid request', () => {
    const result = parseNaturalLanguage('render composition my-video to mp4');
    expect(result.method).toBe('render');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.params.compositionId).toBe('my-video');
  });

  test('returns help with suggestions for unknown', () => {
    const result = parseNaturalLanguage('asdfghjkl');
    expect(result.method).toBe('help');
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });
});

describe('getExamples', () => {
  test('returns examples for render', () => {
    const examples = getExamples('render');
    expect(examples.length).toBeGreaterThan(0);
    expect(examples[0]).toContain('Render');
  });

  test('returns empty for unknown', () => {
    const examples = getExamples('unknown');
    expect(examples).toEqual([]);
  });
});
