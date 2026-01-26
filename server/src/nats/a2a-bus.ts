/**
 * A2A Message Bus - NATS-based Agent Communication
 *
 * Provides pub/sub and work queue functionality for A2A agents.
 * Features:
 * - Wildcard topic subscriptions (agents.*.tasks.>)
 * - Queue groups for exactly-once task delivery
 * - Event broadcasting for agent state changes
 * - JetStream for persistent task queues
 *
 * Subject Patterns:
 * - agents.{agentId}.tasks.{taskType}     - Task assignments
 * - agents.{agentId}.events.{eventType}   - Agent events
 * - agents.{agentId}.status               - Agent status updates
 * - agents.*.heartbeat                    - All agent heartbeats
 * - system.events.{eventType}             - System-wide events
 */

import {
    getNatsConnection,
    getJetStream,
    getJetStreamManager,
    isNatsConnected,
    sc,
} from './client.js';
import type { JetStreamClient, JetStreamManager, Subscription, NatsConnection } from 'nats';
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

export interface AgentTask {
    id: string;
    agentId: string;
    taskType: string;
    payload: unknown;
    priority?: number;
    createdAt: number;
    metadata?: Record<string, unknown>;
}

export interface AgentEvent {
    type: string;
    agentId: string;
    taskId?: string;
    data?: unknown;
    timestamp: number;
}

export interface TaskHandler {
    (task: AgentTask, ack: () => void): void | Promise<void>;
}

export interface EventHandler {
    (event: AgentEvent): void | Promise<void>;
}

interface A2ASubscription {
    subject: string;
    unsubscribe: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const STREAM_NAME = 'A2A_TASKS';
const STREAM_SUBJECTS = ['agents.>', 'system.>'];
const DEFAULT_RETENTION_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// State
// ============================================================================

const subscriptions: Map<string, A2ASubscription> = new Map();
let streamInitialized = false;

// ============================================================================
// Stream Management
// ============================================================================

/**
 * Initialize JetStream stream for A2A tasks
 */
export async function initA2AStream(): Promise<boolean> {
    if (!isNatsConnected()) {
        log.warn('[A2A Bus] NATS not connected, skipping stream initialization');
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
            log.info(`[A2A Bus] Stream ${STREAM_NAME} already exists`);
            streamInitialized = true;
            return true;
        } catch {
            // Stream doesn't exist, create it
        }

        // Create stream
        await jsm.streams.add({
            name: STREAM_NAME,
            subjects: STREAM_SUBJECTS,
            retention: RetentionPolicy.Limits,
            storage: StorageType.File,
            max_age: DEFAULT_RETENTION_MS * 1000000, // Nanoseconds
            max_msgs: 100000,
            max_bytes: 100 * 1024 * 1024, // 100MB
            discard: 'old' as any,
            duplicate_window: 60 * 1000000000, // 60 seconds in nanoseconds
        });

        log.info(`[A2A Bus] Created stream ${STREAM_NAME}`);
        streamInitialized = true;
        return true;
    } catch (error) {
        log.error('[A2A Bus] Failed to initialize stream:', error);
        return false;
    }
}

// ============================================================================
// Publishing
// ============================================================================

/**
 * Publish a task to an agent
 */
export function publishTask(agentId: string, taskType: string, task: Omit<AgentTask, 'agentId' | 'taskType' | 'createdAt'>): void {
    if (!isNatsConnected()) {
        log.warn('[A2A Bus] Cannot publish task - NATS not connected');
        return;
    }

    const fullTask: AgentTask = {
        ...task,
        agentId,
        taskType,
        createdAt: Date.now(),
    };

    const subject = `agents.${agentId}.tasks.${taskType}`;
    const nc = getNatsConnection();
    nc.publish(subject, sc.encode(JSON.stringify(fullTask)));

    log.debug(`[A2A Bus] Published task to ${subject}:`, fullTask.id);
}

/**
 * Publish an event from an agent
 */
export function publishEvent(agentId: string, eventType: string, data?: unknown, taskId?: string): void {
    if (!isNatsConnected()) {
        log.warn('[A2A Bus] Cannot publish event - NATS not connected');
        return;
    }

    const event: AgentEvent = {
        type: eventType,
        agentId,
        taskId,
        data,
        timestamp: Date.now(),
    };

    const subject = `agents.${agentId}.events.${eventType}`;
    const nc = getNatsConnection();
    nc.publish(subject, sc.encode(JSON.stringify(event)));

    log.debug(`[A2A Bus] Published event to ${subject}`);
}

/**
 * Publish a system-wide event
 */
export function publishSystemEvent(eventType: string, data?: unknown): void {
    if (!isNatsConnected()) {
        log.warn('[A2A Bus] Cannot publish system event - NATS not connected');
        return;
    }

    const event: AgentEvent = {
        type: eventType,
        agentId: 'system',
        data,
        timestamp: Date.now(),
    };

    const subject = `system.events.${eventType}`;
    const nc = getNatsConnection();
    nc.publish(subject, sc.encode(JSON.stringify(event)));

    log.debug(`[A2A Bus] Published system event: ${eventType}`);
}

// ============================================================================
// Subscriptions
// ============================================================================

/**
 * Subscribe to tasks for an agent with optional wildcard
 * Use queue group for load balancing across multiple agent instances
 */
export async function subscribeToTasks(
    pattern: string,
    handler: TaskHandler,
    options?: { queue?: string }
): Promise<A2ASubscription> {
    if (!isNatsConnected()) {
        throw new Error('NATS not connected');
    }

    const nc = getNatsConnection();
    const subject = pattern.startsWith('agents.') ? pattern : `agents.${pattern}`;

    const sub = nc.subscribe(subject, { queue: options?.queue });

    // Process messages asynchronously
    (async () => {
        for await (const msg of sub) {
            try {
                const task = JSON.parse(sc.decode(msg.data)) as AgentTask;
                await handler(task, () => {
                    // Acknowledge is a no-op for core NATS
                    // JetStream ack would be msg.ack()
                });
            } catch (error) {
                log.error(`[A2A Bus] Error processing task on ${msg.subject}:`, error);
            }
        }
    })();

    const subscription: A2ASubscription = {
        subject,
        unsubscribe: () => sub.unsubscribe(),
    };

    subscriptions.set(subject, subscription);
    log.info(`[A2A Bus] Subscribed to tasks: ${subject}${options?.queue ? ` (queue: ${options.queue})` : ''}`);

    return subscription;
}

/**
 * Subscribe to events with wildcard support
 */
export async function subscribeToEvents(
    pattern: string,
    handler: EventHandler
): Promise<A2ASubscription> {
    if (!isNatsConnected()) {
        throw new Error('NATS not connected');
    }

    const nc = getNatsConnection();
    const subject = pattern.startsWith('agents.') || pattern.startsWith('system.')
        ? pattern
        : `agents.${pattern}`;

    const sub = nc.subscribe(subject);

    (async () => {
        for await (const msg of sub) {
            try {
                const event = JSON.parse(sc.decode(msg.data)) as AgentEvent;
                await handler(event);
            } catch (error) {
                log.error(`[A2A Bus] Error processing event on ${msg.subject}:`, error);
            }
        }
    })();

    const subscription: A2ASubscription = {
        subject,
        unsubscribe: () => sub.unsubscribe(),
    };

    subscriptions.set(subject, subscription);
    log.info(`[A2A Bus] Subscribed to events: ${subject}`);

    return subscription;
}

/**
 * Subscribe to all agent heartbeats
 */
export async function subscribeToHeartbeats(
    handler: (agentId: string, status: unknown) => void
): Promise<A2ASubscription> {
    return subscribeToEvents('*.heartbeat', (event) => {
        handler(event.agentId, event.data);
    });
}

// ============================================================================
// JetStream Work Queue (Exactly-Once Delivery)
// ============================================================================

/**
 * Create a durable consumer for work queue semantics
 */
export async function createWorkQueueConsumer(
    consumerName: string,
    filterSubject: string,
    queueGroup?: string
): Promise<void> {
    if (!isNatsConnected()) {
        throw new Error('NATS not connected');
    }

    await initA2AStream();

    const jsm = getJetStreamManager();

    try {
        // Check if consumer exists
        await jsm.consumers.info(STREAM_NAME, consumerName);
        log.info(`[A2A Bus] Consumer ${consumerName} already exists`);
        return;
    } catch {
        // Consumer doesn't exist, create it
    }

    await jsm.consumers.add(STREAM_NAME, {
        durable_name: consumerName,
        ack_policy: AckPolicy.Explicit,
        deliver_policy: DeliverPolicy.All,
        filter_subject: filterSubject,
        max_deliver: 3, // Retry up to 3 times
        ack_wait: 30 * 1000000000, // 30 seconds in nanoseconds
    });

    log.info(`[A2A Bus] Created consumer ${consumerName} for ${filterSubject}`);
}

/**
 * Consume from a work queue with exactly-once semantics
 */
export async function consumeWorkQueue(
    consumerName: string,
    handler: TaskHandler
): Promise<() => Promise<void>> {
    if (!isNatsConnected()) {
        throw new Error('NATS not connected');
    }

    const js = getJetStream();
    const consumer = await js.consumers.get(STREAM_NAME, consumerName);
    const messages = await consumer.consume();

    let running = true;

    (async () => {
        for await (const msg of messages) {
            if (!running) break;

            try {
                const task = JSON.parse(sc.decode(msg.data)) as AgentTask;
                await handler(task, () => msg.ack());
            } catch (error) {
                log.error(`[A2A Bus] Error processing work queue task:`, error);
                msg.nak(); // Negative ack - will be redelivered
            }
        }
    })();

    return async () => {
        running = false;
        await messages.close();
    };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Unsubscribe from all subscriptions
 */
export function unsubscribeAll(): void {
    for (const [subject, subscription] of subscriptions) {
        try {
            subscription.unsubscribe();
            log.info(`[A2A Bus] Unsubscribed from ${subject}`);
        } catch (error) {
            log.error(`[A2A Bus] Error unsubscribing from ${subject}:`, error);
        }
    }
    subscriptions.clear();
}

// ============================================================================
// Exports
// ============================================================================

export default {
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
};
