import { Map, Marker, Overlay } from 'pigeon-maps';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { GlassCard } from '../data-display/GlassCard';

interface GlassMapProps {
    className?: string;
    defaultCenter?: [number, number];
    defaultZoom?: number;
}

export function GlassMap({
    className,
    defaultCenter = [50.879, 4.6997],
    defaultZoom = 11
}: GlassMapProps) {
    const [center, setCenter] = useState<[number, number]>(defaultCenter);
    const [zoom, setZoom] = useState(defaultZoom);
    const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

    // Dark mode map tiles provider
    const mapProvider = (x: number, y: number, z: number, dpr?: number) => {
        return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}${dpr && dpr >= 2 ? '@2x' : ''}.png`;
    };

    return (
        <div className={cn("glass-panel overflow-hidden rounded-xl relative h-full min-h-[400px]", className)}>
            <Map
                provider={mapProvider}
                height={600}
                center={center}
                zoom={zoom}
                onBoundsChanged={({ center, zoom }) => {
                    setCenter(center);
                    setZoom(zoom);
                }}
            >
                <Marker
                    width={50}
                    anchor={[50.879, 4.6997]}
                    color="rgba(var(--accent-primary-rgb), 0.8)"
                    onMouseOver={() => setHoveredLocation('Headquarters')}
                    onMouseOut={() => setHoveredLocation(null)}
                />
                <Marker
                    width={40}
                    anchor={[50.85, 4.65]}
                    color="rgba(var(--accent-secondary-rgb), 0.6)"
                    onMouseOver={() => setHoveredLocation('Data Center')}
                    onMouseOut={() => setHoveredLocation(null)}
                />

                <Overlay anchor={[50.879, 4.6997]} offset={[120, 70]}>
                    <GlassCard className={cn(
                        "p-2 w-32 text-center text-xs transition-opacity duration-300 pointer-events-none backdrop-blur-md bg-black/60",
                        hoveredLocation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}>
                        <div className="font-bold text-accent-primary">{hoveredLocation}</div>
                        <div className="text-white/60">Europe Region</div>
                    </GlassCard>
                </Overlay>
            </Map>

            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                    onClick={() => setZoom(z => Math.min(z + 1, 18))}
                    className="glass-button w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
                >
                    +
                </button>
                <button
                    onClick={() => setZoom(z => Math.min(z - 1, 1))}
                    className="glass-button w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
                >
                    -
                </button>
            </div>

            {/* Status Overlay */}
            <div className="absolute bottom-4 left-4 glass-card px-3 py-1.5 text-xs text-white/70">
                Lat: {center[0].toFixed(4)} • Lng: {center[1].toFixed(4)}
            </div>
        </div>
    );
}
