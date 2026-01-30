export type ToolStatus = 'ok' | 'error' | 'needs_user_confirm' | 'pending';

export interface ToolAudit {
  toolName: string;
  tier: 0 | 1 | 2 | 3;
  invokedAt: string;
  durationMs?: number;
  userId?: string;
  sessionId?: string;
}

export interface ToolEnvelope<T = unknown> {
  status: ToolStatus;
  result?: T;
  error?: string;
  audit: ToolAudit;
  confirmToken?: string;
  preview?: Record<string, unknown>;
}
