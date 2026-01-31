/**
 * Schema Validator
 *
 * Compile-time TypeScript types + runtime JSON Schema validation
 * for all agent tool calls. Uses Ajv for fast validation.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { TOOL_SCHEMAS, type ToolName, resolveSchema, GEO_SCOPE_SCHEMA } from './tool-schemas.js';
import type { ToolEnvelope, ToolAudit } from '../types.js';

// ============================================================================
// Ajv Setup
// ============================================================================

const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictTypes: true,
    strictTuples: true,
});

// Add format validators (date, date-time, etc.)
addFormats(ajv);

// Pre-compile all tool parameter schemas (GeoScope is inlined by resolveSchema)
const compiledValidators = new Map<ToolName, ReturnType<typeof ajv.compile>>();

for (const [name, schema] of Object.entries(TOOL_SCHEMAS)) {
    const resolved = resolveSchema(schema.parameters);
    compiledValidators.set(name as ToolName, ajv.compile(resolved));
}

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
    coerced?: Record<string, unknown>;
}

/**
 * Validate tool parameters against their schema
 */
export function validateToolParams(
    toolName: ToolName,
    params: Record<string, unknown>
): ValidationResult {
    const validator = compiledValidators.get(toolName);

    if (!validator) {
        return {
            valid: false,
            errors: [`Unknown tool: ${toolName}`],
        };
    }

    const valid = validator(params);

    if (valid) {
        return { valid: true, coerced: params };
    }

    return {
        valid: false,
        errors: validator.errors?.map(e => `${e.instancePath} ${e.message}`) || ['Validation failed'],
    };
}

/**
 * Create a validated tool envelope (for responses)
 */
export function createToolEnvelope<T>(
    toolName: ToolName,
    result: T,
    audit: Partial<ToolAudit>
): ToolEnvelope<T> {
    return {
        status: 'ok',
        result,
        audit: {
            toolName,
            tier: getToolTier(toolName),
            invokedAt: new Date().toISOString(),
            ...audit,
        },
    };
}

/**
 * Create an error envelope
 */
export function createErrorEnvelope(
    toolName: ToolName,
    error: string,
    audit: Partial<ToolAudit>
): ToolEnvelope<never> {
    return {
        status: 'error',
        error,
        audit: {
            toolName,
            tier: getToolTier(toolName),
            invokedAt: new Date().toISOString(),
            ...audit,
        },
    };
}

/**
 * Create a confirmation-required envelope (Tier 2/3)
 */
export function createConfirmationEnvelope<T>(
    toolName: ToolName,
    preview: T,
    confirmToken: string,
    audit: Partial<ToolAudit>
): ToolEnvelope<T> {
    return {
        status: 'needs_user_confirm',
        preview: preview as Record<string, unknown>,
        confirmToken,
        audit: {
            toolName,
            tier: getToolTier(toolName),
            invokedAt: new Date().toISOString(),
            ...audit,
        },
    };
}

// ============================================================================
// Tool Tiers (Permission Levels)
// ============================================================================

const TOOL_TIERS: Record<ToolName, 0 | 1 | 2 | 3> = {
    // Tier 0 - Read only
    'scout.get_conditions_snapshot': 0,
    'scout.recommend_plan': 0,
    'news.ingest_sources': 0,
    'news.summarize_with_citations': 0,

    // Tier 1 - Safe local writes
    'timeline.start_session': 1,
    'timeline.log_event': 1,
    'timeline.end_session': 1,
    'gear.generate_pre_hunt_checklist': 1,
    'bureaucracy.generate_export_pack': 1,
    'bureaucracy.create_guest_permit_pdf': 1,
    'moderation.check_post': 1,

    // Tier 2 - Publish/share
    'feed.publish_post': 2,
    'pack.create_event': 2,
};

export function getToolTier(toolName: ToolName): 0 | 1 | 2 | 3 {
    return TOOL_TIERS[toolName] ?? 0;
}

export function requiresConfirmation(toolName: ToolName): boolean {
    return getToolTier(toolName) >= 2;
}

// ============================================================================
// TypeScript Type Extraction (Compile-Time)
// ============================================================================

/**
 * Extract parameter types from schema at compile time
 */
export type ToolParams<T extends ToolName> =
    T extends 'timeline.start_session' ? TimelineStartSessionParams :
    T extends 'timeline.log_event' ? TimelineLogEventParams :
    T extends 'timeline.end_session' ? TimelineEndSessionParams :
    T extends 'scout.get_conditions_snapshot' ? ScoutConditionsParams :
    T extends 'scout.recommend_plan' ? ScoutRecommendParams :
    T extends 'bureaucracy.generate_export_pack' ? BureaucracyExportParams :
    T extends 'bureaucracy.create_guest_permit_pdf' ? BureaucracyPermitParams :
    T extends 'gear.generate_pre_hunt_checklist' ? GearChecklistParams :
    T extends 'pack.create_event' ? PackCreateEventParams :
    T extends 'feed.publish_post' ? FeedPublishParams :
    T extends 'news.ingest_sources' ? NewsIngestParams :
    T extends 'news.summarize_with_citations' ? NewsSummarizeParams :
    T extends 'moderation.check_post' ? ModerationCheckParams :
    never;

// Parameter type definitions (derived from schemas)
interface GeoScopeParam {
    mode: 'none' | 'coarse_grid' | 'precise';
    grid_id?: string;
    lat?: number;
    lon?: number;
    blur_meters?: number;
}

interface TimelineStartSessionParams {
    session_type: 'ansitz' | 'pirsch' | 'drueckjagd' | 'other';
    start_time: string;
    geo: GeoScopeParam;
    participants?: string[];
    privacy_mode: 'private' | 'team_event_only' | 'public_blurred';
}

interface TimelineLogEventParams {
    session_id: string;
    event_type: 'sighting' | 'shot' | 'harvest' | 'note' | 'processing' | 'handover';
    time: string;
    geo: GeoScopeParam;
    data: Record<string, unknown>;
}

interface TimelineEndSessionParams {
    session_id: string;
    end_time: string;
}

interface ScoutConditionsParams {
    geo: GeoScopeParam;
    time_range_hours: number;
}

interface ScoutRecommendParams {
    geo: GeoScopeParam;
    stands: string[];
    target_species?: string[];
    constraints?: Record<string, unknown>;
}

interface BureaucracyExportParams {
    region: string;
    authority?: string;
    period: string;
    source_session_ids: string[];
}

interface BureaucracyPermitParams {
    guest_name: string;
    valid_from: string;
    valid_to: string;
    revier_name: string;
    conditions?: string;
}

interface GearChecklistParams {
    session_type: string;
    weather_risk?: 'low' | 'med' | 'high';
    weapons_profile_ids?: string[];
}

interface PackCreateEventParams {
    event_type: 'drueckjagd' | 'revierarbeit' | 'training' | 'other';
    date: string;
    meeting_point_geo: GeoScopeParam;
    roles?: Array<{ role: string; person?: string }>;
    location_sharing: 'off' | 'event_only';
}

interface FeedPublishParams {
    post_type: 'sighting' | 'story' | 'invite';
    content: Record<string, unknown>;
    geo: GeoScopeParam;
    publish_scope: 'private' | 'friends' | 'public';
}

interface NewsIngestParams {
    source_ids: string[];
    since_hours: number;
}

interface NewsSummarizeParams {
    item_id: string;
    max_sentences: number;
}

interface ModerationCheckParams {
    post_type: string;
    content: Record<string, unknown>;
    geo: GeoScopeParam;
}

export type {
    GeoScopeParam,
    TimelineStartSessionParams,
    TimelineLogEventParams,
    TimelineEndSessionParams,
    ScoutConditionsParams,
    ScoutRecommendParams,
    BureaucracyExportParams,
    BureaucracyPermitParams,
    GearChecklistParams,
    PackCreateEventParams,
    FeedPublishParams,
    NewsIngestParams,
    NewsSummarizeParams,
    ModerationCheckParams,
};
