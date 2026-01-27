import { describe, it, expect } from 'vitest';
import { handleDashboardBuilderRequest } from '../../../server/src/agents/dashboard-builder';
import type { SendMessageParams } from '../../../server/src/a2a/types';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

// Load .env manually if needed
if (!process.env.GEMINI_API_KEY) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    let key = match[1].trim();
                    let value = match[2].trim();
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    process.env[key] = value;
                }
            });
        }
    } catch (e) {
        console.warn('Could not load .env file', e);
    }
}

// Only run if GEMINI_API_KEY is present
const hasApiKey = !!process.env.GEMINI_API_KEY;
const describeIfApiKey = hasApiKey ? describe : describe.skip;

describeIfApiKey('Dashboard Builder Agent', () => {

    const contextId = randomUUID();

    it('should create a widget based on natural language', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId, // Keep same context
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Create a sales widget with value $10,000' }]
            }
        };

        const response = await handleDashboardBuilderRequest(params);

        const dashboardArtifact = response.artifacts?.find(a => a.name === 'dashboard');
        const a2uiPart = dashboardArtifact?.parts.find(p => p.type === 'a2ui');

        const json = JSON.stringify(a2uiPart);
        // LLM creates "Sales" title often
        expect(json.toLowerCase()).toContain('sales');
        // Expect user provided value
        expect(json).toContain('$10,000');
    });

    it('should update state and persist changes in same context', async () => {
        // Send updates
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId, // Same context
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Update sales to $150k' }]
            }
        };

        const response = await handleDashboardBuilderRequest(params);
        const json = JSON.stringify(response);
        // LLM output is non-deterministic (either $150k or $150,000)
        const success = json.includes('$150k') || json.includes('$150,000');
        expect(success).toBe(true);
    });

    it('should handle vague create requests (infer default type)', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId,
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Add widget orders' }]
            }
        };

        const response = await handleDashboardBuilderRequest(params);
        const json = JSON.stringify(response);
        // Should have created a new widget with title "Orders" and default type "metric"
        expect(json.toLowerCase()).toContain('orders');
        expect(json).toContain('"type":"metric"');
    });

    it('should remove a widget', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId, // Same context
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Remove the last widget' }]
            }
        };

        const response = await handleDashboardBuilderRequest(params);
        const artifact = response.artifacts?.[0];
        const textPart = artifact?.parts.find(p => p.type === 'text');

        // Expect either "Deleted" or "Removed" in the response text
        const text = (textPart as any).text.toLowerCase();
        const success = text.includes('deleted') || text.includes('removed');
        expect(success).toBe(true);
    });

    it('should handle arithmetic updates (add 5 orders)', async () => {
        const newContextId = randomUUID();
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId: newContextId,
            message: {
                id: randomUUID(),
                contextId: newContextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Add 5 orders' }]
            }
        };

        // Note: The default state has 'Orders' with value '1,247'
        const response = await handleDashboardBuilderRequest(params);

        const dashboard = response.artifacts?.find(a => a.name === 'dashboard');
        const data = dashboard?.parts.find(p => p.type === 'data')?.data;

        // Find the Orders widget
        const ordersWidget = data.find((w: any) => w.title === 'Orders');

        expect(ordersWidget).toBeDefined();
        // 1247 + 5 = 1252
        // We expect the backend logic to handle the math
        expect(ordersWidget.value.toString().replace(/,/g, '')).toBe('1252');
    });
});
