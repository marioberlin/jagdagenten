/**
 * CoworkOrchestrator
 *
 * Main orchestration service implementing the deep work loop:
 * Analyze → Plan → Execute → Report
 *
 * Supports both in-memory storage (for development) and database persistence.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger';
import { taskPlanner } from './planner';
import { sandboxManager } from './sandbox';
import {
    a2aTaskBridge,
    agentDiscoveryService,
    type RemoteAgentConfig,
} from './a2a-bridge';
import {
    coworkTaskExecutor,
    type ExecutionContext,
} from './executor';
import {
    permissionService,
    type PermissionService,
} from './permissions';
import {
    agentManager,
    type AgentManager,
    type AgentSpawnRequest,
} from './agent-manager';
import {
    sessionRepository,
    subTaskRepository,
    artifactRepository,
    agentRepository,
    queueRepository,
    notificationRepository,
    fileOperationRepository,
    type SessionSummary,
    type QueueStats,
} from './repository';
import type {
    CoworkSession,
    CoworkSessionStatus,
    CoworkPhase,
    TaskPlan,
    PlanStep,
    PlanModification,
    CoworkSubTask,
    CoworkArtifact,
    AgentInstance,
    WorkspaceConfig,
    CreateSessionOptions,
    OrchestratorConfig,
    TaskContext
} from './types';

const logger = componentLoggers.http;

// In-memory session store (fallback when DB is unavailable)
const memoryStore = new Map<string, CoworkSession>();

// Configuration for storage mode
interface StorageConfig {
    useDatabase: boolean;
    fallbackToMemory: boolean;
}

// Configuration for remote agent delegation
interface RemoteAgentDelegation {
    enabled: boolean;
    preferRemote: boolean;
    discoveredAgents: RemoteAgentConfig[];
}

/**
 * CoworkOrchestrator
 *
 * Implements the Analyze → Plan → Execute → Report loop.
 * Supports both database persistence and in-memory fallback.
 */
export class CoworkOrchestrator extends EventEmitter {
    private config: OrchestratorConfig;
    private storage: StorageConfig;
    private dbAvailable: boolean = false;
    private remoteAgents: RemoteAgentDelegation;
    private permissionService: PermissionService;
    private agentManager: AgentManager;

    constructor(config: OrchestratorConfig = {}) {
        super();
        this.config = {
            maxConcurrentAgents: config.maxConcurrentAgents || 3,
            defaultTimeout: config.defaultTimeout || 300000, // 5 minutes
            ...config
        };

        // Default to database with memory fallback
        this.storage = {
            useDatabase: process.env.COWORK_USE_DATABASE !== 'false',
            fallbackToMemory: true
        };

        // Remote agent delegation config
        this.remoteAgents = {
            enabled: process.env.COWORK_A2A_ENABLED === 'true',
            preferRemote: process.env.COWORK_PREFER_REMOTE === 'true',
            discoveredAgents: [],
        };

        // Initialize permission service with session resolver
        this.permissionService = permissionService;
        this.permissionService.setSessionResolver((sessionId) => {
            // Sync lookup from memory store (for non-async context)
            return memoryStore.get(sessionId);
        });
        this.permissionService.setSandboxPathResolver((sandboxId) => {
            // Sandbox path resolution
            return sandboxManager.getSandboxPath(sandboxId);
        });

        // Initialize agent manager
        this.agentManager = agentManager;

        // Forward agent manager events
        this.setupAgentManagerEvents();

        // Test database connectivity on startup
        this.checkDatabaseConnection();

        // Discover remote agents if A2A enabled
        if (this.remoteAgents.enabled) {
            this.discoverRemoteAgents();
        }
    }

    /**
     * Set up event forwarding from AgentManager
     */
    private setupAgentManagerEvents(): void {
        this.agentManager.on('agent:queued', (data) => {
            logger.debug({ ...data }, 'Agent queued');
        });

        this.agentManager.on('agent:starting', (data) => {
            this.emit('agent_spawned', {
                sessionId: data.sessionId,
                agentId: data.agentId,
                name: `Agent-${data.subTaskId.slice(-4)}`,
                task: data.subTaskId
            });
        });

        this.agentManager.on('agent:progress', (data) => {
            this.emit('agent_progress', {
                sessionId: '', // Will be filled by the specific handler
                agentId: data.agentId,
                progress: data.progress,
                status: 'working'
            });
            this.emit('agent_thinking', {
                sessionId: '',
                agentId: data.agentId,
                thought: data.thought
            });
        });

        this.agentManager.on('agent:completed', (data) => {
            this.emit('agent_completed', {
                sessionId: '', // Will be filled by the specific handler
                agentId: data.agentId,
                success: data.result.success,
                result: data.result.output
            });
        });

        this.agentManager.on('agent:failed', (data) => {
            if (!data.retrying) {
                this.emit('agent_completed', {
                    sessionId: '',
                    agentId: data.agentId,
                    success: false,
                    result: data.error
                });
            }
        });

        this.agentManager.on('agent:terminated', (data) => {
            logger.info({ agentId: data.agentId, reason: data.reason }, 'Agent terminated');
        });

        this.agentManager.on('pool:exhausted', (data) => {
            logger.warn({ queueLength: data.queueLength }, 'Agent pool exhausted');
        });
    }

    /**
     * Discover available remote A2A agents
     */
    private async discoverRemoteAgents(): Promise<void> {
        try {
            const agents = await agentDiscoveryService.discoverAgents();
            this.remoteAgents.discoveredAgents = agents;
            logger.info({ count: agents.length }, 'Discovered remote A2A agents');
        } catch (error) {
            logger.error({ error }, 'Failed to discover remote agents');
        }
    }

    /**
     * Add a remote agent for delegation
     */
    async addRemoteAgent(url: string): Promise<RemoteAgentConfig | null> {
        const agent = await agentDiscoveryService.addAgent(url);
        if (agent) {
            this.remoteAgents.discoveredAgents.push(agent);
            logger.info({ url, name: agent.card.name }, 'Added remote agent');
        }
        return agent;
    }

    /**
     * Get available remote agents
     */
    getRemoteAgents(): RemoteAgentConfig[] {
        return this.remoteAgents.discoveredAgents;
    }

    /**
     * Enable or disable remote agent delegation
     */
    setRemoteAgentDelegation(enabled: boolean, preferRemote = false): void {
        this.remoteAgents.enabled = enabled;
        this.remoteAgents.preferRemote = preferRemote;
        logger.info({ enabled, preferRemote }, 'Remote agent delegation updated');
    }

    /**
     * Check if database is available
     */
    private async checkDatabaseConnection(): Promise<void> {
        if (!this.storage.useDatabase) {
            this.dbAvailable = false;
            logger.info('Cowork using in-memory storage (database disabled)');
            return;
        }

        try {
            // Try a simple query to test connectivity
            await sessionRepository.getByUserId('test-connection', 1);
            this.dbAvailable = true;
            logger.info('Cowork database connection established');
        } catch (error) {
            this.dbAvailable = false;
            if (this.storage.fallbackToMemory) {
                logger.warn({ error }, 'Database unavailable, falling back to in-memory storage');
            } else {
                logger.error({ error }, 'Database unavailable and fallback disabled');
            }
        }
    }

    /**
     * Get storage mode info
     */
    getStorageInfo(): { mode: 'database' | 'memory'; dbAvailable: boolean } {
        return {
            mode: this.dbAvailable ? 'database' : 'memory',
            dbAvailable: this.dbAvailable
        };
    }

    /**
     * Save session to storage (database or memory)
     */
    private async saveSession(session: CoworkSession): Promise<void> {
        if (this.dbAvailable) {
            try {
                const existing = await sessionRepository.getById(session.id);
                if (existing) {
                    await sessionRepository.update(session.id, session);
                } else {
                    await sessionRepository.create(session);
                }
            } catch (error) {
                logger.error({ sessionId: session.id, error }, 'Failed to save session to database');
                if (this.storage.fallbackToMemory) {
                    memoryStore.set(session.id, session);
                }
            }
        } else {
            memoryStore.set(session.id, session);
        }
    }

    /**
     * Load session from storage
     */
    private async loadSession(sessionId: string): Promise<CoworkSession | null> {
        if (this.dbAvailable) {
            try {
                return await sessionRepository.getById(sessionId);
            } catch (error) {
                logger.error({ sessionId, error }, 'Failed to load session from database');
                if (this.storage.fallbackToMemory) {
                    return memoryStore.get(sessionId) || null;
                }
                return null;
            }
        }
        return memoryStore.get(sessionId) || null;
    }

    /**
     * Load all sessions for a user
     */
    async getSessionHistory(userId: string, limit = 50): Promise<SessionSummary[]> {
        if (this.dbAvailable) {
            try {
                return await sessionRepository.getByUserId(userId, limit);
            } catch (error) {
                logger.error({ userId, error }, 'Failed to load session history from database');
            }
        }

        // Fall back to memory
        const sessions: SessionSummary[] = [];
        for (const session of memoryStore.values()) {
            if (session.userId === userId) {
                sessions.push({
                    id: session.id,
                    title: session.title,
                    description: session.description,
                    status: session.status,
                    artifactCount: session.artifacts?.length || 0,
                    createdAt: session.createdAt,
                    completedAt: session.completedAt,
                });
            }
        }
        return sessions.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, limit);
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(userId: string): Promise<QueueStats> {
        if (this.dbAvailable) {
            try {
                return await queueRepository.getStats(userId);
            } catch (error) {
                logger.error({ userId, error }, 'Failed to get queue stats from database');
            }
        }

        // Calculate from memory
        let queued = 0, active = 0, paused = 0, completed = 0, failed = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const session of memoryStore.values()) {
            if (session.userId !== userId) continue;
            switch (session.status) {
                case 'planning':
                case 'awaiting_approval':
                    queued++;
                    break;
                case 'executing':
                    active++;
                    break;
                case 'paused':
                    paused++;
                    break;
                case 'completed':
                    if (session.completedAt && new Date(session.completedAt) >= today) completed++;
                    break;
                case 'failed':
                    if (session.completedAt && new Date(session.completedAt) >= today) failed++;
                    break;
            }
        }

        return { queuedCount: queued, activeCount: active, pausedCount: paused, completedToday: completed, failedToday: failed };
    }

    /**
     * Create a new Cowork session
     */
    async createSession(
        userId: string,
        description: string,
        options: CreateSessionOptions = {}
    ): Promise<CoworkSession> {
        const sessionId = `cw_${Date.now()}_${randomUUID().slice(0, 8)}`;

        // Create workspace config first
        let workspace = this.createWorkspaceConfig(options);
        let sandboxId: string | undefined;

        // Create sandbox if requested
        if (options.useSandbox && options.sandboxConfig?.sourceRoot) {
            try {
                const sandbox = await sandboxManager.createSandbox({
                    sessionId,
                    userId,
                    sourceRoot: options.sandboxConfig.sourceRoot,
                    excludePatterns: options.sandboxConfig.excludePatterns || [
                        'node_modules/**',
                        '.git/**',
                        'dist/**',
                        '.env*'
                    ],
                    expiresInHours: options.sandboxConfig.expiresInHours || 24
                });

                sandboxId = sandbox.id;

                // Update workspace to use sandbox paths
                workspace = {
                    ...workspace,
                    inputPaths: [sandbox.sandboxRoot],
                    outputPath: sandbox.sandboxRoot,
                    tempPath: `${sandbox.sandboxRoot}/.tmp`
                };

                logger.info({ sessionId, sandboxId }, 'Sandbox created for session');
                this.emit('sandbox_created', { sessionId, sandboxId });
            } catch (error: any) {
                logger.error({ sessionId, error }, 'Failed to create sandbox');
                // Continue without sandbox - fallback to direct file access
            }
        }

        const session: CoworkSession = {
            id: sessionId,
            userId,
            title: await taskPlanner.generateTitle(description),
            description,
            status: 'planning',
            phase: 'task_analysis',
            plan: null,
            subTasks: [],
            activeAgents: [],
            workspace,
            fileOperations: [],
            artifacts: [],
            createdAt: new Date(),
            tokensUsed: 0,
            estimatedCost: 0,
            // Sandbox fields
            sandboxId,
            useSandbox: options.useSandbox
        };

        // Store in storage (database or memory)
        await this.saveSession(session);

        // Add to queue if database is available
        if (this.dbAvailable) {
            try {
                await queueRepository.addToQueue(sessionId, userId, 5); // default priority
            } catch (error) {
                logger.error({ sessionId, error }, 'Failed to add session to queue');
            }
        }

        logger.info({ sessionId, title: session.title, useSandbox: !!sandboxId }, 'Cowork session created');

        // Emit creation event
        this.emit('session_created', { sessionId, title: session.title });

        // Start planning automatically (non-blocking)
        this.generatePlan(sessionId).catch(err => {
            logger.error({ sessionId, error: err }, 'Failed to generate plan');
            this.emit('error', { sessionId, error: err.message });
        });

        return session;
    }

    /**
     * Generate execution plan using AI
     */
    async generatePlan(sessionId: string): Promise<TaskPlan> {
        const session = await this.getSession(sessionId);

        await this.updateStatus(sessionId, 'planning', 'plan_generation');
        this.emit('planning_started', { sessionId });

        try {
            // Use AI-powered TaskPlanner
            const plan = await taskPlanner.generatePlan({
                sessionId,
                description: session.description,
                context: {
                    workspacePath: session.workspace.outputPath,
                    existingFiles: session.workspace.inputPaths,
                    userPreferences: {}
                }
            });

            // Update session with plan
            session.plan = plan;
            session.status = 'awaiting_approval';
            session.phase = 'user_review';

            await this.saveSession(session);
            this.emit('plan_ready', { sessionId, plan });

            logger.info({ sessionId, stepsCount: plan.steps.length }, 'Plan generated');

            return plan;
        } catch (error: any) {
            await this.updateStatus(sessionId, 'failed', 'plan_generation');
            this.emit('error', { sessionId, error: error.message });
            throw error;
        }
    }

    /**
     * User approves the plan - begin execution
     */
    async approvePlan(
        sessionId: string,
        modifications?: PlanModification[]
    ): Promise<void> {
        const session = await this.getSession(sessionId);

        if (session.status !== 'awaiting_approval') {
            throw new Error(`Cannot approve plan in status: ${session.status}`);
        }

        // Apply any user modifications
        if (modifications?.length && session.plan) {
            session.plan = this.applyModifications(session.plan, modifications);
        }

        logger.info({ sessionId }, 'Plan approved');
        this.emit('plan_approved', { sessionId });

        // Start execution
        await this.startExecution(sessionId);
    }

    /**
     * Begin task execution
     */
    async startExecution(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);

        await this.updateStatus(sessionId, 'executing', 'agent_dispatch');
        session.startedAt = new Date();

        try {
            // Convert plan steps to executable sub-tasks
            session.subTasks = this.planToSubTasks(session.plan!);
            await this.saveSession(session);

            // Execute steps sequentially for now (parallel groups in future)
            for (const subTask of session.subTasks) {
                if (session.status === 'cancelled' || session.status === 'paused') {
                    break;
                }

                await this.updatePhase(sessionId, 'parallel_execution');
                await this.executeSubTask(session, subTask);
            }

            // Check if cancelled
            const currentSession = await this.loadSession(sessionId);
            if (currentSession?.status === 'cancelled') {
                return;
            }

            // Aggregate results
            await this.updatePhase(sessionId, 'result_aggregation');
            await this.aggregateResults(session);

            // Complete
            await this.updatePhase(sessionId, 'output_delivery');
            await this.updateStatus(sessionId, 'completed', 'output_delivery');

            session.completedAt = new Date();
            await this.saveSession(session);

            const summary = this.generateSummary(session);

            logger.info({ sessionId, summary }, 'Session completed');

            this.emit('session_completed', {
                sessionId,
                summary,
                artifacts: session.artifacts
            });

        } catch (error: any) {
            await this.updateStatus(sessionId, 'failed', session.phase);
            logger.error({ sessionId, error }, 'Session execution failed');
            this.emit('session_failed', { sessionId, error: error.message });
            throw error;
        }
    }

    /**
     * Execute a single sub-task (local or remote)
     */
    private async executeSubTask(
        session: CoworkSession,
        subTask: CoworkSubTask,
        remoteAgent?: RemoteAgentConfig
    ): Promise<void> {
        // Check if we should use a remote agent
        if (!remoteAgent && this.remoteAgents.enabled) {
            remoteAgent = this.findRemoteAgentForTask(subTask);
        }

        if (remoteAgent) {
            return this.executeOnRemoteAgent(session, subTask, remoteAgent);
        }

        // Execute locally
        return this.executeSubTaskLocally(session, subTask);
    }

    /**
     * Find a suitable remote agent for a subtask
     */
    private findRemoteAgentForTask(subTask: CoworkSubTask): RemoteAgentConfig | null {
        if (!this.remoteAgents.enabled || this.remoteAgents.discoveredAgents.length === 0) {
            return null;
        }

        const bestAgent = a2aTaskBridge.findBestAgent(
            subTask,
            this.remoteAgents.discoveredAgents
        );

        if (bestAgent) {
            logger.info({
                subtaskId: subTask.id,
                agentName: bestAgent.card.name,
                agentUrl: bestAgent.url,
            }, 'Found matching remote agent for subtask');
        }

        return bestAgent;
    }

    /**
     * Execute a subtask on a remote A2A agent
     */
    private async executeOnRemoteAgent(
        session: CoworkSession,
        subTask: CoworkSubTask,
        agentConfig: RemoteAgentConfig
    ): Promise<void> {
        // Create agent instance for tracking
        const agent = a2aTaskBridge.createAgentInstance(
            session.id,
            subTask.id,
            agentConfig
        );

        session.activeAgents.push(agent);
        subTask.agentId = agent.id;
        subTask.status = 'in_progress';
        subTask.startedAt = new Date();

        this.emit('agent_spawned', {
            sessionId: session.id,
            agentId: agent.id,
            name: agent.name,
            task: subTask.title
        });

        try {
            // Update status
            agent.status = 'working';
            agent.currentThought = `Delegating to ${agentConfig.card.name}...`;
            session.currentThought = agent.currentThought;
            await this.saveSession(session);

            this.emit('agent_thinking', {
                sessionId: session.id,
                agentId: agent.id,
                thought: agent.currentThought
            });

            // Execute on remote agent
            const result = await a2aTaskBridge.executeOnRemoteAgent(
                subTask,
                agentConfig,
                { streaming: true }
            );

            // Transform result
            subTask.completedAt = new Date();

            if (result.success) {
                subTask.status = 'completed';
                subTask.result = a2aTaskBridge.transformToSubTaskResult(result);
                agent.status = 'completed';
                agent.progress = 100;

                // Create artifacts from remote results
                for (const artifactId of result.artifacts) {
                    const artifact: CoworkArtifact = {
                        id: artifactId,
                        sessionId: session.id,
                        type: 'file',
                        name: `remote-artifact-${artifactId}`,
                        createdAt: new Date(),
                        metadata: {
                            source: 'remote',
                            agentUrl: agentConfig.url,
                            agentName: agentConfig.card.name,
                        }
                    };
                    session.artifacts.push(artifact);
                    this.emit('artifact_produced', { sessionId: session.id, artifact });
                }

                this.emit('agent_completed', {
                    sessionId: session.id,
                    agentId: agent.id,
                    success: true,
                    result: result.output
                });

                logger.info({
                    sessionId: session.id,
                    subtaskId: subTask.id,
                    agentUrl: agentConfig.url,
                    duration: result.duration,
                }, 'Remote agent completed subtask');

            } else {
                subTask.status = 'failed';
                subTask.error = result.error;
                subTask.result = a2aTaskBridge.transformToSubTaskResult(result);
                agent.status = 'failed';

                this.emit('agent_completed', {
                    sessionId: session.id,
                    agentId: agent.id,
                    success: false,
                    result: result.error
                });

                logger.error({
                    sessionId: session.id,
                    subtaskId: subTask.id,
                    agentUrl: agentConfig.url,
                    error: result.error,
                }, 'Remote agent failed subtask');

                throw new Error(result.error || 'Remote agent execution failed');
            }

        } catch (error: any) {
            if (subTask.status !== 'failed') {
                agent.status = 'failed';
                subTask.status = 'failed';
                subTask.error = error.message;

                this.emit('agent_completed', {
                    sessionId: session.id,
                    agentId: agent.id,
                    success: false,
                    result: error.message
                });
            }

            throw error;
        } finally {
            session.activeAgents = session.activeAgents.filter(a => a.id !== agent.id);
            await this.saveSession(session);
        }
    }

    /**
     * Execute a subtask locally using the TaskExecutor
     */
    private async executeSubTaskLocally(
        session: CoworkSession,
        subTask: CoworkSubTask
    ): Promise<void> {
        // Validate permissions before execution
        const permCheck = await this.permissionService.checkPermission({
            sessionId: session.id,
            operation: 'read',
            path: session.workspace.outputPath,
            agentId: subTask.id,
        });

        if (!permCheck.allowed) {
            throw new Error(`Permission denied for workspace access: ${permCheck.reason}`);
        }

        // Spawn agent for this sub-task
        const agent: AgentInstance = {
            id: randomUUID(),
            sessionId: session.id,
            subTaskId: subTask.id,
            name: `Agent-${subTask.order}`,
            status: 'initializing',
            progress: 0,
            currentThought: null,
            spawnedAt: new Date()
        };

        session.activeAgents.push(agent);
        subTask.agentId = agent.id;
        subTask.status = 'in_progress';
        subTask.startedAt = new Date();

        this.emit('agent_spawned', {
            sessionId: session.id,
            agentId: agent.id,
            name: agent.name,
            task: subTask.title
        });

        try {
            // Check if we should use real execution
            const useRealExecution = process.env.COWORK_REAL_EXECUTION === 'true';

            if (useRealExecution) {
                // Use the TaskExecutor for real execution
                await this.executeWithTaskExecutor(session, subTask, agent);
            } else {
                // Use simulated execution (for development/testing)
                await this.executeSimulated(session, subTask, agent);
            }

        } catch (error: any) {
            agent.status = 'failed';
            subTask.status = 'failed';
            subTask.error = error.message;

            this.emit('agent_completed', {
                sessionId: session.id,
                agentId: agent.id,
                success: false,
                result: error.message
            });

            throw error;
        } finally {
            // Remove from active agents
            session.activeAgents = session.activeAgents.filter((a: AgentInstance) => a.id !== agent.id);
            await this.saveSession(session);
        }
    }

    /**
     * Execute subtask using the real TaskExecutor
     */
    private async executeWithTaskExecutor(
        session: CoworkSession,
        subTask: CoworkSubTask,
        agent: AgentInstance
    ): Promise<void> {
        // Update status
        agent.status = 'working';
        agent.currentThought = `Executing: ${subTask.title}...`;
        session.currentThought = agent.currentThought;
        await this.saveSession(session);

        this.emit('agent_thinking', {
            sessionId: session.id,
            agentId: agent.id,
            thought: agent.currentThought
        });

        // Build execution context
        const context: ExecutionContext = {
            session,
            subTask,
            workspace: session.workspace,
            sandboxRoot: session.sandboxId ? session.workspace.outputPath : undefined,
        };

        // Listen for output events
        const outputHandler = (data: any) => {
            if (data.subtaskId === subTask.id) {
                // Emit progress based on output
                this.emit('agent_thinking', {
                    sessionId: session.id,
                    agentId: agent.id,
                    thought: data.data.slice(0, 200),
                });
            }
        };

        coworkTaskExecutor.on('output', outputHandler);

        try {
            // Execute the task
            const result = await coworkTaskExecutor.execute(context);

            // Transform result
            subTask.completedAt = new Date();
            subTask.result = coworkTaskExecutor.toSubTaskResult(result);

            if (result.success) {
                subTask.status = 'completed';
                agent.status = 'completed';
                agent.progress = 100;

                // Add artifacts to session
                for (const artifact of result.artifacts) {
                    session.artifacts.push(artifact);
                    this.emit('artifact_produced', { sessionId: session.id, artifact });
                }

                this.emit('agent_completed', {
                    sessionId: session.id,
                    agentId: agent.id,
                    success: true,
                    result: subTask.result.output
                });

                logger.info({
                    sessionId: session.id,
                    subtaskId: subTask.id,
                    duration: result.duration,
                    filesModified: result.filesModified.length,
                }, 'Local execution completed');

            } else {
                subTask.status = 'failed';
                subTask.error = result.error;
                agent.status = 'failed';

                this.emit('agent_completed', {
                    sessionId: session.id,
                    agentId: agent.id,
                    success: false,
                    result: result.error
                });

                throw new Error(result.error || 'Execution failed');
            }

        } finally {
            coworkTaskExecutor.removeListener('output', outputHandler);
        }
    }

    /**
     * Simulated execution for development/testing
     */
    private async executeSimulated(
        session: CoworkSession,
        subTask: CoworkSubTask,
        agent: AgentInstance
    ): Promise<void> {
        // Simulate agent work
        for (let progress = 0; progress <= 100; progress += 20) {
            // Check for pause/cancel
            const currentSession = await this.loadSession(session.id);
            if (currentSession?.status === 'cancelled') {
                agent.status = 'terminated';
                return;
            }
            if (currentSession?.status === 'paused') {
                // Wait for resume
                let pausedSession = await this.loadSession(session.id);
                while (pausedSession?.status === 'paused') {
                    await this.delay(500);
                    pausedSession = await this.loadSession(session.id);
                }
            }

            agent.status = progress < 50 ? 'thinking' : 'working';
            agent.progress = progress;
            agent.currentThought = this.generateThought(subTask.title, progress);

            session.currentThought = agent.currentThought;
            await this.saveSession(session);

            this.emit('agent_progress', {
                sessionId: session.id,
                agentId: agent.id,
                progress,
                status: agent.status
            });

            this.emit('agent_thinking', {
                sessionId: session.id,
                agentId: agent.id,
                thought: agent.currentThought
            });

            await this.delay(500);
        }

        // Complete
        subTask.status = 'completed';
        subTask.completedAt = new Date();
        subTask.result = {
            success: true,
            output: `Completed: ${subTask.title}`,
            artifacts: [],
            filesModified: [],
            tokensUsed: 150,
            duration: Date.now() - (subTask.startedAt?.getTime() || Date.now())
        };

        agent.status = 'completed';
        agent.progress = 100;

        // Create a sample artifact
        const artifact: CoworkArtifact = {
            id: randomUUID(),
            sessionId: session.id,
            type: 'file',
            name: `output-${subTask.order}.txt`,
            createdAt: new Date()
        };
        session.artifacts.push(artifact);

        this.emit('artifact_produced', { sessionId: session.id, artifact });

        this.emit('agent_completed', {
            sessionId: session.id,
            agentId: agent.id,
            success: true,
            result: subTask.result.output
        });
    }

    /**
     * Execute multiple subtasks in parallel using AgentManager
     * Use this when executing parallelizable steps
     */
    async executeParallelSubTasks(
        session: CoworkSession,
        subTasks: CoworkSubTask[]
    ): Promise<void> {
        if (subTasks.length === 0) return;

        // Validate permissions for the workspace
        const permCheck = await this.permissionService.checkPermission({
            sessionId: session.id,
            operation: 'read',
            path: session.workspace.outputPath,
        });

        if (!permCheck.allowed) {
            throw new Error(`Permission denied for workspace: ${permCheck.reason}`);
        }

        // Build spawn requests for all subtasks
        const spawnRequests: AgentSpawnRequest[] = subTasks.map((subTask, idx) => ({
            sessionId: session.id,
            subTask,
            session,
            priority: subTasks.length - idx,  // Earlier tasks = higher priority
            timeout: this.config.defaultTimeout,
            onProgress: (progress: number, thought: string) => {
                this.emit('agent_progress', {
                    sessionId: session.id,
                    agentId: subTask.agentId || subTask.id,
                    progress,
                    status: 'working'
                });
                this.emit('agent_thinking', {
                    sessionId: session.id,
                    agentId: subTask.agentId || subTask.id,
                    thought
                });
            }
        }));

        logger.info({
            sessionId: session.id,
            subtaskCount: subTasks.length,
        }, 'Starting parallel execution with AgentManager');

        // Execute batch through AgentManager
        const result = await this.agentManager.spawnBatch(spawnRequests);

        // Process results
        for (const agent of result.successful) {
            const subTask = subTasks.find(st => st.id === agent.subTaskId);
            if (subTask) {
                subTask.status = 'completed';
                subTask.completedAt = new Date();
            }
        }

        for (const failure of result.failed) {
            const subTask = failure.request.subTask;
            subTask.status = 'failed';
            subTask.error = failure.error;
            subTask.completedAt = new Date();

            logger.error({
                sessionId: session.id,
                subtaskId: subTask.id,
                error: failure.error,
            }, 'Subtask failed in parallel execution');
        }

        await this.saveSession(session);

        logger.info({
            sessionId: session.id,
            successful: result.successful.length,
            failed: result.failed.length,
            duration: result.totalDuration,
        }, 'Parallel execution completed');
    }

    /**
     * Get permission service for external validation
     */
    getPermissionService(): PermissionService {
        return this.permissionService;
    }

    /**
     * Get agent manager for external control
     */
    getAgentManager(): AgentManager {
        return this.agentManager;
    }

    /**
     * Pause execution
     */
    async pauseSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);

        if (session.status !== 'executing') {
            throw new Error(`Cannot pause session in status: ${session.status}`);
        }

        session.status = 'paused';
        await this.saveSession(session);

        logger.info({ sessionId }, 'Session paused');

        this.emit('session_status_changed', {
            sessionId,
            status: 'paused',
            phase: session.phase
        });
    }

    /**
     * Resume paused execution
     */
    async resumeSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);

        if (session.status !== 'paused') {
            throw new Error(`Cannot resume session in status: ${session.status}`);
        }

        session.status = 'executing';
        await this.saveSession(session);

        logger.info({ sessionId }, 'Session resumed');

        this.emit('session_status_changed', {
            sessionId,
            status: 'executing',
            phase: session.phase
        });
    }

    /**
     * Cancel session
     */
    async cancelSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);

        session.status = 'cancelled';
        session.completedAt = new Date();
        await this.saveSession(session);

        // Cleanup sandbox if present
        if (session.sandboxId) {
            try {
                await sandboxManager.cleanup(session.sandboxId);
                logger.info({ sessionId, sandboxId: session.sandboxId }, 'Sandbox cleaned up on cancel');
                this.emit('sandbox_discarded', { sessionId, sandboxId: session.sandboxId });
            } catch (error: any) {
                logger.error({ sessionId, sandboxId: session.sandboxId, error }, 'Failed to cleanup sandbox');
            }
        }

        logger.info({ sessionId }, 'Session cancelled');

        this.emit('session_status_changed', {
            sessionId,
            status: 'cancelled',
            phase: session.phase
        });
    }

    /**
     * Send steering guidance to agents
     */
    async steerSession(sessionId: string, guidance: string): Promise<void> {
        const session = await this.getSession(sessionId);

        if (!['executing', 'paused'].includes(session.status)) {
            throw new Error(`Cannot steer session in status: ${session.status}`);
        }

        logger.info({ sessionId, guidance }, 'Steering guidance received');

        // In production, would broadcast to all active agents
        this.emit('steering_sent', { sessionId, guidance });

        // Acknowledge from each agent
        for (const agent of session.activeAgents) {
            this.emit('steering_acknowledged', { sessionId, agentId: agent.id });
        }
    }

    /**
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<CoworkSession> {
        const session = await this.loadSession(sessionId);

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        return session;
    }

    /**
     * Get user's sessions
     */
    async getUserSessions(
        userId: string,
        options: { limit?: number; status?: CoworkSessionStatus } = {}
    ): Promise<CoworkSession[]> {
        if (this.dbAvailable) {
            try {
                const sessions = await sessionRepository.getActiveSessions(userId);
                let filtered = sessions;
                if (options.status) {
                    filtered = sessions.filter(s => s.status === options.status);
                }
                return filtered.slice(0, options.limit || 20);
            } catch (error) {
                logger.error({ userId, error }, 'Failed to get user sessions from database');
            }
        }

        // Fallback to memory
        const userSessions: CoworkSession[] = [];

        for (const session of memoryStore.values()) {
            if (session.userId === userId) {
                if (!options.status || session.status === options.status) {
                    userSessions.push(session);
                }
            }
        }

        // Sort by creation date descending
        userSessions.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return userSessions.slice(0, options.limit || 20);
    }

    // ========================================================================
    // Sandbox Methods
    // ========================================================================

    /**
     * Get diff of changes made in sandbox
     */
    async getSandboxDiff(sessionId: string): Promise<any[]> {
        const session = await this.getSession(sessionId);

        if (!session.sandboxId) {
            throw new Error('Session does not have an associated sandbox');
        }

        return await sandboxManager.getDiff(session.sandboxId);
    }

    /**
     * Check for conflicts between sandbox and source files
     */
    async checkSandboxConflicts(sessionId: string): Promise<string[]> {
        const session = await this.getSession(sessionId);

        if (!session.sandboxId) {
            return [];
        }

        const sandbox = await sandboxManager.getSandbox(session.sandboxId);
        if (!sandbox) {
            return [];
        }

        const { conflictDetector } = await import('./sandbox');
        const changes = await conflictDetector.checkSourceChanges(sandbox);
        const conflictingFiles = changes.map(c => c.relativePath);

        if (conflictingFiles.length > 0) {
            this.emit('sandbox_conflict_detected', {
                sessionId,
                sandboxId: session.sandboxId,
                conflictingFiles
            });
        }

        return conflictingFiles;
    }

    /**
     * Apply sandbox changes to source files
     */
    async applySandboxChanges(
        sessionId: string,
        options: {
            selectedFiles?: string[];
            conflictResolution?: 'keep_sandbox' | 'keep_source' | 'manual';
        } = {}
    ): Promise<{
        success: boolean;
        filesApplied: number;
        backupId?: string;
        errors?: string[];
    }> {
        const session = await this.getSession(sessionId);

        if (!session.sandboxId) {
            throw new Error('Session does not have an associated sandbox');
        }

        await this.updateStatus(sessionId, 'merging', 'output_delivery');
        this.emit('sandbox_merge_started', { sessionId, sandboxId: session.sandboxId });

        try {
            const result = await sandboxManager.applyChanges({
                sandboxId: session.sandboxId,
                selectedFiles: options.selectedFiles,
                conflictResolution: options.conflictResolution || 'keep_sandbox',
                createBackup: true,
                userId: session.userId
            });

            if (result.success) {
                this.emit('sandbox_merge_completed', {
                    sessionId,
                    sandboxId: session.sandboxId,
                    filesApplied: result.filesApplied
                });
            }

            return result;
        } catch (error: any) {
            logger.error({ sessionId, error }, 'Failed to apply sandbox changes');
            throw error;
        }
    }

    /**
     * Discard sandbox changes without applying
     */
    async discardSandbox(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);

        if (!session.sandboxId) {
            throw new Error('Session does not have an associated sandbox');
        }

        await sandboxManager.cleanup(session.sandboxId);

        this.emit('sandbox_discarded', { sessionId, sandboxId: session.sandboxId });

        // Clear sandbox from session
        session.sandboxId = undefined;
        await this.saveSession(session);

        logger.info({ sessionId }, 'Sandbox discarded');
    }

    /**
     * Rollback sandbox merge using backup
     */
    async rollbackSandbox(sessionId: string, backupId: string): Promise<void> {
        const session = await this.getSession(sessionId);

        if (!session.sandboxId) {
            throw new Error('Session does not have an associated sandbox');
        }

        await sandboxManager.rollback(session.sandboxId, backupId);

        this.emit('sandbox_rollback', { sessionId, sandboxId: session.sandboxId, backupId });

        logger.info({ sessionId, backupId }, 'Sandbox rollback completed');
    }

    /**
     * Get sandbox backups for session
     */
    async getSandboxBackups(sessionId: string): Promise<any[]> {
        const session = await this.getSession(sessionId);

        if (!session.sandboxId) {
            return [];
        }

        return await sandboxManager.getBackups(session.sandboxId);
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    private async updateStatus(sessionId: string, status: CoworkSessionStatus, phase: string): Promise<void> {
        const session = await this.loadSession(sessionId);
        if (session) {
            session.status = status;
            session.phase = phase as any;
            await this.saveSession(session);
            this.emit('session_status_changed', { sessionId, status, phase });
        }
    }

    private async updatePhase(sessionId: string, phase: string): Promise<void> {
        const session = await this.loadSession(sessionId);
        if (session) {
            session.phase = phase as any;
            await this.saveSession(session);
        }
    }

    private async generateTitle(description: string): Promise<string> {
        // Simple title generation
        const words = description.split(' ').slice(0, 6);
        if (words.length < description.split(' ').length) {
            return words.join(' ') + '...';
        }
        return description;
    }

    private createWorkspaceConfig(options: CreateSessionOptions): WorkspaceConfig {
        return {
            id: randomUUID(),
            inputPaths: options.inputPaths || [],
            outputPath: options.outputPath || '/tmp/cowork/output',
            tempPath: `/tmp/cowork/${Date.now()}`,
            permissions: {
                read: true,
                write: true,
                delete: false,
                execute: false,
                network: false
            },
            allowedExtensions: ['*'],
            blockedExtensions: ['.env', '.key', '.pem'],
            maxFileSize: 50 * 1024 * 1024, // 50MB
            syncMode: 'auto'
        };
    }

    private generateStepsFromDescription(description: string): PlanStep[] {
        // In production, use LLM to generate steps
        // For now, generate placeholder steps
        return [
            {
                id: randomUUID(),
                order: 1,
                title: 'Analyze input and requirements',
                description: 'Parse the task description and identify key objectives',
                agentType: 'primary',
                estimatedDuration: '30s',
                dependencies: [],
                parallelizable: false,
                fileOperations: ['read']
            },
            {
                id: randomUUID(),
                order: 2,
                title: 'Gather relevant context',
                description: 'Collect necessary information from workspace',
                agentType: 'sub-agent',
                estimatedDuration: '45s',
                dependencies: [],
                parallelizable: true,
                fileOperations: ['read']
            },
            {
                id: randomUUID(),
                order: 3,
                title: 'Execute main task',
                description: 'Perform the core work as specified',
                agentType: 'primary',
                estimatedDuration: '2m',
                dependencies: [],
                parallelizable: false,
                fileOperations: ['create', 'update']
            },
            {
                id: randomUUID(),
                order: 4,
                title: 'Finalize and deliver results',
                description: 'Prepare output artifacts and summary',
                agentType: 'primary',
                estimatedDuration: '30s',
                dependencies: [],
                parallelizable: false,
                fileOperations: ['create']
            }
        ];
    }

    private planToSubTasks(plan: TaskPlan): CoworkSubTask[] {
        return plan.steps.map((step, index) => ({
            id: randomUUID(),
            sessionId: plan.sessionId,
            planStepId: step.id,
            order: index + 1,
            title: step.title,
            description: step.description,
            status: 'pending' as const,
            progress: 0
        }));
    }

    private applyModifications(plan: TaskPlan, modifications: PlanModification[]): TaskPlan {
        for (const mod of modifications) {
            const step = plan.steps.find(s => s.id === mod.stepId);
            if (step) {
                if (mod.action === 'remove') {
                    plan.steps = plan.steps.filter(s => s.id !== mod.stepId);
                } else if (mod.action === 'modify') {
                    if (mod.newTitle) step.title = mod.newTitle;
                    if (mod.newDescription) step.description = mod.newDescription;
                }
            }
        }
        return plan;
    }

    private async aggregateResults(session: CoworkSession): Promise<void> {
        session.tokensUsed = session.subTasks.reduce(
            (sum, task) => sum + (task.result?.tokensUsed || 0),
            0
        );
        session.estimatedCost = session.tokensUsed * 0.00001;
    }

    private generateSummary(session: CoworkSession): string {
        const completed = session.subTasks.filter(t => t.status === 'completed').length;
        const total = session.subTasks.length;
        const artifacts = session.artifacts.length;

        return `Completed ${completed}/${total} steps. Created ${artifacts} artifact(s).`;
    }

    private generateThought(taskTitle: string, progress: number): string {
        const thoughts = [
            'Analyzing the task requirements...',
            'Processing input data...',
            'Identifying key patterns...',
            'Generating initial results...',
            'Refining the output...',
            'Finalizing...'
        ];

        const index = Math.min(Math.floor(progress / 20), thoughts.length - 1);
        return thoughts[index];
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const coworkOrchestrator = new CoworkOrchestrator();
export default coworkOrchestrator;
