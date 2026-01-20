import { ILiquidLLMService, ChatOptions } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Weather data types matching backend
export type WeatherCondition =
    | 'clear' | 'partly_cloudy' | 'cloudy' | 'overcast'
    | 'fog' | 'drizzle' | 'rain' | 'heavy_rain' | 'thunderstorm'
    | 'snow' | 'heavy_snow' | 'sleet' | 'hail'
    | 'wind';

export type MaterialMood = 'calm' | 'active' | 'intense' | 'severe';

export type AqiCategory = 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AirQuality {
    aqi: number;
    aqiCategory: AqiCategory;
    pm2_5: number;
    pm10: number;
    europeanAqi?: number;
}

export interface WeatherLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    timezone: string;
    country: string;
    region: 'EU' | 'US' | 'OTHER';
}

export interface CurrentWeather {
    locationId: string;
    timestamp: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    dewpoint: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: WeatherCondition;
    conditionText: string;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    precipitation: number;
    cloudCover: number;
    isDay: boolean;
    materialMood: MaterialMood;
    tintColor: string;
    airQuality?: AirQuality;
    dataSource: string;
    lastFetched: string;
}

export interface HourlyForecast {
    time: string;
    temperature: number;
    feelsLike: number;
    condition: WeatherCondition;
    precipitation: number;
    precipitationProbability: number;
    humidity: number;
    windSpeed: number;
    uvIndex: number;
    confidence?: number;
}

export interface DailyForecast {
    date: string;
    tempHigh: number;
    tempLow: number;
    condition: WeatherCondition;
    conditionText: string;
    precipitationProbability: number;
    precipitationSum: number;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
    windSpeedMax: number;
    confidence?: number;
}

export interface WeatherAlert {
    id: string;
    type: 'info' | 'warning' | 'watch' | 'advisory' | 'severe' | 'extreme';
    event: string;
    headline: string;
    description: string;
    instruction?: string;
    sender: string;
    effective: string;
    expires: string;
    areas: string[];
}

export interface ActivityRecommendation {
    id: string;
    activity: string;
    category: 'outdoor' | 'indoor' | 'exercise' | 'social' | 'relaxation';
    suitability: 'perfect' | 'good' | 'okay' | 'poor';
    reason: string;
    timeWindow?: string;
    tips?: string[];
}

export interface WeatherData {
    location: WeatherLocation;
    current: CurrentWeather;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
    alerts: WeatherAlert[];
}

export interface WeatherUpdate {
    type: 'weather_update';
    locations: WeatherLocation[];
    weatherData: Record<string, WeatherData>;
    selectedLocationId: string;
    lastUpdated: string;
    activityRecommendations?: ActivityRecommendation[];
}

// Helper to get base URL
const getBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || '';
};

export class AuroraWeatherService  {
    private baseUrl: string;
    private contextId: string;
    private onDataUpdate?: (data: WeatherUpdate) => void;

    constructor(contextId: string = 'default', onDataUpdate?: (data: WeatherUpdate) => void) {
        this.baseUrl = getBaseUrl();
        this.contextId = contextId;
        this.onDataUpdate = onDataUpdate;
    }

    /**
     * Set the model - No-op for A2A agents
     */
    setModel(_modelName: string): void {
        // No-op for A2A agents - model is determined by the agent
    }

    /**
     * Configure file search - No-op for weather service
     */
    setFileSearchConfig(_config: any): void {
        // Not implemented for weather service
    }

    /**
     * Chat method delegates to sendMessage
     */
    async chat(prompt: string, _systemPrompt?: string, _options?: ChatOptions): Promise<string> {
        return this.sendMessage(prompt);
    }

    async sendMessage(prompt: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/agents/aurora-weather/a2a`, {
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

            // Extract weather data update
            const dataPart = artifacts
                .flatMap((a: any) => a.parts)
                .find((p: any) => p.type === 'data' && p.data?.type === 'weather_update');

            if (dataPart && this.onDataUpdate) {
                this.onDataUpdate(dataPart.data as WeatherUpdate);
            }

            return textPart ? textPart.text : "Weather data updated.";

        } catch (error) {
            console.error('Aurora Weather Error:', error);
            return "I'm having trouble connecting to the weather service. Please try again.";
        }
    }
}
