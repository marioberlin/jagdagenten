/**
 * Cowork Store
 *
 * State management for the Cowork deep work mode.
 * Handles session lifecycle, WebSocket events, and UI state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    CoworkSession,
    CoworkSessionSummary,
    TaskPlan,
    CoworkArtifact,
    AgentInstance,
    CoworkEvent,
    CreateSessionOptions,
    PlanModification
} from '@/types/cowork';

// ============================================================================
// State Interface
// ============================================================================

interface CoworkState {
    // Current active session
    activeSession: CoworkSession | null;

    // Session history (recent sessions)
    recentSessions: CoworkSessionSummary[];

    // UI state
    status: 'idle' | 'planning' | 'awaiting_approval' | 'executing' | 'paused' | 'completed' | 'failed';
    currentThought: string | null;
    planModalOpen: boolean;

    // WebSocket connection
    wsConnected: boolean;

    // Actions
    createSession: (description: string, options?: CreateSessionOptions) => Promise<string>;
    loadSession: (sessionId: string) => Promise<void>;
    approvePlan: (modifications?: PlanModification[]) => Promise<void>;
    pauseSession: (sessionId?: string) => Promise<void>;
    resumeSession: (sessionId?: string) => Promise<void>;
    cancelSession: (sessionId?: string) => Promise<void>;
    steerSession: (sessionId: string, guidance: string) => Promise<void>;

    // UI actions
    setPlanModalOpen: (open: boolean) => void;
    setWsConnected: (connected: boolean) => void;

    // Event handlers
    handleEvent: (event: CoworkEvent) => void;

    // Internal
    setActiveSession: (session: CoworkSession | null) => void;
    updateAgent: (agentId: string, updates: Partial<AgentInstance>) => void;
    addArtifact: (artifact: CoworkArtifact) => void;
    updateSessionPlan: (plan: TaskPlan) => void;
    reset: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useCoworkStore = create<CoworkState>()(
    persist(
        (set, get) => ({
            // Initial state
            activeSession: null,
            recentSessions: [],
            status: 'idle',
            currentThought: null,
            planModalOpen: false,
            wsConnected: false,

            // Create new session
            createSession: async (description, options) => {
                set({ status: 'planning', planModalOpen: false });

                try {
                    const response = await fetch('/api/v1/cowork/sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description, options })
                    });

                    if (!response.ok) {
                        set({ status: 'idle' });
                        throw new Error('Failed to create session');
                    }

                    const { session } = await response.json();
                    set({ activeSession: session });

                    return session.id;
                } catch (error) {
                    set({ status: 'idle' });
                    throw error;
                }
            },

            // Load existing session
            loadSession: async (sessionId) => {
                const response = await fetch(`/api/v1/cowork/sessions/${sessionId}`);
                if (!response.ok) throw new Error('Failed to load session');

                const { session } = await response.json();

                set({
                    activeSession: session,
                    status: session.status as CoworkState['status']
                });
            },

            // Approve plan and start execution
            approvePlan: async (modifications) => {
                const { activeSession } = get();
                if (!activeSession) return;

                await fetch(`/api/v1/cowork/sessions/${activeSession.id}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ modifications })
                });

                set({ status: 'executing', planModalOpen: false });
            },

            // Pause execution
            pauseSession: async (sessionId) => {
                const { activeSession } = get();
                const id = sessionId || activeSession?.id;
                if (!id) return;

                await fetch(`/api/v1/cowork/sessions/${id}/pause`, {
                    method: 'POST'
                });

                set({ status: 'paused' });
            },

            // Resume execution
            resumeSession: async (sessionId) => {
                const { activeSession } = get();
                const id = sessionId || activeSession?.id;
                if (!id) return;

                await fetch(`/api/v1/cowork/sessions/${id}/resume`, {
                    method: 'POST'
                });

                set({ status: 'executing' });
            },

            // Cancel session
            cancelSession: async (sessionId) => {
                const { activeSession } = get();
                const id = sessionId || activeSession?.id;
                if (!id) return;

                await fetch(`/api/v1/cowork/sessions/${id}/cancel`, {
                    method: 'POST'
                });

                set({ status: 'idle', activeSession: null });
            },

            // Send steering guidance
            steerSession: async (sessionId, guidance) => {
                await fetch(`/api/v1/cowork/sessions/${sessionId}/steer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ guidance })
                });
            },

            // UI actions
            setPlanModalOpen: (open) => set({ planModalOpen: open }),
            setWsConnected: (connected) => set({ wsConnected: connected }),

            // Handle WebSocket events
            handleEvent: (event) => {
                const { activeSession } = get();

                switch (event.type) {
                    case 'session_status_changed':
                        set({ status: event.status as CoworkState['status'] });
                        if (activeSession) {
                            set({
                                activeSession: {
                                    ...activeSession,
                                    status: event.status,
                                    phase: event.phase as CoworkSession['phase']
                                }
                            });
                        }
                        break;

                    case 'plan_ready':
                        set({
                            status: 'awaiting_approval',
                            planModalOpen: true
                        });
                        get().updateSessionPlan(event.plan);
                        break;

                    case 'agent_spawned':
                        if (activeSession) {
                            const newAgent: AgentInstance = {
                                id: event.agentId,
                                name: event.name,
                                status: 'initializing',
                                progress: 0,
                                currentThought: null
                            };
                            set({
                                activeSession: {
                                    ...activeSession,
                                    activeAgents: [...activeSession.activeAgents, newAgent]
                                }
                            });
                        }
                        break;

                    case 'agent_progress':
                        get().updateAgent(event.agentId, {
                            progress: event.progress,
                            status: event.status as AgentInstance['status']
                        });
                        break;

                    case 'agent_thinking':
                        get().updateAgent(event.agentId, {
                            currentThought: event.thought
                        });
                        set({ currentThought: event.thought });
                        break;

                    case 'agent_completed':
                        get().updateAgent(event.agentId, {
                            status: event.success ? 'completed' : 'failed',
                            progress: 100
                        });
                        break;

                    case 'artifact_produced':
                        get().addArtifact(event.artifact);
                        break;

                    case 'session_completed':
                        set({
                            status: 'completed',
                            currentThought: null
                        });
                        if (activeSession) {
                            set({
                                activeSession: {
                                    ...activeSession,
                                    status: 'completed',
                                    artifacts: event.artifacts
                                }
                            });
                        }
                        break;

                    case 'session_failed':
                        set({
                            status: 'failed',
                            currentThought: null
                        });
                        break;
                }
            },

            // Internal helpers
            setActiveSession: (session) => set({ activeSession: session }),

            updateSessionPlan: (plan) => {
                const { activeSession } = get();
                if (!activeSession) return;

                set({
                    activeSession: {
                        ...activeSession,
                        plan
                    }
                });
            },

            updateAgent: (agentId, updates) => {
                const { activeSession } = get();
                if (!activeSession) return;

                set({
                    activeSession: {
                        ...activeSession,
                        activeAgents: activeSession.activeAgents.map(agent =>
                            agent.id === agentId
                                ? { ...agent, ...updates }
                                : agent
                        )
                    }
                });
            },

            addArtifact: (artifact) => {
                const { activeSession } = get();
                if (!activeSession) return;

                set({
                    activeSession: {
                        ...activeSession,
                        artifacts: [...activeSession.artifacts, artifact]
                    }
                });
            },

            reset: () => set({
                activeSession: null,
                status: 'idle',
                currentThought: null,
                planModalOpen: false
            })
        }),
        {
            name: 'cowork-store',
            partialize: (state) => ({
                recentSessions: state.recentSessions
            })
        }
    )
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate overall progress for a session
 */
export function calculateProgress(session: CoworkSession | null): number {
    if (!session || !session.plan?.steps.length) return 0;

    const completedSteps = session.subTasks.filter(t => t.status === 'completed').length;
    const totalSteps = session.plan.steps.length;

    // Add partial progress from in-progress tasks
    const inProgressSum = session.subTasks
        .filter(t => t.status === 'in_progress')
        .reduce((sum, t) => sum + t.progress, 0);

    const inProgressCount = session.subTasks.filter(t => t.status === 'in_progress').length;
    const normalizedInProgress = inProgressCount > 0 ? (inProgressSum / inProgressCount) / totalSteps : 0;

    return ((completedSteps / totalSteps) + normalizedInProgress) * 100;
}

/**
 * Get the current active step from a session
 */
export function getCurrentStep(session: CoworkSession | null): CoworkSession['subTasks'][0] | null {
    if (!session) return null;

    return session.subTasks.find(t => t.status === 'in_progress') || null;
}

/**
 * Get the status of a specific step
 */
export function getStepStatus(
    session: CoworkSession | null,
    stepId: string
): 'pending' | 'in_progress' | 'completed' | 'failed' {
    if (!session) return 'pending';

    const task = session.subTasks.find(t => t.planStepId === stepId);
    if (!task) return 'pending';

    if (task.status === 'completed') return 'completed';
    if (task.status === 'failed') return 'failed';
    if (task.status === 'in_progress') return 'in_progress';

    return 'pending';
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
    return `${Math.round(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
