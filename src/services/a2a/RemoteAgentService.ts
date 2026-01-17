import { ILiquidLLMService, ChatOptions, ToolSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class RemoteAgentService implements ILiquidLLMService {
    private url: string;
    private authToken: string;
    private contextId: string;
    private onDataUpdate?: (data: any) => void;
    private modelName: string = 'remote-agent';

    constructor(
        url: string,
        authToken: string,
        contextId: string = 'default',
        onDataUpdate?: (data: any) => void
    ) {
        this.url = url;
        this.authToken = authToken;
        this.contextId = contextId;
        this.onDataUpdate = onDataUpdate;
    }

    /**
     * Set the model - No-op for remote agents as they decide their own model
     */
    setModel(modelName: string): void {
        this.modelName = modelName;
    }

    /**
     * Configure file search - No-op for now
     */
    setFileSearchConfig(config: any): void {
        // Not implemented
    }

    /**
     * Chat method for simple interactions
     */
    async chat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string> {
        return this.sendMessage(prompt);
    }

    async sendMessage(prompt: string): Promise<string> {
        try {
            // Ensure URL ends with slash if needed, or handle it robustly
            // The user provided URL ends with slash
            const endpoint = this.url;

            console.log(`[RemoteAgent] Sending message to ${endpoint}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'SendMessage',
                    id: uuidv4(),
                    params: {
                        id: uuidv4(),
                        timestamp: new Date().toISOString(),
                        contextId: this.contextId,
                        message: {
                            messageId: uuidv4(),
                            contextId: this.contextId,
                            role: 'user',
                            timestamp: new Date().toISOString(),
                            parts: [{ text: prompt }]
                        }
                    }
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Remote Agent Error: ${response.status} ${response.statusText} - ${text}`);
            }

            const json = await response.json();

            if (json.error) {
                throw new Error(json.error.message || 'Unknown remote agent error');
            }

            const result = json.result;
            const artifacts = result.artifacts || [];
            const history = result.history || [];

            // v1.0: Extract text response from artifacts
            let textPart = artifacts
                .flatMap((a: any) => a.parts)
                .find((p: any) => p.text !== undefined);

            // v0.x fallback: Extract from history (last agent message)
            if (!textPart && history.length > 0) {
                const agentMessages = history.filter((m: any) => m.role === 'agent');
                const lastAgentMessage = agentMessages[agentMessages.length - 1];
                if (lastAgentMessage && lastAgentMessage.parts) {
                    textPart = lastAgentMessage.parts.find((p: any) => p.text !== undefined || p.kind === 'text');
                }
            }

            // Extract data update (side-channel)
            const dataPart = artifacts
                .flatMap((a: any) => a.parts)
                .find((p: any) => p.data !== undefined);

            if (dataPart && this.onDataUpdate) {
                this.onDataUpdate(dataPart.data);
            }

            return textPart ? textPart.text : "Agent processed request.";

        } catch (error) {
            console.error('Remote Agent Connection Error:', error);
            // Return error as string to be displayed in chat
            return `Connection Error: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
