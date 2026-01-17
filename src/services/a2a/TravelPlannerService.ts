import { ILiquidLLMService } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper to get base URL
const getBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || '';
};

export class TravelPlannerService implements ILiquidLLMService {
    private baseUrl: string;
    private contextId: string;
    private onDataUpdate?: (data: any) => void;

    constructor(contextId: string = 'default', onDataUpdate?: (data: any) => void) {
        this.baseUrl = getBaseUrl();
        this.contextId = contextId;
        this.onDataUpdate = onDataUpdate;
    }

    async sendMessage(prompt: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/agents/travel/a2a`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'SendMessage',
                    id: uuidv4(),
                    params: {
                        id: uuidv4(),
                        timestamp: new Date().toISOString(),
                        contextId: this.contextId,
                        message: {
                            id: uuidv4(),
                            contextId: this.contextId,
                            role: 'user',
                            timestamp: new Date().toISOString(),
                            parts: [{ type: 'text', text: prompt }]
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Agent Error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();

            if (json.error) {
                throw new Error(json.error.message || 'Unknown agent error');
            }

            const result = json.result;
            const artifacts = result.artifacts || [];

            // Extract text response
            const textPart = artifacts
                .flatMap((a: any) => a.parts)
                .find((p: any) => p.type === 'text');

            // Extract data update (side-channel for itinerary updates)
            const dataPart = artifacts
                .flatMap((a: any) => a.parts)
                .find((p: any) => p.type === 'data');

            if (dataPart && this.onDataUpdate) {
                this.onDataUpdate(dataPart.data);
            }

            return textPart ? textPart.text : "Travel plan updated.";

        } catch (error) {
            console.error('Travel Planner Error:', error);
            return "I'm having trouble connecting to the travel planner. Please try again.";
        }
    }
}
