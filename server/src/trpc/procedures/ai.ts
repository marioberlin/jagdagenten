/**
 * AI Procedures
 * 
 * Type-safe API for AI chat operations.
 */

import { z } from 'zod';
import { router, publicProcedure, ChatInputSchema } from '../index.js';
import { callAI, callParallelAI } from '../ai/index.js';

export const aiRouter = router({
    /**
     * Single provider chat
     * 
     * @example
     * const response = await trpc.ai.chat.mutate({
     *   provider: 'gemini',
     *   messages: [{ role: 'user', content: 'Hello' }]
     * });
     */
    chat: publicProcedure
        .input(ChatInputSchema)
        .mutation(async ({ input, ctx }) => {
            const { provider, messages, stream: _stream } = input;

            // Convert to format expected by callAI
            const formattedMessages = messages.map(m => ({
                role: m.role as 'user' | 'model',
                parts: [{ text: m.content }],
            }));

            const response = await callAI(provider, formattedMessages);

            return {
                provider,
                response,
                requestId: ctx.requestId,
            };
        }),

    /**
     * Parallel provider chat - calls both Gemini and Claude
     * 
     * @example
     * const responses = await trpc.ai.parallel.mutate({
     *   messages: [{ role: 'user', content: 'Hello' }]
     * });
     */
    parallel: publicProcedure
        .input(z.object({
            messages: z.array(z.object({
                role: z.enum(['user', 'assistant', 'system']),
                content: z.string(),
            })),
        }))
        .mutation(async ({ input, ctx }) => {
            const formattedMessages = input.messages.map(m => ({
                role: m.role as 'user' | 'model',
                parts: [{ text: m.content }],
            }));

            const responses = await callParallelAI(formattedMessages);

            return {
                gemini: responses.gemini,
                claude: responses.claude,
                requestId: ctx.requestId,
            };
        }),

    /**
     * Get AI provider status
     * 
     * @example
     * const status = await trpc.ai.status.query();
     */
    status: publicProcedure
        .query(async () => {
            return {
                providers: {
                    gemini: {
                        available: !!process.env.GEMINI_API_KEY,
                        model: 'gemini-2.5-flash',
                    },
                    claude: {
                        available: !!process.env.ANTHROPIC_API_KEY,
                        model: 'claude-sonnet-4-20250514',
                    },
                },
                timestamp: new Date().toISOString(),
            };
        }),
});

export type AIRouter = typeof aiRouter;
