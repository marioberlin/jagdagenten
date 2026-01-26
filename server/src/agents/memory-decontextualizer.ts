/**
 * Memory Decontextualizer
 * 
 * Server-side port of the NLWEB Decontextualizer for memory extraction.
 * Resolves pronouns and references to create self-contained memory statements.
 * 
 * Example transformations:
 * - "I really like how you did that" → "User likes the modular auth pattern in authStore.ts"
 * - "That's the approach I prefer" → "User prefers the TypeScript-first development approach"
 */

import { callGeminiAPI } from '../ai/gemini.js';
import type { AIMessage } from '../ai/types.js';

// ============================================================================
// Types
// ============================================================================

export interface ConversationTurn {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

export interface DecontextualizeResult {
    /** Original content before resolution */
    original: string;
    /** Resolved content with references replaced */
    resolved: string;
    /** Whether any resolution was performed */
    wasResolved: boolean;
    /** Entities that were resolved */
    resolvedEntities?: string[];
}

export interface DecontextualizerConfig {
    /** Maximum conversation turns to include as context (default: 6) */
    maxContextTurns?: number;
    /** Maximum content length to process (default: 500) */
    maxContentLength?: number;
}

// ============================================================================
// System Prompt (adapted from frontend NLWEB)
// ============================================================================

const MEMORY_DECONTEXTUALIZER_PROMPT = `You are a memory resolution engine. Your task is to rewrite statements by replacing pronouns, references, and contextual phrases with their concrete referents.

The goal is to create SELF-CONTAINED memory statements that will make sense without the original conversation context.

Rules:
1. Replace pronouns (it, they, that, this, those, these) with specific entities
2. Replace vague references ("the first one", "that approach", "what you said") with concrete details
3. Add context about WHAT is being discussed if not clear
4. Keep the statement concise but complete
5. Preserve the speaker's intent and sentiment
6. Return ONLY the rewritten statement, no explanations

Examples:
- Context: Discussion about authentication patterns
- Input: "I really like how you did that"
- Output: "User really likes the session-based authentication pattern with JWT refresh tokens"

- Context: Reviewing database schema design
- Input: "That's exactly what I was looking for"
- Output: "User approves the normalized PostgreSQL schema design with foreign key constraints"

- Context: No relevant context found
- Input: "This is a good approach"
- Output: "This is a good approach" (unchanged - no resolution possible)`;

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: Required<DecontextualizerConfig> = {
    maxContextTurns: 6,
    maxContentLength: 500,
};

// ============================================================================
// Memory Decontextualizer
// ============================================================================

export class MemoryDecontextualizer {
    private config: Required<DecontextualizerConfig>;

    constructor(config?: DecontextualizerConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Decontextualize a piece of content for memory storage
     */
    async decontextualize(
        content: string,
        conversationContext: ConversationTurn[]
    ): Promise<DecontextualizeResult> {
        // Skip if content is already self-contained
        if (!this.needsDecontextualization(content)) {
            return {
                original: content,
                resolved: content,
                wasResolved: false,
            };
        }

        // Skip if no context available
        if (conversationContext.length === 0) {
            return {
                original: content,
                resolved: content,
                wasResolved: false,
            };
        }

        try {
            const contextString = this.buildContextString(conversationContext);
            const prompt = this.buildPrompt(content, contextString);

            const messages: AIMessage[] = [
                { role: 'system', content: MEMORY_DECONTEXTUALIZER_PROMPT },
                { role: 'user', content: prompt }
            ];

            const response = await callGeminiAPI(messages);
            const resolved = response.trim();

            // Check if resolution actually changed anything meaningful
            const wasResolved = resolved !== content && resolved.length > 0 &&
                this.isValidResolution(content, resolved);

            return {
                original: content,
                resolved: wasResolved ? resolved : content,
                wasResolved,
            };
        } catch (error) {
            console.error('[MemoryDecontextualizer] Resolution failed:', error);
            return {
                original: content,
                resolved: content,
                wasResolved: false,
            };
        }
    }

    /**
     * Batch decontextualize multiple pieces of content
     */
    async decontextualizeBatch(
        contents: string[],
        conversationContext: ConversationTurn[]
    ): Promise<DecontextualizeResult[]> {
        // For now, process sequentially to maintain context accuracy
        // Could be parallelized if context is stable
        const results: DecontextualizeResult[] = [];

        for (const content of contents) {
            const result = await this.decontextualize(content, conversationContext);
            results.push(result);
        }

        return results;
    }

    /**
     * Check if content likely needs decontextualization (quick heuristic)
     * Ported from frontend Decontextualizer.ts
     */
    needsDecontextualization(content: string): boolean {
        const pronounPatterns = [
            /\b(it|they|them|those|these|that|this)\b/i,
            /\b(the first|the second|the third|the last|the one)\b/i,
            /\b(which of|any of|one of|some of)\b/i,
            /\b(more about|how you|what you|that approach)\b/i,
            /\b(did that|like that|said that|showed)\b/i,
        ];

        return pronounPatterns.some(pattern => pattern.test(content));
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    /**
     * Build context string from conversation history
     * Ported from frontend buildHistoryContext()
     */
    private buildContextString(history: ConversationTurn[]): string {
        const recentHistory = history.slice(-this.config.maxContextTurns);

        if (recentHistory.length === 0) {
            return 'No conversation history.';
        }

        return recentHistory
            .map((turn) => {
                const role = turn.role.toUpperCase();
                const content = turn.content.slice(0, 300); // Truncate long messages
                return `${role}: ${content}`;
            })
            .join('\n');
    }

    /**
     * Build the prompt for decontextualization
     */
    private buildPrompt(content: string, contextString: string): string {
        return `CONVERSATION CONTEXT:
${contextString}

CONTENT TO RESOLVE:
${content.slice(0, this.config.maxContentLength)}

RESOLVED STATEMENT:`;
    }

    /**
     * Validate that resolution is meaningful and not corrupted
     */
    private isValidResolution(original: string, resolved: string): boolean {
        // Reject if resolved is much shorter (likely truncated)
        if (resolved.length < original.length * 0.5) {
            return false;
        }

        // Reject if resolved is much longer (likely hallucinated)
        if (resolved.length > original.length * 3) {
            return false;
        }

        // Reject if resolved is just the instruction text
        if (resolved.toLowerCase().includes('resolve') ||
            resolved.toLowerCase().includes('context')) {
            return false;
        }

        return true;
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createMemoryDecontextualizer(config?: DecontextualizerConfig): MemoryDecontextualizer {
    return new MemoryDecontextualizer(config);
}

export default MemoryDecontextualizer;
