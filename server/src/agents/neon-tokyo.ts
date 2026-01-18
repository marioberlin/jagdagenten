/**
 * Neon Tokyo Agent
 * 
 * Hyper-personalized travel concierge with atmosphere-reactive UI.
 * Implements the "Liquid Glass" philosophy: glass that reacts to data.
 * 
 * Skills:
 * - plan-trip: Interactive trip planning with atmosphere preview
 * - get-atmosphere: Fetch weather and compute UI mood
 * - generate-itinerary: AI-powered day-by-day planning
 * - create-tickets: Generate holographic boarding passes
 * - smart-packing: Weather-based packing recommendations
 */
import type { AgentCard, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'night' | 'foggy';

interface AtmosphereConfig {
    condition: WeatherCondition;
    temperature: number;
    humidity: number;
    mood: string;
    gradientFrom: string;
    gradientTo: string;
    accentColor: string;
    glassBlur: 'thin' | 'regular' | 'thick';
}

interface TripRequest {
    destination: string;
    startDate?: string;
    endDate?: string;
    travelers?: number;
    vibe?: string; // "romantic weekend", "adventure trip", etc.
}

interface ItineraryDay {
    date: string;
    theme: string;
    activities: {
        time: string;
        title: string;
        description: string;
        location: string;
        duration: string;
        emoji: string;
    }[];
}

interface PackingItem {
    id: string;
    name: string;
    checked: boolean;
    weatherReason?: string;
    emoji?: string;
}

// ============================================================================
// Weather → Atmosphere Mapping
// ============================================================================

const ATMOSPHERE_PRESETS: Record<string, Partial<AtmosphereConfig>> = {
    'tokyo-night': {
        condition: 'night',
        mood: 'Neon Dreams',
        gradientFrom: 'from-pink-900/20',
        gradientTo: 'to-cyan-900/20',
        accentColor: 'pink-500',
        glassBlur: 'regular'
    },
    'london-rainy': {
        condition: 'rainy',
        mood: 'Moody Elegance',
        gradientFrom: 'from-purple-900/20',
        gradientTo: 'to-slate-900/20',
        accentColor: 'purple-500',
        glassBlur: 'thick'
    },
    'paris-sunny': {
        condition: 'sunny',
        mood: 'Golden Hour',
        gradientFrom: 'from-amber-900/20',
        gradientTo: 'to-rose-900/20',
        accentColor: 'amber-500',
        glassBlur: 'thin'
    },
    'alps-snowy': {
        condition: 'snowy',
        mood: 'Winter Wonderland',
        gradientFrom: 'from-slate-800/20',
        gradientTo: 'to-blue-900/20',
        accentColor: 'blue-300',
        glassBlur: 'thick'
    },
    'default': {
        condition: 'cloudy',
        mood: 'Wanderlust',
        gradientFrom: 'from-gray-900/20',
        gradientTo: 'to-indigo-900/20',
        accentColor: 'indigo-500',
        glassBlur: 'regular'
    }
};

// ============================================================================
// OpenWeatherMap API Integration
// ============================================================================

interface OpenWeatherResponse {
    main: { temp: number; humidity: number };
    weather: { id: number; main: string; description: string }[];
    sys: { sunrise: number; sunset: number };
    dt: number;
}

// Map OpenWeatherMap condition codes to our weather conditions
function mapWeatherCodeToCondition(weatherId: number, isNight: boolean): WeatherCondition {
    // Night check first
    if (isNight) return 'night';

    // Thunderstorm (2xx)
    if (weatherId >= 200 && weatherId < 300) return 'rainy';
    // Drizzle (3xx)
    if (weatherId >= 300 && weatherId < 400) return 'rainy';
    // Rain (5xx)
    if (weatherId >= 500 && weatherId < 600) return 'rainy';
    // Snow (6xx)
    if (weatherId >= 600 && weatherId < 700) return 'snowy';
    // Atmosphere: fog, mist, etc (7xx)
    if (weatherId >= 700 && weatherId < 800) return 'foggy';
    // Clear (800)
    if (weatherId === 800) return 'sunny';
    // Clouds (80x)
    if (weatherId > 800) return 'cloudy';

    return 'cloudy';
}

// Mood labels based on condition + destination
function getMoodLabel(condition: WeatherCondition, destination: string): string {
    const moods: Record<WeatherCondition, string[]> = {
        sunny: ['Golden Hour', 'Sun-Kissed', 'Radiant Vibes'],
        cloudy: ['Wanderlust', 'Contemplative', 'Dreaming'],
        rainy: ['Moody Elegance', 'Rainy Romance', 'Cozy Vibes'],
        snowy: ['Winter Wonderland', 'Frosty Magic', 'Snow Dreams'],
        night: ['Neon Dreams', 'City Lights', 'After Dark'],
        foggy: ['Mysterious', 'Ethereal', 'Misty Morning']
    };

    const options = moods[condition];
    return options[Math.floor(Math.random() * options.length)];
}

// Gradient configs per condition
const GRADIENT_CONFIG: Record<WeatherCondition, { from: string; to: string; accent: string }> = {
    sunny: { from: 'from-amber-900/20', to: 'to-rose-900/20', accent: 'amber-500' },
    cloudy: { from: 'from-gray-900/20', to: 'to-indigo-900/20', accent: 'indigo-500' },
    rainy: { from: 'from-purple-900/20', to: 'to-slate-900/20', accent: 'purple-500' },
    snowy: { from: 'from-slate-800/20', to: 'to-blue-900/20', accent: 'blue-300' },
    night: { from: 'from-pink-900/20', to: 'to-cyan-900/20', accent: 'pink-500' },
    foggy: { from: 'from-gray-800/30', to: 'to-slate-900/20', accent: 'gray-400' }
};

/**
 * Fetch real weather data from OpenWeatherMap API
 * Falls back to preset-based atmosphere if API fails or no key
 */
async function fetchWeatherAtmosphere(destination: string): Promise<AtmosphereConfig> {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // Fallback to presets if no API key
    if (!apiKey) {
        console.log('[Neon Tokyo] No OPENWEATHER_API_KEY, using presets for:', destination);
        return getPresetAtmosphere(destination);
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn('[Neon Tokyo] Weather API error:', response.status);
            return getPresetAtmosphere(destination);
        }

        const data: OpenWeatherResponse = await response.json();

        // Determine if it's night
        const now = data.dt;
        const isNight = now < data.sys.sunrise || now > data.sys.sunset;

        // Map to our condition
        const weatherId = data.weather[0]?.id || 800;
        const condition = mapWeatherCodeToCondition(weatherId, isNight);

        // Build atmosphere config
        const gradient = GRADIENT_CONFIG[condition];

        return {
            condition,
            temperature: Math.round(data.main.temp),
            humidity: data.main.humidity,
            mood: getMoodLabel(condition, destination),
            gradientFrom: gradient.from,
            gradientTo: gradient.to,
            accentColor: gradient.accent,
            glassBlur: condition === 'rainy' || condition === 'foggy' ? 'thick' : 'regular'
        };
    } catch (error) {
        console.error('[Neon Tokyo] Weather API fetch failed:', error);
        return getPresetAtmosphere(destination);
    }
}

/**
 * Fallback: Get atmosphere from hardcoded presets
 */
function getPresetAtmosphere(destination: string): AtmosphereConfig {
    const lowerDest = destination.toLowerCase();

    // Match known destinations
    let preset = ATMOSPHERE_PRESETS['default'];
    if (lowerDest.includes('tokyo') || lowerDest.includes('japan') || lowerDest.includes('osaka')) {
        preset = ATMOSPHERE_PRESETS['tokyo-night'];
    } else if (lowerDest.includes('london') || lowerDest.includes('uk') || lowerDest.includes('england')) {
        preset = ATMOSPHERE_PRESETS['london-rainy'];
    } else if (lowerDest.includes('paris') || lowerDest.includes('france')) {
        preset = ATMOSPHERE_PRESETS['paris-sunny'];
    } else if (lowerDest.includes('alps') || lowerDest.includes('switzerland') || lowerDest.includes('austria')) {
        preset = ATMOSPHERE_PRESETS['alps-snowy'];
    }

    return {
        condition: preset.condition || 'cloudy',
        temperature: Math.floor(Math.random() * 15) + 10,
        humidity: Math.floor(Math.random() * 40) + 40,
        mood: preset.mood || 'Wanderlust',
        gradientFrom: preset.gradientFrom || 'from-gray-900/20',
        gradientTo: preset.gradientTo || 'to-indigo-900/20',
        accentColor: preset.accentColor || 'indigo-500',
        glassBlur: preset.glassBlur || 'regular'
    };
}

// ============================================================================
// Weather-aware Packing Recommendations
// ============================================================================

const WEATHER_PACKING: Record<WeatherCondition, PackingItem[]> = {
    rainy: [
        { id: '1', name: 'Umbrella', checked: false, weatherReason: 'Rain expected', emoji: '☂️' },
        { id: '2', name: 'Waterproof Jacket', checked: false, weatherReason: 'Stay dry', emoji: '🧥' },
        { id: '3', name: 'Rain Boots', checked: false, weatherReason: 'Wet streets', emoji: '👢' }
    ],
    sunny: [
        { id: '4', name: 'Sunscreen SPF 50', checked: false, weatherReason: 'UV protection', emoji: '🧴' },
        { id: '5', name: 'Sunglasses', checked: false, weatherReason: 'Bright conditions', emoji: '🕶️' },
        { id: '6', name: 'Light Hat', checked: false, weatherReason: 'Sun protection', emoji: '👒' }
    ],
    snowy: [
        { id: '7', name: 'Heavy Coat', checked: false, weatherReason: 'Sub-zero temps', emoji: '🧥' },
        { id: '8', name: 'Thermal Underwear', checked: false, weatherReason: 'Stay warm', emoji: '🩲' },
        { id: '9', name: 'Hand Warmers', checked: false, weatherReason: 'Frostbite prevention', emoji: '🧤' }
    ],
    cloudy: [
        { id: '10', name: 'Light Jacket', checked: false, weatherReason: 'Variable weather', emoji: '🧥' }
    ],
    night: [
        { id: '11', name: 'Light Layers', checked: false, weatherReason: 'Evening chill', emoji: '🧶' },
        { id: '12', name: 'Comfortable Walking Shoes', checked: false, weatherReason: 'Night exploration', emoji: '👟' }
    ],
    foggy: [
        { id: '13', name: 'Reflective Gear', checked: false, weatherReason: 'Low visibility', emoji: '🦺' }
    ]
};

function getPackingListForWeather(condition: WeatherCondition): PackingItem[] {
    const items = WEATHER_PACKING[condition] || WEATHER_PACKING['cloudy'];
    // Always add essentials
    const essentials: PackingItem[] = [
        { id: 'e1', name: 'Passport', checked: false, emoji: '🛂' },
        { id: 'e2', name: 'Phone Charger', checked: false, emoji: '🔌' },
        { id: 'e3', name: 'Travel Adapter', checked: false, emoji: '🔌' },
        { id: 'e4', name: 'Toiletries', checked: false, emoji: '🧼' }
    ];
    return [...essentials, ...items];
}

// ============================================================================
// Sample Itinerary Generation
// ============================================================================

function generateSampleItinerary(destination: string, days: number = 3): ItineraryDay[] {
    const itinerary: ItineraryDay[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        itinerary.push({
            date: date.toISOString().split('T')[0],
            theme: i === 0 ? 'Arrival & Discovery' : i === days - 1 ? 'Final Exploration' : 'Deep Dive',
            activities: [
                {
                    time: '09:00',
                    title: i === 0 ? 'Airport Arrival' : 'Morning Walk',
                    description: i === 0 ? `Land at ${destination} international airport` : 'Explore the local neighborhood',
                    location: destination,
                    duration: '2h',
                    emoji: i === 0 ? '✈️' : '🚶'
                },
                {
                    time: '12:00',
                    title: 'Local Cuisine',
                    description: `Experience authentic ${destination} food`,
                    location: `${destination} Food District`,
                    duration: '1.5h',
                    emoji: '🍜'
                },
                {
                    time: '15:00',
                    title: 'Cultural Experience',
                    description: 'Visit iconic landmarks and museums',
                    location: `${destination} Cultural Center`,
                    duration: '3h',
                    emoji: '🏛️'
                },
                {
                    time: '19:00',
                    title: 'Evening Atmosphere',
                    description: 'Enjoy the city at dusk',
                    location: `${destination} Viewpoint`,
                    duration: '2h',
                    emoji: '🌆'
                }
            ]
        });
    }

    return itinerary;
}

// ============================================================================
// Agent Card & Handler
// ============================================================================

export function getNeonTokyoAgentCard(baseUrl: string): AgentCard {
    return {
        name: 'Neon Tokyo',
        description: 'Hyper-personalized travel concierge with atmosphere-reactive UI. Experience trip planning that adapts to your destination\'s mood, weather, and vibe.',
        url: `${baseUrl}/agents/neon-tokyo`,
        provider: { name: 'LiquidCrypto', url: 'https://liquidcrypto.app' },
        version: '1.0.0',
        protocolVersion: '1.0',
        capabilities: {
            streaming: false,
            pushNotifications: false
        },
        authentication: null,
        skills: [
            {
                id: 'plan-trip',
                name: 'Plan Trip',
                description: 'Start planning a trip with atmosphere preview',
                inputModes: ['text'],
                outputModes: ['text', 'data'],
                tags: ['travel', 'planning', 'atmosphere']
            },
            {
                id: 'get-atmosphere',
                name: 'Get Atmosphere',
                description: 'Get weather-driven UI mood for a destination',
                inputModes: ['text'],
                outputModes: ['data'],
                tags: ['weather', 'ui', 'mood']
            },
            {
                id: 'generate-itinerary',
                name: 'Generate Itinerary',
                description: 'Create a day-by-day travel itinerary',
                inputModes: ['text'],
                outputModes: ['text', 'data'],
                tags: ['itinerary', 'planning']
            },
            {
                id: 'smart-packing',
                name: 'Smart Packing',
                description: 'Get weather-based packing recommendations',
                inputModes: ['text'],
                outputModes: ['data'],
                tags: ['packing', 'weather']
            }
        ]
    };
}

// Current trip state (in production, this would be per-session)
let currentTrip: TripRequest = {
    destination: 'Tokyo',
    startDate: new Date().toISOString().split('T')[0],
    travelers: 2,
    vibe: 'cultural adventure'
};

export async function handleNeonTokyoRequest(params: SendMessageParams): Promise<any> {
    const message = params.message?.parts?.[0]?.text || '';
    const lowerMessage = message.toLowerCase();

    // Parse destination from message
    const destinationMatch = message.match(/(?:to|visit|explore|trip to)\s+([A-Za-z\s]+?)(?:\.|,|!|\?|$)/i);
    if (destinationMatch) {
        currentTrip.destination = destinationMatch[1].trim();
    }

    // Get atmosphere for current destination (uses real API with fallback)
    const atmosphere = await fetchWeatherAtmosphere(currentTrip.destination);

    // Get weather-aware packing list
    const packingList = getPackingListForWeather(atmosphere.condition);

    // Generate itinerary
    const itinerary = generateSampleItinerary(currentTrip.destination, 3);

    // Generate map markers from itinerary
    const mapMarkers = [
        { id: '1', lat: 35.6762, lng: 139.6503, label: currentTrip.destination, color: `var(--${atmosphere.accentColor})` }
    ];

    // Build response text
    let responseText = '';
    if (lowerMessage.includes('plan') || lowerMessage.includes('trip')) {
        responseText = `✨ **Your ${atmosphere.mood} awaits in ${currentTrip.destination}!**\n\nI've sensed the atmosphere there is ${atmosphere.condition} with temps around ${atmosphere.temperature}°C. The glass panels will now reflect this mood.\n\n🗓️ I've drafted a 3-day itinerary and prepared a smart packing list based on the weather.\n\n*Say "show tickets" for your holographic boarding passes, or ask me to adjust anything!*`;
    } else if (lowerMessage.includes('weather') || lowerMessage.includes('atmosphere')) {
        responseText = `🌤️ **${currentTrip.destination} Atmosphere**\n\nCondition: ${atmosphere.condition}\nTemperature: ${atmosphere.temperature}°C\nHumidity: ${atmosphere.humidity}%\nMood: ${atmosphere.mood}\n\nThe UI has adapted to match this vibe.`;
    } else if (lowerMessage.includes('pack')) {
        responseText = `🎒 **Smart Packing for ${currentTrip.destination}**\n\nBased on the ${atmosphere.condition} weather, I recommend:\n\n${packingList.map(item => `${item.emoji} ${item.name}${item.weatherReason ? ` _(${item.weatherReason})_` : ''}`).join('\n')}`;
    } else {
        responseText = `🌏 **Neon Tokyo Travel Concierge**\n\nCurrently planning: **${currentTrip.destination}**\nAtmosphere: ${atmosphere.mood}\n\nTry:\n- "Plan a trip to Paris"\n- "What's the weather like?"\n- "What should I pack?"`;
    }

    return {
        contextId: params.contextId || 'neon-tokyo-context',
        artifacts: [
            {
                name: 'response',
                mimeType: 'text/markdown',
                parts: [
                    { text: responseText },
                    {
                        type: 'data',
                        data: {
                            destination: currentTrip.destination,
                            tripName: `${currentTrip.destination} Adventure`,
                            atmosphere,
                            itinerary,
                            packingList,
                            mapMarkers
                        }
                    }
                ]
            }
        ]
    };
}
