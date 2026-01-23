/**
 * Aurora Map Tab
 * 
 * Map exploration view with weather overlay.
 * Uses GlassGoogleMap component for route visualization and weather markers.
 */
import React, { useState, useMemo } from 'react';
import {
    Layers,
    Cloud,
    Sun,
    CloudRain,
    CloudSnow,
    Navigation,
    Coffee,
    Fuel,
    Hotel,
    Zap,
    ParkingSquare,
    Utensils,
    Thermometer,
    MapPin,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import { GlassGoogleMap, type MapMarker } from '@/components/data-display/GlassGoogleMap';
import { useAuroraTravelStore } from '@/stores/auroraTravelStore';
import { PlacesAutocomplete, type PlaceResult } from './PlacesAutocomplete';

// ============================================================================
// POI Categories
// ============================================================================

const POI_CATEGORIES = [
    { id: 'gas', label: 'Gas', icon: Fuel },
    { id: 'cafe', label: 'Cafe', icon: Coffee },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'hotel', label: 'Stay', icon: Hotel },
    { id: 'ev', label: 'EV', icon: Zap },
    { id: 'parking', label: 'Park', icon: ParkingSquare },
];

// ============================================================================
// Map Overlay Options
// ============================================================================

type MapOverlay = 'none' | 'weather' | 'temp';

const OVERLAY_OPTIONS: { id: MapOverlay; label: string; icon: React.ElementType }[] = [
    { id: 'none', label: 'None', icon: MapPin },
    { id: 'weather', label: 'Weather', icon: Cloud },
    { id: 'temp', label: 'Temp', icon: Thermometer },
];

// ============================================================================
// Weather Icon Helper
// ============================================================================

const getWeatherEmoji = (condition?: string): string => {
    if (!condition) return '☁️';
    if (condition.includes('clear') || condition.includes('sunny')) return '☀️';
    if (condition.includes('partly')) return '⛅';
    if (condition.includes('rain') || condition.includes('drizzle')) return '🌧️';
    if (condition.includes('snow')) return '❄️';
    if (condition.includes('thunder')) return '⛈️';
    if (condition.includes('fog')) return '🌫️';
    return '☁️';
};

// ============================================================================
// Overlay Selector
// ============================================================================

interface OverlaySelectorProps {
    value: MapOverlay;
    onChange: (overlay: MapOverlay) => void;
}

const OverlaySelector: React.FC<OverlaySelectorProps> = ({ value, onChange }) => (
    <GlassContainer className="p-2" border>
        <div className="flex items-center gap-2 text-xs">
            <Layers size={14} className="text-tertiary" />
            <span className="text-secondary">Overlay:</span>
            <div className="flex items-center gap-1">
                {OVERLAY_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-all',
                            value === option.id
                                ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                                : 'text-tertiary hover:text-secondary hover:bg-white/5'
                        )}
                    >
                        <option.icon size={12} />
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    </GlassContainer>
);

// ============================================================================
// POI Category Bar
// ============================================================================

interface POICategoryBarProps {
    selectedCategories: string[];
    onToggleCategory: (categoryId: string) => void;
}

const POICategoryBar: React.FC<POICategoryBarProps> = ({ selectedCategories, onToggleCategory }) => (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {POI_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
                <button
                    key={category.id}
                    onClick={() => onToggleCategory(category.id)}
                    className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg min-w-16 transition-all',
                        isSelected
                            ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                            : 'bg-[var(--glass-bg-subtle)] text-secondary hover:text-primary'
                    )}
                >
                    <category.icon size={18} />
                    <span className="text-xs">{category.label}</span>
                </button>
            );
        })}
    </div>
);

// ============================================================================
// Weather Legend
// ============================================================================

const WeatherLegend: React.FC = () => (
    <GlassContainer className="p-3" border>
        <div className="flex items-center gap-4 text-xs">
            <span className="text-tertiary">Weather:</span>
            <span className="flex items-center gap-1"><Sun size={14} className="text-yellow-400" /> Clear</span>
            <span className="flex items-center gap-1"><Cloud size={14} className="text-slate-400" /> Cloudy</span>
            <span className="flex items-center gap-1"><CloudRain size={14} className="text-blue-400" /> Rain</span>
            <span className="flex items-center gap-1"><CloudSnow size={14} className="text-slate-200" /> Snow</span>
        </div>
    </GlassContainer>
);

// ============================================================================
// Location Weather Card
// ============================================================================

interface LocationWeatherCardProps {
    name: string;
    temp: number;
    condition: string;
    emoji: string;
    onClick?: () => void;
}

const LocationWeatherCard: React.FC<LocationWeatherCardProps> = ({ name, temp, condition, emoji, onClick }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        className="w-full p-3 rounded-lg bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)] text-left"
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                    <div className="text-sm font-medium text-primary">{name}</div>
                    <div className="text-xs text-tertiary">{condition}</div>
                </div>
            </div>
            <div className="text-lg font-semibold text-primary">{temp}°</div>
        </div>
    </motion.button>
);

// ============================================================================
// Main Component
// ============================================================================

export const AuroraMapTab: React.FC = () => {
    const [overlay, setOverlay] = useState<MapOverlay>('weather');
    const [selectedPOIs, setSelectedPOIs] = useState<string[]>([]);
    const [searchedLocation, setSearchedLocation] = useState<MapMarker | null>(null);

    // Get saved locations and their weather data from store
    const savedLocations = useAuroraTravelStore(state => state.savedLocations);
    const addLocation = useAuroraTravelStore(state => state.addLocation);
    const trips = useAuroraTravelStore(state => state.trips);

    // Build markers from saved locations
    const markers: MapMarker[] = useMemo(() => {
        return savedLocations.map((loc, i) => ({
            id: loc.id,
            lat: loc.lat,
            lng: loc.lng,
            label: loc.name,
            color: `hsl(${200 + i * 30}, 70%, 50%)`
        }));
    }, [savedLocations]);

    // Add trip destination markers
    const tripMarkers: MapMarker[] = useMemo(() => {
        const allDestinations: MapMarker[] = [];
        trips.forEach((trip, tripIdx) => {
            trip.destinations.forEach((dest, destIdx) => {
                allDestinations.push({
                    id: `${trip.id}-${dest.id}`,
                    lat: dest.place.lat,
                    lng: dest.place.lng,
                    label: `${trip.name}: ${dest.place.name}`,
                    color: `hsl(${120 + tripIdx * 60 + destIdx * 15}, 70%, 50%)`
                });
            });
        });
        return allDestinations;
    }, [trips]);

    // Combine all markers including searched location
    const allMarkers = useMemo(() => {
        const combined = [...markers, ...tripMarkers];
        if (searchedLocation) {
            combined.push(searchedLocation);
        }
        return combined;
    }, [markers, tripMarkers, searchedLocation]);

    // Default center: searched location, or first saved, or Berlin
    const defaultCenter = useMemo(() => {
        if (searchedLocation) {
            return { lat: searchedLocation.lat, lng: searchedLocation.lng };
        }
        if (savedLocations.length > 0) {
            return { lat: savedLocations[0].lat, lng: savedLocations[0].lng };
        }
        return { lat: 52.52, lng: 13.405 }; // Berlin default
    }, [savedLocations, searchedLocation]);

    const handlePlaceSelect = (place: PlaceResult) => {
        // Add as temporary marker
        setSearchedLocation({
            id: place.placeId,
            lat: place.lat,
            lng: place.lng,
            label: place.name,
            color: '#ec4899' // Pink for searched location
        });

        // Also save to locations
        addLocation({
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            timezone: 'Europe/Berlin',
        });
    };

    const handleTogglePOI = (categoryId: string) => {
        setSelectedPOIs(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    return (
        <div className="space-y-4">
            {/* Search with Places Autocomplete */}
            <PlacesAutocomplete onPlaceSelect={handlePlaceSelect} />

            {/* Map */}
            <div className="h-[400px] rounded-xl overflow-hidden">
                <GlassGoogleMap
                    defaultCenter={defaultCenter}
                    defaultZoom={savedLocations.length > 1 ? 8 : 10}
                    markers={allMarkers}
                    autoFit={allMarkers.length > 1}
                />
            </div>

            {/* Overlay Selector */}
            <OverlaySelector value={overlay} onChange={setOverlay} />

            {/* Weather Legend */}
            {overlay === 'weather' && <WeatherLegend />}

            {/* POI Categories */}
            <div>
                <h3 className="text-sm font-medium text-secondary mb-2">Points of Interest</h3>
                <POICategoryBar
                    selectedCategories={selectedPOIs}
                    onToggleCategory={handleTogglePOI}
                />
            </div>

            {/* Saved Locations Weather */}
            {savedLocations.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-secondary mb-2">Location Weather</h3>
                    <div className="space-y-2">
                        {savedLocations.slice(0, 3).map((loc) => (
                            <LocationWeatherCard
                                key={loc.id}
                                name={loc.name}
                                temp={20} // Would come from weather data
                                condition="Partly cloudy"
                                emoji={getWeatherEmoji('partly_cloudy')}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state if no locations */}
            {savedLocations.length === 0 && trips.length === 0 && (
                <GlassContainer className="p-6 text-center" border>
                    <Navigation size={32} className="mx-auto mb-3 text-tertiary" />
                    <p className="text-sm text-secondary">No locations yet</p>
                    <p className="text-xs text-tertiary mt-1">
                        Add locations from the Home tab or plan a trip
                    </p>
                </GlassContainer>
            )}
        </div>
    );
};

export default AuroraMapTab;
