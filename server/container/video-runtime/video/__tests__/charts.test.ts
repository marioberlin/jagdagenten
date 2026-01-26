/**
 * Chart Generator Tests
 */

import { describe, test, expect } from 'bun:test';
import {
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateAreaChart,
  generateScatterChart,
  generateChart,
  type ChartSeries,
  type ChartDataPoint,
} from '../renderer/charts/svg-charts.js';

const SAMPLE_SERIES: ChartSeries[] = [
  {
    name: 'Series A',
    data: [
      { label: 'Jan', value: 10 },
      { label: 'Feb', value: 20 },
      { label: 'Mar', value: 15 },
      { label: 'Apr', value: 25 },
    ],
    color: '#3B82F6',
  },
];

const MULTI_SERIES: ChartSeries[] = [
  {
    name: 'Revenue',
    data: [
      { label: 'Q1', value: 100 },
      { label: 'Q2', value: 150 },
      { label: 'Q3', value: 120 },
      { label: 'Q4', value: 180 },
    ],
    color: '#10B981',
  },
  {
    name: 'Expenses',
    data: [
      { label: 'Q1', value: 80 },
      { label: 'Q2', value: 90 },
      { label: 'Q3', value: 100 },
      { label: 'Q4', value: 110 },
    ],
    color: '#EF4444',
  },
];

const PIE_DATA: ChartDataPoint[] = [
  { label: 'A', value: 30 },
  { label: 'B', value: 50 },
  { label: 'C', value: 20 },
];

describe('generateLineChart', () => {
  test('generates valid SVG', () => {
    const svg = generateLineChart(SAMPLE_SERIES);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  test('includes chart elements', () => {
    const svg = generateLineChart(SAMPLE_SERIES);

    // Should have path for the line
    expect(svg).toContain('<path');
    // Should have circles for data points
    expect(svg).toContain('<circle');
  });

  test('includes title when specified', () => {
    const svg = generateLineChart(SAMPLE_SERIES, {
      title: 'Monthly Data',
      width: 800,
      height: 600,
    });

    expect(svg).toContain('Monthly Data');
  });

  test('handles multiple series', () => {
    const svg = generateLineChart(MULTI_SERIES);

    // Should have paths for both series
    expect(svg).toContain('#10B981');
    expect(svg).toContain('#EF4444');
  });

  test('includes animation when enabled', () => {
    const svg = generateLineChart(SAMPLE_SERIES, {
      width: 800,
      height: 600,
      animation: { enabled: true, duration: 2 },
    });

    expect(svg).toContain('<animate');
    expect(svg).toContain('stroke-dasharray');
  });

  test('includes legend for multiple series', () => {
    const svg = generateLineChart(MULTI_SERIES, {
      width: 800,
      height: 600,
      showLegend: true,
    });

    expect(svg).toContain('Revenue');
    expect(svg).toContain('Expenses');
  });
});

describe('generateBarChart', () => {
  test('generates valid SVG', () => {
    const svg = generateBarChart(SAMPLE_SERIES);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  test('includes rectangles for bars', () => {
    const svg = generateBarChart(SAMPLE_SERIES);

    expect(svg).toContain('<rect');
  });

  test('shows values when enabled', () => {
    const svg = generateBarChart(SAMPLE_SERIES, {
      width: 800,
      height: 600,
      showValues: true,
    });

    // Should show the values above bars
    expect(svg).toContain('10');
    expect(svg).toContain('20');
  });

  test('handles grouped bars', () => {
    const svg = generateBarChart(MULTI_SERIES);

    // Should have bars for both series
    expect(svg).toContain('#10B981');
    expect(svg).toContain('#EF4444');
  });
});

describe('generatePieChart', () => {
  test('generates valid SVG', () => {
    const svg = generatePieChart(PIE_DATA);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  test('includes paths for slices', () => {
    const svg = generatePieChart(PIE_DATA);

    // Should have 3 path elements for 3 data points
    const pathCount = (svg.match(/<path/g) || []).length;
    expect(pathCount).toBeGreaterThanOrEqual(3);
  });

  test('includes legend', () => {
    const svg = generatePieChart(PIE_DATA, {
      width: 800,
      height: 600,
    });

    expect(svg).toContain('A');
    expect(svg).toContain('B');
    expect(svg).toContain('C');
  });

  test('shows percentages when labels enabled', () => {
    const svg = generatePieChart(PIE_DATA, {
      width: 800,
      height: 600,
      showLabels: true,
    });

    // Should show percentages
    expect(svg).toContain('%');
  });
});

describe('generateAreaChart', () => {
  test('generates valid SVG', () => {
    const svg = generateAreaChart(SAMPLE_SERIES);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  test('includes filled area path', () => {
    const svg = generateAreaChart(SAMPLE_SERIES);

    // Area charts have paths with fill
    expect(svg).toContain('fill=');
    expect(svg).toContain('opacity');
  });
});

describe('generateScatterChart', () => {
  test('generates valid SVG', () => {
    const svg = generateScatterChart(SAMPLE_SERIES);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  test('includes circles for points', () => {
    const svg = generateScatterChart(SAMPLE_SERIES);

    const circleCount = (svg.match(/<circle/g) || []).length;
    expect(circleCount).toBeGreaterThanOrEqual(SAMPLE_SERIES[0].data.length);
  });
});

describe('generateChart', () => {
  test('dispatches to correct chart type', () => {
    const line = generateChart('line', SAMPLE_SERIES);
    const bar = generateChart('bar', SAMPLE_SERIES);
    const pie = generateChart('pie', PIE_DATA);
    const area = generateChart('area', SAMPLE_SERIES);
    const scatter = generateChart('scatter', SAMPLE_SERIES);

    // All should be valid SVG
    expect(line).toContain('<svg');
    expect(bar).toContain('<svg');
    expect(pie).toContain('<svg');
    expect(area).toContain('<svg');
    expect(scatter).toContain('<svg');
  });

  test('throws for unknown chart type', () => {
    expect(() => {
      generateChart('unknown' as any, SAMPLE_SERIES);
    }).toThrow('Unknown chart type');
  });
});

describe('chart options', () => {
  test('respects width and height', () => {
    const svg = generateLineChart(SAMPLE_SERIES, {
      width: 1000,
      height: 500,
    });

    expect(svg).toContain('width="1000"');
    expect(svg).toContain('height="500"');
    expect(svg).toContain('viewBox="0 0 1000 500"');
  });

  test('applies background color', () => {
    const svg = generateLineChart(SAMPLE_SERIES, {
      width: 800,
      height: 600,
      backgroundColor: '#1a1a2e',
    });

    expect(svg).toContain('fill="#1a1a2e"');
  });

  test('applies font settings', () => {
    const svg = generateLineChart(SAMPLE_SERIES, {
      width: 800,
      height: 600,
      font: {
        family: 'Inter, sans-serif',
        size: 16,
        color: '#ffffff',
      },
    });

    expect(svg).toContain('Inter');
    expect(svg).toContain('#ffffff');
  });

  test('hides grid when disabled', () => {
    const withGrid = generateLineChart(SAMPLE_SERIES, {
      width: 800,
      height: 600,
      showGrid: true,
    });

    const noGrid = generateLineChart(SAMPLE_SERIES, {
      width: 800,
      height: 600,
      showGrid: false,
    });

    expect(withGrid).toContain('class="grid"');
    expect(noGrid).not.toContain('class="grid"');
  });

  test('applies custom colors', () => {
    const svg = generateLineChart(SAMPLE_SERIES, {
      width: 800,
      height: 600,
      colors: ['#FF5733', '#33FF57'],
    });

    expect(svg).toContain('#FF5733');
  });
});
