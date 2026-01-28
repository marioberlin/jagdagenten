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

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const result = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        }
    );

    if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`Gemini API error (${result.status}): ${errorText}`);
    }

    const data = await result.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>;
        error?: { message: string; code: number };
    };

    if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('Gemini API returned no content');
    }
    return text;
}
