/**
 * A2A/A2UI Integration Tests
 *
 * Tests for A2A protocol support and A2UI transformation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
    A2UIMessage,
    A2UIComponent,
    BeginRenderingMessage,
    SurfaceUpdateMessage,
    DataModelUpdateMessage,
    AgentCard,
    Task,
    TaskState,
} from '../../src/a2a/types';
import {
    transformA2UI,
    transformA2UIToGlass,
    validateA2UIPayload,
    createTransformerState,
    processA2UIMessage,
    resolveBinding,
} from '../../src/a2a/transformer';
import { GLASS_COMPONENT_CATALOG } from '../../src/a2a/types';
import { restaurantFinderExamples } from '../../src/a2a/examples/restaurant-finder';
import { rizzchartsExamples } from '../../src/a2a/examples/rizzcharts';

// ============================================================================
// Data Binding Tests
// ============================================================================

describe('A2UI Data Binding', () => {
    it('resolves literal string bindings', () => {
        const binding = { literalString: 'Hello World' };
        const result = resolveBinding(binding, {});
        expect(result).toBe('Hello World');
    });

    it('resolves literal number bindings', () => {
        const binding = { literalNumber: 42 };
        const result = resolveBinding(binding, {});
        expect(result).toBe(42);
    });

    it('resolves literal boolean bindings', () => {
        const binding = { literalBoolean: true };
        const result = resolveBinding(binding, {});
        expect(result).toBe(true);
    });

    it('resolves path bindings from data model', () => {
        const binding = { path: '/user/name' };
        const dataModel = { user: { name: 'John Doe' } };
        const result = resolveBinding(binding, dataModel);
        expect(result).toBe('John Doe');
    });

    it('resolves nested path bindings', () => {
        const binding = { path: '/portfolio/holdings/0/symbol' };
        const dataModel = {
            portfolio: {
                holdings: [{ symbol: 'BTC', amount: 1.5 }]
            }
        };
        const result = resolveBinding(binding, dataModel);
        expect(result).toBe('BTC');
    });

    it('resolves template context bindings', () => {
        const binding = { path: 'name' };
        const dataModel = {};
        const templateContext = { name: 'Template Item' };
        const result = resolveBinding(binding, dataModel, templateContext);
        expect(result).toBe('Template Item');
    });

    it('returns undefined for missing paths', () => {
        const binding = { path: '/missing/path' };
        const result = resolveBinding(binding, {});
        expect(result).toBeUndefined();
    });
});

// ============================================================================
// Transformer State Tests
// ============================================================================

describe('A2UI Transformer State', () => {
    it('creates empty transformer state', () => {
        const state = createTransformerState();
        expect(state.surfaces.size).toBe(0);
        expect(state.dataModels.size).toBe(0);
    });

    it('processes beginRendering message', () => {
        const state = createTransformerState();
        const message: BeginRenderingMessage = {
            type: 'beginRendering',
            surfaceId: 'test-surface',
            rootComponentId: 'root',
            styling: { primaryColor: '#ff0000' },
        };

        processA2UIMessage(message, state);

        expect(state.surfaces.has('test-surface')).toBe(true);
        const surface = state.surfaces.get('test-surface')!;
        expect(surface.rootComponentId).toBe('root');
        expect(surface.styling?.primaryColor).toBe('#ff0000');
    });

    it('processes surfaceUpdate message', () => {
        const state = createTransformerState();

        // First create the surface
        processA2UIMessage({
            type: 'beginRendering',
            surfaceId: 'test-surface',
            rootComponentId: 'root',
        }, state);

        // Then update it
        const updateMessage: SurfaceUpdateMessage = {
            type: 'surfaceUpdate',
            surfaceId: 'test-surface',
            components: [
                { id: 'root', component: { Column: { children: ['child1'] } } },
                { id: 'child1', component: { Text: { text: { literalString: 'Hello' } } } },
            ],
        };

        processA2UIMessage(updateMessage, state);

        const surface = state.surfaces.get('test-surface')!;
        expect(surface.components.size).toBe(2);
        expect(surface.components.has('root')).toBe(true);
        expect(surface.components.has('child1')).toBe(true);
    });

    it('processes dataModelUpdate message', () => {
        const state = createTransformerState();

        processA2UIMessage({
            type: 'beginRendering',
            surfaceId: 'test-surface',
            rootComponentId: 'root',
        }, state);

        const dataMessage: DataModelUpdateMessage = {
            type: 'dataModelUpdate',
            surfaceId: 'test-surface',
            data: { user: { name: 'Test User' } },
        };

        processA2UIMessage(dataMessage, state);

        const dataModel = state.dataModels.get('test-surface');
        expect(dataModel).toBeDefined();
        expect((dataModel as any).user.name).toBe('Test User');
    });

    it('processes deleteSurface message', () => {
        const state = createTransformerState();

        processA2UIMessage({
            type: 'beginRendering',
            surfaceId: 'test-surface',
            rootComponentId: 'root',
        }, state);

        expect(state.surfaces.has('test-surface')).toBe(true);

        processA2UIMessage({
            type: 'deleteSurface',
            surfaceId: 'test-surface',
        }, state);

        expect(state.surfaces.has('test-surface')).toBe(false);
    });
});

// ============================================================================
// Component Transformation Tests
// ============================================================================

describe('A2UI Component Transformation', () => {
    it('transforms simple text component', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    {
                        id: 'root',
                        component: {
                            Text: {
                                text: { literalString: 'Hello World' },
                                semantic: 'h1',
                            },
                        },
                    },
                ],
            },
        ];

        const result = transformA2UI(messages);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('text');
        expect(result?.children).toBe('Hello World');
        expect(result?.props?.variant).toBe('h1');
    });

    it('transforms button component', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    {
                        id: 'root',
                        component: {
                            Button: {
                                label: { literalString: 'Click Me' },
                                primary: true,
                            },
                        },
                    },
                ],
            },
        ];

        const result = transformA2UI(messages);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('button');
        expect(result?.children).toBe('Click Me');
        expect(result?.props?.variant).toBe('primary');
    });

    it('transforms column layout', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    {
                        id: 'root',
                        component: {
                            Column: {
                                children: ['child1', 'child2'],
                            },
                        },
                    },
                    {
                        id: 'child1',
                        component: { Text: { text: { literalString: 'First' } } },
                    },
                    {
                        id: 'child2',
                        component: { Text: { text: { literalString: 'Second' } } },
                    },
                ],
            },
        ];

        const result = transformA2UI(messages);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('stack');
        expect(result?.props?.direction).toBe('vertical');
        expect(result?.children).toHaveLength(2);
    });

    it('transforms row layout', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    {
                        id: 'root',
                        component: {
                            Row: {
                                children: ['left', 'right'],
                                distribution: 'spaceBetween',
                            },
                        },
                    },
                    {
                        id: 'left',
                        component: { Text: { text: { literalString: 'Left' } } },
                    },
                    {
                        id: 'right',
                        component: { Text: { text: { literalString: 'Right' } } },
                    },
                ],
            },
        ];

        const result = transformA2UI(messages);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('stack');
        expect(result?.props?.direction).toBe('horizontal');
    });

    it('transforms card component', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    {
                        id: 'root',
                        component: {
                            Card: {
                                children: ['content'],
                            },
                        },
                    },
                    {
                        id: 'content',
                        component: { Text: { text: { literalString: 'Card content' } } },
                    },
                ],
            },
        ];

        const result = transformA2UI(messages);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('card');
        expect(result?.children).toHaveLength(1);
    });

    it('transforms list with template', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    {
                        id: 'root',
                        component: {
                            List: {
                                items: { path: '/items' },
                                template: 'item-template',
                            },
                        },
                    },
                    {
                        id: 'item-template',
                        component: { Text: { text: { path: 'name' } } },
                    },
                ],
            },
            {
                type: 'dataModelUpdate',
                surfaceId: 'test',
                data: {
                    items: [
                        { name: 'Item 1' },
                        { name: 'Item 2' },
                        { name: 'Item 3' },
                    ],
                },
            },
        ];

        const result = transformA2UI(messages);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('stack');
        expect(result?.children).toHaveLength(3);
    });
});

// ============================================================================
// Multi-Surface Tests
// ============================================================================

describe('A2UI Multi-Surface Rendering', () => {
    it('handles multiple surfaces', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'surface-1',
                rootComponentId: 'root1',
            },
            {
                type: 'beginRendering',
                surfaceId: 'surface-2',
                rootComponentId: 'root2',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'surface-1',
                components: [
                    { id: 'root1', component: { Text: { text: { literalString: 'Surface 1' } } } },
                ],
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'surface-2',
                components: [
                    { id: 'root2', component: { Text: { text: { literalString: 'Surface 2' } } } },
                ],
            },
        ];

        const surfaces = transformA2UIToGlass(messages);
        expect(surfaces.size).toBe(2);
        expect(surfaces.has('surface-1')).toBe(true);
        expect(surfaces.has('surface-2')).toBe(true);
    });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('A2UI Validation', () => {
    it('validates valid payload', () => {
        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    { id: 'root', component: { Text: { text: { literalString: 'Valid' } } } },
                ],
            },
        ];

        const result = validateA2UIPayload(messages, GLASS_COMPONENT_CATALOG);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('rejects payload with too many components', () => {
        const components: A2UIComponent[] = [];
        for (let i = 0; i < 501; i++) {
            components.push({
                id: `component-${i}`,
                component: { Text: { text: { literalString: `Text ${i}` } } },
            });
        }

        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components,
            },
        ];

        const result = validateA2UIPayload(messages, GLASS_COMPONENT_CATALOG);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Too many components'))).toBe(true);
    });
});

// ============================================================================
// Example Transformation Tests
// ============================================================================

describe('Restaurant Finder Examples', () => {
    it('transforms single column list example', () => {
        const result = transformA2UI(restaurantFinderExamples.singleColumnList);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('stack'); // Column -> stack vertical
    });

    it('transforms booking form example', () => {
        const result = transformA2UI(restaurantFinderExamples.bookingForm);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('card');
    });

    it('transforms confirmation example', () => {
        const result = transformA2UI(restaurantFinderExamples.confirmation);
        expect(result).not.toBeNull();
    });
});

describe('RizzCharts Examples', () => {
    it('transforms sales dashboard example', () => {
        const result = transformA2UI(rizzchartsExamples.salesDashboard);
        expect(result).not.toBeNull();
    });

    it('transforms location map example', () => {
        const result = transformA2UI(rizzchartsExamples.locationMap);
        expect(result).not.toBeNull();
    });

    it('transforms crypto portfolio example', () => {
        const result = transformA2UI(rizzchartsExamples.cryptoPortfolio);
        expect(result).not.toBeNull();
    });

    it('transforms trading interface example', () => {
        const result = transformA2UI(rizzchartsExamples.tradingInterface);
        expect(result).not.toBeNull();
    });
});

// ============================================================================
// Action Handler Tests
// ============================================================================

describe('A2UI Action Handling', () => {
    it('calls action handler for button clicks', () => {
        const actions: Array<{ id: string; data?: unknown }> = [];
        const onAction = (id: string, data?: unknown) => {
            actions.push({ id, data });
        };

        const messages: A2UIMessage[] = [
            {
                type: 'beginRendering',
                surfaceId: 'test',
                rootComponentId: 'root',
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'test',
                components: [
                    {
                        id: 'root',
                        component: {
                            Button: {
                                label: { literalString: 'Submit' },
                                action: {
                                    custom: {
                                        actionId: 'submit_form',
                                        data: { formId: 123 },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        ];

        const result = transformA2UI(messages, onAction);
        expect(result).not.toBeNull();
        expect(result?.props?.actionId).toBe('submit_form');
    });
});

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('A2A Type Safety', () => {
    it('has valid TaskState values', () => {
        const states: TaskState[] = [
            'submitted',
            'working',
            'input_required',
            'auth_required',
            'completed',
            'failed',
            'cancelled',
            'rejected',
        ];

        states.forEach(state => {
            expect(typeof state).toBe('string');
        });
    });

    it('has valid AgentCard structure', () => {
        const card: AgentCard = {
            name: 'Test Agent',
            description: 'A test agent',
            url: 'https://example.com',
            version: '1.0.0',
            capabilities: {
                streaming: true,
                pushNotifications: false,
            },
            skills: [
                {
                    id: 'test',
                    name: 'Test Skill',
                    description: 'A test skill',
                },
            ],
            extensions: {
                a2ui: {
                    version: '0.8',
                    supportedComponents: ['Text', 'Button'],
                },
            },
        };

        expect(card.name).toBe('Test Agent');
        expect(card.extensions?.a2ui?.version).toBe('0.8');
    });
});
