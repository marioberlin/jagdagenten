/**
 * Alexa Executor Unit Tests
 */
import { describe, it, expect, beforeEach } from 'bun:test';
import { AlexaExecutor, getAlexaAgentCard } from '../../server/src/a2a/executors/alexa.js';
import { v1 } from '@jagdagenten/a2a-sdk';

describe('AlexaExecutor', () => {
    let executor: AlexaExecutor;

    beforeEach(() => {
        executor = new AlexaExecutor();
    });

    describe('execute()', () => {
        const createMessage = (text: string): v1.Message => ({
            messageId: 'test-msg-1',
            role: v1.Role.USER,
            parts: [{ text }],
        });

        const createContext = (): any => ({
            contextId: 'test-context',
            taskId: 'test-task',
            metadata: {},
        });

        it('should handle shopping list add intent', async () => {
            const message = createMessage('Add milk to my shopping list');
            const context = createContext();

            const result = await executor.execute(message, context);

            expect(result.status).toBe(v1.TaskState.COMPLETED);
            expect(result.message).toBeDefined();
            const textPart = result.message?.parts[0] as v1.TextPart;
            expect(textPart.text).toContain('milk');
            expect(textPart.text).toContain('shopping list');
        });

        it('should handle shopping list query', async () => {
            const message = createMessage("What's on my shopping list?");
            const context = createContext();

            const result = await executor.execute(message, context);

            expect(result.status).toBe(v1.TaskState.COMPLETED);
            expect(result.message).toBeDefined();
            const textPart = result.message?.parts[0] as v1.TextPart;
            expect(textPart.text).toContain('shopping list');
        });

        it('should handle calendar today query', async () => {
            const message = createMessage("What's on my calendar today?");
            const context = createContext();

            const result = await executor.execute(message, context);

            expect(result.status).toBe(v1.TaskState.COMPLETED);
            expect(result.message).toBeDefined();
            const textPart = result.message?.parts[0] as v1.TextPart;
            expect(textPart.text).toContain('Today');
        });

        it('should handle calendar tomorrow query', async () => {
            const message = createMessage("What's scheduled for tomorrow?");
            const context = createContext();

            const result = await executor.execute(message, context);

            expect(result.status).toBe(v1.TaskState.COMPLETED);
            expect(result.message).toBeDefined();
            const textPart = result.message?.parts[0] as v1.TextPart;
            expect(textPart.text).toContain('Tomorrow');
        });

        it('should handle weather query', async () => {
            const message = createMessage("What's the weather?");
            const context = createContext();

            const result = await executor.execute(message, context);

            expect(result.status).toBe(v1.TaskState.COMPLETED);
            expect(result.message).toBeDefined();
            const textPart = result.message?.parts[0] as v1.TextPart;
            expect(textPart.text).toContain('Seattle');
            expect(textPart.text).toContain('65');
        });

        it('should handle contacts query', async () => {
            const message = createMessage('Show my contacts');
            const context = createContext();

            const result = await executor.execute(message, context);

            expect(result.status).toBe(v1.TaskState.COMPLETED);
            expect(result.message).toBeDefined();
            const textPart = result.message?.parts[0] as v1.TextPart;
            expect(textPart.text).toContain('contacts');
        });

        it('should return dashboard for generic queries', async () => {
            const message = createMessage('Hello Alexa');
            const context = createContext();

            const result = await executor.execute(message, context);

            expect(result.status).toBe(v1.TaskState.COMPLETED);
            expect(result.message).toBeDefined();
        });
    });

    describe('getAlexaAgentCard()', () => {
        it('should return a valid agent card', () => {
            const baseUrl = 'http://localhost:3000';
            const card = getAlexaAgentCard(baseUrl);

            expect(card.name).toBe('Alexa+');
            expect(card.url).toBe(`${baseUrl}/a2a`);
            expect(card.protocolVersion).toBe('1.0');
            expect(card.skills).toHaveLength(5);
        });

        it('should have calendar skill', () => {
            const card = getAlexaAgentCard('http://localhost:3000');
            const calendarSkill = card.skills?.find(s => s.id === 'alexa-calendar');

            expect(calendarSkill).toBeDefined();
            expect(calendarSkill?.name).toBe('Calendar');
            expect(calendarSkill?.tags).toContain('calendar');
        });

        it('should have shopping skill', () => {
            const card = getAlexaAgentCard('http://localhost:3000');
            const shoppingSkill = card.skills?.find(s => s.id === 'alexa-shopping');

            expect(shoppingSkill).toBeDefined();
            expect(shoppingSkill?.name).toBe('Shopping List');
            expect(shoppingSkill?.tags).toContain('shopping');
        });

        it('should have weather skill', () => {
            const card = getAlexaAgentCard('http://localhost:3000');
            const weatherSkill = card.skills?.find(s => s.id === 'alexa-weather');

            expect(weatherSkill).toBeDefined();
            expect(weatherSkill?.name).toBe('Weather');
            expect(weatherSkill?.tags).toContain('weather');
        });
    });
});
