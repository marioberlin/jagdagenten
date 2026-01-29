/**
 * Alexa+ Executor
 *
 * A2A executor that emulates Amazon Alexa+ smart home assistant capabilities.
 * Provides skills for calendar, shopping lists, weather, contacts, and photos.
 */

import { randomUUID } from 'crypto';
import { v1 } from '@liquidcrypto/a2a-sdk';
import {
    BaseA2UIExecutor,
    type AgentExecutionContext,
    type AgentExecutionResult,
    type ExecutorA2UIMessage,
} from './base.js';

// =============================================================================
// Types
// =============================================================================

interface CalendarEvent {
    id: string;
    title: string;
    time?: string;
    isAllDay: boolean;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

interface ShoppingItem {
    id: string;
    name: string;
    checked: boolean;
}

interface Contact {
    id: string;
    name: string;
    initials: string;
    avatar?: string;
    canDropIn: boolean;
    canCall: boolean;
    type: 'device' | 'person';
}

interface WeatherData {
    location: string;
    temperature: number;
    condition: string;
    high: number;
    low: number;
    hourly: Array<{ hour: string; temp: number; icon: string }>;
}

interface AlexaDashboardData {
    calendar: {
        today: CalendarEvent[];
        tomorrow: CalendarEvent[];
        currentDate: string;
    };
    shopping: ShoppingItem[];
    weather: WeatherData;
    contacts: Contact[];
    photos: { url: string; caption: string }[];
    time: string;
}

// =============================================================================
// Alexa Executor
// =============================================================================

export class AlexaExecutor extends BaseA2UIExecutor {
    private dashboardData: AlexaDashboardData;

    constructor() {
        super();
        this.dashboardData = this.getInitialDashboardData();
    }

    async execute(
        message: v1.Message,
        context: AgentExecutionContext
    ): Promise<AgentExecutionResult> {
        const text = this.extractText(message).toLowerCase().trim();

        console.log('[AlexaExecutor] Received message:', text);

        // Parse intent
        if (text.includes('shopping') || text.includes('list')) {
            return this.handleShoppingIntent(text, context);
        }

        if (text.includes('calendar') || text.includes('schedule') || text.includes('event')) {
            return this.handleCalendarIntent(text, context);
        }

        if (text.includes('weather') || text.includes('temperature') || text.includes('forecast')) {
            return this.handleWeatherIntent(text, context);
        }

        if (text.includes('call') || text.includes('contact') || text.includes('drop in')) {
            return this.handleContactsIntent(text, context);
        }

        // Default: return full dashboard
        return this.createDashboardResponse(context);
    }

    // ===========================================================================
    // Intent Handlers
    // ===========================================================================

    private handleShoppingIntent(
        text: string,
        context: AgentExecutionContext
    ): AgentExecutionResult {
        // Add item to shopping list
        const addMatch = text.match(/add\s+(.+?)\s+to\s+(?:my\s+)?(?:shopping\s+)?list/i);
        if (addMatch) {
            const itemName = addMatch[1].trim();
            this.dashboardData.shopping.push({
                id: randomUUID(),
                name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
                checked: false,
            });
            return this.createTextResponse(
                `Added "${itemName}" to your shopping list.`,
                context.contextId,
                context.taskId
            );
        }

        // Remove item
        const removeMatch = text.match(/remove\s+(.+?)\s+from\s+(?:my\s+)?(?:shopping\s+)?list/i);
        if (removeMatch) {
            const itemName = removeMatch[1].trim().toLowerCase();
            const index = this.dashboardData.shopping.findIndex(
                i => i.name.toLowerCase() === itemName
            );
            if (index >= 0) {
                this.dashboardData.shopping.splice(index, 1);
                return this.createTextResponse(
                    `Removed "${itemName}" from your shopping list.`,
                    context.contextId,
                    context.taskId
                );
            }
        }

        // Show shopping list
        const items = this.dashboardData.shopping.map(i => `• ${i.name}`).join('\n');
        return this.createTextResponse(
            `Here's your shopping list:\n${items}`,
            context.contextId,
            context.taskId
        );
    }

    private handleCalendarIntent(
        text: string,
        context: AgentExecutionContext
    ): AgentExecutionResult {
        const { today, tomorrow, currentDate } = this.dashboardData.calendar;

        if (text.includes('tomorrow')) {
            const events = tomorrow.map(e =>
                e.isAllDay ? `• ${e.title} (all-day)` : `• ${e.time} - ${e.title}`
            ).join('\n');
            return this.createTextResponse(
                `Tomorrow's events:\n${events || 'No events scheduled.'}`,
                context.contextId,
                context.taskId
            );
        }

        // Default: today's events
        const events = today.map(e =>
            e.isAllDay ? `• ${e.title} (all-day)` : `• ${e.time} - ${e.title}`
        ).join('\n');
        return this.createTextResponse(
            `Today (${currentDate}):\n${events || 'No events scheduled.'}`,
            context.contextId,
            context.taskId
        );
    }

    private handleWeatherIntent(
        text: string,
        context: AgentExecutionContext
    ): AgentExecutionResult {
        const { weather } = this.dashboardData;
        const hourlyStr = weather.hourly
            .slice(0, 4)
            .map(h => `${h.hour}: ${h.temp}°`)
            .join(', ');

        return this.createTextResponse(
            `Weather in ${weather.location}: ${weather.temperature}°F, ${weather.condition}.\n` +
            `High: ${weather.high}°F, Low: ${weather.low}°F\n` +
            `Hourly: ${hourlyStr}`,
            context.contextId,
            context.taskId
        );
    }

    private handleContactsIntent(
        text: string,
        context: AgentExecutionContext
    ): AgentExecutionResult {
        const contacts = this.dashboardData.contacts
            .filter(c => c.type === 'person')
            .map(c => `• ${c.name}`)
            .join('\n');

        return this.createTextResponse(
            `Your top contacts:\n${contacts}\n\nSay "Call [name]" or "Drop in on [device]" to connect.`,
            context.contextId,
            context.taskId
        );
    }

    // ===========================================================================
    // Dashboard Response
    // ===========================================================================

    private createDashboardResponse(context: AgentExecutionContext): AgentExecutionResult {
        const wantsUI = this.wantsA2UI(context);

        if (!wantsUI) {
            return this.createTextResponse(
                `Welcome to Alexa+! I can help you with:\n` +
                `• Calendar - "What's on my calendar today?"\n` +
                `• Shopping - "Add milk to my shopping list"\n` +
                `• Weather - "What's the weather?"\n` +
                `• Contacts - "Show my contacts"`,
                context.contextId,
                context.taskId
            );
        }

        // Build A2UI dashboard
        const surfaceId = randomUUID();
        const a2ui = this.buildDashboardA2UI(surfaceId);

        return this.createA2UIResponse(
            'Here is your Alexa+ dashboard.',
            a2ui,
            context.contextId,
            context.taskId
        );
    }

    private buildDashboardA2UI(surfaceId: string): ExecutorA2UIMessage[] {
        const rootId = 'alexa-dashboard';

        return [
            {
                type: 'beginRendering',
                surfaceId,
                rootComponentId: rootId,
                styling: {
                    primaryColor: '#00CAFF',
                    fontFamily: 'Inter, system-ui, sans-serif',
                },
            },
            {
                type: 'surfaceUpdate',
                surfaceId,
                components: [
                    {
                        id: rootId,
                        component: this.Row(
                            ['calendar-panel', 'center-panel', 'contacts-panel'],
                            { gap: 16, padding: 24 }
                        ),
                    },
                    // Calendar Panel
                    {
                        id: 'calendar-panel',
                        component: this.Column(
                            ['calendar-today', 'calendar-mini'],
                            { gap: 12, flex: 1 }
                        ),
                    },
                    {
                        id: 'calendar-today',
                        component: this.Card(
                            ['calendar-header', 'calendar-events'],
                            { variant: 'glass' }
                        ),
                    },
                    {
                        id: 'calendar-header',
                        component: this.Text('Today', 'heading'),
                    },
                    {
                        id: 'calendar-events',
                        component: this.List('$.calendar.today', [
                            'event-item',
                        ]),
                    },
                    // Center Panel
                    {
                        id: 'center-panel',
                        component: this.Column(
                            ['shopping-card', 'weather-card'],
                            { gap: 12, flex: 1 }
                        ),
                    },
                    {
                        id: 'shopping-card',
                        component: this.Card(
                            ['shopping-header', 'shopping-list'],
                            { variant: 'glass' }
                        ),
                    },
                    {
                        id: 'shopping-header',
                        component: this.Text('Shopping List', 'heading'),
                    },
                    {
                        id: 'shopping-list',
                        component: this.List('$.shopping', ['shopping-item']),
                    },
                    {
                        id: 'weather-card',
                        component: this.Card(
                            ['weather-location', 'weather-temp', 'weather-condition'],
                            { variant: 'glass' }
                        ),
                    },
                    {
                        id: 'weather-location',
                        component: this.Text({ path: '$.weather.location' }, 'label'),
                    },
                    {
                        id: 'weather-temp',
                        component: this.Text({ path: '$.weather.temperature' }, 'display'),
                    },
                    {
                        id: 'weather-condition',
                        component: this.Text({ path: '$.weather.condition' }, 'body'),
                    },
                    // Contacts Panel
                    {
                        id: 'contacts-panel',
                        component: this.Card(
                            ['contacts-header', 'contacts-grid'],
                            { variant: 'glass', flex: 1 }
                        ),
                    },
                    {
                        id: 'contacts-header',
                        component: this.Text('Top Contacts', 'heading'),
                    },
                    {
                        id: 'contacts-grid',
                        component: this.List('$.contacts', ['contact-item']),
                    },
                ],
            },
            {
                type: 'setModel',
                surfaceId,
                model: {
                    calendar: this.dashboardData.calendar as unknown as v1.JSONValue,
                    shopping: this.dashboardData.shopping as unknown as v1.JSONValue,
                    weather: this.dashboardData.weather as unknown as v1.JSONValue,
                    contacts: this.dashboardData.contacts as unknown as v1.JSONValue,
                },
            },
        ];
    }

    // ===========================================================================
    // Initial Data
    // ===========================================================================

    private getInitialDashboardData(): AlexaDashboardData {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });

        return {
            calendar: {
                currentDate: dateStr,
                today: [
                    { id: '1', title: "Jayden's Birthday", isAllDay: true, color: 'blue' },
                    { id: '2', title: 'Work Event', time: '10:30 AM - 11:45 AM', isAllDay: false, color: 'green' },
                    { id: '3', title: 'Take out the trash', time: '4:00 PM', isAllDay: false, color: 'yellow' },
                    { id: '4', title: 'Vinyasa Yoga', time: '5:30 PM - 7:00 PM', isAllDay: false, color: 'purple' },
                ],
                tomorrow: [
                    { id: '5', title: 'Mom in town', isAllDay: true, color: 'blue' },
                    { id: '6', title: 'Chris work trip', isAllDay: true, color: 'green' },
                    { id: '7', title: 'Work Event', time: '10:30 AM - 11:45 AM', isAllDay: false, color: 'green' },
                    { id: '8', title: 'Date Night', time: '6:30 PM - 9:00 PM', isAllDay: false, color: 'red' },
                ],
            },
            shopping: [
                { id: 's1', name: 'Bananas', checked: false },
                { id: 's2', name: 'Cucumber', checked: false },
                { id: 's3', name: 'Red onions', checked: false },
                { id: 's4', name: 'Spring Greens', checked: false },
                { id: 's5', name: 'Olive Oil', checked: false },
                { id: 's6', name: 'Lemons', checked: false },
            ],
            weather: {
                location: 'Seattle, WA',
                temperature: 65,
                condition: 'Sunny',
                high: 67,
                low: 48,
                hourly: [
                    { hour: '11 AM', temp: 65, icon: 'sun' },
                    { hour: '12 AM', temp: 67, icon: 'sun' },
                    { hour: '1 PM', temp: 67, icon: 'cloud-sun' },
                    { hour: '2 PM', temp: 66, icon: 'cloud' },
                ],
            },
            contacts: [
                { id: 'c1', name: 'Kitchen Echo Show', initials: '', type: 'device', canDropIn: true, canCall: false },
                { id: 'c2', name: 'Study-room', initials: '', type: 'device', canDropIn: false, canCall: true },
                { id: 'c3', name: 'Andrea Smith Smolik', initials: 'AS', type: 'person', canDropIn: false, canCall: true },
                { id: 'c4', name: 'Sally', initials: 'S', type: 'person', canDropIn: false, canCall: true },
                { id: 'c5', name: 'Dad', initials: 'D', type: 'person', canDropIn: true, canCall: true },
            ],
            photos: [
                { url: '/assets/alexa/family-trip.jpg', caption: 'Family Trip - Beach Day' },
            ],
            time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
    }
}

// =============================================================================
// Agent Card
// =============================================================================

export function getAlexaAgentCard(baseUrl: string): v1.AgentCard {
    return {
        name: 'Alexa+',
        description: 'Smart home assistant with calendar, shopping lists, weather, contacts, and photos',
        url: `${baseUrl}/a2a`,
        protocolVersion: '1.0',
        capabilities: {
            streaming: true,
            pushNotifications: false,
        },
        defaultInputModes: ['text', 'audio'],
        defaultOutputModes: ['text', 'a2ui'],
        skills: [
            {
                id: 'alexa-calendar',
                name: 'Calendar',
                description: 'View and manage calendar events, reminders, and schedules',
                tags: ['calendar', 'schedule', 'events', 'reminders'],
                examples: [
                    "What's on my calendar today?",
                    "What's scheduled for tomorrow?",
                    'Show my calendar',
                ],
            },
            {
                id: 'alexa-shopping',
                name: 'Shopping List',
                description: 'Manage shopping lists - add, remove, and view items',
                tags: ['shopping', 'list', 'groceries', 'items'],
                examples: [
                    'Add milk to my shopping list',
                    'Remove eggs from my list',
                    "What's on my shopping list?",
                ],
            },
            {
                id: 'alexa-weather',
                name: 'Weather',
                description: 'Get current weather conditions and forecasts',
                tags: ['weather', 'forecast', 'temperature', 'conditions'],
                examples: [
                    "What's the weather?",
                    "What's the temperature outside?",
                    'Will it rain today?',
                ],
            },
            {
                id: 'alexa-contacts',
                name: 'Contacts',
                description: 'Call, message, or drop in on contacts and devices',
                tags: ['contacts', 'call', 'drop in', 'communication'],
                examples: [
                    'Show my contacts',
                    'Call Mom',
                    'Drop in on Kitchen',
                ],
            },
            {
                id: 'alexa-dashboard',
                name: 'Dashboard',
                description: 'View the full Alexa+ smart home dashboard',
                tags: ['dashboard', 'home', 'overview', 'alexa'],
                examples: [
                    'Show dashboard',
                    'Open Alexa',
                    'Home screen',
                ],
            },
        ],
    };
}
