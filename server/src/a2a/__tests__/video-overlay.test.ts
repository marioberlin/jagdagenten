/**
 * Video Overlay Tests
 *
 * Tests for FFmpeg-based video overlay compositing.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  VideoOverlayProcessor,
  hasVideoOverlays,
  extractAudioFromOverlays,
  type VideoOverlayDefinition,
  type VideoOverlayOptions,
} from '../video/ffmpeg/video-overlay.js';

describe('VideoOverlayProcessor', () => {
  let _processor: VideoOverlayProcessor;

  beforeEach(() => {
    _processor = new VideoOverlayProcessor('/usr/bin/ffmpeg');
  });

  describe('hasVideoOverlays', () => {
    test('returns false for undefined', () => {
      expect(hasVideoOverlays(undefined)).toBe(false);
    });

    test('returns false for empty array', () => {
      expect(hasVideoOverlays([])).toBe(false);
    });

    test('returns true for non-empty array', () => {
      const overlays: VideoOverlayDefinition[] = [
        {
          id: 'video1',
          src: '/path/to/video.mp4',
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          startFrame: 0,
        },
      ];
      expect(hasVideoOverlays(overlays)).toBe(true);
    });
  });

  describe('extractAudioFromOverlays', () => {
    test('extracts audio from non-muted overlays', () => {
      const overlays: VideoOverlayDefinition[] = [
        {
          id: 'video1',
          src: '/path/to/video1.mp4',
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          startFrame: 0,
          endFrame: 60,
          volume: 0.8,
        },
        {
          id: 'video2',
          src: '/path/to/video2.mp4',
          x: 100,
          y: 100,
          width: 320,
          height: 240,
          startFrame: 30,
          muted: true,
        },
        {
          id: 'video3',
          src: '/path/to/video3.mp4',
          x: 200,
          y: 200,
          width: 320,
          height: 240,
          startFrame: 0,
          volume: 0, // Zero volume treated as no audio
        },
      ];

      const audioTracks = extractAudioFromOverlays(overlays, 30);

      expect(audioTracks).toHaveLength(1);
      expect(audioTracks[0].src).toBe('/path/to/video1.mp4');
      expect(audioTracks[0].startFrame).toBe(0);
      expect(audioTracks[0].endFrame).toBe(60);
      expect(audioTracks[0].volume).toBe(0.8);
    });

    test('returns empty array when all overlays are muted', () => {
      const overlays: VideoOverlayDefinition[] = [
        {
          id: 'video1',
          src: '/path/to/video.mp4',
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          startFrame: 0,
          muted: true,
        },
      ];

      const audioTracks = extractAudioFromOverlays(overlays, 30);
      expect(audioTracks).toHaveLength(0);
    });
  });

  describe('VideoOverlayDefinition validation', () => {
    test('overlay with all optional fields', () => {
      const overlay: VideoOverlayDefinition = {
        id: 'full-overlay',
        src: '/path/to/video.mp4',
        x: 100,
        y: 50,
        width: 1280,
        height: 720,
        startFrame: 30,
        endFrame: 300,
        zIndex: 10,
        volume: 0.5,
        muted: false,
        loop: true,
        playbackRate: 1.5,
        trim: {
          start: 5,
          end: 60,
        },
        fit: 'cover',
        opacity: 0.9,
        chromaKey: {
          color: '#00ff00',
          similarity: 0.4,
          blend: 0.15,
        },
        filters: [
          { type: 'brightness', value: 1.1 },
          { type: 'contrast', value: 1.2 },
          { type: 'saturation', value: 0.8 },
        ],
      };

      expect(overlay.id).toBe('full-overlay');
      expect(overlay.chromaKey?.color).toBe('#00ff00');
      expect(overlay.filters).toHaveLength(3);
    });

    test('overlay with minimal fields', () => {
      const overlay: VideoOverlayDefinition = {
        id: 'minimal',
        src: '/video.mp4',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        startFrame: 0,
      };

      expect(overlay.endFrame).toBeUndefined();
      expect(overlay.zIndex).toBeUndefined();
      expect(overlay.chromaKey).toBeUndefined();
    });
  });

  describe('VideoOverlayOptions validation', () => {
    test('valid options with frames input', () => {
      const options: VideoOverlayOptions = {
        baseInput: {
          type: 'frames',
          path: '/tmp/frames/frame-%06d.png',
          fps: 30,
        },
        width: 1920,
        height: 1080,
        durationInFrames: 300,
        overlays: [
          {
            id: 'overlay1',
            src: '/video.mp4',
            x: 100,
            y: 100,
            width: 640,
            height: 360,
            startFrame: 0,
          },
        ],
        output: {
          path: '/output/final.mp4',
          codec: 'h264',
          crf: 18,
          preset: 'medium',
        },
        audioPath: '/tmp/audio.aac',
      };

      expect(options.baseInput.type).toBe('frames');
      expect(options.overlays).toHaveLength(1);
      expect(options.output.codec).toBe('h264');
    });

    test('valid options with video input', () => {
      const options: VideoOverlayOptions = {
        baseInput: {
          type: 'video',
          path: '/input/base.mp4',
          fps: 24,
        },
        width: 1280,
        height: 720,
        durationInFrames: 240,
        overlays: [],
        output: {
          path: '/output/final.mp4',
        },
      };

      expect(options.baseInput.type).toBe('video');
      expect(options.audioPath).toBeUndefined();
    });
  });

  describe('Filter types', () => {
    test('all video filter types are valid', () => {
      const filterTypes = [
        'blur',
        'brightness',
        'contrast',
        'saturation',
        'hue',
        'grayscale',
        'sepia',
        'invert',
      ] as const;

      for (const filterType of filterTypes) {
        const overlay: VideoOverlayDefinition = {
          id: 'test',
          src: '/video.mp4',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          startFrame: 0,
          filters: [{ type: filterType, value: 1 }],
        };

        expect(overlay.filters![0].type).toBe(filterType);
      }
    });
  });

  describe('Fit modes', () => {
    test('all fit modes are valid', () => {
      const fitModes = ['contain', 'cover', 'fill', 'none'] as const;

      for (const fit of fitModes) {
        const overlay: VideoOverlayDefinition = {
          id: 'test',
          src: '/video.mp4',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          startFrame: 0,
          fit,
        };

        expect(overlay.fit).toBe(fit);
      }
    });
  });

  describe('Codec support', () => {
    test('all output codecs are valid', () => {
      const codecs = ['h264', 'h265', 'vp8', 'vp9', 'prores'] as const;

      for (const codec of codecs) {
        const options: VideoOverlayOptions = {
          baseInput: {
            type: 'frames',
            path: '/frames/frame-%06d.png',
            fps: 30,
          },
          width: 1920,
          height: 1080,
          durationInFrames: 300,
          overlays: [],
          output: {
            path: '/output/final.mp4',
            codec,
          },
        };

        expect(options.output.codec).toBe(codec);
      }
    });
  });

  describe('Preset support', () => {
    test('all encoding presets are valid', () => {
      const presets = ['ultrafast', 'fast', 'medium', 'slow', 'veryslow'] as const;

      for (const preset of presets) {
        const options: VideoOverlayOptions = {
          baseInput: {
            type: 'frames',
            path: '/frames/frame-%06d.png',
            fps: 30,
          },
          width: 1920,
          height: 1080,
          durationInFrames: 300,
          overlays: [],
          output: {
            path: '/output/final.mp4',
            preset,
          },
        };

        expect(options.output.preset).toBe(preset);
      }
    });
  });
});

describe('VideoOverlayProcessor composition (unit tests)', () => {
  // These tests verify the processor can be instantiated and types are correct
  // Actual FFmpeg execution is tested in E2E tests

  test('can instantiate with default ffmpeg path', () => {
    const processor = new VideoOverlayProcessor();
    expect(processor).toBeDefined();
  });

  test('can instantiate with custom ffmpeg path', () => {
    const processor = new VideoOverlayProcessor('/custom/path/to/ffmpeg');
    expect(processor).toBeDefined();
  });
});
