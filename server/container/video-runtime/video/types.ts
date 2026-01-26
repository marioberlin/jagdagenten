/**
 * A2A Video v1.0 Types
 *
 * Remotion-compatible video rendering server types.
 * Based on Remotion composition/rendering concepts mapped to FFmpeg pipeline.
 */

import { z } from 'zod';

// ============================================================================
// Protocol Constants
// ============================================================================

export const A2A_VIDEO_VERSION = '1.0.0';
export const A2A_VIDEO_PROTOCOL_VERSION = '1.0';

// ============================================================================
// Composition Schema (Remotion-compatible)
// ============================================================================

export const CompositionSchema = z.object({
  id: z.string().min(1),
  width: z.number().int().positive().max(7680), // Max 8K
  height: z.number().int().positive().max(4320),
  fps: z.number().positive().max(120),
  durationInFrames: z.number().int().positive(),
  defaultProps: z.record(z.unknown()).optional(),
  schema: z.any().optional(), // Zod schema definition for input validation
});

export type Composition = z.infer<typeof CompositionSchema>;

// ============================================================================
// Sequence/Series Schemas (Remotion-compatible)
// ============================================================================

export const SequenceSchema = z.object({
  from: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive().optional(),
  name: z.string().optional(),
  layout: z.enum(['absolute-fill', 'none']).default('absolute-fill'),
  premountFor: z.number().int().nonnegative().default(0),
});

export type Sequence = z.infer<typeof SequenceSchema>;

export const SeriesItemSchema = z.object({
  durationInFrames: z.number().int().positive(),
  offset: z.number().int().default(0),
  layout: z.enum(['absolute-fill', 'none']).default('absolute-fill'),
});

export const SeriesSchema = z.object({
  sequences: z.array(SeriesItemSchema),
});

export type Series = z.infer<typeof SeriesSchema>;
export type SeriesItem = z.infer<typeof SeriesItemSchema>;

// ============================================================================
// Render Request Schema
// ============================================================================

export const CodecSchema = z.enum(['h264', 'h265', 'vp8', 'vp9', 'prores']);
export type Codec = z.infer<typeof CodecSchema>;

export const OutputFormatSchema = z.enum(['mp4', 'webm', 'gif', 'mov', 'png-sequence']);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

export const ImageFormatSchema = z.enum(['jpeg', 'png']);
export type ImageFormat = z.infer<typeof ImageFormatSchema>;

export const PresetSchema = z.enum([
  'ultrafast',
  'superfast',
  'veryfast',
  'faster',
  'fast',
  'medium',
  'slow',
  'slower',
  'veryslow',
]);
export type Preset = z.infer<typeof PresetSchema>;

export const QualitySettingsSchema = z.object({
  crf: z.number().int().min(0).max(63).optional(),
  videoBitrate: z.string().optional(), // e.g., "5M", "10M"
  audioBitrate: z.string().optional(), // e.g., "192k", "320k"
  preset: PresetSchema.default('medium'),
});

export type QualitySettings = z.infer<typeof QualitySettingsSchema>;

export const ResolutionSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  scale: z.number().positive().max(16).default(1),
});

export type Resolution = z.infer<typeof ResolutionSchema>;

export const RenderRequestSchema = z.object({
  compositionId: z.string().min(1),
  inputProps: z.record(z.unknown()).optional(),
  outputFormat: OutputFormatSchema.default('mp4'),
  codec: CodecSchema.default('h264'),
  quality: QualitySettingsSchema.optional(),
  resolution: ResolutionSchema.optional(),
  frameRange: z.tuple([z.number().int().nonnegative(), z.number().int().positive()]).optional(),
  muted: z.boolean().default(false),
  imageFormat: ImageFormatSchema.default('jpeg'),
  jpegQuality: z.number().int().min(0).max(100).default(80),
  concurrency: z.number().int().positive().max(32).default(4),
  hardwareAcceleration: z.boolean().default(false),
  async: z.boolean().default(true),
  webhookUrl: z.string().url().optional(),
});

export type RenderRequest = z.infer<typeof RenderRequestSchema>;

// ============================================================================
// Render Status Types
// ============================================================================

export type RenderStatus =
  | 'queued'
  | 'initializing'
  | 'rendering'
  | 'encoding'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export const TERMINAL_RENDER_STATES: RenderStatus[] = ['completed', 'failed', 'cancelled'];

export interface RenderProgress {
  status: RenderStatus;
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

export interface RenderResponse {
  renderId: string;
  status: RenderStatus;
  progress?: number;
  outputUrl?: string;
  outputPath?: string;
  error?: string;
  estimatedTimeRemaining?: number;
  metadata?: RenderMetadata;
}

export interface RenderMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
  format: string;
  fileSize: number;
  createdAt: string;
}

// ============================================================================
// Render Still Request Schema
// ============================================================================

export const RenderStillRequestSchema = z.object({
  compositionId: z.string().min(1),
  inputProps: z.record(z.unknown()).optional(),
  frame: z.number().int().nonnegative().default(0),
  imageFormat: ImageFormatSchema.default('png'),
  jpegQuality: z.number().int().min(0).max(100).default(80),
  resolution: ResolutionSchema.optional(),
});

export type RenderStillRequest = z.infer<typeof RenderStillRequestSchema>;

// ============================================================================
// Composition Registration Schema
// ============================================================================

export const CompositionRegistrationSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  durationInFrames: z.number().int().positive(),
  defaultProps: z.record(z.unknown()).optional(),
  schema: z.any().optional(),
  sourceCode: z.string().optional(), // Scene definition code
  ownerType: z.enum(['app', 'agent', 'user']),
  ownerId: z.string().min(1),
});

export type CompositionRegistration = z.infer<typeof CompositionRegistrationSchema>;

// ============================================================================
// Asset Types
// ============================================================================

export type AssetType = 'image' | 'video' | 'audio' | 'font' | 'lottie' | 'data';

export const AssetUploadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['image', 'video', 'audio', 'font', 'lottie', 'data']),
  mimeType: z.string().optional(),
  data: z.string().optional(), // Base64 encoded
  url: z.string().url().optional(),
  ownerType: z.enum(['app', 'agent', 'user']),
  ownerId: z.string().min(1),
});

export type AssetUpload = z.infer<typeof AssetUploadSchema>;

export interface Asset {
  id: string;
  assetId: string;
  name: string;
  type: AssetType;
  mimeType?: string;
  filePath?: string;
  publicUrl?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  duration?: number;
  metadata?: Record<string, unknown>;
  ownerType: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Capabilities Response
// ============================================================================

export interface VideoCapabilities {
  version: string;
  protocolVersion: string;
  supportedCodecs: Codec[];
  supportedFormats: OutputFormat[];
  maxDuration: number; // seconds
  maxResolution: { width: number; height: number };
  hardwareAcceleration: boolean;
  maxConcurrentRenders: number;
  features: {
    audio: boolean;
    transitions: boolean;
    threeD: boolean;
    lottie: boolean;
    captions: boolean;
    tailwind: boolean;
    charts: boolean;
  };
}

// ============================================================================
// JSON-RPC Types
// ============================================================================

export interface JsonRpcRequest<T = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: T;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// Standard JSON-RPC error codes
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
  // A2A Video-specific errors
  RENDER_NOT_FOUND: { code: -32001, message: 'Render not found' },
  RENDER_NOT_CANCELABLE: { code: -32002, message: 'Render cannot be cancelled' },
  COMPOSITION_NOT_FOUND: { code: -32003, message: 'Composition not found' },
  ASSET_NOT_FOUND: { code: -32004, message: 'Asset not found' },
  UNSUPPORTED_CODEC: { code: -32005, message: 'Unsupported codec' },
  UNSUPPORTED_FORMAT: { code: -32006, message: 'Unsupported format' },
  RENDER_FAILED: { code: -32007, message: 'Render failed' },
  VALIDATION_ERROR: { code: -32008, message: 'Validation error' },
  RATE_LIMIT_EXCEEDED: { code: -32009, message: 'Rate limit exceeded' },
  RESOURCE_EXHAUSTED: { code: -32010, message: 'Resource exhausted' },
} as const;

// ============================================================================
// A2A Video Agent Card (for A2A compatibility)
// ============================================================================

export interface VideoAgentCard {
  name: string;
  version: string;
  protocolVersions: string[];
  description: string;
  supportedInterfaces: Array<{
    url: string;
    protocolBinding: 'JSONRPC' | 'HTTP+JSON';
  }>;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples?: string[];
  }>;
  provider?: {
    organization: string;
    url?: string;
  };
}

// ============================================================================
// Timeline Event Types
// ============================================================================

export type TimelineEventType = 'sequence' | 'transition' | 'audio' | 'video' | 'image' | 'text' | 'lottie';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
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

// ============================================================================
// FFmpeg Types
// ============================================================================

export interface FrameStitchOptions {
  inputPattern: string; // e.g., 'frame-%05d.png'
  outputPath: string;
  fps: number;
  codec: Codec;
  crf?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  audioPath?: string;
  hardwareAcceleration?: boolean;
  preset?: Preset;
}

export interface FFmpegProgress {
  percent: number;
  currentTime: number;
  totalTime: number;
  fps?: number;
  speed?: number;
}

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
    codec_type: 'video' | 'audio' | 'subtitle';
    codec_name: string;
    width?: number;
    height?: number;
    r_frame_rate?: string;
    avg_frame_rate?: string;
    sample_rate?: string;
    channels?: number;
    duration?: string;
  }>;
}

// ============================================================================
// Render Job Types (for queue)
// ============================================================================

export interface RenderJob {
  id: string;
  renderId: string;
  compositionId: string;
  request: RenderRequest;
  status: RenderStatus;
  progress: number;
  outputPath?: string;
  outputUrl?: string;
  error?: string;
  containerId?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Scene/Component Types (for renderer)
// ============================================================================

export interface SceneComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[]; // Component IDs
  startFrame?: number;
  endFrame?: number;
  layer?: number;
}

export interface SceneDefinition {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  backgroundColor?: string;
  components: SceneComponent[];
  tracks: TimelineTrack[];
}

// ============================================================================
// Lottie Types
// ============================================================================

export interface LottieAsset {
  id: string;
  animationData: object;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  duration: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface VideoConfig {
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
  ffprobePath: string;
  hardwareAcceleration: boolean;
  defaultCodec: Codec;
  defaultCrf: number;

  // Container
  containerImage: string;
  warmPoolSize: number;

  // Database
  databaseUrl: string;
  redisUrl: string;
  natsUrl: string;
}

export const DEFAULT_VIDEO_CONFIG: Partial<VideoConfig> = {
  port: 8082,
  maxConcurrentRenders: 4,
  defaultTimeout: 600000, // 10 minutes
  maxDuration: 3600, // 1 hour
  maxResolution: { width: 3840, height: 2160 },
  outputDir: '/data/renders',
  tempDir: '/tmp/video',
  assetDir: '/data/assets',
  ffmpegPath: '/usr/bin/ffmpeg',
  ffprobePath: '/usr/bin/ffprobe',
  hardwareAcceleration: false,
  defaultCodec: 'h264',
  defaultCrf: 18,
  warmPoolSize: 2,
};
