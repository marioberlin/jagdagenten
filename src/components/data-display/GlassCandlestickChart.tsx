import React, { useMemo, useState, useRef, useEffect } from 'react';

import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface CandlestickData {
    timestamp: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume?: number;
}

interface GlassCandlestickChartProps {
    data: CandlestickData[];
    title?: string;
    width?: number;
    height?: number;
    upColor?: string;
    downColor?: string;
    className?: string;
    ariaLabel?: string;
    ariaDescription?: string;
    showVolume?: boolean;
}

export const GlassCandlestickChart = ({
    data,
    title,
    width: propWidth,
    height: propHeight = 400,
    upColor = '#22c55e',
    downColor = '#ef4444',
    className,
    ariaLabel,
    ariaDescription,
    showVolume = false
}: GlassCandlestickChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: propWidth || 800, height: propHeight });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState(0);
    const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Responsive sizing
    useEffect(() => {
        if (!containerRef.current || propWidth) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setDimensions({
                    width: entry.contentRect.width - 80, // Account for Y-axis
                    height: entry.contentRect.height - 50 // Account for X-axis
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [propWidth]);

    const { width, height } = dimensions;
    const chartHeight = showVolume ? height * 0.75 : height;
    const volumeHeight = showVolume ? height * 0.2 : 0;
    const yAxisWidth = 70;
    const xAxisHeight = 30;

    // Apply zoom and pan to visible data
    const visibleData = useMemo(() => {
        const totalCandles = data.length;
        const visibleCount = Math.max(20, Math.floor(totalCandles / zoomLevel));
        const start = Math.max(0, Math.min(totalCandles - visibleCount, panOffset));
        return data.slice(start, start + visibleCount);
    }, [data, zoomLevel, panOffset]);

    // Calculate price range for visible data
    const { minPrice, priceRange, priceLabels } = useMemo(() => {
        if (visibleData.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100, priceLabels: [] };

        const allPrices = visibleData.flatMap(d => [d.low, d.high]);
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);
        const range = max - min || 1;
        const padding = range * 0.05;

        // Generate nice round price labels
        const labelCount = 5;
        const step = range / (labelCount - 1);
        const labels: number[] = [];
        for (let i = 0; i < labelCount; i++) {
            labels.push(min + step * i);
        }

        return {
            minPrice: min - padding,
            maxPrice: max + padding,
            priceRange: range + padding * 2,
            priceLabels: labels
        };
    }, [visibleData]);

    // Calculate volume range
    const maxVolume = useMemo(() => {
        if (!showVolume || visibleData.length === 0) return 1;
        return Math.max(...visibleData.map(d => d.volume || 0)) || 1;
    }, [visibleData, showVolume]);

    // Helpers
    const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;


    const candleWidth = Math.max(2, (width / visibleData.length) * 0.7);
    const spacing = width / visibleData.length;

    // Generate time labels (show ~6 labels)
    const timeLabels = useMemo(() => {
        if (visibleData.length === 0) return [];
        const labelCount = Math.min(6, visibleData.length);
        const step = Math.floor(visibleData.length / labelCount);
        return visibleData
            .filter((_, i) => i % step === 0)
            .map((d, i) => ({ time: d.timestamp, x: (i * step) * spacing + spacing / 2 }));
    }, [visibleData, spacing]);

    // Format price for display
    const formatPrice = (price: number) => {
        if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
        if (price >= 100) return price.toFixed(2);
        if (price >= 1) return price.toFixed(4);
        return price.toFixed(6);
    };

    // Zoom controls
    const handleZoomIn = () => setZoomLevel(z => Math.min(z * 1.5, 10));
    const handleZoomOut = () => setZoomLevel(z => Math.max(z / 1.5, 1));
    const handleReset = () => { setZoomLevel(1); setPanOffset(0); };

    // Mouse handlers for crosshair
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        // Find hovered candle
        const candleIndex = Math.floor(x / spacing);
        if (candleIndex >= 0 && candleIndex < visibleData.length) {
            setHoveredCandle(visibleData[candleIndex]);
        }
    };

    const handleMouseLeave = () => {
        setHoveredCandle(null);
    };

    if (data.length === 0) {
        return (
            <GlassContainer className={cn("p-4 flex items-center justify-center", className)}>
                <span className="text-secondary">No data available</span>
            </GlassContainer>
        );
    }

    return (
        <div ref={containerRef} className={cn("relative w-full h-full", className)}>
            {/* Chart Header */}
            {title && (
                <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="text-white font-medium text-sm">{title}</h3>
                </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 z-20 flex gap-1 bg-black/40 rounded-lg p-1">
                <button
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn size={16} />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut size={16} />
                </button>
                <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    title="Reset"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* OHLC Tooltip */}
            {hoveredCandle && (
                <div className="absolute top-2 left-2 z-20 bg-glass-panel/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-mono border border-glass-border">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-secondary">Time:</span>
                        <span className="text-white">{hoveredCandle.timestamp}</span>
                        <span className="text-secondary">Open:</span>
                        <span className="text-white">{formatPrice(hoveredCandle.open)}</span>
                        <span className="text-secondary">High:</span>
                        <span className="text-green-400">{formatPrice(hoveredCandle.high)}</span>
                        <span className="text-secondary">Low:</span>
                        <span className="text-red-400">{formatPrice(hoveredCandle.low)}</span>
                        <span className="text-secondary">Close:</span>
                        <span className={hoveredCandle.close >= hoveredCandle.open ? "text-green-400" : "text-red-400"}>
                            {formatPrice(hoveredCandle.close)}
                        </span>
                    </div>
                </div>
            )}

            <svg
                width={width + yAxisWidth}
                height={height + xAxisHeight}
                className="overflow-visible"
                role="img"
                aria-label={ariaLabel}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {ariaDescription && <desc>{ariaDescription}</desc>}

                {/* Chart Background */}
                <rect
                    x={0}
                    y={0}
                    width={width}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                />

                {/* Horizontal Grid Lines & Y-Axis Labels (Right Side) */}
                {priceLabels.map((price, i) => {
                    const y = getY(price);
                    return (
                        <g key={`grid - ${i} `}>
                            <line
                                x1={0}
                                y1={y}
                                x2={width}
                                y2={y}
                                stroke="var(--glass-border)"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                className="opacity-30"
                            />
                            <text
                                x={width + 8}
                                y={y}
                                dominantBaseline="middle"
                                textAnchor="start"
                                fill="rgba(255, 255, 255, 0.7)"
                                fontSize="11"
                                fontFamily="monospace"
                            >
                                ${formatPrice(price)}
                            </text>
                        </g>
                    );
                })}

                {/* Current Price Highlight Line */}
                {visibleData.length > 0 && (
                    <g>
                        <line
                            x1={0}
                            y1={getY(visibleData[visibleData.length - 1].close)}
                            x2={width}
                            y2={getY(visibleData[visibleData.length - 1].close)}
                            stroke={visibleData[visibleData.length - 1].close >= visibleData[visibleData.length - 1].open ? upColor : downColor}
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            className="opacity-60"
                        />
                        <rect
                            x={width + 4}
                            y={getY(visibleData[visibleData.length - 1].close) - 10}
                            width={yAxisWidth - 8}
                            height={20}
                            rx={4}
                            fill={visibleData[visibleData.length - 1].close >= visibleData[visibleData.length - 1].open ? upColor : downColor}
                            fillOpacity={0.3}
                        />
                        <text
                            x={width + 8}
                            y={getY(visibleData[visibleData.length - 1].close)}
                            dominantBaseline="middle"
                            textAnchor="start"
                            className="text-[10px] font-mono font-bold"
                            fill={visibleData[visibleData.length - 1].close >= visibleData[visibleData.length - 1].open ? upColor : downColor}
                        >
                            ${formatPrice(visibleData[visibleData.length - 1].close)}
                        </text>
                    </g>
                )}

                {/* Crosshair */}
                {hoveredCandle && mousePos.x < width && mousePos.y < chartHeight && (
                    <g className="pointer-events-none">
                        <line
                            x1={mousePos.x}
                            y1={0}
                            x2={mousePos.x}
                            y2={chartHeight}
                            stroke="white"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            className="opacity-40"
                        />
                        <line
                            x1={0}
                            y1={mousePos.y}
                            x2={width}
                            y2={mousePos.y}
                            stroke="white"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            className="opacity-40"
                        />
                    </g>
                )}

                {/* Candlesticks */}
                {visibleData.map((d, i) => {
                    const isUp = d.close >= d.open;
                    const color = isUp ? upColor : downColor;

                    const x = i * spacing + (spacing - candleWidth) / 2;
                    const yHigh = getY(d.high);
                    const yLow = getY(d.low);
                    const yOpen = getY(d.open);
                    const yClose = getY(d.close);

                    const boxTop = Math.min(yOpen, yClose);
                    const boxHeight = Math.max(1, Math.abs(yOpen - yClose));

                    return (
                        <g key={i} className="group">
                            {/* Wick */}
                            <line
                                x1={x + candleWidth / 2}
                                y1={yHigh}
                                x2={x + candleWidth / 2}
                                y2={yLow}
                                stroke={color}
                                strokeWidth="1"
                                className="opacity-70"
                            />
                            {/* Candle Body */}
                            <rect
                                x={x}
                                y={boxTop}
                                width={candleWidth}
                                height={boxHeight}
                                fill={isUp ? 'transparent' : color}
                                stroke={color}
                                strokeWidth="1"
                                className="transition-opacity hover:opacity-100"
                            />
                        </g>
                    );
                })}

                {/* Volume Bars */}
                {showVolume && (
                    <g transform={`translate(0, ${chartHeight + 10})`}>
                        {visibleData.map((d, i) => {
                            const x = i * spacing + (spacing - candleWidth) / 2;
                            const volHeight = (d.volume || 0) / maxVolume * volumeHeight;
                            const isUp = d.close >= d.open;

                            return (
                                <rect
                                    key={`vol - ${i} `}
                                    x={x}
                                    y={volumeHeight - volHeight}
                                    width={candleWidth}
                                    height={volHeight}
                                    fill={isUp ? upColor : downColor}
                                    fillOpacity={0.3}
                                />
                            );
                        })}
                    </g>
                )}

                {/* X-Axis Time Labels */}
                <g transform={`translate(0, ${chartHeight + (showVolume ? volumeHeight + 15 : 5)})`}>
                    {timeLabels.map((label, i) => (
                        <text
                            key={`time - ${i} `}
                            x={label.x}
                            y={15}
                            textAnchor="middle"
                            fill="rgba(255, 255, 255, 0.7)"
                            fontSize="11"
                            fontFamily="monospace"
                        >
                            {label.time}
                        </text>
                    ))}
                </g>
            </svg>
        </div>
    );
};

GlassCandlestickChart.displayName = 'GlassCandlestickChart';
