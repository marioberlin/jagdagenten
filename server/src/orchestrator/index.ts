/**
 * Multi-Agent Orchestration System
 *
 * Manages splitting large tasks among specialist agents.
 *
 * Flow:
 * PRD → Decompose → Assign Specialists → Execute (parallel) → Merge → Verify
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.3 Multi-Agent Orchestration
 */

import { randomUUID } from 'crypto';
import type {
    PRD,
    PRDStory,
    SubPRD,
    OrchestrationSession,
    AgentWorkResult,
    MergeResult,
    VerificationResult,
    DecompositionStrategy,
    OrchestratorEvent,
    OrchestratorEventHandler
} from './types.js';
import { decomposePRD, analyzeConflicts, estimateWork } from './decompose.js';
import { specialists, getSpecialist } from './specialists.js';
import { componentLoggers } from '../logger.js';

const orchestratorLog = componentLoggers.http;

// Re-export types
export type {
    PRD,
    PRDStory,
    SubPRD,
    OrchestrationSession,
    AgentWorkResult,
    DecompositionStrategy
};

// Re-export utilities
export { decomposePRD, analyzeConflicts, estimateWork };
export { specialists, getSpecialist };

/**
 * Orchestrator configuration
 */
interface OrchestratorConfig {
    /** Whether to execute agents in parallel */
    parallelExecution: boolean;
    /** Maximum concurrent agents */
    maxConcurrent: number;
    /** Default timeout per agent in ms */
    agentTimeout: number;
    /** Whether to auto-merge results */
    autoMerge: boolean;
    /** Whether to auto-verify after merge */
    autoVerify: boolean;
    /** Event handler */
    onEvent?: OrchestratorEventHandler;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
    parallelExecution: true,
    maxConcurrent: 4,
    agentTimeout: 300000, // 5 minutes
    autoMerge: false,
    autoVerify: false
};

/**
 * In-memory session storage
 */
const sessions = new Map<string, OrchestrationSession>();

let config: OrchestratorConfig = { ...DEFAULT_CONFIG };

/**
 * Initialize the orchestrator
 */
export function initOrchestrator(userConfig?: Partial<OrchestratorConfig>): void {
    config = { ...DEFAULT_CONFIG, ...userConfig };

    orchestratorLog.info({
        parallel: config.parallelExecution,
        maxConcurrent: config.maxConcurrent,
        autoMerge: config.autoMerge
    }, 'Orchestrator initialized');
}

/**
 * Emit an event
 */
function emit(event: OrchestratorEvent): void {
    config.onEvent?.(event);
    orchestratorLog.debug({ event }, 'Orchestrator event');
}

/**
 * Create a new orchestration session
 */
export function createSession(
    prd: PRD,
    strategy?: Partial<DecompositionStrategy>
): OrchestrationSession {
    const now = new Date().toISOString();
    const sessionId = `orch_${Date.now()}_${randomUUID().slice(0, 8)}`;

    orchestratorLog.info({
        sessionId,
        prdId: prd.id,
        storiesCount: prd.stories.length
    }, 'Creating orchestration session');

    emit({ type: 'session_started', sessionId });

    // Decompose PRD
    const subPrds = decomposePRD(prd, strategy);

    emit({ type: 'decomposition_complete', subPrdCount: subPrds.length });

    // Analyze for potential conflicts
    const { potentialConflicts, canParallelize } = analyzeConflicts(subPrds);

    if (potentialConflicts.length > 0) {
        orchestratorLog.warn({
            sessionId,
            conflicts: potentialConflicts.length
        }, 'Potential merge conflicts detected');
    }

    const session: OrchestrationSession = {
        id: sessionId,
        prd,
        subPrds,
        status: 'decomposing',
        mainBranch: 'main',
        featureBranch: `feature/${prd.id}`,
        createdAt: now,
        updatedAt: now
    };

    sessions.set(sessionId, session);
    session.status = 'executing';

    return session;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): OrchestrationSession | undefined {
    return sessions.get(sessionId);
}

/**
 * Get all sessions
 */
export function getAllSessions(): OrchestrationSession[] {
    return Array.from(sessions.values());
}

/**
 * Execute agent work (mock implementation)
 * In production, this would call actual AI agents
 */
export async function executeAgent(
    subPrd: SubPRD,
    sessionId: string
): Promise<AgentWorkResult> {
    const startTime = Date.now();
    const agent = getSpecialist(subPrd.agentId);

    orchestratorLog.info({
        sessionId,
        subPrdId: subPrd.id,
        agentId: subPrd.agentId,
        storiesCount: subPrd.stories.length
    }, 'Executing agent');

    emit({ type: 'agent_started', agentId: subPrd.agentId, subPrdId: subPrd.id });

    // Update sub-PRD status
    subPrd.status = 'in_progress';
    subPrd.updatedAt = new Date().toISOString();

    try {
        // Simulate agent work
        await new Promise(resolve => setTimeout(resolve, 100));

        // Collect affected files
        const modifiedFiles = new Set<string>();
        for (const story of subPrd.stories) {
            for (const file of story.affectedFiles) {
                modifiedFiles.add(file);
            }
        }

        const result: AgentWorkResult = {
            success: true,
            modifiedFiles: Array.from(modifiedFiles),
            branchName: `${subPrd.agentId}/${subPrd.id}`,
            commits: [`mock_commit_${Date.now()}`],
            errors: [],
            duration: Date.now() - startTime
        };

        subPrd.status = 'completed';
        subPrd.result = result;
        subPrd.updatedAt = new Date().toISOString();

        emit({ type: 'agent_completed', agentId: subPrd.agentId, success: true });

        orchestratorLog.info({
            sessionId,
            subPrdId: subPrd.id,
            duration: result.duration,
            filesModified: result.modifiedFiles.length
        }, 'Agent completed successfully');

        return result;

    } catch (error) {
        const result: AgentWorkResult = {
            success: false,
            modifiedFiles: [],
            commits: [],
            errors: [(error as Error).message],
            duration: Date.now() - startTime
        };

        subPrd.status = 'failed';
        subPrd.result = result;
        subPrd.updatedAt = new Date().toISOString();

        emit({ type: 'agent_completed', agentId: subPrd.agentId, success: false });

        orchestratorLog.error({
            sessionId,
            subPrdId: subPrd.id,
            error: (error as Error).message
        }, 'Agent failed');

        return result;
    }
}

/**
 * Execute all agents for a session
 */
export async function executeSession(sessionId: string): Promise<AgentWorkResult[]> {
    const session = sessions.get(sessionId);
    if (!session) {
        throw new Error(`Session ${sessionId} not found`);
    }

    orchestratorLog.info({
        sessionId,
        agentCount: session.subPrds.length,
        parallel: config.parallelExecution
    }, 'Executing session');

    session.status = 'executing';
    session.updatedAt = new Date().toISOString();

    const results: AgentWorkResult[] = [];

    if (config.parallelExecution) {
        // Execute in parallel (with concurrency limit)
        const batches: SubPRD[][] = [];
        for (let i = 0; i < session.subPrds.length; i += config.maxConcurrent) {
            batches.push(session.subPrds.slice(i, i + config.maxConcurrent));
        }

        for (const batch of batches) {
            const batchResults = await Promise.all(
                batch.map(subPrd => executeAgent(subPrd, sessionId))
            );
            results.push(...batchResults);
        }
    } else {
        // Execute sequentially
        for (const subPrd of session.subPrds) {
            const result = await executeAgent(subPrd, sessionId);
            results.push(result);
        }
    }

    session.status = 'merging';
    session.updatedAt = new Date().toISOString();

    orchestratorLog.info({
        sessionId,
        totalResults: results.length,
        successful: results.filter(r => r.success).length
    }, 'Session execution complete');

    // Auto-merge if configured
    if (config.autoMerge) {
        await mergeResults(sessionId);
    }

    return results;
}

/**
 * Merge results from all agents
 */
export async function mergeResults(sessionId: string): Promise<MergeResult> {
    const session = sessions.get(sessionId);
    if (!session) {
        throw new Error(`Session ${sessionId} not found`);
    }

    orchestratorLog.info({ sessionId }, 'Starting merge');
    emit({ type: 'merge_started' });

    const startTime = Date.now();

    // Collect all modified files
    const allFiles = new Set<string>();
    const fileConflicts = new Map<string, string[]>();

    for (const subPrd of session.subPrds) {
        if (subPrd.result?.modifiedFiles) {
            for (const file of subPrd.result.modifiedFiles) {
                if (allFiles.has(file)) {
                    // Potential conflict
                    const existing = fileConflicts.get(file) || [];
                    existing.push(subPrd.agentId);
                    fileConflicts.set(file, existing);
                }
                allFiles.add(file);
            }
        }
    }

    const result: MergeResult = {
        success: fileConflicts.size === 0,
        mergedFiles: Array.from(allFiles),
        resolvedConflicts: [],
        unresolvedConflicts: Array.from(fileConflicts.keys()),
        duration: Date.now() - startTime
    };

    session.mergeResult = result;
    session.status = result.success ? 'verifying' : 'failed';
    session.updatedAt = new Date().toISOString();

    emit({ type: 'merge_completed', success: result.success });

    orchestratorLog.info({
        sessionId,
        success: result.success,
        mergedFiles: result.mergedFiles.length,
        conflicts: result.unresolvedConflicts.length
    }, 'Merge complete');

    // Auto-verify if configured
    if (config.autoVerify && result.success) {
        await verifyResults(sessionId);
    }

    return result;
}

/**
 * Verify merged results
 */
export async function verifyResults(sessionId: string): Promise<VerificationResult> {
    const session = sessions.get(sessionId);
    if (!session) {
        throw new Error(`Session ${sessionId} not found`);
    }

    orchestratorLog.info({ sessionId }, 'Starting verification');
    emit({ type: 'verification_started' });

    // Mock verification result
    const result: VerificationResult = {
        passed: true,
        testsRun: session.subPrds.reduce((sum, s) => sum + s.stories.length, 0),
        testsPassed: session.subPrds.reduce((sum, s) => sum + s.stories.length, 0),
        testsFailed: 0,
        lintIssues: 0,
        typeErrors: 0,
        issues: []
    };

    session.verificationResult = result;
    session.status = result.passed ? 'completed' : 'failed';
    session.updatedAt = new Date().toISOString();

    emit({ type: 'verification_completed', passed: result.passed });
    emit({ type: 'session_completed', success: result.passed });

    orchestratorLog.info({
        sessionId,
        passed: result.passed,
        testsRun: result.testsRun,
        testsPassed: result.testsPassed
    }, 'Verification complete');

    return result;
}

/**
 * Get session status summary
 */
export function getSessionStatus(sessionId: string): {
    status: OrchestrationSession['status'];
    progress: {
        total: number;
        completed: number;
        failed: number;
        pending: number;
    };
    estimate: ReturnType<typeof estimateWork>;
} | null {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const progress = {
        total: session.subPrds.length,
        completed: session.subPrds.filter(s => s.status === 'completed').length,
        failed: session.subPrds.filter(s => s.status === 'failed').length,
        pending: session.subPrds.filter(s => s.status === 'pending').length
    };

    return {
        status: session.status,
        progress,
        estimate: estimateWork(session.subPrds)
    };
}

/**
 * Cancel a session
 */
export function cancelSession(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.status = 'failed';
    session.updatedAt = new Date().toISOString();

    // Mark pending sub-PRDs as failed
    for (const subPrd of session.subPrds) {
        if (subPrd.status === 'pending' || subPrd.status === 'in_progress') {
            subPrd.status = 'failed';
            subPrd.updatedAt = new Date().toISOString();
        }
    }

    emit({ type: 'session_completed', success: false });

    orchestratorLog.info({ sessionId }, 'Session cancelled');

    return true;
}

/**
 * Clean up old sessions
 */
export function cleanupSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of sessions) {
        const sessionAge = now - new Date(session.createdAt).getTime();
        if (sessionAge > maxAgeMs) {
            sessions.delete(sessionId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        orchestratorLog.info({ cleaned }, 'Cleaned up old sessions');
    }

    return cleaned;
}

/**
 * Get orchestrator status
 */
export function getOrchestratorStatus(): {
    activeSessions: number;
    totalSessions: number;
    config: Omit<OrchestratorConfig, 'onEvent'>;
} {
    const activeSessions = Array.from(sessions.values()).filter(
        s => s.status === 'executing' || s.status === 'merging' || s.status === 'verifying'
    ).length;

    const { onEvent, ...configWithoutHandler } = config;

    return {
        activeSessions,
        totalSessions: sessions.size,
        config: configWithoutHandler
    };
}

export default {
    initOrchestrator,
    createSession,
    getSession,
    getAllSessions,
    executeSession,
    executeAgent,
    mergeResults,
    verifyResults,
    getSessionStatus,
    cancelSession,
    cleanupSessions,
    getOrchestratorStatus,
    decomposePRD,
    analyzeConflicts,
    estimateWork,
    specialists,
    getSpecialist
};
