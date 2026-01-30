/**
 * Jagd-Agenten AI Agent System — Core Types
 *
 * Type definitions for the multi-agent system based on OpenAI-compatible
 * function calling with Gemini. Implements the Router + Specialist pattern
 * from Appendix A of the Jagd-Agenten spec.
 */

import type { GeoScope } from '@jagdagenten/types-jagd';

// ============================================================================
// Agent Roles
// ============================================================================

export type AgentRole =
    | 'router'
    | 'scout'
    | 'bureaucracy'
    | 'quartermaster'
    | 'journal'
    | 'pack'
    | 'feed'
    | 'news'
    | 'moderation'
    | 'privacy';

export const AGENT_DISPLAY_NAMES: Record<AgentRole, string> = {
    router: 'Router',
    scout: 'Scout',
    bureaucracy: 'Behörde',
    quartermaster: 'Quartiermeister',
    journal: 'Journal',
    pack: 'Rudel',
    feed: 'Waidmann-Feed',
    news: 'Nachrichten',
    moderation: 'Moderation',
    privacy: 'Datenschutz',
};

// ============================================================================
// Agent Context
// ============================================================================

export interface AgentUser {
    id: string;
    displayName?: string;
    permissions: string[];
    revierIds: string[];
    isGlobalAdmin: boolean;
}

export interface AgentSession {
    id: string;
    conversationHistory: ConversationMessage[];
    activeSessionId?: string; // Current hunt session if any
    lastToolCalls: ToolCallRecord[];
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    agentRole?: AgentRole;
    toolCalls?: ToolCallRecord[];
}

export interface AgentContext {
    user: AgentUser;
    session: AgentSession;
    geo?: GeoScope;
    locale: 'de' | 'en';
    timestamp: string;
}

// ============================================================================
// Tool Calling
// ============================================================================

export interface ToolCallRecord {
    id: string;
    name: string;
    parameters: Record<string, unknown>;
    result?: ToolEnvelope;
    startedAt: string;
    completedAt?: string;
}

export type ToolStatus = 'ok' | 'error' | 'needs_user_confirm' | 'blocked' | 'pending';

export interface ToolAudit {
    toolName: string;
    tier: 0 | 1 | 2 | 3;
    invokedAt: string;
    durationMs?: number;
    userId?: string;
    sessionId?: string;
    guardrailsApplied?: string[];
    redactions?: string[];
}

export interface ToolEnvelope<T = unknown> {
    status: ToolStatus;
    result?: T;
    error?: string;
    audit: ToolAudit;
    confirmToken?: string;
    preview?: Record<string, unknown>;
}

// ============================================================================
// Agent Response (for Chat UI)
// ============================================================================

export type ActionChip = 'Plan' | 'Do' | 'Explain' | 'Save' | 'Share';

export interface AgentAction {
    label: string;
    tool: string;
    params?: Record<string, unknown>;
}

export interface AgentUIPayload {
    chips?: ActionChip[];
    primaryAction?: AgentAction;
    secondaryActions?: AgentAction[];
    explain?: string[];
}

export interface ConfirmationRequest {
    tier: 2 | 3;
    action: string;
    summary: string;
    preview: {
        scope: 'private' | 'team' | 'public';
        geoMode: GeoScope['mode'];
        timeDelay?: number;
        participants?: string[];
    };
    confirmToken: string;
}

export interface AgentResponse {
    text: string;
    agentRole: AgentRole;
    toolCalls?: ToolCallRecord[];
    ui?: AgentUIPayload;
    confirmationRequired?: ConfirmationRequest;
}

// ============================================================================
// Handoff Types
// ============================================================================

export interface HandoffRequest {
    targetAgent: AgentRole;
    reason: string;
    context: Partial<AgentContext>;
    message: string;
}

export interface HandoffResult {
    fromAgent: AgentRole;
    toAgent: AgentRole;
    response: AgentResponse;
    handoffChain: AgentRole[];
}

// ============================================================================
// Guardrail Types
// ============================================================================

export interface GuardrailResult {
    passed: boolean;
    reason?: string;
    redactions?: string[];
    transformedParams?: Record<string, unknown>;
}

export interface GuardrailConfig {
    name: string;
    applies: (toolName: string) => boolean;
    preValidate?: (params: Record<string, unknown>, context: AgentContext) => GuardrailResult;
    postValidate?: (result: unknown, context: AgentContext) => GuardrailResult;
}
