/**
 * NoGoZoneOverlay
 *
 * Map overlay for danger zones, no-shoot directions, and road buffers.
 * Used in Drückjagd and regular hunting sessions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ZoneType = 'no_shoot' | 'road' | 'building' | 'treiber_corridor';

export interface NoGoZone {
    id: string;
    type: ZoneType;
    name?: string;
    geometry: {
        type: 'polygon' | 'line' | 'arc';
        coordinates: [number, number][];
        // For arcs: center, startAngle, endAngle, radius
        arcData?: {
            center: [number, number];
            startAngle: number;
            endAngle: number;
            radius: number; // meters
        };
    };
}

interface NoGoZoneOverlayProps {
    zones: NoGoZone[];
    mapWidth: number;
    mapHeight: number;
    latLngToPixel: (latLng: [number, number]) => [number, number];
    zoom: number;
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string }> = {
    no_shoot: { fill: 'rgba(239, 68, 68, 0.25)', stroke: 'rgba(239, 68, 68, 0.8)' },    // Red
    road: { fill: 'rgba(251, 191, 36, 0.2)', stroke: 'rgba(251, 191, 36, 0.7)' },       // Amber
    building: { fill: 'rgba(239, 68, 68, 0.3)', stroke: 'rgba(239, 68, 68, 0.9)' },     // Red
    treiber_corridor: { fill: 'rgba(59, 130, 246, 0.2)', stroke: 'rgba(59, 130, 246, 0.6)' }, // Blue
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NoGoZoneOverlay({
    zones,
    mapWidth,
    mapHeight,
    latLngToPixel,
    zoom,
}: NoGoZoneOverlayProps) {
    const metersPerPixel = getMetersPerPixel(52.52, zoom); // Approximate for Germany

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            width={mapWidth}
            height={mapHeight}
            style={{ zIndex: 350 }}
        >
            <defs>
                {/* Diagonal hatch pattern for no-shoot zones */}
                <pattern id="noShootHatch" patternUnits="userSpaceOnUse" width="8" height="8">
                    <path
                        d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
                        stroke="rgba(239, 68, 68, 0.4)"
                        strokeWidth="1"
                    />
                </pattern>
            </defs>

            {zones.map((zone) => {
                const colors = ZONE_COLORS[zone.type];

                if (zone.geometry.type === 'polygon') {
                    const points = zone.geometry.coordinates
                        .map((coord) => latLngToPixel(coord))
                        .map(([x, y]) => `${x},${y}`)
                        .join(' ');

                    return (
                        <g key={zone.id}>
                            <polygon
                                points={points}
                                fill={zone.type === 'no_shoot' ? 'url(#noShootHatch)' : colors.fill}
                                stroke={colors.stroke}
                                strokeWidth={2}
                            />
                            {zone.name && (
                                <text
                                    x={latLngToPixel(zone.geometry.coordinates[0])[0]}
                                    y={latLngToPixel(zone.geometry.coordinates[0])[1] - 5}
                                    fill={colors.stroke}
                                    fontSize={10}
                                    fontWeight={600}
                                >
                                    {zone.name}
                                </text>
                            )}
                        </g>
                    );
                }

                if (zone.geometry.type === 'line') {
                    const path = zone.geometry.coordinates
                        .map((coord, i) => {
                            const [x, y] = latLngToPixel(coord);
                            return i === 0 ? `M${x},${y}` : `L${x},${y}`;
                        })
                        .join(' ');

                    return (
                        <path
                            key={zone.id}
                            d={path}
                            fill="none"
                            stroke={colors.stroke}
                            strokeWidth={zone.type === 'road' ? 6 : 3}
                            strokeLinecap="round"
                            strokeDasharray={zone.type === 'treiber_corridor' ? '10,5' : undefined}
                        />
                    );
                }

                if (zone.geometry.type === 'arc' && zone.geometry.arcData) {
                    const { center, startAngle, endAngle, radius } = zone.geometry.arcData;
                    const radiusPixels = radius / metersPerPixel;
                    const [cx, cy] = latLngToPixel(center);

                    // Calculate arc path
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    const x1 = cx + radiusPixels * Math.cos(startRad);
                    const y1 = cy - radiusPixels * Math.sin(startRad);
                    const x2 = cx + radiusPixels * Math.cos(endRad);
                    const y2 = cy - radiusPixels * Math.sin(endRad);

                    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
                    const sweep = endAngle > startAngle ? 0 : 1;

                    const arcPath = `M${cx},${cy} L${x1},${y1} A${radiusPixels},${radiusPixels} 0 ${largeArc},${sweep} ${x2},${y2} Z`;

                    return (
                        <path
                            key={zone.id}
                            d={arcPath}
                            fill="url(#noShootHatch)"
                            stroke={colors.stroke}
                            strokeWidth={2}
                        />
                    );
                }

                return null;
            })}
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMetersPerPixel(latitude: number, zoom: number): number {
    const earthCircumference = 40075016.686;
    const latRadians = latitude * Math.PI / 180;
    return (earthCircumference * Math.cos(latRadians)) / (256 * Math.pow(2, zoom));
}

// ---------------------------------------------------------------------------
// Factory Functions
// ---------------------------------------------------------------------------

export function createNoShootArc(
    standPosition: [number, number],
    startAngle: number,
    endAngle: number,
    maxDistance: number = 300
): NoGoZone {
    return {
        id: `no-shoot-${Date.now()}`,
        type: 'no_shoot',
        name: 'Schussverbot',
        geometry: {
            type: 'arc',
            coordinates: [standPosition],
            arcData: {
                center: standPosition,
                startAngle,
                endAngle,
                radius: maxDistance,
            },
        },
    };
}

export function createRoadBuffer(
    roadCoordinates: [number, number][],
    _bufferMeters: number = 50
): NoGoZone {
    return {
        id: `road-${Date.now()}`,
        type: 'road',
        name: 'Straße',
        geometry: {
            type: 'line',
            coordinates: roadCoordinates,
        },
    };
}

export function createTreiberCorridor(
    corridorCoordinates: [number, number][]
): NoGoZone {
    return {
        id: `treiber-${Date.now()}`,
        type: 'treiber_corridor',
        name: 'Treiberrichtung',
        geometry: {
            type: 'line',
            coordinates: corridorCoordinates,
        },
    };
}

export default NoGoZoneOverlay;
