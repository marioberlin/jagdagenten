import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Restaurant Data
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
}

// Sample restaurant data (in production, this would come from a restaurant API)
const RESTAURANTS: Restaurant[] = [
    { id: '1', name: 'The Glass Kitchen', cuisine: 'Modern European', rating: 4.8, priceRange: '$$$', distance: '0.3 mi', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80', available: true },
    { id: '2', name: 'Sushi Zen', cuisine: 'Japanese', rating: 4.9, priceRange: '$$$$', distance: '0.5 mi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80', available: true },
    { id: '3', name: 'Pasta & Co', cuisine: 'Italian', rating: 4.5, priceRange: '$$', distance: '0.2 mi', image: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=300&q=80', available: true },
    { id: '4', name: 'Spice Garden', cuisine: 'Indian', rating: 4.6, priceRange: '$$', distance: '0.7 mi', image: 'https://images.unsplash.com/photo-1585937421612-70a008356c72?auto=format&fit=crop&w=300&q=80', available: false },
    { id: '5', name: 'Le Petit Bistro', cuisine: 'French', rating: 4.7, priceRange: '$$$', distance: '0.4 mi', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=300&q=80', available: true },
];

// ============================================================================
// A2UI Generation
// ============================================================================

function generateRestaurantList(restaurants: Restaurant[], cuisineFilter?: string): A2UIMessage[] {
    // Filter by cuisine if specified
    let filtered = restaurants;
    if (cuisineFilter) {
        filtered = restaurants.filter(r =>
            r.cuisine.toLowerCase().includes(cuisineFilter.toLowerCase())
        );
    }

    // Only show available restaurants
    filtered = filtered.filter(r => r.available);

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
                            text: { literalString: cuisineFilter ? `${cuisineFilter} Restaurants` : 'Top Restaurants Nearby' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: `${filtered.length} restaurants available for booking` },
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
                            children: ['name', 'cuisine-rating', 'details-row', 'book-btn'],
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
                            label: { literalString: 'Find More' },
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
                    ratingDisplay: `${r.rating.toFixed(1)} (${Math.floor(Math.random() * 500 + 100)} reviews)`,
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
                            children: ['header', 'restaurant-info', 'divider', 'form-fields', 'submit-row'],
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
                            children: ['detail-restaurant', 'detail-cuisine', 'detail-price'],
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
                            children: ['done-btn'],
                            alignment: 'center',
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
    description: 'Discover and book restaurants near you with AI-powered recommendations',
    url: `${baseUrl}/agents/restaurant`,
    version: '1.3.0',
    provider: { organization: 'LiquidCrypto Agents' },
    capabilities: { streaming: false, pushNotifications: true },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'List', 'Button', 'Image', 'TextField', 'Divider'] }
    }
});

export async function handleRestaurantRequest(params: SendMessageParams): Promise<any> {
    const prompt = params.message.parts
        // @ts-ignore
        .filter(p => p.type === 'text').map(p => p.text).join(' ').toLowerCase();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let a2uiMessages: A2UIMessage[];
    let textResponse: string;

    // Extract cuisine filter if mentioned
    const cuisines = ['italian', 'japanese', 'french', 'indian', 'european', 'chinese', 'mexican', 'thai'];
    const mentionedCuisine = cuisines.find(c => prompt.includes(c));

    // Intent matching
    if (prompt.includes('confirm') || prompt.includes('yes') || prompt.includes('reserve')) {
        // User confirming a booking - show confirmation
        const restaurant = RESTAURANTS[0]; // In real app, would track which one
        a2uiMessages = generateBookingConfirmation(restaurant);
        textResponse = `Your reservation at ${restaurant.name} has been confirmed!`;
    } else if (prompt.includes('book') && prompt.match(/\d+|glass|sushi|pasta|spice|bistro/i)) {
        // User wants to book a specific restaurant
        const restaurantName = prompt.match(/glass|sushi|pasta|spice|bistro/i)?.[0] || '';
        const restaurant = RESTAURANTS.find(r =>
            r.name.toLowerCase().includes(restaurantName.toLowerCase())
        ) || RESTAURANTS[0];
        a2uiMessages = generateBookingForm(restaurant);
        textResponse = `Great choice! Please fill in your booking details for ${restaurant.name}.`;
    } else if (mentionedCuisine) {
        // Filter by cuisine type
        a2uiMessages = generateRestaurantList(RESTAURANTS, mentionedCuisine);
        const count = RESTAURANTS.filter(r =>
            r.cuisine.toLowerCase().includes(mentionedCuisine) && r.available
        ).length;
        textResponse = count > 0
            ? `Found ${count} ${mentionedCuisine} restaurant${count > 1 ? 's' : ''} nearby.`
            : `No ${mentionedCuisine} restaurants available right now. Here are other options:`;
    } else {
        // Default - show all restaurants
        a2uiMessages = generateRestaurantList(RESTAURANTS);
        textResponse = `Here are the top-rated restaurants near you. ${RESTAURANTS.filter(r => r.available).length} available for booking.`;
    }

    const taskId = randomUUID();
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
}
