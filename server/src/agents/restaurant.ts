import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// Reusing A2UI examples structure from frontend
// Ideally these would be shared types, but for now we duplicate the mock logic

const restaurantListTwoColumn: A2UIMessage[] = [
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
                        children: ['header', 'list-container', 'actions'],
                    },
                },
            },
            {
                id: 'header',
                component: {
                    Text: {
                        text: { literalString: 'Top Restaurants Nearby' },
                        semantic: 'h2',
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
                        children: ['name', 'cuisine-rating', 'book-btn'],
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
                        text: { path: 'rating' },
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
                        children: ['refresh-btn'],
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
        ],
    },
    {
        type: 'dataModelUpdate',
        surfaceId: 'restaurant-list',
        data: {
            restaurants: [
                { id: '1', name: 'The Glass Kitchen', cuisine: 'Modern European', rating: '⭐️ 4.8', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80' },
                { id: '2', name: 'Sushi Zen', cuisine: 'Japanese', rating: '⭐️ 4.9', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80' },
                { id: '3', name: 'Pasta & Co', cuisine: 'Italian', rating: '⭐️ 4.5', image: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=300&q=80' },
            ],
        },
    },
];

export const getRestaurantAgentCard = (baseUrl: string): AgentCard => ({
    name: 'Restaurant Finder',
    description: 'Discover and book restaurants near you with AI',
    url: `${baseUrl}/agents/restaurant`,
    version: '1.2.0',
    provider: { organization: 'LiquidCrypto Agents' },
    capabilities: { streaming: false, pushNotifications: true },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'List', 'Button', 'Image'] }
    }
});

export async function handleRestaurantRequest(params: SendMessageParams): Promise<any> {
    const prompt = params.message.parts
        // @ts-ignore
        .filter(p => p.type === 'text').map(p => p.text).join(' ').toLowerCase();

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple intent matching
    let a2uiMessages: A2UIMessage[] | null = null;
    let textResponse = '';

    if (prompt.includes('book') || prompt.includes('reservation')) {
        textResponse = "I can help with that. Please verify your booking details.";
        // Simplification: In a real app we'd reuse the booking form JSON here
        a2uiMessages = restaurantListTwoColumn; // Fallback for demo
    } else {
        textResponse = "Here are some top-rated restaurants nearby.";
        a2uiMessages = restaurantListTwoColumn;
    }

    const taskId = randomUUID();
    return {
        id: taskId,
        contextId: 'rest-context',
        status: { state: 'completed', timestamp: new Date().toISOString() },
        artifacts: [
            {
                name: 'response',
                parts: [
                    { type: 'text', text: textResponse },
                    ...(a2uiMessages ? [{ type: 'a2ui' as const, a2ui: a2uiMessages }] : [])
                ]
            }
        ],
        history: []
    };
}
