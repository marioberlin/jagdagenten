/**
 * ILiquidLLMService - Interface for LLM service providers
 * 
 * All LLM providers (Gemini, Claude, OpenAI, etc.) should implement this interface.
 */

import { LiquidClient, ActionDefinition } from '../liquid-engine/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatOptions {
    /** Temperature for generation (0.0-1.0) */
    temperature?: number;
    /** Maximum tokens to generate */
    maxTokens?: number;
}

export interface FileSearchConfig {
    enabled: boolean;
    stores: string[];
}

export interface ToolSchema {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

// ============================================================================
// INTERFACE
// ============================================================================

export interface ILiquidLLMService {
    /**
     * Set the model to use for generation.
     */
    setModel(modelName: string): void;

    /**
     * Send a message and stream the response into the Liquid Engine.
     * Used for tool-calling and complex interactions.
     */
    sendMessage(prompt: string): Promise<void>;

    /**
     * Simple chat method for plain text responses.
     * Used by Guard Dog, Decontextualizer, and other quick classification tasks.
     */
    chat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string>;

    /**
     * Configure File Search / RAG capabilities.
     */
    setFileSearchConfig(config: FileSearchConfig): void;

    /**
     * Generate an image using the provider's image generation capability.
     * Returns an array of base64-encoded image strings.
     */
    generateImage?(
        prompt: string,
        options?: {
            referenceImages?: string[];
            aspectRatio?: string;
            imageSize?: string;
        }
    ): Promise<string[]>;
}

// ============================================================================
// ABSTRACT BASE CLASS
// ============================================================================

export abstract class LLMServiceBase implements ILiquidLLMService {
    protected client: LiquidClient;
    protected modelName: string;
    protected fileSearchConfig: FileSearchConfig = { enabled: false, stores: [] };

    constructor(client: LiquidClient, defaultModel: string) {
        this.client = client;
        this.modelName = defaultModel;
    }

    public setModel(modelName: string): void {
        this.modelName = modelName;
    }

    public setFileSearchConfig(config: FileSearchConfig): void {
        this.fileSearchConfig = config;
    }

    // =========================================================================
    // SHARED LOGIC
    // =========================================================================

    /**
     * Build the system prompt from the Liquid Client's context.
     * This is shared across all providers.
     */
    protected buildSystemPrompt(basePrompt?: string): string {
        const defaultBase = "You are a helpful UI assistant. You can use tools to generate UI components and interact with the application.";
        const base = basePrompt || defaultBase;
        const contextPrompt = this.client.buildContextPrompt();

        if (contextPrompt) {
            return `${base}\n\n${contextPrompt}`;
        }
        return base;
    }

    /**
     * Get registered actions from the Liquid Client.
     * Providers use this to build their tool schemas.
     */
    protected getRegisteredActions(): ActionDefinition[] {
        return this.client.getActions();
    }

    /**
     * Execute a tool call through the Liquid Client.
     * Called after a tool completion event.
     */
    protected async executeToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
        try {
            const result = await this.client.executeAction(name, args);
            console.log(`[LLMServiceBase] Action ${name} executed:`, result);
            return result;
        } catch (error) {
            console.log(`[LLMServiceBase] No registered handler for ${name}`);
            return null;
        }
    }

    // =========================================================================
    // ABSTRACT METHODS (Provider-specific)
    // =========================================================================

    /**
     * Send a message and stream the response.
     * Each provider implements this with their SDK.
     */
    abstract sendMessage(prompt: string): Promise<void>;

    /**
     * Simple chat for text responses.
     * Each provider implements this with their SDK.
     */
    abstract chat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string>;

    /**
     * Convert ActionDefinition to provider-specific tool schema.
     * Gemini uses SchemaType, Claude uses { type: 'string' }, etc.
     */
    protected abstract mapActionToToolSchema(action: ActionDefinition): ToolSchema;

    /**
     * Build the full tools array for the provider.
     * Uses mapActionToToolSchema internally.
     */
    protected buildTools(): ToolSchema[] {
        const actions = this.getRegisteredActions();
        if (actions.length === 0) {
            return this.getDefaultTools();
        }
        return actions.map(action => this.mapActionToToolSchema(action));
    }

    /**
     * Default tools when no actions are registered.
     * Override in subclass for provider-specific defaults.
     */
    protected getDefaultTools(): ToolSchema[] {
        return [];
    }
}
