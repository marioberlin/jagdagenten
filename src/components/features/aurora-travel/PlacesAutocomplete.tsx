/**
 * Places Autocomplete Search
 * 
 * Google Places Autocomplete search input for map location search.
 * Falls back to mock geocoding if Google Maps API not available.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { GlassInput } from '@/components';

// ============================================================================
// Types
// ============================================================================

export interface PlaceResult {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

export interface PlacesAutocompleteProps {
    onPlaceSelect: (place: PlaceResult) => void;
    placeholder?: string;
    className?: string;
}

// ============================================================================
// Mock Data for fallback
// ============================================================================

const MOCK_PLACES: Record<string, Omit<PlaceResult, 'placeId'>> = {
    'berlin': { name: 'Berlin', address: 'Berlin, Germany', lat: 52.52, lng: 13.405 },
    'munich': { name: 'Munich', address: 'Munich, Bavaria, Germany', lat: 48.1351, lng: 11.582 },
    'hamburg': { name: 'Hamburg', address: 'Hamburg, Germany', lat: 53.5511, lng: 9.9937 },
    'usedom': { name: 'Usedom', address: 'Usedom, Mecklenburg-Vorpommern, Germany', lat: 53.95, lng: 14.05 },
    'rostock': { name: 'Rostock', address: 'Rostock, Germany', lat: 54.0924, lng: 12.0991 },
    'dresden': { name: 'Dresden', address: 'Dresden, Saxony, Germany', lat: 51.0504, lng: 13.7373 },
    'leipzig': { name: 'Leipzig', address: 'Leipzig, Saxony, Germany', lat: 51.3397, lng: 12.3731 },
    'cologne': { name: 'Cologne', address: 'Cologne, Germany', lat: 50.9375, lng: 6.9603 },
    'frankfurt': { name: 'Frankfurt', address: 'Frankfurt am Main, Germany', lat: 50.1109, lng: 8.6821 },
    'paris': { name: 'Paris', address: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    'london': { name: 'London', address: 'London, UK', lat: 51.5074, lng: -0.1278 },
    'amsterdam': { name: 'Amsterdam', address: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
    'vienna': { name: 'Vienna', address: 'Vienna, Austria', lat: 48.2082, lng: 16.3738 },
    'prague': { name: 'Prague', address: 'Prague, Czech Republic', lat: 50.0755, lng: 14.4378 },
    'copenhagen': { name: 'Copenhagen', address: 'Copenhagen, Denmark', lat: 55.6761, lng: 12.5683 },
};

// ============================================================================
// Component
// ============================================================================

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
    onPlaceSelect,
    placeholder = 'Search places, cities...',
    className,
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mock search function (in production would use Google Places API)
    const searchPlaces = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);

        // Try Google Places API if available
        if (window.google?.maps?.places) {
            try {
                const service = new google.maps.places.AutocompleteService();
                const response = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
                    service.getPlacePredictions(
                        { input: searchQuery, types: ['(cities)'] },
                        (predictions, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                                resolve(predictions);
                            } else {
                                reject(status);
                            }
                        }
                    );
                });

                // Get place details for coordinates
                const placesService = new google.maps.places.PlacesService(
                    document.createElement('div')
                );

                const results = await Promise.all(
                    response.slice(0, 5).map(
                        prediction =>
                            new Promise<PlaceResult>((resolve) => {
                                placesService.getDetails(
                                    { placeId: prediction.place_id, fields: ['geometry', 'name'] },
                                    (place, status) => {
                                        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                                            resolve({
                                                placeId: prediction.place_id,
                                                name: place.name || prediction.structured_formatting.main_text,
                                                address: prediction.description,
                                                lat: place.geometry.location.lat(),
                                                lng: place.geometry.location.lng(),
                                            });
                                        }
                                    }
                                );
                            })
                    )
                );

                setSuggestions(results.filter(Boolean));
                setIsLoading(false);
                return;
            } catch (e) {
                console.warn('[PlacesAutocomplete] Google API failed, using fallback:', e);
            }
        }

        // Fallback to mock data
        await new Promise(resolve => setTimeout(resolve, 200));

        const lowerQuery = searchQuery.toLowerCase();
        const matches = Object.entries(MOCK_PLACES)
            .filter(([key, place]) =>
                key.includes(lowerQuery) ||
                place.name.toLowerCase().includes(lowerQuery) ||
                place.address.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5)
            .map(([key, place]) => ({
                placeId: `mock-${key}`,
                ...place,
            }));

        setSuggestions(matches);
        setIsLoading(false);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                searchPlaces(query);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchPlaces]);

    const handleSelect = (place: PlaceResult) => {
        onPlaceSelect(place);
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        inputRef.current?.focus();
    };

    return (
        <div ref={wrapperRef} className={cn('relative', className)}>
            {/* Search Input */}
            <div className="relative">
                <GlassInput
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="pl-10 pr-10"
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />

                {isLoading && (
                    <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary animate-spin"
                    />
                )}

                {!isLoading && query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl"
                    >
                        {suggestions.map((place) => (
                            <button
                                key={place.placeId}
                                onClick={() => handleSelect(place)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-[var(--glass-border)] last:border-0"
                            >
                                <MapPin size={16} className="text-[var(--glass-accent)] shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-primary truncate">
                                        {place.name}
                                    </div>
                                    <div className="text-xs text-tertiary truncate">
                                        {place.address}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* No results */}
            <AnimatePresence>
                {showSuggestions && query && !isLoading && suggestions.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl p-4 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-center"
                    >
                        <p className="text-sm text-tertiary">No places found for "{query}"</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlacesAutocomplete;
