/**
 * Timeline Engine
 *
 * Manages temporal coordination for video compositions.
 * Handles frame/time conversion, event scheduling, and track management.
 */

import type { TimelineEvent, TimelineTrack, TimelineEventType } from '../types.js';

export interface SequenceTiming {
  startFrame: number;
  endFrame: number;
  duration: number;
}

export interface SeriesItemTiming {
  durationInFrames: number;
  offset?: number;
}

export interface TransitionTiming {
  sourceId: string;
  targetId: string;
  startFrame: number;
  endFrame: number;
  overlap: number;
}

/**
 * Timeline Engine for managing video composition timing.
 */
export class TimelineEngine {
  private tracks: TimelineTrack[] = [];
  private fps: number;
  private totalFrames: number;
  private eventIndex: Map<string, TimelineEvent> = new Map();

  constructor(fps: number, durationInFrames: number) {
    if (fps <= 0) throw new Error('FPS must be positive');
    if (durationInFrames <= 0) throw new Error('Duration must be positive');

    this.fps = fps;
    this.totalFrames = durationInFrames;
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  getFps(): number {
    return this.fps;
  }

  getTotalFrames(): number {
    return this.totalFrames;
  }

  getDuration(): number {
    return this.totalFrames / this.fps;
  }

  getTracks(): TimelineTrack[] {
    return [...this.tracks];
  }

  getTrack(id: string): TimelineTrack | undefined {
    return this.tracks.find((t) => t.id === id);
  }

  getEvent(id: string): TimelineEvent | undefined {
    return this.eventIndex.get(id);
  }

  // ==========================================================================
  // Time/Frame Conversion
  // ==========================================================================

  /**
   * Convert frame number to timestamp in seconds.
   */
  frameToTime(frame: number): number {
    return frame / this.fps;
  }

  /**
   * Convert timestamp in seconds to frame number.
   */
  timeToFrame(time: number): number {
    return Math.floor(time * this.fps);
  }

  /**
   * Convert timestamp string (HH:MM:SS.mmm or SS.mmm) to frame number.
   */
  parseTimestamp(timestamp: string): number {
    const parts = timestamp.split(':');
    let seconds: number;

    if (parts.length === 3) {
      // HH:MM:SS.mmm
      const [h, m, s] = parts;
      seconds = parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
    } else if (parts.length === 2) {
      // MM:SS.mmm
      const [m, s] = parts;
      seconds = parseInt(m) * 60 + parseFloat(s);
    } else {
      // SS.mmm
      seconds = parseFloat(timestamp);
    }

    return this.timeToFrame(seconds);
  }

  /**
   * Format frame number as timestamp string (HH:MM:SS.mmm).
   */
  formatTimestamp(frame: number, includeMillis: boolean = true): string {
    const totalSeconds = frame / this.fps;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = includeMillis ? seconds.toFixed(3).padStart(6, '0') : String(Math.floor(seconds)).padStart(2, '0');

    return hours > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }

  // ==========================================================================
  // Track Management
  // ==========================================================================

  /**
   * Add a new track.
   */
  addTrack(id: string, name?: string): TimelineTrack {
    if (this.tracks.some((t) => t.id === id)) {
      throw new Error(`Track with id "${id}" already exists`);
    }

    const track: TimelineTrack = {
      id,
      name: name || id,
      events: [],
    };
    this.tracks.push(track);
    return track;
  }

  /**
   * Remove a track and all its events.
   */
  removeTrack(id: string): boolean {
    const index = this.tracks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    // Remove events from index
    const track = this.tracks[index];
    for (const event of track.events) {
      this.eventIndex.delete(event.id);
    }

    this.tracks.splice(index, 1);
    return true;
  }

  // ==========================================================================
  // Event Management
  // ==========================================================================

  /**
   * Add an event to a track.
   */
  addEvent(
    trackId: string,
    event: Omit<TimelineEvent, 'layer'>
  ): TimelineEvent {
    let track = this.getTrack(trackId);
    if (!track) {
      track = this.addTrack(trackId);
    }

    if (this.eventIndex.has(event.id)) {
      throw new Error(`Event with id "${event.id}" already exists`);
    }

    const fullEvent: TimelineEvent = {
      ...event,
      layer: this.tracks.indexOf(track),
    };

    track.events.push(fullEvent);
    this.eventIndex.set(event.id, fullEvent);

    // Sort events by start frame
    track.events.sort((a, b) => a.startFrame - b.startFrame);

    return fullEvent;
  }

  /**
   * Remove an event.
   */
  removeEvent(id: string): boolean {
    const event = this.eventIndex.get(id);
    if (!event) return false;

    const track = this.tracks[event.layer];
    if (track) {
      const index = track.events.findIndex((e) => e.id === id);
      if (index !== -1) {
        track.events.splice(index, 1);
      }
    }

    this.eventIndex.delete(id);
    return true;
  }

  /**
   * Get all events active at a specific frame.
   */
  getActiveEvents(frame: number): TimelineEvent[] {
    return this.tracks.flatMap((track) =>
      track.events.filter((e) => frame >= e.startFrame && frame < e.endFrame)
    );
  }

  /**
   * Get events of a specific type active at a frame.
   */
  getActiveEventsByType(frame: number, type: TimelineEventType): TimelineEvent[] {
    return this.getActiveEvents(frame).filter((e) => e.type === type);
  }

  /**
   * Get all events in a frame range.
   */
  getEventsInRange(startFrame: number, endFrame: number): TimelineEvent[] {
    return this.tracks.flatMap((track) =>
      track.events.filter(
        (e) => e.endFrame > startFrame && e.startFrame < endFrame
      )
    );
  }

  // ==========================================================================
  // Sequence/Series Calculation
  // ==========================================================================

  /**
   * Calculate Remotion-style Sequence timing.
   * A Sequence starts at a specific frame and optionally has a duration.
   */
  calculateSequenceTiming(
    from: number,
    durationInFrames?: number
  ): SequenceTiming {
    const startFrame = Math.max(0, from);
    const endFrame = durationInFrames
      ? startFrame + durationInFrames
      : this.totalFrames;

    return {
      startFrame,
      endFrame: Math.min(endFrame, this.totalFrames),
      duration: (endFrame - startFrame) / this.fps,
    };
  }

  /**
   * Calculate Remotion-style Series timing.
   * Items in a Series are positioned sequentially with optional offsets.
   */
  calculateSeriesTiming(
    items: SeriesItemTiming[]
  ): SequenceTiming[] {
    const result: SequenceTiming[] = [];
    let currentFrame = 0;

    for (const item of items) {
      const startFrame = currentFrame + (item.offset ?? 0);
      const endFrame = startFrame + item.durationInFrames;

      result.push({
        startFrame,
        endFrame,
        duration: item.durationInFrames / this.fps,
      });

      // Next item starts after this one (plus any offset already applied)
      currentFrame = endFrame;
    }

    return result;
  }

  /**
   * Calculate transition timing with overlap.
   * Used for TransitionSeries where items overlap during transitions.
   */
  calculateTransitionTiming(
    items: Array<{ durationInFrames: number }>,
    transitionDuration: number
  ): TransitionTiming[] {
    const transitions: TransitionTiming[] = [];

    for (let i = 0; i < items.length - 1; i++) {
      const sourceEnd = items
        .slice(0, i + 1)
        .reduce((sum, item) => sum + item.durationInFrames, 0);

      const transitionStart = sourceEnd - transitionDuration;
      const transitionEnd = sourceEnd;

      transitions.push({
        sourceId: `item-${i}`,
        targetId: `item-${i + 1}`,
        startFrame: transitionStart,
        endFrame: transitionEnd,
        overlap: transitionDuration,
      });
    }

    return transitions;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get the local frame within a sequence.
   * Useful for components to know their relative time.
   */
  getLocalFrame(frame: number, sequenceStart: number): number {
    return Math.max(0, frame - sequenceStart);
  }

  /**
   * Check if a frame is within a sequence.
   */
  isFrameInSequence(
    frame: number,
    sequenceStart: number,
    sequenceDuration?: number
  ): boolean {
    if (frame < sequenceStart) return false;
    if (sequenceDuration && frame >= sequenceStart + sequenceDuration) return false;
    return true;
  }

  /**
   * Get the progress (0-1) through a sequence at a given frame.
   */
  getSequenceProgress(
    frame: number,
    sequenceStart: number,
    sequenceDuration: number
  ): number {
    const localFrame = frame - sequenceStart;
    if (localFrame < 0) return 0;
    if (localFrame >= sequenceDuration) return 1;
    return localFrame / sequenceDuration;
  }

  /**
   * Validate timeline consistency.
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for overlapping events on same track
    for (const track of this.tracks) {
      for (let i = 0; i < track.events.length - 1; i++) {
        const current = track.events[i];
        const next = track.events[i + 1];

        if (current.endFrame > next.startFrame && current.type === next.type) {
          errors.push(
            `Overlapping events on track "${track.id}": ` +
              `"${current.id}" (${current.startFrame}-${current.endFrame}) and ` +
              `"${next.id}" (${next.startFrame}-${next.endFrame})`
          );
        }
      }
    }

    // Check for events exceeding total duration
    for (const track of this.tracks) {
      for (const event of track.events) {
        if (event.endFrame > this.totalFrames) {
          errors.push(
            `Event "${event.id}" exceeds total duration: ` +
              `ends at frame ${event.endFrame}, total is ${this.totalFrames}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a snapshot of the timeline for debugging.
   */
  toSnapshot(): object {
    return {
      fps: this.fps,
      totalFrames: this.totalFrames,
      duration: this.getDuration(),
      tracks: this.tracks.map((t) => ({
        id: t.id,
        name: t.name,
        eventCount: t.events.length,
        events: t.events.map((e) => ({
          id: e.id,
          type: e.type,
          startFrame: e.startFrame,
          endFrame: e.endFrame,
          startTime: this.formatTimestamp(e.startFrame),
          endTime: this.formatTimestamp(e.endFrame),
        })),
      })),
    };
  }
}

/**
 * Create a new TimelineEngine from composition parameters.
 */
export function createTimeline(fps: number, durationInFrames: number): TimelineEngine {
  return new TimelineEngine(fps, durationInFrames);
}
