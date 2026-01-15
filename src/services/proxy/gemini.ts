import { LiquidClient } from "../../liquid-engine/client";
import { ILiquidLLMService, FileSearchConfig, ChatOptions } from "../types";

export class GeminiProxyService implements ILiquidLLMService {
    private client: LiquidClient;
    private modelName: string = "gemini-2.0-flash";
    private baseUrl: string;
    private _fileSearchConfig: FileSearchConfig = { enabled: false, stores: [] };

    constructor(client: LiquidClient, baseUrl: string = "http://localhost:3000") {
        this.client = client;
        this.baseUrl = baseUrl;
    }

    public setModel(modelName: string) {
        this.modelName = modelName;
    }

    public setFileSearchConfig(config: FileSearchConfig): void {
        this._fileSearchConfig = config;
        // Stored for potential backend-side file search integration
        void this._fileSearchConfig;
    }

    public async chat(prompt: string, systemPrompt?: string, _options?: ChatOptions): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'gemini',
                    model: this.modelName,
                    prompt,
                    systemPrompt: systemPrompt || "You are a helpful assistant.",
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Backend Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.text || '';
        } catch (error) {
            console.error("[GeminiProxyService] Chat error:", error);
            throw error;
        }
    }

    public async sendMessage(prompt: string): Promise<void> {
        const context = this.client.buildContextPrompt();

        // Convert Liquid Actions to generic tool definitions for the backend
        // Note: In a real implementation, we might send the full schema.
        // For this demo, we assume the backend re-negotiates or we pass a lightweight definition.
        const tools = this.client.buildFunctionDeclarations();

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'gemini',
                    model: this.modelName,
                    prompt,
                    context,
                    tools: [{ functionDeclarations: tools }]
                })
            });

            if (!response.ok || !response.body) {
                throw new Error(`Backend Error: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        // primitive parsing
                        const eventType = line.split('\n')[0].replace('event: ', '');
                        const dataLine = line.split('\n')[1];

                        if (dataLine && dataLine.startsWith('data: ')) {
                            const data = JSON.parse(dataLine.replace('data: ', ''));

                            if (eventType === 'tool_call') {
                                // Ingest tool event directly
                                await this.handleToolEvent(data);
                            } else if (eventType === 'chunk') {
                                // For now, just log or handle text delta if UI supported it
                                // console.log('Chunk:', data.delta);
                            } else if (eventType === 'error') {
                                console.error('Proxy Stream Error:', data.message);
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error("GeminiProxyService Error:", error);
            throw error;
        }
    }

    private async handleToolEvent(event: any) {
        this.client.ingest(event);

        // If tool complete, execute action logic (Client-side execution still required)
        // Note: In a pure backend setup, the backend might execute the tool? 
        // But Liquid Engine philosophy is "Client-side execution".
        // So the backend gives us the "Call", we "Execute", and ideally we'd report back?
        // Current Liquid Loop: AI calls tool -> Client executes -> Client updates state?
        // For this Proxy implementation, we are just mirroring the "Ingest" flow.

        if (event.type === 'tool_complete') {
            const toolState = this.client.getToolState(event.id);
            if (toolState) {
                try {
                    await this.client.executeAction(toolState.name, toolState.args);
                } catch (e) {
                    console.error("Action execution failed", e);
                }
            }
        }
    }
}

