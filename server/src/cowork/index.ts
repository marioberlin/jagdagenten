/**
 * Cowork Module
 *
 * Deep work orchestration for complex, multi-step tasks.
 */

export * from './types';
export { CoworkOrchestrator, coworkOrchestrator } from './orchestrator';
export { TaskPlanner, taskPlanner } from './planner';
export { coworkRoutes } from './routes';
export {
    initCoworkEventForwarding,
    handleCoworkMessage,
    subscribeToSession,
    unsubscribeFromSession,
    unsubscribeFromAllSessions,
    subscribeToQueue,
    unsubscribeFromQueue,
    createNotification,
    getNotifications,
    markNotificationsRead,
    clearNotifications,
    emitQueueStats
} from './events';

// Repository exports
export {
    sessionRepository,
    subTaskRepository,
    artifactRepository,
    agentRepository,
    notificationRepository,
    queueRepository,
    fileOperationRepository,
    setDbPool as setCoworkDbPool,
    SessionRepository,
    SubTaskRepository,
    ArtifactRepository,
    AgentRepository,
    NotificationRepository,
    QueueRepository,
    FileOperationRepository,
} from './repository';

// Sandbox exports
export * from './sandbox';
export { sandboxRoutes } from './sandbox/routes';
export { initializeSandboxServices } from './sandbox';

// A2A Bridge exports
export {
    a2aTaskBridge,
    agentDiscoveryService,
    A2ATaskBridge,
    AgentDiscoveryService,
} from './a2a-bridge';

// Task Executor exports
export {
    coworkTaskExecutor,
    CoworkTaskExecutor,
    type ExecutorConfig,
    type ExecutionContext,
    type ExecutionResult,
} from './executor';

// Permission Service exports
export {
    permissionService,
    PermissionService,
    type PermissionCheckRequest,
    type PermissionCheckResult,
    type SecurityPolicy,
    type PermissionAuditEntry,
    type PermissionServiceConfig,
} from './permissions';

// Agent Manager exports
export {
    agentManager,
    AgentManager,
    type AgentManagerConfig,
    type AgentSpawnRequest,
    type ManagedAgent,
    type ManagedAgentState,
    type BatchSpawnResult,
} from './agent-manager';
