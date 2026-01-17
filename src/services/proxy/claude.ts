import { LiquidClient } from "../../liquid-engine/client";
import { ILiquidLLMService, FileSearchConfig, ChatOptions } from "../types";

/**
 * ClaudeProxyService - Secure Claude integration via backend proxy.
 * 
 * Unlike ClaudeService, this does NOT require API keys in the frontend.
 * All requests are routed through the backend at /api/chat.
 */
export class ClaudeProxyService implements ILiquidLLMService {
    private client: LiquidClient;
    private modelName: string = "claude-sonnet-4-5-20241022";
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
        void this._fileSearchConfig;
    }

    /**
     * Simple chat for text responses (no tool calling).
     */
    public async chat(prompt: string, systemPrompt?: string, _options?: ChatOptions): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'claude',
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
            console.error("[ClaudeProxyService] Chat error:", error);
            throw error;
        }
    }

    /**
     * Send message with tool calling support.
     */
    public async sendMessage(prompt: string): Promise<string> {
        const context = this.client.buildContextPrompt();
        const tools = this.client.buildFunctionDeclarations();
        let fullResponseText = '';

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'claude',
                    model: this.modelName,
                    prompt,
                    context,
                    tools
                })
            });

            if (!response.ok || !response.body) {
                throw new Error(`Backend Error: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        const eventType = line.split('\n')[0].replace('event: ', '');
                        const dataLine = line.split('\n')[1];

                        if (dataLine && dataLine.startsWith('data: ')) {
                            const data = JSON.parse(dataLine.replace('data: ', ''));

                            if (eventType === 'tool_call') {
                                await this.handleToolEvent(data);
                            } else if (eventType === 'chunk') {
                                if (data.delta) {
                                    fullResponseText += data.delta;
                                }
                            } else if (eventType === 'error') {
                                console.error('Claude Proxy Stream Error:', data.message);
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error("ClaudeProxyService Error:", error);
            throw error;
        }

        return fullResponseText;
    }

    private async handleToolEvent(event: any) {
        this.client.ingest(event);

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
