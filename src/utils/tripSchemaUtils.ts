/**
 * Trip Schema.org Utilities
 * 
 * Serialization/deserialization utilities for schema.org format.
 * Enables A2A protocol compatibility for trip data exchange.
 */

import type {
    Trip,
    TripDestination,
    SavedLocation,
    RouteToWatch,
    WeatherWindow,
} from '@/stores/auroraTravelStore';

// ============================================================================
// Schema.org Type Definitions
// ============================================================================

/**
 * Schema.org Trip representation
 * @see https://schema.org/Trip
 */
export interface TripSchemaOrg {
    "@context": "https://schema.org";
    "@type": "Trip";
    "@id"?: string;
    name: string;
    description?: string;
    departureTime?: string;
    arrivalTime?: string;
    itinerary: {
        "@type": "ItemList";
        itemListElement: DestinationSchemaOrg[];
    };
    // Custom Aurora extensions
    "aurora:status"?: string;
    "aurora:weatherScore"?: number;
    "aurora:totalDistance"?: number;
    "aurora:totalDriveTime"?: number;
}

/**
 * Schema.org Place as a list item
 * @see https://schema.org/Place
 */
export interface DestinationSchemaOrg {
    "@type": "ListItem";
    position: number;
    item: PlaceSchemaOrg;
    // Custom Aurora extensions
    "aurora:arrivalDate"?: string;
    "aurora:departureDate"?: string;
    "aurora:stayDuration"?: string;
    "aurora:driveTimeFromPrevious"?: number;
    "aurora:distanceFromPrevious"?: number;
}

/**
 * Schema.org Place representation
 * @see https://schema.org/Place
 */
export interface PlaceSchemaOrg {
    "@type": "Place";
    name: string;
    geo: GeoCoordinatesSchemaOrg;
    address?: PostalAddressSchemaOrg;
}

/**
 * Schema.org GeoCoordinates
 * @see https://schema.org/GeoCoordinates
 */
export interface GeoCoordinatesSchemaOrg {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
}

/**
 * Schema.org PostalAddress
 * @see https://schema.org/PostalAddress
 */
export interface PostalAddressSchemaOrg {
    "@type": "PostalAddress";
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string;
}

/**
 * Schema.org Event for route watch recommendations
 * Using Event type for scheduled activities
 */
export interface RouteWatchSchemaOrg {
    "@context": "https://schema.org";
    "@type": "Event";
    "@id"?: string;
    name: string;
    startDate?: string;
    endDate?: string;
    location: PlaceSchemaOrg;
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode";
    subEvent?: WeatherWindowSchemaOrg[];
    // Custom Aurora extensions
    "aurora:origin": PlaceSchemaOrg;
    "aurora:destination": PlaceSchemaOrg;
    "aurora:waypoints"?: PlaceSchemaOrg[];
    "aurora:status": string;
    "aurora:weatherCriteria"?: object;
    "aurora:flexibility"?: object;
}

/**
 * Weather window as a potential event time slot
 */
export interface WeatherWindowSchemaOrg {
    "@type": "Event";
    startDate: string;
    endDate: string;
    description: string;
    "aurora:weatherScore": number;
    "aurora:confidence": number;
}

// ============================================================================
// Conversion: Internal → Schema.org
// ============================================================================

/**
 * Convert a saved location to schema.org Place
 */
export function locationToSchemaOrg(location: SavedLocation): PlaceSchemaOrg {
    const place: PlaceSchemaOrg = {
        "@type": "Place",
        name: location.name,
        geo: {
            "@type": "GeoCoordinates",
            latitude: location.lat,
            longitude: location.lng,
        },
    };

    if (location.region || location.country) {
        place.address = {
            "@type": "PostalAddress",
            addressRegion: location.region,
            addressCountry: location.country,
        };
    }

    return place;
}

/**
 * Convert a trip destination to schema.org ListItem
 */
export function destinationToSchemaOrg(dest: TripDestination): DestinationSchemaOrg {
    return {
        "@type": "ListItem",
        position: dest.position,
        item: {
            "@type": "Place",
            name: dest.place.name,
            geo: {
                "@type": "GeoCoordinates",
                latitude: dest.place.lat,
                longitude: dest.place.lng,
            },
            ...(dest.place.addressLocality || dest.place.addressRegion || dest.place.addressCountry
                ? {
                    address: {
                        "@type": "PostalAddress",
                        addressLocality: dest.place.addressLocality,
                        addressRegion: dest.place.addressRegion,
                        addressCountry: dest.place.addressCountry,
                    },
                }
                : {}),
        },
        ...(dest.arrivalDate && { "aurora:arrivalDate": dest.arrivalDate }),
        ...(dest.departureDate && { "aurora:departureDate": dest.departureDate }),
        ...(dest.stayDuration && { "aurora:stayDuration": dest.stayDuration }),
        ...(dest.driveTimeFromPrevious && { "aurora:driveTimeFromPrevious": dest.driveTimeFromPrevious }),
        ...(dest.distanceFromPrevious && { "aurora:distanceFromPrevious": dest.distanceFromPrevious }),
    };
}

/**
 * Convert a trip to schema.org Trip
 */
export function tripToSchemaOrg(trip: Trip): TripSchemaOrg {
    return {
        "@context": "https://schema.org",
        "@type": "Trip",
        "@id": `aurora:trip:${trip.id}`,
        name: trip.name,
        ...(trip.description && { description: trip.description }),
        ...(trip.departureDate && { departureTime: trip.departureDate }),
        ...(trip.returnDate && { arrivalTime: trip.returnDate }),
        itinerary: {
            "@type": "ItemList",
            itemListElement: trip.destinations.map(destinationToSchemaOrg),
        },
        "aurora:status": trip.status,
        ...(trip.weatherScore !== undefined && { "aurora:weatherScore": trip.weatherScore }),
        ...(trip.totalDistance !== undefined && { "aurora:totalDistance": trip.totalDistance }),
        ...(trip.totalDriveTime !== undefined && { "aurora:totalDriveTime": trip.totalDriveTime }),
    };
}

/**
 * Convert weather windows to schema.org events
 */
function weatherWindowsToSchemaOrg(windows: WeatherWindow[]): WeatherWindowSchemaOrg[] {
    return windows.map(w => ({
        "@type": "Event",
        startDate: w.departureTime,
        endDate: w.arrivalTime,
        description: w.summary,
        "aurora:weatherScore": w.weatherScore,
        "aurora:confidence": w.confidence,
    }));
}

/**
 * Convert a route-to-watch to schema.org Event
 */
export function routeToWatchToSchemaOrg(route: RouteToWatch): RouteWatchSchemaOrg {
    return {
        "@context": "https://schema.org",
        "@type": "Event",
        "@id": `aurora:route:${route.id}`,
        name: route.name,
        startDate: route.flexibility.dateRange.start,
        endDate: route.flexibility.dateRange.end,
        location: locationToSchemaOrg(route.destination),
        eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
        ...(route.recommendedWindows && route.recommendedWindows.length > 0 && {
            subEvent: weatherWindowsToSchemaOrg(route.recommendedWindows),
        }),
        "aurora:origin": locationToSchemaOrg(route.origin),
        "aurora:destination": locationToSchemaOrg(route.destination),
        ...(route.waypoints && route.waypoints.length > 0 && {
            "aurora:waypoints": route.waypoints.map(locationToSchemaOrg),
        }),
        "aurora:status": route.status,
        "aurora:weatherCriteria": route.weatherCriteria,
        "aurora:flexibility": route.flexibility,
    };
}

// ============================================================================
// Conversion: Schema.org → Internal
// ============================================================================

/**
 * Parse a schema.org Place to SavedLocation
 */
export function locationFromSchemaOrg(place: PlaceSchemaOrg, id?: string): SavedLocation {
    return {
        id: id || crypto.randomUUID(),
        name: place.name,
        lat: place.geo.latitude,
        lng: place.geo.longitude,
        timezone: 'UTC', // Would need to be resolved separately
        region: place.address?.addressRegion,
        country: place.address?.addressCountry,
    };
}

/**
 * Parse a schema.org ListItem to TripDestination
 */
export function destinationFromSchemaOrg(item: DestinationSchemaOrg): TripDestination {
    return {
        id: crypto.randomUUID(),
        position: item.position,
        place: {
            name: item.item.name,
            lat: item.item.geo.latitude,
            lng: item.item.geo.longitude,
            addressLocality: item.item.address?.addressLocality,
            addressRegion: item.item.address?.addressRegion,
            addressCountry: item.item.address?.addressCountry,
        },
        arrivalDate: item["aurora:arrivalDate"],
        departureDate: item["aurora:departureDate"],
        stayDuration: item["aurora:stayDuration"],
        driveTimeFromPrevious: item["aurora:driveTimeFromPrevious"],
        distanceFromPrevious: item["aurora:distanceFromPrevious"],
    };
}

/**
 * Parse a schema.org Trip to internal Trip
 */
export function tripFromSchemaOrg(schema: TripSchemaOrg): Omit<Trip, 'createdAt' | 'updatedAt'> {
    const idMatch = schema["@id"]?.match(/aurora:trip:(.+)/);

    return {
        id: idMatch?.[1] || crypto.randomUUID(),
        name: schema.name,
        description: schema.description,
        status: (schema["aurora:status"] as Trip['status']) || 'draft',
        destinations: schema.itinerary.itemListElement.map(destinationFromSchemaOrg),
        departureDate: schema.departureTime,
        returnDate: schema.arrivalTime,
        totalDistance: schema["aurora:totalDistance"],
        totalDriveTime: schema["aurora:totalDriveTime"],
        weatherScore: schema["aurora:weatherScore"],
    };
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Export a trip as JSON-LD string for A2A artifact transmission
 */
export function exportTripAsJsonLd(trip: Trip): string {
    return JSON.stringify(tripToSchemaOrg(trip), null, 2);
}

/**
 * Export a route-to-watch as JSON-LD string
 */
export function exportRouteAsJsonLd(route: RouteToWatch): string {
    return JSON.stringify(routeToWatchToSchemaOrg(route), null, 2);
}

/**
 * Parse a JSON-LD string to trip (validates @type)
 */
export function importTripFromJsonLd(jsonLd: string): Trip | null {
    try {
        const schema = JSON.parse(jsonLd) as TripSchemaOrg;
        if (schema["@type"] !== "Trip") {
            console.warn('[tripSchemaUtils] Invalid @type, expected "Trip"');
            return null;
        }
        const now = new Date().toISOString();
        const parsed = tripFromSchemaOrg(schema);
        return {
            ...parsed,
            createdAt: now,
            updatedAt: now,
        };
    } catch (e) {
        console.error('[tripSchemaUtils] Failed to parse JSON-LD:', e);
        return null;
    }
}

/**
 * Validate a schema.org Trip structure
 */
export function validateTripSchema(schema: unknown): schema is TripSchemaOrg {
    if (typeof schema !== 'object' || schema === null) return false;
    const obj = schema as Record<string, unknown>;

    return (
        obj["@context"] === "https://schema.org" &&
        obj["@type"] === "Trip" &&
        typeof obj.name === "string" &&
        typeof obj.itinerary === "object" &&
        obj.itinerary !== null &&
        (obj.itinerary as Record<string, unknown>)["@type"] === "ItemList"
    );
}
