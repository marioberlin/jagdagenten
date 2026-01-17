/**
 * AI Module - Claude API Client
 */

import type { AIMessage } from './types.js';

/**
 * Call Claude API directly (without caching)
 */
export async function callClaudeAPI(messages: AIMessage[]): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const result = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages
        })
    });

    const data = await result.json() as { content?: Array<{ text: string }> };
    return data.content?.[0]?.text || 'No response';
}
