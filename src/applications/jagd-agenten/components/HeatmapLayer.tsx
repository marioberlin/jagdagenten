/**
 * HeatmapLayer
 *
 * Canvas 2D overlay for pigeon-maps showing harvest density visualization.
 * Uses historical journal data to create gradient heatmap of harvest locations.
 */

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { Overlay } from 'pigeon-maps';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HarvestPoint {
    lat: number;
    lon: number;
    species?: string;
    timeOfDay?: 'morning' | 'evening' | 'midday';
    weight?: number; // Intensity multiplier
}

interface HeatmapLayerProps {
    harvests: HarvestPoint[];
    /** Filter by species (optional) */
    speciesFilter?: string;
    /** Map bounds for positioning */
    bounds: {
        ne: [number, number];
        sw: [number, number];
    };
    /** Map center for overlay anchor */
    center: [number, number];
    /** Current map zoom */
    zoom: number;
    /** Opacity of the heatmap (0-1) */
    opacity?: number;
    /** Radius in pixels for each point */
    radius?: number;
    /** Maximum intensity (auto-calculated if not provided) */
    maxIntensity?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Gradient colors from low to high intensity (transparent → yellow → orange → red) */
const HEATMAP_GRADIENT: [number, string][] = [
    [0.0, 'rgba(0, 0, 0, 0)'],
    [0.2, 'rgba(0, 0, 255, 0.3)'],
    [0.4, 'rgba(0, 255, 0, 0.5)'],
    [0.6, 'rgba(255, 255, 0, 0.7)'],
    [0.8, 'rgba(255, 165, 0, 0.85)'],
    [1.0, 'rgba(255, 0, 0, 1)'],
];

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Create a gradient image data for coloring the heatmap
 */
function createGradientData(): Uint8ClampedArray {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    for (const [stop, color] of HEATMAP_GRADIENT) {
        gradient.addColorStop(stop, color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);

    return ctx.getImageData(0, 0, 256, 1).data;
}

/**
 * Convert lat/lon to pixel coordinates within the canvas
 */
function latLonToPixel(
    lat: number,
    lon: number,
    bounds: { ne: [number, number]; sw: [number, number] },
    width: number,
    height: number
): [number, number] {
    const [neLat, neLon] = bounds.ne;
    const [swLat, swLon] = bounds.sw;

    const x = ((lon - swLon) / (neLon - swLon)) * width;
    const y = ((neLat - lat) / (neLat - swLat)) * height;

    return [x, y];
}

/**
 * Draw a radial gradient point on the canvas
 */
function drawHeatPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    intensity: number
) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Colorize the grayscale heatmap using the gradient
 */
function colorizeHeatmap(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gradientData: Uint8ClampedArray,
    opacity: number
) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
        // Use the alpha channel as the intensity lookup
        const intensity = pixels[i + 3];
        if (intensity > 0) {
            const gradientIndex = Math.min(255, intensity) * 4;
            pixels[i] = gradientData[gradientIndex];        // R
            pixels[i + 1] = gradientData[gradientIndex + 1]; // G
            pixels[i + 2] = gradientData[gradientIndex + 2]; // B
            pixels[i + 3] = Math.round(gradientData[gradientIndex + 3] * opacity); // A
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeatmapLayer({
    harvests,
    speciesFilter,
    bounds,
    center,
    zoom,
    opacity = 0.7,
    radius = 30,
    maxIntensity,
}: HeatmapLayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gradientDataRef = useRef<Uint8ClampedArray | null>(null);

    // Filter harvests by species if specified
    const filteredHarvests = useMemo(() => {
        if (!speciesFilter) return harvests;
        return harvests.filter(h => h.species === speciesFilter);
    }, [harvests, speciesFilter]);

    // Calculate canvas dimensions based on zoom
    const canvasSize = useMemo(() => {
        // Scale canvas with zoom level
        const baseSize = 400;
        const scale = Math.pow(2, zoom - 10);
        return Math.max(baseSize, Math.min(2000, baseSize * scale));
    }, [zoom]);

    // Draw heatmap when data or bounds change
    const renderHeatmap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || filteredHarvests.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Initialize gradient data if not already done
        if (!gradientDataRef.current) {
            gradientDataRef.current = createGradientData();
        }

        // Calculate intensity per point
        const calcMaxIntensity = maxIntensity ?? Math.max(1, filteredHarvests.length / 10);
        const pointIntensity = 1 / calcMaxIntensity;

        // Draw grayscale heat points
        for (const harvest of filteredHarvests) {
            const [x, y] = latLonToPixel(
                harvest.lat,
                harvest.lon,
                bounds,
                width,
                height
            );

            // Skip points outside canvas
            if (x < -radius || x > width + radius || y < -radius || y > height + radius) {
                continue;
            }

            // Weight can increase point intensity
            const weight = harvest.weight ?? 1;
            drawHeatPoint(ctx, x, y, radius, pointIntensity * weight);
        }

        // Colorize the heatmap
        colorizeHeatmap(ctx, width, height, gradientDataRef.current, opacity);
    }, [filteredHarvests, bounds, radius, opacity, maxIntensity]);

    // Re-render when dependencies change
    useEffect(() => {
        renderHeatmap();
    }, [renderHeatmap]);

    // Don't render if no harvests
    if (filteredHarvests.length === 0) {
        return null;
    }

    return (
        <Overlay anchor={center} offset={[canvasSize / 2, canvasSize / 2]}>
            <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                style={{
                    width: canvasSize,
                    height: canvasSize,
                    pointerEvents: 'none',
                }}
            />
        </Overlay>
    );
}

export default HeatmapLayer;
