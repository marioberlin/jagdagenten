/**
 * GlassGoogleMap
 * 
 * Premium Google Maps integration with dark "Night Mode" styling
 * for the Liquid Glass design system.
 * 
 * Requires VITE_GOOGLE_MAPS_API_KEY environment variable.
 */
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MapMarker {
    id: string;
    lat: number;
    lng: number;
    label: string;
    color?: string;
}

interface GlassGoogleMapProps {
    className?: string;
    defaultCenter?: { lat: number; lng: number };
    defaultZoom?: number;
    markers?: MapMarker[];
    autoFit?: boolean;
}

// Google Maps Night Mode style (dark theme matching Liquid Glass)
const NIGHT_MODE_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8b5cf6" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#ec4899" }]
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6366f1" }]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#1e3a2f" }]
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#22c55e" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#2d2d44" }]
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1a1a2e" }]
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca3af" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#3b3b5c" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1a1a2e" }]
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f59e0b" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f2f4a" }]
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#06b6d4" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0f172a" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#3b82f6" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#0f172a" }]
    }
];

const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '300px'
};

export function GlassGoogleMap({
    className,
    defaultCenter = { lat: 35.6762, lng: 139.6503 }, // Tokyo
    defaultZoom = 10,
    markers = [],
    autoFit = true
}: GlassGoogleMapProps) {
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Auto-fit to show all markers
    useEffect(() => {
        if (map && autoFit && markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => {
                bounds.extend({ lat: marker.lat, lng: marker.lng });
            });
            map.fitBounds(bounds);

            // Don't zoom in too much for single marker
            if (markers.length === 1) {
                map.setZoom(12);
            }
        }
    }, [map, markers, autoFit]);

    if (loadError) {
        return (
            <div className={cn("glass-panel rounded-xl p-6 flex items-center justify-center", className)}>
                <div className="text-center text-white/60">
                    <p className="text-sm">Map loading error</p>
                    <p className="text-xs mt-1 text-white/40">Check your API key configuration</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={cn("glass-panel rounded-xl p-6 flex items-center justify-center animate-pulse", className)}>
                <div className="text-center text-white/60">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("glass-panel overflow-hidden rounded-xl relative", className)} style={{ minHeight: '300px' }}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={defaultZoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: NIGHT_MODE_STYLES,
                    disableDefaultUI: true,
                    zoomControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    backgroundColor: '#1a1a2e'
                }}
            >
                {/* Markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={marker.id}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        onClick={() => setSelectedMarker(marker)}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: marker.color || `hsl(${(index * 60) % 360}, 70%, 50%)`,
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 10
                        }}
                    />
                ))}

                {/* Info Window */}
                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg">
                            <p className="font-semibold text-pink-400">{selectedMarker.label}</p>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Liquid Glass Zoom Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
                <button
                    onClick={() => map?.setZoom((map.getZoom() ?? defaultZoom) + 1)}
                    className="group w-9 h-9 flex items-center justify-center
                        bg-black/40 backdrop-blur-xl
                        border border-white/20
                        rounded-lg
                        transition-all duration-200 ease-out
                        hover:bg-white/10 hover:border-white/30
                        hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]
                        active:scale-95"
                    aria-label="Zoom in"
                >
                    <Plus className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                </button>
                <button
                    onClick={() => map?.setZoom((map.getZoom() ?? defaultZoom) - 1)}
                    className="group w-9 h-9 flex items-center justify-center
                        bg-black/40 backdrop-blur-xl
                        border border-white/20
                        rounded-lg
                        transition-all duration-200 ease-out
                        hover:bg-white/10 hover:border-white/30
                        hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]
                        active:scale-95"
                    aria-label="Zoom out"
                >
                    <Minus className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                </button>
            </div>

            {/* Marker count overlay */}
            <div className="absolute bottom-4 left-4 glass-card px-3 py-1.5 text-xs text-white/70 bg-black/50 rounded-lg border border-white/10 z-10">
                {markers.length > 0
                    ? `${markers.length} destination${markers.length > 1 ? 's' : ''}`
                    : 'Explore the world'
                }
            </div>
        </div>
    );
}

export default GlassGoogleMap;
