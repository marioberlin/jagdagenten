import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Restaurant Data Types
// ============================================================================

interface Restaurant {
    id: string;
    name: string;
    cuisine: string;
    rating: number;
    priceRange: string;
    distance: string;
    image: string;
    available: boolean;
    address?: string;
    phoneNumber?: string;
    userRatingCount?: number;
    googleMapsUri?: string;
}

// ============================================================================
// Google Places API Integration
// ============================================================================

interface GooglePlacesResponse {
    places?: GooglePlace[];
}

interface GooglePlace {
    id: string;
    displayName: { text: string; languageCode: string };
    formattedAddress: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    rating?: number;
    userRatingCount?: number;
    priceLevel?: 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
    primaryType?: string;
    primaryTypeDisplayName?: { text: string };
    photos?: Array<{ name: string; widthPx: number; heightPx: number }>;
    googleMapsUri?: string;
    currentOpeningHours?: { openNow: boolean };
}

// Default location: Berlin, Germany (Mitte district)
const DEFAULT_LOCATION = {
    latitude: 52.5200,
    longitude: 13.4050,
};

// Convert Google price level to display format (using € for Europe)
function formatPriceLevel(priceLevel?: string): string {
    switch (priceLevel) {
        case 'PRICE_LEVEL_FREE': return 'Free';
        case 'PRICE_LEVEL_INEXPENSIVE': return '€';
        case 'PRICE_LEVEL_MODERATE': return '€€';
        case 'PRICE_LEVEL_EXPENSIVE': return '€€€';
        case 'PRICE_LEVEL_VERY_EXPENSIVE': return '€€€€';
        default: return '€€';
    }
}

// Get photo URL from Google Places photo reference
function getPhotoUrl(photos?: Array<{ name: string }>, apiKey?: string): string {
    if (!photos?.length || !apiKey) {
        // Return a default restaurant image from Unsplash
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80';
    }
    // Google Places Photo API URL
    return `https://places.googleapis.com/v1/${photos[0].name}/media?maxHeightPx=300&maxWidthPx=300&key=${apiKey}`;
}

// Fetch restaurants from Google Places API
async function fetchGooglePlaces(
    cuisineType?: string,
    location = DEFAULT_LOCATION,
    radiusMeters = 1500
): Promise<Restaurant[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set. Please configure your Google Places API key to use this agent.');
    }

    try {
        // Build included types based on cuisine
        const includedTypes = ['restaurant'];
        if (cuisineType) {
            // Google Places supports specific cuisine types
            const cuisineTypeMap: Record<string, string> = {
                'italian': 'italian_restaurant',
                'japanese': 'japanese_restaurant',
                'chinese': 'chinese_restaurant',
                'indian': 'indian_restaurant',
                'mexican': 'mexican_restaurant',
                'thai': 'thai_restaurant',
                'french': 'french_restaurant',
                'korean': 'korean_restaurant',
                'vietnamese': 'vietnamese_restaurant',
                'greek': 'greek_restaurant',
                'american': 'american_restaurant',
                'mediterranean': 'mediterranean_restaurant',
                'seafood': 'seafood_restaurant',
                'steakhouse': 'steak_house',
                'pizza': 'pizza_restaurant',
                'sushi': 'sushi_restaurant',
                'ramen': 'ramen_restaurant',
                'breakfast': 'breakfast_restaurant',
                'brunch': 'brunch_restaurant',
                'cafe': 'cafe',
                'bakery': 'bakery',
            };
            const mappedType = cuisineTypeMap[cuisineType.toLowerCase()];
            if (mappedType) {
                includedTypes.length = 0;
                includedTypes.push(mappedType);
            }
        }

        const requestBody = {
            includedTypes,
            maxResultCount: 10,
            rankPreference: 'POPULARITY',
            locationRestriction: {
                circle: {
                    center: location,
                    radius: radiusMeters,
                },
            },
        };

        const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': [
                    'places.id',
                    'places.displayName',
                    'places.formattedAddress',
                    'places.nationalPhoneNumber',
                    'places.internationalPhoneNumber',
                    'places.rating',
                    'places.userRatingCount',
                    'places.priceLevel',
                    'places.primaryType',
                    'places.primaryTypeDisplayName',
                    'places.photos',
                    'places.googleMapsUri',
                    'places.currentOpeningHours',
                ].join(','),
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Restaurant Agent] Google Places API error:', response.status, errorText);
            throw new Error(`Google Places API error (${response.status}): ${errorText}`);
        }

        const data = await response.json() as GooglePlacesResponse;

        if (!data.places?.length) {
            console.log('[Restaurant Agent] No places found for the given location');
            return []; // Return empty array - UI will handle "no results" gracefully
        }

        // Transform Google Places to our Restaurant format
        return data.places.map((place, index) => ({
            id: place.id,
            name: place.displayName.text,
            cuisine: place.primaryTypeDisplayName?.text || formatCuisineType(place.primaryType),
            rating: place.rating || 4.0,
            userRatingCount: place.userRatingCount,
            priceRange: formatPriceLevel(place.priceLevel),
            distance: `${(0.1 + index * 0.15).toFixed(1)} km`,
            image: getPhotoUrl(place.photos, apiKey),
            available: place.currentOpeningHours?.openNow ?? true,
            address: place.formattedAddress,
            phoneNumber: place.internationalPhoneNumber || place.nationalPhoneNumber,
            googleMapsUri: place.googleMapsUri,
        }));

    } catch (error) {
        console.error('[Restaurant Agent] Failed to fetch from Google Places:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch restaurants from Google Places API');
    }
}

// Format cuisine type from Google's primaryType
function formatCuisineType(primaryType?: string): string {
    if (!primaryType) return 'Restaurant';
    // Convert snake_case to Title Case
    return primaryType
        .replace(/_restaurant$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Note: Fallback restaurant data has been removed. This agent now requires a valid GOOGLE_PLACES_API_KEY.

// Cache for storing fetched restaurants (simple in-memory cache)
let restaurantCache: { data: Restaurant[]; timestamp: number; cuisineFilter?: string } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getRestaurants(cuisineFilter?: string): Promise<Restaurant[]> {
    const now = Date.now();

    // Check if cache is valid
    if (
        restaurantCache &&
        restaurantCache.cuisineFilter === cuisineFilter &&
        now - restaurantCache.timestamp < CACHE_TTL_MS
    ) {
        return restaurantCache.data;
    }

    // Fetch fresh data
    const restaurants = await fetchGooglePlaces(cuisineFilter);

    // Update cache
    restaurantCache = {
        data: restaurants,
        timestamp: now,
        cuisineFilter,
    };

    return restaurants;
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateRestaurantList(restaurants: Restaurant[], cuisineFilter?: string, isLiveData = false): A2UIMessage[] {
    // Only show available restaurants
    const filtered = restaurants.filter(r => r.available);

    const headerText = cuisineFilter
        ? `${cuisineFilter.charAt(0).toUpperCase() + cuisineFilter.slice(1)} Restaurants`
        : 'Top Restaurants Nearby';

    const subtitleText = isLiveData
        ? `${filtered.length} restaurants found via Google Places`
        : `${filtered.length} restaurants available`;

    return [
        {
            type: 'beginRendering',
            surfaceId: 'restaurant-list',
            rootComponentId: 'root',
            styling: { primaryColor: '#f97316', fontFamily: 'Inter, system-ui, sans-serif' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'restaurant-list',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', 'list-container', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: headerText },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: subtitleText },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'list-container',
                    component: {
                        List: {
                            items: { path: '/restaurants' },
                            template: {
                                id: 'restaurant-card-template',
                                component: {
                                    Card: {
                                        children: ['card-row'],
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    id: 'card-row',
                    component: {
                        Row: {
                            children: ['image-col', 'info-col'],
                            alignment: 'start',
                        },
                    },
                },
                {
                    id: 'image-col',
                    component: {
                        Image: {
                            src: { path: 'image' },
                            width: 100,
                            height: 100,
                        },
                    },
                },
                {
                    id: 'info-col',
                    component: {
                        Column: {
                            children: ['name', 'cuisine-rating', 'details-row', 'address-row', 'phone-row', 'book-btn'],
                            alignment: 'start',
                        },
                    },
                },
                {
                    id: 'name',
                    component: {
                        Text: {
                            text: { path: 'name' },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'cuisine-rating',
                    component: {
                        Row: {
                            children: ['cuisine', 'rating'],
                        },
                    },
                },
                {
                    id: 'cuisine',
                    component: {
                        Text: {
                            text: { path: 'cuisine' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'rating',
                    component: {
                        Text: {
                            text: { path: 'ratingDisplay' },
                        },
                    },
                },
                {
                    id: 'details-row',
                    component: {
                        Row: {
                            children: ['price', 'distance'],
                        },
                    },
                },
                {
                    id: 'price',
                    component: {
                        Text: {
                            text: { path: 'priceRange' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'distance',
                    component: {
                        Text: {
                            text: { path: 'distance' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'address-row',
                    component: {
                        Text: {
                            text: { path: 'addressShort' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'phone-row',
                    component: {
                        Text: {
                            text: { path: 'phoneDisplay' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'book-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Book Table' },
                            action: {
                                custom: {
                                    actionId: 'book_restaurant',
                                    data: { id: '{id}' },
                                },
                            },
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['refresh-btn', 'filter-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'refresh-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Refresh' },
                            action: {
                                input: {
                                    text: 'Show more restaurants',
                                },
                            },
                        },
                    },
                },
                {
                    id: 'filter-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Filter by Cuisine' },
                            action: {
                                input: {
                                    text: 'What cuisine would you like?',
                                },
                            },
                        },
                    },
                },
            ],
        },
        {
            type: 'dataModelUpdate',
            surfaceId: 'restaurant-list',
            data: {
                restaurants: filtered.map(r => ({
                    ...r,
                    ratingDisplay: r.userRatingCount
                        ? `⭐ ${r.rating.toFixed(1)} (${r.userRatingCount.toLocaleString()} reviews)`
                        : `⭐ ${r.rating.toFixed(1)}`,
                    addressShort: r.address
                        ? `📍 ${r.address.split(',').slice(0, 2).join(',').trim()}`
                        : '',
                    phoneDisplay: r.phoneNumber
                        ? `📞 ${r.phoneNumber}`
                        : '',
                })),
            },
        },
    ];
}

function generateBookingForm(restaurant: Restaurant): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: 'booking-form',
            rootComponentId: 'root',
            styling: { primaryColor: '#f97316' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'booking-form',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['header', 'restaurant-info', 'address-info', 'divider', 'form-fields', 'submit-row'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: 'Book a Table' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'restaurant-info',
                    component: {
                        Row: {
                            children: ['restaurant-name', 'restaurant-cuisine'],
                        },
                    },
                },
                {
                    id: 'restaurant-name',
                    component: {
                        Text: {
                            text: { literalString: restaurant.name },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'restaurant-cuisine',
                    component: {
                        Text: {
                            text: { literalString: ` - ${restaurant.cuisine}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'address-info',
                    component: {
                        Text: {
                            text: { literalString: restaurant.address || '' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'divider',
                    component: { Divider: {} },
                },
                {
                    id: 'form-fields',
                    component: {
                        Column: {
                            children: ['date-field', 'time-field', 'guests-field', 'name-field'],
                        },
                    },
                },
                {
                    id: 'date-field',
                    component: {
                        TextField: {
                            label: { literalString: 'Date' },
                            placeholder: { literalString: 'Select date' },
                            inputType: 'date',
                        },
                    },
                },
                {
                    id: 'time-field',
                    component: {
                        TextField: {
                            label: { literalString: 'Time' },
                            placeholder: { literalString: 'Select time' },
                            inputType: 'time',
                        },
                    },
                },
                {
                    id: 'guests-field',
                    component: {
                        TextField: {
                            label: { literalString: 'Number of Guests' },
                            placeholder: { literalString: '2' },
                            inputType: 'number',
                        },
                    },
                },
                {
                    id: 'name-field',
                    component: {
                        TextField: {
                            label: { literalString: 'Name for Reservation' },
                            placeholder: { literalString: 'Enter your name' },
                            inputType: 'text',
                        },
                    },
                },
                {
                    id: 'submit-row',
                    component: {
                        Row: {
                            children: ['cancel-btn', 'submit-btn'],
                            alignment: 'end',
                        },
                    },
                },
                {
                    id: 'cancel-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Cancel' },
                            action: {
                                input: { text: 'Show restaurants' },
                            },
                        },
                    },
                },
                {
                    id: 'submit-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Confirm Booking' },
                            action: {
                                custom: {
                                    actionId: 'confirm_booking',
                                    data: { restaurantId: restaurant.id },
                                },
                            },
                        },
                    },
                },
            ],
        },
    ];
}

function generateBookingConfirmation(restaurant: Restaurant): A2UIMessage[] {
    const confirmationNumber = `RES-${Date.now().toString(36).toUpperCase()}`;

    return [
        {
            type: 'beginRendering',
            surfaceId: 'booking-confirmation',
            rootComponentId: 'root',
            styling: { primaryColor: '#10b981' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'booking-confirmation',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['success-header', 'subtitle', 'divider', 'confirmation-number', 'details', 'actions'],
                        },
                    },
                },
                {
                    id: 'success-header',
                    component: {
                        Text: {
                            text: { literalString: 'Booking Confirmed!' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: `Your table at ${restaurant.name} is reserved.` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'divider',
                    component: { Divider: {} },
                },
                {
                    id: 'confirmation-number',
                    component: {
                        Column: {
                            children: ['conf-label', 'conf-value'],
                        },
                    },
                },
                {
                    id: 'conf-label',
                    component: {
                        Text: {
                            text: { literalString: 'Confirmation Number' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'conf-value',
                    component: {
                        Text: {
                            text: { literalString: confirmationNumber },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'details',
                    component: {
                        Column: {
                            children: ['detail-restaurant', 'detail-cuisine', 'detail-address', 'detail-price'],
                        },
                    },
                },
                {
                    id: 'detail-restaurant',
                    component: {
                        Text: {
                            text: { literalString: `Restaurant: ${restaurant.name}` },
                        },
                    },
                },
                {
                    id: 'detail-cuisine',
                    component: {
                        Text: {
                            text: { literalString: `Cuisine: ${restaurant.cuisine}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'detail-address',
                    component: {
                        Text: {
                            text: { literalString: restaurant.address || '' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'detail-price',
                    component: {
                        Text: {
                            text: { literalString: `Price Range: ${restaurant.priceRange}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['maps-btn', 'done-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'maps-btn',
                    component: {
                        Button: {
                            label: { literalString: 'View on Maps' },
                            action: {
                                custom: {
                                    actionId: 'open_maps',
                                    data: { url: restaurant.googleMapsUri || '' },
                                },
                            },
                        },
                    },
                },
                {
                    id: 'done-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Find More Restaurants' },
                            action: {
                                input: { text: 'Show restaurants' },
                            },
                        },
                    },
                },
            ],
        },
    ];
}

// ============================================================================
// Agent Card & Handler
// ============================================================================

export const getRestaurantAgentCard = (baseUrl: string): AgentCard => ({
    name: 'Restaurant Finder',
    description: 'Discover and book restaurants near you powered by Google Places API',
    url: `${baseUrl}/agents/restaurant`,
    version: '2.0.0',
    provider: { organization: 'LiquidCrypto Agents' },
    capabilities: { streaming: false, pushNotifications: true },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'List', 'Button', 'Image', 'TextField', 'Divider'] }
    }
});

// Store last fetched restaurants for booking flow
let lastFetchedRestaurants: Restaurant[] = [];

export async function handleRestaurantRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();

    try {
        // Null safety: validate params structure
        if (!params?.message?.parts) {
            const restaurants = await getRestaurants();
            const a2uiMessages = generateRestaurantList(restaurants, undefined, true);
            return {
                id: taskId,
                contextId: 'restaurant-context',
                status: { state: 'completed', timestamp: new Date().toISOString() },
                artifacts: [
                    {
                        name: 'response',
                        parts: [
                            { type: 'text', text: 'Here are the top-rated restaurants near you. (Powered by Google Places)' },
                            { type: 'a2ui' as const, a2ui: a2uiMessages }
                        ]
                    }
                ],
                history: []
            };
        }

        const prompt = params.message.parts
            // @ts-ignore
            .filter(p => p.type === 'text').map(p => p.text).join(' ').toLowerCase();

        let a2uiMessages: A2UIMessage[];
        let textResponse: string;

        // Extract cuisine filter if mentioned
        const cuisines = [
            'italian', 'japanese', 'french', 'indian', 'chinese', 'mexican', 'thai',
            'korean', 'vietnamese', 'greek', 'american', 'mediterranean', 'seafood',
            'steakhouse', 'pizza', 'sushi', 'ramen', 'breakfast', 'brunch', 'cafe', 'bakery'
        ];
        const mentionedCuisine = cuisines.find(c => prompt.includes(c));

        // Intent matching
        if (prompt.includes('confirm') || prompt.includes('yes') || prompt.includes('reserve')) {
            // User confirming a booking - show confirmation
            if (lastFetchedRestaurants.length === 0) {
                throw new Error('No restaurants available. Please search for restaurants first.');
            }
            const restaurant = lastFetchedRestaurants[0];
            a2uiMessages = generateBookingConfirmation(restaurant);
            textResponse = `Your reservation at ${restaurant.name} has been confirmed!`;
        } else if (prompt.includes('book')) {
            // User wants to book a specific restaurant - try to match by name
            if (lastFetchedRestaurants.length === 0) {
                throw new Error('No restaurants available. Please search for restaurants first by saying "show restaurants".');
            }
            const restaurants = lastFetchedRestaurants;

            // Try to find a matching restaurant from the prompt
            const restaurant = restaurants.find(r =>
                prompt.includes(r.name.toLowerCase()) ||
                r.name.toLowerCase().split(' ').some(word => prompt.includes(word))
            ) || restaurants[0];

            a2uiMessages = generateBookingForm(restaurant);
            textResponse = `Great choice! Please fill in your booking details for ${restaurant.name}.`;
        } else {
            // Search for restaurants (with optional cuisine filter)
            const restaurants = await getRestaurants(mentionedCuisine);
            lastFetchedRestaurants = restaurants;

            const isLiveData = !!process.env.GOOGLE_PLACES_API_KEY;
            a2uiMessages = generateRestaurantList(restaurants, mentionedCuisine, isLiveData);

            const availableCount = restaurants.filter(r => r.available).length;

            if (mentionedCuisine) {
                textResponse = availableCount > 0
                    ? `Found ${availableCount} ${mentionedCuisine} restaurant${availableCount > 1 ? 's' : ''} nearby.`
                    : `No ${mentionedCuisine} restaurants found. Showing all restaurants instead.`;
            } else {
                textResponse = `Here are the top-rated restaurants near you. ${availableCount} available for booking.`;
            }

            if (isLiveData) {
                textResponse += ' (Powered by Google Places)';
            }
        }

        return {
            id: taskId,
            contextId: 'restaurant-context',
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'response',
                    parts: [
                        { type: 'text', text: textResponse },
                        { type: 'a2ui' as const, a2ui: a2uiMessages }
                    ]
                }
            ],
            history: []
        };
    } catch (error) {
        // Return error as a proper A2A response instead of crashing
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('[Restaurant Agent] Error:', errorMessage);

        return {
            id: taskId,
            contextId: 'restaurant-context',
            status: { state: 'failed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'error',
                    parts: [
                        { type: 'text', text: `Error: ${errorMessage}` }
                    ]
                }
            ],
            history: []
        };
    }
}
