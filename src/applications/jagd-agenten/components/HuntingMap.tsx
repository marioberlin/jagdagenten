/**
 * HuntingMap
 * 
 * Interactive map component for hunting grounds with:
 * - Stand markers (Hochsitz, Kanzel, Ansitz)
 * - Wind-based scent cone visualization
 * - Revier boundary display
 * 
 * Uses pigeon-maps for lightweight, offline-friendly mapping.
 */

import { useState, useMemo, useCallback } from 'react';
import { Map, Marker, Overlay, GeoJson } from 'pigeon-maps';
import { Crosshair, Wind, Layers, Plus, Navigation, Flame } from 'lucide-react';
import { HeatmapLayer, type HarvestPoint } from './HeatmapLayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HuntStand {
    id: string;
    name: string;
    type: 'hochsitz' | 'kanzel' | 'ansitz' | 'other';
    lat: number;
    lon: number;
    notes?: string;
    lastHarvest?: string;
}

export interface WindData {
    direction: number; // degrees, 0 = North
    speed: number;     // km/h
}

export interface RevierBoundary {
    id: string;
    name: string;
    coordinates: [number, number][]; // [lat, lon] pairs
}

interface HuntingMapProps {
    stands: HuntStand[];
    wind?: WindData;
    boundaries?: RevierBoundary[];
    harvests?: HarvestPoint[];
    center?: [number, number];
    zoom?: number;
    onStandClick?: (stand: HuntStand) => void;
    onAddStand?: (lat: number, lon: number) => void;
    selectedStandId?: string;
    className?: string;
}

// ---------------------------------------------------------------------------
// Scent Cone Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate scent cone polygon points based on wind direction and speed.
 * The cone extends downwind from the stand position.
 */
function calculateScentCone(
    standLat: number,
    standLon: number,
    windDirection: number,
    windSpeed: number
): [number, number][] {
    // Scent travels downwind (opposite to wind direction)
    const downwindAngle = (windDirection + 180) % 360;

    // Cone length based on wind speed (stronger wind = longer cone)
    const baseLengthKm = 0.3 + (windSpeed / 30) * 0.5; // 300m to 800m

    // Cone spread angle (weaker wind = wider spread)
    const spreadAngle = Math.max(15, 45 - windSpeed); // 15° to 45°

    // Convert km to approximate lat/lon degrees (rough approximation)
    const kmToLat = 1 / 111; // ~111km per degree latitude
    const kmToLon = 1 / (111 * Math.cos(standLat * Math.PI / 180));

    const lengthLat = baseLengthKm * kmToLat;
    const lengthLon = baseLengthKm * kmToLon;

    // Calculate cone points
    const points: [number, number][] = [];

    // Start point (stand position)
    points.push([standLat, standLon]);

    // Left edge of cone
    const leftAngle = (downwindAngle - spreadAngle) * Math.PI / 180;
    points.push([
        standLat + lengthLat * Math.cos(leftAngle),
        standLon + lengthLon * Math.sin(leftAngle),
    ]);

    // Tip of cone (center)
    const centerAngle = downwindAngle * Math.PI / 180;
    points.push([
        standLat + lengthLat * 1.2 * Math.cos(centerAngle),
        standLon + lengthLon * 1.2 * Math.sin(centerAngle),
    ]);

    // Right edge of cone
    const rightAngle = (downwindAngle + spreadAngle) * Math.PI / 180;
    points.push([
        standLat + lengthLat * Math.cos(rightAngle),
        standLon + lengthLon * Math.sin(rightAngle),
    ]);

    // Close the polygon
    points.push([standLat, standLon]);

    return points;
}

// ---------------------------------------------------------------------------
// Stand Marker Component
// ---------------------------------------------------------------------------

function StandMarker({
    stand,
    isSelected,
    onClick
}: {
    stand: HuntStand;
    isSelected: boolean;
    onClick: () => void;
}) {
    const colors = {
        hochsitz: '#22c55e',  // green
        kanzel: '#3b82f6',    // blue
        ansitz: '#f59e0b',    // amber
        other: '#6b7280',     // gray
    };

    const color = colors[stand.type] || colors.other;

    return (
        <div
            onClick={onClick}
            className={`
        cursor-pointer transition-transform hover:scale-110
        ${isSelected ? 'scale-125' : ''}
      `}
            style={{
                width: 32,
                height: 32,
                borderRadius: '50% 50% 50% 0',
                backgroundColor: color,
                transform: 'rotate(-45deg)',
                border: isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.5)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Crosshair
                size={16}
                color="white"
                style={{ transform: 'rotate(45deg)' }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Scent Cone Overlay
// ---------------------------------------------------------------------------

function ScentConeOverlay({
    stand,
    wind,
}: {
    stand: HuntStand;
    wind: WindData;
}) {
    const conePoints = useMemo(() =>
        calculateScentCone(stand.lat, stand.lon, wind.direction, wind.speed),
        [stand.lat, stand.lon, wind.direction, wind.speed]
    );

    // Convert to SVG path
    const pathData = useMemo(() => {
        if (conePoints.length < 3) return '';
        return conePoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[1]} ${p[0]}`)
            .join(' ') + ' Z';
    }, [conePoints]);

    return (
        <Overlay anchor={[stand.lat, stand.lon]} offset={[0, 0]}>
            <svg
                width={200}
                height={200}
                viewBox="-0.01 -0.01 0.02 0.02"
                style={{
                    position: 'absolute',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                }}
            >
                <path
                    d={pathData}
                    fill="rgba(251, 146, 60, 0.3)"
                    stroke="rgba(251, 146, 60, 0.8)"
                    strokeWidth={0.0005}
                />
            </svg>
        </Overlay>
    );
}

// ---------------------------------------------------------------------------
// Wind Indicator
// ---------------------------------------------------------------------------

function WindIndicator({ wind }: { wind: WindData }) {
    return (
        <div className="absolute top-4 right-4 z-10 px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <div
                    className="w-6 h-6 flex items-center justify-center"
                    style={{ transform: `rotate(${wind.direction}deg)` }}
                >
                    <Navigation size={20} className="text-orange-400" />
                </div>
                <div className="text-sm">
                    <span className="font-medium text-[var(--text-primary)]">
                        {wind.speed} km/h
                    </span>
                    <span className="text-[var(--text-secondary)] ml-1">
                        {getWindDirectionLabel(wind.direction)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function getWindDirectionLabel(degrees: number): string {
    const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(degrees / 45) % 8;
    return directions[idx];
}

// ---------------------------------------------------------------------------
// Layer Controls
// ---------------------------------------------------------------------------

function LayerControls({
    showScent,
    showHeatmap,
    onToggleScent,
    onToggleHeatmap,
}: {
    showScent: boolean;
    showHeatmap: boolean;
    onToggleScent: () => void;
    onToggleHeatmap: () => void;
}) {
    return (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
            <button
                onClick={onToggleScent}
                className={`
          p-2 rounded-lg border backdrop-blur-sm transition-colors
          ${showScent
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                    }
        `}
                title="Witterungskegel anzeigen"
            >
                <Wind size={20} />
            </button>
            <button
                onClick={onToggleHeatmap}
                className={`
          p-2 rounded-lg border backdrop-blur-sm transition-colors
          ${showHeatmap
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                    }
        `}
                title="Erlegungsheatmap anzeigen"
            >
                <Flame size={20} />
            </button>
            <button
                className="p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] backdrop-blur-sm text-[var(--text-secondary)]"
                title="Kartenebenen"
            >
                <Layers size={20} />
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function HuntingMap({
    stands,
    wind,
    boundaries,
    harvests = [],
    center = [51.1657, 10.4515], // Germany center
    zoom = 14,
    onStandClick,
    onAddStand,
    selectedStandId,
    className = '',
}: HuntingMapProps) {
    const [mapCenter, setMapCenter] = useState<[number, number]>(center);
    const [mapZoom, setMapZoom] = useState(zoom);
    const [showScent, setShowScent] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [mapBounds, setMapBounds] = useState<{
        ne: [number, number];
        sw: [number, number];
    } | null>(null);

    const handleBoundsChange = useCallback(({ center, zoom, bounds }: {
        center: [number, number];
        zoom: number;
        bounds: { ne: [number, number]; sw: [number, number] };
    }) => {
        setMapCenter(center);
        setMapZoom(zoom);
        setMapBounds(bounds);
    }, []);

    const handleMapClick = useCallback(({ latLng }: { latLng: [number, number] }) => {
        if (onAddStand) {
            onAddStand(latLng[0], latLng[1]);
        }
    }, [onAddStand]);

    const selectedStand = useMemo(
        () => stands.find(s => s.id === selectedStandId),
        [stands, selectedStandId]
    );

    // GeoJSON for revier boundaries
    const boundaryGeoJson = useMemo(() => {
        if (!boundaries || boundaries.length === 0) return null;
        return {
            type: 'FeatureCollection' as const,
            features: boundaries.map(b => ({
                type: 'Feature' as const,
                properties: { name: b.name },
                geometry: {
                    type: 'Polygon' as const,
                    coordinates: [b.coordinates.map(c => [c[1], c[0]])], // GeoJSON is [lon, lat]
                },
            })),
        };
    }, [boundaries]);

    return (
        <div className={`relative w-full h-full min-h-[400px] rounded-xl overflow-hidden ${className}`}>
            <Map
                center={mapCenter}
                zoom={mapZoom}
                onBoundsChanged={handleBoundsChange}
                onClick={handleMapClick}
                attribution={false}
            >
                {/* Revier Boundaries */}
                {boundaryGeoJson && (
                    <GeoJson
                        data={boundaryGeoJson}
                        styleCallback={() => ({
                            fill: 'rgba(34, 197, 94, 0.1)',
                            stroke: '#22c55e',
                            strokeWidth: 2,
                        })}
                    />
                )}

                {/* Scent Cones for selected stand */}
                {showScent && wind && selectedStand && (
                    <ScentConeOverlay stand={selectedStand} wind={wind} />
                )}

                {/* Harvest Heatmap Layer */}
                {showHeatmap && mapBounds && harvests.length > 0 && (
                    <HeatmapLayer
                        harvests={harvests}
                        bounds={mapBounds}
                        center={mapCenter}
                        zoom={mapZoom}
                        opacity={0.6}
                        radius={40}
                    />
                )}

                {/* Stand Markers */}
                {stands.map(stand => (
                    <Marker
                        key={stand.id}
                        anchor={[stand.lat, stand.lon]}
                        offset={[16, 32]}
                    >
                        <StandMarker
                            stand={stand}
                            isSelected={stand.id === selectedStandId}
                            onClick={() => onStandClick?.(stand)}
                        />
                    </Marker>
                ))}
            </Map>

            {/* Wind Indicator */}
            {wind && <WindIndicator wind={wind} />}

            {/* Layer Controls */}
            <LayerControls
                showScent={showScent}
                showHeatmap={showHeatmap}
                onToggleScent={() => setShowScent(!showScent)}
                onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            />

            {/* Add Stand FAB */}
            {onAddStand && (
                <button
                    className="absolute bottom-4 right-4 z-10 p-3 rounded-full bg-[var(--glass-accent)] text-white shadow-lg hover:opacity-90 transition-opacity"
                    title="Stand hinzufügen"
                >
                    <Plus size={24} />
                </button>
            )}
        </div>
    );
}

export default HuntingMap;
