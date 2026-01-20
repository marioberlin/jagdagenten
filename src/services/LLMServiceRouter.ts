/**
 * LLMServiceRouter.ts
 * 
 * Capability-based routing for LLM services.
 * Routes requests to appropriate providers based on capability.
 * 
 * NOTE: Direct API key services have been removed for security.
 * All LLM interactions now go through proxy services.
 */

import { LiquidClient } from '../liquid-engine/client';
import { GeminiProxyService } from './proxy/gemini';
import { ClaudeProxyService } from './proxy/claude';
import { ILiquidLLMService, FileSearchConfig, ChatOptions } from './types';
import type { LLMProvider } from '../context/AgentConfigContext';

export interface RouterConfig {
    provider: LLMProvider;
    client: LiquidClient;
    proxyUrl?: string;
}

export class LLMServiceRouter implements ILiquidLLMService {
    private primaryService: ILiquidLLMService;
    private geminiService: GeminiProxyService;
    private currentProvider: LLMProvider;

    constructor(config: RouterConfig) {
        // Always create Gemini proxy for image generation and file search
        this.geminiService = new GeminiProxyService(config.client, config.proxyUrl);
        this.currentProvider = config.provider;

        // Create primary service based on user selection
        switch (config.provider) {
            case 'claude':
                this.primaryService = new ClaudeProxyService(config.client, config.proxyUrl);
                break;

            case 'proxy':
            case 'gemini':
            default:
                // Use Gemini proxy as primary
                this.primaryService = this.geminiService;
                break;
        }
    }

    // =========================================================================
    // ROUTED TO PRIMARY
    // =========================================================================

    setModel(modelName: string): void {
        this.primaryService.setModel(modelName);
    }

    sendMessage(prompt: string): Promise<string> {
        return this.primaryService.sendMessage(prompt);
    }

    chat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string> {
        return this.primaryService.chat(prompt, systemPrompt, options);
    }

    // =========================================================================
    // ROUTED TO GEMINI (always)
    // =========================================================================

    setFileSearchConfig(config: FileSearchConfig): void {
        // File search is Gemini-specific, always route there
        this.geminiService.setFileSearchConfig(config);
    }

    generateImage(
        prompt: string,
        options: {
            referenceImages?: string[];
            aspectRatio?: string;
            imageSize?: string;
        } = {}
    ): Promise<string[]> {
        // Image generation is Gemini-specific, always route there
        console.log(`[LLMServiceRouter] Routing image generation to Gemini (primary: ${this.currentProvider})`);
        return this.geminiService.generateImage(prompt, options);
    }

    // =========================================================================
    // UTILITY
    // =========================================================================

    /**
     * Get the current primary provider
     */
    getProvider(): LLMProvider {
        return this.currentProvider;
    }

    /**
     * Check if image generation is available
     */
    hasImageGeneration(): boolean {
        return true; // Always available via Gemini
    }

    /**
     * Get the underlying Gemini proxy service for advanced operations
     * (file search store management, schema conversion, etc.)
     */
    getGeminiService(): GeminiProxyService {
        return this.geminiService;
    }
}
