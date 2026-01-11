/**
 * Liquid Wire Protocol
 * 
 * A transport-agnostic standard for synchronizing state between AI Agents
 * and Generative UI components.
 */

export interface LiquidEvent {
    type: string;
    id: string; // Unique correlation ID for the tool call
}

export interface ToolStartEvent extends LiquidEvent {
    type: 'tool_start';
    name: string; // Name of the tool (e.g., 'get_weather')
}

export interface ToolDeltaEvent extends LiquidEvent {
    type: 'tool_delta';
    delta: string; // Partial JSON string of arguments
}

export interface ToolCompleteEvent extends LiquidEvent {
    type: 'tool_complete';
    result?: unknown; // The final result of the tool execution (optional)
}

export interface AgentMessageEvent extends LiquidEvent {
    type: 'agent_message';
    role: 'assistant' | 'user' | 'system';
    content: string;
}

export type LiquidProtocolEvent =
    | ToolStartEvent
    | ToolDeltaEvent
    | ToolCompleteEvent
    | AgentMessageEvent;

export interface ToolCallState {
    id: string;
    name: string;
    status: 'running' | 'completed' | 'error';
    argsBuffer: string; // specific buffer for reconstruction
    args: unknown; // The current best-effort parsed JSON object
    result?: unknown;
}
