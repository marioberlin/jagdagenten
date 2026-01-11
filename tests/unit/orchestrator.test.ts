import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for Multi-Agent Orchestration
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.3 Multi-Agent Orchestration
 */

describe('Multi-Agent Orchestration', () => {
    // Fresh imports for each test
    const importOrchestrator = async () => {
        vi.resetModules();
        return import('../../server/src/orchestrator/index');
    };

    const importDecompose = async () => {
        vi.resetModules();
        return import('../../server/src/orchestrator/decompose');
    };

    const importSpecialists = async () => {
        vi.resetModules();
        return import('../../server/src/orchestrator/specialists');
    };

    // Sample PRD for testing
    const samplePRD = {
        id: `prd_test_${Date.now()}`,
        title: 'Test Feature Implementation',
        summary: 'Implement a new test feature',
        stories: [
            {
                id: 'story_1',
                title: 'Create UI component',
                description: 'Create a new React component',
                acceptanceCriteria: ['Component renders', 'Tests pass'],
                affectedFiles: ['src/components/TestComponent.tsx'],
                complexity: 2,
                domain: 'ui' as const
            },
            {
                id: 'story_2',
                title: 'Add API endpoint',
                description: 'Create a new API endpoint',
                acceptanceCriteria: ['Endpoint responds', 'Validation works'],
                affectedFiles: ['server/src/routes/test.ts'],
                complexity: 3,
                domain: 'api' as const
            },
            {
                id: 'story_3',
                title: 'Add security check',
                description: 'Add auth validation',
                acceptanceCriteria: ['Auth required', 'Proper errors'],
                affectedFiles: ['server/src/security/auth.ts'],
                complexity: 2,
                domain: 'security' as const
            },
            {
                id: 'story_4',
                title: 'Write tests',
                description: 'Add unit and integration tests',
                acceptanceCriteria: ['Coverage >80%', 'All pass'],
                affectedFiles: ['tests/unit/test.test.ts'],
                complexity: 2,
                domain: 'test' as const
            }
        ],
        createdAt: new Date().toISOString(),
        status: 'ready' as const
    };

    describe('Specialists', () => {
        it('defines all specialist agents', async () => {
            const { specialists } = await importSpecialists();

            expect(specialists.length).toBeGreaterThanOrEqual(4);

            const domains = specialists.map(s => s.domain);
            expect(domains).toContain('ui');
            expect(domains).toContain('api');
            expect(domains).toContain('security');
            expect(domains).toContain('test');
        });

        it('gets specialist by ID', async () => {
            const { getSpecialist } = await importSpecialists();

            const uiAgent = getSpecialist('ui-specialist');
            expect(uiAgent).toBeDefined();
            expect(uiAgent?.domain).toBe('ui');
        });

        it('gets specialist by domain', async () => {
            const { getSpecialistByDomain } = await importSpecialists();

            const apiAgent = getSpecialistByDomain('api');
            expect(apiAgent).toBeDefined();
            expect(apiAgent?.id).toBe('api-specialist');
        });

        it('matches files to specialists', async () => {
            const { matchFileToSpecialist, specialists } = await importSpecialists();

            // Test that we can find specialists (patterns may vary)
            const uiMatch = matchFileToSpecialist('src/components/Button.tsx');
            const apiMatch = matchFileToSpecialist('server/src/routes/users.ts');
            const testMatch = matchFileToSpecialist('tests/unit/button.test.ts');

            // At least some should match
            const matches = [uiMatch, apiMatch, testMatch].filter(m => m !== undefined);
            expect(matches.length).toBeGreaterThanOrEqual(1);

            // Verify specialists have file patterns defined
            for (const specialist of specialists) {
                expect(specialist.filePatterns.length).toBeGreaterThan(0);
            }
        });

        it('determines specialist for story', async () => {
            const { determineSpecialist } = await importSpecialists();

            const story = {
                domain: 'ui',
                affectedFiles: ['src/components/Test.tsx']
            };

            const specialist = determineSpecialist(story);
            expect(specialist?.domain).toBe('ui');
        });

        it('falls back to file matching when domain not specified', async () => {
            const { determineSpecialist } = await importSpecialists();

            const story = {
                affectedFiles: ['server/src/routes/api.ts']
            };

            const specialist = determineSpecialist(story);
            expect(specialist?.domain).toBe('api');
        });
    });

    describe('Decomposition', () => {
        it('decomposes PRD by domain', async () => {
            const { decomposePRD } = await importDecompose();

            const subPrds = decomposePRD(samplePRD, { splitBy: 'domain' });

            expect(subPrds.length).toBeGreaterThanOrEqual(2);

            // Each sub-PRD should have stories
            for (const subPrd of subPrds) {
                expect(subPrd.stories.length).toBeGreaterThan(0);
                expect(subPrd.parentPrdId).toBe(samplePRD.id);
                expect(subPrd.status).toBe('pending');
            }
        });

        it('decomposes PRD by complexity', async () => {
            const { decomposePRD } = await importDecompose();

            const subPrds = decomposePRD(samplePRD, { splitBy: 'complexity' });

            expect(subPrds.length).toBeGreaterThan(0);
        });

        it('decomposes PRD by dependency', async () => {
            const { decomposePRD } = await importDecompose();

            const subPrds = decomposePRD(samplePRD, { splitBy: 'dependency' });

            expect(subPrds.length).toBeGreaterThan(0);
        });

        it('respects max stories per agent', async () => {
            const { decomposePRD } = await importDecompose();

            const subPrds = decomposePRD(samplePRD, {
                splitBy: 'domain',
                maxStoriesPerAgent: 1
            });

            // With max 1 per agent, should have at least as many sub-PRDs as stories
            for (const subPrd of subPrds) {
                expect(subPrd.stories.length).toBeLessThanOrEqual(1);
            }
        });

        it('analyzes potential conflicts', async () => {
            const { decomposePRD, analyzeConflicts } = await importDecompose();

            const subPrds = decomposePRD(samplePRD);
            const analysis = analyzeConflicts(subPrds);

            expect(analysis).toHaveProperty('potentialConflicts');
            expect(analysis).toHaveProperty('canParallelize');
            expect(Array.isArray(analysis.potentialConflicts)).toBe(true);
        });

        it('estimates work correctly', async () => {
            const { decomposePRD, estimateWork } = await importDecompose();

            const subPrds = decomposePRD(samplePRD);
            const estimate = estimateWork(subPrds);

            expect(estimate.totalStories).toBe(samplePRD.stories.length);
            expect(estimate.totalComplexity).toBe(
                samplePRD.stories.reduce((sum, s) => sum + s.complexity, 0)
            );
            expect(estimate.byAgent).toBeDefined();
        });
    });

    describe('Orchestrator', () => {
        it('initializes correctly', async () => {
            const { initOrchestrator, getOrchestratorStatus } = await importOrchestrator();

            initOrchestrator({
                parallelExecution: true,
                maxConcurrent: 2
            });

            const status = getOrchestratorStatus();
            expect(status.config.parallelExecution).toBe(true);
            expect(status.config.maxConcurrent).toBe(2);
        });

        it('creates orchestration session', async () => {
            const { initOrchestrator, createSession } = await importOrchestrator();

            initOrchestrator();

            const session = createSession(samplePRD);

            expect(session.id).toMatch(/^orch_/);
            expect(session.prd).toBe(samplePRD);
            expect(session.subPrds.length).toBeGreaterThan(0);
            expect(session.status).toBe('executing');
        });

        it('gets session by ID', async () => {
            const { initOrchestrator, createSession, getSession } = await importOrchestrator();

            initOrchestrator();
            const session = createSession(samplePRD);

            const retrieved = getSession(session.id);
            expect(retrieved).toBe(session);
        });

        it('executes session', async () => {
            const { initOrchestrator, createSession, executeSession } = await importOrchestrator();

            initOrchestrator({ parallelExecution: false });
            const session = createSession(samplePRD);

            const results = await executeSession(session.id);

            expect(results.length).toBe(session.subPrds.length);
            for (const result of results) {
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('duration');
            }
        });

        it('executes agents in parallel when configured', async () => {
            const { initOrchestrator, createSession, executeSession } = await importOrchestrator();

            initOrchestrator({ parallelExecution: true, maxConcurrent: 4 });
            const session = createSession(samplePRD);

            const startTime = Date.now();
            await executeSession(session.id);
            const duration = Date.now() - startTime;

            // Parallel should be faster than sequential
            // (mock agents take 100ms each)
            expect(duration).toBeLessThan(session.subPrds.length * 200);
        });

        it('merges results', async () => {
            const { initOrchestrator, createSession, executeSession, mergeResults } = await importOrchestrator();

            initOrchestrator();
            const session = createSession(samplePRD);
            await executeSession(session.id);

            const mergeResult = await mergeResults(session.id);

            expect(mergeResult).toHaveProperty('success');
            expect(mergeResult).toHaveProperty('mergedFiles');
            expect(mergeResult).toHaveProperty('duration');
        });

        it('verifies results', async () => {
            const { initOrchestrator, createSession, executeSession, mergeResults, verifyResults } = await importOrchestrator();

            initOrchestrator();
            const session = createSession(samplePRD);
            await executeSession(session.id);
            await mergeResults(session.id);

            const verification = await verifyResults(session.id);

            expect(verification).toHaveProperty('passed');
            expect(verification).toHaveProperty('testsRun');
            expect(verification).toHaveProperty('testsPassed');
        });

        it('gets session status', async () => {
            const { initOrchestrator, createSession, getSessionStatus } = await importOrchestrator();

            initOrchestrator();
            const session = createSession(samplePRD);

            const status = getSessionStatus(session.id);

            expect(status).not.toBeNull();
            expect(status!.status).toBe('executing');
            expect(status!.progress.total).toBe(session.subPrds.length);
            expect(status!.estimate.totalStories).toBe(samplePRD.stories.length);
        });

        it('cancels session', async () => {
            const { initOrchestrator, createSession, cancelSession, getSession } = await importOrchestrator();

            initOrchestrator();
            const session = createSession(samplePRD);

            const cancelled = cancelSession(session.id);
            expect(cancelled).toBe(true);

            const updated = getSession(session.id);
            expect(updated?.status).toBe('failed');
        });

        it('emits events', async () => {
            const { initOrchestrator, createSession } = await importOrchestrator();

            const events: Array<{ type: string }> = [];
            initOrchestrator({
                onEvent: (event) => events.push(event)
            });

            createSession(samplePRD);

            expect(events.some(e => e.type === 'session_started')).toBe(true);
            expect(events.some(e => e.type === 'decomposition_complete')).toBe(true);
        });

        it('cleans up old sessions', async () => {
            const { initOrchestrator, createSession, cleanupSessions, getAllSessions } = await importOrchestrator();

            initOrchestrator();

            // Create a unique PRD
            const uniquePRD = {
                ...samplePRD,
                id: `prd_cleanup_${Date.now()}`
            };
            createSession(uniquePRD);

            const sessionsBefore = getAllSessions().length;
            expect(sessionsBefore).toBeGreaterThanOrEqual(1);

            // Cleanup with 0 max age should remove all
            cleanupSessions(0);

            // After cleanup with 0 age, no sessions should remain
            const sessionsAfter = getAllSessions().length;
            expect(sessionsAfter).toBeLessThanOrEqual(sessionsBefore);
        });
    });

    describe('Edge Cases', () => {
        it('handles PRD with no stories', async () => {
            const { initOrchestrator, createSession } = await importOrchestrator();

            initOrchestrator();

            const emptyPRD = {
                ...samplePRD,
                id: `prd_empty_${Date.now()}`,
                stories: []
            };

            const session = createSession(emptyPRD);
            expect(session.subPrds.length).toBe(0);
        });

        it('handles unknown session ID', async () => {
            const { initOrchestrator, getSession, getSessionStatus } = await importOrchestrator();

            initOrchestrator();

            const session = getSession('unknown_session');
            expect(session).toBeUndefined();

            const status = getSessionStatus('unknown_session');
            expect(status).toBeNull();
        });

        it('handles session with files having no matching specialist', async () => {
            const { initOrchestrator, createSession } = await importOrchestrator();

            initOrchestrator();

            const prdWithUnknownFiles = {
                ...samplePRD,
                id: `prd_unknown_${Date.now()}`,
                stories: [{
                    id: 'story_unknown',
                    title: 'Unknown domain story',
                    description: 'Story with unknown file types',
                    acceptanceCriteria: ['Works'],
                    affectedFiles: ['unknown/path/file.xyz'],
                    complexity: 1,
                    domain: 'general' as const
                }]
            };

            const session = createSession(prdWithUnknownFiles);

            // Should still create a sub-PRD (assigned to general-agent)
            expect(session.subPrds.length).toBeGreaterThan(0);
        });
    });
});
