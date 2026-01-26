/**
 * Timeline Engine Tests
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { TimelineEngine, createTimeline } from '../timeline/engine.js';

describe('TimelineEngine', () => {
  let engine: TimelineEngine;

  beforeEach(() => {
    engine = new TimelineEngine(30, 300); // 30fps, 10 seconds
  });

  describe('construction', () => {
    test('initializes with correct values', () => {
      expect(engine.getFps()).toBe(30);
      expect(engine.getTotalFrames()).toBe(300);
      expect(engine.getDuration()).toBe(10);
    });

    test('throws on invalid fps', () => {
      expect(() => new TimelineEngine(0, 100)).toThrow();
      expect(() => new TimelineEngine(-1, 100)).toThrow();
    });

    test('throws on invalid duration', () => {
      expect(() => new TimelineEngine(30, 0)).toThrow();
      expect(() => new TimelineEngine(30, -1)).toThrow();
    });
  });

  describe('frame/time conversion', () => {
    test('frameToTime', () => {
      expect(engine.frameToTime(0)).toBe(0);
      expect(engine.frameToTime(30)).toBe(1);
      expect(engine.frameToTime(150)).toBe(5);
    });

    test('timeToFrame', () => {
      expect(engine.timeToFrame(0)).toBe(0);
      expect(engine.timeToFrame(1)).toBe(30);
      expect(engine.timeToFrame(5)).toBe(150);
      expect(engine.timeToFrame(1.5)).toBe(45);
    });

    test('parseTimestamp', () => {
      expect(engine.parseTimestamp('0')).toBe(0);
      expect(engine.parseTimestamp('1')).toBe(30);
      expect(engine.parseTimestamp('0:01')).toBe(30);
      expect(engine.parseTimestamp('1:00')).toBe(1800);
      expect(engine.parseTimestamp('0:00:01')).toBe(30);
      expect(engine.parseTimestamp('1:00:00')).toBe(108000);
    });

    test('formatTimestamp', () => {
      expect(engine.formatTimestamp(0)).toMatch(/00:00\.000/);
      expect(engine.formatTimestamp(30)).toMatch(/00:01\.000/);
      expect(engine.formatTimestamp(1800)).toMatch(/01:00\.000/);
    });
  });

  describe('track management', () => {
    test('addTrack creates new track', () => {
      const track = engine.addTrack('video', 'Video Track');
      expect(track.id).toBe('video');
      expect(track.name).toBe('Video Track');
      expect(track.events).toEqual([]);
    });

    test('addTrack throws on duplicate', () => {
      engine.addTrack('video');
      expect(() => engine.addTrack('video')).toThrow();
    });

    test('removeTrack removes track', () => {
      engine.addTrack('video');
      expect(engine.removeTrack('video')).toBe(true);
      expect(engine.getTrack('video')).toBeUndefined();
    });

    test('removeTrack returns false for non-existent', () => {
      expect(engine.removeTrack('nonexistent')).toBe(false);
    });
  });

  describe('event management', () => {
    test('addEvent adds to track', () => {
      const event = engine.addEvent('video', {
        id: 'clip-1',
        type: 'video',
        startFrame: 0,
        endFrame: 60,
        data: { src: 'video.mp4' },
      });

      expect(event.id).toBe('clip-1');
      expect(event.layer).toBe(0);

      const track = engine.getTrack('video');
      expect(track?.events).toHaveLength(1);
    });

    test('addEvent creates track if not exists', () => {
      engine.addEvent('new-track', {
        id: 'event-1',
        type: 'video',
        startFrame: 0,
        endFrame: 30,
        data: {},
      });

      expect(engine.getTrack('new-track')).toBeDefined();
    });

    test('addEvent throws on duplicate id', () => {
      engine.addEvent('video', {
        id: 'event-1',
        type: 'video',
        startFrame: 0,
        endFrame: 30,
        data: {},
      });

      expect(() =>
        engine.addEvent('video', {
          id: 'event-1',
          type: 'video',
          startFrame: 30,
          endFrame: 60,
          data: {},
        })
      ).toThrow();
    });

    test('removeEvent removes event', () => {
      engine.addEvent('video', {
        id: 'event-1',
        type: 'video',
        startFrame: 0,
        endFrame: 30,
        data: {},
      });

      expect(engine.removeEvent('event-1')).toBe(true);
      expect(engine.getEvent('event-1')).toBeUndefined();
    });
  });

  describe('getActiveEvents', () => {
    beforeEach(() => {
      engine.addEvent('video', {
        id: 'clip-1',
        type: 'video',
        startFrame: 0,
        endFrame: 60,
        data: {},
      });
      engine.addEvent('video', {
        id: 'clip-2',
        type: 'video',
        startFrame: 60,
        endFrame: 120,
        data: {},
      });
      engine.addEvent('audio', {
        id: 'audio-1',
        type: 'audio',
        startFrame: 30,
        endFrame: 90,
        data: {},
      });
    });

    test('returns events at frame', () => {
      const at0 = engine.getActiveEvents(0);
      expect(at0).toHaveLength(1);
      expect(at0[0].id).toBe('clip-1');

      const at30 = engine.getActiveEvents(30);
      expect(at30).toHaveLength(2);

      const at60 = engine.getActiveEvents(60);
      expect(at60).toHaveLength(2); // clip-2 and audio-1
    });

    test('returns empty at end', () => {
      const at300 = engine.getActiveEvents(300);
      expect(at300).toHaveLength(0);
    });
  });

  describe('sequence timing', () => {
    test('calculateSequenceTiming', () => {
      const timing = engine.calculateSequenceTiming(30, 60);
      expect(timing.startFrame).toBe(30);
      expect(timing.endFrame).toBe(90);
      expect(timing.duration).toBe(2); // 60 frames at 30fps
    });

    test('calculateSequenceTiming clamps to total', () => {
      const timing = engine.calculateSequenceTiming(280, 60);
      expect(timing.endFrame).toBe(300); // Clamped
    });
  });

  describe('series timing', () => {
    test('calculateSeriesTiming', () => {
      const timings = engine.calculateSeriesTiming([
        { durationInFrames: 60 },
        { durationInFrames: 60 },
        { durationInFrames: 60 },
      ]);

      expect(timings).toHaveLength(3);
      expect(timings[0]).toEqual({ startFrame: 0, endFrame: 60, duration: 2 });
      expect(timings[1]).toEqual({ startFrame: 60, endFrame: 120, duration: 2 });
      expect(timings[2]).toEqual({ startFrame: 120, endFrame: 180, duration: 2 });
    });

    test('calculateSeriesTiming with offsets', () => {
      const timings = engine.calculateSeriesTiming([
        { durationInFrames: 60 },
        { durationInFrames: 60, offset: -15 }, // Overlap
        { durationInFrames: 60, offset: 15 }, // Gap
      ]);

      expect(timings[0]).toEqual({ startFrame: 0, endFrame: 60, duration: 2 });
      expect(timings[1]).toEqual({ startFrame: 45, endFrame: 105, duration: 2 }); // 60-15=45
      expect(timings[2]).toEqual({ startFrame: 120, endFrame: 180, duration: 2 }); // 105+15=120
    });
  });

  describe('utility methods', () => {
    test('getLocalFrame', () => {
      expect(engine.getLocalFrame(50, 30)).toBe(20);
      expect(engine.getLocalFrame(20, 30)).toBe(0); // Before sequence
    });

    test('isFrameInSequence', () => {
      expect(engine.isFrameInSequence(50, 30, 60)).toBe(true);
      expect(engine.isFrameInSequence(20, 30, 60)).toBe(false);
      expect(engine.isFrameInSequence(100, 30, 60)).toBe(false);
    });

    test('getSequenceProgress', () => {
      expect(engine.getSequenceProgress(30, 30, 60)).toBe(0);
      expect(engine.getSequenceProgress(60, 30, 60)).toBe(0.5);
      expect(engine.getSequenceProgress(90, 30, 60)).toBe(1);
    });
  });

  describe('validation', () => {
    test('validate returns valid for empty timeline', () => {
      const result = engine.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validate detects events exceeding duration', () => {
      engine.addEvent('video', {
        id: 'clip-1',
        type: 'video',
        startFrame: 250,
        endFrame: 350, // Exceeds 300
        data: {},
      });

      const result = engine.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('exceeds total duration');
    });
  });
});

describe('createTimeline', () => {
  test('creates timeline with params', () => {
    const timeline = createTimeline(60, 600);
    expect(timeline.getFps()).toBe(60);
    expect(timeline.getTotalFrames()).toBe(600);
  });
});
