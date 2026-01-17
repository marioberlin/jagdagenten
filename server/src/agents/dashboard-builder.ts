import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

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
// A2UI Generation
// ============================================================================

function generateDashboardUI(widgets: DashboardWidget[]): A2UIMessage[] {
    const componentUpdates = widgets.flatMap((widget) => {
        const isPositive = (widget.change || 0) >= 0;
        const trendColor = isPositive ? 'text-green-400' : 'text-red-400';
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
        .filter(p => p.type === 'text')
        // @ts-ignore
        .map(p => p.text).join(' ').toLowerCase();

    const contextId = params.contextId || 'default';
    const widgets = getWidgets(contextId);

    let responseText = "Here is your dashboard.";

    // Simple mock intent parser for Pilot
    if (messageText.includes('create') || messageText.includes('add')) {
        // Mock creation
        const newWidget: DashboardWidget = {
            id: Date.now().toString(),
            type: 'metric',
            title: 'New Metric',
            value: '0',
            change: 0,
            icon: 'activity',
            color: 'blue'
        };

        // Try to parse details (rudimentary)
        if (messageText.includes('sales') || messageText.includes('revenue')) {
            newWidget.title = 'Sales Revenue';
            newWidget.value = '$10,000';
            newWidget.icon = 'dollar';
        } else if (messageText.includes('user')) {
            newWidget.title = 'New Users';
            newWidget.value = '100';
            newWidget.icon = 'users';
        }

        widgets.push(newWidget);
        responseText = `Created new widget: ${newWidget.title}`;
    } else if (messageText.includes('delete') || messageText.includes('remove')) {
        // Remove last one or by keyword
        if (widgets.length > 0) {
            const removed = widgets.pop();
            responseText = `Removed widget: ${removed?.title}`;
        } else {
            responseText = "No widgets to remove.";
        }
    } else if (messageText.includes('update')) {
        if (widgets.length > 0) {
            widgets[0].value = '$999,999';
            widgets[0].change = 100;
            responseText = `Updated widget: ${widgets[0].title}`;
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
}
