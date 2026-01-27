/**
 * Composition Renderer
 *
 * Renders composition elements to canvas frames.
 * Supports:
 * - Text with effects (fade, slide, typewriter, glow)
 * - Images with animations (fade, scale, pan)
 * - Shapes (rectangles, circles, lines)
 * - Gradients and backgrounds
 * - Progress bars and counters
 * - Charts (bar, line, pie)
 * - Lottie animations (when available)
 */

import { readFile } from 'fs/promises';
import type { CompositionState } from './video-render.js';

// ============================================================================
// Types
// ============================================================================

export type ElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'gradient'
  | 'progress'
  | 'chart'
  | 'lottie'
  | 'video'
  | 'audio'
  | 'three'
  | 'html';

export type TextEffect = 'none' | 'fade' | 'slide-up' | 'slide-down' | 'typewriter' | 'glow' | 'bounce';
export type ImageEffect = 'none' | 'fade' | 'scale' | 'pan' | 'zoom' | 'ken-burns';
export type ShapeType = 'rectangle' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'rounded-rect';
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  startFrame?: number;
  endFrame?: number;
  zIndex?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'light';
  color?: string;
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom';
  effect?: TextEffect;
  effectDuration?: number; // frames
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  stroke?: {
    color: string;
    width: number;
  };
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // file path or URL
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  effect?: ImageEffect;
  effectDuration?: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number; // for rounded-rect
  points?: { x: number; y: number }[]; // for polygon
}

export interface GradientElement extends BaseElement {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  colors: { offset: number; color: string }[];
  angle?: number; // for linear
}

export interface ProgressElement extends BaseElement {
  type: 'progress';
  style: 'bar' | 'circle' | 'dots';
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  thickness?: number;
}

export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: ChartType;
  data: { label: string; value: number; color?: string }[];
  animated?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  colors?: string[];
}

export interface LottieElement extends BaseElement {
  type: 'lottie';
  src: string; // JSON file path
  loop?: boolean;
  speed?: number;
}

export interface AudioElement extends BaseElement {
  type: 'audio';
  src: string; // file path or URL
  volume?: number; // 0-1
  fadeIn?: number; // frames to fade in
  fadeOut?: number; // frames to fade out
  playbackRate?: number; // 1 = normal, 2 = double speed, 0.5 = half speed
  loop?: boolean;
  muted?: boolean;
}

export interface VideoElement extends BaseElement {
  type: 'video';
  src: string; // file path or URL to video file
  volume?: number; // 0-1 (for video's audio track)
  muted?: boolean; // mute video's audio
  loop?: boolean; // loop video if shorter than element duration
  playbackRate?: number; // 1 = normal, 2 = 2x speed, 0.5 = half speed
  trim?: {
    start: number; // start time in seconds
    end?: number; // end time in seconds (optional)
  };
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  chromaKey?: {
    color: string; // color to key out (e.g., '#00ff00' for green screen)
    similarity?: number; // 0-1, how similar colors must be to key (default 0.3)
    blend?: number; // 0-1, edge blending (default 0.1)
  };
  filters?: VideoFilterDefinition[];
}

export interface VideoFilterDefinition {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'grayscale' | 'sepia' | 'invert';
  value?: number; // filter-specific value
}

export interface ThreeElement extends BaseElement {
  type: 'three';
  scene: ThreeSceneDefinition;
}

export interface ThreeSceneDefinition {
  backgroundColor?: string;
  camera?: {
    type: 'perspective' | 'orthographic';
    position?: [number, number, number];
    lookAt?: [number, number, number];
    fov?: number;
    zoom?: number;
  };
  lights?: Array<{
    type: 'ambient' | 'directional' | 'point' | 'spot';
    color?: string;
    intensity?: number;
    position?: [number, number, number];
  }>;
  objects?: ThreeObjectDefinition[];
}

export interface ThreeObjectDefinition {
  type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'torus' | 'text' | 'gltf';
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  material?: 'basic' | 'standard' | 'phong' | 'lambert';
  opacity?: number;
  wireframe?: boolean;
  args?: number[];
  text?: string;
  url?: string;
  animation?: {
    property: 'rotation' | 'position' | 'scale';
    axis: 'x' | 'y' | 'z';
    speed: number;
  };
}

/**
 * HTML Element
 *
 * Renders arbitrary HTML/CSS content using Puppeteer.
 * Use this for complex layouts, data visualizations, or existing React components.
 * Note: This is slower than Canvas rendering - use only when necessary.
 */
export interface HtmlElement extends BaseElement {
  type: 'html';
  /** HTML content to render (can include <style> tags) */
  html?: string;
  /** URL to load and render */
  url?: string;
  /** CSS to inject into the page */
  css?: string;
  /** JavaScript to execute before screenshot (for dynamic content) */
  script?: string;
  /** Selector to wait for before rendering (useful for dynamic content) */
  waitForSelector?: string;
  /** Time to wait in ms before rendering (for animations to settle) */
  waitTime?: number;
  /** Device scale factor for high-DPI rendering */
  deviceScaleFactor?: number;
  /** Transparent background (default: true) */
  transparent?: boolean;
  /** Tailwind CSS classes to apply to the container */
  tailwindClasses?: string;
  /** React component name to render (from registered components) */
  reactComponent?: string;
  /** Props to pass to the React component */
  reactProps?: Record<string, unknown>;
}

export type CompositionElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | GradientElement
  | ProgressElement
  | ChartElement
  | LottieElement
  | AudioElement
  | VideoElement
  | ThreeElement
  | HtmlElement;

export interface AudioTrackDefinition {
  id: string;
  src: string;
  startFrame: number;
  endFrame?: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  playbackRate?: number;
  loop?: boolean;
}

export interface VideoOverlayDefinition {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame?: number;
  zIndex?: number;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  playbackRate?: number;
  trim?: {
    start: number;
    end?: number;
  };
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  opacity?: number;
  chromaKey?: {
    color: string;
    similarity?: number;
    blend?: number;
  };
  filters?: VideoFilterDefinition[];
}

export interface CompositionDefinition {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  backgroundColor?: string;
  elements: CompositionElement[];
  audioTracks?: AudioTrackDefinition[];
  videoOverlays?: VideoOverlayDefinition[];
}

// ============================================================================
// Easing Functions
// ============================================================================

const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  elastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },
};

// ============================================================================
// Composition Renderer
// ============================================================================

export class CompositionRenderer {
  private imageCache: Map<string, any> = new Map();
  private lottieCache: Map<string, any> = new Map();

  constructor() {}

  /**
   * Render a single frame of the composition.
   */
  async renderFrame(
    ctx: any,
    composition: CompositionDefinition,
    frame: number
  ): Promise<void> {
    const { width, height, backgroundColor, elements, durationInFrames } = composition;
    const progress = frame / durationInFrames;

    // Clear and fill background
    ctx.fillStyle = backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);

    // Sort elements by zIndex
    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Render each element
    for (const element of sortedElements) {
      // Check if element is visible in this frame
      const startFrame = element.startFrame ?? 0;
      const endFrame = element.endFrame ?? durationInFrames;
      if (frame < startFrame || frame > endFrame) continue;

      // Calculate element progress (0-1 within its lifespan)
      const elementProgress = (frame - startFrame) / (endFrame - startFrame);

      // Save context state
      ctx.save();

      // Apply global element transforms
      if (element.rotation) {
        const cx = element.x + (element.width || 0) / 2;
        const cy = element.y + (element.height || 0) / 2;
        ctx.translate(cx, cy);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (element.opacity !== undefined) {
        ctx.globalAlpha = element.opacity;
      }

      // Render based on type
      switch (element.type) {
        case 'text':
          await this.renderText(ctx, element, frame, elementProgress);
          break;
        case 'image':
          await this.renderImage(ctx, element, frame, elementProgress);
          break;
        case 'shape':
          this.renderShape(ctx, element);
          break;
        case 'gradient':
          this.renderGradient(ctx, element, width, height);
          break;
        case 'progress':
          this.renderProgress(ctx, element, progress);
          break;
        case 'chart':
          this.renderChart(ctx, element, elementProgress);
          break;
        case 'lottie':
          await this.renderLottie(ctx, element, frame);
          break;
        case 'three':
          await this.renderThree(ctx, element, frame, composition.fps);
          break;
        case 'html':
          await this.renderHtml(ctx, element, frame, composition.fps);
          break;
      }

      // Restore context state
      ctx.restore();
    }
  }

  // ==========================================================================
  // Text Rendering
  // ==========================================================================

  private async renderText(
    ctx: any,
    element: TextElement,
    frame: number,
    progress: number
  ): Promise<void> {
    const {
      text,
      x,
      y,
      fontSize = 48,
      fontFamily = 'sans-serif',
      fontWeight = 'normal',
      color = '#ffffff',
      align = 'left',
      baseline = 'top',
      effect = 'none',
      effectDuration = 30,
      shadow,
      stroke,
    } = element;

    // Set font
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    // Calculate effect progress
    const effectProgress = Math.min(1, frame / effectDuration);
    const eased = easings.easeOut(effectProgress);

    let renderX = x;
    let renderY = y;
    let alpha = 1;
    let displayText = text;

    // Apply effects
    switch (effect) {
      case 'fade':
        alpha = eased;
        break;
      case 'slide-up':
        renderY = y + (1 - eased) * 50;
        alpha = eased;
        break;
      case 'slide-down':
        renderY = y - (1 - eased) * 50;
        alpha = eased;
        break;
      case 'typewriter':
        const chars = Math.floor(text.length * eased);
        displayText = text.substring(0, chars);
        break;
      case 'glow':
        const glowIntensity = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20 * glowIntensity;
        break;
      case 'bounce':
        const bounceOffset = easings.bounce(effectProgress);
        renderY = y - (1 - bounceOffset) * 100;
        break;
    }

    ctx.globalAlpha *= alpha;

    // Apply shadow
    if (shadow) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
    }

    // Render stroke first
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.strokeText(displayText, renderX, renderY);
    }

    // Render fill
    ctx.fillStyle = color;
    ctx.fillText(displayText, renderX, renderY);
  }

  // ==========================================================================
  // Image Rendering
  // ==========================================================================

  private async renderImage(
    ctx: any,
    element: ImageElement,
    frame: number,
    progress: number
  ): Promise<void> {
    const {
      src,
      x,
      y,
      width,
      height,
      fit = 'contain',
      effect = 'none',
      effectDuration = 30,
    } = element;

    // Load image if not cached
    let img = this.imageCache.get(src);
    if (!img) {
      try {
        // Try to load with sharp for better format support
        const sharp = await import('sharp').catch(() => null);
        if (sharp) {
          const buffer = await readFile(src);
          const pngBuffer = await sharp.default(buffer).png().toBuffer();

          // Create image from PNG buffer
          const { loadImage } = await import('canvas');
          img = await loadImage(pngBuffer);
        } else {
          // Fallback to direct load
          const { loadImage } = await import('canvas');
          img = await loadImage(src);
        }
        this.imageCache.set(src, img);
      } catch (error) {
        console.warn(`[CompositionRenderer] Failed to load image: ${src}`, error);
        return;
      }
    }

    // Calculate effect
    const effectProgress = Math.min(1, frame / effectDuration);
    const eased = easings.easeOut(effectProgress);

    let renderX = x;
    let renderY = y;
    let renderWidth = width || img.width;
    let renderHeight = height || img.height;
    let alpha = 1;

    switch (effect) {
      case 'fade':
        alpha = eased;
        break;
      case 'scale':
        const scale = 0.5 + eased * 0.5;
        renderWidth *= scale;
        renderHeight *= scale;
        renderX += (width || img.width) * (1 - scale) / 2;
        renderY += (height || img.height) * (1 - scale) / 2;
        alpha = eased;
        break;
      case 'zoom':
        const zoom = 1 + progress * 0.2;
        renderWidth *= zoom;
        renderHeight *= zoom;
        renderX -= (renderWidth - (width || img.width)) / 2;
        renderY -= (renderHeight - (height || img.height)) / 2;
        break;
      case 'pan':
        renderX -= progress * 50;
        break;
      case 'ken-burns':
        const kbZoom = 1 + progress * 0.1;
        const kbPan = progress * 20;
        renderWidth *= kbZoom;
        renderHeight *= kbZoom;
        renderX -= kbPan;
        renderY -= (renderHeight - (height || img.height)) / 2;
        break;
    }

    ctx.globalAlpha *= alpha;

    // Calculate fit
    if (fit === 'contain' && width && height) {
      const ratio = Math.min(width / img.width, height / img.height);
      renderWidth = img.width * ratio;
      renderHeight = img.height * ratio;
      renderX = x + (width - renderWidth) / 2;
      renderY = y + (height - renderHeight) / 2;
    } else if (fit === 'cover' && width && height) {
      const ratio = Math.max(width / img.width, height / img.height);
      renderWidth = img.width * ratio;
      renderHeight = img.height * ratio;
      renderX = x + (width - renderWidth) / 2;
      renderY = y + (height - renderHeight) / 2;
    }

    ctx.drawImage(img, renderX, renderY, renderWidth, renderHeight);
  }

  // ==========================================================================
  // Shape Rendering
  // ==========================================================================

  private renderShape(ctx: any, element: ShapeElement): void {
    const {
      shape,
      x,
      y,
      width = 100,
      height = 100,
      fill,
      stroke,
      strokeWidth = 1,
      cornerRadius = 0,
      points,
    } = element;

    ctx.beginPath();

    switch (shape) {
      case 'rectangle':
        ctx.rect(x, y, width, height);
        break;
      case 'rounded-rect':
        this.roundedRect(ctx, x, y, width, height, cornerRadius);
        break;
      case 'circle':
        const radius = Math.min(width, height) / 2;
        ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
        break;
      case 'ellipse':
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        break;
      case 'line':
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        break;
      case 'polygon':
        if (points && points.length > 0) {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.closePath();
        }
        break;
    }

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  private roundedRect(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  // ==========================================================================
  // Gradient Rendering
  // ==========================================================================

  private renderGradient(
    ctx: any,
    element: GradientElement,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const { x, y, width = canvasWidth, height = canvasHeight, gradientType, colors, angle = 0 } = element;

    let gradient;
    if (gradientType === 'linear') {
      const radians = (angle * Math.PI) / 180;
      const dx = Math.cos(radians) * width;
      const dy = Math.sin(radians) * height;
      gradient = ctx.createLinearGradient(x, y, x + dx, y + dy);
    } else {
      gradient = ctx.createRadialGradient(
        x + width / 2,
        y + height / 2,
        0,
        x + width / 2,
        y + height / 2,
        Math.max(width, height) / 2
      );
    }

    for (const stop of colors) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  // ==========================================================================
  // Progress Rendering
  // ==========================================================================

  private renderProgress(
    ctx: any,
    element: ProgressElement,
    progress: number
  ): void {
    const {
      x,
      y,
      width = 200,
      height = 20,
      style = 'bar',
      color = '#ffffff',
      backgroundColor = 'rgba(255,255,255,0.3)',
      showPercentage = false,
      thickness = 4,
    } = element;

    switch (style) {
      case 'bar':
        // Background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, y, width, height);
        // Progress
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width * progress, height);
        break;

      case 'circle':
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2 - thickness;
        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = backgroundColor;
        ctx.lineWidth = thickness;
        ctx.stroke();
        // Progress arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.stroke();
        break;

      case 'dots':
        const dotCount = 10;
        const dotRadius = Math.min(width / (dotCount * 2.5), height / 2);
        const spacing = width / dotCount;
        for (let i = 0; i < dotCount; i++) {
          const active = i / dotCount < progress;
          ctx.beginPath();
          ctx.arc(x + spacing * i + spacing / 2, y + height / 2, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = active ? color : backgroundColor;
          ctx.fill();
        }
        break;
    }

    // Show percentage
    if (showPercentage) {
      ctx.fillStyle = color;
      ctx.font = `${Math.min(height * 0.8, 16)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const percent = Math.round(progress * 100);
      ctx.fillText(`${percent}%`, x + width / 2, y + height / 2);
    }
  }

  // ==========================================================================
  // Chart Rendering
  // ==========================================================================

  private renderChart(
    ctx: any,
    element: ChartElement,
    progress: number
  ): void {
    const {
      x,
      y,
      width = 300,
      height = 200,
      chartType,
      data,
      animated = true,
      showLabels = true,
      showValues = false,
      colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'],
    } = element;

    const animProgress = animated ? progress : 1;
    const maxValue = Math.max(...data.map((d) => d.value));

    switch (chartType) {
      case 'bar':
        this.renderBarChart(ctx, x, y, width, height, data, maxValue, animProgress, colors, showLabels, showValues);
        break;
      case 'line':
        this.renderLineChart(ctx, x, y, width, height, data, maxValue, animProgress, colors, showLabels);
        break;
      case 'pie':
      case 'donut':
        this.renderPieChart(ctx, x, y, width, height, data, animProgress, colors, showLabels, chartType === 'donut');
        break;
      case 'area':
        this.renderAreaChart(ctx, x, y, width, height, data, maxValue, animProgress, colors);
        break;
    }
  }

  private renderBarChart(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    data: { label: string; value: number; color?: string }[],
    maxValue: number,
    progress: number,
    colors: string[],
    showLabels: boolean,
    showValues: boolean
  ): void {
    const barWidth = (width / data.length) * 0.7;
    const gap = (width / data.length) * 0.3;
    const labelHeight = showLabels ? 20 : 0;
    const chartHeight = height - labelHeight;

    data.forEach((item, i) => {
      const barX = x + i * (barWidth + gap) + gap / 2;
      const barHeight = (item.value / maxValue) * chartHeight * progress;
      const barY = y + chartHeight - barHeight;

      ctx.fillStyle = item.color || colors[i % colors.length];
      ctx.fillRect(barX, barY, barWidth, barHeight);

      if (showLabels) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, barX + barWidth / 2, y + height - 5);
      }

      if (showValues && progress > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(item.value * progress).toString(), barX + barWidth / 2, barY - 5);
      }
    });
  }

  private renderLineChart(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    data: { label: string; value: number; color?: string }[],
    maxValue: number,
    progress: number,
    colors: string[],
    showLabels: boolean
  ): void {
    const labelHeight = showLabels ? 20 : 0;
    const chartHeight = height - labelHeight;
    const stepX = width / (data.length - 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 2;

    const pointsToDraw = Math.floor(data.length * progress);
    for (let i = 0; i <= pointsToDraw; i++) {
      const px = x + i * stepX;
      const py = y + chartHeight - (data[i].value / maxValue) * chartHeight;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw points
    for (let i = 0; i <= pointsToDraw; i++) {
      const px = x + i * stepX;
      const py = y + chartHeight - (data[i].value / maxValue) * chartHeight;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors[0];
      ctx.fill();
    }

    if (showLabels) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      data.forEach((item, i) => {
        ctx.fillText(item.label, x + i * stepX, y + height - 5);
      });
    }
  }

  private renderPieChart(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    data: { label: string; value: number; color?: string }[],
    progress: number,
    colors: string[],
    _showLabels: boolean,
    isDonut: boolean
  ): void {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = isDonut ? radius * 0.5 : 0;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    let startAngle = -Math.PI / 2;
    data.forEach((item, i) => {
      const sliceAngle = (item.value / total) * Math.PI * 2 * progress;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = item.color || colors[i % colors.length];
      ctx.fill();

      if (isDonut) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
      }

      startAngle = endAngle;
    });
  }

  private renderAreaChart(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    data: { label: string; value: number; color?: string }[],
    maxValue: number,
    progress: number,
    colors: string[]
  ): void {
    const stepX = width / (data.length - 1);
    const pointsToDraw = Math.floor(data.length * progress);

    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(x, y + height);

    for (let i = 0; i <= pointsToDraw; i++) {
      const px = x + i * stepX;
      const py = y + height - (data[i].value / maxValue) * height;
      ctx.lineTo(px, py);
    }

    ctx.lineTo(x + pointsToDraw * stepX, y + height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line on top
    ctx.beginPath();
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 2;
    for (let i = 0; i <= pointsToDraw; i++) {
      const px = x + i * stepX;
      const py = y + height - (data[i].value / maxValue) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // ==========================================================================
  // Lottie Rendering
  // ==========================================================================

  private async renderLottie(
    ctx: any,
    element: LottieElement,
    frame: number
  ): Promise<void> {
    // Lottie rendering requires a full browser environment or specialized library
    // For now, render a placeholder
    const { x, y, width = 200, height = 200 } = element;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Lottie Animation', x + width / 2, y + height / 2);
    ctx.font = '10px sans-serif';
    ctx.fillText(`Frame: ${frame}`, x + width / 2, y + height / 2 + 20);
  }

  // ==========================================================================
  // Three.js 3D Rendering
  // ==========================================================================

  private async renderThree(
    ctx: any,
    element: ThreeElement,
    frame: number,
    fps: number
  ): Promise<void> {
    const { x, y, width = 400, height = 300, scene } = element;

    try {
      // Dynamic import of Three.js renderer
      const { renderThreeFrame } = await import('../video/renderer/three/renderer.js');

      // Build scene config from element definition
      const sceneConfig = {
        width: width,
        height: height,
        backgroundColor: scene.backgroundColor || '#000000',
        camera: scene.camera,
        lights: scene.lights,
        objects: scene.objects,
      };

      // Render the 3D frame
      const pngBuffer = await renderThreeFrame(sceneConfig, frame, fps);

      // Load the PNG buffer into canvas
      const { loadImage } = await import('canvas');
      const img = await loadImage(pngBuffer);

      // Draw onto the composition canvas at the element position
      ctx.drawImage(img, x, y, width, height);
    } catch (error) {
      // Fallback: render a placeholder if Three.js rendering fails
      console.warn(`[CompositionRenderer] Three.js rendering failed:`, error);

      ctx.fillStyle = 'rgba(100,100,200,0.2)';
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = 'rgba(100,100,200,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('3D Scene', x + width / 2, y + height / 2);
      ctx.font = '10px sans-serif';
      ctx.fillText(`Frame: ${frame}`, x + width / 2, y + height / 2 + 20);

      // Show error message if available
      if (error instanceof Error) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(255,100,100,0.8)';
        ctx.fillText(error.message.slice(0, 40), x + width / 2, y + height / 2 + 35);
      }
    }
  }

  // ==========================================================================
  // HTML Rendering (Puppeteer)
  // ==========================================================================

  private async renderHtml(
    ctx: any,
    element: HtmlElement,
    frame: number,
    fps: number
  ): Promise<void> {
    const {
      x,
      y,
      width = 400,
      height = 300,
      html,
      url,
      css,
      script,
      waitForSelector,
      waitTime,
      deviceScaleFactor = 2,
      transparent = true,
      tailwindClasses,
      reactComponent,
      reactProps,
    } = element;

    try {
      // Dynamic import of HTML renderer
      const { renderHtmlFrame } = await import('../video/renderer/html/renderer.js');

      // Render the HTML frame
      const pngBuffer = await renderHtmlFrame(
        {
          html,
          url,
          css,
          script,
          waitForSelector,
          waitTime,
          width,
          height,
          deviceScaleFactor,
          transparent,
          tailwindClasses,
          reactComponent,
          reactProps,
        },
        frame,
        fps
      );

      // Load the PNG buffer into canvas
      const { loadImage } = await import('canvas');
      const img = await loadImage(pngBuffer);

      // Draw onto the composition canvas at the element position
      ctx.drawImage(img, x, y, width, height);
    } catch (error) {
      // Fallback: render a placeholder if HTML rendering fails
      console.warn(`[CompositionRenderer] HTML rendering failed:`, error);

      ctx.fillStyle = 'rgba(200,100,100,0.2)';
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = 'rgba(200,100,100,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HTML Element', x + width / 2, y + height / 2);

      if (reactComponent) {
        ctx.font = '10px sans-serif';
        ctx.fillText(`Component: ${reactComponent}`, x + width / 2, y + height / 2 + 20);
      }

      // Show error message if available
      if (error instanceof Error) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(255,100,100,0.8)';
        ctx.fillText(error.message.slice(0, 40), x + width / 2, y + height / 2 + 35);
      }
    }
  }

  /**
   * Clear image cache.
   */
  clearCache(): void {
    this.imageCache.clear();
    this.lottieCache.clear();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert CompositionState to CompositionDefinition with elements.
 */
export function compositionToDefinition(
  composition: CompositionState
): CompositionDefinition {
  const props = composition.props || {};
  const elements: CompositionElement[] = [];

  // Add title if present
  if (props.title) {
    elements.push({
      id: 'title',
      type: 'text',
      text: props.title as string,
      x: composition.width / 2,
      y: composition.height / 2,
      fontSize: Math.floor(composition.height / 12),
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'center',
      baseline: 'middle',
      effect: 'fade',
      effectDuration: 30,
    });
  }

  // Add subtitle if present
  if (props.subtitle) {
    elements.push({
      id: 'subtitle',
      type: 'text',
      text: props.subtitle as string,
      x: composition.width / 2,
      y: composition.height / 2 + 60,
      fontSize: Math.floor(composition.height / 24),
      color: 'rgba(255,255,255,0.8)',
      align: 'center',
      baseline: 'middle',
      effect: 'slide-up',
      effectDuration: 45,
      startFrame: 15,
    });
  }

  // Add progress bar
  if (props.showProgress !== false) {
    elements.push({
      id: 'progress',
      type: 'progress',
      x: 0,
      y: composition.height - 14,
      width: composition.width,
      height: 4,
      style: 'bar',
      color: '#ffffff',
      backgroundColor: 'rgba(255,255,255,0.3)',
    });
  }

  // Add frame counter
  if (props.showFrameCounter !== false) {
    elements.push({
      id: 'frame-counter',
      type: 'text',
      text: '', // Will be set dynamically
      x: composition.width - 10,
      y: 10,
      fontSize: 14,
      fontFamily: 'monospace',
      color: 'rgba(255,255,255,0.5)',
      align: 'right',
      baseline: 'top',
    });
  }

  // Add background gradient if specified
  if (props.gradient) {
    const gradient = props.gradient as { colors: { offset: number; color: string }[]; angle?: number };
    elements.unshift({
      id: 'background-gradient',
      type: 'gradient',
      x: 0,
      y: 0,
      width: composition.width,
      height: composition.height,
      gradientType: 'linear',
      colors: gradient.colors,
      angle: gradient.angle || 45,
      zIndex: -1,
    });
  }

  // Add any custom elements from props
  if (props.elements && Array.isArray(props.elements)) {
    elements.push(...(props.elements as CompositionElement[]));
  }

  // Extract audio tracks
  const audioTracks: AudioTrackDefinition[] = [];

  // Audio tracks from composition.audioTracks
  if ('audioTracks' in composition && Array.isArray(composition.audioTracks)) {
    for (const track of composition.audioTracks) {
      audioTracks.push({
        id: track.id,
        src: track.src,
        startFrame: track.startFrame,
        endFrame: track.endFrame,
        volume: track.volume,
        fadeIn: track.fadeIn,
        fadeOut: track.fadeOut,
        playbackRate: track.playbackRate,
        loop: track.loop,
      });
    }
  }

  // Audio elements from props.elements (legacy support)
  const audioElements = elements.filter((e): e is AudioElement => e.type === 'audio');
  for (const el of audioElements) {
    if (!el.muted) {
      audioTracks.push({
        id: el.id,
        src: el.src,
        startFrame: el.startFrame ?? 0,
        endFrame: el.endFrame,
        volume: el.volume,
        fadeIn: el.fadeIn,
        fadeOut: el.fadeOut,
        playbackRate: el.playbackRate,
        loop: el.loop,
      });
    }
  }

  // Extract video overlays from elements
  const videoOverlays: VideoOverlayDefinition[] = [];
  const videoElements = elements.filter((e): e is VideoElement => e.type === 'video');
  for (const el of videoElements) {
    videoOverlays.push({
      id: el.id,
      src: el.src,
      x: el.x,
      y: el.y,
      width: el.width ?? composition.width,
      height: el.height ?? composition.height,
      startFrame: el.startFrame ?? 0,
      endFrame: el.endFrame,
      zIndex: el.zIndex,
      volume: el.volume,
      muted: el.muted,
      loop: el.loop,
      playbackRate: el.playbackRate,
      trim: el.trim,
      fit: el.fit,
      opacity: el.opacity,
      chromaKey: el.chromaKey,
      filters: el.filters,
    });
  }

  // Video overlays from composition.videoOverlays
  if ('videoOverlays' in composition && Array.isArray(composition.videoOverlays)) {
    for (const overlay of composition.videoOverlays) {
      videoOverlays.push(overlay as VideoOverlayDefinition);
    }
  }

  return {
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationInFrames: composition.durationInFrames,
    backgroundColor: (props.backgroundColor as string) || '#000000',
    elements,
    audioTracks: audioTracks.length > 0 ? audioTracks : undefined,
    videoOverlays: videoOverlays.length > 0 ? videoOverlays : undefined,
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

let rendererInstance: CompositionRenderer | null = null;

export function getCompositionRenderer(): CompositionRenderer {
  if (!rendererInstance) {
    rendererInstance = new CompositionRenderer();
  }
  return rendererInstance;
}
