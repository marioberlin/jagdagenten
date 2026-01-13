import {
    A2AClient,
    type A2AClientConfig,
    type TaskStreamEvent
} from './client';
import type {
    AgentCard,
    A2AMessage,
    Task,
    Artifact,
} from './types';
import { allExamples } from './examples';

/**
 * Helper to extract text content from A2AMessage parts
 */
function getMessageText(message: A2AMessage): string {
    for (const part of message.parts) {
        if (part.type === 'text') {
            return part.text;
        }
    }
    return '';
}

/**
 * Mock A2A Client
 * Intercepts requests to example domains and returns static data.
 */
export class MockA2AClient extends A2AClient {
    private mockId: string;
    private mockAgentUrl: string;

    constructor(config: A2AClientConfig) {
        super(config);
        this.mockAgentUrl = config.agentUrl;
        // Extract ID from URL (e.g. https://restaurant-agent.example.com -> restaurant)
        if (config.agentUrl.includes('restaurant')) {
            this.mockId = 'restaurant';
        } else if (config.agentUrl.includes('rizzcharts') || config.agentUrl.includes('analytics')) {
            this.mockId = 'charts';
        } else {
            this.mockId = 'unknown';
        }
    }

    override async getAgentCard(): Promise<AgentCard> {
        // Return a mock card based on ID
        const baseCard: AgentCard = {
            name: this.mockId === 'restaurant' ? 'Restaurant Finder' : 'RizzCharts',
            description: 'Mock Agent for Demo',
            url: this.mockAgentUrl,
            version: '1.0.0',
            provider: { organization: 'Mock Provider' },
            capabilities: { streaming: true, pushNotifications: false },
            extensions: {
                a2ui: { version: '0.8', supportedComponents: ['Card', 'Button', 'Text'] }
            }
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return baseCard;
    }

    override async sendMessage(message: A2AMessage, _options?: unknown): Promise<Task> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.createMockTask(getMessageText(message));
    }

    override async *streamMessage(message: A2AMessage, _options?: unknown): AsyncGenerator<TaskStreamEvent> {
        // Simulate thinking
        await new Promise(resolve => setTimeout(resolve, 800));

        const taskId = `mock-${Date.now()}`;

        // 1. Status update
        yield {
            type: 'status_update',
            taskId,
            status: { state: 'working', timestamp: new Date().toISOString() }
        };

        // 2. Stream content chunks
        const responseText = this.getMockResponseText(getMessageText(message));
        const chunks = responseText.match(/.{1,10}/g) || [responseText];

        for (const chunk of chunks) {
            await new Promise(resolve => setTimeout(resolve, 50));
            yield {
                type: 'message',
                taskId,
                message: {
                    role: 'agent',
                    parts: [{ type: 'text', text: chunk }]
                }
            };
        }

        // 3. Send A2UI if applicable
        const a2ui = this.getMockA2UI(getMessageText(message));
        if (a2ui) {
            yield {
                type: 'message',
                taskId,
                message: {
                    role: 'agent',
                    parts: [{ type: 'a2ui', a2ui }]
                }
            };
        }

        // 4. Complete
        yield {
            type: 'status_update',
            taskId,
            status: { state: 'completed', timestamp: new Date().toISOString() }
        };
    }

    private createMockTask(prompt: string): Task {
        const taskId = `mock-${Date.now()}`;
        const a2ui = this.getMockA2UI(prompt);

        const artifacts: Artifact[] = [];
        if (a2ui) {
            artifacts.push({
                name: 'ui',
                parts: [{ type: 'a2ui', a2ui }]
            });
        }

        return {
            id: taskId,
            contextId: 'mock-context',
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts,
            history: []
        };
    }

    private getMockResponseText(prompt: string): string {
        const p = prompt.toLowerCase();
        if (this.mockId === 'restaurant') {
            if (p.includes('book') || p.includes('reservation')) return "I can help with that. Here are the details for your booking.";
            if (p.includes('confirm')) return "Great! Your reservation is confirmed.";
            return "Sure, I can help you find a place to eat. Here are some top-rated restaurants nearby.";
        }
        if (this.mockId === 'charts') {
            return "I've analyzed the market data. Here is the visualization you requested.";
        }
        return "I am a mock agent. I received: " + prompt;
    }

    private getMockA2UI(prompt: string) {
        const p = prompt.toLowerCase();

        if (this.mockId === 'restaurant') {
            const examples = allExamples.restaurant;
            if (p.includes('book') || p.includes('reservation')) return examples.bookingForm;
            if (p.includes('confirm')) return examples.confirmation;
            // Default to list
            return examples.twoColumnList;
        }

        if (this.mockId === 'charts') {
            const examples = allExamples.charts;
            if (p.includes('portfolio') || p.includes('crypto')) return examples.cryptoPortfolio;
            return examples.salesDashboard;
        }

        return undefined;
    }
}
