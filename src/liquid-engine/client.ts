import { LiquidProtocolEvent, ToolCallState } from './types';
import { parsePartialJson } from './parser';
import { ReadableContext, ContextStrategy } from './strategies/definitions';
import { FlatContextStrategy } from './strategies/flat';
import { TreeContextStrategy } from './strategies/tree';

// Re-export for consumers
export type { ReadableContext } from './strategies/definitions';

type Listener = (state: Record<string, ToolCallState>) => void;

// Legacy interface (removed in favor of definitions.ts import)
// export interface ReadableContext { ... } 

export interface ActionDefinition<T = unknown> {
    name: string;
    description: string;
    parameters: ActionParameter[];
    handler: (args: T) => Promise<unknown> | unknown;
    render?: (props: { status: string; args: T; result?: unknown }) => React.ReactNode;
}

export interface ActionParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    enum?: string[];
    // For array types: schema of items
    items?: {
        type: 'string' | 'number' | 'boolean' | 'object';
        properties?: Record<string, { type: string; description?: string }>;
    };
}

export class LiquidClient {
    private toolStates: Record<string, ToolCallState> = {};
    private listeners: Set<Listener> = new Set();

    // NEW: Context Strategy State
    private readableContexts: Map<string, ReadableContext> = new Map();
    private strategy: ContextStrategy;
    private activeFocusId: string | undefined;

    // NEW: Action registry for AI-invokable functions
    private actions: Map<string, ActionDefinition> = new Map();

    constructor() {
        // Default to Flat strategy (backward compatibility)
        this.strategy = new FlatContextStrategy();
    }

    /**
     * Ingest an event from the Liquid Wire stream
     */
    public ingest(event: LiquidProtocolEvent) {
        switch (event.type) {
            case 'tool_start':
                this.toolStates[event.id] = {
                    id: event.id,
                    name: event.name,
                    status: 'running',
                    argsBuffer: '',
                    args: {}
                };
                break;

            case 'tool_delta':
                if (this.toolStates[event.id]) {
                    const state = this.toolStates[event.id];
                    state.argsBuffer += event.delta;
                    // Attempt real-time parse
                    state.args = parsePartialJson(state.argsBuffer);
                }
                break;

            case 'tool_complete':
                if (this.toolStates[event.id]) {
                    const state = this.toolStates[event.id];
                    state.status = 'completed';
                    state.result = event.result;
                    // Final parse to ensure we have the complete object
                    state.args = parsePartialJson(state.argsBuffer);
                }
                break;

            case 'agent_message':
                // Handled separately by chat UI, but could be stored here if needed
                break;
        }

        this.emit();
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        // Emit current state immediately
        listener(this.toolStates);

        return () => {
            this.listeners.delete(listener);
        };
    }

    public getToolState(id: string): ToolCallState | undefined {
        return this.toolStates[id];
    }

    private emit() {
        this.listeners.forEach(listener => listener({ ...this.toolStates }));
    }

    // ============ Readable Context API ============

    /**
     * Set the active context strategy
     */
    public setContextStrategy(name: 'flat' | 'tree') {
        if (name === 'tree') {
            this.strategy = new TreeContextStrategy();
        } else {
            this.strategy = new FlatContextStrategy();
        }
        console.log(`[LiquidClient] Switched to Context Strategy: ${this.strategy.name}`);
    }

    /**
     * Set the current focus (e.g. current page ID)
     * This is used by Tree strategy to prune unrelated contexts.
     */
    public setFocus(id: string) {
        this.activeFocusId = id;
    }

    /**
     * Register a readable context that AI can access
     */
    public registerReadable(context: ReadableContext): () => void {
        this.readableContexts.set(context.id, context);
        return () => {
            this.readableContexts.delete(context.id);
        };
    }

    /**
     * Update an existing readable context value
     */
    public updateReadable(id: string, value: unknown): void {
        const existing = this.readableContexts.get(id);
        if (existing) {
            existing.value = value;
        }
    }

    /**
     * Get all readable contexts (raw access)
     */
    public getReadableContexts(): ReadableContext[] {
        return Array.from(this.readableContexts.values());
    }

    /**
     * Build a system prompt section using the active strategy
     */
    public buildContextPrompt(): string {
        return this.strategy.buildPrompt(this.readableContexts, this.activeFocusId);
    }

    // ============ Action Registry API ============

    /**
     * Register an action that AI can invoke
     */
    public registerAction(action: ActionDefinition): () => void {
        this.actions.set(action.name, action);
        return () => {
            this.actions.delete(action.name);
        };
    }

    /**
     * Get all registered actions
     */
    public getActions(): ActionDefinition[] {
        return Array.from(this.actions.values());
    }

    /**
     * Get action by name
     */
    public getAction(name: string): ActionDefinition | undefined {
        return this.actions.get(name);
    }

    /**
     * Execute a registered action by name
     */
    public async executeAction<T = unknown>(name: string, args: T): Promise<unknown> {
        const action = this.actions.get(name);
        if (!action) {
            throw new Error(`Action "${name}" not found`);
        }
        return action.handler(args);
    }

    /**
     * Build Gemini-compatible function declarations from registered actions
     */
    public buildFunctionDeclarations(): object[] {
        return this.getActions().map(action => ({
            name: action.name,
            description: action.description,
            parameters: {
                type: 'OBJECT',
                properties: Object.fromEntries(
                    action.parameters.map(p => {
                        const prop: Record<string, unknown> = {
                            type: p.type.toUpperCase(),
                            description: p.description,
                        };

                        if (p.enum) {
                            prop.enum = p.enum;
                        }

                        // Critical: Include items for array types
                        if (p.type === 'array' && p.items) {
                            prop.items = {
                                type: p.items.type.toUpperCase(),
                                ...(p.items.properties ? { properties: p.items.properties } : {})
                            };
                        } else if (p.type === 'array') {
                            // Default to string array if items not specified
                            prop.items = { type: 'STRING' };
                        }

                        return [p.name, prop];
                    })
                ),
                required: action.parameters.filter(p => p.required).map(p => p.name)
            }
        }));
    }
}

