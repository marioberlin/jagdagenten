/**
 * CadastralLayer
 *
 * Property boundary overlay for the hunting map.
 * Displays Flurstücke (cadastral parcels) from German/Austrian data sources.
 * Features:
 * - GeoJSON boundary rendering
 * - Click to see parcel info
 * - Configurable styling per ownership
 */

import { useMemo, useState } from 'react';
import { GeoJson, Overlay } from 'pigeon-maps';
import { MapPin, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CadastralParcel {
    id: string;
    flurstueck: string;        // Parcel ID (e.g., "123/4")
    gemarkung: string;         // Municipality
    gemeinde?: string;         // Commune
    flaeche?: number;          // Area in m²
    eigentuemer?: string;      // Owner (optional, privacy-sensitive)
    nutzungsart?: string;      // Land use type
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
    isOwned?: boolean;         // User owns this parcel
    isLeased?: boolean;        // User leases this parcel
}

interface CadastralLayerProps {
    parcels: CadastralParcel[];
    showLabels?: boolean;
    onParcelClick?: (parcel: CadastralParcel) => void;
    highlightedParcelId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARCEL_STYLES = {
    default: {
        fill: 'rgba(156, 163, 175, 0.1)',
        stroke: '#9ca3af',
        strokeWidth: 1,
    },
    owned: {
        fill: 'rgba(34, 197, 94, 0.2)',
        stroke: '#22c55e',
        strokeWidth: 2,
    },
    leased: {
        fill: 'rgba(59, 130, 246, 0.2)',
        stroke: '#3b82f6',
        strokeWidth: 2,
    },
    highlighted: {
        fill: 'rgba(234, 179, 8, 0.3)',
        stroke: '#eab308',
        strokeWidth: 3,
    },
};

const LAND_USE_LABELS: Record<string, string> = {
    wald: 'Wald',
    ackerland: 'Ackerland',
    gruenland: 'Grünland',
    wasser: 'Gewässer',
    siedlung: 'Siedlung',
    sonstiges: 'Sonstige',
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function formatArea(sqm?: number): string {
    if (!sqm) return '–';
    if (sqm >= 10000) {
        return `${(sqm / 10000).toFixed(2)} ha`;
    }
    return `${sqm.toLocaleString('de-DE')} m²`;
}

function getParcelStyle(
    parcel: CadastralParcel,
    isHighlighted: boolean
): typeof PARCEL_STYLES.default {
    if (isHighlighted) return PARCEL_STYLES.highlighted;
    if (parcel.isOwned) return PARCEL_STYLES.owned;
    if (parcel.isLeased) return PARCEL_STYLES.leased;
    return PARCEL_STYLES.default;
}

// ---------------------------------------------------------------------------
// Parcel Info Panel
// ---------------------------------------------------------------------------

function ParcelInfoPanel({
    parcel,
    onClose,
}: {
    parcel: CadastralParcel;
    onClose: () => void;
}) {
    return (
        <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-[var(--glass-accent)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                        Flurstück {parcel.flurstueck}
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-secondary)]"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                    <span className="text-[var(--text-secondary)]">Gemarkung:</span>
                    <span className="ml-2 text-[var(--text-primary)]">{parcel.gemarkung}</span>
                </div>
                {parcel.gemeinde && (
                    <div>
                        <span className="text-[var(--text-secondary)]">Gemeinde:</span>
                        <span className="ml-2 text-[var(--text-primary)]">{parcel.gemeinde}</span>
                    </div>
                )}
                <div>
                    <span className="text-[var(--text-secondary)]">Fläche:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                        {formatArea(parcel.flaeche)}
                    </span>
                </div>
                {parcel.nutzungsart && (
                    <div>
                        <span className="text-[var(--text-secondary)]">Nutzung:</span>
                        <span className="ml-2 text-[var(--text-primary)]">
                            {LAND_USE_LABELS[parcel.nutzungsart] || parcel.nutzungsart}
                        </span>
                    </div>
                )}
            </div>

            {/* Ownership badges */}
            <div className="mt-3 flex items-center gap-2">
                {parcel.isOwned && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        Eigentum
                    </span>
                )}
                {parcel.isLeased && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                        Gepachtet
                    </span>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CadastralLayer({
    parcels,
    showLabels = false,
    onParcelClick,
    highlightedParcelId,
}: CadastralLayerProps) {
    const [selectedParcel, setSelectedParcel] = useState<CadastralParcel | null>(null);

    // Convert parcels to GeoJSON FeatureCollection
    const geoJsonData = useMemo(() => {
        return {
            type: 'FeatureCollection' as const,
            features: parcels.map((parcel) => ({
                type: 'Feature' as const,
                properties: {
                    id: parcel.id,
                    flurstueck: parcel.flurstueck,
                    isOwned: parcel.isOwned,
                    isLeased: parcel.isLeased,
                },
                geometry: parcel.geometry,
            })),
        };
    }, [parcels]);

    // Style callback for individual parcels
    const styleCallback = (feature: GeoJSON.Feature) => {
        const props = feature.properties;
        if (!props) return PARCEL_STYLES.default;

        const parcel = parcels.find((p) => p.id === props.id);
        if (!parcel) return PARCEL_STYLES.default;

        const isHighlighted = parcel.id === highlightedParcelId || parcel.id === selectedParcel?.id;
        return getParcelStyle(parcel, isHighlighted);
    };

    const handleClick = (feature: GeoJSON.Feature) => {
        const parcel = parcels.find((p) => p.id === feature.properties?.id);
        if (parcel) {
            setSelectedParcel(parcel);
            onParcelClick?.(parcel);
        }
    };

    return (
        <>
            <GeoJson
                data={geoJsonData}
                styleCallback={styleCallback}
                onClick={({ payload }) => handleClick(payload)}
            />

            {/* Parcel labels */}
            {showLabels &&
                parcels
                    .filter((p) => p.isOwned || p.isLeased)
                    .map((parcel) => {
                        // Get center of parcel for label placement
                        const coords =
                            parcel.geometry.type === 'Polygon'
                                ? parcel.geometry.coordinates[0]
                                : parcel.geometry.coordinates[0][0];
                        const center = coords.reduce(
                            (acc, c) => [acc[0] + c[0], acc[1] + c[1]],
                            [0, 0]
                        );
                        center[0] /= coords.length;
                        center[1] /= coords.length;

                        return (
                            <Overlay
                                key={parcel.id}
                                anchor={[center[1], center[0]]}
                                offset={[0, 0]}
                            >
                                <div className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium whitespace-nowrap pointer-events-none">
                                    {parcel.flurstueck}
                                </div>
                            </Overlay>
                        );
                    })}

            {/* Selected parcel info panel */}
            {selectedParcel && (
                <ParcelInfoPanel
                    parcel={selectedParcel}
                    onClose={() => setSelectedParcel(null)}
                />
            )}
        </>
    );
}

export default CadastralLayer;
