/**
 * Admin Console WebSocket Events
 * 
 * Broadcasts task state changes to connected admin clients.
 */

import wsManager from '../websocket.js';

export type AdminEventType =
    | 'task:created'
    | 'task:updated'
    | 'task:completed'
    | 'task:failed'
    | 'task:retried'
    | 'task:canceled'
    | 'context:created'
    | 'context:updated'
    | 'context:deleted';

export interface AdminEvent {
    type: AdminEventType;
    payload: Record<string, unknown>;
    timestamp: string;
}

/**
 * Broadcast an admin event to all connected clients
 */
export function broadcastAdminEvent(type: AdminEventType, payload: Record<string, unknown>) {
    const event: AdminEvent = {
        type,
        payload,
        timestamp: new Date().toISOString(),
    };

    wsManager.broadcast({
        channel: 'admin',
        event: type,
        data: event,
    });

    console.log(`[Admin WS] Broadcast: ${type}`, payload);
}

/**
 * Broadcast task update event
 */
export function broadcastTaskUpdate(taskId: string, state: string, metadata?: Record<string, unknown>) {
    broadcastAdminEvent('task:updated', {
        taskId,
        state,
        ...metadata,
    });
}

/**
 * Broadcast task completion
 */
export function broadcastTaskCompleted(taskId: string, contextId: string, agent?: string) {
    broadcastAdminEvent('task:completed', {
        taskId,
        contextId,
        agent,
    });
}

/**
 * Broadcast task failure
 */
export function broadcastTaskFailed(taskId: string, contextId: string, error?: string) {
    broadcastAdminEvent('task:failed', {
        taskId,
        contextId,
        error,
    });
}

/**
 * Broadcast task retry
 */
export function broadcastTaskRetried(taskId: string) {
    broadcastAdminEvent('task:retried', { taskId });
}

/**
 * Broadcast task cancellation
 */
export function broadcastTaskCanceled(taskId: string) {
    broadcastAdminEvent('task:canceled', { taskId });
}
