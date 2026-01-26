/**
 * Orchestrator Work Queue - NATS JetStream-based Task Distribution
 *
 * Provides exactly-once delivery for orchestrator tasks using JetStream.
 * Features:
 * - Persistent task queue with acknowledgements
 * - Automatic redelivery on failure
 * - Session-based task grouping
 * - Result collection via reply subjects
 *
 * Stream: ORCHESTRATOR_TASKS
 * Subjects: orchestrator.tasks.{sessionId}.{subPrdId}
 */

import {
    getJetStream,
    getJetStreamManager,
    isNatsConnected,
    getNatsConnection,
    sc,
} from './client.js';
import { AckPolicy, DeliverPolicy, RetentionPolicy, StorageType } from 'nats';

// Safe logger - fallback to console if componentLoggers not available
let log: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void; error: (...args: unknown[]) => void; debug: (...args: unknown[]) => void };
try {
    const { componentLoggers } = await import('../logger.js');
    log = componentLoggers?.system || console;
} catch {
    log = console;
}

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorTask {
    sessionId: string;
    subPrdId: string;
    specialist: string;
    payload: unknown;
    createdAt: number;
    priority?: number;
}

export interface TaskResult {
    sessionId: string;
    subPrdId: string;
    success: boolean;
    result?: unknown;
    error?: string;
    completedAt: number;
}

export interface WorkHandler {
    (task: OrchestratorTask): Promise<TaskResult>;
}

// ============================================================================
// Constants
// ============================================================================

const STREAM_NAME = 'ORCHESTRATOR_TASKS';
const STREAM_SUBJECTS = ['orchestrator.tasks.>', 'orchestrator.results.>'];
const CONSUMER_NAME = 'orchestrator-workers';
const DEFAULT_RETENTION_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// State
// ============================================================================

let streamInitialized = false;
const resultCallbacks = new Map<string, (result: TaskResult) => void>();

// ============================================================================
// Stream Management
// ============================================================================

/**
 * Initialize JetStream stream for orchestrator tasks
 */
export async function initOrchestratorStream(): Promise<boolean> {
    if (!isNatsConnected()) {
        log.warn('[Work Queue] NATS not connected, skipping stream initialization');
        return false;
    }

    if (streamInitialized) {
        return true;
    }

    try {
        const jsm = getJetStreamManager();

        // Check if stream exists
        try {
            await jsm.streams.info(STREAM_NAME);
            log.info(`[Work Queue] Stream ${STREAM_NAME} already exists`);
            streamInitialized = true;
            return true;
        } catch {
            // Stream doesn't exist, create it
        }

        // Create stream
        await jsm.streams.add({
            name: STREAM_NAME,
            subjects: STREAM_SUBJECTS,
            retention: RetentionPolicy.WorkQueue, // Messages deleted after ack
            storage: StorageType.File,
            max_age: DEFAULT_RETENTION_MS * 1000000, // Nanoseconds
            max_msgs: 10000,
            max_bytes: 50 * 1024 * 1024, // 50MB
            discard: 'old' as any,
        });

        // Create durable consumer for workers
        await jsm.consumers.add(STREAM_NAME, {
            durable_name: CONSUMER_NAME,
            ack_policy: AckPolicy.Explicit,
            deliver_policy: DeliverPolicy.All,
            filter_subject: 'orchestrator.tasks.>',
            max_deliver: 3, // Retry up to 3 times
            ack_wait: 60 * 1000000000, // 60 seconds in nanoseconds
        });

        log.info(`[Work Queue] Created stream ${STREAM_NAME} with consumer ${CONSUMER_NAME}`);
        streamInitialized = true;
        return true;
    } catch (error) {
        log.error('[Work Queue] Failed to initialize stream:', error);
        return false;
    }
}

// ============================================================================
// Task Enqueueing
// ============================================================================

/**
 * Enqueue a task for processing
 */
export async function enqueueTask(task: OrchestratorTask): Promise<boolean> {
    if (!isNatsConnected()) {
        log.warn('[Work Queue] Cannot enqueue task - NATS not connected');
        return false;
    }

    await initOrchestratorStream();

    try {
        const js = getJetStream();
        const subject = `orchestrator.tasks.${task.sessionId}.${task.subPrdId}`;

        await js.publish(subject, sc.encode(JSON.stringify({
            ...task,
            createdAt: task.createdAt || Date.now(),
        })));

        log.debug(`[Work Queue] Enqueued task: ${subject}`);
        return true;
    } catch (error) {
        log.error('[Work Queue] Failed to enqueue task:', error);
        return false;
    }
}

/**
 * Enqueue multiple tasks for a session
 */
export async function enqueueTasks(tasks: OrchestratorTask[]): Promise<number> {
    let enqueued = 0;
    for (const task of tasks) {
        if (await enqueueTask(task)) {
            enqueued++;
        }
    }
    return enqueued;
}

// ============================================================================
// Task Processing
// ============================================================================

/**
 * Start processing tasks from the work queue
 * Returns a stop function
 */
export async function startWorker(handler: WorkHandler): Promise<() => Promise<void>> {
    if (!isNatsConnected()) {
        throw new Error('NATS not connected');
    }

    await initOrchestratorStream();

    const js = getJetStream();
    const consumer = await js.consumers.get(STREAM_NAME, CONSUMER_NAME);
    const messages = await consumer.consume();

    let running = true;

    (async () => {
        for await (const msg of messages) {
            if (!running) break;

            const subject = msg.subject;
            log.debug(`[Work Queue] Processing task: ${subject}`);

            try {
                const task = JSON.parse(sc.decode(msg.data)) as OrchestratorTask;
                const result = await handler(task);

                // Publish result
                const nc = getNatsConnection();
                const resultSubject = `orchestrator.results.${task.sessionId}.${task.subPrdId}`;
                nc.publish(resultSubject, sc.encode(JSON.stringify(result)));

                // Acknowledge successful processing
                msg.ack();
                log.debug(`[Work Queue] Completed task: ${subject}`);
            } catch (error) {
                log.error(`[Work Queue] Error processing task ${subject}:`, error);
                // Negative ack - will be redelivered
                msg.nak();
            }
        }
    })();

    log.info('[Work Queue] Worker started');

    return async () => {
        running = false;
        await messages.close();
        log.info('[Work Queue] Worker stopped');
    };
}

// ============================================================================
// Result Collection
// ============================================================================

/**
 * Collect results for a session
 * Returns when all expected results are received or timeout
 */
export async function collectResults(
    sessionId: string,
    expectedCount: number,
    timeoutMs: number = 300000 // 5 minutes
): Promise<TaskResult[]> {
    if (!isNatsConnected()) {
        throw new Error('NATS not connected');
    }

    const results: TaskResult[] = [];
    const nc = getNatsConnection();

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            sub.unsubscribe();
            if (results.length > 0) {
                resolve(results);
            } else {
                reject(new Error(`Timeout waiting for results for session ${sessionId}`));
            }
        }, timeoutMs);

        const sub = nc.subscribe(`orchestrator.results.${sessionId}.>`);

        (async () => {
            for await (const msg of sub) {
                try {
                    const result = JSON.parse(sc.decode(msg.data)) as TaskResult;
                    results.push(result);

                    if (results.length >= expectedCount) {
                        clearTimeout(timeout);
                        sub.unsubscribe();
                        resolve(results);
                        return;
                    }
                } catch (error) {
                    log.error('[Work Queue] Error parsing result:', error);
                }
            }
        })();
    });
}

/**
 * Subscribe to results for real-time updates
 */
export async function subscribeToResults(
    sessionId: string,
    handler: (result: TaskResult) => void
): Promise<() => void> {
    if (!isNatsConnected()) {
        throw new Error('NATS not connected');
    }

    const nc = getNatsConnection();
    const sub = nc.subscribe(`orchestrator.results.${sessionId}.>`);

    (async () => {
        for await (const msg of sub) {
            try {
                const result = JSON.parse(sc.decode(msg.data)) as TaskResult;
                handler(result);
            } catch (error) {
                log.error('[Work Queue] Error parsing result:', error);
            }
        }
    })();

    return () => sub.unsubscribe();
}

// ============================================================================
// Exports
// ============================================================================

export default {
    initOrchestratorStream,
    enqueueTask,
    enqueueTasks,
    startWorker,
    collectResults,
    subscribeToResults,
};
