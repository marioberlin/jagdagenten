/**
 * Mock Agents for Integration Testing
 * 
 * Provides mock agent cards and responses for testing A2A flows.
 */

import type { AgentCard } from 'a2a-sdk';

/**
 * Mock Crypto Advisor Agent Card
 */
export const mockCryptoAdvisorCard: AgentCard = {
    name: 'Crypto Advisor',
    description: 'AI-powered cryptocurrency investment advisor',
    url: 'http://localhost:3000/agents/crypto-advisor',
    version: '1.0.0',
    capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true,
    },
    skills: [
        {
            id: 'price-lookup',
            name: 'Price Lookup',
            description: 'Look up current cryptocurrency prices',
            tags: ['crypto', 'price', 'market'],
            examples: ['What is the current BTC price?', 'Show me ETH price'],
        },
        {
            id: 'portfolio-analysis',
            name: 'Portfolio Analysis',
            description: 'Analyze cryptocurrency portfolio performance',
            tags: ['crypto', 'portfolio', 'analysis'],
            examples: ['Analyze my portfolio', 'Show portfolio summary'],
        },
    ],
    defaultInputModes: ['text'],
    defaultOutputModes: ['text', 'data'],
};

/**
 * Mock Restaurant Finder Agent Card
 */
export const mockRestaurantFinderCard: AgentCard = {
    name: 'Restaurant Finder',
    description: 'Find restaurants and make reservations',
    url: 'http://localhost:3000/agents/restaurant-finder',
    version: '1.0.0',
    capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: false,
    },
    skills: [
        {
            id: 'search-restaurants',
            name: 'Search Restaurants',
            description: 'Search for restaurants by cuisine or location',
            tags: ['food', 'search', 'location'],
            examples: ['Find Italian restaurants nearby', 'Best sushi in Berlin'],
        },
    ],
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
};

/**
 * Mock Dashboard Builder Agent Card
 */
export const mockDashboardBuilderCard: AgentCard = {
    name: 'Dashboard Builder',
    description: 'Build dynamic SaaS dashboards with AI assistance',
    url: 'http://localhost:3000/agents/dashboard-builder',
    version: '1.0.0',
    capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true,
        extensions: ['a2ui'],
    },
    skills: [
        {
            id: 'create-widget',
            name: 'Create Widget',
            description: 'Create dashboard widgets like charts, metrics, and lists',
            tags: ['dashboard', 'widget', 'create'],
            examples: ['Create a sales chart widget', 'Add a metric widget for revenue'],
        },
        {
            id: 'update-widget',
            name: 'Update Widget',
            description: 'Modify existing widgets',
            tags: ['dashboard', 'widget', 'update'],
            examples: ['Change the chart type to bar', 'Update the widget title'],
        },
    ],
    defaultInputModes: ['text'],
    defaultOutputModes: ['text', 'data'],
};

/**
 * All mock agents for registry testing
 */
export const mockAgents = [
    mockCryptoAdvisorCard,
    mockRestaurantFinderCard,
    mockDashboardBuilderCard,
];

/**
 * Create a mock streaming response generator
 */
export async function* createMockStreamingResponse(chunks: string[]) {
    for (const chunk of chunks) {
        yield {
            type: 'status' as const,
            status: {
                state: 'working' as const,
                message: chunk,
            },
        };
        await new Promise(r => setTimeout(r, 50));
    }
    yield {
        type: 'status' as const,
        status: {
            state: 'completed' as const,
            message: chunks.join(' '),
        },
    };
}
