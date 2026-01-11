/**
 * Decontextualizer.ts
 * 
 * Resolves pronouns and references in user queries by examining conversation history.
 * Example: "Which of those are vegan?" -> "Which vegetarian pasta recipes are vegan?"
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}

export interface DecontextualizeResult {
    originalQuery: string;
    resolvedQuery: string;
    wasResolved: boolean;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

export const DECONTEXTUALIZER_SYSTEM_PROMPT = `You are a query resolution engine. Your only task is to rewrite user queries by replacing pronouns and references with their concrete referents from conversation history.

Rules:
1. If the query contains pronouns like "it", "them", "those", "these", "the first one", "that one", etc., replace them with the specific entities from the conversation.
2. If the query is already self-contained (no pronouns or references), return it unchanged.
3. Return ONLY the rewritten query, no explanations.
4. Preserve the user's original intent and language.

Examples:
- History: "Find me pasta recipes" -> "Here are 5 pasta recipes..."
- Query: "Which of those are vegetarian?"
- Output: "Which pasta recipes are vegetarian?"

- History: "Show me budget hotels in Paris" -> "Here are 3 hotels..."
- Query: "How much is the first one?"
- Output: "How much is the first budget hotel in Paris?"

- Query: "What's the weather like today?"
- Output: "What's the weather like today?" (no change needed)`;

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Build the context string from conversation history for the decontextualizer.
 * Only includes the last N turns to keep context focused.
 */
export function buildHistoryContext(history: ConversationTurn[], maxTurns: number = 6): string {
    const recentHistory = history.slice(-maxTurns);

    if (recentHistory.length === 0) {
        return 'No conversation history.';
    }

    return recentHistory
        .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
        .join('\n');
}

/**
 * Build the user prompt for the decontextualizer.
 */
export function buildDecontextualizerPrompt(query: string, history: ConversationTurn[]): string {
    const historyContext = buildHistoryContext(history);

    return `CONVERSATION HISTORY:
${historyContext}

CURRENT QUERY:
${query}

REWRITTEN QUERY:`;
}

/**
 * Check if a query likely needs decontextualization.
 * This is a quick heuristic check to avoid unnecessary LLM calls.
 */
export function needsDecontextualization(query: string): boolean {
    const pronounPatterns = [
        /\b(it|they|them|those|these|that|this)\b/i,
        /\b(the first|the second|the third|the last|the one)\b/i,
        /\b(which of|any of|one of|some of)\b/i,
        /\b(more about|tell me more|expand on)\b/i,
    ];

    return pronounPatterns.some(pattern => pattern.test(query));
}
