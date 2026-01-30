/**
 * Pack Agent Specialist Implementation
 */

import type { AgentContext, ToolEnvelope } from '../types.js';
import type { GeoScope } from '@jagdagenten/types-jagd';

export class PackAgent {
    async createEvent(
        eventType: string,
        date: string,
        meetingPointGeo: GeoScope,
        roles: { role: string; person?: string }[],
        locationSharing: 'off' | 'event_only',
        context: AgentContext
    ): Promise<ToolEnvelope<PackEvent>> {
        const startTime = Date.now();

        const event: PackEvent = {
            id: `pack-${Date.now()}`,
            eventType,
            date,
            meetingPointGeo,
            roles,
            locationSharing,
            status: 'scheduled',
            participants: [],
            safetyChecklist: eventType === 'drueckjagd' ? this.getDrueckjagdSafety() : [],
            createdBy: context.user.id,
            createdAt: new Date().toISOString(),
        };

        return {
            status: eventType === 'drueckjagd' ? 'needs_user_confirm' : 'ok',
            result: event,
            confirmToken: eventType === 'drueckjagd' ? `confirm-${Date.now()}` : undefined,
            preview: eventType === 'drueckjagd' ? {
                message: 'Drückjagd erfordert Bestätigung der Sicherheitsrollen',
                requiredRoles: ['Jagdleiter', 'Sicherheitsbeauftragter'],
            } : undefined,
            audit: {
                toolName: 'pack.create_event',
                tier: 2,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }

    async assignRole(
        eventId: string,
        personId: string,
        role: string,
        context: AgentContext
    ): Promise<ToolEnvelope<RoleAssignment>> {
        const startTime = Date.now();

        const assignment: RoleAssignment = {
            id: `role-${Date.now()}`,
            eventId,
            personId,
            role,
            assignedAt: new Date().toISOString(),
            assignedBy: context.user.id,
            status: 'pending',
        };

        return {
            status: 'ok',
            result: assignment,
            audit: {
                toolName: 'pack.assign_role',
                tier: 1,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }

    private getDrueckjagdSafety(): string[] {
        return [
            'Jagdleiter vor Ort',
            'Sicherheitsbeauftragter bestimmt',
            'Notfall-Treffpunkt festgelegt',
            'Abblasen-Signal vereinbart',
            'Erste-Hilfe-Material geprüft',
            'Schützenstände markiert',
            'Treiberlinien festgelegt',
        ];
    }
}

interface PackEvent {
    id: string;
    eventType: string;
    date: string;
    meetingPointGeo: GeoScope;
    roles: { role: string; person?: string }[];
    locationSharing: 'off' | 'event_only';
    status: string;
    participants: string[];
    safetyChecklist: string[];
    createdBy: string;
    createdAt: string;
}

interface RoleAssignment {
    id: string;
    eventId: string;
    personId: string;
    role: string;
    assignedAt: string;
    assignedBy: string;
    status: string;
}

export default PackAgent;
