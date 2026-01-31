/**
 * Agent Observability API Routes
 *
 * Endpoints for monitoring agent performance and debugging:
 * - Tool call performance metrics
 * - Guardrail statistics
 * - Agent trace browsing
 * - Handoff chain analysis
 *
 * DB tables: tool_call_log, agent_traces
 * DB views:  guardrail_stats, tool_performance, handoff_analysis
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolCallEntry {
    id: string;
    toolName: string;
    userId: string;
    sessionId: string;
    tier: number;
    params: Record<string, unknown>;
    resultStatus: string;
    durationMs: number;
    guardrailsApplied: string[];
    redactions: string[];
    errorMessage?: string;
    createdAt: string;
}

interface AgentTrace {
    id: string;
    sessionId: string;
    userId: string;
    rootAgent: string;
    startTime: string;
    endTime?: string;
    totalDurationMs?: number;
    handoffChain: string[];
    toolCallCount: number;
    guardrailTripCount: number;
    status: 'pending' | 'completed' | 'error';
    spansJson: Array<Record<string, unknown>>;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// In-Memory Store
// ---------------------------------------------------------------------------

const toolCallStore = new Map<string, ToolCallEntry>();
const traceStore = new Map<string, AgentTrace>();

// Seed some demo data
function seedDemoData() {
    const tools = ['searchFeatures', 'fetchLayers', 'fetchConditions', 'addStand', 'deleteStand'];
    const agents = ['scout-agent', 'cockpit-agent', 'journal-agent'];
    const statuses = ['ok', 'ok', 'ok', 'ok', 'blocked'];

    for (let i = 0; i < 50; i++) {
        const id = randomUUID();
        const tool = tools[i % tools.length];
        const createdAt = new Date(Date.now() - Math.random() * 7 * 86400000).toISOString();

        toolCallStore.set(id, {
            id,
            toolName: tool,
            userId: 'demo-user',
            sessionId: `session-${Math.floor(i / 5)}`,
            tier: Math.floor(Math.random() * 3),
            params: {},
            resultStatus: statuses[i % statuses.length],
            durationMs: Math.floor(Math.random() * 500) + 10,
            guardrailsApplied: i % 7 === 0 ? ['pii_filter'] : [],
            redactions: [],
            errorMessage: i % 10 === 9 ? 'Rate limit exceeded' : undefined,
            createdAt,
        });
    }

    for (let i = 0; i < 10; i++) {
        const id = `trace-${i}`;
        const agent = agents[i % agents.length];
        const startTime = new Date(Date.now() - Math.random() * 7 * 86400000);
        const duration = Math.floor(Math.random() * 5000) + 500;

        traceStore.set(id, {
            id,
            sessionId: `session-${i}`,
            userId: 'demo-user',
            rootAgent: agent,
            startTime: startTime.toISOString(),
            endTime: new Date(startTime.getTime() + duration).toISOString(),
            totalDurationMs: duration,
            handoffChain: i % 3 === 0 ? [agent, 'helper-agent'] : [agent],
            toolCallCount: Math.floor(Math.random() * 10) + 1,
            guardrailTripCount: i % 5 === 0 ? 1 : 0,
            status: i % 8 === 7 ? 'error' : 'completed',
            spansJson: [],
            createdAt: startTime.toISOString(),
        });
    }
}

seedDemoData();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createJagdObservabilityRoutes() {
    return new Elysia({ prefix: '/api/v1/admin/observability' })

        // ── Tool Performance ──

        .get('/tool-performance', async ({ query }) => {
            const entries = Array.from(toolCallStore.values());

            // Group by tool name
            const byTool = new Map<string, ToolCallEntry[]>();
            for (const e of entries) {
                const list = byTool.get(e.toolName) ?? [];
                list.push(e);
                byTool.set(e.toolName, list);
            }

            const performance = Array.from(byTool.entries()).map(([toolName, calls]) => {
                const durations = calls.map(c => c.durationMs).sort((a, b) => a - b);
                const okCount = calls.filter(c => c.resultStatus === 'ok').length;

                return {
                    toolName,
                    totalCalls: calls.length,
                    avgDurationMs: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
                    p95DurationMs: durations[Math.floor(durations.length * 0.95)] ?? 0,
                    successRate: calls.length > 0 ? okCount / calls.length : 0,
                };
            });

            performance.sort((a, b) => b.totalCalls - a.totalCalls);

            return { success: true, performance, count: performance.length };
        })

        // ── Guardrail Stats ──

        .get('/guardrails', async () => {
            const entries = Array.from(toolCallStore.values())
                .filter(e => e.guardrailsApplied.length > 0);

            const byGuardrail = new Map<string, { invocations: number; blocks: number }>();
            for (const e of entries) {
                for (const g of e.guardrailsApplied) {
                    const stats = byGuardrail.get(g) ?? { invocations: 0, blocks: 0 };
                    stats.invocations++;
                    if (e.resultStatus === 'blocked') stats.blocks++;
                    byGuardrail.set(g, stats);
                }
            }

            const guardrails = Array.from(byGuardrail.entries()).map(([name, stats]) => ({
                guardrailName: name,
                ...stats,
                blockRate: stats.invocations > 0 ? stats.blocks / stats.invocations : 0,
            }));

            return { success: true, guardrails, count: guardrails.length };
        })

        // ── Agent Traces ──

        .get('/traces', async ({ query }) => {
            let traces = Array.from(traceStore.values());

            if (query.status) {
                traces = traces.filter(t => t.status === query.status);
            }
            if (query.agent) {
                traces = traces.filter(t => t.rootAgent === query.agent);
            }

            traces.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            const limit = Math.min(Number(query.limit) || 50, 100);
            const offset = Number(query.offset) || 0;

            return {
                success: true,
                traces: traces.slice(offset, offset + limit),
                total: traces.length,
            };
        })

        .get('/traces/:id', async ({ params, set }) => {
            const trace = traceStore.get(params.id);
            if (!trace) {
                set.status = 404;
                return { error: 'Trace nicht gefunden' };
            }

            // Get associated tool calls
            const toolCalls = Array.from(toolCallStore.values())
                .filter(tc => tc.sessionId === trace.sessionId)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            return { success: true, trace, toolCalls };
        })

        // ── Handoff Analysis ──

        .get('/handoffs', async () => {
            const traces = Array.from(traceStore.values())
                .filter(t => t.status === 'completed');

            const byDepth = new Map<number, { count: number; totalDuration: number; totalCalls: number }>();
            for (const t of traces) {
                const depth = t.handoffChain.length;
                const stats = byDepth.get(depth) ?? { count: 0, totalDuration: 0, totalCalls: 0 };
                stats.count++;
                stats.totalDuration += t.totalDurationMs ?? 0;
                stats.totalCalls += t.toolCallCount;
                byDepth.set(depth, stats);
            }

            const analysis = Array.from(byDepth.entries()).map(([depth, stats]) => ({
                chainDepth: depth,
                traceCount: stats.count,
                avgDurationMs: Math.round(stats.totalDuration / stats.count),
                avgToolCalls: Math.round(stats.totalCalls / stats.count),
            }));

            analysis.sort((a, b) => a.chainDepth - b.chainDepth);

            return { success: true, analysis, count: analysis.length };
        })

        // ── Log a tool call (for integration) ──

        .post(
            '/log-tool-call',
            async ({ body }) => {
                const id = randomUUID();

                const entry: ToolCallEntry = {
                    id,
                    toolName: body.toolName,
                    userId: body.userId ?? 'system',
                    sessionId: body.sessionId ?? 'unknown',
                    tier: body.tier ?? 0,
                    params: body.params ?? {},
                    resultStatus: body.resultStatus ?? 'ok',
                    durationMs: body.durationMs ?? 0,
                    guardrailsApplied: body.guardrailsApplied ?? [],
                    redactions: [],
                    errorMessage: body.errorMessage,
                    createdAt: new Date().toISOString(),
                };

                toolCallStore.set(id, entry);

                return { success: true, id };
            },
            {
                body: t.Object({
                    toolName: t.String(),
                    userId: t.Optional(t.String()),
                    sessionId: t.Optional(t.String()),
                    tier: t.Optional(t.Number()),
                    params: t.Optional(t.Record(t.String(), t.Unknown())),
                    resultStatus: t.Optional(t.String()),
                    durationMs: t.Optional(t.Number()),
                    guardrailsApplied: t.Optional(t.Array(t.String())),
                    errorMessage: t.Optional(t.String()),
                }),
            }
        );
}

export default createJagdObservabilityRoutes;
