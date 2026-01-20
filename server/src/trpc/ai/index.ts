/**
 * AI Service Module
 * 
 * Provides unified interface for calling AI providers.
 */

export interface Message {
    role: 'user' | 'model' | 'assistant' | 'system';
    parts: Array<{ text: string }>;
}

/**
 * Call a single AI provider
 */
export async function callAI(
    provider: 'gemini' | 'claude',
    messages: Message[]
): Promise<string> {
    // TODO: Implement actual AI calls
    console.log(`[AI] Calling ${provider} with ${messages.length} messages`);
    return `Mock response from ${provider}`;
}

/**
 * Call both providers in parallel
 */
export async function callParallelAI(
    messages: Message[]
): Promise<{ gemini: string; claude: string }> {
    const [gemini, claude] = await Promise.all([
        callAI('gemini', messages),
        callAI('claude', messages),
    ]);

    return { gemini, claude };
}
