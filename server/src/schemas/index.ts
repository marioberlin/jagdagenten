/**
 * Barrel export for all Jagd-Agenten function-calling schemas.
 *
 * Each schema is a Gemini-compatible function declaration (JSON Schema format)
 * ready for use with AI model function-calling APIs.
 */

// Timeline
export { startSessionSchema, logEventSchema, endSessionSchema } from './timeline.schema.js';

// Scout
export { getConditionsSnapshotSchema, recommendPlanSchema } from './scout.schema.js';

// Bureaucracy
export { generateExportPackSchema, createGuestPermitPdfSchema } from './bureaucracy.schema.js';

// Gear
export { generateChecklistSchema } from './gear.schema.js';

// Pack
export { createEventSchema, assignRoleSchema } from './pack.schema.js';

// Feed
export { publishPostSchema } from './feed.schema.js';

// Moderation
export { checkPostSchema } from './moderation.schema.js';

// Re-import for the combined array
import { startSessionSchema, logEventSchema, endSessionSchema } from './timeline.schema.js';
import { getConditionsSnapshotSchema, recommendPlanSchema } from './scout.schema.js';
import { generateExportPackSchema, createGuestPermitPdfSchema } from './bureaucracy.schema.js';
import { generateChecklistSchema } from './gear.schema.js';
import { createEventSchema, assignRoleSchema } from './pack.schema.js';
import { publishPostSchema } from './feed.schema.js';
import { checkPostSchema } from './moderation.schema.js';

/**
 * All tool schemas in a single array, ready to pass to a Gemini-compatible
 * function-calling API as the `tools[].functionDeclarations` list.
 */
export const TOOL_SCHEMAS = [
  // Timeline
  startSessionSchema,
  logEventSchema,
  endSessionSchema,

  // Scout
  getConditionsSnapshotSchema,
  recommendPlanSchema,

  // Bureaucracy
  generateExportPackSchema,
  createGuestPermitPdfSchema,

  // Gear
  generateChecklistSchema,

  // Pack
  createEventSchema,
  assignRoleSchema,

  // Feed
  publishPostSchema,

  // Moderation
  checkPostSchema,
] as const;
