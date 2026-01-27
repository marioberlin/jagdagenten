# A2S v1.0: Remotion-Compatible Video Rendering Server

## Executive Summary

This document outlines a comprehensive plan for building **A2S (Agent-to-Server) v1.0**, a Remotion-compatible video rendering backend that leverages FFmpeg for high-performance video processing. The system will integrate with LiquidCrypto's existing A2A protocol infrastructure, container runtime, and orchestration layer.

---

## Table of Contents

1. [Research Findings](#research-findings)
2. [Architecture Overview](#architecture-overview)
3. [Remotion Compatibility Layer](#remotion-compatibility-layer)
4. [FFmpeg Integration Strategy](#ffmpeg-integration-strategy)
5. [A2S Protocol Design](#a2s-protocol-design)
6. [Implementation Phases](#implementation-phases)
7. [Database Schema](#database-schema)
8. [API Specification](#api-specification)
9. [Skill Compatibility Matrix](#skill-compatibility-matrix)
10. [Risk Assessment](#risk-assessment)
11. [Lottie & Tailwind Implementation](#lottie--tailwind-implementation)
12. [Additional Infrastructure](#additional-infrastructure)
- [Appendix A: File Structure](#appendix-a-file-structure)
- [Appendix B: Configuration](#appendix-b-configuration)
- [Appendix C: Remotion Skill Mapping](#appendix-c-remotion-skill-mapping)
- [Appendix D: Verification & Testing Plan](#appendix-d-verification--testing-plan)
- [Appendix E: Implementation Checklist](#appendix-e-implementation-checklist)

---

## 1. Research Findings

### 1.1 Remotion Architecture Analysis

**Core Concepts:**
- **Video as a Function**: Videos are functions of images over time - each frame is a React component render
- **Frame-Based Control**: `useCurrentFrame()` provides current frame number; all animations must be frame-driven
- **Composition System**: `<Composition>` wraps React components with video metadata (width, height, fps, durationInFrames)
- **Sequencing**: `<Sequence>` and `<Series>` control element timing and ordering

**Rendering Pipeline:**
```
React Components → Frame Rendering → PNG Sequence → FFmpeg Encoding → Output Video
                      ↓
              Headless Chrome/Puppeteer
```

**Key APIs:**
| Package | Purpose |
|---------|---------|
| `@remotion/renderer` | Server-side video rendering (renderMedia, renderFrames) |
| `@remotion/player` | Client-side video playback |
| `@remotion/lambda` | AWS Lambda distributed rendering |
| `@remotion/cloudrun` | GCP Cloud Run container rendering |
| `@remotion/media` | Video/Audio components |
| `@remotion/transitions` | Scene transitions |

### 1.2 Remotion Skills Structure (30+ Rules)

The Remotion skill package contains 30+ specialized rule files:

**Media Handling:**
- `videos.md` - Video component, trimming, looping, playback rate
- `audio.md` - Audio component, volume control, pitch shifting
- `images.md` - Img component, staticFile(), remote images
- `gifs.md` - AnimatedImage/Gif components
- `fonts.md` - Google Fonts and local font loading

**Animation & Timing:**
- `animations.md` - useCurrentFrame()-driven animations (CSS/Tailwind forbidden)
- `timing.md` - interpolate(), spring(), easing functions
- `transitions.md` - TransitionSeries, fade/slide/wipe/flip effects
- `sequencing.md` - Sequence, Series, premounting, frame timing
- `text-animations.md` - Typewriter, word highlighting

**Content Creation:**
- `compositions.md` - Composition setup, defaultProps, dynamic metadata
- `calculate-metadata.md` - Dynamic composition configuration
- `charts.md` - Bar/pie charts with frame-based animation
- `display-captions.md` - Caption rendering
- `measuring-dom-nodes.md` - DOM measurement for responsive layouts
- `measuring-text.md` - Text dimension calculations

**Advanced Features:**
- `3d.md` - Three.js integration via @remotion/three
- `lottie.md` - Lottie animation embedding
- `maps.md` - Mapbox integration
- `transcribe-captions.md` - Whisper transcription options
- `extract-frames.md` - Frame extraction with Mediabunny
- `parameters.md` - Zod schema for parametrized videos

**Utilities:**
- `get-video-duration.md` / `get-audio-duration.md` - Duration detection
- `get-video-dimensions.md` - Dimension retrieval
- `import-srt-captions.md` - SRT import
- `trimming.md` - Video/audio trimming
- `can-decode.md` - Format capability detection
- `tailwind.md` - Tailwind CSS integration
- `assets.md` - Asset management

### 1.3 FFmpeg Integration Patterns

**Modern Node.js FFmpeg Options:**

| Library | Status | Features |
|---------|--------|----------|
| `fluent-ffmpeg` | ⚠️ Deprecated | Fluent API, widely used but unmaintained |
| `node-av` | ✅ Active | Native bindings, TypeScript, hardware acceleration |
| `@mmomtchev/ffmpeg` | ✅ Active | C API wrapper, stream support, low-level control |
| `ffmpeg.wasm` | ✅ Active | WebAssembly port, 2GB file limit |

**Recommended: `node-av`**
- Native Node.js bindings with TypeScript support
- Hardware acceleration (CUDA, VAAPI, Metal)
- High-level abstractions (Encoder, Decoder, Demuxer, Muxer)
- Pipeline API for chaining operations
- Automatic resource management via Disposable pattern
- Speech recognition via Whisper integration

**Alternative: `@mmomtchev/ffmpeg`**
- Direct C API access through avcpp
- Node.js Readable/Writable stream compatibility
- Multi-stream processing
- More granular control for complex workflows

### 1.4 LiquidCrypto Codebase Analysis

**Existing Infrastructure:**

| Component | Location | Relevance to A2S |
|-----------|----------|------------------|
| A2A Handler | `server/src/a2a/` | Protocol foundation, reuse types/patterns |
| Container Runtime | `server/src/container/` | Isolated rendering execution |
| Orchestrator | `server/src/orchestrator/` | Multi-agent coordination |
| LiquidMind | `server/src/resources/` | Resource/artifact persistence |
| Media Agents | `server/src/agents/media-*.ts` | Existing video generation patterns |
| NATS Messaging | `server/src/nats/` | Async job distribution |
| PostgreSQL | `server/sql/` | Persistence layer |
| Redis | Various | Caching, job queues |

**Existing Media Capabilities:**
- `media-videogen.ts`: Veo 3.1-based video generation with job queue
- `media-imagegen.ts`: Image generation with caching
- `media-common/`: Storage, destinations, prompts utilities

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         A2S v1.0 Server                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │ A2S Handler  │   │ Remotion     │   │ FFmpeg       │                 │
│  │ (JSON-RPC)   │   │ Compat Layer │   │ Pipeline     │                 │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                 │
│         │                  │                  │                          │
│         ▼                  ▼                  ▼                          │
│  ┌─────────────────────────────────────────────────────┐                │
│  │              Composition Engine                      │                │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │                │
│  │  │ Scene      │  │ Timeline   │  │ Asset      │    │                │
│  │  │ Renderer   │  │ Controller │  │ Manager    │    │                │
│  │  └────────────┘  └────────────┘  └────────────┘    │                │
│  └─────────────────────────────────────────────────────┘                │
│                              │                                           │
│  ┌───────────────────────────┴───────────────────────────┐              │
│  │                 Container Runtime                      │              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │              │
│  │  │ Warm Pool│  │ Executor │  │ FFmpeg   │            │              │
│  │  │ Manager  │  │          │  │ Binary   │            │              │
│  │  └──────────┘  └──────────┘  └──────────┘            │              │
│  └───────────────────────────────────────────────────────┘              │
│                              │                                           │
│  ┌───────────────────────────┴───────────────────────────┐              │
│  │                 Persistence Layer                      │              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │              │
│  │  │PostgreSQL│  │  Redis   │  │  NATS    │            │              │
│  │  │(Artifacts)│  │ (Cache) │  │ (Jobs)   │            │              │
│  │  └──────────┘  └──────────┘  └──────────┘            │              │
│  └───────────────────────────────────────────────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

**A2S Handler** (New)
- JSON-RPC 2.0 over HTTP (like A2A)
- Methods: `render`, `getRenderStatus`, `cancelRender`, `getCapabilities`
- Streaming support via SSE for progress updates

**Remotion Compatibility Layer** (New)
- Composition schema parser (Zod)
- Frame/timeline calculation
- Asset resolution (staticFile equivalent)
- Sequence/Series timing logic

**FFmpeg Pipeline** (New)
- Frame stitching
- Audio mixing
- Codec selection (h264, h265, vp8, vp9, prores)
- Quality control (CRF, bitrate)
- Hardware acceleration

**Composition Engine** (New)
- Scene rendering (Canvas/Puppeteer)
- Timeline synchronization
- Asset management (fonts, images, videos)

**Container Runtime** (Existing, Extended)
- Add FFmpeg binary to container images
- Warm pool for rendering workers
- Isolated execution environment

---

## 3. Remotion Compatibility Layer

### 3.1 Composition Schema

```typescript
// server/src/a2s/types.ts

import { z } from 'zod';

export const CompositionSchema = z.object({
  id: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  durationInFrames: z.number().int().positive(),
  defaultProps: z.record(z.unknown()).optional(),
  schema: z.any().optional(), // Zod schema for input validation
});

export const SequenceSchema = z.object({
  from: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive().optional(),
  name: z.string().optional(),
  layout: z.enum(['absolute-fill', 'none']).default('absolute-fill'),
  premountFor: z.number().int().nonnegative().default(0),
});

export const SeriesSchema = z.object({
  sequences: z.array(z.object({
    durationInFrames: z.number().int().positive(),
    offset: z.number().int().default(0),
    layout: z.enum(['absolute-fill', 'none']).default('absolute-fill'),
  })),
});

export const RenderRequestSchema = z.object({
  compositionId: z.string(),
  inputProps: z.record(z.unknown()).optional(),
  outputFormat: z.enum(['mp4', 'webm', 'gif', 'png-sequence']).default('mp4'),
  codec: z.enum(['h264', 'h265', 'vp8', 'vp9', 'prores']).default('h264'),
  crf: z.number().int().min(0).max(63).optional(),
  videoBitrate: z.string().optional(),
  audioBitrate: z.string().optional(),
  scale: z.number().positive().max(16).default(1),
  frameRange: z.tuple([z.number().int(), z.number().int()]).optional(),
  muted: z.boolean().default(false),
  imageFormat: z.enum(['jpeg', 'png']).default('jpeg'),
  jpegQuality: z.number().int().min(0).max(100).default(80),
  concurrency: z.number().int().positive().default(4),
  hardwareAcceleration: z.boolean().default(false),
});

export type Composition = z.infer<typeof CompositionSchema>;
export type RenderRequest = z.infer<typeof RenderRequestSchema>;
```

### 3.2 Timeline Engine

```typescript
// server/src/a2s/timeline/engine.ts

export interface TimelineEvent {
  id: string;
  type: 'sequence' | 'transition' | 'audio' | 'video';
  startFrame: number;
  endFrame: number;
  layer: number;
  data: unknown;
}

export interface TimelineTrack {
  id: string;
  name: string;
  events: TimelineEvent[];
}

export class TimelineEngine {
  private tracks: TimelineTrack[] = [];
  private fps: number;
  private totalFrames: number;

  constructor(fps: number, durationInFrames: number) {
    this.fps = fps;
    this.totalFrames = durationInFrames;
  }

  // Convert frame to timestamp
  frameToTime(frame: number): number {
    return frame / this.fps;
  }

  // Convert timestamp to frame
  timeToFrame(time: number): number {
    return Math.floor(time * this.fps);
  }

  // Get active events at a specific frame
  getActiveEvents(frame: number): TimelineEvent[] {
    return this.tracks.flatMap(track =>
      track.events.filter(e => frame >= e.startFrame && frame < e.endFrame)
    );
  }

  // Calculate sequence timing (handles Series with offsets)
  calculateSequenceTiming(
    sequences: Array<{ durationInFrames: number; offset?: number }>
  ): Array<{ startFrame: number; endFrame: number }> {
    const result: Array<{ startFrame: number; endFrame: number }> = [];
    let currentFrame = 0;

    for (const seq of sequences) {
      const startFrame = currentFrame + (seq.offset ?? 0);
      const endFrame = startFrame + seq.durationInFrames;
      result.push({ startFrame, endFrame });
      currentFrame = endFrame;
    }

    return result;
  }
}
```

### 3.3 Animation Functions (Remotion Equivalents)

```typescript
// server/src/a2s/animation/interpolate.ts

type ExtrapolationType = 'clamp' | 'extend' | 'wrap' | 'identity';

interface InterpolateOptions {
  easing?: (t: number) => number;
  extrapolateLeft?: ExtrapolationType;
  extrapolateRight?: ExtrapolationType;
}

export function interpolate(
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options: InterpolateOptions = {}
): number {
  const { easing = (t) => t, extrapolateLeft = 'extend', extrapolateRight = 'extend' } = options;

  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  // Normalize input to 0-1 range
  let progress = (input - inputMin) / (inputMax - inputMin);

  // Handle extrapolation
  if (progress < 0) {
    if (extrapolateLeft === 'clamp') progress = 0;
    else if (extrapolateLeft === 'identity') return input;
  } else if (progress > 1) {
    if (extrapolateRight === 'clamp') progress = 1;
    else if (extrapolateRight === 'identity') return input;
  }

  // Apply easing
  const easedProgress = easing(Math.max(0, Math.min(1, progress)));

  // Map to output range
  return outputMin + easedProgress * (outputMax - outputMin);
}

// server/src/a2s/animation/spring.ts

interface SpringConfig {
  mass?: number;
  damping?: number;
  stiffness?: number;
  overshootClamping?: boolean;
}

export function spring(options: {
  frame: number;
  fps: number;
  config?: SpringConfig;
  durationInFrames?: number;
  delay?: number;
}): number {
  const {
    frame,
    fps,
    config = { mass: 1, damping: 10, stiffness: 100 },
    durationInFrames,
    delay = 0,
  } = options;

  const { mass = 1, damping = 10, stiffness = 100 } = config;

  const adjustedFrame = frame - delay;
  if (adjustedFrame < 0) return 0;

  const time = adjustedFrame / fps;

  // Damped harmonic oscillator
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta < 1) {
    // Underdamped
    const omega_d = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * time) *
      (Math.cos(omega_d * time) + (zeta * omega / omega_d) * Math.sin(omega_d * time));
  } else if (zeta === 1) {
    // Critically damped
    return 1 - Math.exp(-omega * time) * (1 + omega * time);
  } else {
    // Overdamped
    const s1 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
    const s2 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
    return 1 - (s2 * Math.exp(s1 * time) - s1 * Math.exp(s2 * time)) / (s2 - s1);
  }
}

// server/src/a2s/animation/easing.ts

export const Easing = {
  linear: (t: number) => t,

  // Quad
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => (--t) * t * t + 1,
  inOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Sin
  inSin: (t: number) => 1 - Math.cos(t * Math.PI / 2),
  outSin: (t: number) => Math.sin(t * Math.PI / 2),
  inOutSin: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Exponential
  inExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  outExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

  // Bezier
  bezier: (x1: number, y1: number, x2: number, y2: number) => {
    return (t: number) => {
      // Simplified cubic bezier implementation
      const cx = 3 * x1;
      const bx = 3 * (x2 - x1) - cx;
      const ax = 1 - cx - bx;
      const cy = 3 * y1;
      const by = 3 * (y2 - y1) - cy;
      const ay = 1 - cy - by;

      const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
      const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;

      // Newton-Raphson iteration to find t for given x
      let x = t;
      for (let i = 0; i < 8; i++) {
        const currentX = sampleCurveX(x) - t;
        if (Math.abs(currentX) < 1e-6) break;
        const derivative = (3 * ax * x + 2 * bx) * x + cx;
        x -= currentX / derivative;
      }

      return sampleCurveY(x);
    };
  },
};
```

---

## 4. FFmpeg Integration Strategy

### 4.1 Container Image Extension

**Size Optimization Note**: Using system FFmpeg (~100MB) instead of full Remotion/Chrome stack (~500MB+) keeps containers lightweight while providing full video processing capabilities.

```dockerfile
# server/container/Dockerfile.a2s
FROM liquidcrypto/liquid-base:latest

# Install FFmpeg with hardware acceleration + fonts for text rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libavcodec-extra \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# Verify FFmpeg installation
RUN ffmpeg -version && fc-cache -fv

# Install node-av for native bindings (primary)
# Falls back to child_process if issues arise
RUN bun add node-av

# Copy A2S runtime
COPY a2s-runtime/ /app/a2s/

EXPOSE 8080
CMD ["bun", "run", "/app/a2s/server.ts"]
```

### 4.2 FFmpeg Pipeline Implementation

We support **two approaches** for maximum reliability:

1. **Primary**: `node-av` - Type-safe, hardware acceleration, streaming
2. **Fallback**: `child_process` - Battle-tested, maximum performance, simpler debugging

```typescript
// server/src/a2s/ffmpeg/pipeline.ts

import { Encoder, Muxer, CodecContext, Frame } from 'node-av';
import { spawn } from 'child_process';

export interface FrameStitchOptions {
  inputPattern: string;           // e.g., 'frame-%05d.png'
  outputPath: string;
  fps: number;
  codec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
  crf?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  audioPath?: string;
  hardwareAcceleration?: boolean;
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
}

export class FFmpegPipeline {
  private hwContext: any = null;

  async initialize(useHardware: boolean = false): Promise<void> {
    if (useHardware) {
      const { HardwareContext } = await import('node-av');
      this.hwContext = await HardwareContext.auto();
    }
  }

  async stitchFrames(options: FrameStitchOptions): Promise<{ outputPath: string; duration: number }> {
    const {
      inputPattern,
      outputPath,
      fps,
      codec,
      crf,
      videoBitrate,
      audioPath,
      preset = 'medium',
    } = options;

    // Use node-av's pipeline API
    const { Pipeline, Demuxer, Encoder, Muxer } = await import('node-av');

    const pipeline = new Pipeline();

    // Add image sequence input
    pipeline.addInput({
      type: 'image_sequence',
      pattern: inputPattern,
      frameRate: fps,
    });

    // Add audio input if provided
    if (audioPath) {
      pipeline.addInput({
        type: 'file',
        path: audioPath,
      });
    }

    // Configure video encoder
    const videoEncoderConfig = this.getEncoderConfig(codec, crf, videoBitrate, preset);
    pipeline.addVideoEncoder(videoEncoderConfig);

    // Configure audio encoder if needed
    if (audioPath) {
      pipeline.addAudioEncoder({
        codec: 'aac',
        bitrate: options.audioBitrate || '192k',
        sampleRate: 48000,
        channels: 2,
      });
    }

    // Set output
    pipeline.setOutput({
      path: outputPath,
      format: this.getContainerFormat(codec),
    });

    // Execute pipeline
    const result = await pipeline.run({
      onProgress: (progress) => {
        // Emit progress events
      },
    });

    return {
      outputPath,
      duration: result.duration,
    };
  }

  private getEncoderConfig(
    codec: string,
    crf?: number,
    bitrate?: string,
    preset?: string
  ): Record<string, unknown> {
    const config: Record<string, unknown> = {
      codec: this.mapCodecName(codec),
      preset,
    };

    if (crf !== undefined) {
      config.crf = crf;
    } else if (bitrate) {
      config.bitrate = bitrate;
    }

    if (this.hwContext) {
      config.hardwareContext = this.hwContext;
    }

    return config;
  }

  private mapCodecName(codec: string): string {
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
      vp8: 'libvpx',
      vp9: 'libvpx-vp9',
      prores: 'prores_ks',
    };
    return codecMap[codec] || codec;
  }

  private getContainerFormat(codec: string): string {
    if (codec === 'vp8' || codec === 'vp9') return 'webm';
    if (codec === 'prores') return 'mov';
    return 'mp4';
  }
}

// ============================================================================
// Fallback: child_process FFmpeg (for maximum reliability)
// ============================================================================

export class FFmpegChildProcess {
  /**
   * Execute FFmpeg via child_process with progress parsing
   * Use this as fallback when node-av has issues
   */
  async execute(
    args: string[],
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<{ exitCode: number; duration: number }> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-y', '-progress', 'pipe:1', ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let duration = 0;
      let currentTime = 0;

      // Parse progress from stdout
      ffmpeg.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('out_time_ms=')) {
            currentTime = parseInt(line.split('=')[1]) / 1000000;
            if (duration > 0 && onProgress) {
              onProgress({
                percent: Math.min(100, (currentTime / duration) * 100),
                currentTime,
                totalTime: duration,
              });
            }
          }
          if (line.startsWith('progress=end')) {
            // Encoding complete
          }
        }
      });

      // Parse duration from stderr (FFmpeg outputs info to stderr)
      ffmpeg.stderr.on('data', (data: Buffer) => {
        const match = data.toString().match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          const [, h, m, s] = match;
          duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({ exitCode: code, duration });
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Stitch frames to video using child_process
   */
  async stitchFrames(options: FrameStitchOptions): Promise<{ outputPath: string; duration: number }> {
    const {
      inputPattern,
      outputPath,
      fps,
      codec,
      crf,
      videoBitrate,
      audioPath,
      preset = 'medium',
    } = options;

    const args: string[] = [
      // Input: image sequence
      '-framerate', String(fps),
      '-i', inputPattern,
    ];

    // Add audio if provided
    if (audioPath) {
      args.push('-i', audioPath);
    }

    // Video codec settings
    args.push('-c:v', this.mapCodecName(codec));

    if (crf !== undefined) {
      args.push('-crf', String(crf));
    } else if (videoBitrate) {
      args.push('-b:v', videoBitrate);
    }

    args.push('-preset', preset);

    // Audio codec (if audio input)
    if (audioPath) {
      args.push('-c:a', 'aac', '-b:a', '192k');
    }

    // Pixel format for compatibility
    args.push('-pix_fmt', 'yuv420p');

    // Output
    args.push(outputPath);

    const result = await this.execute(args);
    return { outputPath, duration: result.duration };
  }

  /**
   * Build FFmpeg filter complex for compositions
   * Maps Remotion-style compositions to FFmpeg filter graphs
   */
  buildFilterComplex(composition: CompositionFilterOptions): string {
    const filters: string[] = [];

    // Scale inputs
    composition.inputs.forEach((input, i) => {
      if (input.scale) {
        filters.push(`[${i}:v]scale=${input.scale.width}:${input.scale.height}[v${i}]`);
      }
    });

    // Overlay composition
    if (composition.overlay) {
      const { x, y, startFrame, endFrame } = composition.overlay;
      const enable = startFrame !== undefined
        ? `enable='between(n,${startFrame},${endFrame ?? 99999})'`
        : '';
      filters.push(`[0:v][1:v]overlay=${x}:${y}:${enable}[vout]`);
    }

    // Text overlay (drawtext filter)
    if (composition.text) {
      const { text, x, y, fontSize, fontColor, fontFile } = composition.text;
      const font = fontFile ? `fontfile=${fontFile}:` : '';
      filters.push(
        `drawtext=${font}text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}`
      );
    }

    return filters.join(';');
  }

  private mapCodecName(codec: string): string {
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
      vp8: 'libvpx',
      vp9: 'libvpx-vp9',
      prores: 'prores_ks',
    };
    return codecMap[codec] || codec;
  }
}

export interface FFmpegProgress {
  percent: number;
  currentTime: number;
  totalTime: number;
}

export interface CompositionFilterOptions {
  inputs: Array<{
    path: string;
    scale?: { width: number; height: number };
  }>;
  overlay?: {
    x: number;
    y: number;
    startFrame?: number;
    endFrame?: number;
  };
  text?: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontColor: string;
    fontFile?: string;
  };
}

// ============================================================================
// Unified Pipeline (uses node-av with child_process fallback)
// ============================================================================

export class FFmpegPipelineUnified {
  private nodeAv: FFmpegPipeline;
  private childProcess: FFmpegChildProcess;
  private useNodeAv: boolean = true;

  constructor() {
    this.nodeAv = new FFmpegPipeline();
    this.childProcess = new FFmpegChildProcess();
  }

  async stitchFrames(
    options: FrameStitchOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<{ outputPath: string; duration: number }> {
    if (this.useNodeAv) {
      try {
        return await this.nodeAv.stitchFrames(options);
      } catch (error) {
        console.warn('[FFmpeg] node-av failed, falling back to child_process:', error);
        this.useNodeAv = false;
      }
    }

    return await this.childProcess.stitchFrames(options);
  }
}

// Keep original class for direct use
export class FFmpegPipeline {
  private hwContext: any = null;

  async extractFrames(
    inputPath: string,
    outputPattern: string,
    fps: number
  ): Promise<string[]> {
    const { Demuxer, VideoDecoder } = await import('node-av');

    const demuxer = new Demuxer(inputPath);
    const videoStream = demuxer.videoStreams[0];
    const decoder = new VideoDecoder(videoStream);

    const frames: string[] = [];
    let frameIndex = 0;

    for await (const frame of decoder) {
      const outputPath = outputPattern.replace('%05d', String(frameIndex).padStart(5, '0'));
      await this.saveFrame(frame, outputPath);
      frames.push(outputPath);
      frameIndex++;
    }

    return frames;
  }

  private async saveFrame(frame: Frame, outputPath: string): Promise<void> {
    // Convert frame to PNG and save
    const sharp = await import('sharp');
    const buffer = frame.toBuffer('rgb24');
    await sharp(buffer, {
      raw: {
        width: frame.width,
        height: frame.height,
        channels: 3,
      },
    })
      .png()
      .toFile(outputPath);
  }
}
```

### 4.3 Audio Processing

```typescript
// server/src/a2s/ffmpeg/audio.ts

export interface AudioMixOptions {
  tracks: Array<{
    path: string;
    startFrame: number;
    endFrame?: number;
    volume: number | ((frame: number) => number);
    fadeIn?: number;  // frames
    fadeOut?: number; // frames
    playbackRate?: number;
    loop?: boolean;
  }>;
  fps: number;
  durationInFrames: number;
  outputPath: string;
}

export async function mixAudio(options: AudioMixOptions): Promise<string> {
  const { tracks, fps, durationInFrames, outputPath } = options;

  const duration = durationInFrames / fps;

  // Build FFmpeg filter complex
  const inputs: string[] = [];
  const filters: string[] = [];

  tracks.forEach((track, i) => {
    inputs.push(`-i ${track.path}`);

    const startTime = track.startFrame / fps;
    const endTime = track.endFrame ? track.endFrame / fps : duration;
    const trackDuration = endTime - startTime;

    let filter = `[${i}:a]`;

    // Apply playback rate
    if (track.playbackRate && track.playbackRate !== 1) {
      filter += `atempo=${track.playbackRate},`;
    }

    // Apply fade in/out
    if (track.fadeIn) {
      const fadeInDuration = track.fadeIn / fps;
      filter += `afade=t=in:st=0:d=${fadeInDuration},`;
    }
    if (track.fadeOut) {
      const fadeOutDuration = track.fadeOut / fps;
      const fadeOutStart = trackDuration - fadeOutDuration;
      filter += `afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration},`;
    }

    // Apply volume
    const volume = typeof track.volume === 'number' ? track.volume : 1;
    filter += `volume=${volume},`;

    // Apply delay
    filter += `adelay=${startTime * 1000}|${startTime * 1000}`;

    filter += `[a${i}]`;
    filters.push(filter);
  });

  // Mix all tracks
  const mixFilter = tracks.map((_, i) => `[a${i}]`).join('') +
    `amix=inputs=${tracks.length}:duration=longest[aout]`;

  const filterComplex = filters.join(';') + ';' + mixFilter;

  // Execute FFmpeg command
  // ... implementation using node-av or child_process

  return outputPath;
}
```

---

## 5. A2S Protocol Design

### 5.1 JSON-RPC Methods

```typescript
// server/src/a2s/methods.ts

export const A2S_METHODS = {
  // Core rendering
  'render': RenderMethod,
  'render.status': GetRenderStatusMethod,
  'render.cancel': CancelRenderMethod,
  'render.list': ListRendersMethod,

  // Composition management
  'composition.register': RegisterCompositionMethod,
  'composition.list': ListCompositionsMethod,
  'composition.get': GetCompositionMethod,
  'composition.delete': DeleteCompositionMethod,

  // Asset management
  'asset.upload': UploadAssetMethod,
  'asset.list': ListAssetsMethod,
  'asset.delete': DeleteAssetMethod,

  // Capabilities
  'getCapabilities': GetCapabilitiesMethod,

  // Streaming
  'render.subscribe': SubscribeToRenderMethod,  // SSE
};
```

### 5.2 Request/Response Types

```typescript
// server/src/a2s/protocol.ts

// Render request
export interface RenderRequest {
  compositionId: string;
  inputProps?: Record<string, unknown>;
  outputFormat?: 'mp4' | 'webm' | 'gif' | 'png-sequence';
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
  quality?: {
    crf?: number;
    videoBitrate?: string;
    audioBitrate?: string;
  };
  resolution?: {
    width?: number;
    height?: number;
    scale?: number;
  };
  frameRange?: [number, number];
  muted?: boolean;
  async?: boolean;          // Return immediately with job ID
  webhookUrl?: string;      // Notify on completion
}

// Render response
export interface RenderResponse {
  renderId: string;
  status: RenderStatus;
  progress?: number;        // 0-100
  outputUrl?: string;       // When complete
  error?: string;
  estimatedTimeRemaining?: number;  // seconds
}

export type RenderStatus =
  | 'queued'
  | 'initializing'
  | 'rendering'
  | 'encoding'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Capabilities response
export interface CapabilitiesResponse {
  version: string;
  supportedCodecs: string[];
  supportedFormats: string[];
  maxDuration: number;        // seconds
  maxResolution: { width: number; height: number };
  hardwareAcceleration: boolean;
  maxConcurrentRenders: number;
  features: {
    audio: boolean;
    transitions: boolean;
    threeD: boolean;
    lottie: boolean;
    captions: boolean;
  };
}
```

### 5.3 A2S Server Implementation

```typescript
// server/src/a2s/server.ts

import { Elysia } from 'elysia';
import { v1 } from '@liquidcrypto/a2a-sdk';

export function createA2SServer(config: A2SConfig): Elysia {
  return new Elysia()
    .post('/a2s', async ({ body, set }) => {
      const request = body as JsonRpcRequest;

      try {
        const method = A2S_METHODS[request.method];
        if (!method) {
          return jsonRpcError(request.id, -32601, 'Method not found');
        }

        const result = await method.execute(request.params, config);
        return jsonRpcSuccess(request.id, result);
      } catch (error) {
        return jsonRpcError(request.id, -32603, error.message);
      }
    })

    // Streaming endpoint for progress updates
    .get('/a2s/render/:renderId/stream', async ({ params, set }) => {
      set.headers['Content-Type'] = 'text/event-stream';
      set.headers['Cache-Control'] = 'no-cache';
      set.headers['Connection'] = 'keep-alive';

      const stream = new ReadableStream({
        async start(controller) {
          const unsubscribe = await config.renderManager.subscribe(
            params.renderId,
            (event) => {
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
              if (event.status === 'completed' || event.status === 'failed') {
                controller.close();
              }
            }
          );

          return () => unsubscribe();
        }
      });

      return new Response(stream);
    })

    // Agent card for A2A compatibility
    .get('/.well-known/a2s-card.json', () => ({
      name: 'LiquidCrypto A2S',
      version: '1.0.0',
      description: 'Remotion-compatible video rendering server',
      capabilities: config.capabilities,
      protocolVersions: ['1.0'],
    }));
}
```

---

## 6. Implementation Phases

### Phase 1: Core Infrastructure (2-3 weeks)

**Goals:**
- A2S server skeleton with JSON-RPC handler
- Basic composition parsing and validation
- Container image with FFmpeg
- Frame rendering pipeline (Canvas-based)

**Deliverables:**
- `server/src/a2s/` directory structure
- `server/container/Dockerfile.a2s`
- Basic `render` and `render.status` methods
- Unit tests for timeline engine

**Files to Create:**
```
server/src/a2s/
├── index.ts
├── types.ts
├── server.ts
├── methods/
│   ├── render.ts
│   ├── render-status.ts
│   └── capabilities.ts
├── timeline/
│   ├── engine.ts
│   └── sequence.ts
├── animation/
│   ├── interpolate.ts
│   ├── spring.ts
│   └── easing.ts
└── ffmpeg/
    ├── pipeline.ts
    └── audio.ts
```

### Phase 2: FFmpeg Integration (2 weeks)

**Goals:**
- Full FFmpeg pipeline with node-av
- Codec support (h264, h265, vp8, vp9, prores)
- Audio mixing and synchronization
- Hardware acceleration detection

**Deliverables:**
- Frame stitching implementation
- Audio processing pipeline
- Quality control (CRF, bitrate)
- Progress tracking

### Phase 3: Remotion Compatibility (2-3 weeks)

**Goals:**
- Asset management (fonts, images, videos)
- Sequence/Series timing
- Transition effects
- Media components (Video, Audio, Image)
- Lottie animation support
- Tailwind CSS compilation

**Deliverables:**
- Asset resolver (staticFile equivalent)
- Transition library (fade, slide, wipe, flip)
- Media component handlers
- Font loading system
- `LottieRenderer` class with frame extraction
- `compileTailwindCSS()` function for style processing

### Phase 4: Advanced Features (2 weeks)

**Goals:**
- Caption rendering
- Chart rendering (with frame-based animation)
- 3D rendering (Three.js via Puppeteer fallback)
- Intent routing for natural language

**Deliverables:**
- SRT/VTT caption support
- SVG chart components
- `ThreeJSRenderer` class with Puppeteer
- Intent detection and routing system

### Phase 5: Production Hardening (1-2 weeks)

**Goals:**
- Job queue with NATS
- PostgreSQL persistence
- Redis caching
- Monitoring and observability

**Deliverables:**
- NATS stream for render jobs
- Database migration for a2s_renders table
- Redis cache for composition/asset lookup
- OpenTelemetry instrumentation

---

## 7. Database Schema

```sql
-- server/sql/013_a2s_system.sql

-- Composition registry
CREATE TABLE a2s_compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    composition_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    fps NUMERIC(5,2) NOT NULL,
    duration_in_frames INTEGER NOT NULL,
    default_props JSONB DEFAULT '{}',
    schema JSONB,  -- Zod schema definition
    source_code TEXT,  -- React component source
    owner_type VARCHAR(20) NOT NULL,  -- app, agent, user
    owner_id VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_a2s_compositions_owner ON a2s_compositions(owner_type, owner_id);
CREATE INDEX idx_a2s_compositions_active ON a2s_compositions(is_active, created_at DESC);

-- Render jobs
CREATE TABLE a2s_renders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_id VARCHAR(255) UNIQUE NOT NULL,
    composition_id UUID REFERENCES a2s_compositions(id),
    input_props JSONB DEFAULT '{}',
    output_format VARCHAR(20) NOT NULL,
    codec VARCHAR(20),
    quality_settings JSONB,
    resolution JSONB,
    frame_range INT4RANGE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    output_path TEXT,
    output_url TEXT,
    file_size_bytes BIGINT,
    duration_seconds NUMERIC(10,3),
    error TEXT,
    container_id VARCHAR(255),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    webhook_url TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_a2s_renders_status ON a2s_renders(status, created_at DESC);
CREATE INDEX idx_a2s_renders_composition ON a2s_renders(composition_id);

-- Asset storage
CREATE TABLE a2s_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- image, video, audio, font, lottie
    mime_type VARCHAR(100),
    file_path TEXT,
    public_url TEXT,
    file_size_bytes BIGINT,
    dimensions JSONB,  -- { width, height } for images/videos
    duration_seconds NUMERIC(10,3),  -- for audio/video
    metadata JSONB DEFAULT '{}',
    owner_type VARCHAR(20) NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_a2s_assets_owner ON a2s_assets(owner_type, owner_id);
CREATE INDEX idx_a2s_assets_type ON a2s_assets(type);

-- Render logs (for debugging)
CREATE TABLE a2s_render_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_id UUID REFERENCES a2s_renders(id),
    level VARCHAR(20) NOT NULL,  -- debug, info, warn, error
    message TEXT NOT NULL,
    data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_a2s_render_logs_render ON a2s_render_logs(render_id, timestamp DESC);
```

---

## 8. API Specification

### 8.1 Render Endpoint

```yaml
# POST /a2s
# Content-Type: application/json

# Request
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "render",
  "params": {
    "compositionId": "my-video",
    "inputProps": {
      "title": "Hello World",
      "backgroundColor": "#000000"
    },
    "outputFormat": "mp4",
    "codec": "h264",
    "quality": {
      "crf": 18
    },
    "async": true
  }
}

# Response
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "renderId": "render-abc123",
    "status": "queued",
    "estimatedTimeRemaining": 120
  }
}
```

### 8.2 Status Endpoint

```yaml
# POST /a2s
# Content-Type: application/json

# Request
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "render.status",
  "params": {
    "renderId": "render-abc123"
  }
}

# Response
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "renderId": "render-abc123",
    "status": "rendering",
    "progress": 45,
    "estimatedTimeRemaining": 65
  }
}
```

### 8.3 Composition Registration

```yaml
# POST /a2s
# Content-Type: application/json

# Request
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "composition.register",
  "params": {
    "id": "my-video",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationInFrames": 300,
    "defaultProps": {
      "title": "Default Title"
    },
    "schema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "backgroundColor": { "type": "string" }
      }
    },
    "sourceCode": "export const MyVideo = ({ title }) => { ... }"
  }
}
```

### 8.4 Streaming Progress

```
# GET /a2s/render/{renderId}/stream
# Accept: text/event-stream

# Response (SSE)
data: {"status":"initializing","progress":0}

data: {"status":"rendering","progress":10,"frame":30,"totalFrames":300}

data: {"status":"rendering","progress":50,"frame":150,"totalFrames":300}

data: {"status":"encoding","progress":90}

data: {"status":"completed","progress":100,"outputUrl":"https://..."}
```

---

## 9. Skill Compatibility Matrix

| Remotion Skill | A2S Support | Implementation Notes |
|----------------|-------------|---------------------|
| **animations.md** | ✅ Full | Native interpolate/spring/easing |
| **timing.md** | ✅ Full | TimelineEngine handles timing |
| **transitions.md** | ✅ Full | Transition library implementation |
| **sequencing.md** | ✅ Full | Sequence/Series support |
| **compositions.md** | ✅ Full | CompositionSchema validation |
| **calculate-metadata.md** | ✅ Full | Dynamic metadata calculation |
| **videos.md** | ✅ Full | FFmpeg video processing |
| **audio.md** | ✅ Full | Audio mixing pipeline |
| **images.md** | ✅ Full | Asset management |
| **gifs.md** | ✅ Full | GIF encoding support |
| **fonts.md** | ✅ Full | Font loading system |
| **text-animations.md** | ✅ Full | String operations |
| **charts.md** | ✅ Full | SVG chart rendering |
| **parameters.md** | ✅ Full | Zod schema validation |
| **lottie.md** | ✅ Full | Use `lottie-web` + `canvas` for frame extraction |
| **3d.md** | ⚠️ Partial | Requires headless Three.js via `gl` or Puppeteer fallback |
| **maps.md** | ❌ Out of Scope | Requires full browser context; users provide pre-rendered assets |
| **transcribe-captions.md** | ✅ Full | Whisper via node-av |
| **display-captions.md** | ✅ Full | Caption overlay rendering |
| **import-srt-captions.md** | ✅ Full | SRT parser |
| **extract-frames.md** | ✅ Full | FFmpeg frame extraction |
| **get-video-duration.md** | ✅ Full | FFmpeg probe |
| **get-audio-duration.md** | ✅ Full | FFmpeg probe |
| **get-video-dimensions.md** | ✅ Full | FFmpeg probe |
| **trimming.md** | ✅ Full | FFmpeg trim operations |
| **measuring-dom-nodes.md** | ✅ Full | Canvas text measurement |
| **measuring-text.md** | ✅ Full | Canvas text metrics |
| **can-decode.md** | ✅ Full | FFmpeg codec detection |
| **tailwind.md** | ✅ Full | Use `tailwindcss` package for CSS compilation |
| **assets.md** | ✅ Full | Asset management system |

---

## 10. Risk Assessment

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| FFmpeg version incompatibility | Medium | High | Pin FFmpeg version, comprehensive testing |
| node-av stability issues | Medium | Medium | **Dual approach**: child_process fallback with automatic switching |
| FFmpeg process crash | Low | Medium | Retry logic with exponential backoff (3 attempts) |
| Memory exhaustion during rendering | Medium | High | Implement streaming, limit concurrency |
| Container startup latency | Low | Medium | Warm pool with A2S containers |
| Font rendering inconsistencies | Medium | Low | Test across platforms, use web fonts |
| Audio sync drift | Low | Medium | Frame-accurate timeline engine |

### 10.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Storage costs for rendered videos | High | Medium | Implement retention policies, S3 lifecycle |
| Long-running renders timeout | Medium | Medium | Checkpoint rendering, resume capability |
| API abuse (resource exhaustion) | Medium | High | Rate limiting, quota system |
| Codec licensing (h265) | Low | Medium | Default to h264, document licensing |

### 10.3 Dependencies

| Dependency | Version | Risk |
|------------|---------|------|
| node-av | Latest | Active development, may have breaking changes |
| FFmpeg | 6.x | Stable, well-documented |
| Zod | 3.22.3 | Stable, Remotion-compatible |
| Sharp | Latest | Mature, stable |

---

## 11. Lottie & Tailwind Implementation

### 11.1 Lottie Animation Support

Lottie animations are JSON-based and can be rendered frame-by-frame using `lottie-web` with the Node.js `canvas` package.

```typescript
// server/src/a2s/renderer/components/lottie.ts

import lottie, { AnimationItem } from 'lottie-web';
import { createCanvas } from 'canvas';

export interface LottieRenderOptions {
  animationData: object;  // Lottie JSON
  width: number;
  height: number;
  fps: number;
}

export class LottieRenderer {
  private animation: AnimationItem | null = null;
  private canvas: ReturnType<typeof createCanvas>;
  private ctx: CanvasRenderingContext2D;

  constructor(options: LottieRenderOptions) {
    this.canvas = createCanvas(options.width, options.height);
    this.ctx = this.canvas.getContext('2d');
  }

  async initialize(animationData: object): Promise<{ totalFrames: number; duration: number }> {
    // lottie-web can render to canvas in Node.js
    this.animation = lottie.loadAnimation({
      container: this.canvas as any,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData,
      rendererSettings: {
        context: this.ctx,
        clearCanvas: true,
      },
    });

    return {
      totalFrames: this.animation.totalFrames,
      duration: this.animation.getDuration(),
    };
  }

  renderFrame(frameNumber: number): Buffer {
    if (!this.animation) throw new Error('Animation not initialized');

    // Go to specific frame
    this.animation.goToAndStop(frameNumber, true);

    // Return canvas as PNG buffer
    return this.canvas.toBuffer('image/png');
  }

  async renderAllFrames(outputDir: string): Promise<string[]> {
    if (!this.animation) throw new Error('Animation not initialized');

    const frames: string[] = [];
    const totalFrames = this.animation.totalFrames;

    for (let i = 0; i < totalFrames; i++) {
      const buffer = this.renderFrame(i);
      const framePath = `${outputDir}/frame-${String(i).padStart(5, '0')}.png`;
      await fs.writeFile(framePath, buffer);
      frames.push(framePath);
    }

    return frames;
  }

  destroy(): void {
    this.animation?.destroy();
    this.animation = null;
  }
}
```

**Dependencies:**
```bash
bun add lottie-web canvas
```

### 11.2 Tailwind CSS Support

Tailwind classes are compiled to CSS at build time or on-demand.

```typescript
// server/src/a2s/renderer/styles/tailwind.ts

import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export interface TailwindCompileOptions {
  content: string;  // HTML/JSX content to scan for classes
  config?: object;  // Optional Tailwind config
}

export async function compileTailwindCSS(options: TailwindCompileOptions): Promise<string> {
  const { content, config = {} } = options;

  // Create inline Tailwind config
  const tailwindConfig = {
    content: [{ raw: content, extension: 'html' }],
    theme: {
      extend: {},
    },
    ...config,
  };

  // Base CSS with Tailwind directives
  const inputCSS = `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `;

  // Process with PostCSS
  const result = await postcss([
    tailwindcss(tailwindConfig),
    autoprefixer,
  ]).process(inputCSS, {
    from: undefined,
  });

  return result.css;
}

// Usage in scene renderer
export async function renderSceneWithTailwind(
  sceneContent: string,
  width: number,
  height: number
): Promise<Buffer> {
  // Compile Tailwind for this scene's classes
  const css = await compileTailwindCSS({ content: sceneContent });

  // Inject CSS into scene and render
  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head><style>${css}</style></head>
      <body style="margin:0;width:${width}px;height:${height}px;">
        ${sceneContent}
      </body>
    </html>
  `;

  // Render with Puppeteer or canvas
  return await renderHTML(fullHTML, width, height);
}
```

**Dependencies:**
```bash
bun add tailwindcss postcss autoprefixer
```

### 11.3 3D Rendering (Optional - Puppeteer Fallback)

For 3D scenes, we provide a Puppeteer-based fallback since `headless-gl` has platform issues:

```typescript
// server/src/a2s/renderer/components/three.ts

import puppeteer from 'puppeteer';

export class ThreeJSRenderer {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;

  async initialize(width: number, height: number): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--use-gl=egl'],  // Enable WebGL
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width, height });
  }

  async renderFrame(sceneCode: string, frame: number, fps: number): Promise<Buffer> {
    if (!this.page) throw new Error('Not initialized');

    // Inject Three.js scene and render specific frame
    await this.page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        </head>
        <body style="margin:0;">
          <script>
            const frame = ${frame};
            const fps = ${fps};
            ${sceneCode}
          </script>
        </body>
      </html>
    `);

    // Wait for render and screenshot
    await this.page.waitForFunction('window.renderComplete === true', { timeout: 5000 });
    return await this.page.screenshot({ type: 'png' });
  }

  async destroy(): Promise<void> {
    await this.browser?.close();
  }
}
```

**Note:** 3D rendering adds ~200-500ms per frame. For production, recommend pre-rendering 3D assets or using video inputs.

---

## 12. Additional Infrastructure

### 12.1 Video Artifact Storage

Add volume for rendered videos in docker-compose:

```yaml
# docker-compose.yml additions

volumes:
  video_outputs:
    driver: local
  video_assets:
    driver: local

services:
  liquid-runtime:
    volumes:
      - video_outputs:/data/renders
      - video_assets:/data/assets
```

### 12.2 AgentCard Output Modes

Ensure video/image output modes are declared:

```typescript
// server/src/a2s/server.ts

export function getA2SAgentCard(baseUrl: string): AgentCard {
  return {
    name: 'LiquidCrypto A2S',
    protocolVersions: ['1.0'],
    version: '1.0.0',
    description: 'Remotion-compatible video rendering server with FFmpeg',
    supportedInterfaces: [
      { url: `${baseUrl}/a2s`, protocolBinding: 'JSONRPC' }
    ],
    capabilities: {
      streaming: true,
      pushNotifications: true,
    },
    defaultInputModes: [
      'text/plain',
      'application/json',
      'image/png',
      'image/jpeg',
      'video/mp4',
      'audio/mpeg',
    ],
    defaultOutputModes: [
      'text/plain',
      'application/json',
      'video/mp4',
      'video/webm',
      'video/quicktime',  // MOV
      'image/png',
      'image/jpeg',
      'image/gif',
    ],
    skills: [
      {
        id: 'render',
        name: 'Render Video',
        description: 'Render a composition to video using FFmpeg',
        tags: ['video', 'rendering', 'ffmpeg', 'remotion'],
        examples: [
          'Render my-composition to MP4 at 1080p',
          'Create a video with title "Hello World"',
        ],
      },
      {
        id: 'render-still',
        name: 'Render Still',
        description: 'Render a single frame as an image',
        tags: ['image', 'screenshot', 'still'],
        examples: [
          'Create a thumbnail at frame 30',
          'Export frame 0 as PNG',
        ],
      },
      {
        id: 'extract-frames',
        name: 'Extract Frames',
        description: 'Extract frames from a video file',
        tags: ['frames', 'extraction', 'video'],
      },
      {
        id: 'media-info',
        name: 'Get Media Info',
        description: 'Get metadata about video/audio files',
        tags: ['metadata', 'info', 'probe'],
      },
    ],
  };
}
```

### 12.3 Intent Routing Helper

For natural language skill dispatch:

```typescript
// server/src/a2s/intent/router.ts

export type A2SIntent =
  | 'render'
  | 'render-still'
  | 'extract-frames'
  | 'media-info'
  | 'composition-register'
  | 'asset-upload'
  | 'unknown';

const INTENT_PATTERNS: Record<A2SIntent, RegExp[]> = {
  'render': [
    /render\s+(video|composition)/i,
    /create\s+(a\s+)?video/i,
    /generate\s+(a\s+)?video/i,
    /export\s+to\s+(mp4|webm|mov)/i,
  ],
  'render-still': [
    /render\s+(still|image|frame)/i,
    /create\s+(a\s+)?(thumbnail|screenshot)/i,
    /export\s+frame/i,
    /capture\s+frame/i,
  ],
  'extract-frames': [
    /extract\s+frames/i,
    /get\s+frames\s+from/i,
    /split\s+(video\s+)?into\s+frames/i,
  ],
  'media-info': [
    /get\s+(media|video|audio)\s+info/i,
    /(duration|resolution|format)\s+of/i,
    /media\s+metadata/i,
  ],
  'composition-register': [
    /register\s+composition/i,
    /add\s+composition/i,
    /create\s+composition/i,
  ],
  'asset-upload': [
    /upload\s+(asset|file|image|video)/i,
    /add\s+(asset|file)/i,
  ],
  'unknown': [],
};

export function detectIntent(text: string): A2SIntent {
  const normalized = text.toLowerCase().trim();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'unknown') continue;
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return intent as A2SIntent;
      }
    }
  }

  return 'unknown';
}

export function routeByIntent(intent: A2SIntent): string {
  const methodMap: Record<A2SIntent, string> = {
    'render': 'render',
    'render-still': 'render.still',
    'extract-frames': 'render.extractFrames',
    'media-info': 'media.info',
    'composition-register': 'composition.register',
    'asset-upload': 'asset.upload',
    'unknown': 'help',
  };
  return methodMap[intent];
}
```

---

## Appendix A: File Structure

```
server/src/a2s/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript types
├── server.ts                   # Elysia server setup
├── handler.ts                  # JSON-RPC handler
├── methods/
│   ├── index.ts
│   ├── render.ts
│   ├── render-status.ts
│   ├── render-cancel.ts
│   ├── render-list.ts
│   ├── composition-register.ts
│   ├── composition-list.ts
│   ├── asset-upload.ts
│   └── capabilities.ts
├── intent/
│   └── router.ts               # Natural language intent detection
├── timeline/
│   ├── engine.ts               # Timeline calculation
│   ├── sequence.ts             # Sequence timing
│   ├── series.ts               # Series timing
│   └── transition.ts           # Transition timing
├── animation/
│   ├── interpolate.ts          # Linear interpolation
│   ├── spring.ts               # Spring physics
│   └── easing.ts               # Easing functions
├── ffmpeg/
│   ├── pipeline.ts             # Frame stitching (node-av)
│   ├── child-process.ts        # Fallback FFmpeg via spawn
│   ├── unified.ts              # Auto-switching between approaches
│   ├── filters.ts              # Filter complex builder
│   ├── progress.ts             # Progress parsing utilities
│   ├── audio.ts                # Audio mixing
│   ├── probe.ts                # Media analysis
│   └── hardware.ts             # HW acceleration
├── renderer/
│   ├── canvas.ts               # Canvas-based rendering
│   ├── scene.ts                # Scene composition
│   ├── styles/
│   │   └── tailwind.ts         # Tailwind CSS compilation
│   └── components/
│       ├── text.ts
│       ├── image.ts
│       ├── video.ts
│       ├── audio.ts
│       ├── lottie.ts           # Lottie animation renderer
│       └── three.ts            # Three.js Puppeteer fallback
├── assets/
│   ├── manager.ts              # Asset lifecycle
│   ├── fonts.ts                # Font loading
│   └── resolver.ts             # staticFile equivalent
├── store/
│   ├── postgres.ts             # PostgreSQL persistence
│   └── redis.ts                # Redis caching
└── jobs/
    ├── queue.ts                # NATS job queue
    └── worker.ts               # Render worker

server/container/
├── Dockerfile.a2s              # A2S container image
└── a2s-runtime/
    ├── server.ts               # In-container server
    └── worker.ts               # Rendering worker

server/sql/
└── 013_a2s_system.sql          # Database migration
```

---

## Appendix B: Configuration

```typescript
// server/src/a2s/config.ts

export interface A2SConfig {
  // Server
  port: number;
  baseUrl: string;

  // Rendering
  maxConcurrentRenders: number;
  defaultTimeout: number;
  maxDuration: number;
  maxResolution: { width: number; height: number };

  // Storage
  outputDir: string;
  tempDir: string;
  assetDir: string;

  // FFmpeg
  ffmpegPath: string;
  hardwareAcceleration: boolean;
  defaultCodec: string;
  defaultCrf: number;

  // Container
  containerImage: string;
  warmPoolSize: number;

  // Database
  databaseUrl: string;
  redisUrl: string;
  natsUrl: string;
}

export const defaultConfig: A2SConfig = {
  port: 8082,
  baseUrl: 'http://localhost:8082',
  maxConcurrentRenders: 4,
  defaultTimeout: 600000,  // 10 minutes
  maxDuration: 3600,       // 1 hour
  maxResolution: { width: 3840, height: 2160 },
  outputDir: '/data/renders',
  tempDir: '/tmp/a2s',
  assetDir: '/data/assets',
  ffmpegPath: '/usr/bin/ffmpeg',
  hardwareAcceleration: false,
  defaultCodec: 'h264',
  defaultCrf: 18,
  containerImage: 'liquidcrypto/a2s-runtime:latest',
  warmPoolSize: 2,
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  natsUrl: process.env.NATS_URL!,
};
```

---

## Appendix C: Remotion Skill Mapping

Detailed mapping of Remotion skill rules to A2S implementation:

### animations.md → `animation/interpolate.ts`
- useCurrentFrame() equivalent: Frame number passed to render function
- Forbid CSS transitions: Validate component source code

### timing.md → `animation/spring.ts`, `animation/easing.ts`
- interpolate(): Direct port
- spring(): Damped harmonic oscillator
- Easing: Full easing library

### transitions.md → `timeline/transition.ts`
- TransitionSeries: Timeline overlapping calculation
- Effects: fade, slide, wipe, flip, clock-wipe

### sequencing.md → `timeline/sequence.ts`, `timeline/series.ts`
- Sequence: from, durationInFrames, premountFor
- Series: Automatic positioning, offset handling

### compositions.md → `types.ts`, `methods/composition-register.ts`
- Composition schema: Zod validation
- defaultProps: JSON serializable
- calculateMetadata: Pre-render hook

---

## Appendix D: Verification & Testing Plan

### D.1 Automated Tests

**Unit Tests:**
```typescript
// server/src/a2s/__tests__/ffmpeg.test.ts

describe('FFmpegChildProcess', () => {
  it('generates correct arguments for h264 encoding', () => {
    const ffmpeg = new FFmpegChildProcess();
    const args = ffmpeg.buildArgs({
      inputPattern: 'frame-%05d.png',
      outputPath: 'output.mp4',
      fps: 30,
      codec: 'h264',
      crf: 18,
    });
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-crf');
    expect(args).toContain('18');
  });

  it('builds correct filter complex for overlay', () => {
    const ffmpeg = new FFmpegChildProcess();
    const filter = ffmpeg.buildFilterComplex({
      inputs: [{ path: 'bg.mp4' }, { path: 'overlay.png' }],
      overlay: { x: 100, y: 50 },
    });
    expect(filter).toContain('overlay=100:50');
  });
});

describe('TimelineEngine', () => {
  it('calculates sequence timing correctly', () => {
    const engine = new TimelineEngine(30, 300);
    const timing = engine.calculateSequenceTiming([
      { durationInFrames: 60 },
      { durationInFrames: 60, offset: -15 },
    ]);
    expect(timing[0]).toEqual({ startFrame: 0, endFrame: 60 });
    expect(timing[1]).toEqual({ startFrame: 45, endFrame: 105 });
  });
});

describe('Animation functions', () => {
  it('interpolate clamps values correctly', () => {
    const result = interpolate(150, [0, 100], [0, 1], {
      extrapolateRight: 'clamp',
    });
    expect(result).toBe(1);
  });

  it('spring returns 0 at frame 0', () => {
    const result = spring({ frame: 0, fps: 30 });
    expect(result).toBe(0);
  });
});
```

**Integration Tests:**
```typescript
// server/src/a2s/__tests__/integration.test.ts

describe('A2S Render Pipeline', () => {
  it('extracts frames from a 5-second video at 1fps', async () => {
    const result = await a2sClient.call('render.extractFrames', {
      videoPath: 'test-fixtures/sample-5s.mp4',
      fps: 1,
    });

    expect(result.frames).toHaveLength(5);
    expect(result.frames[0]).toMatch(/frame-00000\.png$/);
  });

  it('stitches images into video', async () => {
    const result = await a2sClient.call('render', {
      compositionId: 'test-composition',
      inputProps: { title: 'Test' },
      outputFormat: 'mp4',
    });

    expect(result.status).toBe('completed');
    expect(result.outputUrl).toBeDefined();

    // Verify with ffprobe
    const probe = await ffprobe(result.outputPath);
    expect(probe.format.format_name).toContain('mp4');
    expect(probe.streams[0].codec_name).toBe('h264');
  });

  it('renders Lottie animation to frames', async () => {
    const renderer = new LottieRenderer({
      width: 1920,
      height: 1080,
      fps: 30,
    });
    await renderer.initialize(testLottieJson);

    const frame = renderer.renderFrame(0);
    expect(frame).toBeInstanceOf(Buffer);
    expect(frame.length).toBeGreaterThan(0);
  });
});
```

### D.2 Manual Verification Checklist

```markdown
## Pre-Deployment Verification

### Container Build
- [ ] Build A2S container: `docker build -f Dockerfile.a2s -t liquidcrypto/a2s:latest .`
- [ ] Verify FFmpeg: `docker run liquidcrypto/a2s ffmpeg -version`
- [ ] Verify fonts: `docker run liquidcrypto/a2s fc-list | grep -i noto`
- [ ] Verify node-av: `docker run liquidcrypto/a2s bun -e "require('node-av')"`

### Stack Startup
- [ ] Start stack: `docker-compose up -d`
- [ ] Check A2S health: `curl http://localhost:8082/health`
- [ ] Check agent card: `curl http://localhost:8082/.well-known/a2s-card.json`

### Basic Operations
- [ ] Extract frames: Send A2A request "Extract frames from this video at 1fps"
- [ ] Render video: Send A2A request "Create a 5-second test video"
- [ ] Get media info: Send A2A request "Get info for test.mp4"

### Output Verification
- [ ] Download rendered MP4
- [ ] Play in VLC/QuickTime
- [ ] Verify with ffprobe: `ffprobe -v error -show_format -show_streams output.mp4`
- [ ] Check duration matches expected
- [ ] Check resolution matches composition

### Performance
- [ ] Measure render time for 10-second 1080p video
- [ ] Check memory usage during render
- [ ] Verify warm pool container acquisition < 100ms
```

### D.3 ffprobe Verification Utility

```typescript
// server/src/a2s/ffmpeg/probe.ts

import { spawn } from 'child_process';

export interface ProbeResult {
  format: {
    filename: string;
    format_name: string;
    duration: number;
    size: number;
    bit_rate: number;
  };
  streams: Array<{
    index: number;
    codec_type: 'video' | 'audio';
    codec_name: string;
    width?: number;
    height?: number;
    fps?: number;
    sample_rate?: number;
    channels?: number;
  }>;
}

export async function ffprobe(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]);

    let output = '';
    proc.stdout.on('data', (data) => { output += data; });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(output));
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });
  });
}

export async function verifyRenderOutput(
  outputPath: string,
  expected: {
    format?: string;
    codec?: string;
    width?: number;
    height?: number;
    minDuration?: number;
    maxDuration?: number;
  }
): Promise<{ valid: boolean; errors: string[] }> {
  const probe = await ffprobe(outputPath);
  const errors: string[] = [];

  if (expected.format && !probe.format.format_name.includes(expected.format)) {
    errors.push(`Expected format ${expected.format}, got ${probe.format.format_name}`);
  }

  const videoStream = probe.streams.find(s => s.codec_type === 'video');
  if (videoStream) {
    if (expected.codec && videoStream.codec_name !== expected.codec) {
      errors.push(`Expected codec ${expected.codec}, got ${videoStream.codec_name}`);
    }
    if (expected.width && videoStream.width !== expected.width) {
      errors.push(`Expected width ${expected.width}, got ${videoStream.width}`);
    }
    if (expected.height && videoStream.height !== expected.height) {
      errors.push(`Expected height ${expected.height}, got ${videoStream.height}`);
    }
  }

  if (expected.minDuration && probe.format.duration < expected.minDuration) {
    errors.push(`Duration ${probe.format.duration}s below minimum ${expected.minDuration}s`);
  }
  if (expected.maxDuration && probe.format.duration > expected.maxDuration) {
    errors.push(`Duration ${probe.format.duration}s above maximum ${expected.maxDuration}s`);
  }

  return { valid: errors.length === 0, errors };
}
```

---

## Appendix E: Implementation Checklist

```markdown
## A2S v1.0 Implementation Checklist

### Phase 1: Infrastructure (Week 1-2)
- [ ] **Dockerfile.a2s**
  - [ ] Add FFmpeg installation
  - [ ] Add fonts-noto packages
  - [ ] Verify FFmpeg in container
  - [ ] Add node-av dependency
- [ ] **docker-compose.yml**
  - [ ] Add video_outputs volume
  - [ ] Add video_assets volume
  - [ ] Configure A2S service
- [ ] **Core Types**
  - [ ] Create `server/src/a2s/types.ts`
  - [ ] Define CompositionSchema (Zod)
  - [ ] Define RenderRequestSchema
  - [ ] Define RenderResponse types
- [ ] **JSON-RPC Handler**
  - [ ] Create `server/src/a2s/handler.ts`
  - [ ] Implement method routing
  - [ ] Add error handling
- [ ] **Elysia Server**
  - [ ] Create `server/src/a2s/server.ts`
  - [ ] Add /a2s POST endpoint
  - [ ] Add /.well-known/a2s-card.json
  - [ ] Add /a2s/render/:id/stream (SSE)

### Phase 2: FFmpeg Integration (Week 2-3)
- [ ] **FFmpeg Pipeline**
  - [ ] Create `server/src/a2s/ffmpeg/pipeline.ts` (node-av)
  - [ ] Implement stitchFrames()
  - [ ] Implement extractFrames()
  - [ ] Add hardware acceleration detection
- [ ] **FFmpeg Fallback**
  - [ ] Create `server/src/a2s/ffmpeg/child-process.ts`
  - [ ] Implement execute() with progress parsing
  - [ ] Implement stitchFrames()
  - [ ] Implement buildFilterComplex()
- [ ] **Unified Pipeline**
  - [ ] Create `server/src/a2s/ffmpeg/unified.ts`
  - [ ] Auto-switch on node-av failure
- [ ] **Audio Processing**
  - [ ] Create `server/src/a2s/ffmpeg/audio.ts`
  - [ ] Implement mixAudio()
  - [ ] Support volume curves
  - [ ] Support fade in/out
- [ ] **Media Probe**
  - [ ] Create `server/src/a2s/ffmpeg/probe.ts`
  - [ ] Implement ffprobe()
  - [ ] Implement verifyRenderOutput()

### Phase 3: Remotion Compatibility (Week 3-4)
- [ ] **Timeline Engine**
  - [ ] Create `server/src/a2s/timeline/engine.ts`
  - [ ] Implement frameToTime() / timeToFrame()
  - [ ] Implement getActiveEvents()
  - [ ] Implement calculateSequenceTiming()
- [ ] **Animation Functions**
  - [ ] Create `server/src/a2s/animation/interpolate.ts`
  - [ ] Create `server/src/a2s/animation/spring.ts`
  - [ ] Create `server/src/a2s/animation/easing.ts`
- [ ] **Asset Management**
  - [ ] Create `server/src/a2s/assets/manager.ts`
  - [ ] Create `server/src/a2s/assets/fonts.ts`
  - [ ] Create `server/src/a2s/assets/resolver.ts`
- [ ] **Lottie Support**
  - [ ] Create `server/src/a2s/renderer/components/lottie.ts`
  - [ ] Implement LottieRenderer class
  - [ ] Test with sample Lottie JSON
- [ ] **Tailwind Support**
  - [ ] Create `server/src/a2s/renderer/styles/tailwind.ts`
  - [ ] Implement compileTailwindCSS()
  - [ ] Test with sample Tailwind classes

### Phase 4: Advanced Features (Week 4-5)
- [ ] **Caption Rendering**
  - [ ] Implement SRT parser
  - [ ] Implement VTT parser
  - [ ] Add caption overlay component
- [ ] **Chart Rendering**
  - [ ] Implement SVG bar chart
  - [ ] Implement SVG pie chart
  - [ ] Frame-based animation support
- [ ] **3D Rendering (Optional)**
  - [ ] Create `server/src/a2s/renderer/components/three.ts`
  - [ ] Implement ThreeJSRenderer with Puppeteer
  - [ ] Document performance implications
- [ ] **Intent Routing**
  - [ ] Create `server/src/a2s/intent/router.ts`
  - [ ] Implement detectIntent()
  - [ ] Implement routeByIntent()

### Phase 5: Production Hardening (Week 5-6)
- [ ] **Job Queue**
  - [ ] Create `server/src/a2s/jobs/queue.ts`
  - [ ] Integrate with NATS JetStream
  - [ ] Implement worker processing
- [ ] **Persistence**
  - [ ] Create `server/sql/013_a2s_system.sql`
  - [ ] Run migration
  - [ ] Implement PostgresStore
- [ ] **Caching**
  - [ ] Implement Redis composition cache
  - [ ] Implement Redis asset cache
- [ ] **Monitoring**
  - [ ] Add OpenTelemetry instrumentation
  - [ ] Add render metrics (duration, size, fps)
  - [ ] Add error tracking

### Testing & Verification
- [ ] **Unit Tests**
  - [ ] FFmpeg argument generation
  - [ ] Timeline calculations
  - [ ] Animation functions
- [ ] **Integration Tests**
  - [ ] Frame extraction (5s video → 5 frames @ 1fps)
  - [ ] Video rendering (images → MP4)
  - [ ] Lottie rendering
- [ ] **Manual Verification**
  - [ ] Container build
  - [ ] Stack startup
  - [ ] Basic operations
  - [ ] Output verification with ffprobe
```

---

*Document Version: 1.1*
*Last Updated: 2026-01-26*
*Author: LiquidCrypto A2S Planning*
