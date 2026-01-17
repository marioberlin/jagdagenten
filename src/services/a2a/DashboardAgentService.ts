import { LiquidClient } from '../../liquid-engine/client';

export class DashboardAgentService {
    private baseUrl: string;
    private onDataReceived?: (data: any) => void;

    constructor(baseUrl: string = 'http://localhost:3000', onDataReceived?: (data: any) => void) {
        this.baseUrl = baseUrl;
        this.onDataReceived = onDataReceived;
    }

    async sendMessage(text: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/agents/dashboard-builder/a2a`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: crypto.randomUUID(),
                    method: 'SendMessage',
                    params: {
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        contextId: 'demo-session',
                        message: {
                            id: crypto.randomUUID(),
                            contextId: 'demo-session',
                            role: 'user',
                            timestamp: new Date().toISOString(),
                            parts: [{ type: 'text', text }]
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Agent error: ${response.statusText}`);
            }

            const payload = await response.json();

            // Extract the text response from the artifact or result
            // The agent returns a result object with artifacts
            const result = payload.result;
            const dashboardArtifact = result.artifacts?.find((a: any) => a.name === 'dashboard');
            const textPart = dashboardArtifact?.parts.find((p: any) => p.type === 'text');
            const dataPart = dashboardArtifact?.parts.find((p: any) => p.type === 'data');

            const data = dataPart ? dataPart.data : null;

            if (data && this.onDataReceived) {
                this.onDataReceived(data);
            }

            return textPart ? textPart.text : "Received response.";

        } catch (error) {
            console.error('DashboardAgentService error:', error);
            throw error;
        }
    }

    setModel(model: string) {
        // No-op for this specific agent
    }
}
