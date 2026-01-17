/**
 * AI Module - Types
 * 
 * Shared types for AI services
 */

export interface AIMessage {
    role: string;
    content: string;
}

export type AIProvider = 'gemini' | 'claude';

export interface AIRequestOptions {
    provider: AIProvider;
    messages: AIMessage[];
}

export interface AIResponse {
    response: string;
    provider: AIProvider;
    cached: boolean;
    duration?: number;
}

export interface ParallelAIResponse {
    gemini: string;
    claude: string;
}
