/**
 * BoundaryImport
 *
 * Component for importing revier boundaries from GPX, KML, or GeoJSON files.
 */

import { useState, useRef } from 'react';
import {
    Upload,
    FileText,
    Map,
    Check,
    AlertCircle,
    X,
    Download,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportedBoundary {
    name: string;
    type: 'polygon' | 'multipolygon' | 'linestring';
    coordinates: [number, number][] | [number, number][][];
    source: 'gpx' | 'kml' | 'geojson';
}

interface BoundaryImportProps {
    onImport: (boundary: ImportedBoundary) => void;
    onClose?: () => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Parser Functions
// ---------------------------------------------------------------------------

function parseGPX(content: string): ImportedBoundary | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'application/xml');

        // Look for track points
        const trkpts = doc.querySelectorAll('trkpt');
        if (trkpts.length > 0) {
            const coordinates: [number, number][] = Array.from(trkpts).map((pt) => [
                parseFloat(pt.getAttribute('lat') || '0'),
                parseFloat(pt.getAttribute('lon') || '0'),
            ]);

            const nameEl = doc.querySelector('name');
            return {
                name: nameEl?.textContent || 'Importierte Grenze',
                type: 'linestring',
                coordinates,
                source: 'gpx',
            };
        }

        // Look for waypoints as polygon points
        const wpts = doc.querySelectorAll('wpt');
        if (wpts.length > 0) {
            const coordinates: [number, number][] = Array.from(wpts).map((pt) => [
                parseFloat(pt.getAttribute('lat') || '0'),
                parseFloat(pt.getAttribute('lon') || '0'),
            ]);

            return {
                name: 'Importierte Grenze',
                type: 'polygon',
                coordinates,
                source: 'gpx',
            };
        }

        return null;
    } catch {
        return null;
    }
}

function parseKML(content: string): ImportedBoundary | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'application/xml');

        // Look for Polygon coordinates
        const coordsEl = doc.querySelector('Polygon coordinates') || doc.querySelector('LineString coordinates');
        if (coordsEl) {
            const coordStr = coordsEl.textContent?.trim() || '';
            const coordinates: [number, number][] = coordStr
                .split(/\s+/)
                .filter(Boolean)
                .map((coord) => {
                    const [lon, lat] = coord.split(',').map(Number);
                    return [lat, lon] as [number, number];
                });

            const nameEl = doc.querySelector('name');
            return {
                name: nameEl?.textContent || 'Importierte Grenze',
                type: coordsEl.parentElement?.tagName === 'Polygon' ? 'polygon' : 'linestring',
                coordinates,
                source: 'kml',
            };
        }

        return null;
    } catch {
        return null;
    }
}

function parseGeoJSON(content: string): ImportedBoundary | null {
    try {
        const data = JSON.parse(content);

        // Handle FeatureCollection
        if (data.type === 'FeatureCollection' && data.features?.length > 0) {
            const feature = data.features[0];
            return extractFromFeature(feature);
        }

        // Handle single Feature
        if (data.type === 'Feature') {
            return extractFromFeature(data);
        }

        // Handle raw geometry
        if (data.type && data.coordinates) {
            return extractFromGeometry(data, 'Importierte Grenze');
        }

        return null;
    } catch {
        return null;
    }
}

function extractFromFeature(feature: { properties?: { name?: string }; geometry: { type: string; coordinates: unknown } }): ImportedBoundary | null {
    const name = feature.properties?.name || 'Importierte Grenze';
    return extractFromGeometry(feature.geometry, name);
}

function extractFromGeometry(geometry: { type: string; coordinates: unknown }, name: string): ImportedBoundary | null {
    const { type, coordinates } = geometry;

    if (type === 'Polygon') {
        // GeoJSON Polygon has coordinates as [[[lon, lat], ...]]
        const ring = (coordinates as number[][][])[0];
        const coords: [number, number][] = ring.map(([lon, lat]) => [lat, lon]);
        return { name, type: 'polygon', coordinates: coords, source: 'geojson' };
    }

    if (type === 'LineString') {
        const coords: [number, number][] = (coordinates as number[][]).map(([lon, lat]) => [lat, lon]);
        return { name, type: 'linestring', coordinates: coords, source: 'geojson' };
    }

    if (type === 'MultiPolygon') {
        const coords: [number, number][][] = (coordinates as number[][][][]).map((polygon) =>
            polygon[0].map(([lon, lat]) => [lat, lon] as [number, number])
        );
        return { name, type: 'multipolygon', coordinates: coords, source: 'geojson' };
    }

    return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoundaryImport({ onImport, onClose, className = '' }: BoundaryImportProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<ImportedBoundary | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setError(null);
        setPreview(null);

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['gpx', 'kml', 'geojson', 'json'].includes(ext || '')) {
            setError('Unterstützte Formate: GPX, KML, GeoJSON');
            return;
        }

        try {
            const content = await file.text();
            let boundary: ImportedBoundary | null = null;

            if (ext === 'gpx') {
                boundary = parseGPX(content);
            } else if (ext === 'kml') {
                boundary = parseKML(content);
            } else if (ext === 'geojson' || ext === 'json') {
                boundary = parseGeoJSON(content);
            }

            if (boundary) {
                setPreview(boundary);
            } else {
                setError('Konnte keine Koordinaten aus der Datei extrahieren.');
            }
        } catch {
            setError('Fehler beim Lesen der Datei.');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleConfirm = () => {
        if (preview) {
            onImport(preview);
            setPreview(null);
        }
    };

    const getPointCount = (boundary: ImportedBoundary): number => {
        if (boundary.type === 'multipolygon') {
            return (boundary.coordinates as [number, number][][]).reduce((sum, ring) => sum + ring.length, 0);
        }
        return (boundary.coordinates as [number, number][]).length;
    };

    return (
        <div className={`rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Map size={20} className="text-emerald-400" />
                    <h3 className="font-semibold text-[var(--text-primary)]">Revier-Grenze importieren</h3>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Drop Zone */}
            <div
                className={`
                    m-4 p-8 rounded-xl border-2 border-dashed transition-colors
                    flex flex-col items-center justify-center gap-3 cursor-pointer
                    ${isDragOver
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-accent)]'
                    }
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload size={32} className="text-[var(--text-tertiary)]" />
                <div className="text-center">
                    <p className="text-[var(--text-primary)] font-medium">
                        Datei hierher ziehen
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                        oder klicken zum Auswählen
                    </p>
                </div>
                <div className="flex gap-2 text-xs text-[var(--text-tertiary)]">
                    <span className="px-2 py-1 rounded bg-[var(--glass-surface-hover)]">GPX</span>
                    <span className="px-2 py-1 rounded bg-[var(--glass-surface-hover)]">KML</span>
                    <span className="px-2 py-1 rounded bg-[var(--glass-surface-hover)]">GeoJSON</span>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".gpx,.kml,.geojson,.json"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
            />

            {/* Error Message */}
            {error && (
                <div className="mx-4 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div className="mx-4 mb-4 p-4 rounded-xl bg-[var(--glass-surface-hover)] border border-[var(--glass-border)]">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-emerald-400" />
                        <span className="font-medium text-[var(--text-primary)]">{preview.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <div className="text-[var(--text-tertiary)]">Format</div>
                            <div className="text-[var(--text-primary)] uppercase">{preview.source}</div>
                        </div>
                        <div>
                            <div className="text-[var(--text-tertiary)]">Typ</div>
                            <div className="text-[var(--text-primary)] capitalize">{preview.type}</div>
                        </div>
                        <div>
                            <div className="text-[var(--text-tertiary)]">Punkte</div>
                            <div className="text-[var(--text-primary)]">{getPointCount(preview)}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleConfirm}
                        className="mt-4 w-full py-2 rounded-lg bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                    >
                        <Check size={18} />
                        Importieren
                    </button>
                </div>
            )}

            {/* Sample Download */}
            <div className="p-4 border-t border-[var(--glass-border)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">
                    Beispiel-Dateien zum Testen:
                </p>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <Download size={12} />
                        sample.gpx
                    </button>
                    <button className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <Download size={12} />
                        sample.kml
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BoundaryImport;
