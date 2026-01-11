import Anthropic from "@anthropic-ai/sdk";
import { LiquidClient, ActionDefinition } from "../liquid-engine/client";
import { ILiquidLLMService, FileSearchConfig, ChatOptions } from "./types";

// Claude 4.5 Models (latest as of 2024/2025)
export const CLAUDE_MODELS = {
    'claude-opus-4-5-20251101': 'Claude 4.5 Opus',
    'claude-sonnet-4-5-20241022': 'Claude 4.5 Sonnet',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
} as const;

export type ClaudeModelId = keyof typeof CLAUDE_MODELS;

export class ClaudeService implements ILiquidLLMService {
    private anthropic: Anthropic;
    private modelName: string = "claude-3-opus-20240229";
    private client: LiquidClient;
    private _fileSearchConfig: FileSearchConfig = { enabled: false, stores: [] };

    constructor(_apiKey: string, liquidClient: LiquidClient) {
        this.anthropic = new Anthropic({
            apiKey: _apiKey,
            dangerouslyAllowBrowser: true // Required for client-side usage
        });
        this.client = liquidClient;
    }

    public setModel(modelName: ClaudeModelId) {
        this.modelName = modelName;
    }

    public getAvailableModels() {
        return CLAUDE_MODELS;
    }

    /**
     * Build tools from registered actions for Claude's tool use format
     */
    private buildTools(): Anthropic.Tool[] {
        const registeredActions = this.client.getActions();

        if (registeredActions.length === 0) {
            // Return default tools
            return [
                {
                    name: "get_weather",
                    description: "Get the current weather for a location",
                    input_schema: {
                        type: "object" as const,
                        properties: {
                            location: { type: "string", description: "City and state" },
                            condition: { type: "string", description: "Weather condition" },
                            temperature: { type: "number", description: "Temperature in fahrenheit" }
                        },
                        required: ["location", "condition", "temperature"]
                    }
                }
            ];
        }

        // Convert registered actions to Claude tool format
        return registeredActions.map((action: ActionDefinition) => ({
            name: action.name,
            description: action.description,
            input_schema: {
                type: "object" as const,
                properties: Object.fromEntries(
                    action.parameters.map(p => {
                        const prop: Record<string, unknown> = {
                            type: p.type,
                            description: p.description
                        };

                        // Include items for array types
                        if (p.type === 'array' && p.items) {
                            prop.items = {
                                type: p.items.type,
                                ...(p.items.properties ? { properties: p.items.properties } : {})
                            };
                        } else if (p.type === 'array') {
                            prop.items = { type: 'string' };
                        }

                        return [p.name, prop];
                    })
                ),
                required: action.parameters.filter(p => p.required).map(p => p.name)
            }
        }));
    }

    /**
     * Build system prompt with context from readable contexts
     */
    private buildSystemPrompt(): string {
        const basePrompt = "You are a helpful UI assistant. You can use tools to generate UI components and interact with the application. When asked to show something or perform an action, use the appropriate tool.";

        const contextPrompt = this.client.buildContextPrompt();

        if (contextPrompt) {
            return `${basePrompt} \n\n${contextPrompt} `;
        }

        return basePrompt;
    }

    /**
     * Send a message to Claude and process the response.
     * Uses non-streaming for simplicity and reliability.
     */
    public async sendMessage(prompt: string) {
        try {
            const tools = this.buildTools();
            console.log("[ClaudeService] Using model:", this.modelName);
            console.log("[ClaudeService] Tools:", JSON.stringify(tools, null, 2));

            // Use non-streaming for more reliable tool use handling
            const response = await this.anthropic.messages.create({
                model: this.modelName,
                max_tokens: 4096,
                system: this.buildSystemPrompt(),
                tools,
                messages: [
                    { role: "user", content: prompt }
                ]
            });

            console.log("[ClaudeService] Response:", JSON.stringify(response, null, 2));

            // Process content blocks
            for (const block of response.content) {
                if (block.type === 'tool_use') {
                    const toolUseId = block.id;
                    const toolName = block.name;
                    const args = block.input as Record<string, unknown>;

                    console.log("[ClaudeService] Tool use:", toolName, args);

                    // Emit tool start event
                    this.client.ingest({
                        type: 'tool_start',
                        id: toolUseId,
                        name: toolName
                    });

                    // Emit tool complete event with args
                    this.client.ingest({
                        type: 'tool_complete',
                        id: toolUseId,
                        result: args
                    });

                    // Execute the registered action
                    try {
                        const actionResult = await this.client.executeAction(toolName, args);
                        console.log(`[ClaudeService] Action ${toolName} executed: `, actionResult);
                    } catch (e) {
                        console.log(`[ClaudeService] No registered handler for ${toolName}`);
                    }
                } else if (block.type === 'text') {
                    console.log("[ClaudeService] Text response:", block.text);
                }
            }

            console.log("[ClaudeService] Message complete, stop_reason:", response.stop_reason);

        } catch (error) {
            console.error("Claude Error:", error);
            throw error;
        }
    }

    /**
     * Simple chat method for plain text responses.
     * Used by Guard Dog and Decontextualizer.
     */
    public async chat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string> {
        try {
            const response = await this.anthropic.messages.create({
                model: this.modelName,
                max_tokens: options?.maxTokens || 1024,
                system: systemPrompt || "You are a helpful assistant.",
                messages: [{ role: "user", content: prompt }]
            });

            // Extract text from the response
            const textBlock = response.content.find(block => block.type === 'text');
            return textBlock && 'text' in textBlock ? textBlock.text : '';
        } catch (error) {
            console.error("[ClaudeService] Chat error:", error);
            throw error;
        }
    }

    /**
     * Configure File Search / RAG capabilities.
     * Note: Claude doesn't natively support file search like Gemini.
     */
    public setFileSearchConfig(config: FileSearchConfig): void {
        this._fileSearchConfig = config;
        // File search is stored for potential future Claude RAG integration
        void this._fileSearchConfig;
        console.log("[ClaudeService] File search config set:", config);
    }
}
