/**
 * A2ATaskBridge
 *
 * Translates Cowork task steps into A2A protocol messages and manages
 * execution on remote agents. Provides capability matching, result
 * transformation, and error handling.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger';
import type {
    CoworkSubTask,
    SubTaskResult,
    AgentInstance,
    AgentCard,
    AgentSkill,
} from './types';

const logger = componentLoggers.cowork || componentLoggers.http;

// ============================================================================
// Types
// ============================================================================

/** Remote agent configuration */
export interface RemoteAgentConfig {
    url: string;
    card: AgentCard;
    authToken?: string;
    timeout?: number;
}

/** A2A task execution options */
export interface A2AExecutionOptions {
    streaming?: boolean;
    contextId?: string;
    pushNotifications?: boolean;
    acceptedOutputModes?: string[];
}

/** A2A task states from the protocol */
export type A2ATaskState =
    | 'submitted'
    | 'working'
    | 'input-required'
    | 'completed'
    | 'failed'
    | 'canceled'
    | 'rejected';

/** A2A message structure */
export interface A2AMessage {
    role: 'user' | 'agent';
    parts: A2APart[];
    messageId?: string;
    contextId?: string;
    taskId?: string;
    metadata?: Record<string, unknown>;
}

/** A2A v1.0 File Part */
export interface A2AFilePart {
    fileWithUri?: string;    // URI reference to file
    fileWithBytes?: string;  // Base64-encoded file content
    mediaType?: string;      // MIME type (e.g., "application/pdf")
    name?: string;           // Optional filename
}

/** A2A v1.0 Data Part */
export interface A2ADataPart {
    data: unknown;           // Arbitrary JSON content
}

/** A2A v1.0 Part - mutually exclusive fields (spec compliant)
 *  Only one of text, file, or data should be set.
 */
export interface A2APart {
    text?: string;           // Text content
    file?: A2AFilePart;      // File content  
    data?: A2ADataPart;      // Structured data
    metadata?: Record<string, unknown>;
}

/** A2A task response */
export interface A2ATask {
    id: string;
    contextId?: string;
    status: {
        state: A2ATaskState;
        message?: A2AMessage;
        timestamp: string;
    };
    artifacts?: A2AArtifact[];
}

/** A2A artifact */
export interface A2AArtifact {
    id: string;
    type: string;
    title?: string;
    mimeType?: string;
    parts: A2APart[];
}

/** Capability match result */
export interface CapabilityMatch {
    matched: boolean;
    score: number;
    matchedSkills: AgentSkill[];
    missingCapabilities: string[];
}

/** Execution result */
export interface A2AExecutionResult {
    success: boolean;
    task: A2ATask;
    output?: string;
    artifacts: string[];
    tokensUsed?: number;
    duration: number;
    error?: string;
}

// ============================================================================
// A2A Task Bridge
// ============================================================================

export class A2ATaskBridge extends EventEmitter {
    private activeConnections = new Map<string, AbortController>();

    constructor() {
        super();
    }

    /**
     * Check if a remote agent can handle a subtask
     */
    matchCapabilities(
        subtask: CoworkSubTask,
        agentCard: AgentCard
    ): CapabilityMatch {
        const result: CapabilityMatch = {
            matched: false,
            score: 0,
            matchedSkills: [],
            missingCapabilities: [],
        };

        // Extract task requirements from description
        const taskKeywords = this.extractKeywords(subtask.title + ' ' + subtask.description);

        // Check against agent skills
        const skills = agentCard.skills || [];
        for (const skill of skills) {
            const skillKeywords = [
                skill.name.toLowerCase(),
                ...(skill.tags || []).map(t => t.toLowerCase()),
            ];

            const overlap = taskKeywords.filter(k => skillKeywords.some(sk => sk.includes(k)));
            if (overlap.length > 0) {
                result.matchedSkills.push(skill);
                result.score += overlap.length * 10;
            }
        }

        // Check A2A capabilities
        const capabilities = agentCard.extensions?.a2a?.capabilities || [];
        const requiredCapabilities = this.inferRequiredCapabilities(subtask);

        for (const required of requiredCapabilities) {
            if (capabilities.includes(required)) {
                result.score += 5;
            } else {
                result.missingCapabilities.push(required);
            }
        }

        // Determine if matched (score threshold)
        result.matched = result.score >= 10 && result.missingCapabilities.length === 0;

        return result;
    }

    /**
     * Find the best matching agent for a subtask from a list
     */
    findBestAgent(
        subtask: CoworkSubTask,
        agents: RemoteAgentConfig[]
    ): RemoteAgentConfig | null {
        let bestAgent: RemoteAgentConfig | null = null;
        let bestScore = 0;

        for (const agent of agents) {
            const match = this.matchCapabilities(subtask, agent.card);
            if (match.matched && match.score > bestScore) {
                bestAgent = agent;
                bestScore = match.score;
            }
        }

        return bestAgent;
    }

    /**
     * Translate a Cowork subtask into an A2A message
     */
    translateSubtaskToMessage(subtask: CoworkSubTask): A2AMessage {
        const parts: A2APart[] = [];

        // Build structured prompt
        const prompt = [
            `## Task: ${subtask.title}`,
            '',
            subtask.description,
            '',
            '## Instructions:',
            '- Complete the task as described above',
            '- Return results in a structured format',
            '- If you need clarification, indicate what information is needed',
        ].join('\n');

        parts.push({ text: prompt });

        return {
            role: 'user',
            parts,
        };
    }

    /**
     * Execute a subtask on a remote A2A agent
     */
    async executeOnRemoteAgent(
        subtask: CoworkSubTask,
        agentConfig: RemoteAgentConfig,
        options: A2AExecutionOptions = {}
    ): Promise<A2AExecutionResult> {
        const startTime = Date.now();
        const connectionId = `${subtask.id}_${randomUUID().slice(0, 8)}`;
        const abortController = new AbortController();

        this.activeConnections.set(connectionId, abortController);

        try {
            // Translate subtask to A2A message
            const message = this.translateSubtaskToMessage(subtask);

            // Build request
            const request = {
                jsonrpc: '2.0',
                id: randomUUID(),
                method: 'SendMessage',
                params: {
                    message,
                    configuration: {
                        acceptedOutputModes: options.acceptedOutputModes || ['text/plain', 'application/json'],
                    },
                },
            };

            logger.info({
                subtaskId: subtask.id,
                agentUrl: agentConfig.url,
                method: 'SendMessage',
            }, 'Sending A2A request to remote agent');

            // Make request
            const response = await fetch(`${agentConfig.url}/a2a`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(agentConfig.authToken && { Authorization: `Bearer ${agentConfig.authToken}` }),
                },
                body: JSON.stringify(request),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`A2A request failed: ${response.status} ${response.statusText}`);
            }

            const jsonResponse = await response.json() as {
                jsonrpc: string;
                id: string;
                result?: A2ATask;
                error?: { code: number; message: string };
            };

            if (jsonResponse.error) {
                throw new Error(`A2A error: ${jsonResponse.error.message}`);
            }

            const task = jsonResponse.result as A2ATask;
            const duration = Date.now() - startTime;

            // If streaming, poll for completion
            if (options.streaming && task.status.state === 'working') {
                return await this.pollForCompletion(task.id, agentConfig, duration, abortController);
            }

            // Transform result
            return this.transformTaskResult(task, duration);

        } catch (error: any) {
            const duration = Date.now() - startTime;

            if (error.name === 'AbortError') {
                logger.info({ subtaskId: subtask.id }, 'A2A request was cancelled');
                return {
                    success: false,
                    task: {
                        id: connectionId,
                        status: { state: 'canceled', timestamp: new Date().toISOString() },
                    },
                    artifacts: [],
                    duration,
                    error: 'Request cancelled',
                };
            }

            logger.error({
                subtaskId: subtask.id,
                agentUrl: agentConfig.url,
                error: error.message,
            }, 'A2A request failed');

            return {
                success: false,
                task: {
                    id: connectionId,
                    status: { state: 'failed', timestamp: new Date().toISOString() },
                },
                artifacts: [],
                duration,
                error: error.message,
            };
        } finally {
            this.activeConnections.delete(connectionId);
        }
    }

    /**
     * Poll for task completion (for streaming agents)
     */
    private async pollForCompletion(
        taskId: string,
        agentConfig: RemoteAgentConfig,
        initialDuration: number,
        abortController: AbortController,
        maxAttempts = 60,
        intervalMs = 1000
    ): Promise<A2AExecutionResult> {
        const startTime = Date.now() - initialDuration;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (abortController.signal.aborted) {
                return {
                    success: false,
                    task: {
                        id: taskId,
                        status: { state: 'canceled', timestamp: new Date().toISOString() },
                    },
                    artifacts: [],
                    duration: Date.now() - startTime,
                    error: 'Request cancelled',
                };
            }

            await this.delay(intervalMs);

            try {
                const request = {
                    jsonrpc: '2.0',
                    id: randomUUID(),
                    method: 'GetTask',
                    params: { id: taskId },
                };

                const response = await fetch(`${agentConfig.url}/a2a`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(agentConfig.authToken && { Authorization: `Bearer ${agentConfig.authToken}` }),
                    },
                    body: JSON.stringify(request),
                    signal: abortController.signal,
                });

                if (!response.ok) continue;

                const jsonResponse = await response.json() as {
                    result?: A2ATask;
                    error?: { code: number; message: string };
                };

                if (jsonResponse.error) continue;

                const task = jsonResponse.result as A2ATask;

                // Check for terminal states
                if (['completed', 'failed', 'canceled', 'rejected'].includes(task.status.state)) {
                    return this.transformTaskResult(task, Date.now() - startTime);
                }

                // Emit progress
                this.emit('task_progress', {
                    taskId,
                    state: task.status.state,
                    attempt,
                });

            } catch {
                // Continue polling on error
            }
        }

        // Timeout
        return {
            success: false,
            task: {
                id: taskId,
                status: { state: 'failed', timestamp: new Date().toISOString() },
            },
            artifacts: [],
            duration: Date.now() - startTime,
            error: 'Task polling timeout',
        };
    }

    /**
     * Transform A2A task result to Cowork format
     */
    private transformTaskResult(task: A2ATask, duration: number): A2AExecutionResult {
        const success = task.status.state === 'completed';

        // Extract text output from message
        let output = '';
        if (task.status.message) {
            output = task.status.message.parts
                .filter((p): p is A2APart & { text: string } => typeof p.text === 'string')
                .map(p => p.text)
                .join('\n');
        }

        // Extract artifacts
        const artifactIds: string[] = [];
        if (task.artifacts) {
            for (const artifact of task.artifacts) {
                artifactIds.push(artifact.id);
            }
        }

        return {
            success,
            task,
            output,
            artifacts: artifactIds,
            duration,
            error: success ? undefined : (output || 'Task failed'),
        };
    }

    /**
     * Transform A2A result to Cowork SubTaskResult
     */
    transformToSubTaskResult(a2aResult: A2AExecutionResult): SubTaskResult {
        return {
            success: a2aResult.success,
            output: a2aResult.output,
            artifacts: a2aResult.artifacts,
            filesModified: [],
            tokensUsed: a2aResult.tokensUsed || 0,
            duration: a2aResult.duration,
            summary: a2aResult.output?.slice(0, 200),
        };
    }

    /**
     * Create agent instance for tracking
     */
    createAgentInstance(
        sessionId: string,
        subtaskId: string,
        agentConfig: RemoteAgentConfig
    ): AgentInstance {
        return {
            id: randomUUID(),
            sessionId,
            subTaskId: subtaskId,
            name: agentConfig.card.name || 'Remote Agent',
            type: 'orchestrator',
            status: 'initializing',
            progress: 0,
            currentThought: `Connecting to ${agentConfig.card.name}...`,
            spawnedAt: new Date(),
        };
    }

    /**
     * Cancel an active remote execution
     */
    cancelExecution(connectionId: string): boolean {
        const controller = this.activeConnections.get(connectionId);
        if (controller) {
            controller.abort();
            this.activeConnections.delete(connectionId);
            return true;
        }
        return false;
    }

    /**
     * Cancel all active executions
     */
    cancelAllExecutions(): number {
        let count = 0;
        for (const [id, controller] of this.activeConnections) {
            controller.abort();
            this.activeConnections.delete(id);
            count++;
        }
        return count;
    }

    /**
     * Get active connection count
     */
    getActiveConnectionCount(): number {
        return this.activeConnections.size;
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Extract keywords from text for matching
     */
    private extractKeywords(text: string): string[] {
        // Common stop words to filter
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
            'that', 'these', 'those', 'it', 'its', 'which', 'what', 'who', 'whom',
        ]);

        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
    }

    /**
     * Infer required A2A capabilities from subtask
     */
    private inferRequiredCapabilities(subtask: CoworkSubTask): string[] {
        const capabilities: string[] = [];
        const text = (subtask.title + ' ' + subtask.description).toLowerCase();

        // File operations
        if (text.includes('file') || text.includes('document') || text.includes('read') || text.includes('write')) {
            capabilities.push('file-access');
        }

        // Code operations
        if (text.includes('code') || text.includes('program') || text.includes('script')) {
            capabilities.push('code-execution');
        }

        // Data processing
        if (text.includes('data') || text.includes('analyze') || text.includes('process')) {
            capabilities.push('data-processing');
        }

        // Web/API access
        if (text.includes('web') || text.includes('api') || text.includes('fetch') || text.includes('http')) {
            capabilities.push('network-access');
        }

        return capabilities;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================================
// Agent Discovery Service
// ============================================================================

export class AgentDiscoveryService {
    private knownAgents = new Map<string, RemoteAgentConfig>();
    private discoveryUrls = [
        'http://localhost:3000',
        'http://localhost:8000',
    ];

    /**
     * Discover agents at known URLs
     */
    async discoverAgents(): Promise<RemoteAgentConfig[]> {
        const discovered: RemoteAgentConfig[] = [];

        for (const baseUrl of this.discoveryUrls) {
            try {
                const agent = await this.probeAgent(baseUrl);
                if (agent) {
                    discovered.push(agent);
                    this.knownAgents.set(baseUrl, agent);
                }
            } catch {
                // Agent not available
            }
        }

        return discovered;
    }

    /**
     * Probe a URL for an A2A agent
     */
    async probeAgent(baseUrl: string, timeout = 5000): Promise<RemoteAgentConfig | null> {
        try {
            const response = await fetch(`${baseUrl}/.well-known/agent-card.json`, {
                signal: AbortSignal.timeout(timeout),
            });

            if (!response.ok) return null;

            const card = await response.json() as AgentCard;

            return {
                url: baseUrl,
                card,
            };
        } catch {
            return null;
        }
    }

    /**
     * Add a custom agent URL
     */
    async addAgent(url: string): Promise<RemoteAgentConfig | null> {
        const agent = await this.probeAgent(url);
        if (agent) {
            this.knownAgents.set(url, agent);
        }
        return agent;
    }

    /**
     * Remove an agent
     */
    removeAgent(url: string): boolean {
        return this.knownAgents.delete(url);
    }

    /**
     * Get all known agents
     */
    getKnownAgents(): RemoteAgentConfig[] {
        return Array.from(this.knownAgents.values());
    }

    /**
     * Get agent by URL
     */
    getAgent(url: string): RemoteAgentConfig | undefined {
        return this.knownAgents.get(url);
    }
}

// ============================================================================
// Singleton Exports
// ============================================================================

export const a2aTaskBridge = new A2ATaskBridge();
export const agentDiscoveryService = new AgentDiscoveryService();

export default {
    A2ATaskBridge,
    AgentDiscoveryService,
    a2aTaskBridge,
    agentDiscoveryService,
};
