/**
 * Cowork Agent Manager
 *
 * Manages the lifecycle of multiple sub-agents executing in parallel.
 * Provides concurrency control, health monitoring, and graceful termination.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger';
import { permissionService, type PermissionService } from './permissions';
import { coworkTaskExecutor, type ExecutionContext, type ExecutionResult } from './executor';
import type {
    CoworkSubTask,
    CoworkSession,
    AgentInstance,
    AgentType,
    AgentStatus,
    SubTaskResult,
    WorkspaceConfig,
} from './types';

const logger = componentLoggers.http;

// ============================================================================
// Types
// ============================================================================

export interface AgentManagerConfig {
    /** Maximum concurrent agents (default: 4) */
    maxConcurrentAgents: number;
    /** Timeout per agent in ms (default: 300000 = 5 min) */
    agentTimeout: number;
    /** Health check interval in ms (default: 10000 = 10 sec) */
    healthCheckInterval: number;
    /** Maximum retry attempts (default: 1) */
    maxRetries: number;
    /** Retry backoff in ms (default: 5000) */
    retryBackoff: number;
    /** Enable priority queue (default: true) */
    enablePriorityQueue: boolean;
}

export interface AgentSpawnRequest {
    sessionId: string;
    subTask: CoworkSubTask;
    session: CoworkSession;
    agentType?: AgentType;
    priority?: number;
    timeout?: number;
    onProgress?: (progress: number, thought: string) => void;
}

export type ManagedAgentState =
    | 'queued'
    | 'initializing'
    | 'working'
    | 'completed'
    | 'failed'
    | 'terminated';

export interface ManagedAgent extends AgentInstance {
    state: ManagedAgentState;
    executor?: typeof coworkTaskExecutor;
    abortController?: AbortController;
    healthStatus: 'healthy' | 'degraded' | 'unresponsive';
    lastHeartbeat: Date;
    retryCount: number;
    queuedAt: Date;
    priority: number;
    request: AgentSpawnRequest;
    healthCheckTimer?: ReturnType<typeof setInterval>;
    timeoutTimer?: ReturnType<typeof setTimeout>;
    executionPromise?: Promise<ExecutionResult>;
}

export interface BatchSpawnResult {
    successful: ManagedAgent[];
    failed: Array<{ request: AgentSpawnRequest; error: string }>;
    totalDuration: number;
}

// ============================================================================
// Agent Manager Events
// ============================================================================

export interface AgentManagerEvents {
    'agent:queued': { agentId: string; sessionId: string; position: number };
    'agent:starting': { agentId: string; sessionId: string; subTaskId: string };
    'agent:working': { agentId: string; sessionId: string };
    'agent:progress': { agentId: string; progress: number; thought: string };
    'agent:completed': { agentId: string; result: SubTaskResult };
    'agent:failed': { agentId: string; error: string; retrying: boolean };
    'agent:terminated': { agentId: string; reason: string };
    'agent:retry': { agentId: string; attempt: number; maxRetries: number };
    'agent:degraded': { agentId: string };
    'pool:slot_acquired': { agentId: string; activeCount: number };
    'pool:slot_released': { agentId: string; activeCount: number };
    'pool:exhausted': { queueLength: number };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: AgentManagerConfig = {
    maxConcurrentAgents: 4,
    agentTimeout: 300000,        // 5 minutes
    healthCheckInterval: 10000,  // 10 seconds
    maxRetries: 1,
    retryBackoff: 5000,
    enablePriorityQueue: true,
};

// ============================================================================
// Agent Manager
// ============================================================================

export class AgentManager extends EventEmitter {
    private config: AgentManagerConfig;
    private permissionService: PermissionService;

    // Agent tracking
    private agents: Map<string, ManagedAgent> = new Map();
    private queue: ManagedAgent[] = [];

    // Concurrency control
    private activeCount = 0;
    private paused = false;
    private slotWaiters: Array<() => void> = [];

    constructor(
        config: Partial<AgentManagerConfig> = {},
        permService?: PermissionService
    ) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.permissionService = permService || permissionService;

        logger.info({
            maxConcurrent: this.config.maxConcurrentAgents,
            timeout: this.config.agentTimeout,
        }, 'AgentManager initialized');
    }

    // ========================================================================
    // Spawning
    // ========================================================================

    /**
     * Spawn a single agent
     */
    async spawnAgent(request: AgentSpawnRequest): Promise<ManagedAgent> {
        const agent = this.createAgent(request);

        // Add to tracking
        this.agents.set(agent.id, agent);

        // Validate permissions for workspace
        const permCheck = await this.permissionService.checkPermission({
            sessionId: request.sessionId,
            operation: 'read',
            path: request.session.workspace.outputPath,
            agentId: agent.id,
        });

        if (!permCheck.allowed) {
            agent.state = 'failed';
            agent.status = 'failed';
            throw new Error(`Permission denied: ${permCheck.reason}`);
        }

        // Add to queue
        this.addToQueue(agent);

        // Start processing (non-blocking)
        this.processQueue();

        // Return immediately - caller can wait on events or poll status
        return agent;
    }

    /**
     * Spawn multiple agents with concurrency control
     */
    async spawnBatch(requests: AgentSpawnRequest[]): Promise<BatchSpawnResult> {
        const startTime = Date.now();
        const successful: ManagedAgent[] = [];
        const failed: Array<{ request: AgentSpawnRequest; error: string }> = [];

        // Sort by priority if enabled
        const sortedRequests = this.config.enablePriorityQueue
            ? [...requests].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
            : requests;

        // Create all agents and add to queue
        const agents: ManagedAgent[] = [];
        for (const request of sortedRequests) {
            try {
                const agent = this.createAgent(request);
                this.agents.set(agent.id, agent);
                this.addToQueue(agent);
                agents.push(agent);
            } catch (error: any) {
                failed.push({ request, error: error.message });
            }
        }

        // Wait for all agents to complete
        const completionPromises = agents.map(agent =>
            this.waitForCompletion(agent.id)
                .then(() => {
                    successful.push(agent);
                })
                .catch((error: any) => {
                    failed.push({ request: agent.request, error: error.message });
                })
        );

        // Start processing
        this.processQueue();

        // Wait for all completions
        await Promise.allSettled(completionPromises);

        return {
            successful,
            failed,
            totalDuration: Date.now() - startTime,
        };
    }

    /**
     * Create a managed agent from spawn request
     */
    private createAgent(request: AgentSpawnRequest): ManagedAgent {
        const now = new Date();

        const agent: ManagedAgent = {
            // AgentInstance fields
            id: randomUUID(),
            sessionId: request.sessionId,
            subTaskId: request.subTask.id,
            name: `Agent-${request.subTask.order}`,
            type: request.agentType || this.inferAgentType(request.subTask),
            status: 'initializing',
            progress: 0,
            currentThought: null,
            spawnedAt: now,
            lastActivityAt: now,

            // ManagedAgent fields
            state: 'queued',
            healthStatus: 'healthy',
            lastHeartbeat: now,
            retryCount: 0,
            queuedAt: now,
            priority: request.priority ?? 0,
            request,
        };

        return agent;
    }

    /**
     * Infer agent type from subtask
     */
    private inferAgentType(subTask: CoworkSubTask): AgentType {
        const title = subTask.title.toLowerCase();
        const desc = subTask.description.toLowerCase();
        const combined = `${title} ${desc}`;

        if (combined.includes('analy') || combined.includes('research')) {
            return 'researcher';
        }
        if (combined.includes('code') || combined.includes('implement') || combined.includes('develop')) {
            return 'code_generator';
        }
        if (combined.includes('document') || combined.includes('write') || combined.includes('draft')) {
            return 'document_writer';
        }
        if (combined.includes('data') || combined.includes('process') || combined.includes('transform')) {
            return 'data_processor';
        }
        if (combined.includes('organiz') || combined.includes('sort') || combined.includes('move')) {
            return 'file_organizer';
        }
        if (combined.includes('format') || combined.includes('style') || combined.includes('clean')) {
            return 'formatter';
        }

        return 'orchestrator';
    }

    // ========================================================================
    // Queue Management
    // ========================================================================

    /**
     * Add agent to priority queue
     */
    private addToQueue(agent: ManagedAgent): void {
        if (this.config.enablePriorityQueue) {
            // Insert in priority order (higher priority first, then FIFO)
            let insertIndex = this.queue.findIndex(
                a => a.priority < agent.priority ||
                    (a.priority === agent.priority && a.queuedAt > agent.queuedAt)
            );
            if (insertIndex === -1) {
                insertIndex = this.queue.length;
            }
            this.queue.splice(insertIndex, 0, agent);
        } else {
            this.queue.push(agent);
        }

        this.emit('agent:queued', {
            agentId: agent.id,
            sessionId: agent.sessionId!,
            position: this.queue.indexOf(agent) + 1,
        });
    }

    /**
     * Process the queue - start agents up to max concurrency
     */
    private processQueue(): void {
        if (this.paused) return;

        while (this.activeCount < this.config.maxConcurrentAgents && this.queue.length > 0) {
            const agent = this.queue.shift()!;
            this.startAgent(agent);
        }

        // Emit pool exhausted if queue is waiting
        if (this.queue.length > 0 && this.activeCount >= this.config.maxConcurrentAgents) {
            this.emit('pool:exhausted', { queueLength: this.queue.length });
        }
    }

    /**
     * Acquire a concurrency slot (blocks until available)
     */
    private async acquireSlot(): Promise<void> {
        if (this.activeCount < this.config.maxConcurrentAgents && !this.paused) {
            this.activeCount++;
            return;
        }

        // Wait for a slot
        return new Promise(resolve => {
            this.slotWaiters.push(() => {
                this.activeCount++;
                resolve();
            });
        });
    }

    /**
     * Release a concurrency slot
     */
    private releaseSlot(agentId: string): void {
        this.activeCount--;

        this.emit('pool:slot_released', {
            agentId,
            activeCount: this.activeCount,
        });

        // Wake up a waiter if any
        const waiter = this.slotWaiters.shift();
        if (waiter) {
            waiter();
        }

        // Process queue for next agent
        this.processQueue();
    }

    // ========================================================================
    // Execution
    // ========================================================================

    /**
     * Start executing an agent
     */
    private async startAgent(agent: ManagedAgent): Promise<void> {
        try {
            // Acquire slot
            this.activeCount++;

            this.emit('pool:slot_acquired', {
                agentId: agent.id,
                activeCount: this.activeCount,
            });

            // Update state
            agent.state = 'initializing';
            agent.status = 'initializing';

            this.emit('agent:starting', {
                agentId: agent.id,
                sessionId: agent.sessionId!,
                subTaskId: agent.subTaskId!,
            });

            // Set up timeout
            agent.timeoutTimer = setTimeout(() => {
                this.handleTimeout(agent);
            }, agent.request.timeout || this.config.agentTimeout);

            // Set up health monitoring
            this.startHealthMonitoring(agent);

            // Execute
            agent.state = 'working';
            agent.status = 'working';

            this.emit('agent:working', {
                agentId: agent.id,
                sessionId: agent.sessionId!,
            });

            // Build execution context
            const context: ExecutionContext = {
                session: agent.request.session,
                subTask: agent.request.subTask,
                workspace: agent.request.session.workspace,
                sandboxRoot: agent.request.session.sandboxId
                    ? agent.request.session.workspace.outputPath
                    : undefined,
            };

            // Set up progress handler
            const progressHandler = (data: any) => {
                if (data.subtaskId === agent.subTaskId) {
                    agent.lastHeartbeat = new Date();
                    agent.lastActivityAt = new Date();
                    agent.healthStatus = 'healthy';

                    // Extract progress from output (simple heuristic)
                    const thought = data.data?.slice(0, 200) || 'Processing...';
                    agent.currentThought = thought;

                    if (agent.request.onProgress) {
                        agent.request.onProgress(agent.progress, thought);
                    }

                    this.emit('agent:progress', {
                        agentId: agent.id,
                        progress: agent.progress,
                        thought,
                    });
                }
            };

            coworkTaskExecutor.on('output', progressHandler);

            try {
                // Execute the task
                const result = await coworkTaskExecutor.execute(context);

                // Transform to SubTaskResult
                const subTaskResult = coworkTaskExecutor.toSubTaskResult(result);

                // Update agent state
                agent.state = result.success ? 'completed' : 'failed';
                agent.status = result.success ? 'completed' : 'failed';
                agent.progress = 100;

                if (result.success) {
                    this.emit('agent:completed', {
                        agentId: agent.id,
                        result: subTaskResult,
                    });

                    logger.info({
                        agentId: agent.id,
                        sessionId: agent.sessionId,
                        duration: result.duration,
                    }, 'Agent completed successfully');
                } else {
                    await this.handleFailure(agent, new Error(result.error || 'Unknown error'));
                }

            } finally {
                coworkTaskExecutor.removeListener('output', progressHandler);
            }

        } catch (error: any) {
            await this.handleFailure(agent, error);
        } finally {
            this.cleanupAgent(agent);
            this.releaseSlot(agent.id);
        }
    }

    /**
     * Handle agent failure (with potential retry)
     */
    private async handleFailure(agent: ManagedAgent, error: Error): Promise<void> {
        agent.retryCount++;

        const shouldRetry = agent.retryCount <= this.config.maxRetries;

        this.emit('agent:failed', {
            agentId: agent.id,
            error: error.message,
            retrying: shouldRetry,
        });

        logger.warn({
            agentId: agent.id,
            sessionId: agent.sessionId,
            error: error.message,
            retryCount: agent.retryCount,
            maxRetries: this.config.maxRetries,
        }, 'Agent failed');

        if (shouldRetry) {
            this.emit('agent:retry', {
                agentId: agent.id,
                attempt: agent.retryCount,
                maxRetries: this.config.maxRetries,
            });

            // Wait for backoff
            await this.delay(this.config.retryBackoff * agent.retryCount);

            // Re-queue
            agent.state = 'queued';
            agent.status = 'waiting';
            agent.queuedAt = new Date();
            this.addToQueue(agent);
        } else {
            agent.state = 'failed';
            agent.status = 'failed';
        }
    }

    /**
     * Handle agent timeout
     */
    private handleTimeout(agent: ManagedAgent): void {
        logger.warn({
            agentId: agent.id,
            sessionId: agent.sessionId,
            timeout: this.config.agentTimeout,
        }, 'Agent timed out');

        agent.state = 'terminated';
        agent.status = 'terminated';

        // Cancel execution
        coworkTaskExecutor.cancel(agent.id);

        this.emit('agent:terminated', {
            agentId: agent.id,
            reason: 'timeout',
        });
    }

    // ========================================================================
    // Health Monitoring
    // ========================================================================

    /**
     * Start health monitoring for an agent
     */
    private startHealthMonitoring(agent: ManagedAgent): void {
        agent.healthCheckTimer = setInterval(() => {
            const elapsed = Date.now() - agent.lastHeartbeat.getTime();
            const timeout = agent.request.timeout || this.config.agentTimeout;

            if (elapsed > timeout) {
                agent.healthStatus = 'unresponsive';
                this.handleTimeout(agent);
            } else if (elapsed > timeout * 0.75) {
                if (agent.healthStatus !== 'degraded') {
                    agent.healthStatus = 'degraded';
                    this.emit('agent:degraded', { agentId: agent.id });
                    logger.warn({ agentId: agent.id }, 'Agent health degraded');
                }
            } else {
                agent.healthStatus = 'healthy';
            }
        }, this.config.healthCheckInterval);
    }

    /**
     * Clean up agent timers and resources
     */
    private cleanupAgent(agent: ManagedAgent): void {
        if (agent.healthCheckTimer) {
            clearInterval(agent.healthCheckTimer);
            agent.healthCheckTimer = undefined;
        }
        if (agent.timeoutTimer) {
            clearTimeout(agent.timeoutTimer);
            agent.timeoutTimer = undefined;
        }
    }

    // ========================================================================
    // Termination
    // ========================================================================

    /**
     * Terminate a specific agent
     */
    async terminateAgent(agentId: string, reason = 'manual'): Promise<boolean> {
        const agent = this.agents.get(agentId);
        if (!agent) return false;

        // Remove from queue if queued
        const queueIndex = this.queue.indexOf(agent);
        if (queueIndex !== -1) {
            this.queue.splice(queueIndex, 1);
        }

        // Cancel execution
        coworkTaskExecutor.cancel(agentId);

        // Clean up
        this.cleanupAgent(agent);

        agent.state = 'terminated';
        agent.status = 'terminated';

        this.emit('agent:terminated', { agentId, reason });

        logger.info({ agentId, reason }, 'Agent terminated');

        return true;
    }

    /**
     * Terminate all agents for a session
     */
    async terminateSession(sessionId: string): Promise<number> {
        let count = 0;

        for (const [agentId, agent] of this.agents) {
            if (agent.sessionId === sessionId) {
                await this.terminateAgent(agentId, 'session_terminated');
                count++;
            }
        }

        logger.info({ sessionId, count }, 'Session agents terminated');
        return count;
    }

    /**
     * Terminate all agents
     */
    async terminateAll(): Promise<number> {
        let count = 0;

        for (const agentId of this.agents.keys()) {
            await this.terminateAgent(agentId, 'manager_shutdown');
            count++;
        }

        this.queue = [];
        this.activeCount = 0;
        this.slotWaiters = [];

        logger.info({ count }, 'All agents terminated');
        return count;
    }

    // ========================================================================
    // Query Methods
    // ========================================================================

    /**
     * Get a specific agent
     */
    getAgent(agentId: string): ManagedAgent | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Get all active agents (optionally filtered by session)
     */
    getActiveAgents(sessionId?: string): ManagedAgent[] {
        const active = Array.from(this.agents.values()).filter(
            agent => agent.state === 'working' || agent.state === 'initializing'
        );

        if (sessionId) {
            return active.filter(agent => agent.sessionId === sessionId);
        }

        return active;
    }

    /**
     * Get queued agents
     */
    getQueuedAgents(): ManagedAgent[] {
        return [...this.queue];
    }

    /**
     * Get agent counts
     */
    getAgentCount(): { active: number; queued: number; total: number } {
        return {
            active: this.activeCount,
            queued: this.queue.length,
            total: this.agents.size,
        };
    }

    // ========================================================================
    // Configuration
    // ========================================================================

    /**
     * Dynamically adjust max concurrency
     */
    setMaxConcurrency(max: number): void {
        this.config.maxConcurrentAgents = max;
        logger.info({ maxConcurrent: max }, 'Max concurrency updated');

        // Process queue in case we can now start more agents
        this.processQueue();
    }

    /**
     * Pause queue processing
     */
    pause(): void {
        this.paused = true;
        logger.info('AgentManager paused');
    }

    /**
     * Resume queue processing
     */
    resume(): void {
        this.paused = false;
        logger.info('AgentManager resumed');
        this.processQueue();
    }

    /**
     * Check if manager is paused
     */
    isPaused(): boolean {
        return this.paused;
    }

    // ========================================================================
    // Utilities
    // ========================================================================

    /**
     * Wait for an agent to complete (resolve on success, reject on failure)
     */
    private waitForCompletion(agentId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const checkCompletion = () => {
                const agent = this.agents.get(agentId);
                if (!agent) {
                    reject(new Error('Agent not found'));
                    return;
                }

                if (agent.state === 'completed') {
                    resolve();
                    return;
                }

                if (agent.state === 'failed' || agent.state === 'terminated') {
                    reject(new Error(`Agent ${agent.state}`));
                    return;
                }

                // Still running, set up event listeners
                const completedHandler = (data: { agentId: string }) => {
                    if (data.agentId === agentId) {
                        cleanup();
                        resolve();
                    }
                };

                const failedHandler = (data: { agentId: string; error: string; retrying: boolean }) => {
                    if (data.agentId === agentId && !data.retrying) {
                        cleanup();
                        reject(new Error(data.error));
                    }
                };

                const terminatedHandler = (data: { agentId: string }) => {
                    if (data.agentId === agentId) {
                        cleanup();
                        reject(new Error('Agent terminated'));
                    }
                };

                const cleanup = () => {
                    this.removeListener('agent:completed', completedHandler);
                    this.removeListener('agent:failed', failedHandler);
                    this.removeListener('agent:terminated', terminatedHandler);
                };

                this.on('agent:completed', completedHandler);
                this.on('agent:failed', failedHandler);
                this.on('agent:terminated', terminatedHandler);
            };

            checkCompletion();
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const agentManager = new AgentManager();
export default agentManager;
