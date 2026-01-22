/**
 * AI Module - Gemini API Client
 */

import type { AIMessage } from './types.js';

/**
 * Call Gemini API directly (without caching)
 * Supports system instructions for context-aware responses.
 */
export async function callGeminiAPI(messages: AIMessage[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    // Extract system message for system instruction (if present)
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    // Build request body with optional system instruction
    const requestBody: any = {
        contents: [{
            role: 'user',
            parts: [{ text: lastUserMessage }]
        }]
    };

    // Add system instruction if present (Gemini's way of handling system prompts)
    if (systemMessage?.content) {
        requestBody.systemInstruction = {
            parts: [{ text: systemMessage.content }]
        };
    }

    const result = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        }
    );

    const data = await result.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}
