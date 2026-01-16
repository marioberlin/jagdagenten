/**
 * Cowork WebSocket Events Handler
 *
 * Bridges orchestrator events to WebSocket clients.
 * Includes per-task notifications and global queue broadcasts.
 */

import { coworkOrchestrator } from './orchestrator';
import { wsManager } from '../websocket';
import { componentLoggers } from '../logger';
import type { CoworkEvent, TaskNotification, NotificationLevel } from './types';

const logger = componentLoggers.websocket;

// Session -> ClientId subscriptions
const sessionSubscriptions = new Map<string, Set<string>>();

// Global queue subscribers (clients interested in all queue events)
const queueSubscribers = new Set<string>();

// In-memory notification store (will be persisted to DB later)
const notifications = new Map<string, TaskNotification[]>();
const MAX_NOTIFICATIONS_PER_USER = 100;

/**
 * Subscribe a client to session events
 */
export function subscribeToSession(clientId: string, sessionId: string): void {
    if (!sessionSubscriptions.has(sessionId)) {
        sessionSubscriptions.set(sessionId, new Set());
    }
    sessionSubscriptions.get(sessionId)!.add(clientId);
    logger.info({ clientId, sessionId }, 'Client subscribed to Cowork session');
}

/**
 * Unsubscribe a client from session events
 */
export function unsubscribeFromSession(clientId: string, sessionId: string): void {
    const subscribers = sessionSubscriptions.get(sessionId);
    if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
            sessionSubscriptions.delete(sessionId);
        }
    }
    logger.info({ clientId, sessionId }, 'Client unsubscribed from Cowork session');
}

/**
 * Subscribe a client to global queue events
 */
export function subscribeToQueue(clientId: string): void {
    queueSubscribers.add(clientId);
    logger.info({ clientId }, 'Client subscribed to Cowork queue');
}

/**
 * Unsubscribe a client from global queue events
 */
export function unsubscribeFromQueue(clientId: string): void {
    queueSubscribers.delete(clientId);
    logger.info({ clientId }, 'Client unsubscribed from Cowork queue');
}

/**
 * Unsubscribe a client from all sessions (on disconnect)
 */
export function unsubscribeFromAllSessions(clientId: string): void {
    for (const [sessionId, subscribers] of sessionSubscriptions.entries()) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
            sessionSubscriptions.delete(sessionId);
        }
    }
    queueSubscribers.delete(clientId);
}

/**
 * Broadcast event to all subscribed clients for a session
 */
function broadcastToSession(sessionId: string, event: CoworkEvent): void {
    const subscribers = sessionSubscriptions.get(sessionId);
    if (!subscribers || subscribers.size === 0) {
        return;
    }

    const message = {
        channel: 'cowork',
        ...event
    };

    for (const clientId of subscribers) {
        try {
            wsManager.sendToClient(clientId, message);
        } catch (error) {
            logger.error({ clientId, sessionId, error }, 'Failed to send Cowork event');
        }
    }
}

/**
 * Broadcast event to all queue subscribers
 */
function broadcastToQueue(event: CoworkEvent): void {
    if (queueSubscribers.size === 0) {
        return;
    }

    const message = {
        channel: 'cowork_queue',
        ...event
    };

    for (const clientId of queueSubscribers) {
        try {
            wsManager.sendToClient(clientId, message);
        } catch (error) {
            logger.error({ clientId, error }, 'Failed to send Cowork queue event');
        }
    }
}

/**
 * Create and store a notification for a user
 */
export function createNotification(
    userId: string,
    sessionId: string,
    level: NotificationLevel,
    title: string,
    message: string,
    action?: TaskNotification['action']
): TaskNotification {
    const notification: TaskNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        level,
        title,
        message,
        timestamp: new Date(),
        read: false,
        action,
    };

    // Store notification
    if (!notifications.has(userId)) {
        notifications.set(userId, []);
    }

    const userNotifications = notifications.get(userId)!;
    userNotifications.unshift(notification);

    // Trim old notifications
    if (userNotifications.length > MAX_NOTIFICATIONS_PER_USER) {
        userNotifications.splice(MAX_NOTIFICATIONS_PER_USER);
    }

    // Broadcast to queue subscribers
    broadcastToQueue({
        type: 'queue_task_added',
        sessionId,
        title,
        priority: 1, // Will be updated when we have priority tracking
    } as any);

    logger.info({ userId, sessionId, level, title }, 'Notification created');

    return notification;
}

/**
 * Get notifications for a user
 */
export function getNotifications(userId: string, unreadOnly: boolean = false): TaskNotification[] {
    const userNotifications = notifications.get(userId) || [];
    if (unreadOnly) {
        return userNotifications.filter(n => !n.read);
    }
    return userNotifications;
}

/**
 * Mark notifications as read
 */
export function markNotificationsRead(userId: string, notificationIds: string[]): void {
    const userNotifications = notifications.get(userId);
    if (!userNotifications) return;

    for (const notification of userNotifications) {
        if (notificationIds.includes(notification.id)) {
            notification.read = true;
        }
    }
}

/**
 * Clear all notifications for a user
 */
export function clearNotifications(userId: string): void {
    notifications.delete(userId);
}

/**
 * Emit queue statistics update to all subscribers
 */
export function emitQueueStats(stats: {
    queuedCount: number;
    activeCount: number;
    completedCount: number;
}): void {
    broadcastToQueue({
        type: 'queue_stats_update',
        ...stats,
    });
}

/**
 * Initialize orchestrator event forwarding
 */
export function initCoworkEventForwarding(): void {
    // Session lifecycle events
    coworkOrchestrator.on('session_created', (data: { sessionId: string; title: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'session_created',
            ...data
        });

        // Also notify queue subscribers
        broadcastToQueue({
            type: 'queue_task_added',
            sessionId: data.sessionId,
            title: data.title,
            priority: 1,
        });
    });

    coworkOrchestrator.on('session_status_changed', (data: { sessionId: string; status: string; phase: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'session_status_changed',
            sessionId: data.sessionId,
            status: data.status as any,
            phase: data.phase
        });

        // Notify queue on status changes
        if (data.status === 'executing') {
            // Get session title for notification
            coworkOrchestrator.getSession(data.sessionId).then(session => {
                broadcastToQueue({
                    type: 'queue_task_started',
                    sessionId: data.sessionId,
                    title: session?.title || 'Task',
                });
            }).catch(() => {});
        }
    });

    // Planning events
    coworkOrchestrator.on('planning_started', (data: { sessionId: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'planning_started',
            ...data
        });
    });

    coworkOrchestrator.on('plan_ready', (data: { sessionId: string; plan: any }) => {
        broadcastToSession(data.sessionId, {
            type: 'plan_ready',
            ...data
        });
    });

    coworkOrchestrator.on('plan_approved', (data: { sessionId: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'plan_approved',
            ...data
        });
    });

    // Agent events
    coworkOrchestrator.on('agent_spawned', (data: { sessionId: string; agentId: string; name: string; task: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'agent_spawned',
            ...data
        });
    });

    coworkOrchestrator.on('agent_progress', (data: { sessionId: string; agentId: string; progress: number; status: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'agent_progress',
            ...data
        });
    });

    coworkOrchestrator.on('agent_thinking', (data: { sessionId: string; agentId: string; thought: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'agent_thinking',
            ...data
        });
    });

    coworkOrchestrator.on('agent_completed', (data: { sessionId: string; agentId: string; success: boolean; result?: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'agent_completed',
            ...data
        });
    });

    // Artifact events
    coworkOrchestrator.on('artifact_produced', (data: { sessionId: string; artifact: any }) => {
        broadcastToSession(data.sessionId, {
            type: 'artifact_produced',
            ...data
        });
    });

    // Completion events
    coworkOrchestrator.on('session_completed', (data: { sessionId: string; summary: string; artifacts: any[] }) => {
        broadcastToSession(data.sessionId, {
            type: 'session_completed',
            ...data
        });

        // Queue notification for task completion
        coworkOrchestrator.getSession(data.sessionId).then(session => {
            broadcastToQueue({
                type: 'queue_task_completed',
                sessionId: data.sessionId,
                title: session?.title || 'Task',
                success: true,
                summary: data.summary,
            });

            // Create persistent notification
            if (session) {
                createNotification(
                    session.userId,
                    data.sessionId,
                    'success',
                    'Task Completed',
                    `"${session.title}" has finished successfully`,
                    { label: 'View Results', type: 'view_session' }
                );
            }
        }).catch(() => {});
    });

    coworkOrchestrator.on('session_failed', (data: { sessionId: string; error: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'session_failed',
            ...data
        });

        // Queue notification for task failure
        coworkOrchestrator.getSession(data.sessionId).then(session => {
            broadcastToQueue({
                type: 'queue_task_failed',
                sessionId: data.sessionId,
                title: session?.title || 'Task',
                error: data.error,
            });

            // Create persistent notification
            if (session) {
                createNotification(
                    session.userId,
                    data.sessionId,
                    'error',
                    'Task Failed',
                    `"${session.title}" failed: ${data.error}`,
                    { label: 'Retry', type: 'retry' }
                );
            }
        }).catch(() => {});
    });

    // Steering events
    coworkOrchestrator.on('steering_sent', (data: { sessionId: string; guidance: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'steering_sent',
            ...data
        });
    });

    coworkOrchestrator.on('steering_acknowledged', (data: { sessionId: string; agentId: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'steering_acknowledged',
            ...data
        });
    });

    // Error events
    coworkOrchestrator.on('error', (data: { sessionId: string; error: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'error',
            ...data
        });
    });

    logger.info('Cowork event forwarding initialized');
}

/**
 * Handle incoming WebSocket messages for Cowork
 */
export function handleCoworkMessage(
    clientId: string,
    message: { type: string; sessionId?: string; channel?: string;[key: string]: unknown }
): boolean {
    switch (message.type) {
        case 'subscribe':
            if (message.channel === 'cowork' && message.sessionId) {
                subscribeToSession(clientId, message.sessionId as string);
                return true;
            }
            if (message.channel === 'cowork_queue') {
                subscribeToQueue(clientId);
                return true;
            }
            break;

        case 'unsubscribe':
            if (message.channel === 'cowork' && message.sessionId) {
                unsubscribeFromSession(clientId, message.sessionId as string);
                return true;
            }
            if (message.channel === 'cowork_queue') {
                unsubscribeFromQueue(clientId);
                return true;
            }
            break;

        case 'get_notifications':
            // Return notifications for the client
            const userId = message.userId as string || 'default-user';
            const unreadOnly = message.unreadOnly as boolean || false;
            const notifs = getNotifications(userId, unreadOnly);
            wsManager.sendToClient(clientId, {
                type: 'notifications',
                channel: 'cowork',
                notifications: notifs,
            });
            return true;

        case 'mark_notifications_read':
            const uid = message.userId as string || 'default-user';
            const ids = message.notificationIds as string[] || [];
            markNotificationsRead(uid, ids);
            return true;

        case 'clear_notifications':
            const clearUserId = message.userId as string || 'default-user';
            clearNotifications(clearUserId);
            return true;
    }

    return false;
}

export default {
    subscribeToSession,
    unsubscribeFromSession,
    subscribeToQueue,
    unsubscribeFromQueue,
    unsubscribeFromAllSessions,
    initCoworkEventForwarding,
    handleCoworkMessage,
    createNotification,
    getNotifications,
    markNotificationsRead,
    clearNotifications,
    emitQueueStats
};
