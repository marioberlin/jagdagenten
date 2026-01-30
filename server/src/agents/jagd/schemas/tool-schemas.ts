/**
 * Centralized JSON Schema Registry
 *
 * Provides strict JSON Schema definitions for all agent tools,
 * enabling compile-time TypeScript validation and runtime enforcement.
 *
 * Based on Appendix A, Section A3.2 of the Jagd-Agenten spec.
 */

import type { GeoScope } from '@jagdagenten/types-jagd';

// ============================================================================
// Base Types (Shared Definitions)
// ============================================================================

export const GEO_SCOPE_SCHEMA = {
    $id: 'GeoScope',
    type: 'object',
    properties: {
        mode: { type: 'string', enum: ['none', 'coarse_grid', 'precise'] },
        grid_id: { type: 'string' },
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lon: { type: 'number', minimum: -180, maximum: 180 },
        blur_meters: { type: 'integer', minimum: 0 },
    },
    required: ['mode'],
} as const;

// ============================================================================
// Timeline Tool Schemas
// ============================================================================

export const TIMELINE_START_SESSION_SCHEMA = {
    name: 'timeline.start_session',
    description: 'Start a hunt session in the Hunt Timeline.',
    parameters: {
        type: 'object',
        properties: {
            session_type: {
                type: 'string',
                enum: ['ansitz', 'pirsch', 'drueckjagd', 'other'],
            },
            start_time: { type: 'string', format: 'date-time' },
            geo: { $ref: '#/$defs/GeoScope' },
            participants: {
                type: 'array',
                items: { type: 'string' },
            },
            privacy_mode: {
                type: 'string',
                enum: ['private', 'team_event_only', 'public_blurred'],
            },
        },
        required: ['session_type', 'start_time', 'geo', 'privacy_mode'],
    },
} as const;

export const TIMELINE_LOG_EVENT_SCHEMA = {
    name: 'timeline.log_event',
    description: 'Append an event to the Hunt Timeline.',
    parameters: {
        type: 'object',
        properties: {
            session_id: { type: 'string' },
            event_type: {
                type: 'string',
                enum: ['sighting', 'shot', 'harvest', 'note', 'processing', 'handover'],
            },
            time: { type: 'string', format: 'date-time' },
            geo: { $ref: '#/$defs/GeoScope' },
            data: { type: 'object' },
        },
        required: ['session_id', 'event_type', 'time', 'geo', 'data'],
    },
} as const;

export const TIMELINE_END_SESSION_SCHEMA = {
    name: 'timeline.end_session',
    description: 'End a hunt session and produce a recap object.',
    parameters: {
        type: 'object',
        properties: {
            session_id: { type: 'string' },
            end_time: { type: 'string', format: 'date-time' },
        },
        required: ['session_id', 'end_time'],
    },
} as const;

// ============================================================================
// Scout Tool Schemas
// ============================================================================

export const SCOUT_GET_CONDITIONS_SCHEMA = {
    name: 'scout.get_conditions_snapshot',
    description: 'Return a localized conditions snapshot for hunting decisions.',
    parameters: {
        type: 'object',
        properties: {
            geo: { $ref: '#/$defs/GeoScope' },
            time_range_hours: { type: 'integer', minimum: 1, maximum: 72 },
        },
        required: ['geo', 'time_range_hours'],
    },
} as const;

export const SCOUT_RECOMMEND_PLAN_SCHEMA = {
    name: 'scout.recommend_plan',
    description: 'Recommend stands, approach, and time windows given conditions and history.',
    parameters: {
        type: 'object',
        properties: {
            geo: { $ref: '#/$defs/GeoScope' },
            stands: {
                type: 'array',
                items: { type: 'string' },
            },
            target_species: {
                type: 'array',
                items: { type: 'string' },
            },
            constraints: { type: 'object' },
        },
        required: ['geo', 'stands'],
    },
} as const;

// ============================================================================
// Bureaucracy Tool Schemas
// ============================================================================

export const BUREAUCRACY_EXPORT_PACK_SCHEMA = {
    name: 'bureaucracy.generate_export_pack',
    description: 'Generate reporting export pack for a state/authority: PDF + CSV + helper.',
    parameters: {
        type: 'object',
        properties: {
            region: {
                type: 'string',
                description: 'e.g., DE-BY, DE-NI, AT-..., CH-...',
            },
            authority: { type: 'string' },
            period: {
                type: 'string',
                description: 'e.g., 2025-04-01..2026-03-31',
            },
            source_session_ids: {
                type: 'array',
                items: { type: 'string' },
            },
        },
        required: ['region', 'period', 'source_session_ids'],
    },
} as const;

export const BUREAUCRACY_GUEST_PERMIT_SCHEMA = {
    name: 'bureaucracy.create_guest_permit_pdf',
    description: 'Create a Begehungsschein PDF for a guest.',
    parameters: {
        type: 'object',
        properties: {
            guest_name: { type: 'string' },
            valid_from: { type: 'string', format: 'date' },
            valid_to: { type: 'string', format: 'date' },
            revier_name: { type: 'string' },
            conditions: { type: 'string' },
        },
        required: ['guest_name', 'valid_from', 'valid_to', 'revier_name'],
    },
} as const;

// ============================================================================
// Quartermaster Tool Schemas
// ============================================================================

export const GEAR_CHECKLIST_SCHEMA = {
    name: 'gear.generate_pre_hunt_checklist',
    description: 'Create a 1-tap checklist tailored to the planned hunt.',
    parameters: {
        type: 'object',
        properties: {
            session_type: { type: 'string' },
            weather_risk: {
                type: 'string',
                enum: ['low', 'med', 'high'],
            },
            weapons_profile_ids: {
                type: 'array',
                items: { type: 'string' },
            },
        },
        required: ['session_type'],
    },
} as const;

// ============================================================================
// Pack Tool Schemas
// ============================================================================

export const PACK_CREATE_EVENT_SCHEMA = {
    name: 'pack.create_event',
    description: 'Create a hunt event with roles and safety settings.',
    parameters: {
        type: 'object',
        properties: {
            event_type: {
                type: 'string',
                enum: ['drueckjagd', 'revierarbeit', 'training', 'other'],
            },
            date: { type: 'string', format: 'date' },
            meeting_point_geo: { $ref: '#/$defs/GeoScope' },
            roles: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        role: { type: 'string' },
                        person: { type: 'string' },
                    },
                    required: ['role'],
                },
            },
            location_sharing: {
                type: 'string',
                enum: ['off', 'event_only'],
            },
        },
        required: ['event_type', 'date', 'meeting_point_geo', 'location_sharing'],
    },
} as const;

// ============================================================================
// Feed/News Tool Schemas
// ============================================================================

export const FEED_PUBLISH_POST_SCHEMA = {
    name: 'feed.publish_post',
    description: 'Publish a post to Waidmann-Feed. Requires moderation + privacy checks.',
    parameters: {
        type: 'object',
        properties: {
            post_type: {
                type: 'string',
                enum: ['sighting', 'story', 'invite'],
            },
            content: { type: 'object' },
            geo: { $ref: '#/$defs/GeoScope' },
            publish_scope: {
                type: 'string',
                enum: ['private', 'friends', 'public'],
            },
        },
        required: ['post_type', 'content', 'geo', 'publish_scope'],
    },
} as const;

export const NEWS_INGEST_SOURCES_SCHEMA = {
    name: 'news.ingest_sources',
    description: 'Fetch and store metadata for news items from allowed sources.',
    parameters: {
        type: 'object',
        properties: {
            source_ids: {
                type: 'array',
                items: { type: 'string' },
            },
            since_hours: { type: 'integer', minimum: 1, maximum: 168 },
        },
        required: ['source_ids', 'since_hours'],
    },
} as const;

export const NEWS_SUMMARIZE_SCHEMA = {
    name: 'news.summarize_with_citations',
    description: 'Summarize a news item with safe excerpting and source citation.',
    parameters: {
        type: 'object',
        properties: {
            item_id: { type: 'string' },
            max_sentences: { type: 'integer', minimum: 1, maximum: 3 },
        },
        required: ['item_id', 'max_sentences'],
    },
} as const;

// ============================================================================
// Moderation Tool Schemas
// ============================================================================

export const MODERATION_CHECK_POST_SCHEMA = {
    name: 'moderation.check_post',
    description: 'Run policy, privacy, and legality checks on UGC. Returns decision + reason codes.',
    parameters: {
        type: 'object',
        properties: {
            post_type: { type: 'string' },
            content: { type: 'object' },
            geo: { $ref: '#/$defs/GeoScope' },
        },
        required: ['post_type', 'content', 'geo'],
    },
} as const;

// ============================================================================
// Hege & Pflege Tool Schemas
// ============================================================================

export const HEGE_CREATE_PROJECT_SCHEMA = {
    name: 'hege.create_project',
    description: 'Create a Hege & Pflege project (Revierarbeit, Kitzrettung, etc.) with tasks and team.',
    parameters: {
        type: 'object',
        properties: {
            project_type: {
                type: 'string',
                enum: ['revierarbeit', 'kitzrettung', 'feeding_round', 'nest_boxes', 'habitat', 'infrastructure'],
            },
            title: { type: 'string' },
            date: { type: 'string', format: 'date' },
            meeting_point_geo: { $ref: '#/$defs/GeoScope' },
            team_scope: { type: 'string', enum: ['private', 'team'] },
            tasks: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        task_type: { type: 'string' },
                        label: { type: 'string' },
                        assignee: { type: 'string' },
                        geo: { $ref: '#/$defs/GeoScope' },
                        due_time: { type: 'string', format: 'date-time' },
                    },
                    required: ['label'],
                },
            },
        },
        required: ['project_type', 'title', 'date', 'team_scope'],
    },
} as const;

export const HEGE_LOG_ACTIVITY_SCHEMA = {
    name: 'hege.log_activity',
    description: 'Log a Hege & Pflege activity (feeding, nest box, habitat work, inspection).',
    parameters: {
        type: 'object',
        properties: {
            project_id: { type: 'string' },
            activity_type: {
                type: 'string',
                enum: ['feeding', 'nest_box', 'habitat', 'infrastructure', 'counting', 'note'],
            },
            time: { type: 'string', format: 'date-time' },
            geo: { $ref: '#/$defs/GeoScope' },
            data: { type: 'object' },
        },
        required: ['activity_type', 'time', 'geo', 'data'],
    },
} as const;

export const HEGE_CREATE_MOWING_NOTICE_SCHEMA = {
    name: 'hege.create_mowing_notice',
    description: 'Create a mowing notice that triggers Kitzrettung workflow planning.',
    parameters: {
        type: 'object',
        properties: {
            field_name: { type: 'string' },
            geo: { $ref: '#/$defs/GeoScope' },
            mowing_start: { type: 'string', format: 'date-time' },
            mowing_end: { type: 'string', format: 'date-time' },
            contact_name: { type: 'string' },
            contact_phone: { type: 'string' },
            notes: { type: 'string' },
        },
        required: ['field_name', 'geo', 'mowing_start'],
    },
} as const;

// ============================================================================
// Wildunfall Tool Schemas
// ============================================================================

export const WILDUNFALL_START_INCIDENT_SCHEMA = {
    name: 'wildunfall.start_incident',
    description: 'Start a wildlife collision incident log and prepare dispatch.',
    parameters: {
        type: 'object',
        properties: {
            time: { type: 'string', format: 'date-time' },
            geo: { $ref: '#/$defs/GeoScope' },
            suspected_species: { type: 'string' },
            injury_status: { type: 'string', enum: ['unknown', 'likely_alive', 'likely_dead'] },
            reporter_notes: { type: 'string' },
        },
        required: ['time', 'geo'],
    },
} as const;

export const WILDUNFALL_DISPATCH_SCHEMA = {
    name: 'wildunfall.dispatch_on_call',
    description: 'Notify on-call roster for Wildunfall response and track acceptance.',
    parameters: {
        type: 'object',
        properties: {
            incident_id: { type: 'string' },
            team_id: { type: 'string' },
            notify_mode: { type: 'string', enum: ['in_app', 'sms', 'whatsapp_link'] },
            message: { type: 'string' },
        },
        required: ['incident_id', 'team_id', 'notify_mode'],
    },
} as const;

export const WILDUNFALL_UPDATE_INCIDENT_SCHEMA = {
    name: 'wildunfall.update_incident',
    description: 'Update Wildunfall incident status, add photos/notes, close incident.',
    parameters: {
        type: 'object',
        properties: {
            incident_id: { type: 'string' },
            status: { type: 'string', enum: ['open', 'accepted', 'arrived', 'resolved', 'closed'] },
            geo: { $ref: '#/$defs/GeoScope' },
            data: { type: 'object' },
        },
        required: ['incident_id', 'status'],
    },
} as const;

// ============================================================================
// Nachsuche Tool Schemas
// ============================================================================

export const NACHSUCHE_START_CASE_SCHEMA = {
    name: 'nachsuche.start_case',
    description: 'Start a Nachsuche case linked to a hunt session and shot event.',
    parameters: {
        type: 'object',
        properties: {
            session_id: { type: 'string' },
            shot_event_id: { type: 'string' },
            geo: { $ref: '#/$defs/GeoScope' },
            shot_confidence: { type: 'integer', minimum: 0, maximum: 100 },
            flight_direction: { type: 'string' },
            signs: {
                type: 'array',
                items: { type: 'string', enum: ['blood', 'hair', 'bone', 'none', 'unknown'] },
            },
            notes: { type: 'string' },
        },
        required: ['session_id', 'shot_event_id', 'geo'],
    },
} as const;

export const NACHSUCHE_ASSIGN_TEAM_SCHEMA = {
    name: 'nachsuche.assign_team',
    description: 'Assign roles for a Nachsuche case (handler, dog, shooter, driver).',
    parameters: {
        type: 'object',
        properties: {
            case_id: { type: 'string' },
            roles: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        role: { type: 'string', enum: ['shooter', 'handler', 'dog', 'driver', 'safety_contact'] },
                        person: { type: 'string' },
                    },
                    required: ['role'],
                },
            },
            share_scope: { type: 'string', enum: ['private', 'team_coarse'] },
        },
        required: ['case_id', 'roles', 'share_scope'],
    },
} as const;

export const NACHSUCHE_UPDATE_CASE_SCHEMA = {
    name: 'nachsuche.update_case',
    description: 'Update Nachsuche case state, log track segments, outcomes, and lessons learned.',
    parameters: {
        type: 'object',
        properties: {
            case_id: { type: 'string' },
            status: { type: 'string', enum: ['open', 'started', 'paused', 'located', 'recovered', 'stopped', 'closed'] },
            geo: { $ref: '#/$defs/GeoScope' },
            data: { type: 'object' },
        },
        required: ['case_id', 'status'],
    },
} as const;

// ============================================================================
// Schema Registry
// ============================================================================

export const TOOL_SCHEMAS = {
    // Timeline
    'timeline.start_session': TIMELINE_START_SESSION_SCHEMA,
    'timeline.log_event': TIMELINE_LOG_EVENT_SCHEMA,
    'timeline.end_session': TIMELINE_END_SESSION_SCHEMA,

    // Scout
    'scout.get_conditions_snapshot': SCOUT_GET_CONDITIONS_SCHEMA,
    'scout.recommend_plan': SCOUT_RECOMMEND_PLAN_SCHEMA,

    // Bureaucracy
    'bureaucracy.generate_export_pack': BUREAUCRACY_EXPORT_PACK_SCHEMA,
    'bureaucracy.create_guest_permit_pdf': BUREAUCRACY_GUEST_PERMIT_SCHEMA,

    // Quartermaster
    'gear.generate_pre_hunt_checklist': GEAR_CHECKLIST_SCHEMA,

    // Pack
    'pack.create_event': PACK_CREATE_EVENT_SCHEMA,

    // Feed/News
    'feed.publish_post': FEED_PUBLISH_POST_SCHEMA,
    'news.ingest_sources': NEWS_INGEST_SOURCES_SCHEMA,
    'news.summarize_with_citations': NEWS_SUMMARIZE_SCHEMA,

    // Moderation
    'moderation.check_post': MODERATION_CHECK_POST_SCHEMA,

    // Hege & Pflege
    'hege.create_project': HEGE_CREATE_PROJECT_SCHEMA,
    'hege.log_activity': HEGE_LOG_ACTIVITY_SCHEMA,
    'hege.create_mowing_notice': HEGE_CREATE_MOWING_NOTICE_SCHEMA,

    // Wildunfall
    'wildunfall.start_incident': WILDUNFALL_START_INCIDENT_SCHEMA,
    'wildunfall.dispatch_on_call': WILDUNFALL_DISPATCH_SCHEMA,
    'wildunfall.update_incident': WILDUNFALL_UPDATE_INCIDENT_SCHEMA,

    // Nachsuche
    'nachsuche.start_case': NACHSUCHE_START_CASE_SCHEMA,
    'nachsuche.assign_team': NACHSUCHE_ASSIGN_TEAM_SCHEMA,
    'nachsuche.update_case': NACHSUCHE_UPDATE_CASE_SCHEMA,
} as const;

export type ToolName = keyof typeof TOOL_SCHEMAS;

// ============================================================================
// Schema Resolution
// ============================================================================

const DEFINITIONS = {
    GeoScope: GEO_SCOPE_SCHEMA,
};

/**
 * Resolve $ref pointers in a schema
 */
export function resolveSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') return schema;

    if (schema.$ref) {
        const refName = schema.$ref.replace('#/$defs/', '');
        return DEFINITIONS[refName as keyof typeof DEFINITIONS] || schema;
    }

    const resolved: any = {};
    for (const [key, value] of Object.entries(schema)) {
        if (Array.isArray(value)) {
            resolved[key] = value.map(item => resolveSchema(item));
        } else if (typeof value === 'object') {
            resolved[key] = resolveSchema(value);
        } else {
            resolved[key] = value;
        }
    }
    return resolved;
}

/**
 * Get a tool schema by name, with resolved references
 */
export function getToolSchema(name: ToolName): typeof TOOL_SCHEMAS[ToolName] {
    const schema = TOOL_SCHEMAS[name];
    if (!schema) throw new Error(`Unknown tool: ${name}`);
    return resolveSchema(schema);
}

/**
 * Get all tool schemas for Gemini function calling
 */
export function getAllToolDeclarations() {
    return Object.values(TOOL_SCHEMAS).map(schema => ({
        name: schema.name,
        description: schema.description,
        parameters: resolveSchema(schema.parameters),
    }));
}

/**
 * Get tool schemas for a specific agent
 */
export function getToolsForAgent(agentRole: string): typeof TOOL_SCHEMAS[ToolName][] {
    const agentToolMap: Record<string, ToolName[]> = {
        scout: ['scout.get_conditions_snapshot', 'scout.recommend_plan'],
        bureaucracy: ['bureaucracy.generate_export_pack', 'bureaucracy.create_guest_permit_pdf'],
        quartermaster: ['gear.generate_pre_hunt_checklist'],
        journal: ['timeline.start_session', 'timeline.log_event', 'timeline.end_session'],
        pack: ['pack.create_event'],
        feed: ['feed.publish_post'],
        news: ['news.ingest_sources', 'news.summarize_with_citations'],
        moderation: ['moderation.check_post'],
        hege: ['hege.create_project', 'hege.log_activity', 'hege.create_mowing_notice'],
        wildunfall: ['wildunfall.start_incident', 'wildunfall.dispatch_on_call', 'wildunfall.update_incident'],
        nachsuche: ['nachsuche.start_case', 'nachsuche.assign_team', 'nachsuche.update_case'],
    };

    const toolNames = agentToolMap[agentRole] || [];
    return toolNames.map(name => TOOL_SCHEMAS[name]);
}
