import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// ============================================================================
// Types & State
// ============================================================================

type WidgetType = 'metric' | 'chart' | 'list';

interface DashboardWidget {
    id: string;
    type: WidgetType;
    title: string;
    value?: string | number;
    change?: number;
    icon?: string;
    color?: string;
    data?: any;
}

// In-memory state for the pilot (session-based)
// Key: contextId (or 'default' for shared demo state)
const dashboardState = new Map<string, DashboardWidget[]>();

function getWidgets(contextId: string): DashboardWidget[] {
    if (!dashboardState.has(contextId)) {
        // Initial state
        dashboardState.set(contextId, [
            { id: '1', type: 'metric', title: 'Total Revenue', value: '$124,500', change: 12.5, icon: 'dollar', color: 'green' },
            { id: '2', type: 'metric', title: 'Active Users', value: '8,420', change: -2.3, icon: 'users', color: 'blue' },
            { id: '3', type: 'metric', title: 'Orders', value: '1,247', change: 8.1, icon: 'cart', color: 'purple' },
            { id: '4', type: 'metric', title: 'Conversion Rate', value: '3.24%', change: 0.5, icon: 'activity', color: 'orange' }
        ]);
    }
    return dashboardState.get(contextId)!;
}

// ============================================================================
// Tools Definition
// ============================================================================

const tools = [
    {
        name: 'create_widget',
        description: 'Create a new dashboard widget. ALWAYS use this when the user implies adding something new.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                type: { type: SchemaType.STRING, description: 'Widget type: metric, chart, or list' },
                title: { type: SchemaType.STRING, description: 'Title of the widget' },
                value: { type: SchemaType.STRING, description: 'Display value (e.g. "$10,000", "500"). Calculate this if arithmetic is requested.' },
                change: { type: SchemaType.NUMBER, description: 'Percentage change (e.g. 12.5, -5)' },
                icon: { type: SchemaType.STRING, description: 'Icon name: users, dollar, cart, activity, trending' },
                color: { type: SchemaType.STRING, description: 'Color: green, blue, purple, orange, red, cyan' }
            },
            required: ['title']
        }
    },
    {
        name: 'update_widget',
        description: 'Update an existing widget. Use this for ANY modification request (value, title, etc). Infer the widgetId from the title if not provided.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                widgetId: { type: SchemaType.STRING, description: 'ID of the widget to update. Find the closest match in the current state.' },
                title: { type: SchemaType.STRING, description: 'New title' },
                value: { type: SchemaType.STRING, description: 'New value. Calculate this if arithmetic is requested (e.g. "add 5").' },
                change: { type: SchemaType.NUMBER, description: 'New percentage change' }
            },
            required: ['widgetId']
        }
    },
    {
        name: 'delete_widget',
        description: 'Delete a widget from the dashboard. Infer the widgetId from the title if not provided.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                widgetId: { type: SchemaType.STRING, description: 'ID of the widget to delete' },
            },
            required: ['widgetId']
        }
    }
];

// ============================================================================
// A2UI Generation
// ============================================================================

function generateDashboardUI(widgets: DashboardWidget[]): A2UIMessage[] {
    const componentUpdates = widgets.flatMap((widget) => {
        const isPositive = (widget.change || 0) >= 0;
        const trendIcon = isPositive ? '↑' : '↓';

        return [
            {
                id: `widget-${widget.id}`,
                component: {
                    Card: {
                        children: [`icon-${widget.id}`, `value-${widget.id}`, `title-${widget.id}`, `trend-${widget.id}`],
                    },
                },
            },
            {
                id: `icon-${widget.id}`,
                component: {
                    Text: { text: { literalString: `[${widget.icon || 'activity'}]` }, variant: 'secondary' }
                }
            },
            {
                id: `value-${widget.id}`,
                component: {
                    Text: { text: { literalString: String(widget.value || '-') }, semantic: 'h3' }
                }
            },
            {
                id: `title-${widget.id}`,
                component: {
                    Text: { text: { literalString: widget.title }, variant: 'secondary' }
                }
            },
            {
                id: `trend-${widget.id}`,
                component: {
                    Text: { text: { literalString: `${trendIcon} ${Math.abs(widget.change || 0)}%` }, variant: 'secondary' } // Color not supported in base Text yet?
                }
            }
        ];
    });

    const rootChildren = widgets.map(w => `widget-${w.id}`);
    // Add placeholder/add button
    rootChildren.push('add-placeholder');

    return [
        {
            type: 'beginRendering',
            surfaceId: 'dashboard',
            rootComponentId: 'root',
            styling: { primaryColor: '#3b82f6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'dashboard',
            components: [
                {
                    id: 'root',
                    component: {
                        Row: {
                            children: rootChildren,
                            wrap: true,
                            alignment: 'start'
                        }
                    }
                },
                ...componentUpdates,
                {
                    id: 'add-placeholder',
                    component: {
                        Button: {
                            label: { literalString: '+ Add Widget' },
                            action: {
                                input: { text: 'Create a new widget' }
                            },
                            variant: 'secondary'
                        }
                    }
                }
            ]
        }
    ];
}

// ============================================================================
// Agent Logic
// ============================================================================


export const getDashboardBuilderAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Dashboard Builder',
    description: 'AI-powered dashboard creation agent. Create, update, and manage SaaS dashboards.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/dashboard-builder`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'manage-dashboard',
            name: 'Manage Dashboard',
            description: 'Create and modify dashboard widgets',
            tags: ['dashboard', 'ui', 'widgets'],
            examples: ['Create a sales widget', 'Remove the users widget', 'Update revenue to $150k'],
        }
    ],
    provider: { organization: 'LiquidCrypto Agents' },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'Text', 'Row', 'Column', 'Button'] },
    },
});

export async function handleDashboardBuilderRequest(params: SendMessageParams): Promise<any> {
    const messageText = params.message.parts
        .filter((p: { text?: string }) => p.text !== undefined)
        // @ts-ignore
        .map(p => p.text).join(' ');

    const contextId = params.contextId || 'default';
    const widgets = getWidgets(contextId);

    // 1. Setup Model with Tools
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ functionDeclarations: tools }]
    });

    const chat = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{
                    text: `You are a dashboard building assistant. Manage the dashboard state directly.
                
                roles:
                1. Always call the appropriate tool (create, update, delete) to satisfy the user's request.
                2. Do NOT ask for clarification if you can reasonably infer the target widget.
                3. **CRITICAL**: If the user asks to CREATE/ADD a NEW widget, you MUST use 'create_widget'. Do NOT update an existing widget, even if it seems similar (e.g. "Create sales widget" -> create new, do NOT update Total Revenue).
                4. **Defaults**: If the user doesn't specify a type, default to "metric". If they don't specify value, use "0".
                5. **Arithmetic**: If the user says "add 5 orders" (arithmetic), this means INCREMENT the value of the existing "Orders" widget. Do NOT create a new one. Do NOT delete anything. Calculate the new value (e.g. 100 -> 105) and call 'update_widget'.
                6. If the user refers to "last widget", use the **last item** in the provided JSON list (highest index).
                7. If the user says "Remove the last widget", find the last ID in the list and call delete_widget.
                8. Current widgets are provided in JSON format below. Use the "id" field for updates/deletes.
                
                Current Dashboard State:
                ${JSON.stringify(widgets, null, 2)}`
                }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I will strictly follow the rules: create new widgets when asked, infer IDs for updates/deletes, and handle the last widget correctly.' }]
            }
        ]
    });

    try {
        const result = await chat.sendMessage(messageText);
        const response = result.response;
        const functionCalls = response.functionCalls();
        let responseText = response.text() || "Dashboard updated.";

        if (functionCalls && functionCalls.length > 0) {
            const updatesGiven = [];

            for (const call of functionCalls) {
                const args = call.args;

                if (call.name === 'create_widget') {
                    const newWidget: DashboardWidget = {
                        id: Date.now().toString() + Math.random().toString().slice(2, 5),
                        type: (args.type as WidgetType) || 'metric',
                        title: (args.title as string) || 'New Widget',
                        value: (args.value as string) || '0',
                        change: (args.change as number) || 0,
                        icon: (args.icon as string) || 'activity',
                        color: (args.color as string) || 'blue'
                    };
                    widgets.push(newWidget);
                    updatesGiven.push(`Created widget "${newWidget.title}"`);
                }
                else if (call.name === 'update_widget') {
                    const id = args.widgetId as string;
                    const widget = widgets.find(w => w.id === id);
                    if (widget) {
                        if (args.title) widget.title = args.title as string;
                        if (args.value) widget.value = args.value as string;
                        if (args.change !== undefined) widget.change = args.change as number;
                        updatesGiven.push(`Updated widget "${widget.title}"`);
                    }
                }
                else if (call.name === 'delete_widget') {
                    const id = args.widgetId as string;
                    const idx = widgets.findIndex(w => w.id === id);
                    if (idx !== -1) {
                        const removed = widgets.splice(idx, 1);
                        updatesGiven.push(`Deleted widget "${removed[0].title}"`);
                    }
                }
            }

            if (updatesGiven.length > 0) {
                responseText = updatesGiven.join(', ');
            }
        }

        const a2uiMessages = generateDashboardUI(widgets);
        const taskId = randomUUID();

        return {
            id: taskId,
            contextId: contextId,
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'dashboard',
                    parts: [
                        { type: 'text', text: responseText },
                        { type: 'a2ui', a2ui: a2uiMessages },
                        { type: 'data', mimeType: 'application/json', data: widgets }
                    ]
                }
            ],
            history: []
        };

    } catch (error) {
        console.error("LLM Error:", error);
        return {
            id: randomUUID(),
            contextId: contextId,
            status: { state: 'failed', error: String(error) },
            artifacts: []
        };
    }
}
