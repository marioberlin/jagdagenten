/**
 * Unified Tool Gateway
 *
 * Centralized endpoint for all agent tool calls:
 * - Schema validation
 * - Permission tier enforcement
 * - Guardrail execution (pre/post)
 * - Audit logging
 */

import Elysia, { t } from 'elysia';
import { db } from '../../db/index.js';
import {
    validateToolParams,
    createToolEnvelope,
    createErrorEnvelope,
    createConfirmationEnvelope,
    getToolTier,
    requiresConfirmation,
    type ToolName,
    TOOL_SCHEMAS,
} from '../agents/jagd/schemas/index.js';
import type { ToolEnvelope, ToolAudit, AgentContext, GuardrailResult } from '../agents/jagd/types.js';

// ============================================================================
// Types
// ============================================================================

interface ToolRequest {
    toolName: ToolName;
    params: Record<string, unknown>;
    userId: string;
    sessionId: string;
    confirmToken?: string;
}

interface ToolExecutor {
    (params: Record<string, unknown>, context: AgentContext): Promise<unknown>;
}

// ============================================================================
// Guardrails
// ============================================================================

interface Guardrail {
    name: string;
    applies: (toolName: string) => boolean;
    preValidate?: (params: Record<string, unknown>, context: AgentContext) => GuardrailResult;
    postValidate?: (result: unknown, context: AgentContext) => GuardrailResult;
}

const GUARDRAILS: Guardrail[] = [
    // Block precise geo in public posts
    {
        name: 'geo_public_blocker',
        applies: (tool) => tool === 'feed.publish_post',
        preValidate: (params) => {
            const scope = params.publish_scope as string;
            const geo = params.geo as { mode?: string };

            if (scope === 'public' && geo?.mode === 'precise') {
                return {
                    passed: false,
                    reason: 'Precise location not allowed in public posts',
                    transformedParams: {
                        ...params,
                        geo: { ...geo, mode: 'coarse_grid' },
                    },
                };
            }
            return { passed: true };
        },
    },
    // Redact weapon serials in any share payload
    {
        name: 'weapon_serial_redactor',
        applies: (tool) => tool.startsWith('feed.') || tool.startsWith('pack.'),
        postValidate: (result, context) => {
            const serialPattern = /\b[A-Z]{2,4}[-\s]?\d{4,8}\b/g;
            const str = JSON.stringify(result);

            if (serialPattern.test(str)) {
                const redacted = str.replace(serialPattern, '[REDACTED]');
                return {
                    passed: true,
                    redactions: ['weapon_serial'],
                    transformedParams: JSON.parse(redacted) as Record<string, unknown>,
                };
            }
            return { passed: true };
        },
    },
    // Block live location outside events
    {
        name: 'live_location_blocker',
        applies: (tool) => tool === 'pack.create_event',
        preValidate: (params) => {
            const sharing = params.location_sharing as string;
            if (sharing !== 'off' && sharing !== 'event_only') {
                return {
                    passed: false,
                    reason: 'Live location only allowed for event-only scope',
                };
            }
            return { passed: true };
        },
    },
];

function runPreGuardrails(
    toolName: ToolName,
    params: Record<string, unknown>,
    context: AgentContext
): { passed: boolean; params: Record<string, unknown>; applied: string[]; reason?: string } {
    let currentParams = params;
    const applied: string[] = [];

    for (const guardrail of GUARDRAILS) {
        if (!guardrail.applies(toolName) || !guardrail.preValidate) continue;

        const result = guardrail.preValidate(currentParams, context);
        applied.push(guardrail.name);

        if (!result.passed) {
            return { passed: false, params: currentParams, applied, reason: result.reason };
        }

        if (result.transformedParams) {
            currentParams = result.transformedParams;
        }
    }

    return { passed: true, params: currentParams, applied };
}

function runPostGuardrails(
    toolName: ToolName,
    result: unknown,
    context: AgentContext
): { result: unknown; applied: string[]; redactions: string[] } {
    let currentResult = result;
    const applied: string[] = [];
    const redactions: string[] = [];

    for (const guardrail of GUARDRAILS) {
        if (!guardrail.applies(toolName) || !guardrail.postValidate) continue;

        const guardResult = guardrail.postValidate(currentResult, context);
        applied.push(guardrail.name);

        if (guardResult.redactions) {
            redactions.push(...guardResult.redactions);
        }

        if (guardResult.transformedParams) {
            currentResult = guardResult.transformedParams;
        }
    }

    return { result: currentResult, applied, redactions };
}

// ============================================================================
// Tool Executors Registry
// ============================================================================

const toolExecutors = new Map<ToolName, ToolExecutor>();

/**
 * Register a tool executor
 */
export function registerToolExecutor(name: ToolName, executor: ToolExecutor): void {
    toolExecutors.set(name, executor);
}

// ============================================================================
// Pending Confirmations Store (in-memory for MVP)
// ============================================================================

const pendingConfirmations = new Map<string, {
    toolName: ToolName;
    params: Record<string, unknown>;
    context: AgentContext;
    createdAt: Date;
}>();

function generateConfirmToken(): string {
    return `confirm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// ============================================================================
// Gateway Logic
// ============================================================================

async function executeTool(request: ToolRequest): Promise<ToolEnvelope<unknown>> {
    const { toolName, params, userId, sessionId, confirmToken } = request;
    const startTime = Date.now();

    // Validate tool exists
    if (!(toolName in TOOL_SCHEMAS)) {
        return createErrorEnvelope(toolName, `Unknown tool: ${toolName}`, { userId, sessionId });
    }

    // Build minimal context
    const context: AgentContext = {
        user: { id: userId, displayName: undefined, permissions: [], revierIds: [], isGlobalAdmin: false },
        session: { id: sessionId, conversationHistory: [], lastToolCalls: [] },
        locale: 'de',
        timestamp: new Date().toISOString(),
    };

    // Handle confirmation tokens
    if (confirmToken) {
        const pending = pendingConfirmations.get(confirmToken);
        if (!pending || pending.toolName !== toolName) {
            return createErrorEnvelope(toolName, 'Invalid or expired confirmation token', { userId, sessionId });
        }
        pendingConfirmations.delete(confirmToken);
        // Continue with confirmed params
    }

    // 1. Schema validation
    const validation = validateToolParams(toolName, params);
    if (!validation.valid) {
        return createErrorEnvelope(toolName, `Validation failed: ${validation.errors?.join(', ')}`, { userId, sessionId });
    }

    // 2. Pre-guardrails
    const preResult = runPreGuardrails(toolName, params, context);
    if (!preResult.passed) {
        return createErrorEnvelope(toolName, preResult.reason || 'Guardrail blocked', {
            userId,
            sessionId,
            guardrailsApplied: preResult.applied,
        });
    }

    // 3. Check if confirmation required (Tier 2+)
    if (requiresConfirmation(toolName) && !confirmToken) {
        const token = generateConfirmToken();
        pendingConfirmations.set(token, { toolName, params: preResult.params, context, createdAt: new Date() });

        // Auto-expire after 5 minutes
        setTimeout(() => pendingConfirmations.delete(token), 5 * 60 * 1000);

        return createConfirmationEnvelope(toolName, {
            action: toolName,
            params: preResult.params,
            tier: getToolTier(toolName),
        }, token, { userId, sessionId, guardrailsApplied: preResult.applied });
    }

    // 4. Execute tool
    const executor = toolExecutors.get(toolName);
    if (!executor) {
        // Return mock result for now (stub)
        const stubResult = { stub: true, toolName, params: preResult.params };
        return createToolEnvelope(toolName, stubResult, {
            userId,
            sessionId,
            durationMs: Date.now() - startTime,
            guardrailsApplied: preResult.applied,
        });
    }

    try {
        const rawResult = await executor(preResult.params, context);

        // 5. Post-guardrails
        const postResult = runPostGuardrails(toolName, rawResult, context);

        // 6. Log to audit table
        await logToolCall(toolName, preResult.params, postResult.result, context, {
            durationMs: Date.now() - startTime,
            guardrailsApplied: [...preResult.applied, ...postResult.applied],
            redactions: postResult.redactions,
        });

        return createToolEnvelope(toolName, postResult.result, {
            userId,
            sessionId,
            durationMs: Date.now() - startTime,
            guardrailsApplied: [...preResult.applied, ...postResult.applied],
            redactions: postResult.redactions,
        });

    } catch (error) {
        return createErrorEnvelope(
            toolName,
            error instanceof Error ? error.message : String(error),
            { userId, sessionId, durationMs: Date.now() - startTime }
        );
    }
}

async function logToolCall(
    toolName: ToolName,
    params: Record<string, unknown>,
    result: unknown,
    context: AgentContext,
    audit: Partial<ToolAudit>
): Promise<void> {
    try {
        await db.query(`
            INSERT INTO tool_call_log (
                tool_name,
                user_id,
                session_id,
                tier,
                params,
                result_status,
                duration_ms,
                guardrails_applied,
                redactions,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [
            toolName,
            context.user.id,
            context.session.id,
            getToolTier(toolName),
            JSON.stringify(params),
            'ok',
            audit.durationMs,
            JSON.stringify(audit.guardrailsApplied || []),
            JSON.stringify(audit.redactions || []),
        ]);
    } catch (err) {
        console.error('[ToolGateway] Failed to log tool call:', err);
    }
}

// ============================================================================
// Elysia Plugin
// ============================================================================

export const toolGatewayPlugin = new Elysia({ prefix: '/tools' })
    .post('/:toolName', async ({ params, body, set }) => {
        const toolName = params.toolName as ToolName;
        const { params: toolParams, userId, sessionId, confirmToken } = body as {
            params: Record<string, unknown>;
            userId: string;
            sessionId: string;
            confirmToken?: string;
        };

        const result = await executeTool({
            toolName,
            params: toolParams,
            userId,
            sessionId,
            confirmToken,
        });

        if (result.status === 'error') {
            set.status = 400;
        }

        return result;
    }, {
        body: t.Object({
            params: t.Record(t.String(), t.Unknown()),
            userId: t.String(),
            sessionId: t.String(),
            confirmToken: t.Optional(t.String()),
        }),
    })
    .post('/:toolName/confirm', async ({ params, body, set }) => {
        const toolName = params.toolName as ToolName;
        const { confirmToken, userId, sessionId } = body as {
            confirmToken: string;
            userId: string;
            sessionId: string;
        };

        const pending = pendingConfirmations.get(confirmToken);
        if (!pending) {
            set.status = 400;
            return { error: 'Invalid or expired confirmation token' };
        }

        const result = await executeTool({
            toolName,
            params: pending.params,
            userId,
            sessionId,
            confirmToken,
        });

        return result;
    }, {
        body: t.Object({
            confirmToken: t.String(),
            userId: t.String(),
            sessionId: t.String(),
        }),
    })
    .get('/schemas', () => {
        return Object.entries(TOOL_SCHEMAS).map(([name, schema]) => ({
            name,
            description: schema.description,
            tier: getToolTier(name as ToolName),
            requiresConfirmation: requiresConfirmation(name as ToolName),
        }));
    })
    .get('/schemas/:toolName', ({ params }) => {
        const schema = TOOL_SCHEMAS[params.toolName as ToolName];
        if (!schema) {
            return { error: 'Unknown tool' };
        }
        return schema;
    });

export default toolGatewayPlugin;
