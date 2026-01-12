/**
 * Restaurant Finder A2UI Examples
 *
 * These examples are adapted from Google's A2UI restaurant_finder sample
 * and transformed to work with LiquidCrypto's Glass component system.
 *
 * @see https://github.com/google/A2UI/tree/main/samples/agent/adk/restaurant_finder
 */

import type { A2UIMessage } from '../types';

/**
 * Single column restaurant list - for 5 or fewer restaurants
 */
export const restaurantListSingleColumn: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'restaurant-list',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#6366f1', // Indigo to match Glass theme
            fontFamily: 'Inter, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'restaurant-list',
        components: [
            {
                id: 'root',
                component: {
                    Column: {
                        children: ['header', 'restaurant-list'],
                        alignment: 'stretch',
                    },
                },
            },
            {
                id: 'header',
                component: {
                    Text: {
                        text: { literalString: 'Nearby Restaurants' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'restaurant-list',
                component: {
                    List: {
                        items: { path: '/restaurants' },
                        template: 'restaurant-card',
                        direction: 'vertical',
                    },
                },
            },
            {
                id: 'restaurant-card',
                component: {
                    Card: {
                        children: ['card-content'],
                    },
                },
            },
            {
                id: 'card-content',
                component: {
                    Column: {
                        children: ['card-image', 'card-info', 'card-actions'],
                    },
                },
            },
            {
                id: 'card-image',
                component: {
                    Image: {
                        src: { path: 'image' },
                        alt: { path: 'name' },
                        height: 200,
                    },
                },
            },
            {
                id: 'card-info',
                component: {
                    Column: {
                        children: ['restaurant-name', 'restaurant-rating', 'restaurant-details'],
                    },
                },
            },
            {
                id: 'restaurant-name',
                component: {
                    Text: {
                        text: { path: 'name' },
                        semantic: 'h2',
                    },
                },
            },
            {
                id: 'restaurant-rating',
                component: {
                    Row: {
                        children: ['rating-stars', 'rating-count'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'rating-stars',
                component: {
                    Text: {
                        text: { path: 'rating' },
                    },
                },
            },
            {
                id: 'rating-count',
                component: {
                    Text: {
                        text: { path: 'reviewCount' },
                    },
                },
            },
            {
                id: 'restaurant-details',
                component: {
                    Text: {
                        text: { path: 'details' },
                    },
                },
            },
            {
                id: 'card-actions',
                component: {
                    Row: {
                        children: ['book-button'],
                        distribution: 'end',
                    },
                },
            },
            {
                id: 'book-button',
                component: {
                    Button: {
                        label: { literalString: 'Book Now' },
                        primary: true,
                        action: {
                            custom: {
                                actionId: 'book_restaurant',
                                data: { path: 'id' },
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
            restaurants: [
                {
                    id: 'rest-1',
                    name: 'The Glass Kitchen',
                    image: '/images/restaurants/glass-kitchen.jpg',
                    rating: '4.8',
                    reviewCount: '(256 reviews)',
                    details: 'Modern American • $$$ • 0.3 mi',
                },
                {
                    id: 'rest-2',
                    name: 'Sakura Sushi',
                    image: '/images/restaurants/sakura-sushi.jpg',
                    rating: '4.6',
                    reviewCount: '(189 reviews)',
                    details: 'Japanese • $$ • 0.5 mi',
                },
                {
                    id: 'rest-3',
                    name: 'Bella Italia',
                    image: '/images/restaurants/bella-italia.jpg',
                    rating: '4.5',
                    reviewCount: '(312 reviews)',
                    details: 'Italian • $$ • 0.7 mi',
                },
            ],
        },
    },
];

/**
 * Two column restaurant list - for more than 5 restaurants
 */
export const restaurantListTwoColumn: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'restaurant-grid',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#6366f1',
            fontFamily: 'Inter, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'restaurant-grid',
        components: [
            {
                id: 'root',
                component: {
                    Column: {
                        children: ['header', 'restaurant-grid'],
                    },
                },
            },
            {
                id: 'header',
                component: {
                    Text: {
                        text: { literalString: 'Find Your Perfect Dining Spot' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'restaurant-grid',
                component: {
                    List: {
                        items: { path: '/restaurants' },
                        template: 'restaurant-card',
                        direction: 'horizontal', // Grid layout
                    },
                },
            },
            // Same card template as single column
            {
                id: 'restaurant-card',
                component: {
                    Card: {
                        children: ['card-content'],
                    },
                },
                weight: 1, // Equal width cards
            },
            {
                id: 'card-content',
                component: {
                    Column: {
                        children: ['card-image', 'card-info', 'card-actions'],
                    },
                },
            },
            {
                id: 'card-image',
                component: {
                    Image: {
                        src: { path: 'image' },
                        alt: { path: 'name' },
                        height: 150,
                    },
                },
            },
            {
                id: 'card-info',
                component: {
                    Column: {
                        children: ['restaurant-name', 'restaurant-rating'],
                    },
                },
            },
            {
                id: 'restaurant-name',
                component: {
                    Text: {
                        text: { path: 'name' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'restaurant-rating',
                component: {
                    Text: {
                        text: { path: 'rating' },
                    },
                },
            },
            {
                id: 'card-actions',
                component: {
                    Button: {
                        label: { literalString: 'View' },
                        action: {
                            custom: {
                                actionId: 'view_restaurant',
                                data: { path: 'id' },
                            },
                        },
                    },
                },
            },
        ],
    },
];

/**
 * Restaurant booking form
 */
export const restaurantBookingForm: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'booking-form',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#6366f1',
            fontFamily: 'Inter, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'booking-form',
        components: [
            {
                id: 'root',
                component: {
                    Card: {
                        children: ['form-content'],
                    },
                },
            },
            {
                id: 'form-content',
                component: {
                    Column: {
                        children: [
                            'form-header',
                            'restaurant-info',
                            'divider-1',
                            'party-size-field',
                            'datetime-field',
                            'dietary-field',
                            'divider-2',
                            'form-actions',
                        ],
                    },
                },
            },
            {
                id: 'form-header',
                component: {
                    Text: {
                        text: { literalString: 'Make a Reservation' },
                        semantic: 'h2',
                    },
                },
            },
            {
                id: 'restaurant-info',
                component: {
                    Row: {
                        children: ['restaurant-image-small', 'restaurant-name-display'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'restaurant-image-small',
                component: {
                    Image: {
                        src: { path: '/restaurant.image' },
                        width: 60,
                        height: 60,
                    },
                },
            },
            {
                id: 'restaurant-name-display',
                component: {
                    Text: {
                        text: { path: '/restaurant.name' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'divider-1',
                component: {
                    Divider: {},
                },
            },
            {
                id: 'party-size-field',
                component: {
                    TextField: {
                        label: { literalString: 'Party Size' },
                        placeholder: { literalString: 'Number of guests' },
                        inputType: 'number',
                        binding: 'partySize',
                    },
                },
            },
            {
                id: 'datetime-field',
                component: {
                    DateTimeInput: {
                        label: { literalString: 'Date & Time' },
                        binding: 'dateTime',
                    },
                },
            },
            {
                id: 'dietary-field',
                component: {
                    TextField: {
                        label: { literalString: 'Dietary Requirements' },
                        placeholder: { literalString: 'Any allergies or preferences?' },
                        inputType: 'longText',
                        binding: 'dietary',
                    },
                },
            },
            {
                id: 'divider-2',
                component: {
                    Divider: {},
                },
            },
            {
                id: 'form-actions',
                component: {
                    Row: {
                        children: ['cancel-button', 'submit-button'],
                        distribution: 'end',
                    },
                },
            },
            {
                id: 'cancel-button',
                component: {
                    Button: {
                        label: { literalString: 'Cancel' },
                        action: {
                            custom: {
                                actionId: 'cancel_booking',
                            },
                        },
                    },
                },
            },
            {
                id: 'submit-button',
                component: {
                    Button: {
                        label: { literalString: 'Confirm Reservation' },
                        primary: true,
                        action: {
                            submit: {
                                data: {
                                    restaurantId: '{{ /restaurant.id }}',
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
    {
        type: 'dataModelUpdate',
        surfaceId: 'booking-form',
        data: {
            restaurant: {
                id: 'rest-1',
                name: 'The Glass Kitchen',
                image: '/images/restaurants/glass-kitchen.jpg',
            },
        },
    },
];

/**
 * Booking confirmation
 */
export const bookingConfirmation: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'booking-confirmation',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#10b981', // Green for success
            fontFamily: 'Inter, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'booking-confirmation',
        components: [
            {
                id: 'root',
                component: {
                    Card: {
                        children: ['confirmation-content'],
                    },
                },
            },
            {
                id: 'confirmation-content',
                component: {
                    Column: {
                        children: [
                            'success-icon',
                            'success-header',
                            'divider',
                            'booking-details',
                            'restaurant-image-large',
                            'welcome-message',
                        ],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'success-icon',
                component: {
                    Icon: {
                        name: { literalString: 'check_circle' },
                        size: 64,
                    },
                },
            },
            {
                id: 'success-header',
                component: {
                    Text: {
                        text: { literalString: 'Reservation Confirmed!' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'divider',
                component: {
                    Divider: {},
                },
            },
            {
                id: 'booking-details',
                component: {
                    Column: {
                        children: ['detail-restaurant', 'detail-date', 'detail-party', 'detail-dietary'],
                    },
                },
            },
            {
                id: 'detail-restaurant',
                component: {
                    Row: {
                        children: ['label-restaurant', 'value-restaurant'],
                    },
                },
            },
            {
                id: 'label-restaurant',
                component: {
                    Text: {
                        text: { literalString: 'Restaurant:' },
                    },
                },
            },
            {
                id: 'value-restaurant',
                component: {
                    Text: {
                        text: { path: '/booking.restaurantName' },
                    },
                },
            },
            {
                id: 'detail-date',
                component: {
                    Row: {
                        children: ['label-date', 'value-date'],
                    },
                },
            },
            {
                id: 'label-date',
                component: {
                    Text: {
                        text: { literalString: 'Date & Time:' },
                    },
                },
            },
            {
                id: 'value-date',
                component: {
                    Text: {
                        text: { path: '/booking.dateTime' },
                    },
                },
            },
            {
                id: 'detail-party',
                component: {
                    Row: {
                        children: ['label-party', 'value-party'],
                    },
                },
            },
            {
                id: 'label-party',
                component: {
                    Text: {
                        text: { literalString: 'Party Size:' },
                    },
                },
            },
            {
                id: 'value-party',
                component: {
                    Text: {
                        text: { path: '/booking.partySize' },
                    },
                },
            },
            {
                id: 'detail-dietary',
                component: {
                    Row: {
                        children: ['label-dietary', 'value-dietary'],
                    },
                },
            },
            {
                id: 'label-dietary',
                component: {
                    Text: {
                        text: { literalString: 'Dietary Notes:' },
                    },
                },
            },
            {
                id: 'value-dietary',
                component: {
                    Text: {
                        text: { path: '/booking.dietary' },
                    },
                },
            },
            {
                id: 'restaurant-image-large',
                component: {
                    Image: {
                        src: { path: '/booking.restaurantImage' },
                        height: 200,
                    },
                },
            },
            {
                id: 'welcome-message',
                component: {
                    Text: {
                        text: { literalString: "We look forward to seeing you! Don't forget to bring your confirmation number." },
                    },
                },
            },
        ],
    },
    {
        type: 'dataModelUpdate',
        surfaceId: 'booking-confirmation',
        data: {
            booking: {
                restaurantName: 'The Glass Kitchen',
                restaurantImage: '/images/restaurants/glass-kitchen.jpg',
                dateTime: 'Saturday, Jan 15 at 7:00 PM',
                partySize: '4 guests',
                dietary: 'Vegetarian options requested',
                confirmationNumber: 'GK-2026-0115-7892',
            },
        },
    },
];

/**
 * All restaurant finder examples
 */
export const restaurantFinderExamples = {
    singleColumnList: restaurantListSingleColumn,
    twoColumnList: restaurantListTwoColumn,
    bookingForm: restaurantBookingForm,
    confirmation: bookingConfirmation,
};

export default restaurantFinderExamples;
