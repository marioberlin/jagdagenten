/**
 * Smart Enhancement Service
 * 
 * AI-powered content enhancement using Gemini 3.5 Flash.
 */

import { SmartEnhancementOptions, SmartResult } from '../../../../src/components/smartglass/types';

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_3_5_FLASH = 'gemini-3.5-flash';

interface EnhancementConfig {
    model: string;
    temperature: number;
    maxOutputTokens: number;
    topK: number;
    topP: number;
}

const config: EnhancementConfig = {
    model: GEMINI_3_5_FLASH,
    temperature: 0.2,
    maxOutputTokens: 4096,
    topK: 40,
    topP: 0.95,
};

// ============================================================================
// Prompt Templates
// ============================================================================

const PROMPTS = {
    card: `You are a smart content enhancer. Analyze the following card content and provide enhancements.

CONTENT:
{content}

Provide a JSON response with:
1. summary: A concise 1-2 sentence summary of the content
2. suggestions: Up to 3 suggested actions the user might want to take (with labels and confidence scores)
3. patterns: Any patterns detected in the content

Return ONLY valid JSON, no markdown formatting.`,

    table: `You are a data analyst AI. Analyze the following table data and provide insights.

COLUMNS: {columns}
ROWS: {rows}

Provide a JSON response with:
1. patterns: Up to 5 patterns detected (e.g., trends, correlations, clusters)
2. anomalies: Any anomalous data points (with severity: low/medium/high/critical)
3. summary: Brief analysis of the data

Return ONLY valid JSON, no markdown formatting.`,

    chart: `You are a data visualization expert. Analyze the following chart data and provide insights.

TITLE: {title}
DATA: {data}
TYPE: {type}

Provide a JSON response with:
1. insights: Up to 5 key insights (type: trend/correlation/outlier/change-point/forecast)
2. patterns: Any patterns detected
3. summary: Brief analysis

Return ONLY valid JSON, no markdown formatting.`,

    text: `You are a content enhancer. Analyze and improve the following text.

TEXT: {content}

Provide a JSON response with:
1. summary: Concise summary
2. suggestions: Suggested improvements or actions
3. keywords: Key topics extracted

Return ONLY valid JSON, no markdown formatting.`,
};

// ============================================================================
// API Helper
// ============================================================================

async function callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt,
                }],
            }],
            generationConfig: {
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
                topK: config.topK,
                topP: config.topP,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_NONE',
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_NONE',
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_NONE',
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE',
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('No content in response');
}

// ============================================================================
// Content Processing
// ============================================================================

function parseAIResponse<T>(response: string): T {
    // Clean up response (remove markdown code blocks if present)
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.slice(7, -4);
    } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.slice(3, -3);
    }

    // Handle escaped JSON within text
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        cleanResponse = jsonMatch[0];
    }

    try {
        return JSON.parse(cleanResponse) as T;
    } catch {
        // Try to fix common JSON issues
        const fixed = cleanResponse
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
        return JSON.parse(fixed) as T;
    }
}

// ============================================================================
// Enhancement Functions
// ============================================================================

export async function enhanceCard(
    content: { title: string; body: string; tags?: string[]; footer?: string },
    options: SmartEnhancementOptions
): Promise<SmartResult<typeof content>> {
    const startTime = Date.now();

    const prompt = PROMPTS.card
        .replace('{content}', JSON.stringify(content, null, 2));

    const response = await callGeminiAPI(prompt);
    const enhancements = parseAIResponse<{
        summary: string;
        suggestions: Array<{ label: string; confidence: number }>;
        patterns: Array<{ name: string; confidence: number; description: string }>;
    }>(response);

    return {
        enhanced: content,
        summary: enhancements.summary,
        suggestions: enhancements.suggestions.map(s => ({
            ...s,
            action: () => console.log(`Suggested: ${s.label}`),
        })),
        patterns: enhancements.patterns,
        meta: {
            enhancedAt: new Date(),
            modelUsed: config.model,
            tokensUsed: response.length, // Approximation
            processingTime: Date.now() - startTime,
        },
    };
}

export async function enhanceTable(
    content: { columns: Array<{ key: string; header: string }>; rows: Array<Record<string, unknown>> },
    options: SmartEnhancementOptions
): Promise<SmartResult<typeof content>> {
    const startTime = Date.now();

    const prompt = PROMPTS.table
        .replace('{columns}', JSON.stringify(content.columns))
        .replace('{rows}', JSON.stringify(content.rows.slice(0, 100))); // Limit rows

    const response = await callGeminiAPI(prompt);
    const enhancements = parseAIResponse<{
        patterns: Array<{ name: string; confidence: number; description: string }>;
        anomalies: Array<{ index: number; severity: string; description: string }>;
        summary: string;
    }>(response);

    return {
        enhanced: content,
        summary: enhancements.summary,
        patterns: enhancements.patterns,
        anomalies: enhancements.anomalies.map(a => ({
            ...a,
            index: String(a.index),
        })),
        meta: {
            enhancedAt: new Date(),
            modelUsed: config.model,
            tokensUsed: response.length,
            processingTime: Date.now() - startTime,
        },
    };
}

export async function enhanceChart(
    content: { title: string; data: Array<{ x: number | string | Date; y: number }>; type: string },
    options: SmartEnhancementOptions
): Promise<SmartResult<typeof content>> {
    const startTime = Date.now();

    const prompt = PROMPTS.chart
        .replace('{title}', content.title)
        .replace('{data}', JSON.stringify(content.data))
        .replace('{type}', content.type);

    const response = await callGeminiAPI(prompt);
    const enhancements = parseAIResponse<{
        insights: Array<{ type: string; description: string; confidence: number; recommendation?: string }>;
        patterns: Array<{ name: string; confidence: number; description: string }>;
        summary: string;
    }>(response);

    return {
        enhanced: content,
        summary: enhancements.summary,
        insights: enhancements.insights,
        patterns: enhancements.patterns,
        meta: {
            enhancedAt: new Date(),
            modelUsed: config.model,
            tokensUsed: response.length,
            processingTime: Date.now() - startTime,
        },
    };
}

export async function enhanceText(
    content: string,
    options: SmartEnhancementOptions
): Promise<SmartResult<string>> {
    const startTime = Date.now();

    const prompt = PROMPTS.text
        .replace('{content}', content);

    const response = await callGeminiAPI(prompt);
    const enhancements = parseAIResponse<{
        summary: string;
        suggestions: Array<{ label: string; confidence: number }>;
        keywords: string[];
    }>(response);

    return {
        enhanced: content,
        summary: enhancements.summary,
        suggestions: enhancements.suggestions.map(s => ({
            ...s,
            action: () => console.log(`Suggested: ${s.label}`),
        })),
        meta: {
            enhancedAt: new Date(),
            modelUsed: config.model,
            tokensUsed: response.length,
            processingTime: Date.now() - startTime,
        },
    };
}

// ============================================================================
// Router
// ============================================================================

export function createSmartRouter() {
    return {
        async enhance(contentType: string, content: unknown, options: SmartEnhancementOptions) {
            switch (contentType) {
                case 'card':
                    return enhanceCard(content as Parameters<typeof enhanceCard>[0], options);
                case 'table':
                    return enhanceTable(content as Parameters<typeof enhanceTable>[0], options);
                case 'chart':
                    return enhanceChart(content as Parameters<typeof enhanceChart>[0], options);
                case 'text':
                    return enhanceText(content as string, options);
                default:
                    throw new Error(`Unknown content type: ${contentType}`);
            }
        },
    };
}
