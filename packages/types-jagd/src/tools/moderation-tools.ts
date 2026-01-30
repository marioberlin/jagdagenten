export type ModerationAction = 'allow' | 'allow_with_redactions' | 'reject' | 'escalate_to_human';

export interface ModerationDecision {
  action: ModerationAction;
  reasonCodes: string[];
  redactions: string[];
  decidedAt: string;
}

export interface CheckPostArgs {
  contentType: 'feed_post' | 'story' | 'comment';
  contentId: string;
  text: string;
  photos?: string[];
  geoData?: Record<string, unknown>;
}
