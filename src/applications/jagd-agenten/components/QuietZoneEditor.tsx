/**
 * QuietZoneEditor
 *
 * Polygon drawing tool for marking quiet zones on the map.
 * Quiet zones are areas where game is undisturbed and should be avoided.
 */

import { useState } from 'react';
import { Shield, Trash2, Check, X, Plus, Edit2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuietZone {
    id: string;
    name: string;
    coordinates: [number, number][];
    notes?: string;
    createdAt: string;
}

interface QuietZoneEditorProps {
    zones: QuietZone[];
    onAddZone: (zone: Omit<QuietZone, 'id' | 'createdAt'>) => void;
    onUpdateZone: (id: string, zone: Partial<QuietZone>) => void;
    onDeleteZone: (id: string) => void;
    isDrawing: boolean;
    onStartDrawing: () => void;
    onStopDrawing: () => void;
    currentPoints: [number, number][];
    onAddPoint: (point: [number, number]) => void;
    onRemoveLastPoint: () => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuietZoneEditor({
    zones,
    onAddZone,
    onUpdateZone,
    onDeleteZone,
    isDrawing,
    onStartDrawing,
    onStopDrawing,
    currentPoints,
    onAddPoint: _onAddPoint,
    onRemoveLastPoint,
    className = '',
}: QuietZoneEditorProps) {
    const [newZoneName, setNewZoneName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSaveZone = () => {
        if (currentPoints.length < 3) {
            alert('Mindestens 3 Punkte für eine Zone erforderlich');
            return;
        }

        onAddZone({
            name: newZoneName || `Ruhezone ${zones.length + 1}`,
            coordinates: currentPoints,
        });

        setNewZoneName('');
        onStopDrawing();
    };

    const handleCancelDrawing = () => {
        setNewZoneName('');
        onStopDrawing();
    };

    return (
        <div className={`rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                    <Shield size={20} className="text-emerald-400" />
                    <h3 className="font-semibold text-[var(--text-primary)]">Ruhezonen</h3>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Bereiche markieren, in denen Wild ungestört ist
                </p>
            </div>

            {/* Drawing Mode */}
            {isDrawing ? (
                <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/30">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-emerald-400 font-medium">
                            Zeichenmodus aktiv
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                            {currentPoints.length} Punkte
                        </span>
                    </div>

                    <input
                        type="text"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        placeholder="Zonenname (optional)"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm mb-3"
                    />

                    <p className="text-xs text-[var(--text-tertiary)] mb-3">
                        Klicken Sie auf die Karte, um Punkte hinzuzufügen
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveZone}
                            disabled={currentPoints.length < 3}
                            className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            <Check size={16} />
                            Speichern
                        </button>
                        <button
                            onClick={onRemoveLastPoint}
                            disabled={currentPoints.length === 0}
                            className="px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] disabled:opacity-50"
                        >
                            Rückgängig
                        </button>
                        <button
                            onClick={handleCancelDrawing}
                            className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 border-b border-[var(--glass-border)]">
                    <button
                        onClick={onStartDrawing}
                        className="w-full py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-colors"
                    >
                        <Plus size={16} />
                        Neue Ruhezone zeichnen
                    </button>
                </div>
            )}

            {/* Zone List */}
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {zones.length === 0 && !isDrawing && (
                    <p className="text-center text-sm text-[var(--text-tertiary)] py-4">
                        Keine Ruhezonen definiert
                    </p>
                )}

                {zones.map((zone) => (
                    <div
                        key={zone.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-surface-hover)]"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500" />
                            {editingId === zone.id ? (
                                <input
                                    type="text"
                                    value={zone.name}
                                    onChange={(e) => onUpdateZone(zone.id, { name: e.target.value })}
                                    onBlur={() => setEditingId(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                    className="px-2 py-1 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
                                    autoFocus
                                />
                            ) : (
                                <span className="text-[var(--text-primary)]">{zone.name}</span>
                            )}
                            <span className="text-xs text-[var(--text-tertiary)]">
                                ({zone.coordinates.length} Punkte)
                            </span>
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={() => setEditingId(zone.id)}
                                className="p-1.5 rounded hover:bg-[var(--glass-surface)] text-[var(--text-tertiary)]"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => onDeleteZone(zone.id)}
                                className="p-1.5 rounded hover:bg-red-500/20 text-[var(--text-tertiary)] hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info */}
            <div className="p-3 bg-[var(--glass-surface-hover)] text-xs text-[var(--text-tertiary)]">
                💡 Ruhezonen werden in der Routenplanung berücksichtigt
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// QuietZoneOverlay for Map
// ---------------------------------------------------------------------------

interface QuietZoneOverlayProps {
    zones: QuietZone[];
    drawingPoints?: [number, number][];
    mapWidth: number;
    mapHeight: number;
    latLngToPixel: (latLng: [number, number]) => [number, number];
}

export function QuietZoneOverlay({
    zones,
    drawingPoints = [],
    mapWidth,
    mapHeight,
    latLngToPixel,
}: QuietZoneOverlayProps) {
    const renderPolygon = (
        coordinates: [number, number][],
        id: string,
        isDrawing = false
    ) => {
        if (coordinates.length < 2) return null;

        const points = coordinates
            .map((coord) => latLngToPixel(coord))
            .map(([x, y]) => `${x},${y}`)
            .join(' ');

        return (
            <g key={id}>
                {/* Fill */}
                <polygon
                    points={points}
                    fill="rgba(52, 211, 153, 0.2)"
                    stroke="rgba(52, 211, 153, 0.8)"
                    strokeWidth={isDrawing ? 3 : 2}
                    strokeDasharray={isDrawing ? '5,5' : undefined}
                />

                {/* Points */}
                {coordinates.map((coord, i) => {
                    const [x, y] = latLngToPixel(coord);
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={isDrawing ? 6 : 4}
                            fill="rgba(52, 211, 153, 1)"
                            stroke="white"
                            strokeWidth={2}
                        />
                    );
                })}
            </g>
        );
    };

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            width={mapWidth}
            height={mapHeight}
            style={{ zIndex: 380 }}
        >
            {/* Existing zones */}
            {zones.map((zone) => renderPolygon(zone.coordinates, zone.id))}

            {/* Currently drawing */}
            {drawingPoints.length > 0 && renderPolygon(drawingPoints, 'drawing', true)}
        </svg>
    );
}

export default QuietZoneEditor;
