/**
 * AI Module - Main Entry Point
 * 
 * Provides unified AI calling with caching and request coalescing.
 */

import { cache } from '../cache.js';
import { componentLoggers, createRequestLogger, logAIRequest } from '../logger.js';
import { callClaudeAPI } from './claude.js';
import { callGeminiAPI } from './gemini.js';
import type { AIMessage, AIProvider, ParallelAIResponse } from './types.js';

// Re-export types
export * from './types.js';
export { callClaudeAPI } from './claude.js';
export { callGeminiAPI } from './gemini.js';

/**
 * Hash a prompt string for cache key generation
 * Uses Bun's fast hash function
 */
function hashPrompt(prompt: string): string {
    return Bun.hash(prompt).toString(16);
}

/**
 * Call AI with request coalescing and stampede protection
 *
 * Uses cache.getOrSet to ensure only one request is made per unique prompt,
 * even if multiple concurrent requests come in for the same prompt.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 2.1 Request Coalescing
 */
export async function callAI(
    provider: AIProvider,
    messages: AIMessage[],
    requestLogger?: ReturnType<typeof createRequestLogger>
): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const cacheKey = `ai:${provider}:${hashPrompt(lastMessage)}`;
    const aiLog = requestLogger || componentLoggers.ai;
    const startTime = Date.now();

    aiLog.debug({ provider, cacheKey: cacheKey.substring(0, 30) }, 'AI request initiated');

    return cache.getOrSet(cacheKey, 'ai', async () => {
        aiLog.debug({ provider }, 'Cache miss - calling API');

        try {
            const result = provider === 'claude'
                ? await callClaudeAPI(messages)
                : await callGeminiAPI(messages);

            logAIRequest(aiLog, provider, {
                duration: Date.now() - startTime,
                cached: false,
                promptLength: lastMessage.length,
                responseLength: result.length
            });

            return result;
        } catch (error) {
            logAIRequest(aiLog, provider, {
                duration: Date.now() - startTime,
                cached: false,
                promptLength: lastMessage.length,
                error: error as Error
            });
            throw error;
        }
    });
}

/**
 * Call both Gemini and Claude in parallel
 */
export async function callParallelAI(messages: AIMessage[]): Promise<ParallelAIResponse> {
    const [gemini, claude] = await Promise.allSettled([
        callAI('gemini', messages),
        callAI('claude', messages)
    ]);
    return {
        gemini: gemini.status === 'fulfilled' ? gemini.value : 'Error',
        claude: claude.status === 'fulfilled' ? claude.value : 'Error'
    };
}
