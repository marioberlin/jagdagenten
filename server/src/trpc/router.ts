/**
 * Root Router
 * 
 * Combines all procedure routers into the main app router.
 * This type is exported and used by the client for type inference.
 */

import { router } from './index.js';
import { aiRouter } from './procedures/ai.js';
import { agentsRouter } from './procedures/agents.js';
import { healthRouter } from './procedures/health.js';

/**
 * Main application router
 * 
 * All procedures are namespaced:
 * - trpc.ai.*      - AI chat operations
 * - trpc.agents.*  - Agent registry
 * - trpc.health.*  - Health checks
 */
export const appRouter = router({
    ai: aiRouter,
    agents: agentsRouter,
    health: healthRouter,
});

/**
 * Export type for client-side type inference
 */
export type AppRouter = typeof appRouter;

/**
 * Export individual router types for modular usage
 */
export type { AIRouter } from './procedures/ai.js';
export type { AgentsRouter } from './procedures/agents.js';
export type { HealthRouter } from './procedures/health.js';
