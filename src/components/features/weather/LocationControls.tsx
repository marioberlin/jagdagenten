import React, { useState, useRef } from 'react';
import { Search, X, MapPin, Navigation } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';

// Location Search Component
export function LocationSearch({
    onSearch,
    isLoading
}: {
    onSearch: (query: string) => void;
    isLoading: boolean;
}) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setQuery('');
            setIsOpen(false);
        }
    };

    const popularCities = ['New York', 'Tokyo', 'Paris', 'Sydney', 'Dubai'];

    return (
        <div className="relative">
            {!isOpen ? (
                <button
                    onClick={() => {
                        setIsOpen(true);
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="p-1.5 rounded-full bg-white/5 text-secondary hover:bg-white/10 transition-colors"
                >
                    <Search size={16} />
                </button>
            ) : (
                <div className="absolute right-0 top-0 z-20">
                    <GlassContainer className="p-3 rounded-xl min-w-[280px]" border>
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center gap-2 mb-3">
                                <Search size={16} className="text-secondary" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search city..."
                                    className="flex-1 bg-transparent text-sm text-primary placeholder-secondary outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded hover:bg-white/10"
                                >
                                    <X size={14} className="text-secondary" />
                                </button>
                            </div>
                        </form>
                        <div className="border-t border-white/10 pt-2">
                            <p className="text-[10px] text-tertiary mb-2">Popular cities</p>
                            <div className="flex flex-wrap gap-1">
                                {popularCities.map(city => (
                                    <button
                                        key={city}
                                        onClick={() => {
                                            onSearch(city);
                                            setIsOpen(false);
                                        }}
                                        disabled={isLoading}
                                        className="px-2 py-1 rounded-full bg-white/5 text-xs text-secondary hover:bg-white/10 transition-colors"
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </GlassContainer>
                </div>
            )}
        </div>
    );
}

// Location Chip Component
export function LocationChip({
    name,
    isSelected,
    onClick,
}: {
    name: string;
    isSelected: boolean;
    onClick: () => void;
    onRemove?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                isSelected
                    ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
                    : "bg-white/5 text-secondary hover:bg-white/10 border border-transparent"
            )}
        >
            <MapPin size={14} />
            {name}
        </button>
    );
}

// Geolocation Button Component
export function GeolocationButton({
    onLocationFound,
    isLoading
}: {
    onLocationFound: (lat: number, lng: number) => void;
    isLoading: boolean;
}) {
    const [geoLoading, setGeoLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        setGeoLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setGeoLoading(false);
                onLocationFound(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                setGeoLoading(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Location permission denied');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Location unavailable');
                        break;
                    default:
                        setError('Could not get location');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="relative">
            <button
                onClick={requestLocation}
                disabled={isLoading || geoLoading}
                className={cn(
                    "p-1.5 rounded-full bg-white/5 text-secondary hover:bg-white/10 transition-colors",
                    (geoLoading) && "animate-pulse"
                )}
                title="Use my location"
            >
                <Navigation size={16} className={geoLoading ? "animate-spin" : ""} />
            </button>
            {error && (
                <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-red-500/20 text-red-400 text-[10px] rounded whitespace-nowrap">
                    {error}
                </div>
            )}
        </div>
    );
}
