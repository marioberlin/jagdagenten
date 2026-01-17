import { describe, it, expect } from 'vitest';
import { handleAIResearcherRequest } from '../../../server/src/agents/ai-researcher';
import { SendMessageParams } from '../../../server/src/a2a/types';
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
                    // Strip quotes if present
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

describe('AI Researcher Agent', () => {
    // Only run if GEMINI_API_KEY is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('Skipping AI Researcher tests: GEMINI_API_KEY not found');
        return;
    }

    const contextId = randomUUID();

    it('should initialize with default state', async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            contextId,
            timestamp: new Date().toISOString(),
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Hello, are you ready to research?' }]
            }
        };

        const response = await handleAIResearcherRequest(params);

        expect(response.status.state).toBe('completed');
        expect(response.artifacts).toBeDefined();

        const textPart = response.artifacts[0].parts.find((p: any) => p.type === 'text');
        expect(textPart).toBeDefined();
    });

    it('should perform a web search and extract facts', { timeout: 30000 }, async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            contextId, // Use same context
            timestamp: new Date().toISOString(),
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Search for quantum computing advancements.' }]
            }
        };

        const response = await handleAIResearcherRequest(params);
        expect(response.status.state).toBe('completed');

        // Check text response mentions found results
        const textPart = response.artifacts[0].parts.find((p: any) => p.type === 'text');
        expect(textPart.text).toContain('Found');

        // Check data state
        const dataPart = response.artifacts[0].parts.find((p: any) => p.type === 'data');
        expect(dataPart).toBeDefined();
        expect(dataPart.data.results.length).toBeGreaterThan(0);
        expect(dataPart.data.query).toContain('quantum');

        // Now extract facts
        const paramsExtract: SendMessageParams = {
            id: randomUUID(),
            contextId,
            timestamp: new Date().toISOString(),
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Extract key facts from these results.' }]
            }
        };

        const responseExtract = await handleAIResearcherRequest(paramsExtract);
        expect(responseExtract.status.state).toBe('completed');

        // Check data state for facts
        const dataPartExtract = responseExtract.artifacts[0].parts.find((p: any) => p.type === 'data');
        expect(dataPartExtract.data.facts.length).toBeGreaterThan(0);
        expect(dataPartExtract.data.facts[0].confidence).toBeDefined();
    });

    it('should generate A2UI components', { timeout: 30000 }, async () => {
        const params: SendMessageParams = {
            id: randomUUID(),
            contextId,
            timestamp: new Date().toISOString(),
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Show me the research dashboard.' }]
            }
        };

        const response = await handleAIResearcherRequest(params);

        const a2uiPart = response.artifacts[0].parts.find((p: any) => p.type === 'a2ui');
        expect(a2uiPart).toBeDefined();
        expect(a2uiPart.a2ui.length).toBeGreaterThan(0);

        const surfaceUpdate = a2uiPart.a2ui.find((msg: any) => msg.type === 'surfaceUpdate');
        expect(surfaceUpdate).toBeDefined();
        expect(surfaceUpdate.surfaceId).toBe('researcher-main');
    });

    it('should delete a search result', async () => {
        // First get current state to find an ID to delete
        const paramsGet: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId, // Same session
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: 'Get status' }]
            }
        };
        const responseGet = await handleAIResearcherRequest(paramsGet);
        const data = responseGet.artifacts[0].parts.find((p: any) => p.type === 'data')?.data;

        // We should have results from previous test
        if (data.results.length === 0) {
            console.warn('Skipping delete test: no results found (search test might have failed)');
            return;
        }

        const resultId = data.results[0].id;
        const originalCount = data.results.length;

        const paramsDelete: SendMessageParams = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            contextId,
            message: {
                id: randomUUID(),
                contextId,
                role: 'user',
                timestamp: new Date().toISOString(),
                parts: [{ type: 'text', text: `Delete result with ID ${resultId}` }]
            }
        };

        const responseDelete = await handleAIResearcherRequest(paramsDelete);
        expect(responseDelete.status.state).toBe('completed');

        const dataAfter = responseDelete.artifacts[0].parts.find((p: any) => p.type === 'data')?.data;
        expect(dataAfter.results.length).toBe(originalCount - 1);
        expect(dataAfter.results.find((r: any) => r.id === resultId)).toBeUndefined();
    });
});
