export type ChatActionType = 'plan' | 'do' | 'explain' | 'save' | 'share';

export interface ChatAction {
  type: ChatActionType;
  label: string;
  payload?: Record<string, unknown>;
  confirmRequired?: boolean;
}

export interface ChatUiPayload {
  primaryAction?: ChatAction;
  secondaryActions?: ChatAction[];
  explanation?: string[];
  toolCalls?: ToolCallFeedback[];
}

export interface ToolCallFeedback {
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: unknown;
  error?: string;
  durationMs?: number;
}
