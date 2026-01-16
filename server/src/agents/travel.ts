import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Travel Planner - AI Trip Planning with Amadeus + Google Places + Gemini
// ============================================================================

interface TripRequest {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    budget: 'budget' | 'moderate' | 'luxury';
    interests: string[];
}

interface Flight {
    id: string;
    airline: string;
    flightNumber: string;
    departure: { airport: string; time: string; terminal?: string };
    arrival: { airport: string; time: string; terminal?: string };
    duration: string;
    price: number;
    currency: string;
    class: 'economy' | 'business' | 'first';
    stops: number;
}

interface Hotel {
    id: string;
    name: string;
    rating: number;
    stars: number;
    pricePerNight: number;
    currency: string;
    location: string;
    amenities: string[];
    image?: string;
}

interface Activity {
    time: string;
    title: string;
    description: string;
    location: string;
    duration: string;
    cost?: number;
    emoji: string;
}

interface ItineraryDay {
    date: string;
    theme: string;
    activities: Activity[];
}

interface Itinerary {
    id: string;
    destination: string;
    days: ItineraryDay[];
    estimatedCost: number;
    tips: string[];
}

// ============================================================================
// Amadeus API Integration (Mock for demo - real API requires OAuth)
// ============================================================================

// Note: Real Amadeus API requires:
// 1. OAuth token: POST https://api.amadeus.com/v1/security/oauth2/token
// 2. Flight search: GET https://api.amadeus.com/v2/shopping/flight-offers
// 3. Hotel search: GET https://api.amadeus.com/v2/shopping/hotel-offers

async function searchFlights(origin: string, destination: string, date: string, travelers: number): Promise<Flight[]> {
    // In production, this would call Amadeus API
    // For demo, return sample data
    const airlines = ['United', 'Delta', 'American', 'JetBlue', 'Southwest'];
    const basePrice = Math.floor(Math.random() * 300) + 400;

    return [
        {
            id: randomUUID(),
            airline: airlines[0],
            flightNumber: `UA${Math.floor(Math.random() * 900) + 100}`,
            departure: { airport: origin, time: '08:30', terminal: 'B' },
            arrival: { airport: destination, time: '14:45', terminal: '1' },
            duration: '6h 15m',
            price: basePrice,
            currency: 'USD',
            class: 'economy',
            stops: 0,
        },
        {
            id: randomUUID(),
            airline: airlines[1],
            flightNumber: `DL${Math.floor(Math.random() * 900) + 100}`,
            departure: { airport: origin, time: '10:15', terminal: 'A' },
            arrival: { airport: destination, time: '16:30', terminal: '2' },
            duration: '6h 15m',
            price: basePrice + 50,
            currency: 'USD',
            class: 'economy',
            stops: 0,
        },
        {
            id: randomUUID(),
            airline: airlines[2],
            flightNumber: `AA${Math.floor(Math.random() * 900) + 100}`,
            departure: { airport: origin, time: '14:00', terminal: 'C' },
            arrival: { airport: destination, time: '22:30', terminal: '1' },
            duration: '8h 30m',
            price: basePrice - 80,
            currency: 'USD',
            class: 'economy',
            stops: 1,
        },
    ];
}

async function searchHotels(city: string, checkIn: string, checkOut: string): Promise<Hotel[]> {
    // In production, this would call Amadeus Hotel API
    const hotelNames = [
        'Grand Hyatt', 'Marriott City Center', 'Hilton Garden Inn',
        'The Ritz-Carlton', 'Holiday Inn Express', 'Sheraton Grand'
    ];

    return hotelNames.slice(0, 4).map((name, idx) => ({
        id: randomUUID(),
        name: `${name} ${city}`,
        rating: 4.2 + (Math.random() * 0.7),
        stars: 3 + Math.floor(idx / 2),
        pricePerNight: 120 + (idx * 40) + Math.floor(Math.random() * 50),
        currency: 'USD',
        location: `Downtown ${city}`,
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'].slice(0, 2 + idx),
    }));
}

// ============================================================================
// Gemini AI Integration
// ============================================================================

async function generateItineraryWithGemini(request: TripRequest): Promise<Itinerary> {
    const apiKey = process.env.GEMINI_API_KEY;

    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Default itinerary structure
    const defaultDays: ItineraryDay[] = [];
    for (let i = 0; i < Math.min(dayCount, 7); i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        defaultDays.push({
            date: date.toISOString().split('T')[0],
            theme: i === 0 ? 'Arrival & Exploration' : i === dayCount - 1 ? 'Departure' : 'Discovery',
            activities: [
                {
                    time: '09:00',
                    title: 'Morning Activity',
                    description: `Explore ${request.destination}`,
                    location: request.destination,
                    duration: '3h',
                    emoji: '🌅',
                },
                {
                    time: '12:00',
                    title: 'Lunch',
                    description: 'Local cuisine experience',
                    location: 'Local Restaurant',
                    duration: '1h 30m',
                    cost: 30,
                    emoji: '🍜',
                },
                {
                    time: '14:00',
                    title: 'Afternoon Activity',
                    description: 'Sightseeing and cultural experiences',
                    location: request.destination,
                    duration: '4h',
                    emoji: '🏛️',
                },
                {
                    time: '19:00',
                    title: 'Dinner',
                    description: 'Evening dining',
                    location: 'Restaurant',
                    duration: '2h',
                    cost: 50,
                    emoji: '🍽️',
                },
            ],
        });
    }

    if (!apiKey) {
        return {
            id: randomUUID(),
            destination: request.destination,
            days: defaultDays,
            estimatedCost: dayCount * 200 * request.travelers,
            tips: [
                'Configure GEMINI_API_KEY for personalized itineraries',
                `Check visa requirements for ${request.destination}`,
                'Book popular attractions in advance',
            ],
        };
    }

    try {
        const prompt = `Create a ${dayCount}-day travel itinerary for ${request.destination}.
Travelers: ${request.travelers}
Budget: ${request.budget}
Interests: ${request.interests.join(', ') || 'general sightseeing'}
Dates: ${request.startDate} to ${request.endDate}

For each day, provide 4-5 activities with:
- Time (24h format)
- Title (short)
- Description (1 sentence)
- Location
- Duration
- Estimated cost (USD, optional)
- Appropriate emoji

Also provide 3-4 local tips.

Respond in JSON:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "activities": [
        {"time": "09:00", "title": "...", "description": "...", "location": "...", "duration": "2h", "cost": 20, "emoji": "🏛️"}
      ]
    }
  ],
  "tips": ["tip1", "tip2"],
  "estimatedCost": 1500
}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                id: randomUUID(),
                destination: request.destination,
                days: parsed.days || defaultDays,
                estimatedCost: parsed.estimatedCost || dayCount * 200 * request.travelers,
                tips: parsed.tips || [],
            };
        }

        return {
            id: randomUUID(),
            destination: request.destination,
            days: defaultDays,
            estimatedCost: dayCount * 200 * request.travelers,
            tips: ['Book accommodations in advance', 'Try local cuisine'],
        };
    } catch (error) {
        console.error('[Travel Planner] Itinerary generation error:', error);
        return {
            id: randomUUID(),
            destination: request.destination,
            days: defaultDays,
            estimatedCost: dayCount * 200 * request.travelers,
            tips: ['Check weather forecast', 'Keep copies of important documents'],
        };
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generatePlanningForm(): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: 'planning-form',
            rootComponentId: 'root',
            styling: { primaryColor: '#0EA5E9', fontFamily: 'Inter, system-ui, sans-serif' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'planning-form',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', 'destination-section', 'dates-section', 'travelers-section', 'interests-section', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '✈️ Plan Your Trip' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: 'AI-powered travel planning' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'destination-section',
                    component: {
                        Column: {
                            children: ['dest-label', 'dest-input'],
                        },
                    },
                },
                {
                    id: 'dest-label',
                    component: {
                        Text: {
                            text: { literalString: 'Where to?' },
                            semantic: 'h4',
                        },
                    },
                },
                {
                    id: 'dest-input',
                    component: {
                        TextField: {
                            label: { literalString: '' },
                            placeholder: { literalString: 'Tokyo, Japan' },
                            inputType: 'text',
                        },
                    },
                },
                {
                    id: 'dates-section',
                    component: {
                        Row: {
                            children: ['start-col', 'end-col'],
                        },
                    },
                },
                {
                    id: 'start-col',
                    component: {
                        Column: {
                            children: ['start-label', 'start-input'],
                        },
                    },
                },
                {
                    id: 'start-label',
                    component: {
                        Text: {
                            text: { literalString: 'Start Date' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'start-input',
                    component: {
                        TextField: {
                            label: { literalString: '' },
                            placeholder: { literalString: '2025-03-15' },
                            inputType: 'date',
                        },
                    },
                },
                {
                    id: 'end-col',
                    component: {
                        Column: {
                            children: ['end-label', 'end-input'],
                        },
                    },
                },
                {
                    id: 'end-label',
                    component: {
                        Text: {
                            text: { literalString: 'End Date' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'end-input',
                    component: {
                        TextField: {
                            label: { literalString: '' },
                            placeholder: { literalString: '2025-03-22' },
                            inputType: 'date',
                        },
                    },
                },
                {
                    id: 'travelers-section',
                    component: {
                        Row: {
                            children: ['travelers-label', 'travelers-btns'],
                        },
                    },
                },
                {
                    id: 'travelers-label',
                    component: {
                        Text: {
                            text: { literalString: 'Travelers:' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'travelers-btns',
                    component: {
                        Row: {
                            children: ['trav-1', 'trav-2', 'trav-3', 'trav-4'],
                        },
                    },
                },
                {
                    id: 'trav-1',
                    component: {
                        Button: {
                            label: { literalString: '1' },
                            action: { custom: { actionId: 'set_travelers', data: { count: 1 } } },
                        },
                    },
                },
                {
                    id: 'trav-2',
                    component: {
                        Button: {
                            label: { literalString: '2' },
                            action: { custom: { actionId: 'set_travelers', data: { count: 2 } } },
                        },
                    },
                },
                {
                    id: 'trav-3',
                    component: {
                        Button: {
                            label: { literalString: '3' },
                            action: { custom: { actionId: 'set_travelers', data: { count: 3 } } },
                        },
                    },
                },
                {
                    id: 'trav-4',
                    component: {
                        Button: {
                            label: { literalString: '4+' },
                            action: { custom: { actionId: 'set_travelers', data: { count: 4 } } },
                        },
                    },
                },
                {
                    id: 'interests-section',
                    component: {
                        Column: {
                            children: ['int-label', 'int-btns'],
                        },
                    },
                },
                {
                    id: 'int-label',
                    component: {
                        Text: {
                            text: { literalString: 'Interests:' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'int-btns',
                    component: {
                        Row: {
                            children: ['int-food', 'int-culture', 'int-nature', 'int-shopping'],
                        },
                    },
                },
                {
                    id: 'int-food',
                    component: {
                        Button: {
                            label: { literalString: '🍜 Food' },
                            action: { custom: { actionId: 'toggle_interest', data: { interest: 'food' } } },
                        },
                    },
                },
                {
                    id: 'int-culture',
                    component: {
                        Button: {
                            label: { literalString: '🏛️ Culture' },
                            action: { custom: { actionId: 'toggle_interest', data: { interest: 'culture' } } },
                        },
                    },
                },
                {
                    id: 'int-nature',
                    component: {
                        Button: {
                            label: { literalString: '🌿 Nature' },
                            action: { custom: { actionId: 'toggle_interest', data: { interest: 'nature' } } },
                        },
                    },
                },
                {
                    id: 'int-shopping',
                    component: {
                        Button: {
                            label: { literalString: '🛍️ Shopping' },
                            action: { custom: { actionId: 'toggle_interest', data: { interest: 'shopping' } } },
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['flights-btn', 'itinerary-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'flights-btn',
                    component: {
                        Button: {
                            label: { literalString: '🔍 Find Flights' },
                            action: { input: { text: 'find flights to Tokyo' } },
                        },
                    },
                },
                {
                    id: 'itinerary-btn',
                    component: {
                        Button: {
                            label: { literalString: '📅 Generate Itinerary' },
                            action: { input: { text: 'create itinerary for Tokyo' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateFlightResults(flights: Flight[], destination: string): A2UIMessage[] {
    const flightComponents: Array<{ id: string; component: Record<string, unknown> }> = [];
    const flightIds: string[] = [];

    flights.forEach((flight, idx) => {
        const flightId = `flight-${idx}`;
        flightIds.push(flightId);

        flightComponents.push(
            {
                id: flightId,
                component: {
                    Card: {
                        children: [`fl-${idx}-header`, `fl-${idx}-route`, `fl-${idx}-details`, `fl-${idx}-action`],
                    },
                },
            },
            {
                id: `fl-${idx}-header`,
                component: {
                    Row: {
                        children: [`fl-${idx}-airline`, `fl-${idx}-price`],
                    },
                },
            },
            {
                id: `fl-${idx}-airline`,
                component: {
                    Text: {
                        text: { literalString: `✈️ ${flight.airline} ${flight.flightNumber}` },
                        semantic: 'h4',
                    },
                },
            },
            {
                id: `fl-${idx}-price`,
                component: {
                    Text: {
                        text: { literalString: `$${flight.price}/person` },
                        semantic: 'h4',
                    },
                },
            },
            {
                id: `fl-${idx}-route`,
                component: {
                    Text: {
                        text: { literalString: `${flight.departure.airport} ${flight.departure.time} → ${flight.arrival.airport} ${flight.arrival.time}` },
                    },
                },
            },
            {
                id: `fl-${idx}-details`,
                component: {
                    Text: {
                        text: { literalString: `${flight.duration} • ${flight.stops === 0 ? 'Direct' : `${flight.stops} stop`} • ${flight.class}` },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `fl-${idx}-action`,
                component: {
                    Button: {
                        label: { literalString: 'Select' },
                        action: { custom: { actionId: 'select_flight', data: { flightId: flight.id } } },
                    },
                },
            }
        );
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'flight-results',
            rootComponentId: 'root',
            styling: { primaryColor: '#0EA5E9' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'flight-results',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', ...flightIds, 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: `Flights to ${destination}` },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: `${flights.length} options found` },
                            variant: 'secondary',
                        },
                    },
                },
                ...flightComponents,
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['hotels-btn', 'itinerary-btn', 'back-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'hotels-btn',
                    component: {
                        Button: {
                            label: { literalString: '🏨 Find Hotels' },
                            action: { input: { text: `find hotels in ${destination}` } },
                        },
                    },
                },
                {
                    id: 'itinerary-btn',
                    component: {
                        Button: {
                            label: { literalString: '📅 Itinerary' },
                            action: { input: { text: `create itinerary for ${destination}` } },
                        },
                    },
                },
                {
                    id: 'back-btn',
                    component: {
                        Button: {
                            label: { literalString: 'New Search' },
                            action: { input: { text: 'plan trip' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateHotelResults(hotels: Hotel[], city: string): A2UIMessage[] {
    const hotelComponents: Array<{ id: string; component: Record<string, unknown> }> = [];
    const hotelIds: string[] = [];

    hotels.forEach((hotel, idx) => {
        const hotelId = `hotel-${idx}`;
        hotelIds.push(hotelId);

        hotelComponents.push(
            {
                id: hotelId,
                component: {
                    Card: {
                        children: [`ht-${idx}-name`, `ht-${idx}-rating`, `ht-${idx}-price`, `ht-${idx}-amenities`, `ht-${idx}-action`],
                    },
                },
            },
            {
                id: `ht-${idx}-name`,
                component: {
                    Text: {
                        text: { literalString: `🏨 ${hotel.name}` },
                        semantic: 'h4',
                    },
                },
            },
            {
                id: `ht-${idx}-rating`,
                component: {
                    Text: {
                        text: { literalString: `⭐ ${hotel.rating.toFixed(1)} • ${'★'.repeat(hotel.stars)}${'☆'.repeat(5 - hotel.stars)}` },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `ht-${idx}-price`,
                component: {
                    Text: {
                        text: { literalString: `$${hotel.pricePerNight}/night • ${hotel.location}` },
                    },
                },
            },
            {
                id: `ht-${idx}-amenities`,
                component: {
                    Text: {
                        text: { literalString: hotel.amenities.join(' • ') },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `ht-${idx}-action`,
                component: {
                    Button: {
                        label: { literalString: 'Book' },
                        action: { custom: { actionId: 'book_hotel', data: { hotelId: hotel.id } } },
                    },
                },
            }
        );
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'hotel-results',
            rootComponentId: 'root',
            styling: { primaryColor: '#10B981' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'hotel-results',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', ...hotelIds, 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: `Hotels in ${city}` },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: `${hotels.length} properties available` },
                            variant: 'secondary',
                        },
                    },
                },
                ...hotelComponents,
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['flights-btn', 'itinerary-btn', 'back-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'flights-btn',
                    component: {
                        Button: {
                            label: { literalString: '✈️ Flights' },
                            action: { input: { text: `find flights to ${city}` } },
                        },
                    },
                },
                {
                    id: 'itinerary-btn',
                    component: {
                        Button: {
                            label: { literalString: '📅 Itinerary' },
                            action: { input: { text: `create itinerary for ${city}` } },
                        },
                    },
                },
                {
                    id: 'back-btn',
                    component: {
                        Button: {
                            label: { literalString: 'New Search' },
                            action: { input: { text: 'plan trip' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateItineraryView(itinerary: Itinerary): A2UIMessage[] {
    const dayComponents: Array<{ id: string; component: Record<string, unknown> }> = [];
    const dayIds: string[] = [];

    itinerary.days.slice(0, 3).forEach((day, dayIdx) => {
        const dayId = `day-${dayIdx}`;
        dayIds.push(dayId);

        const activityIds: string[] = [];

        day.activities.forEach((activity, actIdx) => {
            const actId = `day-${dayIdx}-act-${actIdx}`;
            activityIds.push(actId);

            dayComponents.push({
                id: actId,
                component: {
                    Text: {
                        text: { literalString: `${activity.time} ${activity.emoji} ${activity.title}` },
                    },
                },
            });
        });

        dayComponents.push(
            {
                id: dayId,
                component: {
                    Card: {
                        children: [`day-${dayIdx}-header`, ...activityIds],
                    },
                },
            },
            {
                id: `day-${dayIdx}-header`,
                component: {
                    Text: {
                        text: { literalString: `Day ${dayIdx + 1} - ${day.theme}` },
                        semantic: 'h4',
                    },
                },
            }
        );
    });

    // Reorder to have day card before activities
    const orderedComponents = dayIds.map(dayId => {
        const card = dayComponents.find(c => c.id === dayId)!;
        const header = dayComponents.find(c => c.id === `${dayId}-header`)!;
        const activities = dayComponents.filter(c => c.id.startsWith(`${dayId}-act`));
        return [card, header, ...activities];
    }).flat();

    const tipComponents: Array<{ id: string; component: Record<string, unknown> }> = [];
    const tipIds: string[] = [];

    itinerary.tips.slice(0, 3).forEach((tip, idx) => {
        const tipId = `tip-${idx}`;
        tipIds.push(tipId);

        tipComponents.push({
            id: tipId,
            component: {
                Text: {
                    text: { literalString: `• ${tip}` },
                    variant: 'secondary',
                },
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'itinerary-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#F59E0B' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'itinerary-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', ...dayIds, 'tips-section', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: `Your ${itinerary.destination} Itinerary 🗺️` },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: `${itinerary.days.length} days • Est. $${itinerary.estimatedCost.toLocaleString()} • by Gemini AI` },
                            variant: 'secondary',
                        },
                    },
                },
                ...orderedComponents,
                {
                    id: 'tips-section',
                    component: {
                        Card: {
                            children: ['tips-header', ...tipIds],
                        },
                    },
                },
                {
                    id: 'tips-header',
                    component: {
                        Text: {
                            text: { literalString: '💡 Local Tips' },
                            semantic: 'h4',
                        },
                    },
                },
                ...tipComponents,
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['flights-btn', 'hotels-btn', 'new-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'flights-btn',
                    component: {
                        Button: {
                            label: { literalString: '✈️ Flights' },
                            action: { input: { text: `find flights to ${itinerary.destination}` } },
                        },
                    },
                },
                {
                    id: 'hotels-btn',
                    component: {
                        Button: {
                            label: { literalString: '🏨 Hotels' },
                            action: { input: { text: `find hotels in ${itinerary.destination}` } },
                        },
                    },
                },
                {
                    id: 'new-btn',
                    component: {
                        Button: {
                            label: { literalString: 'New Trip' },
                            action: { input: { text: 'plan trip' } },
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

export const getTravelPlannerAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Travel Planner',
    description: 'AI-powered travel planning with Amadeus flight/hotel search and Gemini itinerary generation. Plan your perfect trip with personalized recommendations.',
    version: '1.0.0',
    supportedInterfaces: [
        {
            url: `${baseUrl}/agents/travel`,
            protocolBinding: 'JSONRPC',
        },
    ],
    capabilities: {
        streaming: true,
        pushNotifications: true,
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'find-flights',
            name: 'Find Flights',
            description: 'Search for available flights to your destination with real-time pricing.',
            tags: ['flights', 'travel', 'booking', 'airlines'],
        },
        {
            id: 'find-hotels',
            name: 'Find Hotels',
            description: 'Search for hotels and accommodations at your destination.',
            tags: ['hotels', 'accommodations', 'booking', 'lodging'],
        },
        {
            id: 'create-itinerary',
            name: 'Create Itinerary',
            description: 'Generate a personalized day-by-day travel itinerary powered by Gemini AI.',
            tags: ['itinerary', 'planning', 'activities', 'recommendations'],
        },
        {
            id: 'plan-trip',
            name: 'Plan Trip',
            description: 'Interactive trip planning form to set your destination, dates, and preferences.',
            tags: ['planning', 'trip', 'travel', 'setup'],
        },
    ],
    provider: {
        organization: 'LiquidCrypto Agents',
    },
    extensions: {
        a2ui: {
            version: '0.8',
            supportedComponents: ['Card', 'Button', 'Text', 'Row', 'Column', 'TextField', 'DateTimeInput'],
        },
    },
});

// Default trip settings
let currentTrip: TripRequest = {
    destination: 'Tokyo',
    startDate: '2025-03-15',
    endDate: '2025-03-22',
    travelers: 2,
    budget: 'moderate',
    interests: ['food', 'culture'],
};

export async function handleTravelPlannerRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();

    try {
        const prompt = params?.message?.parts
            // @ts-ignore
            ?.filter(p => p.type === 'text')
            .map((p: any) => p.text)
            .join(' ')
            .toLowerCase() || '';

        let a2uiMessages: A2UIMessage[];
        let textResponse: string;

        // Extract destination from prompt
        const destMatch = prompt.match(/(?:to|in|for)\s+([a-zA-Z\s]+?)(?:\s+from|\s+on|\s*$)/i);
        if (destMatch) {
            currentTrip.destination = destMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());
        }

        // Intent matching
        if (prompt.includes('flight') || prompt.includes('fly')) {
            const flights = await searchFlights('JFK', currentTrip.destination.substring(0, 3).toUpperCase(), currentTrip.startDate, currentTrip.travelers);
            a2uiMessages = generateFlightResults(flights, currentTrip.destination);
            textResponse = `Found ${flights.length} flights to ${currentTrip.destination}. Prices start at $${Math.min(...flights.map(f => f.price))}.`;

        } else if (prompt.includes('hotel') || prompt.includes('stay') || prompt.includes('accommodation')) {
            const hotels = await searchHotels(currentTrip.destination, currentTrip.startDate, currentTrip.endDate);
            a2uiMessages = generateHotelResults(hotels, currentTrip.destination);
            textResponse = `Found ${hotels.length} hotels in ${currentTrip.destination}. Prices from $${Math.min(...hotels.map(h => h.pricePerNight))}/night.`;

        } else if (prompt.includes('itinerary') || prompt.includes('plan my') || prompt.includes('create')) {
            const itinerary = await generateItineraryWithGemini(currentTrip);
            a2uiMessages = generateItineraryView(itinerary);
            textResponse = `Created a ${itinerary.days.length}-day itinerary for ${currentTrip.destination}. Estimated cost: $${itinerary.estimatedCost.toLocaleString()}.`;

        } else if (prompt.includes('things to do') || prompt.includes('activities') || prompt.includes('attractions')) {
            const itinerary = await generateItineraryWithGemini({ ...currentTrip, interests: ['sightseeing', 'culture', 'food'] });
            a2uiMessages = generateItineraryView(itinerary);
            textResponse = `Here are recommended activities in ${currentTrip.destination}.`;

        } else {
            // Default: Show planning form
            a2uiMessages = generatePlanningForm();
            textResponse = `Let's plan your trip! Tell me where you want to go, or try "find flights to Tokyo" or "create itinerary for Paris".`;
        }

        return {
            id: taskId,
            contextId: 'travel-planner-context',
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
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('[Travel Planner] Error:', errorMessage);

        return {
            id: taskId,
            contextId: 'travel-planner-context',
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
