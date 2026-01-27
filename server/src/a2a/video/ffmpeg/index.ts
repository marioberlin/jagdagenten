/**
 * FFmpeg Module
 *
 * Video processing utilities using FFmpeg.
 */

export {
  FFmpegChildProcess,
  type FFmpegExecuteResult,
  type FilterComplexOptions,
} from './child-process.js';

export {
  ffprobe,
  getVideoDuration,
  getAudioDuration,
  getVideoDimensions,
  getVideoFps,
  getFrameCount,
  canDecode,
  canEncode,
  checkHardwareAcceleration,
  verifyRenderOutput,
  getMediaInfo,
} from './probe.js';

export {
  AudioProcessor,
  type AudioTrack,
  type AudioMixOptions,
  type VolumeKeyframe,
} from './audio.js';

export {
  FFmpegPipelineUnified,
  createFFmpegPipeline,
  type UnifiedPipelineOptions,
} from './unified.js';

export {
  VideoOverlayProcessor,
  hasVideoOverlays,
  extractAudioFromOverlays,
  type VideoOverlayOptions,
  type VideoOverlayResult,
} from './video-overlay.js';
