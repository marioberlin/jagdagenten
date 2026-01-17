/**
 * Agents Procedures
 * 
 * Type-safe API for agent registry and discovery.
 */

import { z } from 'zod';
import { router, publicProcedure } from '../index.js';
import { agentRegistry } from '../../registry/AgentRegistry.js';

export const agentsRouter = router({
    /**
     * List all registered agents
     * 
     * @example
     * const agents = await trpc.agents.list.query();
     */
    list: publicProcedure
        .input(z.object({
            category: z.string().optional(),
            limit: z.number().min(1).max(100).default(50),
        }).optional())
        .query(async ({ input }) => {
            try {
                const agents = agentRegistry.getAgents();

                let result = agents;

                // Filter by category if specified
                if (input?.category) {
                    result = agents.filter(a =>
                        a.card?.skills?.some(s => s.tags?.includes(input.category!))
                    );
                }

                // Apply limit
                const limit = input?.limit || 50;
                result = result.slice(0, limit);

                return {
                    agents: result.map(a => ({
                        id: a.id,
                        name: a.card?.name || a.id,
                        description: a.card?.description || '',
                        url: a.card?.url || '',
                        status: a.status,
                    })),
                    total: agents.length,
                    filtered: result.length,
                };
            } catch (error) {
                // Registry may not be initialized
                return {
                    agents: [],
                    total: 0,
                    filtered: 0,
                };
            }
        }),

    /**
     * Get agent by ID
     * 
     * @example
     * const agent = await trpc.agents.get.query({ id: 'crypto-advisor' });
     */
    get: publicProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ input }) => {
            try {
                const agent = agentRegistry.getAgent(input.id);

                if (!agent) {
                    return null;
                }

                return {
                    id: agent.id,
                    card: agent.card,
                    status: agent.status,
                    lastSeen: agent.lastSeen,
                };
            } catch {
                return null;
            }
        }),

    /**
     * Get agent card (A2A format)
     * 
     * @example
     * const card = await trpc.agents.card.query({ id: 'crypto-advisor' });
     */
    card: publicProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ input }) => {
            try {
                const agent = agentRegistry.getAgent(input.id);
                return agent?.card || null;
            } catch {
                return null;
            }
        }),

    /**
     * Check agent health
     * 
     * @example
     * const health = await trpc.agents.health.query({ id: 'crypto-advisor' });
     */
    health: publicProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ input }) => {
            try {
                const agent = agentRegistry.getAgent(input.id);

                if (!agent) {
                    return { status: 'not_found' as const };
                }

                return {
                    status: agent.status,
                    lastSeen: agent.lastSeen,
                    uptime: agent.lastSeen
                        ? Date.now() - new Date(agent.lastSeen).getTime()
                        : null,
                };
            } catch {
                return { status: 'error' as const };
            }
        }),
});

export type AgentsRouter = typeof agentsRouter;
