/**
 * NATS Module - Entry Point
 * 
 * Re-exports all NATS functionality for easy importing.
 */

export {
    initNats,
    closeNats,
    getNatsConnection,
    getJetStream,
    getJetStreamManager,
    isNatsConnected,
    getNatsHealth,
    publish,
    subscribe,
    request,
    sc,
} from './client.js';

// A2A Message Bus
export {
    initA2AStream,
    publishTask,
    publishEvent,
    publishSystemEvent,
    subscribeToTasks,
    subscribeToEvents,
    subscribeToHeartbeats,
    createWorkQueueConsumer,
    consumeWorkQueue,
    unsubscribeAll,
} from './a2a-bus.js';

// Orchestrator Work Queue
export {
    initOrchestratorStream,
    enqueueTask as enqueueOrchestratorTask,
    enqueueTasks as enqueueOrchestratorTasks,
    startWorker as startOrchestratorWorker,
    collectResults,
    subscribeToResults,
} from './work-queue.js';

export type { AgentTask, AgentEvent, TaskHandler, EventHandler } from './a2a-bus.js';
export type { OrchestratorTask, TaskResult, WorkHandler } from './work-queue.js';
