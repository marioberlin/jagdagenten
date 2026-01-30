/**
 * Handoff Tracer — Full Observability for Agent Orchestration
 *
 * Captures the complete trace of agent handoffs, tool calls, and
 * guardrail executions for debugging and analysis.
 *
 * Based on OpenAI Agents SDK tracing patterns (Appendix A, Section A8.2).
 */

import { db } from '../../db/index.js';
import type { AgentRole, ToolCallRecord, AgentContext, GuardrailResult } from './types.js';

// ============================================================================
// Trace Types
// ============================================================================

export interface TraceSpan {
    id: string;
    traceId: string;
    parentId?: string;
    name: string;
    kind: 'handoff' | 'tool_call' | 'guardrail' | 'agent_response';
    agentRole: AgentRole;
    startTime: Date;
    endTime?: Date;
    durationMs?: number;
    status: 'pending' | 'ok' | 'error' | 'blocked';
    metadata: Record<string, unknown>;
    error?: string;
}

export interface Trace {
    id: string;
    sessionId: string;
    userId: string;
    rootAgent: AgentRole;
    startTime: Date;
    endTime?: Date;
    totalDurationMs?: number;
    spans: TraceSpan[];
    handoffChain: AgentRole[];
    toolCallCount: number;
    guardrailTripCount: number;
    status: 'pending' | 'completed' | 'error';
}

// ============================================================================
// Tracer Class
// ============================================================================

export class HandoffTracer {
    private activeTraces = new Map<string, Trace>();
    private spanStack = new Map<string, TraceSpan[]>();

    /**
     * Start a new trace for a conversation turn
     */
    startTrace(sessionId: string, userId: string, rootAgent: AgentRole): string {
        const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const trace: Trace = {
            id: traceId,
            sessionId,
            userId,
            rootAgent,
            startTime: new Date(),
            spans: [],
            handoffChain: [rootAgent],
            toolCallCount: 0,
            guardrailTripCount: 0,
            status: 'pending',
        };

        this.activeTraces.set(traceId, trace);
        this.spanStack.set(traceId, []);

        return traceId;
    }

    /**
     * Record a handoff from one agent to another
     */
    recordHandoff(
        traceId: string,
        fromAgent: AgentRole,
        toAgent: AgentRole,
        reason: string
    ): string {
        const trace = this.activeTraces.get(traceId);
        if (!trace) throw new Error(`Unknown trace: ${traceId}`);

        const spanId = `span_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const stack = this.spanStack.get(traceId) || [];
        const parentSpan = stack[stack.length - 1];

        const span: TraceSpan = {
            id: spanId,
            traceId,
            parentId: parentSpan?.id,
            name: `handoff:${fromAgent}→${toAgent}`,
            kind: 'handoff',
            agentRole: fromAgent,
            startTime: new Date(),
            status: 'pending',
            metadata: { fromAgent, toAgent, reason },
        };

        trace.spans.push(span);
        trace.handoffChain.push(toAgent);
        stack.push(span);
        this.spanStack.set(traceId, stack);

        return spanId;
    }

    /**
     * Record completion of a handoff
     */
    completeHandoff(traceId: string, spanId: string, success: boolean, error?: string): void {
        const trace = this.activeTraces.get(traceId);
        if (!trace) return;

        const span = trace.spans.find(s => s.id === spanId);
        if (!span) return;

        span.endTime = new Date();
        span.durationMs = span.endTime.getTime() - span.startTime.getTime();
        span.status = success ? 'ok' : 'error';
        span.error = error;

        const stack = this.spanStack.get(traceId) || [];
        const idx = stack.findIndex(s => s.id === spanId);
        if (idx >= 0) stack.splice(idx, 1);
        this.spanStack.set(traceId, stack);
    }

    /**
     * Record a tool call
     */
    recordToolCall(
        traceId: string,
        agentRole: AgentRole,
        toolRecord: ToolCallRecord
    ): string {
        const trace = this.activeTraces.get(traceId);
        if (!trace) throw new Error(`Unknown trace: ${traceId}`);

        const spanId = `span_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const stack = this.spanStack.get(traceId) || [];
        const parentSpan = stack[stack.length - 1];

        const span: TraceSpan = {
            id: spanId,
            traceId,
            parentId: parentSpan?.id,
            name: `tool:${toolRecord.name}`,
            kind: 'tool_call',
            agentRole,
            startTime: new Date(toolRecord.startedAt),
            status: 'pending',
            metadata: {
                toolId: toolRecord.id,
                toolName: toolRecord.name,
                parameters: toolRecord.parameters,
            },
        };

        trace.spans.push(span);
        trace.toolCallCount++;

        return spanId;
    }

    /**
     * Record tool call completion
     */
    completeToolCall(
        traceId: string,
        spanId: string,
        result: ToolCallRecord['result']
    ): void {
        const trace = this.activeTraces.get(traceId);
        if (!trace) return;

        const span = trace.spans.find(s => s.id === spanId);
        if (!span) return;

        span.endTime = new Date();
        span.durationMs = span.endTime.getTime() - span.startTime.getTime();
        span.status = result?.status === 'ok' ? 'ok' : result?.status === 'error' ? 'error' : 'blocked';
        span.metadata.result = result;
        span.error = result?.error;
    }

    /**
     * Record a guardrail execution
     */
    recordGuardrail(
        traceId: string,
        agentRole: AgentRole,
        guardrailName: string,
        result: GuardrailResult
    ): void {
        const trace = this.activeTraces.get(traceId);
        if (!trace) return;

        const stack = this.spanStack.get(traceId) || [];
        const parentSpan = stack[stack.length - 1];

        const span: TraceSpan = {
            id: `span_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            traceId,
            parentId: parentSpan?.id,
            name: `guardrail:${guardrailName}`,
            kind: 'guardrail',
            agentRole,
            startTime: new Date(),
            endTime: new Date(),
            durationMs: 0,
            status: result.passed ? 'ok' : 'blocked',
            metadata: {
                guardrailName,
                passed: result.passed,
                reason: result.reason,
                redactions: result.redactions,
            },
        };

        trace.spans.push(span);

        if (!result.passed) {
            trace.guardrailTripCount++;
        }
    }

    /**
     * Complete a trace
     */
    endTrace(traceId: string, status: 'completed' | 'error' = 'completed'): Trace | null {
        const trace = this.activeTraces.get(traceId);
        if (!trace) return null;

        trace.endTime = new Date();
        trace.totalDurationMs = trace.endTime.getTime() - trace.startTime.getTime();
        trace.status = status;

        // Persist to database
        this.persistTrace(trace).catch(err => {
            console.error('[HandoffTracer] Failed to persist trace:', err);
        });

        // Clean up
        this.activeTraces.delete(traceId);
        this.spanStack.delete(traceId);

        return trace;
    }

    /**
     * Get an active trace
     */
    getTrace(traceId: string): Trace | undefined {
        return this.activeTraces.get(traceId);
    }

    /**
     * Persist trace to database
     */
    private async persistTrace(trace: Trace): Promise<void> {
        await db.query(`
            INSERT INTO agent_traces (
                id,
                session_id,
                user_id,
                root_agent,
                start_time,
                end_time,
                total_duration_ms,
                handoff_chain,
                tool_call_count,
                guardrail_trip_count,
                status,
                spans_json
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
            trace.id,
            trace.sessionId,
            trace.userId,
            trace.rootAgent,
            trace.startTime.toISOString(),
            trace.endTime?.toISOString(),
            trace.totalDurationMs,
            JSON.stringify(trace.handoffChain),
            trace.toolCallCount,
            trace.guardrailTripCount,
            trace.status,
            JSON.stringify(trace.spans),
        ]);
    }

    /**
     * Query traces for a session
     */
    async getTracesForSession(sessionId: string, limit = 50): Promise<Trace[]> {
        const result = await db.query(`
            SELECT *
            FROM agent_traces
            WHERE session_id = $1
            ORDER BY start_time DESC
            LIMIT $2
        `, [sessionId, limit]);

        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            userId: row.user_id,
            rootAgent: row.root_agent,
            startTime: new Date(row.start_time),
            endTime: row.end_time ? new Date(row.end_time) : undefined,
            totalDurationMs: row.total_duration_ms,
            spans: JSON.parse(row.spans_json || '[]'),
            handoffChain: JSON.parse(row.handoff_chain || '[]'),
            toolCallCount: row.tool_call_count,
            guardrailTripCount: row.guardrail_trip_count,
            status: row.status,
        }));
    }

    /**
     * Get trace statistics
     */
    async getStats(since?: Date): Promise<{
        totalTraces: number;
        avgDurationMs: number;
        avgHandoffs: number;
        avgToolCalls: number;
        guardrailTripRate: number;
        errorRate: number;
    }> {
        const sinceClause = since ? `WHERE start_time >= $1` : '';
        const params = since ? [since.toISOString()] : [];

        const result = await db.query(`
            SELECT
                COUNT(*) as total_traces,
                AVG(total_duration_ms) as avg_duration,
                AVG(jsonb_array_length(handoff_chain::jsonb)) as avg_handoffs,
                AVG(tool_call_count) as avg_tool_calls,
                SUM(guardrail_trip_count)::float / NULLIF(SUM(tool_call_count), 0) as guardrail_trip_rate,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)::float / COUNT(*) as error_rate
            FROM agent_traces
            ${sinceClause}
        `, params);

        const row = result.rows[0];
        return {
            totalTraces: parseInt(row.total_traces) || 0,
            avgDurationMs: parseFloat(row.avg_duration) || 0,
            avgHandoffs: parseFloat(row.avg_handoffs) || 1,
            avgToolCalls: parseFloat(row.avg_tool_calls) || 0,
            guardrailTripRate: parseFloat(row.guardrail_trip_rate) || 0,
            errorRate: parseFloat(row.error_rate) || 0,
        };
    }
}

// Export singleton
export const handoffTracer = new HandoffTracer();
