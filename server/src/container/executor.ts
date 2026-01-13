/**
 * Container Executor
 *
 * Provides the bridge between the orchestrator and the container pool.
 * Replaces the mock executeAgent() with real container execution.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md
 */

import type { SubPRD, AgentWorkResult } from '../orchestrator/types.js';
import type { ContainerPool } from './pool.js';
import type { PooledContainer, InitRequest, ExecuteRequest } from './types.js';
import { getSpecialist } from '../orchestrator/specialists.js';
import { componentLoggers } from '../logger.js';
import { traceExecution } from './metrics.js';

const log = componentLoggers.http.child({ component: 'container-executor' });

// ============================================================================
// Types
// ============================================================================

export interface ExecutorConfig {
    /** Container pool to use */
    pool: ContainerPool;
    /** Default execution timeout (ms) */
    timeout: number;
    /** Working directory inside container */
    workdir: string;
    /** Base environment variables */
    env: Record<string, string>;
}

export interface AgentScript {
    /** Script content or path */
    content: string;
    /** Whether content is inline or a path */
    type: 'inline' | 'path';
    /** Command to run */
    command: string;
    /** Command arguments */
    args?: string[];
}

// ============================================================================
// Default Agent Scripts
// ============================================================================

/**
 * Default agent script template
 * This is a simple script that can be customized per-agent
 */
const DEFAULT_AGENT_SCRIPT = `
import { readFileSync, writeFileSync } from 'fs';

// Read the sub-PRD from environment
const subPrdJson = process.env.LIQUID_SUB_PRD;
if (!subPrdJson) {
    console.error('No sub-PRD provided');
    process.exit(1);
}

const subPrd = JSON.parse(subPrdJson);
console.log('Processing sub-PRD:', subPrd.id);
console.log('Stories:', subPrd.stories.length);

// Simulate agent work
const result = {
    success: true,
    modifiedFiles: subPrd.stories.flatMap(s => s.affectedFiles),
    commits: [],
    errors: [],
};

// Output result as JSON
console.log('---RESULT_START---');
console.log(JSON.stringify(result));
console.log('---RESULT_END---');
`;

// ============================================================================
// Container Executor
// ============================================================================

export class ContainerExecutor {
    private config: ExecutorConfig;
    private activeContainers: Map<string, PooledContainer> = new Map();

    constructor(config: ExecutorConfig) {
        this.config = config;
    }

    /**
     * Execute an agent in a container
     */
    async executeAgent(
        subPrd: SubPRD,
        sessionId: string,
        script?: AgentScript
    ): Promise<AgentWorkResult> {
        const startTime = Date.now();
        const agent = getSpecialist(subPrd.agentId);
        const agentId = `${sessionId}-${subPrd.agentId}-${subPrd.id}`;

        log.info({
            sessionId,
            subPrdId: subPrd.id,
            agentId: subPrd.agentId,
            storiesCount: subPrd.stories.length,
        }, 'Executing agent in container');

        let container: PooledContainer | null = null;

        try {
            // Acquire container
            container = await this.config.pool.acquire({
                agentId,
                priority: 'high',
            });

            this.activeContainers.set(agentId, container);

            // Initialize container
            const initRequest: InitRequest = {
                agentId,
                script: script
                    ? { type: script.type, content: script.content }
                    : { type: 'inline', content: DEFAULT_AGENT_SCRIPT, filename: 'agent.ts' },
                env: {
                    ...this.config.env,
                    LIQUID_SESSION_ID: sessionId,
                    LIQUID_SUB_PRD_ID: subPrd.id,
                    LIQUID_AGENT_ID: subPrd.agentId,
                    LIQUID_SUB_PRD: JSON.stringify(subPrd),
                },
                workdir: this.config.workdir,
            };

            await this.config.pool.initContainer(container.id, initRequest);

            // Execute the agent script
            const executeRequest: ExecuteRequest = {
                command: script?.command ?? 'bun',
                args: script?.args ?? ['run', '/app/.agent/agent.ts'],
                timeout: this.config.timeout,
                cwd: this.config.workdir,
            };

            const response = await traceExecution(container, executeRequest.command, async () => {
                return this.config.pool.executeInContainer(container!.id, executeRequest);
            });

            // Parse result from output
            const result = this.parseResult(response.stdout, response.stderr, startTime);

            if (response.timedOut) {
                result.success = false;
                result.errors.push(`Execution timed out after ${this.config.timeout}ms`);
            }

            if (response.oomKilled) {
                result.success = false;
                result.errors.push('Process was killed due to memory limit');
            }

            if (response.exitCode !== 0 && result.success) {
                result.success = false;
                result.errors.push(`Exit code: ${response.exitCode}`);
            }

            log.info({
                sessionId,
                subPrdId: subPrd.id,
                duration: result.duration,
                success: result.success,
                filesModified: result.modifiedFiles.length,
            }, 'Agent execution complete');

            return result;
        } catch (error) {
            log.error({
                sessionId,
                subPrdId: subPrd.id,
                error: (error as Error).message,
            }, 'Agent execution failed');

            return {
                success: false,
                modifiedFiles: [],
                commits: [],
                errors: [(error as Error).message],
                duration: Date.now() - startTime,
            };
        } finally {
            // Release container
            if (container) {
                this.activeContainers.delete(agentId);
                try {
                    await this.config.pool.release(container.id);
                } catch (error) {
                    log.warn({
                        containerId: container.shortId,
                        error: (error as Error).message,
                    }, 'Failed to release container');
                }
            }
        }
    }

    /**
     * Parse agent result from stdout
     */
    private parseResult(
        stdout: string,
        stderr: string,
        startTime: number
    ): AgentWorkResult {
        const duration = Date.now() - startTime;

        // Look for structured result in output
        const resultMatch = stdout.match(/---RESULT_START---\n([\s\S]*?)\n---RESULT_END---/);

        if (resultMatch) {
            try {
                const parsed = JSON.parse(resultMatch[1]);
                return {
                    success: parsed.success ?? true,
                    modifiedFiles: parsed.modifiedFiles ?? [],
                    branchName: parsed.branchName,
                    commits: parsed.commits ?? [],
                    errors: parsed.errors ?? [],
                    duration,
                };
            } catch {
                // Fall through to default
            }
        }

        // Default result if no structured output
        return {
            success: true,
            modifiedFiles: [],
            commits: [],
            errors: stderr ? [stderr] : [],
            duration,
        };
    }

    /**
     * Cancel execution of an agent
     */
    async cancelAgent(agentId: string): Promise<void> {
        const container = this.activeContainers.get(agentId);
        if (container) {
            this.activeContainers.delete(agentId);
            await this.config.pool.release(container.id, { destroy: true, reason: 'cancelled' });
        }
    }

    /**
     * Get active agent count
     */
    getActiveCount(): number {
        return this.activeContainers.size;
    }

    /**
     * Shutdown executor
     */
    async shutdown(): Promise<void> {
        // Release all active containers
        for (const [agentId, container] of this.activeContainers) {
            try {
                await this.config.pool.release(container.id, { destroy: true, reason: 'shutdown' });
            } catch {
                // Ignore
            }
        }
        this.activeContainers.clear();
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a container executor
 */
export function createContainerExecutor(config: ExecutorConfig): ContainerExecutor {
    return new ContainerExecutor(config);
}

/**
 * Create default executor configuration
 */
export function getDefaultExecutorConfig(pool: ContainerPool): ExecutorConfig {
    return {
        pool,
        timeout: 300000, // 5 minutes
        workdir: '/app',
        env: {},
    };
}
