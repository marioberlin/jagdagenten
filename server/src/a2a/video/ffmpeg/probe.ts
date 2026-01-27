/**
 * FFprobe Media Analysis
 *
 * Media file analysis and validation using ffprobe.
 */

import { spawn } from 'child_process';
import type { ProbeResult } from '../types.js';

/**
 * Probe a media file to get format and stream information.
 */
export async function ffprobe(
  filePath: string,
  ffprobePath: string = 'ffprobe'
): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    const proc = spawn(ffprobePath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve({
            format: {
              filename: result.format?.filename || '',
              format_name: result.format?.format_name || '',
              duration: parseFloat(result.format?.duration || '0'),
              size: parseInt(result.format?.size || '0'),
              bit_rate: parseInt(result.format?.bit_rate || '0'),
            },
            streams: (result.streams || []).map((s: Record<string, unknown>) => ({
              index: s.index as number,
              codec_type: s.codec_type as 'video' | 'audio' | 'subtitle',
              codec_name: s.codec_name as string,
              width: s.width as number | undefined,
              height: s.height as number | undefined,
              r_frame_rate: s.r_frame_rate as string | undefined,
              avg_frame_rate: s.avg_frame_rate as string | undefined,
              sample_rate: s.sample_rate as string | undefined,
              channels: s.channels as number | undefined,
              duration: s.duration as string | undefined,
            })),
          });
        } catch (err) {
          reject(new Error(`Failed to parse ffprobe output: ${err}`));
        }
      } else {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start ffprobe: ${err.message}`));
    });
  });
}

/**
 * Get video duration in seconds.
 */
export async function getVideoDuration(
  filePath: string,
  ffprobePath?: string
): Promise<number> {
  const result = await ffprobe(filePath, ffprobePath);
  return result.format.duration;
}

/**
 * Get audio duration in seconds.
 */
export async function getAudioDuration(
  filePath: string,
  ffprobePath?: string
): Promise<number> {
  const result = await ffprobe(filePath, ffprobePath);

  // Try to get duration from audio stream first
  const audioStream = result.streams.find((s) => s.codec_type === 'audio');
  if (audioStream?.duration) {
    return parseFloat(audioStream.duration);
  }

  return result.format.duration;
}

/**
 * Get video dimensions.
 */
export async function getVideoDimensions(
  filePath: string,
  ffprobePath?: string
): Promise<{ width: number; height: number }> {
  const result = await ffprobe(filePath, ffprobePath);
  const videoStream = result.streams.find((s) => s.codec_type === 'video');

  if (!videoStream || !videoStream.width || !videoStream.height) {
    throw new Error('No video stream found or missing dimensions');
  }

  return {
    width: videoStream.width,
    height: videoStream.height,
  };
}

/**
 * Get video frame rate.
 */
export async function getVideoFps(
  filePath: string,
  ffprobePath?: string
): Promise<number> {
  const result = await ffprobe(filePath, ffprobePath);
  const videoStream = result.streams.find((s) => s.codec_type === 'video');

  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Parse frame rate string (e.g., "30/1" or "30000/1001")
  const rateStr = videoStream.r_frame_rate || videoStream.avg_frame_rate;
  if (!rateStr) {
    throw new Error('No frame rate information found');
  }

  const [num, den] = rateStr.split('/').map(Number);
  return den ? num / den : num;
}

/**
 * Get total frame count.
 */
export async function getFrameCount(
  filePath: string,
  ffprobePath?: string
): Promise<number> {
  const [duration, fps] = await Promise.all([
    getVideoDuration(filePath, ffprobePath),
    getVideoFps(filePath, ffprobePath),
  ]);

  return Math.ceil(duration * fps);
}

/**
 * Check if a codec/format is supported for decoding.
 */
export async function canDecode(
  codec: string,
  ffmpegPath: string = 'ffmpeg'
): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ['-decoders'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let output = '';
    proc.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('close', () => {
      resolve(output.toLowerCase().includes(codec.toLowerCase()));
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Check if a codec is supported for encoding.
 */
export async function canEncode(
  codec: string,
  ffmpegPath: string = 'ffmpeg'
): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ['-encoders'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let output = '';
    proc.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('close', () => {
      resolve(output.toLowerCase().includes(codec.toLowerCase()));
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Check if hardware acceleration is available.
 */
export async function checkHardwareAcceleration(
  ffmpegPath: string = 'ffmpeg'
): Promise<{
  cuda: boolean;
  vaapi: boolean;
  videotoolbox: boolean;
  qsv: boolean;
}> {
  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ['-hwaccels'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let output = '';
    proc.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('close', () => {
      const lower = output.toLowerCase();
      resolve({
        cuda: lower.includes('cuda') || lower.includes('nvenc'),
        vaapi: lower.includes('vaapi'),
        videotoolbox: lower.includes('videotoolbox'),
        qsv: lower.includes('qsv'),
      });
    });

    proc.on('error', () => {
      resolve({
        cuda: false,
        vaapi: false,
        videotoolbox: false,
        qsv: false,
      });
    });
  });
}

/**
 * Verify render output matches expected parameters.
 */
export async function verifyRenderOutput(
  outputPath: string,
  expected: {
    format?: string;
    codec?: string;
    width?: number;
    height?: number;
    minDuration?: number;
    maxDuration?: number;
    fps?: number;
  },
  ffprobePath?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const probe = await ffprobe(outputPath, ffprobePath);

    // Check format
    if (expected.format && !probe.format.format_name.includes(expected.format)) {
      errors.push(
        `Expected format "${expected.format}", got "${probe.format.format_name}"`
      );
    }

    // Check video stream
    const videoStream = probe.streams.find((s) => s.codec_type === 'video');
    if (videoStream) {
      if (expected.codec && videoStream.codec_name !== expected.codec) {
        errors.push(
          `Expected codec "${expected.codec}", got "${videoStream.codec_name}"`
        );
      }
      if (expected.width && videoStream.width !== expected.width) {
        errors.push(`Expected width ${expected.width}, got ${videoStream.width}`);
      }
      if (expected.height && videoStream.height !== expected.height) {
        errors.push(`Expected height ${expected.height}, got ${videoStream.height}`);
      }
      if (expected.fps && videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        const actualFps = den ? num / den : num;
        if (Math.abs(actualFps - expected.fps) > 0.1) {
          errors.push(`Expected fps ${expected.fps}, got ${actualFps.toFixed(2)}`);
        }
      }
    } else if (expected.codec || expected.width || expected.height) {
      errors.push('No video stream found');
    }

    // Check duration
    if (expected.minDuration && probe.format.duration < expected.minDuration) {
      errors.push(
        `Duration ${probe.format.duration}s below minimum ${expected.minDuration}s`
      );
    }
    if (expected.maxDuration && probe.format.duration > expected.maxDuration) {
      errors.push(
        `Duration ${probe.format.duration}s above maximum ${expected.maxDuration}s`
      );
    }
  } catch (err) {
    errors.push(`Failed to probe file: ${err}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get comprehensive media info.
 */
export async function getMediaInfo(
  filePath: string,
  ffprobePath?: string
): Promise<{
  type: 'video' | 'audio' | 'image' | 'unknown';
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  audioCodec?: string;
  channels?: number;
  sampleRate?: number;
  bitRate?: number;
  format: string;
  fileSize: number;
}> {
  const probe = await ffprobe(filePath, ffprobePath);

  const videoStream = probe.streams.find((s) => s.codec_type === 'video');
  const audioStream = probe.streams.find((s) => s.codec_type === 'audio');

  let type: 'video' | 'audio' | 'image' | 'unknown' = 'unknown';
  if (videoStream && probe.format.duration > 0) {
    type = 'video';
  } else if (videoStream && probe.format.duration === 0) {
    type = 'image';
  } else if (audioStream) {
    type = 'audio';
  }

  let fps: number | undefined;
  if (videoStream?.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
    fps = den ? num / den : num;
  }

  return {
    type,
    duration: probe.format.duration || undefined,
    width: videoStream?.width,
    height: videoStream?.height,
    fps,
    codec: videoStream?.codec_name,
    audioCodec: audioStream?.codec_name,
    channels: audioStream?.channels,
    sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : undefined,
    bitRate: probe.format.bit_rate || undefined,
    format: probe.format.format_name,
    fileSize: probe.format.size,
  };
}
