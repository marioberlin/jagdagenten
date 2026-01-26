/**
 * FFmpeg Child Process
 *
 * FFmpeg execution via child_process spawn.
 * Reliable fallback implementation with progress parsing.
 */

import { spawn, type ChildProcess } from 'child_process';
import type { FrameStitchOptions, FFmpegProgress, Codec, Preset } from '../types.js';

export interface FFmpegExecuteResult {
  exitCode: number;
  duration: number;
  stderr: string;
}

export interface FilterComplexOptions {
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
    x: number | string;
    y: number | string;
    fontSize: number;
    fontColor: string;
    fontFile?: string;
  };
  trim?: {
    start?: number;
    end?: number;
  };
  fade?: {
    type: 'in' | 'out';
    startFrame: number;
    durationFrames: number;
  };
}

/**
 * FFmpeg child process executor.
 * Uses spawn for reliable process management with progress tracking.
 */
export class FFmpegChildProcess {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor(ffmpegPath: string = 'ffmpeg', ffprobePath: string = 'ffprobe') {
    this.ffmpegPath = ffmpegPath;
    this.ffprobePath = ffprobePath;
  }

  /**
   * Execute FFmpeg command with progress tracking.
   */
  async execute(
    args: string[],
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<FFmpegExecuteResult> {
    return new Promise((resolve, reject) => {
      // Add -y (overwrite) and progress output
      const fullArgs = ['-y', '-progress', 'pipe:1', ...args];

      const ffmpeg = spawn(this.ffmpegPath, fullArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let duration = 0;
      let currentTime = 0;
      let stderr = '';

      // Parse progress from stdout (FFmpeg's -progress pipe:1 output)
      ffmpeg.stdout?.on('data', (data: Buffer) => {
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
          } else if (line.startsWith('fps=')) {
            const fps = parseFloat(line.split('=')[1]);
            if (onProgress && fps > 0) {
              onProgress({
                percent: Math.min(100, (currentTime / duration) * 100),
                currentTime,
                totalTime: duration,
                fps,
              });
            }
          } else if (line.startsWith('speed=')) {
            const speedStr = line.split('=')[1].replace('x', '');
            const speed = parseFloat(speedStr);
            if (onProgress && !isNaN(speed)) {
              onProgress({
                percent: Math.min(100, (currentTime / duration) * 100),
                currentTime,
                totalTime: duration,
                speed,
              });
            }
          }
        }
      });

      // Parse duration and other info from stderr
      ffmpeg.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;

        // Parse duration from input file info
        const durationMatch = text.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (durationMatch) {
          const [, h, m, s] = durationMatch;
          duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({ exitCode: code, duration, stderr });
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`));
      });
    });
  }

  /**
   * Stitch image frames into video.
   */
  async stitchFrames(
    options: FrameStitchOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<{ outputPath: string; duration: number }> {
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
      '-framerate',
      String(fps),
      '-i',
      inputPattern,
    ];

    // Add audio if provided
    if (audioPath) {
      args.push('-i', audioPath);
    }

    // Video codec settings
    args.push('-c:v', this.mapCodecName(codec));

    // Quality settings
    if (crf !== undefined) {
      args.push('-crf', String(crf));
    } else if (videoBitrate) {
      args.push('-b:v', videoBitrate);
    }

    // Preset (for x264/x265)
    if (codec === 'h264' || codec === 'h265') {
      args.push('-preset', preset);
    }

    // Audio codec (if audio input)
    if (audioPath) {
      args.push('-c:a', 'aac', '-b:a', options.audioBitrate || '192k');
    }

    // Pixel format for compatibility
    args.push('-pix_fmt', 'yuv420p');

    // Output
    args.push(outputPath);

    const result = await this.execute(args, onProgress);

    return {
      outputPath,
      duration: result.duration,
    };
  }

  /**
   * Extract frames from video.
   */
  async extractFrames(
    inputPath: string,
    outputPattern: string,
    fps?: number
  ): Promise<string[]> {
    const args: string[] = ['-i', inputPath];

    if (fps) {
      args.push('-vf', `fps=${fps}`);
    }

    args.push(outputPattern);

    await this.execute(args);

    // Return pattern (caller should glob for actual files)
    return [outputPattern];
  }

  /**
   * Trim video to specific time range.
   */
  async trim(
    inputPath: string,
    outputPath: string,
    startSeconds?: number,
    endSeconds?: number,
    codec: Codec = 'h264'
  ): Promise<{ outputPath: string; duration: number }> {
    const args: string[] = [];

    // Seeking before input is faster
    if (startSeconds !== undefined) {
      args.push('-ss', String(startSeconds));
    }

    args.push('-i', inputPath);

    // Duration after input
    if (endSeconds !== undefined && startSeconds !== undefined) {
      args.push('-t', String(endSeconds - startSeconds));
    } else if (endSeconds !== undefined) {
      args.push('-t', String(endSeconds));
    }

    args.push('-c:v', this.mapCodecName(codec));
    args.push('-c:a', 'copy');
    args.push(outputPath);

    const result = await this.execute(args);

    return {
      outputPath,
      duration: result.duration,
    };
  }

  /**
   * Concatenate multiple videos.
   */
  async concat(
    inputPaths: string[],
    outputPath: string,
    codec: Codec = 'h264'
  ): Promise<{ outputPath: string; duration: number }> {
    // Create concat filter
    const filterInputs = inputPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');
    const filterComplex = `${filterInputs}concat=n=${inputPaths.length}:v=1:a=1[outv][outa]`;

    const args: string[] = [];

    // Add all inputs
    for (const path of inputPaths) {
      args.push('-i', path);
    }

    args.push(
      '-filter_complex',
      filterComplex,
      '-map',
      '[outv]',
      '-map',
      '[outa]',
      '-c:v',
      this.mapCodecName(codec),
      '-c:a',
      'aac',
      outputPath
    );

    const result = await this.execute(args);

    return {
      outputPath,
      duration: result.duration,
    };
  }

  /**
   * Add audio to video.
   */
  async addAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    options: {
      replaceAudio?: boolean;
      audioVolume?: number;
      audioDelay?: number;
    } = {}
  ): Promise<{ outputPath: string; duration: number }> {
    const { replaceAudio = true, audioVolume = 1, audioDelay = 0 } = options;

    const args: string[] = ['-i', videoPath, '-i', audioPath];

    const audioFilters: string[] = [];

    if (audioVolume !== 1) {
      audioFilters.push(`volume=${audioVolume}`);
    }

    if (audioDelay > 0) {
      audioFilters.push(`adelay=${audioDelay * 1000}|${audioDelay * 1000}`);
    }

    if (audioFilters.length > 0) {
      args.push('-af', audioFilters.join(','));
    }

    if (replaceAudio) {
      args.push('-map', '0:v', '-map', '1:a');
    } else {
      args.push(
        '-filter_complex',
        '[0:a][1:a]amix=inputs=2:duration=first[aout]',
        '-map',
        '0:v',
        '-map',
        '[aout]'
      );
    }

    args.push('-c:v', 'copy', '-c:a', 'aac', outputPath);

    const result = await this.execute(args);

    return {
      outputPath,
      duration: result.duration,
    };
  }

  /**
   * Build FFmpeg filter complex string.
   */
  buildFilterComplex(options: FilterComplexOptions): string {
    const filters: string[] = [];

    // Scale inputs
    options.inputs.forEach((input, i) => {
      if (input.scale) {
        filters.push(`[${i}:v]scale=${input.scale.width}:${input.scale.height}[v${i}]`);
      }
    });

    // Overlay composition
    if (options.overlay) {
      const { x, y, startFrame, endFrame } = options.overlay;
      const enable =
        startFrame !== undefined
          ? `:enable='between(n,${startFrame},${endFrame ?? 99999})'`
          : '';
      filters.push(`[0:v][1:v]overlay=${x}:${y}${enable}[vout]`);
    }

    // Text overlay (drawtext filter)
    if (options.text) {
      const { text, x, y, fontSize, fontColor, fontFile } = options.text;
      const font = fontFile ? `fontfile=${fontFile}:` : '';
      const escapedText = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
      filters.push(
        `drawtext=${font}text='${escapedText}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}`
      );
    }

    // Trim
    if (options.trim) {
      const trimParts: string[] = [];
      if (options.trim.start !== undefined) {
        trimParts.push(`start=${options.trim.start}`);
      }
      if (options.trim.end !== undefined) {
        trimParts.push(`end=${options.trim.end}`);
      }
      if (trimParts.length > 0) {
        filters.push(`trim=${trimParts.join(':')}`);
      }
    }

    // Fade
    if (options.fade) {
      const { type, startFrame, durationFrames } = options.fade;
      filters.push(`fade=t=${type}:st=${startFrame}:d=${durationFrames}`);
    }

    return filters.join(';');
  }

  /**
   * Convert to GIF with optimization.
   */
  async toGif(
    inputPath: string,
    outputPath: string,
    options: {
      fps?: number;
      width?: number;
      loop?: number;
    } = {}
  ): Promise<{ outputPath: string; duration: number }> {
    const { fps = 10, width = 480, loop = 0 } = options;

    // Two-pass for better quality
    const paletteArgs = [
      '-i',
      inputPath,
      '-vf',
      `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
      '-y',
      '/tmp/palette.png',
    ];

    await this.execute(paletteArgs);

    const gifArgs = [
      '-i',
      inputPath,
      '-i',
      '/tmp/palette.png',
      '-lavfi',
      `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
      '-loop',
      String(loop),
      outputPath,
    ];

    const result = await this.execute(gifArgs);

    return {
      outputPath,
      duration: result.duration,
    };
  }

  /**
   * Map codec name to FFmpeg encoder.
   */
  private mapCodecName(codec: Codec): string {
    const codecMap: Record<Codec, string> = {
      h264: 'libx264',
      h265: 'libx265',
      vp8: 'libvpx',
      vp9: 'libvpx-vp9',
      prores: 'prores_ks',
    };
    return codecMap[codec] || codec;
  }
}
