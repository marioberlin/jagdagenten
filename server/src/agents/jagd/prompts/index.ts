/**
 * Jagd-Agenten System Prompts — Barrel Export
 */

export { ROUTER_SYSTEM_PROMPT } from './router.prompt.js';
export { SCOUT_SYSTEM_PROMPT } from './scout.prompt.js';
export { BUREAUCRACY_SYSTEM_PROMPT } from './bureaucracy.prompt.js';
export { QUARTERMASTER_SYSTEM_PROMPT } from './quartermaster.prompt.js';
export { JOURNAL_SYSTEM_PROMPT } from './journal.prompt.js';
export { PACK_SYSTEM_PROMPT } from './pack.prompt.js';
export { FEED_SYSTEM_PROMPT } from './feed.prompt.js';
export { NEWS_SYSTEM_PROMPT } from './news.prompt.js';
export { MODERATION_SYSTEM_PROMPT } from './moderation.prompt.js';

import type { AgentRole } from '../types.js';
import { ROUTER_SYSTEM_PROMPT } from './router.prompt.js';
import { SCOUT_SYSTEM_PROMPT } from './scout.prompt.js';
import { BUREAUCRACY_SYSTEM_PROMPT } from './bureaucracy.prompt.js';
import { QUARTERMASTER_SYSTEM_PROMPT } from './quartermaster.prompt.js';
import { JOURNAL_SYSTEM_PROMPT } from './journal.prompt.js';
import { PACK_SYSTEM_PROMPT } from './pack.prompt.js';
import { FEED_SYSTEM_PROMPT } from './feed.prompt.js';
import { NEWS_SYSTEM_PROMPT } from './news.prompt.js';
import { MODERATION_SYSTEM_PROMPT } from './moderation.prompt.js';

/**
 * Get system prompt for a specific agent role.
 */
export function getAgentPrompt(role: AgentRole): string {
    switch (role) {
        case 'router':
            return ROUTER_SYSTEM_PROMPT;
        case 'scout':
            return SCOUT_SYSTEM_PROMPT;
        case 'bureaucracy':
            return BUREAUCRACY_SYSTEM_PROMPT;
        case 'quartermaster':
            return QUARTERMASTER_SYSTEM_PROMPT;
        case 'journal':
            return JOURNAL_SYSTEM_PROMPT;
        case 'pack':
            return PACK_SYSTEM_PROMPT;
        case 'feed':
            return FEED_SYSTEM_PROMPT;
        case 'news':
            return NEWS_SYSTEM_PROMPT;
        case 'moderation':
        case 'privacy':
            return MODERATION_SYSTEM_PROMPT;
        default:
            return ROUTER_SYSTEM_PROMPT;
    }
}
