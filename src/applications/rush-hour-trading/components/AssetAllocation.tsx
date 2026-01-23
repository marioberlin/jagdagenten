import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import type { Asset } from '@/hooks/trading/useDashboardData';

interface AssetAllocationProps {
    assets: Asset[];
    isLoading?: boolean;
}

/**
 * Donut Chart SVG component
 */
const DonutChart: React.FC<{
    assets: Asset[];
    size?: number;
    onHover: (index: number | null) => void;
    hoveredIndex: number | null;
}> = ({ assets, size = 200, onHover, hoveredIndex }) => {
    const radius = size / 2;
    const innerRadius = radius * 0.6;
    const center = radius;

    const segments = useMemo(() => {
        const total = assets.reduce((sum, a) => sum + a.percentage, 0);
        let currentAngle = -90; // Start from top

        return assets.map((asset) => {
            const angle = (asset.percentage / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            // Calculate path for arc
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);

            const ix1 = center + innerRadius * Math.cos(startRad);
            const iy1 = center + innerRadius * Math.sin(startRad);
            const ix2 = center + innerRadius * Math.cos(endRad);
            const iy2 = center + innerRadius * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            const path = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${ix2} ${iy2}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
                `Z`,
            ].join(' ');

            // Label position (middle of arc)
            const midAngle = (startAngle + endAngle) / 2;
            const midRad = (midAngle * Math.PI) / 180;
            const labelRadius = (radius + innerRadius) / 2;
            const labelX = center + labelRadius * Math.cos(midRad);
            const labelY = center + labelRadius * Math.sin(midRad);

            return {
                path,
                color: asset.color,
                labelX,
                labelY,
                percentage: asset.percentage,
                symbol: asset.symbol,
            };
        });
    }, [assets, radius, innerRadius, center]);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
        >
            {/* Segments */}
            {segments.map((segment, i) => (
                <motion.path
                    key={i}
                    d={segment.path}
                    fill={segment.color}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4,
                        scale: hoveredIndex === i ? 1.03 : 1,
                    }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onMouseEnter={() => onHover(i)}
                    onMouseLeave={() => onHover(null)}
                    className="cursor-pointer transition-all"
                    style={{
                        transformOrigin: `${center}px ${center}px`,
                        filter: hoveredIndex === i ? 'brightness(1.2)' : undefined,
                    }}
                />
            ))}

            {/* Center hole background */}
            <circle
                cx={center}
                cy={center}
                r={innerRadius - 2}
                fill="var(--glass-surface)"
                className="pointer-events-none"
            />

            {/* Center text */}
            {hoveredIndex !== null && (
                <g className="pointer-events-none">
                    <text
                        x={center}
                        y={center - 8}
                        textAnchor="middle"
                        className="text-xs font-medium fill-secondary"
                    >
                        {assets[hoveredIndex].symbol}
                    </text>
                    <text
                        x={center}
                        y={center + 12}
                        textAnchor="middle"
                        className="text-lg font-bold fill-primary"
                    >
                        {assets[hoveredIndex].percentage.toFixed(1)}%
                    </text>
                </g>
            )}
            {hoveredIndex === null && (
                <g className="pointer-events-none">
                    <text
                        x={center}
                        y={center - 8}
                        textAnchor="middle"
                        className="text-xs font-medium fill-secondary"
                    >
                        Total Assets
                    </text>
                    <text
                        x={center}
                        y={center + 12}
                        textAnchor="middle"
                        className="text-lg font-bold fill-primary"
                    >
                        {assets.length}
                    </text>
                </g>
            )}
        </svg>
    );
};

/**
 * Asset List Item
 */
const AssetListItem: React.FC<{
    asset: Asset;
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
}> = ({ asset, isHovered, onHover, onLeave }) => {
    const isPnLPositive = asset.pnl >= 0;

    const formatValue = (n: number) => {
        if (Math.abs(n) >= 1000) {
            return `$${(n / 1000).toFixed(1)}K`;
        }
        return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    };

    return (
        <motion.div
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer',
                isHovered ? 'bg-white/10' : 'hover:bg-white/5'
            )}
            animate={{
                scale: isHovered ? 1.02 : 1,
                x: isHovered ? 4 : 0,
            }}
        >
            {/* Color dot */}
            <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: asset.color }}
            />

            {/* Asset info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{asset.symbol}</span>
                    <span className="text-xs text-secondary truncate">{asset.name}</span>
                </div>
                <div className="text-xs text-secondary">
                    {asset.quantity.toLocaleString()} @ {formatValue(asset.avgPrice)}
                </div>
            </div>

            {/* Value & P&L */}
            <div className="text-right flex-shrink-0">
                <div className="font-semibold text-primary tabular-nums">
                    {formatValue(asset.value)}
                </div>
                <div className={cn(
                    'flex items-center gap-1 text-xs font-medium justify-end',
                    isPnLPositive ? 'text-emerald-400' : 'text-red-400'
                )}>
                    {isPnLPositive ? (
                        <TrendingUp className="w-3 h-3" />
                    ) : asset.pnl < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                    ) : (
                        <Minus className="w-3 h-3" />
                    )}
                    <span>{isPnLPositive ? '+' : ''}{asset.pnlPercent.toFixed(2)}%</span>
                </div>
            </div>

            {/* Percentage bar */}
            <div className="w-12 flex-shrink-0">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: asset.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${asset.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    />
                </div>
                <div className="text-[10px] text-secondary text-center mt-0.5">
                    {asset.percentage.toFixed(1)}%
                </div>
            </div>
        </motion.div>
    );
};

/**
 * AssetAllocation - Donut chart with asset list
 */
export const AssetAllocation: React.FC<AssetAllocationProps> = ({
    assets,
    isLoading = false,
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Sort assets by value descending
    const sortedAssets = useMemo(() =>
        [...assets].sort((a, b) => b.value - a.value),
        [assets]
    );

    // Calculate totals
    const totals = useMemo(() => {
        const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
        const totalPnL = assets.reduce((sum, a) => sum + a.pnl, 0);
        return { totalValue, totalPnL };
    }, [assets]);

    if (isLoading) {
        return (
            <GlassContainer className="p-6" border>
                <div className="h-80 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
            </GlassContainer>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
        >
            <GlassContainer className="p-6" border>
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                        <PieChart className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary">Asset Allocation</h3>
                        <p className="text-xs text-secondary">
                            {assets.length} assets · ${totals.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} total
                        </p>
                    </div>
                </div>

                {/* Chart */}
                <div className="flex justify-center mb-6">
                    <DonutChart
                        assets={sortedAssets}
                        size={180}
                        onHover={setHoveredIndex}
                        hoveredIndex={hoveredIndex}
                    />
                </div>

                {/* Asset List */}
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {sortedAssets.map((asset, i) => (
                        <AssetListItem
                            key={asset.symbol}
                            asset={asset}
                            isHovered={hoveredIndex === i}
                            onHover={() => setHoveredIndex(i)}
                            onLeave={() => setHoveredIndex(null)}
                        />
                    ))}
                </div>
            </GlassContainer>
        </motion.div>
    );
};

export default AssetAllocation;
