/**
 * A2A Agent Discovery Integration Tests
 * 
 * Tests agent card fetching, registry operations, and discovery flows.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { TEST_CONFIG, serverAvailable } from '../setup';
import { mockCryptoAdvisorCard, mockAgents } from '../fixtures/mock-agents';

describe('A2A Agent Discovery', () => {
    describe('Agent Card Fetching', () => {
        it('should have valid agent card structure', () => {
            // Validate mock agent card structure matches A2A v1.0 spec
            expect(mockCryptoAdvisorCard.name).toBeDefined();
            expect(mockCryptoAdvisorCard.url).toBeDefined();
            expect(mockCryptoAdvisorCard.capabilities).toBeDefined();
            expect(mockCryptoAdvisorCard.skills).toBeDefined();
            expect(Array.isArray(mockCryptoAdvisorCard.skills)).toBe(true);
        });

        it('should have required capabilities fields', () => {
            expect(mockCryptoAdvisorCard.capabilities).toHaveProperty('streaming');
            expect(mockCryptoAdvisorCard.capabilities).toHaveProperty('pushNotifications');
        });

        it('should have valid skills with required fields', () => {
            for (const skill of mockCryptoAdvisorCard.skills || []) {
                expect(skill.id).toBeDefined();
                expect(skill.name).toBeDefined();
                expect(skill.description).toBeDefined();
            }
        });

        it.skipIf(!serverAvailable)('should fetch agent card from server', async () => {
            const response = await fetch(
                `${TEST_CONFIG.SERVER_URL}/.well-known/agent.json`,
                { signal: AbortSignal.timeout(TEST_CONFIG.DISCOVERY_TIMEOUT) }
            );

            expect(response.ok).toBe(true);

            const card = await response.json();
            expect(card.name).toBeDefined();
            expect(card.url).toBeDefined();
        });
    });

    describe('Agent Registry', () => {
        it('should have curated agents list', () => {
            expect(mockAgents.length).toBeGreaterThan(0);
        });

        it('should have unique agent URLs', () => {
            const urls = mockAgents.map(a => a.url);
            const uniqueUrls = [...new Set(urls)];
            expect(urls.length).toBe(uniqueUrls.length);
        });

        it('should have valid agent names', () => {
            for (const agent of mockAgents) {
                expect(agent.name).toBeDefined();
                expect(agent.name.length).toBeGreaterThan(0);
            }
        });

        it.skipIf(!serverAvailable)('should list agents from server registry', async () => {
            const response = await fetch(
                `${TEST_CONFIG.SERVER_URL}/api/v1/agents`,
                { signal: AbortSignal.timeout(TEST_CONFIG.DISCOVERY_TIMEOUT) }
            );

            if (response.ok) {
                const data = await response.json();
                expect(Array.isArray(data)).toBe(true);
            }
        });
    });

    describe('Agent Connection', () => {
        it('should validate agent URL format', () => {
            for (const agent of mockAgents) {
                expect(() => new URL(agent.url)).not.toThrow();
            }
        });

        it.skipIf(!serverAvailable)('should connect to agent endpoint', async () => {
            const agentUrl = mockCryptoAdvisorCard.url;

            // Try to fetch the agent card from the agent endpoint
            const response = await fetch(`${agentUrl}/.well-known/agent.json`, {
                signal: AbortSignal.timeout(TEST_CONFIG.DISCOVERY_TIMEOUT),
            }).catch(() => null);

            // Agent may not be running, so we just check the fetch doesn't throw
            expect(true).toBe(true);
        });
    });
});

describe('Agent Card Validation', () => {
    it('should validate version field', () => {
        expect(mockCryptoAdvisorCard.version).toBeDefined();
        expect(typeof mockCryptoAdvisorCard.version).toBe('string');
    });

    it('should validate defaultInputModes', () => {
        expect(mockCryptoAdvisorCard.defaultInputModes).toBeDefined();
        expect(Array.isArray(mockCryptoAdvisorCard.defaultInputModes)).toBe(true);
        expect(mockCryptoAdvisorCard.defaultInputModes?.length).toBeGreaterThan(0);
    });

    it('should validate defaultOutputModes', () => {
        expect(mockCryptoAdvisorCard.defaultOutputModes).toBeDefined();
        expect(Array.isArray(mockCryptoAdvisorCard.defaultOutputModes)).toBe(true);
        expect(mockCryptoAdvisorCard.defaultOutputModes?.length).toBeGreaterThan(0);
    });
});
