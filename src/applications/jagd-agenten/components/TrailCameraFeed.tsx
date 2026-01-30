/**
 * TrailCameraFeed
 *
 * Displays trail camera photos in a gallery view.
 * Features:
 * - Grid/timeline view
 * - Filter by camera
 * - Link to map location
 * - Motion event timestamps
 */

import { useState, useEffect } from 'react';
import {
    Camera,
    Clock,
    Grid,
    List,
    Trash2,
    X,
    Upload,
    AlertCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrailCamera {
    id: string;
    name: string;
    lat: number;
    lon: number;
    lastActive?: string;
    batteryLevel?: number;
    photoCount: number;
}

interface TrailPhoto {
    id: string;
    cameraId: string;
    cameraName: string;
    imageUrl: string;
    thumbnailUrl?: string;
    timestamp: string;
    temperature?: number;
    moonPhase?: string;
    speciesDetected?: string[];
    viewed: boolean;
}

interface TrailCameraFeedProps {
    onPhotoClick?: (photo: TrailPhoto) => void;
    onCameraClick?: (camera: TrailCamera) => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Photo Card Component
// ---------------------------------------------------------------------------

function PhotoCard({
    photo,
    onClick,
    onDelete,
}: {
    photo: TrailPhoto;
    onClick: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className={`
                relative rounded-lg overflow-hidden cursor-pointer
                transition-transform hover:scale-[1.02]
                ${!photo.viewed ? 'ring-2 ring-emerald-400' : ''}
            `}
            onClick={onClick}
        >
            {/* Image */}
            <div className="aspect-[4/3] bg-gray-800">
                <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={`Trail cam ${photo.cameraName}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <Camera size={12} />
                        <span className="truncate max-w-[80px]">{photo.cameraName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>
                            {new Date(photo.timestamp).toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                </div>
                {photo.speciesDetected && photo.speciesDetected.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {photo.speciesDetected.slice(0, 2).map((species) => (
                            <span
                                key={species}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/50"
                            >
                                {species}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Unviewed indicator */}
            {!photo.viewed && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
            )}

            {/* Delete button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute top-2 left-2 p-1 rounded bg-black/50 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Camera Filter
// ---------------------------------------------------------------------------

function CameraFilter({
    cameras,
    selectedId,
    onSelect,
}: {
    cameras: TrailCamera[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
                onClick={() => onSelect(null)}
                className={`
                    shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${selectedId === null
                        ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                        : 'bg-[var(--glass-surface)] text-[var(--text-secondary)] border border-[var(--glass-border)]'
                    }
                `}
            >
                Alle
            </button>
            {cameras.map((camera) => (
                <button
                    key={camera.id}
                    onClick={() => onSelect(camera.id)}
                    className={`
                        shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5
                        ${selectedId === camera.id
                            ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                            : 'bg-[var(--glass-surface)] text-[var(--text-secondary)] border border-[var(--glass-border)]'
                        }
                    `}
                >
                    <Camera size={12} />
                    {camera.name}
                    {camera.photoCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-[10px]">
                            {camera.photoCount}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Photo Viewer Modal
// ---------------------------------------------------------------------------

function PhotoViewer({
    photo,
    onClose,
}: {
    photo: TrailPhoto;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
                <X size={24} />
            </button>

            <div
                className="max-w-4xl max-h-[90vh] m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={photo.imageUrl}
                    alt="Trail camera photo"
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                <div className="mt-4 flex items-center justify-between text-white text-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Camera size={16} />
                            {photo.cameraName}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            {new Date(photo.timestamp).toLocaleString('de-DE')}
                        </div>
                    </div>
                    {photo.temperature !== undefined && (
                        <span>{photo.temperature}°C</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TrailCameraFeed({
    onPhotoClick,
    onCameraClick: _onCameraClick,
    className = '',
}: TrailCameraFeedProps) {
    const [cameras, setCameras] = useState<TrailCamera[]>([]);
    const [photos, setPhotos] = useState<TrailPhoto[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedPhoto, setSelectedPhoto] = useState<TrailPhoto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch cameras and photos
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setError(null);

            try {
                const [camerasRes, photosRes] = await Promise.all([
                    fetch('/api/v1/jagd/trailcam/cameras'),
                    fetch('/api/v1/jagd/trailcam/photos'),
                ]);

                if (camerasRes.ok) {
                    const data = await camerasRes.json();
                    setCameras(data.cameras || []);
                }

                if (photosRes.ok) {
                    const data = await photosRes.json();
                    setPhotos(data.photos || []);
                }
            } catch (err) {
                setError('Fehler beim Laden der Wildkamera-Daten');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    const filteredPhotos = selectedCamera
        ? photos.filter((p) => p.cameraId === selectedCamera)
        : photos;

    const unviewedCount = photos.filter((p) => !p.viewed).length;

    const handlePhotoClick = async (photo: TrailPhoto) => {
        setSelectedPhoto(photo);
        onPhotoClick?.(photo);

        // Mark as viewed
        if (!photo.viewed) {
            try {
                await fetch(`/api/v1/jagd/trailcam/photos/${photo.id}/view`, {
                    method: 'POST',
                });
                setPhotos((prev) =>
                    prev.map((p) => (p.id === photo.id ? { ...p, viewed: true } : p))
                );
            } catch {
                // Ignore errors
            }
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm('Foto wirklich löschen?')) return;

        try {
            await fetch(`/api/v1/jagd/trailcam/photos/${photoId}`, {
                method: 'DELETE',
            });
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch {
            // Ignore errors
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Camera size={20} className="text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            Wildkameras
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {cameras.length} Kameras • {photos.length} Fotos
                            {unviewedCount > 0 && (
                                <span className="ml-2 text-emerald-400">
                                    ({unviewedCount} neu)
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[var(--glass-surface)]' : ''}`}
                    >
                        <Grid size={16} className="text-[var(--text-secondary)]" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-[var(--glass-surface)]' : ''}`}
                    >
                        <List size={16} className="text-[var(--text-secondary)]" />
                    </button>
                </div>
            </div>

            {/* Camera Filter */}
            {cameras.length > 0 && (
                <CameraFilter
                    cameras={cameras}
                    selectedId={selectedCamera}
                    onSelect={setSelectedCamera}
                />
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8 text-[var(--text-tertiary)]">
                    Lade Fotos...
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-400">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredPhotos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                    <Camera size={32} className="mb-2 opacity-50" />
                    <p>Keine Fotos vorhanden</p>
                    <button className="mt-2 text-sm text-emerald-400 flex items-center gap-1">
                        <Upload size={14} />
                        Foto hochladen
                    </button>
                </div>
            )}

            {/* Photo Grid */}
            {!isLoading && !error && filteredPhotos.length > 0 && (
                <div
                    className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-2 sm:grid-cols-3 gap-2'
                            : 'space-y-2'
                    }
                >
                    {filteredPhotos.map((photo) => (
                        <PhotoCard
                            key={photo.id}
                            photo={photo}
                            onClick={() => handlePhotoClick(photo)}
                            onDelete={() => handleDeletePhoto(photo.id)}
                        />
                    ))}
                </div>
            )}

            {/* Photo Viewer Modal */}
            {selectedPhoto && (
                <PhotoViewer
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                />
            )}
        </div>
    );
}

export default TrailCameraFeed;
