/**
 * AI Module - Gemini API Client
 */

import type { AIMessage } from './types.js';

/**
 * Call Gemini API directly (without caching)
 */
export async function callGeminiAPI(messages: AIMessage[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const lastMessage = messages[messages.length - 1]?.content || '';

    const result = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: lastMessage }] }]
            })
        }
    );

    const data = await result.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}
