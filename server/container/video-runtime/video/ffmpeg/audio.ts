/**
 * FFmpeg Audio Processing
 *
 * Audio mixing, manipulation, and synchronization for video compositions.
 */

import { FFmpegChildProcess } from './child-process.js';
import type { FFmpegProgress } from '../types.js';

export interface AudioTrack {
  path: string;
  startFrame: number;
  endFrame?: number;
  volume: number | ((frame: number) => number);
  fadeIn?: number; // frames
  fadeOut?: number; // frames
  playbackRate?: number;
  loop?: boolean;
}

export interface AudioMixOptions {
  tracks: AudioTrack[];
  fps: number;
  durationInFrames: number;
  outputPath: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: string;
}

export interface VolumeKeyframe {
  frame: number;
  volume: number;
}

/**
 * Audio processor for mixing and manipulating audio tracks.
 */
export class AudioProcessor {
  private ffmpeg: FFmpegChildProcess;

  constructor(ffmpegPath?: string) {
    this.ffmpeg = new FFmpegChildProcess(ffmpegPath);
  }

  /**
   * Mix multiple audio tracks into a single output.
   */
  async mixAudio(
    options: AudioMixOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<string> {
    const {
      tracks,
      fps,
      durationInFrames,
      outputPath,
      sampleRate = 48000,
      channels = 2,
      bitrate = '192k',
    } = options;

    const duration = durationInFrames / fps;

    // Build FFmpeg command
    const args: string[] = [];

    // Add inputs
    for (const track of tracks) {
      args.push('-i', track.path);
    }

    // Build filter complex
    const filters: string[] = [];
    const mixInputs: string[] = [];

    tracks.forEach((track, i) => {
      const startTime = track.startFrame / fps;
      const endTime = track.endFrame ? track.endFrame / fps : duration;
      const trackDuration = endTime - startTime;

      let filterChain = `[${i}:a]`;
      const filterParts: string[] = [];

      // Apply playback rate
      if (track.playbackRate && track.playbackRate !== 1) {
        // atempo can only handle 0.5 to 2.0, chain for larger changes
        let rate = track.playbackRate;
        while (rate < 0.5) {
          filterParts.push('atempo=0.5');
          rate *= 2;
        }
        while (rate > 2.0) {
          filterParts.push('atempo=2.0');
          rate /= 2;
        }
        if (rate !== 1) {
          filterParts.push(`atempo=${rate}`);
        }
      }

      // Apply fade in
      if (track.fadeIn) {
        const fadeInDuration = track.fadeIn / fps;
        filterParts.push(`afade=t=in:st=0:d=${fadeInDuration}`);
      }

      // Apply fade out
      if (track.fadeOut) {
        const fadeOutDuration = track.fadeOut / fps;
        const fadeOutStart = trackDuration - fadeOutDuration;
        filterParts.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
      }

      // Apply volume
      const volume = typeof track.volume === 'number' ? track.volume : 1;
      if (volume !== 1) {
        filterParts.push(`volume=${volume}`);
      }

      // Apply delay (adelay uses milliseconds)
      const delayMs = Math.round(startTime * 1000);
      if (delayMs > 0) {
        filterParts.push(`adelay=${delayMs}|${delayMs}`);
      }

      // Apply looping if needed
      if (track.loop && track.endFrame) {
        const loopDuration = endTime - startTime;
        filterParts.push(`aloop=loop=-1:size=${Math.ceil(loopDuration * sampleRate)}`);
      }

      // Build the filter chain
      if (filterParts.length > 0) {
        filterChain += filterParts.join(',');
      } else {
        filterChain += 'anull';
      }

      filterChain += `[a${i}]`;
      filters.push(filterChain);
      mixInputs.push(`[a${i}]`);
    });

    // Mix all tracks
    if (mixInputs.length > 1) {
      filters.push(
        `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0[aout]`
      );
    } else if (mixInputs.length === 1) {
      // Single track, just rename
      const lastFilter = filters[filters.length - 1];
      filters[filters.length - 1] = lastFilter.replace(`[a0]`, '[aout]');
    }

    const filterComplex = filters.join(';');

    args.push('-filter_complex', filterComplex);
    args.push('-map', '[aout]');

    // Output settings
    args.push('-ar', String(sampleRate));
    args.push('-ac', String(channels));
    args.push('-b:a', bitrate);
    args.push('-t', String(duration));
    args.push(outputPath);

    await this.ffmpeg.execute(args, onProgress);

    return outputPath;
  }

  /**
   * Apply volume keyframes to an audio file.
   */
  async applyVolumeKeyframes(
    inputPath: string,
    outputPath: string,
    keyframes: VolumeKeyframe[],
    fps: number
  ): Promise<string> {
    if (keyframes.length === 0) {
      throw new Error('At least one keyframe is required');
    }

    // Sort keyframes by frame
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

    // Build volume expression
    // FFmpeg volume filter expression: volume='if(lt(t,1),t,1)'
    const expressions: string[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const start = sorted[i];
      const end = sorted[i + 1];
      const startTime = start.frame / fps;
      const endTime = end.frame / fps;
      const duration = endTime - startTime;

      // Linear interpolation between keyframes
      // volume = startVol + (endVol - startVol) * ((t - startTime) / duration)
      const expr = `if(between(t,${startTime},${endTime}),${start.volume}+(${end.volume}-${start.volume})*((t-${startTime})/${duration})`;
      expressions.push(expr);
    }

    // Handle before first keyframe
    const firstTime = sorted[0].frame / fps;
    expressions.unshift(`if(lt(t,${firstTime}),${sorted[0].volume}`);

    // Handle after last keyframe
    const last = sorted[sorted.length - 1];
    expressions.push(`${last.volume}`);

    // Close all conditionals
    let volumeExpr = expressions.join(',');
    volumeExpr += ')'.repeat(sorted.length);

    const args = [
      '-i',
      inputPath,
      '-af',
      `volume='${volumeExpr}'`,
      outputPath,
    ];

    await this.ffmpeg.execute(args);

    return outputPath;
  }

  /**
   * Extract audio from a video file.
   */
  async extractAudio(
    videoPath: string,
    outputPath: string,
    options: {
      format?: 'mp3' | 'aac' | 'wav' | 'flac';
      bitrate?: string;
      sampleRate?: number;
    } = {}
  ): Promise<string> {
    const { format = 'aac', bitrate = '192k', sampleRate } = options;

    const args = ['-i', videoPath, '-vn'];

    if (format === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
    } else if (format === 'aac') {
      args.push('-c:a', 'aac', '-b:a', bitrate);
    } else if (format === 'wav') {
      args.push('-c:a', 'pcm_s16le');
    } else if (format === 'flac') {
      args.push('-c:a', 'flac');
    }

    if (sampleRate) {
      args.push('-ar', String(sampleRate));
    }

    args.push(outputPath);

    await this.ffmpeg.execute(args);

    return outputPath;
  }

  /**
   * Normalize audio volume.
   */
  async normalizeAudio(
    inputPath: string,
    outputPath: string,
    targetLoudness: number = -14 // LUFS
  ): Promise<string> {
    // Two-pass loudness normalization
    // First pass: analyze
    const analyzeArgs = [
      '-i',
      inputPath,
      '-af',
      `loudnorm=I=${targetLoudness}:TP=-1.5:LRA=11:print_format=json`,
      '-f',
      'null',
      '-',
    ];

    // Note: In production, parse the loudnorm output to get measured values
    // For simplicity, using single-pass dynamic normalization
    const normalizeArgs = [
      '-i',
      inputPath,
      '-af',
      `loudnorm=I=${targetLoudness}:TP=-1.5:LRA=11`,
      outputPath,
    ];

    await this.ffmpeg.execute(normalizeArgs);

    return outputPath;
  }

  /**
   * Apply audio effects.
   */
  async applyEffects(
    inputPath: string,
    outputPath: string,
    effects: {
      reverb?: { roomSize?: number; damping?: number; wetLevel?: number };
      equalizer?: Array<{ frequency: number; gain: number; width?: number }>;
      compressor?: { threshold?: number; ratio?: number; attack?: number; release?: number };
      lowpass?: number;
      highpass?: number;
    }
  ): Promise<string> {
    const filters: string[] = [];

    // Equalizer
    if (effects.equalizer && effects.equalizer.length > 0) {
      for (const eq of effects.equalizer) {
        const width = eq.width || 1;
        filters.push(`equalizer=f=${eq.frequency}:g=${eq.gain}:w=${width}`);
      }
    }

    // Low pass filter
    if (effects.lowpass) {
      filters.push(`lowpass=f=${effects.lowpass}`);
    }

    // High pass filter
    if (effects.highpass) {
      filters.push(`highpass=f=${effects.highpass}`);
    }

    // Compressor
    if (effects.compressor) {
      const { threshold = -20, ratio = 4, attack = 20, release = 250 } = effects.compressor;
      filters.push(
        `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}`
      );
    }

    // Reverb (using aecho as simple reverb approximation)
    if (effects.reverb) {
      const { roomSize = 0.5, damping = 0.5, wetLevel = 0.3 } = effects.reverb;
      const delay = Math.round(roomSize * 100);
      const decay = 1 - damping;
      filters.push(`aecho=0.8:${wetLevel}:${delay}:${decay}`);
    }

    if (filters.length === 0) {
      throw new Error('At least one effect is required');
    }

    const args = ['-i', inputPath, '-af', filters.join(','), outputPath];

    await this.ffmpeg.execute(args);

    return outputPath;
  }

  /**
   * Generate silence audio.
   */
  async generateSilence(
    outputPath: string,
    duration: number,
    options: {
      sampleRate?: number;
      channels?: number;
    } = {}
  ): Promise<string> {
    const { sampleRate = 48000, channels = 2 } = options;

    const args = [
      '-f',
      'lavfi',
      '-i',
      `anullsrc=r=${sampleRate}:cl=${channels === 1 ? 'mono' : 'stereo'}`,
      '-t',
      String(duration),
      outputPath,
    ];

    await this.ffmpeg.execute(args);

    return outputPath;
  }

  /**
   * Generate a test tone.
   */
  async generateTone(
    outputPath: string,
    duration: number,
    options: {
      frequency?: number;
      volume?: number;
      sampleRate?: number;
    } = {}
  ): Promise<string> {
    const { frequency = 440, volume = 0.5, sampleRate = 48000 } = options;

    const args = [
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=${frequency}:sample_rate=${sampleRate}`,
      '-af',
      `volume=${volume}`,
      '-t',
      String(duration),
      outputPath,
    ];

    await this.ffmpeg.execute(args);

    return outputPath;
  }
}
