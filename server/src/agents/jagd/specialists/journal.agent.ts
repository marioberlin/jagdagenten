/**
 * Journal Agent Specialist Implementation
 */

import type { AgentContext, ToolEnvelope } from '../types.js';
import type { GeoScope } from '@jagdagenten/types-jagd';

export class JournalAgent {
    async startSession(
        sessionType: string,
        geo: GeoScope,
        privacyMode: string,
        context: AgentContext
    ): Promise<ToolEnvelope<Session>> {
        const startTime = Date.now();

        const session: Session = {
            id: `session-${Date.now()}`,
            sessionType,
            startTime: new Date().toISOString(),
            endTime: null,
            geo,
            privacyMode,
            participants: [context.user.id],
            events: [],
        };

        return {
            status: 'ok',
            result: session,
            audit: {
                toolName: 'timeline.start_session',
                tier: 1,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }

    async logEvent(
        sessionId: string,
        eventType: string,
        data: Record<string, unknown>,
        geo: GeoScope,
        context: AgentContext
    ): Promise<ToolEnvelope<TimelineEvent>> {
        const startTime = Date.now();

        const event: TimelineEvent = {
            id: `event-${Date.now()}`,
            sessionId,
            eventType,
            time: new Date().toISOString(),
            data,
            geo,
            photos: [],
        };

        return {
            status: 'ok',
            result: event,
            audit: {
                toolName: 'timeline.log_event',
                tier: 1,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }

    async endSession(
        sessionId: string,
        notes: string,
        context: AgentContext
    ): Promise<ToolEnvelope<SessionSummary>> {
        const startTime = Date.now();

        const summary: SessionSummary = {
            sessionId,
            endTime: new Date().toISOString(),
            durationMinutes: 180,
            eventCount: 5,
            sightings: 3,
            shots: 1,
            harvests: 1,
            notes,
            recap: 'Erfolgreicher Ansitz mit einer Erlegung (Rehbock, 2-jährig). Gute Wetterbedingungen.',
        };

        return {
            status: 'ok',
            result: summary,
            audit: {
                toolName: 'timeline.end_session',
                tier: 1,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }
}

interface Session {
    id: string;
    sessionType: string;
    startTime: string;
    endTime: string | null;
    geo: GeoScope;
    privacyMode: string;
    participants: string[];
    events: TimelineEvent[];
}

interface TimelineEvent {
    id: string;
    sessionId: string;
    eventType: string;
    time: string;
    data: Record<string, unknown>;
    geo: GeoScope;
    photos: string[];
}

interface SessionSummary {
    sessionId: string;
    endTime: string;
    durationMinutes: number;
    eventCount: number;
    sightings: number;
    shots: number;
    harvests: number;
    notes: string;
    recap: string;
}

export default JournalAgent;
