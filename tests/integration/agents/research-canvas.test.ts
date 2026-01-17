import { describe, it, expect, beforeAll } from 'vitest';
import { handleResearchCanvasRequest } from '../../../server/src/agents/research-canvas';
import { SendMessageParams } from '../../../server/src/a2a/types';
import { randomUUID } from 'crypto';

describe('Research Canvas Agent', () => {
    // Only run if GEMINI_API_KEY is present
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Skipping Research Canvas tests: GEMINI_API_KEY not found');
        return;
    }

    const contextId = randomUUID();

    it('should initialize with default state', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId,
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Load canvas' }]
            }
        };

        const response = await handleResearchCanvasRequest(params);

        expect(response.status.state).toBe('completed');
        const data = response.artifacts[0].parts.find((p: any) => p.type === 'data')?.data;

        expect(data).toBeDefined();
        expect(data.topic).toBe('Artificial Intelligence in Healthcare');
        expect(data.blocks.length).toBeGreaterThan(0);
    });

    it('should add a new research block (text)', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId, // Same context to persist state
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Add a note about AI in radiology.' }]
            }
        };

        const response = await handleResearchCanvasRequest(params);
        const data = response.artifacts[0].parts.find((p: any) => p.type === 'data')?.data;

        expect(data.blocks.some((b: any) => b.content.toLowerCase().includes('radiology'))).toBe(true);
    });

    it('should update the research topic', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId,
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Change topic to Quantum Computing' }]
            }
        };

        const response = await handleResearchCanvasRequest(params);
        const data = response.artifacts[0].parts.find((p: any) => p.type === 'data')?.data;

        expect(data.topic).toBe('Quantum Computing');
    });

    it('should generate A2UI components', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId,
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Show me the content.' }]
            }
        };

        const response = await handleResearchCanvasRequest(params);
        const a2ui = response.artifacts[0].parts.find((p: any) => p.type === 'a2ui')?.a2ui;

        expect(a2ui).toBeDefined();
        expect(a2ui.length).toBeGreaterThan(0);
        // Check for Card components
        const hasCards = a2ui.some((msg: any) =>
            msg.type === 'surfaceUpdate' &&
            msg.components.some((c: any) => c.component.Card)
        );
        expect(hasCards).toBe(true);
    });
});
