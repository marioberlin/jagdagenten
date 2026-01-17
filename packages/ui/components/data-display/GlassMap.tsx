import { Map, Marker, Overlay } from 'pigeon-maps';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { GlassCard } from '../data-display/GlassCard';

export interface MapMarker {
    id: string;
    lat: number;
    lng: number;
    label: string;
    color?: string;
}

interface GlassMapProps {
    className?: string;
    defaultCenter?: [number, number];
    defaultZoom?: number;
    markers?: MapMarker[];
    autoFit?: boolean; // Auto-fit bounds to show all markers
}

export function GlassMap({
    className,
    defaultCenter = [35.6762, 139.6503], // Tokyo
    defaultZoom = 4,
    markers = [],
    autoFit = true
}: GlassMapProps) {
    const [center, setCenter] = useState<[number, number]>(defaultCenter);
    const [zoom, setZoom] = useState(defaultZoom);
    const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

    // Get container dimensions for responsive sizing
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width || 400,
                    height: rect.height || 400
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        // Use ResizeObserver for container changes
        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateDimensions);
            observer.disconnect();
        };
    }, []);

    // Track marker IDs to detect changes
    const markerKey = markers.map(m => m.id).join(',');

    // Auto-fit to show all markers when they change
    useEffect(() => {
        if (autoFit && markers.length > 0) {
            // Calculate bounds
            const lats = markers.map(m => m.lat);
            const lngs = markers.map(m => m.lng);

            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            // Calculate center
            const newCenter: [number, number] = [
                (minLat + maxLat) / 2,
                (minLng + maxLng) / 2
            ];

            // Calculate appropriate zoom level based on bounds
            const latDiff = maxLat - minLat;
            const lngDiff = maxLng - minLng;
            const maxDiff = Math.max(latDiff, lngDiff);

            let newZoom = 5; // Default
            if (maxDiff > 100) newZoom = 2;
            else if (maxDiff > 50) newZoom = 3;
            else if (maxDiff > 20) newZoom = 4;
            else if (maxDiff > 10) newZoom = 5;
            else if (maxDiff > 5) newZoom = 6;
            else if (maxDiff > 2) newZoom = 7;
            else if (maxDiff > 1) newZoom = 8;
            else newZoom = 10;

            console.log('[GlassMap] Auto-fitting to', markers.length, 'markers, center:', newCenter, 'zoom:', newZoom);
            setCenter(newCenter);
            setZoom(newZoom);
        } else if (markers.length === 0) {
            setCenter(defaultCenter);
            setZoom(defaultZoom);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markerKey, autoFit]); // Use markerKey instead of markers to catch content changes

    // Dark mode map tiles provider
    const mapProvider = (x: number, y: number, z: number, dpr?: number) => {
        return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}${dpr && dpr >= 2 ? '@2x' : ''}.png`;
    };

    return (
        <div
            ref={containerRef}
            className={cn("glass-panel overflow-hidden rounded-xl relative w-full h-full", className)}
            style={{ minHeight: '300px' }}
        >
            <Map
                provider={mapProvider}
                width={dimensions.width}
                height={dimensions.height}
                center={center}
                zoom={zoom}
                onBoundsChanged={({ center, zoom }) => {
                    setCenter(center);
                    setZoom(zoom);
                }}
            >
                {/* Render dynamic markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={marker.id}
                        width={40}
                        anchor={[marker.lat, marker.lng]}
                        color={marker.color || `hsl(${(index * 60) % 360}, 70%, 50%)`}
                        onMouseOver={() => setHoveredLocation(marker.label)}
                        onMouseOut={() => setHoveredLocation(null)}
                    />
                ))}

                {/* Tooltip overlay for hovered marker */}
                {markers.length > 0 && hoveredLocation && (
                    <Overlay
                        anchor={markers.find(m => m.label === hoveredLocation)
                            ? [markers.find(m => m.label === hoveredLocation)!.lat, markers.find(m => m.label === hoveredLocation)!.lng]
                            : center
                        }
                        offset={[0, -50]}
                    >
                        <GlassCard className="p-2 text-center text-xs backdrop-blur-md bg-black/70 border border-white/20">
                            <div className="font-bold text-white">{hoveredLocation}</div>
                        </GlassCard>
                    </Overlay>
                )}
            </Map>

            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button
                    onClick={() => setZoom(z => Math.min(z + 1, 18))}
                    className="glass-button w-8 h-8 flex items-center justify-center rounded-lg bg-black/50 hover:bg-white/10 text-white border border-white/10"
                >
                    +
                </button>
                <button
                    onClick={() => setZoom(z => Math.max(z - 1, 1))}
                    className="glass-button w-8 h-8 flex items-center justify-center rounded-lg bg-black/50 hover:bg-white/10 text-white border border-white/10"
                >
                    −
                </button>
            </div>

            {/* Status Overlay */}
            <div className="absolute bottom-4 left-4 glass-card px-3 py-1.5 text-xs text-white/70 bg-black/50 rounded-lg border border-white/10 z-10">
                {markers.length > 0
                    ? `${markers.length} destination${markers.length > 1 ? 's' : ''}`
                    : `Lat: ${center[0].toFixed(2)} • Lng: ${center[1].toFixed(2)}`
                }
            </div>
        </div>
    );
}
