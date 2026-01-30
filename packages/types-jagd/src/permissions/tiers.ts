export type PermissionTier = 0 | 1 | 2 | 3;

export interface ToolPolicy {
  toolName: string;
  tier: PermissionTier;
  description: string;
  requiresConfirmation: boolean;
  auditRequired: boolean;
}

export const TOOL_POLICIES: ToolPolicy[] = [
  { toolName: 'scout.get_conditions_snapshot', tier: 0, description: 'Fetch conditions', requiresConfirmation: false, auditRequired: false },
  { toolName: 'scout.recommend_plan', tier: 0, description: 'Get hunt plan recommendation', requiresConfirmation: false, auditRequired: false },
  { toolName: 'timeline.start_session', tier: 1, description: 'Start hunt session', requiresConfirmation: false, auditRequired: false },
  { toolName: 'timeline.log_event', tier: 1, description: 'Log timeline event', requiresConfirmation: false, auditRequired: false },
  { toolName: 'timeline.end_session', tier: 1, description: 'End hunt session', requiresConfirmation: false, auditRequired: false },
  { toolName: 'bureaucracy.generate_export_pack', tier: 1, description: 'Generate export pack', requiresConfirmation: false, auditRequired: false },
  { toolName: 'bureaucracy.create_guest_permit_pdf', tier: 1, description: 'Create guest permit', requiresConfirmation: false, auditRequired: false },
  { toolName: 'gear.generate_checklist', tier: 1, description: 'Generate pre-hunt checklist', requiresConfirmation: false, auditRequired: false },
  { toolName: 'feed.publish_post', tier: 2, description: 'Publish to feed', requiresConfirmation: true, auditRequired: true },
  { toolName: 'pack.create_event', tier: 2, description: 'Create pack event', requiresConfirmation: true, auditRequired: true },
  { toolName: 'pack.enable_live_location', tier: 3, description: 'Enable event-only live location', requiresConfirmation: true, auditRequired: true },
  { toolName: 'moderation.check_post', tier: 0, description: 'Check post for moderation', requiresConfirmation: false, auditRequired: true },
];
