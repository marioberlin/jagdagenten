/**
 * Chart Module
 *
 * SVG chart generation and video frame rendering.
 */

export {
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateAreaChart,
  generateScatterChart,
  generateChart,
  type ChartType,
  type ChartSeries,
  type ChartDataPoint,
  type ChartOptions,
} from './svg-charts.js';

export {
  renderChartToPng,
  renderChartAtProgress,
  generateChartFrames,
  createChartRenderer,
  CHART_PRESETS,
  type AnimatedChartOptions,
  type ChartAnimationState,
} from './renderer.js';
