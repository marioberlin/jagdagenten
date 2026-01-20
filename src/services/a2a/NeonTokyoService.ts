/**
 * Neon Tokyo Service
 * 
 * A2A client for the Neon Tokyo hyper-personalized travel concierge.
 * Handles atmosphere-driven travel planning with weather-reactive UI.
 */

import { v4 as uuidv4 } from 'uuid';

// Weather conditions that drive atmosphere
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'night' | 'foggy';

// Atmosphere configuration derived from weather
export interface AtmosphereConfig {
    condition: WeatherCondition;
    temperature: number;
    humidity: number;
    mood: string;
    gradientFrom: string;
    gradientTo: string;
    accentColor: string;
    glassBlur: 'thin' | 'regular' | 'thick';
}

// Ticket data for holographic boarding passes
export interface TicketData {
    type: 'flight' | 'train' | 'hotel';
    reference: string;
    departure: { location: string; time: string; terminal?: string };
    arrival: { location: string; time: string };
    carrier: string;
    class: string;
    passenger: string;
}

// Packing item with weather context
export interface PackingItem {
    id: string;
    name: string;
    checked: boolean;
    weatherReason?: string;
    icon?: string;  // Icon key for Lucide icon lookup
    category?: string;
}

// Itinerary day structure
export interface ItineraryDay {
    date: string;
    theme: string;
    activities: {
        time: string;
        title: string;
        description: string;
        location: string;
        duration: string;
        icon: string;  // Icon key for Lucide icon lookup
    }[];
}

// Full Neon Tokyo response structure
export interface NeonTokyoData {
    destination?: string;
    tripName?: string;
    atmosphere?: AtmosphereConfig;
    itinerary?: ItineraryDay[];
    ticket?: TicketData;  // Single featured ticket
    tickets?: TicketData[];  // Multiple tickets
    packingList?: PackingItem[];
    mapMarkers?: { id: string; lat: number; lng: number; label: string; color?: string }[];
}

// Helper to get base URL
const getBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || '';
};

export class NeonTokyoService  {
    private baseUrl: string;
    private contextId: string;
    private onDataUpdate?: (data: NeonTokyoData) => void;

    constructor(contextId: string = 'default', onDataUpdate?: (data: NeonTokyoData) => void) {
        this.baseUrl = getBaseUrl();
        this.contextId = contextId;
        this.onDataUpdate = onDataUpdate;
    }

    async sendMessage(prompt: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/agents/neon-tokyo/a2a`, {
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
                            parts: [{ text: prompt }]
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
                .find((p: any) => p.text !== undefined);

            // Extract data update (side-channel for atmosphere, itinerary, etc.)
            const dataPart = artifacts
                .flatMap((a: any) => a.parts)
                .find((p: any) => p.type === 'data');

            if (dataPart && this.onDataUpdate) {
                this.onDataUpdate(dataPart.data as NeonTokyoData);
            }

            return textPart ? textPart.text : "Your journey awaits. ✨";

        } catch (error) {
            console.error('[NeonTokyo] Service Error:', error);
            return "I'm having trouble connecting to the travel concierge. Please try again.";
        }
    }
}
