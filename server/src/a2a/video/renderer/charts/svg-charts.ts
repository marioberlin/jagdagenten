/**
 * SVG Chart Generator
 *
 * Creates animated SVG charts for video rendering.
 * Supports line, bar, pie, area, and scatter charts.
 */

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  strokeWidth?: number;
}

export interface ChartOptions {
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  showGrid?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  animation?: {
    enabled: boolean;
    duration: number; // seconds
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  colors?: string[];
  font?: {
    family?: string;
    size?: number;
    color?: string;
  };
  axis?: {
    x?: {
      show?: boolean;
      title?: string;
      tickCount?: number;
    };
    y?: {
      show?: boolean;
      title?: string;
      min?: number;
      max?: number;
      tickCount?: number;
    };
  };
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const DEFAULT_OPTIONS: ChartOptions = {
  width: 800,
  height: 600,
  backgroundColor: '#FFFFFF',
  padding: { top: 60, right: 40, bottom: 60, left: 60 },
  showGrid: true,
  showLegend: true,
  showLabels: true,
  showValues: false,
  colors: DEFAULT_COLORS,
  font: {
    family: 'Arial, sans-serif',
    size: 14,
    color: '#333333',
  },
  axis: {
    x: { show: true, tickCount: 5 },
    y: { show: true, tickCount: 5 },
  },
};

/**
 * Escape text for SVG.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Calculate chart area dimensions.
 */
function getChartArea(options: ChartOptions) {
  const padding = { ...DEFAULT_OPTIONS.padding, ...options.padding };
  return {
    x: padding.left!,
    y: padding.top!,
    width: options.width - padding.left! - padding.right!,
    height: options.height - padding.top! - padding.bottom!,
  };
}

/**
 * Calculate min/max from data.
 */
function getDataRange(series: ChartSeries[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const s of series) {
    for (const point of s.data) {
      min = Math.min(min, point.value);
      max = Math.max(max, point.value);
    }
  }

  // Add padding
  const range = max - min || 1;
  return {
    min: Math.floor(min - range * 0.1),
    max: Math.ceil(max + range * 0.1),
  };
}

/**
 * Generate nice axis tick values.
 */
function generateTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  const step = range / (count - 1);
  const ticks: number[] = [];

  for (let i = 0; i < count; i++) {
    ticks.push(min + step * i);
  }

  return ticks;
}

/**
 * Generate grid lines SVG.
 */
function generateGrid(
  chartArea: ReturnType<typeof getChartArea>,
  yTicks: number[],
  options: ChartOptions
): string {
  if (!options.showGrid) return '';

  const lines = yTicks.map((_, i) => {
    const y = chartArea.y + chartArea.height - (i / (yTicks.length - 1)) * chartArea.height;
    return `<line x1="${chartArea.x}" y1="${y}" x2="${chartArea.x + chartArea.width}" y2="${y}" stroke="#E5E7EB" stroke-width="1"/>`;
  });

  return `<g class="grid">${lines.join('')}</g>`;
}

/**
 * Generate axis SVG.
 */
function generateAxes(
  chartArea: ReturnType<typeof getChartArea>,
  xLabels: string[],
  yTicks: number[],
  options: ChartOptions
): string {
  const font = { ...DEFAULT_OPTIONS.font, ...options.font };
  const axis = { ...DEFAULT_OPTIONS.axis, ...options.axis };
  let svg = '';

  // Y-axis
  if (axis.y?.show) {
    const yLines = yTicks.map((tick, i) => {
      const y = chartArea.y + chartArea.height - (i / (yTicks.length - 1)) * chartArea.height;
      return `<text x="${chartArea.x - 10}" y="${y + 4}" text-anchor="end" fill="${font.color}" font-family="${font.family}" font-size="${font.size! - 2}">${tick.toFixed(0)}</text>`;
    });

    svg += `<g class="y-axis">
      <line x1="${chartArea.x}" y1="${chartArea.y}" x2="${chartArea.x}" y2="${chartArea.y + chartArea.height}" stroke="#333" stroke-width="2"/>
      ${yLines.join('')}
      ${axis.y.title ? `<text x="${chartArea.x - 40}" y="${chartArea.y + chartArea.height / 2}" text-anchor="middle" fill="${font.color}" font-family="${font.family}" font-size="${font.size}" transform="rotate(-90, ${chartArea.x - 40}, ${chartArea.y + chartArea.height / 2})">${escapeXml(axis.y.title)}</text>` : ''}
    </g>`;
  }

  // X-axis
  if (axis.x?.show) {
    const xStep = chartArea.width / (xLabels.length - 1 || 1);
    const xLabelsEl = xLabels.map((label, i) => {
      const x = chartArea.x + i * xStep;
      return `<text x="${x}" y="${chartArea.y + chartArea.height + 20}" text-anchor="middle" fill="${font.color}" font-family="${font.family}" font-size="${font.size! - 2}">${escapeXml(label)}</text>`;
    });

    svg += `<g class="x-axis">
      <line x1="${chartArea.x}" y1="${chartArea.y + chartArea.height}" x2="${chartArea.x + chartArea.width}" y2="${chartArea.y + chartArea.height}" stroke="#333" stroke-width="2"/>
      ${xLabelsEl.join('')}
      ${axis.x.title ? `<text x="${chartArea.x + chartArea.width / 2}" y="${chartArea.y + chartArea.height + 45}" text-anchor="middle" fill="${font.color}" font-family="${font.family}" font-size="${font.size}">${escapeXml(axis.x.title)}</text>` : ''}
    </g>`;
  }

  return svg;
}

/**
 * Generate legend SVG.
 */
function generateLegend(
  series: ChartSeries[],
  options: ChartOptions
): string {
  if (!options.showLegend || series.length <= 1) return '';

  const font = { ...DEFAULT_OPTIONS.font, ...options.font };
  const colors = options.colors || DEFAULT_COLORS;
  const legendY = options.height - 25;
  const legendItemWidth = 100;
  const totalWidth = series.length * legendItemWidth;
  const startX = (options.width - totalWidth) / 2;

  const items = series.map((s, i) => {
    const x = startX + i * legendItemWidth;
    const color = s.color || colors[i % colors.length];
    return `
      <rect x="${x}" y="${legendY}" width="12" height="12" fill="${color}" rx="2"/>
      <text x="${x + 18}" y="${legendY + 10}" fill="${font.color}" font-family="${font.family}" font-size="${font.size! - 2}">${escapeXml(s.name)}</text>
    `;
  });

  return `<g class="legend">${items.join('')}</g>`;
}

/**
 * Generate title SVG.
 */
function generateTitle(options: ChartOptions): string {
  if (!options.title) return '';

  const font = { ...DEFAULT_OPTIONS.font, ...options.font };
  let svg = `<text x="${options.width / 2}" y="30" text-anchor="middle" fill="${font.color}" font-family="${font.family}" font-size="${font.size! + 4}" font-weight="bold">${escapeXml(options.title)}</text>`;

  if (options.subtitle) {
    svg += `<text x="${options.width / 2}" y="50" text-anchor="middle" fill="#666" font-family="${font.family}" font-size="${font.size}">${escapeXml(options.subtitle)}</text>`;
  }

  return svg;
}

/**
 * Generate line chart SVG.
 */
export function generateLineChart(
  series: ChartSeries[],
  options: Partial<ChartOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chartArea = getChartArea(opts);
  const colors = opts.colors || DEFAULT_COLORS;

  // Calculate data range
  const { min, max } = opts.axis?.y?.min !== undefined && opts.axis?.y?.max !== undefined
    ? { min: opts.axis.y.min, max: opts.axis.y.max }
    : getDataRange(series);

  const yTicks = generateTicks(min, max, opts.axis?.y?.tickCount || 5);

  // Get x labels from first series
  const xLabels = series[0]?.data.map((d) => d.label) || [];

  // Generate paths
  const paths = series.map((s, seriesIdx) => {
    const color = s.color || colors[seriesIdx % colors.length];
    const strokeWidth = s.strokeWidth || 2;

    const points = s.data.map((point, i) => {
      const x = chartArea.x + (i / (s.data.length - 1 || 1)) * chartArea.width;
      const y = chartArea.y + chartArea.height - ((point.value - min) / (max - min || 1)) * chartArea.height;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    // Animation
    const animationAttr = opts.animation?.enabled
      ? `stroke-dasharray="1000" stroke-dashoffset="1000">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="${opts.animation.duration}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>`
      : '>';

    return `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${animationAttr}</path>`;
  });

  // Generate dots
  const dots = series.flatMap((s, seriesIdx) => {
    const color = s.color || colors[seriesIdx % colors.length];

    return s.data.map((point, i) => {
      const x = chartArea.x + (i / (s.data.length - 1 || 1)) * chartArea.width;
      const y = chartArea.y + chartArea.height - ((point.value - min) / (max - min || 1)) * chartArea.height;

      const animationAttr = opts.animation?.enabled
        ? `opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${(i / s.data.length) * opts.animation.duration}s" fill="freeze"/>`
        : '>';

      return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" ${animationAttr}</circle>`;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}">
    <rect width="${opts.width}" height="${opts.height}" fill="${opts.backgroundColor}"/>
    ${generateTitle(opts)}
    ${generateGrid(chartArea, yTicks, opts)}
    ${generateAxes(chartArea, xLabels, yTicks, opts)}
    <g class="data">${paths.join('')}${dots.join('')}</g>
    ${generateLegend(series, opts)}
  </svg>`;
}

/**
 * Generate bar chart SVG.
 */
export function generateBarChart(
  series: ChartSeries[],
  options: Partial<ChartOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chartArea = getChartArea(opts);
  const colors = opts.colors || DEFAULT_COLORS;

  // For bar charts, min should be 0
  const { max } = getDataRange(series);
  const min = 0;
  const yTicks = generateTicks(min, max, opts.axis?.y?.tickCount || 5);

  const xLabels = series[0]?.data.map((d) => d.label) || [];
  const groupCount = xLabels.length;
  const barGroupWidth = chartArea.width / groupCount;
  const barWidth = (barGroupWidth * 0.8) / series.length;
  const barGap = barGroupWidth * 0.1;

  // Generate bars
  const bars = series.flatMap((s, seriesIdx) => {
    const color = s.color || colors[seriesIdx % colors.length];

    return s.data.map((point, i) => {
      const barHeight = ((point.value - min) / (max - min || 1)) * chartArea.height;
      const x = chartArea.x + i * barGroupWidth + barGap + seriesIdx * barWidth;
      const y = chartArea.y + chartArea.height - barHeight;

      const animationAttr = opts.animation?.enabled
        ? `height="0" y="${chartArea.y + chartArea.height}">
            <animate attributeName="height" from="0" to="${barHeight}" dur="${opts.animation.duration}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
            <animate attributeName="y" from="${chartArea.y + chartArea.height}" to="${y}" dur="${opts.animation.duration}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>`
        : `height="${barHeight}" y="${y}">`;

      let bar = `<rect x="${x}" width="${barWidth}" fill="${color}" rx="2" ${animationAttr}</rect>`;

      // Value label
      if (opts.showValues) {
        bar += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" fill="${opts.font?.color || '#333'}" font-family="${opts.font?.family || 'Arial'}" font-size="${(opts.font?.size || 14) - 4}">${point.value}</text>`;
      }

      return bar;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}">
    <rect width="${opts.width}" height="${opts.height}" fill="${opts.backgroundColor}"/>
    ${generateTitle(opts)}
    ${generateGrid(chartArea, yTicks, opts)}
    ${generateAxes(chartArea, xLabels, yTicks, opts)}
    <g class="data">${bars.join('')}</g>
    ${generateLegend(series, opts)}
  </svg>`;
}

/**
 * Generate pie chart SVG.
 */
export function generatePieChart(
  data: ChartDataPoint[],
  options: Partial<ChartOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const colors = opts.colors || DEFAULT_COLORS;

  const centerX = opts.width / 2;
  const centerY = opts.height / 2 - 20; // Leave room for legend
  const radius = Math.min(opts.width, opts.height) / 2 - 80;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -Math.PI / 2; // Start at top

  // Generate slices
  const slices = data.map((point, i) => {
    const color = point.color || colors[i % colors.length];
    const angle = (point.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    // Animation
    const animationAttr = opts.animation?.enabled
      ? `opacity="0" transform-origin="${centerX} ${centerY}">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${(i / data.length) * opts.animation.duration}s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" from="0" to="1" dur="${opts.animation.duration}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>`
      : '>';

    // Label position (middle of slice)
    const midAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(midAngle);
    const labelY = centerY + labelRadius * Math.sin(midAngle);

    let slice = `<path d="${pathData}" fill="${color}" stroke="${opts.backgroundColor}" stroke-width="2" ${animationAttr}</path>`;

    if (opts.showLabels && point.value / total > 0.05) {
      const percentage = Math.round((point.value / total) * 100);
      slice += `<text x="${labelX}" y="${labelY}" text-anchor="middle" fill="white" font-family="${opts.font?.family || 'Arial'}" font-size="${opts.font?.size || 14}" font-weight="bold">${percentage}%</text>`;
    }

    return slice;
  });

  // Generate legend
  const legendY = opts.height - 40;
  const legendItemWidth = 120;
  const totalWidth = data.length * legendItemWidth;
  const startX = Math.max(20, (opts.width - totalWidth) / 2);

  const legend = data.map((point, i) => {
    const x = startX + i * legendItemWidth;
    const color = point.color || colors[i % colors.length];
    return `
      <rect x="${x}" y="${legendY}" width="12" height="12" fill="${color}" rx="2"/>
      <text x="${x + 18}" y="${legendY + 10}" fill="${opts.font?.color || '#333'}" font-family="${opts.font?.family || 'Arial'}" font-size="${(opts.font?.size || 14) - 2}">${escapeXml(point.label)}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}">
    <rect width="${opts.width}" height="${opts.height}" fill="${opts.backgroundColor}"/>
    ${generateTitle(opts)}
    <g class="data">${slices.join('')}</g>
    <g class="legend">${legend.join('')}</g>
  </svg>`;
}

/**
 * Generate area chart SVG.
 */
export function generateAreaChart(
  series: ChartSeries[],
  options: Partial<ChartOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chartArea = getChartArea(opts);
  const colors = opts.colors || DEFAULT_COLORS;

  const { min, max } = getDataRange(series);
  const yTicks = generateTicks(min, max, opts.axis?.y?.tickCount || 5);
  const xLabels = series[0]?.data.map((d) => d.label) || [];

  // Generate area paths
  const areas = series.map((s, seriesIdx) => {
    const color = s.color || colors[seriesIdx % colors.length];

    const points = s.data.map((point, i) => {
      const x = chartArea.x + (i / (s.data.length - 1 || 1)) * chartArea.width;
      const y = chartArea.y + chartArea.height - ((point.value - min) / (max - min || 1)) * chartArea.height;
      return { x, y };
    });

    // Create area path
    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x},${chartArea.y + chartArea.height} L ${points[0].x},${chartArea.y + chartArea.height} Z`;

    const fillOpacity = 0.3;

    // Animation
    const animationAttr = opts.animation?.enabled
      ? `opacity="0">
          <animate attributeName="opacity" from="0" to="${fillOpacity}" dur="${opts.animation.duration}s" fill="freeze"/>`
      : `opacity="${fillOpacity}">`;

    return `<path d="${areaPath}" fill="${color}" ${animationAttr}</path>
            <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}">
    <rect width="${opts.width}" height="${opts.height}" fill="${opts.backgroundColor}"/>
    ${generateTitle(opts)}
    ${generateGrid(chartArea, yTicks, opts)}
    ${generateAxes(chartArea, xLabels, yTicks, opts)}
    <g class="data">${areas.join('')}</g>
    ${generateLegend(series, opts)}
  </svg>`;
}

/**
 * Generate scatter chart SVG.
 */
export function generateScatterChart(
  series: ChartSeries[],
  options: Partial<ChartOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chartArea = getChartArea(opts);
  const colors = opts.colors || DEFAULT_COLORS;

  const { min, max } = getDataRange(series);
  const yTicks = generateTicks(min, max, opts.axis?.y?.tickCount || 5);

  // For scatter, x-axis is also numeric
  const xLabels = yTicks.map((t) => t.toString());

  // Generate points
  const points = series.flatMap((s, seriesIdx) => {
    const color = s.color || colors[seriesIdx % colors.length];

    return s.data.map((point, i) => {
      const x = chartArea.x + (i / (s.data.length - 1 || 1)) * chartArea.width;
      const y = chartArea.y + chartArea.height - ((point.value - min) / (max - min || 1)) * chartArea.height;

      const animationAttr = opts.animation?.enabled
        ? `r="0"><animate attributeName="r" from="0" to="6" dur="0.3s" begin="${(i / s.data.length) * opts.animation.duration}s" fill="freeze"/>`
        : `r="6">`;

      return `<circle cx="${x}" cy="${y}" fill="${color}" opacity="0.7" ${animationAttr}</circle>`;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}">
    <rect width="${opts.width}" height="${opts.height}" fill="${opts.backgroundColor}"/>
    ${generateTitle(opts)}
    ${generateGrid(chartArea, yTicks, opts)}
    ${generateAxes(chartArea, xLabels, yTicks, opts)}
    <g class="data">${points.join('')}</g>
    ${generateLegend(series, opts)}
  </svg>`;
}

/**
 * Chart type selector.
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';

export function generateChart(
  type: ChartType,
  data: ChartSeries[] | ChartDataPoint[],
  options: Partial<ChartOptions> = {}
): string {
  switch (type) {
    case 'line':
      return generateLineChart(data as ChartSeries[], options);
    case 'bar':
      return generateBarChart(data as ChartSeries[], options);
    case 'pie':
      return generatePieChart(data as ChartDataPoint[], options);
    case 'area':
      return generateAreaChart(data as ChartSeries[], options);
    case 'scatter':
      return generateScatterChart(data as ChartSeries[], options);
    default:
      throw new Error(`Unknown chart type: ${type}`);
  }
}
