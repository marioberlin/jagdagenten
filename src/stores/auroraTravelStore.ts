/**
 * Aurora Travel Weather Store
 * 
 * Zustand store for Aurora Travel Weather state management.
 * Uses localStorage persistence and schema.org format for A2A compatibility.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Types
// ============================================================================

export type AuroraTravelTab = 'home' | 'trips' | 'map' | 'profile';

export type WeatherCondition =
    | 'clear' | 'partly_cloudy' | 'cloudy' | 'fog'
    | 'drizzle' | 'rain' | 'heavy_rain' | 'freezing_rain'
    | 'snow' | 'heavy_snow' | 'thunderstorm';

export type MaterialMood = 'calm' | 'active' | 'intense' | 'severe';

export type TripStatus = 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
export type RouteWatchStatus = 'watching' | 'recommended' | 'booked' | 'completed';

// ============================================================================
// Location Types
// ============================================================================

export interface SavedLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    timezone: string;
    country?: string;
    region?: string;
    isHome?: boolean;
    isWork?: boolean;
}

// ============================================================================
// Trip Types (Schema.org compatible)
// ============================================================================

export interface TripDestination {
    id: string;
    position: number;
    place: {
        name: string;
        lat: number;
        lng: number;
        addressLocality?: string;
        addressRegion?: string;
        addressCountry?: string;
    };
    arrivalDate?: string;      // ISO 8601
    departureDate?: string;    // ISO 8601
    stayDuration?: string;     // e.g., "2 nights"
    driveTimeFromPrevious?: number;  // minutes
    distanceFromPrevious?: number;   // km
}

export interface Trip {
    id: string;
    name: string;
    description?: string;
    status: TripStatus;
    destinations: TripDestination[];
    departureDate?: string;    // ISO 8601
    returnDate?: string;       // ISO 8601
    totalDistance?: number;    // km
    totalDriveTime?: number;   // minutes
    weatherScore?: number;     // 0-100
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Routes-to-Watch Types
// ============================================================================

export interface WeatherCriteria {
    minTemp?: number;
    maxTemp?: number;
    maxPrecipProbability: number;  // 0-100
    maxWindSpeed?: number;         // km/h
    preferredConditions?: WeatherCondition[];
}

export interface FlexibilitySettings {
    dateRange: {
        start: string;  // ISO 8601
        end: string;
    };
    preferredDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    minGoodWeatherHours: number;
}

export interface WeatherWindow {
    departureTime: string;
    arrivalTime: string;
    weatherScore: number;    // 0-100
    summary: string;         // e.g., "Sunny, 22°C average"
    confidence: number;      // 0-100
}

export interface RouteToWatch {
    id: string;
    name: string;
    origin: SavedLocation;
    destination: SavedLocation;
    waypoints?: SavedLocation[];
    flexibility: FlexibilitySettings;
    weatherCriteria: WeatherCriteria;
    status: RouteWatchStatus;
    lastChecked?: string;
    recommendedWindows?: WeatherWindow[];
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// User Preferences
// ============================================================================

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DistanceUnit = 'km' | 'miles';
export type TimeFormat = '12h' | '24h';

export interface UserPreferences {
    temperatureUnit: TemperatureUnit;
    distanceUnit: DistanceUnit;
    timeFormat: TimeFormat;
    defaultActivityCategories: string[];
    notificationsEnabled: boolean;
    routeWatchNotifications: boolean;
}

// ============================================================================
// Store State
// ============================================================================

export interface AuroraTravelState {
    // Navigation
    activeTab: AuroraTravelTab;

    // Locations
    savedLocations: SavedLocation[];
    selectedLocationId: string | null;

    // Trips
    trips: Trip[];
    activeTripId: string | null;

    // Routes-to-Watch
    routesToWatch: RouteToWatch[];

    // Preferences
    preferences: UserPreferences;

    // UI State
    isLoading: boolean;
    error: string | null;

    // Hydration
    _hydrated: boolean;
}

// ============================================================================
// Store Actions
// ============================================================================

export interface AuroraTravelActions {
    // Navigation
    setActiveTab: (tab: AuroraTravelTab) => void;

    // Locations
    addLocation: (location: Omit<SavedLocation, 'id'>) => string;
    updateLocation: (id: string, updates: Partial<SavedLocation>) => void;
    removeLocation: (id: string) => void;
    setSelectedLocation: (id: string | null) => void;
    setHomeLocation: (id: string) => void;
    setWorkLocation: (id: string) => void;

    // Trips
    createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateTrip: (id: string, updates: Partial<Trip>) => void;
    deleteTrip: (id: string) => void;
    setActiveTrip: (id: string | null) => void;
    addDestinationToTrip: (tripId: string, destination: Omit<TripDestination, 'id' | 'position'>) => void;
    removeDestinationFromTrip: (tripId: string, destinationId: string) => void;
    reorderDestinations: (tripId: string, fromIndex: number, toIndex: number) => void;

    // Routes-to-Watch
    createRouteToWatch: (route: Omit<RouteToWatch, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateRouteToWatch: (id: string, updates: Partial<RouteToWatch>) => void;
    deleteRouteToWatch: (id: string) => void;
    updateRouteRecommendations: (id: string, windows: WeatherWindow[]) => void;

    // Preferences
    updatePreferences: (updates: Partial<UserPreferences>) => void;

    // UI State
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;

    // Reset
    resetToDefaults: () => void;
}

export type AuroraTravelStore = AuroraTravelState & AuroraTravelActions;

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
    temperatureUnit: 'celsius',
    distanceUnit: 'km',
    timeFormat: '24h',
    defaultActivityCategories: ['outdoor', 'indoor', 'exercise'],
    notificationsEnabled: true,
    routeWatchNotifications: true,
};

const DEFAULT_STATE: AuroraTravelState = {
    activeTab: 'home',
    savedLocations: [],
    selectedLocationId: null,
    trips: [],
    activeTripId: null,
    routesToWatch: [],
    preferences: DEFAULT_PREFERENCES,
    isLoading: false,
    error: null,
    _hydrated: false,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
    return crypto.randomUUID();
}

function now(): string {
    return new Date().toISOString();
}

// ============================================================================
// Store
// ============================================================================

export const useAuroraTravelStore = create<AuroraTravelStore>()(
    devtools(
        persist(
            immer((set) => ({
                // Initial State
                ...DEFAULT_STATE,

                // Navigation
                setActiveTab: (tab) => {
                    set((state) => {
                        state.activeTab = tab;
                    });
                },

                // Locations
                addLocation: (location) => {
                    const id = generateId();
                    set((state) => {
                        state.savedLocations.push({ ...location, id });
                    });
                    return id;
                },

                updateLocation: (id, updates) => {
                    set((state) => {
                        const index = state.savedLocations.findIndex(l => l.id === id);
                        if (index !== -1) {
                            state.savedLocations[index] = { ...state.savedLocations[index], ...updates };
                        }
                    });
                },

                removeLocation: (id) => {
                    set((state) => {
                        state.savedLocations = state.savedLocations.filter(l => l.id !== id);
                        if (state.selectedLocationId === id) {
                            state.selectedLocationId = state.savedLocations[0]?.id ?? null;
                        }
                    });
                },

                setSelectedLocation: (id) => {
                    set((state) => {
                        state.selectedLocationId = id;
                    });
                },

                setHomeLocation: (id) => {
                    set((state) => {
                        state.savedLocations.forEach(l => { l.isHome = l.id === id; });
                    });
                },

                setWorkLocation: (id) => {
                    set((state) => {
                        state.savedLocations.forEach(l => { l.isWork = l.id === id; });
                    });
                },

                // Trips
                createTrip: (trip) => {
                    const id = generateId();
                    const timestamp = now();
                    set((state) => {
                        state.trips.push({
                            ...trip,
                            id,
                            createdAt: timestamp,
                            updatedAt: timestamp,
                        });
                    });
                    return id;
                },

                updateTrip: (id, updates) => {
                    set((state) => {
                        const index = state.trips.findIndex(t => t.id === id);
                        if (index !== -1) {
                            state.trips[index] = {
                                ...state.trips[index],
                                ...updates,
                                updatedAt: now(),
                            };
                        }
                    });
                },

                deleteTrip: (id) => {
                    set((state) => {
                        state.trips = state.trips.filter(t => t.id !== id);
                        if (state.activeTripId === id) {
                            state.activeTripId = null;
                        }
                    });
                },

                setActiveTrip: (id) => {
                    set((state) => {
                        state.activeTripId = id;
                    });
                },

                addDestinationToTrip: (tripId, destination) => {
                    set((state) => {
                        const trip = state.trips.find(t => t.id === tripId);
                        if (trip) {
                            const id = generateId();
                            const position = trip.destinations.length + 1;
                            trip.destinations.push({ ...destination, id, position });
                            trip.updatedAt = now();
                        }
                    });
                },

                removeDestinationFromTrip: (tripId, destinationId) => {
                    set((state) => {
                        const trip = state.trips.find(t => t.id === tripId);
                        if (trip) {
                            trip.destinations = trip.destinations.filter(d => d.id !== destinationId);
                            // Reposition
                            trip.destinations.forEach((d, i) => { d.position = i + 1; });
                            trip.updatedAt = now();
                        }
                    });
                },

                reorderDestinations: (tripId, fromIndex, toIndex) => {
                    set((state) => {
                        const trip = state.trips.find(t => t.id === tripId);
                        if (trip && fromIndex >= 0 && toIndex >= 0) {
                            const [moved] = trip.destinations.splice(fromIndex, 1);
                            trip.destinations.splice(toIndex, 0, moved);
                            trip.destinations.forEach((d, i) => { d.position = i + 1; });
                            trip.updatedAt = now();
                        }
                    });
                },

                // Routes-to-Watch
                createRouteToWatch: (route) => {
                    const id = generateId();
                    const timestamp = now();
                    set((state) => {
                        state.routesToWatch.push({
                            ...route,
                            id,
                            createdAt: timestamp,
                            updatedAt: timestamp,
                        });
                    });
                    return id;
                },

                updateRouteToWatch: (id, updates) => {
                    set((state) => {
                        const index = state.routesToWatch.findIndex(r => r.id === id);
                        if (index !== -1) {
                            state.routesToWatch[index] = {
                                ...state.routesToWatch[index],
                                ...updates,
                                updatedAt: now(),
                            };
                        }
                    });
                },

                deleteRouteToWatch: (id) => {
                    set((state) => {
                        state.routesToWatch = state.routesToWatch.filter(r => r.id !== id);
                    });
                },

                updateRouteRecommendations: (id, windows) => {
                    set((state) => {
                        const route = state.routesToWatch.find(r => r.id === id);
                        if (route) {
                            route.recommendedWindows = windows;
                            route.lastChecked = now();
                            route.status = windows.length > 0 ? 'recommended' : 'watching';
                            route.updatedAt = now();
                        }
                    });
                },

                // Preferences
                updatePreferences: (updates) => {
                    set((state) => {
                        state.preferences = { ...state.preferences, ...updates };
                    });
                },

                // UI State
                setLoading: (loading) => {
                    set((state) => {
                        state.isLoading = loading;
                    });
                },

                setError: (error) => {
                    set((state) => {
                        state.error = error;
                    });
                },

                clearError: () => {
                    set((state) => {
                        state.error = null;
                    });
                },

                // Reset
                resetToDefaults: () => {
                    set(() => DEFAULT_STATE);
                },
            })),
            {
                name: 'aurora-travel-store',
                version: 1,
                partialize: (state) => ({
                    savedLocations: state.savedLocations,
                    selectedLocationId: state.selectedLocationId,
                    trips: state.trips,
                    routesToWatch: state.routesToWatch,
                    preferences: state.preferences,
                }),
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state._hydrated = true;
                    }
                },
            }
        ),
        { name: 'AuroraTravelStore', enabled: process.env.NODE_ENV === 'development' }
    )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectHomeLocation = (state: AuroraTravelStore) =>
    state.savedLocations.find(l => l.isHome);

export const selectWorkLocation = (state: AuroraTravelStore) =>
    state.savedLocations.find(l => l.isWork);

export const selectSelectedLocation = (state: AuroraTravelStore) =>
    state.savedLocations.find(l => l.id === state.selectedLocationId);

export const selectActiveTrip = (state: AuroraTravelStore) =>
    state.trips.find(t => t.id === state.activeTripId);

export const selectUpcomingTrips = (state: AuroraTravelStore) =>
    state.trips
        .filter(t => t.status === 'planned' && t.departureDate && new Date(t.departureDate) > new Date())
        .sort((a, b) => new Date(a.departureDate!).getTime() - new Date(b.departureDate!).getTime());

export const selectRecommendedRoutes = (state: AuroraTravelStore) =>
    state.routesToWatch.filter(r => r.status === 'recommended');

export const selectWatchingRoutes = (state: AuroraTravelStore) =>
    state.routesToWatch.filter(r => r.status === 'watching');
