/**
 * DistanceRingsOverlay
 *
 * SVG overlay showing concentric distance rings from a selected stand.
 * Works with pigeon-maps by rendering an absolute SVG overlay.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DistanceRingsOverlayProps {
    center: [number, number];
    distances?: number[]; // meters
    color?: string;
    showLabels?: boolean;
    mapWidth: number;
    mapHeight: number;
    zoom: number;
    latLngToPixel: (latLng: [number, number]) => [number, number];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistanceRingsOverlay({
    center,
    distances = [50, 100, 150, 200, 250, 300],
    color = 'rgba(52, 211, 153, 0.6)',
    showLabels = true,
    mapWidth,
    mapHeight,
    zoom,
    latLngToPixel,
}: DistanceRingsOverlayProps) {
    // Calculate pixel radius for each distance
    // Approximate pixels per meter at current zoom level
    const metersPerPixel = getMetersPerPixel(center[0], zoom);

    const centerPixel = latLngToPixel(center);

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            width={mapWidth}
            height={mapHeight}
            style={{ zIndex: 400 }}
        >
            {distances.map((distance, index) => {
                const radiusPixels = distance / metersPerPixel;
                const opacity = 0.6 - (index * 0.08);
                const isDashed = index > 2;

                return (
                    <g key={distance}>
                        {/* Circle */}
                        <circle
                            cx={centerPixel[0]}
                            cy={centerPixel[1]}
                            r={radiusPixels}
                            fill="none"
                            stroke={color}
                            strokeWidth={1}
                            strokeOpacity={Math.max(0.2, opacity)}
                            strokeDasharray={isDashed ? '5,5' : undefined}
                        />

                        {/* Label */}
                        {showLabels && (
                            <text
                                x={centerPixel[0] + radiusPixels * 0.7}
                                y={centerPixel[1] - radiusPixels * 0.7}
                                fill={color}
                                fontSize={10}
                                fontWeight={500}
                            >
                                <tspan
                                    style={{
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        padding: '1px 4px',
                                    }}
                                >
                                    {distance}m
                                </tspan>
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Center dot */}
            <circle
                cx={centerPixel[0]}
                cy={centerPixel[1]}
                r={4}
                fill={color}
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate meters per pixel at a given latitude and zoom level
 */
function getMetersPerPixel(latitude: number, zoom: number): number {
    // Earth circumference at the equator (meters)
    const earthCircumference = 40075016.686;

    // Mercator projection adjustment for latitude
    const latRadians = latitude * Math.PI / 180;

    // Meters per pixel at this zoom and latitude
    return (earthCircumference * Math.cos(latRadians)) / (256 * Math.pow(2, zoom));
}

export default DistanceRingsOverlay;
