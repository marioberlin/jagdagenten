/**
 * Cowork WebSocket Events Handler
 *
 * Bridges orchestrator events to WebSocket clients.
 */

import { coworkOrchestrator } from './orchestrator';
import { wsManager } from '../websocket';
import { componentLoggers } from '../logger';
import type { CoworkEvent } from './types';

const logger = componentLoggers.websocket;

// Session -> ClientId subscriptions
const sessionSubscriptions = new Map<string, Set<string>>();

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
 * Unsubscribe a client from all sessions (on disconnect)
 */
export function unsubscribeFromAllSessions(clientId: string): void {
    for (const [sessionId, subscribers] of sessionSubscriptions.entries()) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
            sessionSubscriptions.delete(sessionId);
        }
    }
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
 * Initialize orchestrator event forwarding
 */
export function initCoworkEventForwarding(): void {
    // Session lifecycle events
    coworkOrchestrator.on('session_created', (data: { sessionId: string; title: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'session_created',
            ...data
        });
    });

    coworkOrchestrator.on('session_status_changed', (data: { sessionId: string; status: string; phase: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'session_status_changed',
            sessionId: data.sessionId,
            status: data.status as any,
            phase: data.phase
        });
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
    });

    coworkOrchestrator.on('session_failed', (data: { sessionId: string; error: string }) => {
        broadcastToSession(data.sessionId, {
            type: 'session_failed',
            ...data
        });
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
    message: { type: string; sessionId?: string;[key: string]: unknown }
): boolean {
    switch (message.type) {
        case 'subscribe':
            if (message.channel === 'cowork' && message.sessionId) {
                subscribeToSession(clientId, message.sessionId as string);
                return true;
            }
            break;

        case 'unsubscribe':
            if (message.channel === 'cowork' && message.sessionId) {
                unsubscribeFromSession(clientId, message.sessionId as string);
                return true;
            }
            break;
    }

    return false;
}

export default {
    subscribeToSession,
    unsubscribeFromSession,
    unsubscribeFromAllSessions,
    initCoworkEventForwarding,
    handleCoworkMessage
};
