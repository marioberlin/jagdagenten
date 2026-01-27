/**
 * Lottie Animation Renderer
 *
 * Renders Lottie JSON animations to frames using lottie-web and canvas.
 * Frame-accurate rendering for video composition.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Note: These dependencies need to be installed:
// bun add lottie-web canvas

export interface LottieRenderOptions {
  width: number;
  height: number;
  backgroundColor?: string;
}

export interface LottieAnimationInfo {
  totalFrames: number;
  frameRate: number;
  duration: number; // seconds
  width: number;
  height: number;
  version: string;
}

/**
 * Lottie Animation Renderer
 *
 * Renders Lottie animations frame-by-frame using canvas.
 */
export class LottieRenderer {
  private animationData: object | null = null;
  private animationInfo: LottieAnimationInfo | null = null;
  private canvas: any = null;
  private ctx: any = null;
  private animation: any = null;
  private width: number;
  private height: number;
  private backgroundColor: string;

  constructor(options: LottieRenderOptions) {
    this.width = options.width;
    this.height = options.height;
    this.backgroundColor = options.backgroundColor || 'transparent';
  }

  /**
   * Initialize with Lottie animation data.
   */
  async initialize(animationData: object): Promise<LottieAnimationInfo> {
    this.animationData = animationData;

    // Extract animation info from JSON
    const data = animationData as {
      fr?: number;
      ip?: number;
      op?: number;
      w?: number;
      h?: number;
      v?: string;
    };

    const frameRate = data.fr || 30;
    const inPoint = data.ip || 0;
    const outPoint = data.op || 60;
    const totalFrames = Math.floor(outPoint - inPoint);

    this.animationInfo = {
      totalFrames,
      frameRate,
      duration: totalFrames / frameRate,
      width: data.w || this.width,
      height: data.h || this.height,
      version: data.v || 'unknown',
    };

    // Try to initialize canvas and lottie-web
    try {
      const { createCanvas } = await import('canvas');
      this.canvas = createCanvas(this.width, this.height);
      this.ctx = this.canvas.getContext('2d');

      // Initialize lottie-web
      const lottie = await import('lottie-web');
      this.animation = lottie.default.loadAnimation({
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

      console.log(
        `[LottieRenderer] Initialized: ${totalFrames} frames @ ${frameRate}fps (${this.animationInfo.duration.toFixed(2)}s)`
      );
    } catch (error) {
      console.warn('[LottieRenderer] Canvas/lottie-web not available, using fallback');
      // Fallback mode - return info but won't render frames
    }

    return this.animationInfo;
  }

  /**
   * Render a specific frame to PNG buffer.
   */
  async renderFrame(frameNumber: number): Promise<Buffer> {
    if (!this.animation || !this.canvas || !this.ctx) {
      throw new Error('Renderer not initialized or canvas not available');
    }

    if (!this.animationInfo) {
      throw new Error('Animation not loaded');
    }

    if (frameNumber < 0 || frameNumber >= this.animationInfo.totalFrames) {
      throw new Error(
        `Frame ${frameNumber} out of range (0-${this.animationInfo.totalFrames - 1})`
      );
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background if not transparent
    if (this.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Go to specific frame
    this.animation.goToAndStop(frameNumber, true);

    // Return canvas as PNG buffer
    return this.canvas.toBuffer('image/png');
  }

  /**
   * Render all frames to a directory.
   */
  async renderAllFrames(
    outputDir: string,
    options: {
      startFrame?: number;
      endFrame?: number;
      onProgress?: (frame: number, total: number) => void;
    } = {}
  ): Promise<string[]> {
    if (!this.animationInfo) {
      throw new Error('Animation not loaded');
    }

    const startFrame = options.startFrame ?? 0;
    const endFrame = options.endFrame ?? this.animationInfo.totalFrames;
    const totalFrames = endFrame - startFrame;

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    const framePaths: string[] = [];

    for (let i = startFrame; i < endFrame; i++) {
      try {
        const buffer = await this.renderFrame(i);
        const framePath = path.join(outputDir, `frame-${String(i).padStart(5, '0')}.png`);
        await fs.writeFile(framePath, buffer);
        framePaths.push(framePath);

        if (options.onProgress) {
          options.onProgress(i - startFrame + 1, totalFrames);
        }
      } catch (error) {
        console.error(`[LottieRenderer] Failed to render frame ${i}:`, error);
        throw error;
      }
    }

    return framePaths;
  }

  /**
   * Get animation info.
   */
  getInfo(): LottieAnimationInfo | null {
    return this.animationInfo;
  }

  /**
   * Get frame at a specific time.
   */
  getFrameAtTime(timeSeconds: number): number {
    if (!this.animationInfo) return 0;
    return Math.floor(timeSeconds * this.animationInfo.frameRate);
  }

  /**
   * Get time at a specific frame.
   */
  getTimeAtFrame(frame: number): number {
    if (!this.animationInfo) return 0;
    return frame / this.animationInfo.frameRate;
  }

  /**
   * Destroy the renderer and free resources.
   */
  destroy(): void {
    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }
    this.canvas = null;
    this.ctx = null;
    this.animationData = null;
    this.animationInfo = null;
  }
}

/**
 * Create a Lottie renderer.
 */
export function createLottieRenderer(options: LottieRenderOptions): LottieRenderer {
  return new LottieRenderer(options);
}

/**
 * Load Lottie animation from file.
 */
export async function loadLottieFromFile(filePath: string): Promise<object> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load Lottie animation from URL.
 */
export async function loadLottieFromUrl(url: string): Promise<object> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Lottie: ${response.status}`);
  }
  return response.json();
}

/**
 * Get Lottie animation info without initializing renderer.
 */
export function getLottieInfo(animationData: object): LottieAnimationInfo {
  const data = animationData as {
    fr?: number;
    ip?: number;
    op?: number;
    w?: number;
    h?: number;
    v?: string;
  };

  const frameRate = data.fr || 30;
  const inPoint = data.ip || 0;
  const outPoint = data.op || 60;
  const totalFrames = Math.floor(outPoint - inPoint);

  return {
    totalFrames,
    frameRate,
    duration: totalFrames / frameRate,
    width: data.w || 0,
    height: data.h || 0,
    version: data.v || 'unknown',
  };
}
