/**
 * Simple Chart Components
 *
 * Lightweight SVG-based charts for the Merchant Console.
 * No external dependencies - pure React + SVG.
 */
import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface DataPoint {
  label: string;
  value: number;
}

interface BaseChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
}

// ============================================================================
// Line Chart
// ============================================================================

interface LineChartProps extends BaseChartProps {
  color?: string;
  fillOpacity?: number;
  showDots?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#8b5cf6',
  fillOpacity = 0.1,
  showDots = true,
  showGrid = true,
  formatValue = (v) => v.toLocaleString(),
  className = '',
}) => {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = 600; // Will scale with viewBox

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const minValue = Math.min(...values) * 0.9;
  const maxValue = Math.max(...values) * 1.1;
  const valueRange = maxValue - minValue || 1;

  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Generate path
  const pathPoints = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`);
  const linePath = `M${pathPoints.join(' L')}`;
  const areaPath = `${linePath} L${xScale(data.length - 1)},${padding.top + chartHeight} L${xScale(0)},${padding.top + chartHeight} Z`;

  // Grid lines
  const gridLines = showGrid ? Array.from({ length: 5 }, (_, i) => {
    const value = minValue + (valueRange * i) / 4;
    return yScale(value);
  }) : [];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {showGrid && gridLines.map((y, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="4"
          />
          <text
            x={padding.left - 8}
            y={y + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
          >
            {formatValue(minValue + (valueRange * (4 - i)) / 4)}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (data.length > 10 && i % 2 !== 0) return null;
        return (
          <text
            key={i}
            x={xScale(i)}
            y={height - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
          >
            {d.label}
          </text>
        );
      })}

      {/* Area fill */}
      <path
        d={areaPath}
        fill={color}
        fillOpacity={fillOpacity}
      />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {showDots && data.map((d, i) => (
        <g key={i}>
          <circle
            cx={xScale(i)}
            cy={yScale(d.value)}
            r="4"
            fill={color}
            className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          />
          <circle
            cx={xScale(i)}
            cy={yScale(d.value)}
            r="3"
            fill="#1a1a2e"
            stroke={color}
            strokeWidth="2"
            className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          />
        </g>
      ))}
    </svg>
  );
};

// ============================================================================
// Bar Chart
// ============================================================================

interface BarChartProps extends BaseChartProps {
  color?: string;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  color = '#8b5cf6',
  showLabels = true,
  formatValue = (v) => v.toLocaleString(),
  className = '',
}) => {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 600;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values) * 1.1;

  const barWidth = (chartWidth / data.length) * 0.7;
  const barGap = (chartWidth / data.length) * 0.3;

  const xScale = (index: number) => padding.left + index * (barWidth + barGap) + barGap / 2;
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {Array.from({ length: 5 }, (_, i) => {
        const y = padding.top + (chartHeight * i) / 4;
        const value = maxValue * (4 - i) / 4;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="4"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
            >
              {formatValue(value)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        return (
          <g key={i}>
            <rect
              x={xScale(i)}
              y={yScale(d.value)}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="4"
              className="hover:brightness-110 transition-all cursor-pointer"
            />
            {/* X-axis label */}
            <text
              x={xScale(i) + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
            >
              {d.label}
            </text>
            {/* Value label */}
            {showLabels && (
              <text
                x={xScale(i) + barWidth / 2}
                y={yScale(d.value) - 6}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="10"
              >
                {formatValue(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ============================================================================
// Donut Chart
// ============================================================================

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  thickness = 30,
  className = '',
}) => {
  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const center = size / 2;
  const radius = (size - thickness) / 2;

  let currentAngle = -90; // Start from top

  const segments = data.map((d, i) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
    `;

    return {
      ...d,
      path,
      percentage,
    };
  });

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, i) => (
          <path
            key={i}
            d={segment.path}
            fill="none"
            stroke={segment.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            className="hover:brightness-110 transition-all cursor-pointer"
          />
        ))}
      </svg>
      <div className="space-y-2">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-white/60">{segment.label}</span>
            <span className="text-sm font-medium text-white">
              {(segment.percentage * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Sparkline
// ============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#8b5cf6',
  className = '',
}) => {
  if (data.length === 0) return null;

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1;

  const xScale = (index: number) => padding + (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const pathPoints = data.map((v, i) => `${xScale(i)},${yScale(v)}`);
  const linePath = `M${pathPoints.join(' L')}`;

  return (
    <svg
      width={width}
      height={height}
      className={className}
    >
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={xScale(data.length - 1)}
        cy={yScale(data[data.length - 1])}
        r="2"
        fill={color}
      />
    </svg>
  );
};

// ============================================================================
// Horizontal Bar Chart (for rankings)
// ============================================================================

interface HorizontalBarChartProps {
  data: { label: string; value: number; subLabel?: string }[];
  color?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  color = '#8b5cf6',
  formatValue = (v) => v.toLocaleString(),
  className = '',
}) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((d, i) => {
        const percentage = (d.value / maxValue) * 100;
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white truncate">{d.label}</span>
              <span className="text-sm text-white/60">{formatValue(d.value)}</span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
            {d.subLabel && (
              <span className="text-xs text-white/40">{d.subLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
