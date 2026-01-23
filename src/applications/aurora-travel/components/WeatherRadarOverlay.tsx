/**
 * Weather Radar Overlay
 * 
 * Rain radar overlay for Google Maps using RainViewer API tiles.
 * Renders precipitation data as a tile layer on the map.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Layers, Play, Pause, RotateCcw } from 'lucide-react';
import { GlassContainer } from '@/components';

// ============================================================================
// Types
// ============================================================================

export interface RadarFrame {
    time: number;
    path: string;
}

export interface RadarData {
    version: string;
    generated: number;
    host: string;
    radar: {
        past: RadarFrame[];
        nowcast: RadarFrame[];
    };
}

export interface WeatherRadarOverlayProps {
    map?: google.maps.Map | null;
    enabled?: boolean;
    opacity?: number;
}

// ============================================================================
// RainViewer API
// ============================================================================

const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';
const TILE_SIZE = 256;

// Fetch radar data from RainViewer
async function fetchRadarData(): Promise<RadarData | null> {
    try {
        const response = await fetch(RAINVIEWER_API);
        if (!response.ok) throw new Error('Failed to fetch radar data');
        return response.json();
    } catch (error) {
        console.error('[WeatherRadar] Failed to fetch radar data:', error);
        return null;
    }
}

// ============================================================================
// Custom Radar Tile Type
// ============================================================================

class RadarTileLayer {
    private tileSize: google.maps.Size;
    private host: string = '';
    private currentPath: string = '';
    private opacity: number = 0.6;
    private tiles: Map<string, HTMLImageElement> = new Map();

    constructor() {
        this.tileSize = new google.maps.Size(TILE_SIZE, TILE_SIZE);
    }

    getTileSize() {
        return this.tileSize;
    }

    setMap(map: google.maps.Map | null) {
        if (map) {
            // Force redraw
            this.tiles.forEach(tile => {
                tile.src = this.getTileSrc(tile.dataset.x!, tile.dataset.y!, tile.dataset.zoom!);
            });
        }
    }

    createTile(coord: google.maps.Point, zoom: number, ownerDocument: Document): HTMLElement {
        const tile = ownerDocument.createElement('img');
        tile.style.width = `${TILE_SIZE}px`;
        tile.style.height = `${TILE_SIZE}px`;
        tile.style.opacity = this.opacity.toString();
        tile.dataset.x = coord.x.toString();
        tile.dataset.y = coord.y.toString();
        tile.dataset.zoom = zoom.toString();

        if (this.currentPath) {
            tile.src = this.getTileSrc(coord.x.toString(), coord.y.toString(), zoom.toString());
        }

        const tileKey = `${zoom}_${coord.x}_${coord.y}`;
        this.tiles.set(tileKey, tile);

        return tile;
    }

    releaseTile(tile: HTMLElement): void {
        const img = tile as HTMLImageElement;
        const tileKey = `${img.dataset.zoom}_${img.dataset.x}_${img.dataset.y}`;
        this.tiles.delete(tileKey);
    }

    setRadarPath(host: string, path: string) {
        this.host = host;
        this.currentPath = path;
        // Update all tiles
        this.tiles.forEach(tile => {
            tile.src = this.getTileSrc(tile.dataset.x!, tile.dataset.y!, tile.dataset.zoom!);
        });
    }

    setOpacity(opacity: number) {
        this.opacity = opacity;
        this.tiles.forEach(tile => {
            tile.style.opacity = opacity.toString();
        });
    }

    private getTileSrc(x: string, y: string, zoom: string): string {
        if (!this.host || !this.currentPath) return '';
        // RainViewer tile URL format
        return `${this.host}${this.currentPath}/${TILE_SIZE}/${zoom}/${x}/${y}/2/1_1.png`;
    }
}

// ============================================================================
// Radar Controls
// ============================================================================

interface RadarControlsProps {
    frames: RadarFrame[];
    currentIndex: number;
    isPlaying: boolean;
    opacity: number;
    onFrameChange: (index: number) => void;
    onPlayToggle: () => void;
    onOpacityChange: (opacity: number) => void;
    onRefresh: () => void;
}

const RadarControls: React.FC<RadarControlsProps> = ({
    frames,
    currentIndex,
    isPlaying,
    opacity,
    onFrameChange,
    onPlayToggle,
    onOpacityChange,
    onRefresh,
}) => {
    const currentFrame = frames[currentIndex];
    const frameTime = currentFrame
        ? new Date(currentFrame.time * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : '--:--';

    return (
        <GlassContainer className="p-3" border>
            <div className="flex items-center gap-3">
                {/* Layer Icon */}
                <Cloud size={18} className="text-blue-400" />

                {/* Time */}
                <div className="text-sm font-mono text-primary">{frameTime}</div>

                {/* Play/Pause */}
                <button
                    onClick={onPlayToggle}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-secondary hover:text-primary transition-colors"
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                {/* Timeline */}
                <input
                    type="range"
                    min={0}
                    max={frames.length - 1}
                    value={currentIndex}
                    onChange={(e) => onFrameChange(parseInt(e.target.value))}
                    className="flex-1 h-1 accent-blue-500"
                />

                {/* Opacity */}
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-tertiary" />
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={opacity * 100}
                        onChange={(e) => onOpacityChange(parseInt(e.target.value) / 100)}
                        className="w-16 h-1 accent-blue-500"
                    />
                </div>

                {/* Refresh */}
                <button
                    onClick={onRefresh}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
                >
                    <RotateCcw size={14} />
                </button>
            </div>
        </GlassContainer>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const WeatherRadarOverlay: React.FC<WeatherRadarOverlayProps> = ({
    map,
    enabled = true,
    opacity: initialOpacity = 0.6,
}) => {
    const [radarData, setRadarData] = useState<RadarData | null>(null);
    const [frames, setFrames] = useState<RadarFrame[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [opacity, setOpacity] = useState(initialOpacity);
    const [tileLayer, setTileLayer] = useState<RadarTileLayer | null>(null);

    // Fetch radar data
    const loadRadarData = useCallback(async () => {
        const data = await fetchRadarData();
        if (data) {
            setRadarData(data);
            const allFrames = [...data.radar.past, ...data.radar.nowcast];
            setFrames(allFrames);
            setCurrentIndex(data.radar.past.length - 1); // Start at most recent past frame
        }
    }, []);

    // Initialize
    useEffect(() => {
        loadRadarData();
    }, [loadRadarData]);

    // Setup tile layer when map is available
    useEffect(() => {
        if (!map || !window.google?.maps) return;

        const layer = new RadarTileLayer();

        // Add to map as overlay
        map.overlayMapTypes.push(layer as unknown as google.maps.MapType);
        setTileLayer(layer);

        return () => {
            const index = map.overlayMapTypes.getArray().indexOf(layer as unknown as google.maps.MapType);
            if (index > -1) {
                map.overlayMapTypes.removeAt(index);
            }
        };
    }, [map]);

    // Update tile layer when frame changes
    useEffect(() => {
        if (tileLayer && radarData && frames[currentIndex]) {
            tileLayer.setRadarPath(radarData.host, frames[currentIndex].path);
        }
    }, [tileLayer, radarData, frames, currentIndex]);

    // Update opacity
    useEffect(() => {
        if (tileLayer) {
            tileLayer.setOpacity(opacity);
        }
    }, [tileLayer, opacity]);

    // Animation loop
    useEffect(() => {
        if (!isPlaying || frames.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % frames.length);
        }, 500);

        return () => clearInterval(interval);
    }, [isPlaying, frames.length]);

    if (!enabled || frames.length === 0) return null;

    return (
        <RadarControls
            frames={frames}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            opacity={opacity}
            onFrameChange={setCurrentIndex}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onOpacityChange={setOpacity}
            onRefresh={loadRadarData}
        />
    );
};

export default WeatherRadarOverlay;
