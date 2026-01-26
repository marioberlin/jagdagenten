/**
 * Chart Renderer
 *
 * Renders SVG charts to PNG frames for video.
 */

import {
  generateChart,
  type ChartType,
  type ChartSeries,
  type ChartDataPoint,
  type ChartOptions,
} from './svg-charts.js';

// Dynamic imports for Node.js modules
let sharpModule: typeof import('sharp') | null = null;

async function getSharp() {
  if (!sharpModule) {
    try {
      sharpModule = await import('sharp');
    } catch {
      throw new Error('sharp module not available. Install with: npm install sharp');
    }
  }
  return sharpModule.default;
}

export interface ChartAnimationState {
  progress: number; // 0-1
  frame: number;
  totalFrames: number;
}

export interface AnimatedChartOptions extends ChartOptions {
  fps?: number;
  animationDuration?: number; // seconds
}

/**
 * Render an SVG chart to a PNG buffer.
 */
export async function renderChartToPng(svg: string): Promise<Buffer> {
  const sharp = await getSharp();
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Render a chart at a specific animation progress.
 */
export function renderChartAtProgress(
  type: ChartType,
  data: ChartSeries[] | ChartDataPoint[],
  progress: number,
  options: Partial<ChartOptions> = {}
): string {
  // Create options with animation progress
  const animatedOptions: Partial<ChartOptions> = {
    ...options,
    animation: {
      enabled: true,
      duration: 0, // Instant, we control progress manually
      easing: 'ease-out',
    },
  };

  // For frame-by-frame animation, we need to modify the data
  // to show only the portion up to current progress
  const animatedData = animateData(type, data, progress);

  return generateChart(type, animatedData, animatedOptions);
}

/**
 * Animate data based on progress (0-1).
 */
function animateData(
  type: ChartType,
  data: ChartSeries[] | ChartDataPoint[],
  progress: number
): ChartSeries[] | ChartDataPoint[] {
  // Clamp progress
  const p = Math.max(0, Math.min(1, progress));

  if (type === 'pie') {
    // For pie charts, animate values growing
    const pieData = data as ChartDataPoint[];
    return pieData.map((point) => ({
      ...point,
      value: point.value * p,
    }));
  }

  // For other charts, animate series values
  const seriesData = data as ChartSeries[];
  return seriesData.map((series) => ({
    ...series,
    data: series.data.map((point, i) => {
      // Progressive reveal: each point animates in sequence
      const pointProgress = i / series.data.length;
      const effectiveProgress = Math.max(0, Math.min(1, (p - pointProgress * 0.5) * 2));
      return {
        ...point,
        value: point.value * effectiveProgress,
      };
    }),
  }));
}

/**
 * Generate all frames for an animated chart.
 */
export async function* generateChartFrames(
  type: ChartType,
  data: ChartSeries[] | ChartDataPoint[],
  options: AnimatedChartOptions = { width: 800, height: 600 }
): AsyncGenerator<{ frame: number; svg: string; png: Buffer }> {
  const fps = options.fps || 30;
  const duration = options.animationDuration || 2;
  const totalFrames = Math.ceil(fps * duration);

  for (let frame = 0; frame <= totalFrames; frame++) {
    const progress = frame / totalFrames;
    const svg = renderChartAtProgress(type, data, progress, options);
    const png = await renderChartToPng(svg);

    yield { frame, svg, png };
  }
}

/**
 * Create a chart renderer for video integration.
 */
export function createChartRenderer(options: AnimatedChartOptions = { width: 800, height: 600 }) {
  return {
    /**
     * Render a static chart.
     */
    async renderStatic(
      type: ChartType,
      data: ChartSeries[] | ChartDataPoint[]
    ): Promise<Buffer> {
      const svg = generateChart(type, data, {
        ...options,
        animation: { enabled: false, duration: 0 },
      });
      return renderChartToPng(svg);
    },

    /**
     * Render a single frame at a given progress.
     */
    async renderFrame(
      type: ChartType,
      data: ChartSeries[] | ChartDataPoint[],
      progress: number
    ): Promise<Buffer> {
      const svg = renderChartAtProgress(type, data, progress, options);
      return renderChartToPng(svg);
    },

    /**
     * Generate all animation frames.
     */
    generateFrames(
      type: ChartType,
      data: ChartSeries[] | ChartDataPoint[]
    ) {
      return generateChartFrames(type, data, options);
    },

    /**
     * Get SVG string (for embedding or debugging).
     */
    getSvg(
      type: ChartType,
      data: ChartSeries[] | ChartDataPoint[],
      progress = 1
    ): string {
      if (progress >= 1) {
        return generateChart(type, data, {
          ...options,
          animation: { enabled: false, duration: 0 },
        });
      }
      return renderChartAtProgress(type, data, progress, options);
    },
  };
}

/**
 * Preset chart styles.
 */
export const CHART_PRESETS = {
  light: {
    backgroundColor: '#FFFFFF',
    font: { color: '#333333', family: 'Inter, sans-serif', size: 14 },
    colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
  },
  dark: {
    backgroundColor: '#1F2937',
    font: { color: '#F3F4F6', family: 'Inter, sans-serif', size: 14 },
    colors: ['#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA'],
  },
  minimal: {
    backgroundColor: '#FFFFFF',
    showGrid: false,
    showLegend: false,
    font: { color: '#6B7280', family: 'system-ui', size: 12 },
    colors: ['#111827'],
    padding: { top: 20, right: 20, bottom: 40, left: 40 },
  },
  vibrant: {
    backgroundColor: '#0F172A',
    font: { color: '#E2E8F0', family: 'Poppins, sans-serif', size: 14 },
    colors: ['#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
  },
  crypto: {
    backgroundColor: '#0D1421',
    font: { color: '#94A3B8', family: 'JetBrains Mono, monospace', size: 12 },
    colors: ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B'],
  },
} as const;
