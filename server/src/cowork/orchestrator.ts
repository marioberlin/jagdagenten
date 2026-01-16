/**
 * CoworkOrchestrator
 *
 * Main orchestration service implementing the deep work loop:
 * Analyze → Plan → Execute → Report
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger';
import { taskPlanner } from './planner';
import type {
    CoworkSession,
    CoworkSessionStatus,
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

// In-memory session store (in production, use database)
const sessions = new Map<string, CoworkSession>();

/**
 * CoworkOrchestrator
 *
 * Implements the Analyze → Plan → Execute → Report loop.
 */
export class CoworkOrchestrator extends EventEmitter {
    private config: OrchestratorConfig;

    constructor(config: OrchestratorConfig = {}) {
        super();
        this.config = {
            maxConcurrentAgents: config.maxConcurrentAgents || 3,
            defaultTimeout: config.defaultTimeout || 300000, // 5 minutes
            ...config
        };
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
            workspace: this.createWorkspaceConfig(options),
            fileOperations: [],
            artifacts: [],
            createdAt: new Date(),
            tokensUsed: 0,
            estimatedCost: 0
        };

        // Store in memory
        sessions.set(sessionId, session);

        logger.info({ sessionId, title: session.title }, 'Cowork session created');

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

        this.updateStatus(sessionId, 'planning', 'plan_generation');
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

            sessions.set(sessionId, session);
            this.emit('plan_ready', { sessionId, plan });

            logger.info({ sessionId, stepsCount: plan.steps.length }, 'Plan generated');

            return plan;
        } catch (error: any) {
            this.updateStatus(sessionId, 'failed', 'plan_generation');
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

        this.updateStatus(sessionId, 'executing', 'agent_dispatch');
        session.startedAt = new Date();

        try {
            // Convert plan steps to executable sub-tasks
            session.subTasks = this.planToSubTasks(session.plan!);
            sessions.set(sessionId, session);

            // Execute steps sequentially for now (parallel groups in future)
            for (const subTask of session.subTasks) {
                if (session.status === 'cancelled' || session.status === 'paused') {
                    break;
                }

                this.updatePhase(sessionId, 'parallel_execution');
                await this.executeSubTask(session, subTask);
            }

            // Check if cancelled
            const currentSession = sessions.get(sessionId);
            if (currentSession?.status === 'cancelled') {
                return;
            }

            // Aggregate results
            this.updatePhase(sessionId, 'result_aggregation');
            await this.aggregateResults(session);

            // Complete
            this.updatePhase(sessionId, 'output_delivery');
            this.updateStatus(sessionId, 'completed', 'output_delivery');

            session.completedAt = new Date();
            sessions.set(sessionId, session);

            const summary = this.generateSummary(session);

            logger.info({ sessionId, summary }, 'Session completed');

            this.emit('session_completed', {
                sessionId,
                summary,
                artifacts: session.artifacts
            });

        } catch (error: any) {
            this.updateStatus(sessionId, 'failed', session.phase);
            logger.error({ sessionId, error }, 'Session execution failed');
            this.emit('session_failed', { sessionId, error: error.message });
            throw error;
        }
    }

    /**
     * Execute a single sub-task
     */
    private async executeSubTask(
        session: CoworkSession,
        subTask: CoworkSubTask
    ): Promise<void> {
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
            // Simulate agent work
            for (let progress = 0; progress <= 100; progress += 20) {
                // Check for pause/cancel
                const currentSession = sessions.get(session.id);
                if (currentSession?.status === 'cancelled') {
                    agent.status = 'terminated';
                    return;
                }
                if (currentSession?.status === 'paused') {
                    // Wait for resume
                    while (sessions.get(session.id)?.status === 'paused') {
                        await this.delay(500);
                    }
                }

                agent.status = progress < 50 ? 'thinking' : 'working';
                agent.progress = progress;
                agent.currentThought = this.generateThought(subTask.title, progress);

                session.currentThought = agent.currentThought;
                sessions.set(session.id, session);

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
            session.activeAgents = session.activeAgents.filter(a => a.id !== agent.id);
            sessions.set(session.id, session);
        }
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
        sessions.set(sessionId, session);

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
        sessions.set(sessionId, session);

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
        sessions.set(sessionId, session);

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
        const session = sessions.get(sessionId);

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
        const userSessions: CoworkSession[] = [];

        for (const session of sessions.values()) {
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
    // Helper Methods
    // ========================================================================

    private updateStatus(sessionId: string, status: CoworkSessionStatus, phase: string) {
        const session = sessions.get(sessionId);
        if (session) {
            session.status = status;
            session.phase = phase as any;
            sessions.set(sessionId, session);
            this.emit('session_status_changed', { sessionId, status, phase });
        }
    }

    private updatePhase(sessionId: string, phase: string) {
        const session = sessions.get(sessionId);
        if (session) {
            session.phase = phase as any;
            sessions.set(sessionId, session);
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
