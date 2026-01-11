/**
 * PRD Decomposition
 *
 * Splits a PRD into sub-PRDs for specialist agents.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.3 Multi-Agent Orchestration
 */

import { randomUUID } from 'crypto';
import type {
    PRD,
    PRDStory,
    SubPRD,
    DecompositionStrategy
} from './types.js';
import { determineSpecialist, specialists } from './specialists.js';
import { componentLoggers } from '../logger.js';

const orchestratorLog = componentLoggers.http;

/**
 * Default decomposition strategy
 */
const DEFAULT_STRATEGY: DecompositionStrategy = {
    name: 'domain-based',
    splitBy: 'domain',
    maxStoriesPerAgent: 5,
    allowParallel: true
};

/**
 * Decompose a PRD into sub-PRDs for specialists
 */
export function decomposePRD(
    prd: PRD,
    strategy: Partial<DecompositionStrategy> = {}
): SubPRD[] {
    const strat = { ...DEFAULT_STRATEGY, ...strategy };

    orchestratorLog.info({
        prdId: prd.id,
        strategy: strat.name,
        storiesCount: prd.stories.length
    }, 'Starting PRD decomposition');

    switch (strat.splitBy) {
        case 'domain':
            return decomposeByDomain(prd, strat);
        case 'file':
            return decomposeByFile(prd, strat);
        case 'complexity':
            return decomposeByComplexity(prd, strat);
        case 'dependency':
            return decomposeByDependency(prd, strat);
        default:
            return decomposeByDomain(prd, strat);
    }
}

/**
 * Decompose by domain (UI, API, Security, Test)
 */
function decomposeByDomain(
    prd: PRD,
    strategy: DecompositionStrategy
): SubPRD[] {
    const now = new Date().toISOString();
    const storiesByAgent = new Map<string, PRDStory[]>();

    // Assign each story to a specialist
    for (const story of prd.stories) {
        const specialist = determineSpecialist(story);
        const agentId = specialist?.id || 'general-agent';

        const existing = storiesByAgent.get(agentId) || [];
        existing.push(story);
        storiesByAgent.set(agentId, existing);
    }

    // Create sub-PRDs for each agent
    const subPrds: SubPRD[] = [];

    for (const [agentId, stories] of storiesByAgent) {
        // Split if too many stories for one agent
        const chunks = chunkArray(stories, strategy.maxStoriesPerAgent);

        for (let i = 0; i < chunks.length; i++) {
            const subPrd: SubPRD = {
                id: `sub_${prd.id}_${agentId}_${i}`,
                parentPrdId: prd.id,
                agentId,
                stories: chunks[i],
                status: 'pending',
                createdAt: now,
                updatedAt: now
            };
            subPrds.push(subPrd);
        }
    }

    orchestratorLog.info({
        prdId: prd.id,
        subPrdCount: subPrds.length,
        agents: Array.from(storiesByAgent.keys())
    }, 'Decomposition by domain complete');

    return subPrds;
}

/**
 * Decompose by affected files
 */
function decomposeByFile(
    prd: PRD,
    strategy: DecompositionStrategy
): SubPRD[] {
    const now = new Date().toISOString();
    const storiesByAgent = new Map<string, PRDStory[]>();

    for (const story of prd.stories) {
        // Group by primary affected file's specialist
        const primaryFile = story.affectedFiles[0];
        let agentId = 'general-agent';

        if (primaryFile) {
            for (const specialist of specialists) {
                for (const pattern of specialist.filePatterns) {
                    if (matchesSimpleGlob(primaryFile, pattern)) {
                        agentId = specialist.id;
                        break;
                    }
                }
                if (agentId !== 'general-agent') break;
            }
        }

        const existing = storiesByAgent.get(agentId) || [];
        existing.push(story);
        storiesByAgent.set(agentId, existing);
    }

    // Create sub-PRDs
    const subPrds: SubPRD[] = [];
    for (const [agentId, stories] of storiesByAgent) {
        const chunks = chunkArray(stories, strategy.maxStoriesPerAgent);
        for (let i = 0; i < chunks.length; i++) {
            subPrds.push({
                id: `sub_${prd.id}_${agentId}_${i}`,
                parentPrdId: prd.id,
                agentId,
                stories: chunks[i],
                status: 'pending',
                createdAt: now,
                updatedAt: now
            });
        }
    }

    return subPrds;
}

/**
 * Decompose by complexity (distribute evenly)
 */
function decomposeByComplexity(
    prd: PRD,
    strategy: DecompositionStrategy
): SubPRD[] {
    const now = new Date().toISOString();

    // Sort stories by complexity (descending)
    const sorted = [...prd.stories].sort((a, b) => b.complexity - a.complexity);

    // Distribute to available agents using greedy algorithm
    const agentLoads = new Map<string, { load: number; stories: PRDStory[] }>();

    // Initialize agents
    for (const specialist of specialists) {
        agentLoads.set(specialist.id, { load: 0, stories: [] });
    }
    agentLoads.set('general-agent', { load: 0, stories: [] });

    // Assign stories to least loaded agent that can handle them
    for (const story of sorted) {
        const specialist = determineSpecialist(story);
        const preferredAgent = specialist?.id || 'general-agent';

        // Find least loaded agent (prefer specialized)
        let targetAgent = preferredAgent;
        const preferredLoad = agentLoads.get(preferredAgent);

        if (preferredLoad && preferredLoad.stories.length >= strategy.maxStoriesPerAgent) {
            // Find alternative with lowest load
            let minLoad = Infinity;
            for (const [agentId, { load, stories }] of agentLoads) {
                if (stories.length < strategy.maxStoriesPerAgent && load < minLoad) {
                    minLoad = load;
                    targetAgent = agentId;
                }
            }
        }

        const target = agentLoads.get(targetAgent);
        if (target) {
            target.load += story.complexity;
            target.stories.push(story);
        }
    }

    // Create sub-PRDs
    const subPrds: SubPRD[] = [];
    for (const [agentId, { stories }] of agentLoads) {
        if (stories.length > 0) {
            subPrds.push({
                id: `sub_${prd.id}_${agentId}_0`,
                parentPrdId: prd.id,
                agentId,
                stories,
                status: 'pending',
                createdAt: now,
                updatedAt: now
            });
        }
    }

    return subPrds;
}

/**
 * Decompose by dependency (respect story order)
 */
function decomposeByDependency(
    prd: PRD,
    strategy: DecompositionStrategy
): SubPRD[] {
    const now = new Date().toISOString();

    // For dependency-based, we create sequential sub-PRDs
    // Each sub-PRD depends on the previous one completing
    const subPrds: SubPRD[] = [];
    let currentStories: PRDStory[] = [];
    let currentAgent = 'general-agent';

    for (let i = 0; i < prd.stories.length; i++) {
        const story = prd.stories[i];
        const specialist = determineSpecialist(story);
        const agentId = specialist?.id || 'general-agent';

        // If agent changes or max stories reached, create new sub-PRD
        if (
            (agentId !== currentAgent && currentStories.length > 0) ||
            currentStories.length >= strategy.maxStoriesPerAgent
        ) {
            subPrds.push({
                id: `sub_${prd.id}_${subPrds.length}`,
                parentPrdId: prd.id,
                agentId: currentAgent,
                stories: currentStories,
                status: 'pending',
                createdAt: now,
                updatedAt: now
            });
            currentStories = [];
        }

        currentAgent = agentId;
        currentStories.push(story);
    }

    // Add remaining stories
    if (currentStories.length > 0) {
        subPrds.push({
            id: `sub_${prd.id}_${subPrds.length}`,
            parentPrdId: prd.id,
            agentId: currentAgent,
            stories: currentStories,
            status: 'pending',
            createdAt: now,
            updatedAt: now
        });
    }

    return subPrds;
}

/**
 * Analyze PRD for potential conflicts
 */
export function analyzeConflicts(subPrds: SubPRD[]): {
    potentialConflicts: Array<{
        file: string;
        agents: string[];
    }>;
    canParallelize: boolean;
} {
    const fileAgentMap = new Map<string, Set<string>>();

    // Map files to agents
    for (const subPrd of subPrds) {
        for (const story of subPrd.stories) {
            for (const file of story.affectedFiles) {
                const agents = fileAgentMap.get(file) || new Set();
                agents.add(subPrd.agentId);
                fileAgentMap.set(file, agents);
            }
        }
    }

    // Find conflicts (same file, multiple agents)
    const conflicts: Array<{ file: string; agents: string[] }> = [];
    for (const [file, agents] of fileAgentMap) {
        if (agents.size > 1) {
            conflicts.push({
                file,
                agents: Array.from(agents)
            });
        }
    }

    return {
        potentialConflicts: conflicts,
        canParallelize: conflicts.length === 0
    };
}

/**
 * Estimate total work for decomposition
 */
export function estimateWork(subPrds: SubPRD[]): {
    totalStories: number;
    totalComplexity: number;
    byAgent: Record<string, { stories: number; complexity: number }>;
} {
    const byAgent: Record<string, { stories: number; complexity: number }> = {};
    let totalStories = 0;
    let totalComplexity = 0;

    for (const subPrd of subPrds) {
        for (const story of subPrd.stories) {
            totalStories++;
            totalComplexity += story.complexity;

            if (!byAgent[subPrd.agentId]) {
                byAgent[subPrd.agentId] = { stories: 0, complexity: 0 };
            }
            byAgent[subPrd.agentId].stories++;
            byAgent[subPrd.agentId].complexity += story.complexity;
        }
    }

    return {
        totalStories,
        totalComplexity,
        byAgent
    };
}

/**
 * Split array into chunks
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Simple glob matching
 */
function matchesSimpleGlob(path: string, pattern: string): boolean {
    const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\//g, '\\/');
    return new RegExp(`^${regex}$`).test(path);
}

export default {
    decomposePRD,
    analyzeConflicts,
    estimateWork
};
